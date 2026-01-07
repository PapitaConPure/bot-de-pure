const { REST } = require('discord.js');
const { Routes } = require('discord-api-types/v9');

const mongoose = require('mongoose');
const PrefixPair = require('../models/prefixpair.js');
const UserConfigs = require('../models/userconfigs');
const BooruTags = require('../models/boorutags.js');
const MessageCascades = require('../models/messageCascades.js');
const { Puretable, pureTableAssets } = require('../models/puretable.js');
const { deleteExpiredMessageCascades, cacheMessageCascade } = require('./onMessageDelete');
const SakiDB = require('../models/hourai.js');

const { puré } = require('../core/commandInit.js');
const globalConfigs = require('../data/config.json');
const envPath = globalConfigs.remoteStartup ? '../remoteenv.json' : '../localenv.json';
const noDB = globalConfigs.noDataBase;

/**@type {String}*/
const mongoUri = process.env.MONGODB_URI ?? (require(envPath)?.dburi);

/**@type {String}*/
const discordToken = process.env.I_LOVE_MEGUMIN ?? (require(envPath)?.token);
/**@type {String}*/
const booruApiKey = process.env.BOORU_APIKEY ?? (require(envPath)?.booruapikey);
/**@type {String}*/
const booruUserId = process.env.BOORU_USERID ?? (require(envPath)?.booruuserid);

const { setupGuildFeedUpdateStack, feedTagSuscriptionsCache } = require('../systems/booru/boorufeed');
const { Booru, Tag } = require('../systems/booru/boorufetch');
const { modifyPresence } = require('../systems/presence/presence');
const { auditSystem } = require('../systems/others/auditor');

const { registerFont, loadImage } = require('canvas');
const { lookupService } = require('dns');
const { promisify } = require('util');
const chalk = require('chalk');

const { prepareTracksPlayer } = require('../systems/others/musicPlayer')
const { initializeWebhookMessageOwners } = require('../systems/agents/discordagent');
const { setupGuildRateKeeper, fetchAllGuildMembers } = require('../utils/guildratekeeper');
const { initRemindersScheduler, getRemindersScheduler } = require('../systems/others/remindersScheduler.js');

const logOptions = {
	slash: false,
	prefixes: false,
	booruTags: false,
	feedSuscriptions: false,
};

