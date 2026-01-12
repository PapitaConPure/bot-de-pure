import { Collection, REST, RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { Routes } from 'discord-api-types/v9';

import { set, connect } from 'mongoose';
import PrefixPairs from '../models/prefixpair.js';
import UserConfigs from '../models/userconfigs.js';
import BooruTags from '../models/boorutags.js';
import MessageCascades from '../models/messageCascades.js';
import { Puretable, pureTableAssets } from '../models/puretable.js';
import { deleteExpiredMessageCascades, cacheMessageCascade } from './onMessageDelete.js';

import { puré } from '../core/commandInit.js';
import globalConfigs from '../data/config.json';
const envPath = globalConfigs.remoteStartup ? '../remoteenv.json' : '../localenv.json';
const noDB = globalConfigs.noDataBase;

const mongoUri: string = process.env.MONGODB_URI ?? (require(envPath)?.dburi);

export const discordToken: string = process.env.I_LOVE_MEGUMIN ?? (require(envPath)?.token);
export const booruApiKey: string = process.env.BOORU_APIKEY ?? (require(envPath)?.booruapikey);
export const booruUserId: string = process.env.BOORU_USERID ?? (require(envPath)?.booruuserid);

import { setupGuildFeedUpdateStack, feedTagSuscriptionsCache } from '../systems/booru/boorufeed.js';
import { Booru, Tag } from '../systems/booru/boorufetch.js';
import { modifyPresence } from '../systems/presence/presence.js';
import { auditSystem } from '../systems/others/auditor.js';

import { GlobalFonts, loadImage } from '@napi-rs/canvas';
import { getUnixTime } from 'date-fns';
import { lookupService } from 'dns';
import { promisify } from 'util';
import { join } from 'path';
import chalk from 'chalk';

import { prepareTracksPlayer } from '../systems/others/musicPlayer.js';
import { initializeWebhookMessageOwners } from '../systems/agents/discordagent.js';
import { setupGuildRateKeeper, fetchAllGuildMembers } from '../utils/guildratekeeper.js';
import { initRemindersScheduler, processReminders } from '../systems/others/remindersScheduler.js';

const logOptions = {
	slash: false,
	prefixes: false,
	booruTags: false,
	feedSuscriptions: false,
};

export async function onStartup(client: import('discord.js').Client) {
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
		set("strictQuery", false);
		connect(mongoUri, {
			//@ts-expect-error
			useUnifiedTopology: true,
			useNewUrlParser: true,
		});

		console.log(chalk.gray('Obteniendo documentos...'));
		const [ prefixPairs, userConfigs, booruTags, messageCascades ] = await Promise.all([
			PrefixPairs.find({}),
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
		const pureTableDocument = await Puretable.findOne({});
		let puretable = pureTableDocument;
		if(!puretable) puretable = new Puretable();
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
	const { bot_status } = globalConfigs;
	auditSystem('Bot conectado y funcionando', 
		{ name: 'Host',             value: bot_status.host,                             inline: true },
		{ name: 'N. de versión',    value: bot_status.version.number,                   inline: true },
		{ name: 'Fecha',            value: `<t:${getUnixTime(new Date(Date.now()))}:f>`,    inline: true },
	);

	await setupGuildFeedUpdateStack(client);
}
