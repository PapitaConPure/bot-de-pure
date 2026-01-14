import { Collection, GuildTextBasedChannel, REST, RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { Routes } from 'discord-api-types/v9';

import { puré, registerCommands } from '../core/commandInit';
import { fetchCommandsFromFiles } from '../commands/Commons';

import { set, connect } from 'mongoose';
import PrefixPairs from '../models/prefixpair';
import UserConfigs from '../models/userconfigs';
import BooruTags from '../models/boorutags';
import { PureTable, pureTableAssets } from '../models/puretable';

import { Booru, Tag } from '../systems/booru/boorufetch';
import { modifyPresence } from '../systems/presence/presence';
import { auditSystem } from '../systems/others/auditor';
import { prepareTracksPlayer } from '../systems/others/musicPlayer';
import { initializeMessageCascades } from '../systems/others/messageCascades';
import { setupGuildFeedUpdateStack, feedTagSuscriptionsCache } from '../systems/booru/boorufeed';
import { initRemindersScheduler, processReminders } from '../systems/others/remindersScheduler';
import { initializeWebhookMessageOwners } from '../systems/agents/discordagent';

import { GlobalFonts, loadImage } from '@napi-rs/canvas';
import { getUnixTime } from 'date-fns';
import { join } from 'path';
import chalk from 'chalk';

import { setupGuildRateKeeper, fetchAllGuildMembers } from '../utils/guildratekeeper';
import { discordToken, envPath, globalConfigs, noDataBase, prefixes, remoteStartup } from '../data/globalProps';

import botStatus from '../data/botStatus.json';
import serverIds from '../data/serverIds.json';

const logOptions = {
	slash: false,
	prefixes: false,
	booruTags: false,
	feedSuscriptions: false,
};

export async function onStartup(client: import('discord.js').Client) {
	const confirm = () => console.log(chalk.green('Hecho.'));
	globalConfigs.maintenance = '1';

	console.log(chalk.bold.magentaBright('Procesando archivos de comando...'));
	const commands = await fetchCommandsFromFiles();
	registerCommands(commands, false);
	confirm();

	if(remoteStartup)
		console.log(chalk.redBright.bold('Se inicializará para un entorno de producción'));
	else
		console.log(chalk.cyanBright.bold('Se inicializará para un entorno de desarrollo'));
	
	console.log(chalk.magenta('Obteniendo miembros de servidores de Discord...'));
	setupGuildRateKeeper({ client });
	await fetchAllGuildMembers();
	confirm();

	console.log(chalk.bold.magentaBright('Cargando comandos Slash y Contextuales...'));
	const restGlobal = new REST({ version: '9' }).setToken(discordToken);
	const commandData: {
		global: Collection<string, RESTPostAPIApplicationCommandsJSONBody>
		saki: Collection<string, RESTPostAPIChatInputApplicationCommandsJSONBody>
	} = {
		global: (puré.slash as Collection<string, RESTPostAPIApplicationCommandsJSONBody>).concat(puré.contextMenu),
		saki: puré.slashSaki,
	};

	try {
		await restGlobal.put(
			Routes.applicationCommands(client.application.id),
			{ body: commandData.global },
		);
		
		const dedicatedServerId = serverIds.saki;
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

	console.log(chalk.magenta('Indexando Slots de Puré...'));
	(await Promise.all([
		client.guilds.cache.get(serverIds.slot1),
		client.guilds.cache.get(serverIds.slot2),
		client.guilds.cache.get(serverIds.slot3),
	])).forEach((guild, i) => { globalConfigs.slots[`slot${i + 1}`] = guild; });
	globalConfigs.logch = globalConfigs.slots.slot1.channels.resolve('870347940181471242') as GuildTextBasedChannel;
	confirm();
	
	console.log((chalk.rgb(255, 0, 0))('Preparando Reproductor de YouTube...'));
	await prepareTracksPlayer(client);
	confirm();
	
	//Cargado de datos de base de datos
	if(noDataBase) {
		console.log(chalk.yellow.italic('Se saltará la inicialización de base de datos a petición del usuario'));
	} else {
		console.log(chalk.yellowBright.italic('Cargando datos de base de datos...'));
		console.log(chalk.gray('Conectando a Cluster en la nube...'));
		const mongoUri: string = process.env.MONGODB_URI ?? (require(envPath)?.dburi);
		set("strictQuery", false);
		connect(mongoUri, {
			//@ts-expect-error
			useUnifiedTopology: true,
			useNewUrlParser: true,
		});

		console.log(chalk.gray('Obteniendo documentos...'));
		const [ prefixPairs, userConfigs, booruTags ] = await Promise.all([
			PrefixPairs.find({}),
			UserConfigs.find({}),
			BooruTags.find({}),
		]);

		console.log(chalk.gray('Facilitando prefijos'));
		prefixPairs.forEach(pp => {
			prefixes[pp.guildId] = {
				raw: pp.pure.raw,
				regex: pp.pure.regex,
			};
		});
		logOptions.prefixes && console.table(prefixes);

		console.log(chalk.gray('Preparando Tags de Booru...'));
		await BooruTags.deleteMany({ fetchTimestamp: { $lt: new Date(Date.now() - Booru.TAGS_DB_LIFETIME) } }).catch(console.error);
		await BooruTags.syncIndexes();
		await BooruTags.createIndexes();
		booruTags.forEach(tag => Booru.tagsCache.set(tag.name, new Tag(tag)));
		logOptions.booruTags && console.table([...Booru.tagsCache.values()].sort((a, b) => a.id - b.id));
		
		console.log(chalk.gray('Preparando Cascadas de Mensajes...'));
		await initializeMessageCascades();

		console.log(chalk.gray('Preparando Suscripciones de Feeds...'));
		userConfigs.forEach(config => {
			const suscriptions = new Map<string, string[]>();
			for(const [ chId, tags ] of config.feedTagSuscriptions)
				suscriptions.set(chId, tags);
			feedTagSuscriptionsCache.set(config.userId, suscriptions);
		});
		logOptions.feedSuscriptions && console.log({ feedTagSuscriptionsCache });

		console.log(chalk.gray('Preparando recordatorios...'));
		initRemindersScheduler(client);
		await processReminders();
		
		console.log(chalk.gray('Preparando Dueños de Mensajes de Agentes Puré...'));
		await initializeWebhookMessageOwners();

		console.log(chalk.gray('Preparando Tabla de Puré...'));
		const pureTableDocument = await PureTable.findOne({});
		let puretable = pureTableDocument;
		if(!puretable) puretable = new PureTable();
		else //Limpiar emotes eliminados / no accesibles
			puretable.cells = puretable.cells.map(arr =>
				arr.map(cell => client.emojis.cache.get(cell) ? cell : pureTableAssets.defaultEmote )
			);
		const uniqueEmoteIds = new Set<string>();
		const pendingEmoteCells = [];
		puretable.cells.flat().forEach(cell => uniqueEmoteIds.add(cell));
		
		/**@param {string} id*/
		async function getEmoteCell(id: string) {
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
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'Alice-Regular.ttf'),             'headline');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'cuyabra.otf'),                   'cuyabra');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'teen bd.ttf'),                   'cardname');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'kirsty rg.otf'),                 'cardclass');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'asap-condensed.semichalk.bold.ttf'),   'cardbody');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'BebasNeue_1.otf'),               'bebas');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'DINPro-Cond.otf'),               'dinpro');

	globalConfigs.maintenance = '';
	console.log(chalk.greenBright.bold('Bot conectado y funcionando'));
	auditSystem('Bot conectado y funcionando', 
		{ name: 'Host',             value: botStatus.host,                             inline: true },
		{ name: 'N. de versión',    value: botStatus.version.number,                   inline: true },
		{ name: 'Fecha',            value: `<t:${getUnixTime(new Date(Date.now()))}:f>`,    inline: true },
	);

	await setupGuildFeedUpdateStack(client);
}