/**@param {import('discord.js').Client} client*/
async function onStartup(client) {
	const confirm = () => console.log(chalk.green('Hecho.'));
	globalConfigs.maintenance = '1';

	if(globalConfigs.remoteStartup)
		console.log(chalk.redBright.bold('Se inicializará para un entorno de producción'));
	else
		console.log(chalk.cyanBright.bold('Se inicializará para un entorno de desarrollo'));
	
	console.log(chalk.magenta('Obteniendo miembros de servidores de Discord...'));
	setupGuildRateKeeper({ client });
	await fetchAllGuildMembers();
	confirm();

	console.log(chalk.bold.magentaBright('Cargando comandos Slash y Contextuales...'));
	const restGlobal = new REST({ version: '9' }).setToken(discordToken);
	const commandData = {
		global: puré.slash.concat(/**@type {*}*/(puré.contextMenu)),
		saki: puré.slashSaki,
	};

	try {
		await restGlobal.put(
			Routes.applicationCommands(client.application.id),
			{ body: commandData.global },
		);
		
		const dedicatedServerId = globalConfigs.serverid.saki;
		if(client.guilds.cache.get(dedicatedServerId))
			await restGlobal.put(
				Routes.applicationGuildCommands(client.application.id, dedicatedServerId),
				{ body: commandData.saki },
			);

		logOptions.slash && console.log(`Comandos registrados + hourai (${dedicatedServerId} :: ${client.guilds.cache.get(dedicatedServerId)?.name}):`, restGlobal);
		confirm();
	} catch(error) {
		console.log(chalk.bold.redBright('Ocurrió un error al intentar cargar los comandos Slash y/o Contextuales'));
		console.error(error);
	}

	console.log(chalk.cyan('Semilla y horario calculados'));
	let currentTime = Date.now();
	globalConfigs.startupTime = currentTime;
	globalConfigs.lechitauses = currentTime;
	globalConfigs.seed = currentTime / 60000;

	console.log(chalk.magenta('Obteniendo información del host...'));
	try {
		const asyncLookupService = promisify(lookupService);
		const host = await asyncLookupService('127.0.0.1', 443);
		globalConfigs.bot_status.host = `${host.service}://${host.hostname}/`;
		confirm();
	} catch(err) {
		globalConfigs.bot_status.host = 'Desconocido';
		console.log(chalk.red('Fallido.'));
		console.error(err);
	}

	console.log(chalk.magenta('Indexando Slots de Puré...'));
	(await Promise.all([
		client.guilds.cache.get(globalConfigs.serverid.slot1),
		client.guilds.cache.get(globalConfigs.serverid.slot2),
		client.guilds.cache.get(globalConfigs.serverid.slot3),
	])).forEach((guild, i) => { globalConfigs.slots[`slot${i + 1}`] = guild; });
	globalConfigs.logch = await globalConfigs.slots.slot1.channels.resolve('870347940181471242');
	confirm();
	
	console.log((chalk.rgb(255, 0, 0))('Preparando Reproductor de YouTube...'));
	await prepareTracksPlayer(client);
	confirm();
	
	//Cargado de datos de base de datos
	if(noDB) {
		console.log(chalk.yellow.italic('Se saltará la inicialización de base de datos a petición del usuario'));
	} else {
		console.log(chalk.yellowBright.italic('Cargando datos de base de datos...'));
		console.log(chalk.gray('Conectando a Cluster en la nube...'));
		mongoose.set("strictQuery", false);
		mongoose.connect(mongoUri, {
			//@ts-expect-error
			useUnifiedTopology: true,
			useNewUrlParser: true,
		});

		console.log(chalk.gray('Obteniendo documentos...'));
		const [ prefixPairs, userConfigs, booruTags, messageCascades ] = await Promise.all([
			PrefixPair.find({}),
			UserConfigs.find({}),
			BooruTags.find({}),
			MessageCascades.find({}),
		]);

		console.log(chalk.gray('Facilitando prefijos'));
		prefixPairs.forEach(pp => {
			globalConfigs.p_pure[pp.guildId] = {
				raw: pp.pure.raw,
				regex: pp.pure.regex,
			};
		});
		logOptions.prefixes && console.table(globalConfigs.p_pure);

		console.log(chalk.gray('Preparando Tags de Booru...'));
		await BooruTags.deleteMany({ fetchTimestamp: { $lt: new Date(Date.now() - Booru.TAGS_DB_LIFETIME) } }).catch(console.error);
		await BooruTags.syncIndexes();
		await BooruTags.createIndexes();
		booruTags.forEach(tag => Booru.tagsCache.set(tag.name, new Tag(tag)));
		logOptions.booruTags && console.table([...Booru.tagsCache.values()].sort((a, b) => a.id - b.id));
		
		console.log(chalk.gray('Preparando Cascadas de Mensajes...'));
		deleteExpiredMessageCascades();
		setInterval(deleteExpiredMessageCascades, 60 * 60e3);
		await MessageCascades.syncIndexes();
		await MessageCascades.createIndexes();
		messageCascades.forEach(({ messageId, otherMessageId }) => cacheMessageCascade(messageId, otherMessageId));

		console.log(chalk.gray('Preparando Suscripciones de Feeds...'));
		userConfigs.forEach(config => {
			/**@type {Map<String, Array<String>>}*/
			const suscriptions = new Map();
			for(const [ chId, tags ] of config.feedTagSuscriptions)
				suscriptions.set(chId, tags);
			feedTagSuscriptionsCache.set(config.userId, suscriptions);
		});
		logOptions.feedSuscriptions && console.log({ feedTagSuscriptionsCache });

		console.log(chalk.gray('Preparando Infracciones de Saki Scans...'));
		const hourai = (await SakiDB.findOne({})) || new SakiDB({});
		{
			const now = Date.now();
			let wasModified = false;
			Object.entries(hourai.userInfractions).forEach(([userId, infractions]) => {
				let infr = /**@type {Array}*/(/**@type {unknown}*/(infractions));
				
				const previousInfractionsLength = infr.length;
				infr = infr.filter(inf => (now - inf) < (60e3 * 60 * 4)); //Eliminar antiguas

				if(previousInfractionsLength === infr.length) return;
				wasModified = true;

				if(!infr.length) {
					hourai.userInfractions[userId] = null;
					delete hourai.userInfractions[userId];
					return;
				}
				
				globalConfigs.hourai.infr.users[userId] = infr;
				hourai.userInfractions[userId] = infr;
			});
			if(wasModified) hourai.markModified('userInfractions');
		}
		await hourai.save();

		console.log(chalk.gray('Preparando recordatorios...'));
		initRemindersScheduler(client);
		await getRemindersScheduler().triggerDueReminders();
		
		console.log(chalk.gray('Preparando Dueños de Mensajes de Agentes Puré...'));
		await initializeWebhookMessageOwners();

		console.log(chalk.gray('Preparando Tabla de Puré...'));
		const pureTableDocument = await Puretable.findOne({});
		let puretable = pureTableDocument;
		if(!puretable) puretable = new Puretable();
		else //Limpiar emotes eliminados / no accesibles
			puretable.cells = puretable.cells.map(arr =>
				arr.map(cell => client.emojis.cache.get(cell) ? cell : pureTableAssets.defaultEmote )
			);
		const uniqueEmoteIds = new Set();
		const pendingEmoteCells = [];
		puretable.cells.flat().forEach(cell => uniqueEmoteIds.add(cell));
		
		/**@param {String} id*/
		async function getEmoteCell(id) {
			const image = await loadImage(client.emojis.cache.get(id).imageURL({ extension: 'png', size: 64 }));
			return { id, image };
		}

		for(const id of uniqueEmoteIds)
			pendingEmoteCells.push(getEmoteCell(id));
		const [ , pureTableImage, emoteCells ] = await Promise.all([
			puretable.save(),
			loadImage('https://i.imgur.com/TIL0jPV.png'),
			Promise.all(pendingEmoteCells),
		]);
		pureTableAssets.image = pureTableImage;
		globalConfigs.loademotes = {};
		for(const cell of emoteCells)
			globalConfigs.loademotes[cell.id] = cell.image;
		
		console.log(chalk.gray('Preparando imágenes extra...'));
		const slot3Emojis = (/**@type {import('discord.js').Guild}*/(globalConfigs.slots.slot3)).emojis.cache;
		const [ WHITE, BLACK, pawn ] = await Promise.all([
			loadImage(slot3Emojis.find(e => e.name === 'wCell').imageURL({ extension: 'png', size: 256 })),
			loadImage(slot3Emojis.find(e => e.name === 'bCell').imageURL({ extension: 'png', size: 256 })),
			loadImage(slot3Emojis.find(e => e.name === 'pawn').imageURL({ extension: 'png', size: 256 })),
		]);
		globalConfigs.loademotes['chess'] = { WHITE, BLACK, pawn };
		
		console.log(chalk.gray('Iniciando cambios de presencia periódicos'));
		modifyPresence(client);
		confirm();
	}

	console.log(chalk.rgb(158,114,214)('Registrando fuentes'));
	registerFont('fonts/Alice-Regular.ttf',             { family: 'headline' });
	registerFont('fonts/cuyabra.otf',                   { family: 'cuyabra' });
	registerFont('fonts/teen bd.ttf',                   { family: 'cardname' });
	registerFont('fonts/kirsty rg.otf',                 { family: 'cardclass' });
	registerFont('fonts/asap-condensed.semibold.ttf',   { family: 'cardbody' });
	registerFont('fonts/BebasNeue_1.otf',               { family: 'bebas' });
	registerFont('fonts/DINPro-Cond.otf',               { family: 'dinpro' });

	globalConfigs.maintenance = '';
	console.log(chalk.greenBright.bold('Bot conectado y funcionando'));
	const { bot_status } = globalConfigs;
	auditSystem('Bot conectado y funcionando', 
		{ name: 'Host',             value: bot_status.host,                             inline: true },
		{ name: 'N. de versión',    value: bot_status.version.number,                   inline: true },
		{ name: 'Fecha',            value: `<t:${Math.floor(Date.now() / 1000)}:f>`,    inline: true },
	);

	await setupGuildFeedUpdateStack(client);
}

module.exports = {
	onStartup,
	discordToken,
	booruApiKey,
	booruUserId,
};
