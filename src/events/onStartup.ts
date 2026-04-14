import { join } from 'node:path';
import { GlobalFonts, type Image, loadImage } from '@napi-rs/canvas';
import chalk from 'chalk';
import { getUnixTime } from 'date-fns';
import type {
	Client,
	Collection,
	GuildTextBasedChannel,
	RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v9';
import { connect, set } from 'mongoose';
import { databaseUri } from '@/core/db';
import { initializeWebhookMessageOwners } from '@/utils/discordagent';
import { fetchAllGuildMembers } from '@/utils/guildratekeeper';
import { withTimeout } from '@/utils/promises';
import { fetchActionsFromFiles } from '../actions/commons/actionDiscovery';
import { registerActions } from '../actions/commons/actionRegistry';
import { fetchCommandsFromFiles } from '../commands/commons/commandDiscovery';
import { registerCommands } from '../commands/commons/commandRegistry';
import puré from '../core/puréRegistry';
import botStatus from '../data/botStatus.json';
import {
	discordToken,
	getHostName,
	globalConfigs,
	prefixes,
	remoteStartup,
	resolveHost,
} from '../data/globalProps';
import serverIds from '../data/serverIds.json';
import PrefixPairs from '../models/prefixpair';
import { PureTable, pureTableAssets } from '../models/puretable';
import UserConfigModel from '../models/userconfigs';
import { feedTagSuscriptionsCache, setupGuildFeedUpdateStack } from '../systems/booru/boorufeed';
import { auditSystem } from '../systems/others/auditor';
import { initializeMessageCascades } from '../systems/others/messageCascades';
import { prepareTracksPlayer } from '../systems/others/musicPlayer';
import { processReminders } from '../systems/others/remindersScheduler';
import { modifyPresence } from '../systems/presence/presence';

const logOptions = {
	slash: false,
	prefixes: false,
	booruTags: false,
	feedSuscriptions: false,
};

const confirm = () => console.log(chalk.green('Hecho.'));

export async function onStartup(client: Client) {
	globalConfigs.maintenance = '1';

	console.log(chalk.cyan('Obteniendo nombre de host...'));
	await resolveHost({
		fallback: 'Desconocido',
		onSuccess: confirm,
		onFailure: () =>
			console.log(
				chalk.yellowBright(
					'No se pudo obtener el nombre de host. Se estableció un nombre por defecto',
				),
			),
	});
	console.log(chalk.gray(`Hostname: ${getHostName()}`));

	console.log(chalk.cyan('Estableciendo actividad de "cargando"...'));
	try {
		client.user?.setActivity({
			type: 4,
			name: 'loading',
			state: `⏳ Despertando...`,
		});
		confirm();
	} catch (error) {
		console.log(
			chalk.bold.redBright(
				'Ocurrió un error al intentar mostrar la actividad para "cargando" durante la inicialización del bot.',
			),
		);
		console.error(error);
	}

	console.log(chalk.bold.magentaBright('Compilando comandos...'));
	const commands = await fetchCommandsFromFiles();
	registerCommands(commands, false);
	confirm();

	console.log(chalk.bold.magentaBright('Compilando acciones...'));
	const actions = await fetchActionsFromFiles();
	registerActions(actions, false);
	confirm();

	if (remoteStartup)
		console.log(chalk.redBright.bold('Se inicializará para un entorno de producción.'));
	else console.log(chalk.cyanBright.bold('Se inicializará para un entorno de desarrollo.'));

	console.log(chalk.magenta('Obteniendo miembros de servidores de Discord...'));
	await fetchAllGuildMembers();
	confirm();

	console.log(chalk.bold.magentaBright('Cargando comandos Slash y Contextuales...'));
	const restGlobal = new REST({ version: '9' }).setToken(discordToken);
	const commandData = (
		puré.slash as Collection<string, RESTPostAPIApplicationCommandsJSONBody>
	).concat(puré.contextMenu);

	try {
		if (!client.application)
			throw new ReferenceError("'client.application' was not properly defined");

		await restGlobal.put(Routes.applicationCommands(client.application.id), {
			body: commandData,
		});

		logOptions.slash && console.log(`Comandos registrados:`, restGlobal);
		confirm();
	} catch (error) {
		console.log(
			chalk.bold.redBright(
				'Ocurrió un error al intentar cargar los comandos Slash y/o Contextuales.',
			),
		);
		console.error(error);
	}

	console.log(chalk.cyan('Calculando semilla y horario (compatibilidad)...'));
	const currentTime = Date.now();
	globalConfigs.startupTime = currentTime;
	globalConfigs.seed = currentTime / 60000;

	console.log(chalk.magenta('Obteniendo información del host...'));

	console.log(chalk.magenta('Indexando Slots de Puré...'));
	(
		await Promise.all([
			client.guilds.cache.get(serverIds.slot1),
			client.guilds.cache.get(serverIds.slot2),
			client.guilds.cache.get(serverIds.slot3),
		])
	).forEach((guild, i) => {
		globalConfigs.slots[`slot${i + 1}`] = guild;
	});
	globalConfigs.logch = globalConfigs.slots.slot1.channels.resolve(
		'870347940181471242',
	) as GuildTextBasedChannel;
	confirm();

	console.log(chalk.rgb(255, 0, 0)('Preparando Reproductor de YouTube...'));
	await prepareTracksPlayer(client);
	confirm();

	//Cargado de datos de base de datos
	console.log(chalk.yellowBright.italic('Cargando datos de base de datos...'));
	console.log(chalk.gray('Conectando a Cluster en la nube...'));
	const mongoUri: string = databaseUri.resolve();
	databaseUri.redact();
	set('strictQuery', false);
	connect(mongoUri, {
		//@ts-expect-error Quizá sí existen estas 2
		useUnifiedTopology: true,
		useNewUrlParser: true,
	});

	console.log(chalk.gray('Obteniendo documentos...'));
	const [prefixPairs, userConfigs] = await Promise.all([
		PrefixPairs.find({}),
		UserConfigModel.find({}),
	]);

	console.log(chalk.gray('Facilitando prefijos...'));
	prefixPairs.forEach((pp) => {
		prefixes[pp.guildId] = {
			raw: pp.pure.raw,
			regex: pp.pure.regex,
		};
	});
	logOptions.prefixes && console.table(prefixes);

	console.log(chalk.gray('Preparando Cascadas de Mensajes...'));
	await initializeMessageCascades();

	console.log(chalk.gray('Preparando Suscripciones de Feeds...'));
	userConfigs.forEach((config) => {
		const suscriptions = new Map<string, string[]>();
		for (const [chId, tags] of config.feedTagSuscriptions) suscriptions.set(chId, tags);
		feedTagSuscriptionsCache.set(config.userId, suscriptions);
	});
	logOptions.feedSuscriptions && console.log({ feedTagSuscriptionsCache });

	console.log(chalk.gray('Preparando recordatorios...'));
	await processReminders();

	console.log(chalk.gray('Preparando Dueños de Mensajes de Agentes Puré...'));
	await initializeWebhookMessageOwners();

	console.log(chalk.gray('Preparando Tabla de Puré...'));
	const puretable = (await PureTable.findOne({})) ?? new PureTable();
	puretable.cells = puretable.cells.map((arr) =>
		arr.map((cell) => (client.emojis.cache.get(cell) ? cell : pureTableAssets.defaultEmote)),
	);
	const uniqueEmoteIds = new Set<string>();
	const pendingEmoteCells: Promise<{ id: string; image: Image }>[] = [];
	puretable.cells.flat().forEach((cell) => uniqueEmoteIds.add(cell));

	async function getEmoteCell(id: string) {
		const emoji = client.emojis.cache.get(id);
		if (!emoji)
			throw new Error('Emoji unexpectedly not found even after emoji cleanup for PuréTable.');

		const image = await withTimeout(
			loadImage(emoji.imageURL({ extension: 'png', size: 64 })),
			20_000,
		);

		return { id, image };
	}

	for (const id of uniqueEmoteIds) pendingEmoteCells.push(getEmoteCell(id));
	const [, pureTableImage, emoteCells] = await Promise.all([
		puretable.save(),
		loadImage('https://i.imgur.com/TIL0jPV.png'),
		(async () => {
			const results = await Promise.allSettled(pendingEmoteCells);
			return results
				.filter((result) => result.status === 'fulfilled')
				.map((result) => result.value);
		})(),
	]);
	pureTableAssets.image = pureTableImage;
	globalConfigs.loademotes = {};
	for (const cell of emoteCells)
		Object.defineProperty(globalConfigs.loademotes, cell.id, { value: cell.image });

	console.log(chalk.gray('Iniciando cambios de presencia periódicos'));
	modifyPresence(client);
	confirm();

	console.log(chalk.rgb(158, 114, 214)('Registrando fuentes'));
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'Alice-Regular.ttf'), 'headline');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'cuyabra.otf'), 'cuyabra');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'teen bd.ttf'), 'cardname');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'kirsty rg.otf'), 'cardclass');
	GlobalFonts.registerFromPath(
		join(__dirname, '..', 'fonts', 'asap-condensed.semichalk.bold.ttf'),
		'cardbody',
	);
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'BebasNeue_1.otf'), 'bebas');
	GlobalFonts.registerFromPath(join(__dirname, '..', 'fonts', 'DINPro-Cond.otf'), 'dinpro');

	globalConfigs.maintenance = '';
	console.log(chalk.greenBright.bold('Bot conectado y funcionando'));
	auditSystem(
		'Bot conectado y funcionando',
		{ name: 'Host', value: getHostName(), inline: true },
		{ name: 'N. de versión', value: botStatus.version.number, inline: true },
		{ name: 'Fecha', value: `<t:${getUnixTime(new Date(Date.now()))}:f>`, inline: true },
	);

	await setupGuildFeedUpdateStack(client);
}
