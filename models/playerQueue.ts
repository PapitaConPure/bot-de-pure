import Mongoose from 'mongoose';
import { serialize, deserialize, encode, decode, useMainPlayer, GuildQueue, Track, Player } from 'discord-player';
import { ComplexCommandRequest } from '../commands/Commons/typings';
import { GuildMember, Interaction } from 'discord.js';

const PlayerQueueSchema = new Mongoose.Schema({
	guildId: {
		type: String,
		required: true,
		unique: true,
	},
	serializedTracks: {
		type: Array,
		default: () => [],
	},
});

const PlayerQueue = Mongoose.model('PlayerQueue', PlayerQueueSchema);

function m() { return new PlayerQueue({}); }
export type PlayerTrackDocument = ReturnType<(typeof m)>;

export async function saveTracksQueue(request: ComplexCommandRequest | Interaction, queue: GuildQueue) {
	if(!queue) return;

	const pqQuery = { guildId: request.guild.id };
	const playerQueue = (await PlayerQueue.findOne(pqQuery)) || new PlayerQueue(pqQuery);
	const serializedTracks = queue.tracks.map(serializeTrack);
	if(queue.currentTrack)
		serializedTracks.unshift(serializeTrack(queue.currentTrack));
	playerQueue.serializedTracks = serializedTracks;
	playerQueue.markModified('serializedTracks');
	return playerQueue.save();
}

/**
 * @param request La petición que requiere las pistas guardadas
 * @param pauseOnInit Si pausar la "pista actual" al reactivar la reproducción de una queue recuperada. `true` por defecto
 */
export async function tryRecoverSavedTracksQueue(request: ComplexCommandRequest | Interaction, pauseOnInit: boolean = true) {
	console.log('Attempting recovery of possible saved queue');
	const { guild } = request;
	const guildId = guild.id;

	const player = useMainPlayer();
	const queue = player.queues.get(guildId);
	console.log({ cachedQueue: queue });
	if(queue) return queue;

	console.log('Queue wasn\'t cached. Searching in DB...');
	const pqQuery = { guildId };
	console.log(pqQuery);
	const savedQueue = await PlayerQueue.findOne(pqQuery);

	if(!savedQueue || !savedQueue.serializedTracks.length) return null;

	console.log('Non-empty saved queue found!');
	const [ currentTrack, ...restOfTracks ] = savedQueue.serializedTracks.map(st => deserializeTrack(player, st));

	console.log('Saved queue data retrieved!');
	console.log({ currentTrack, restOfTracks });

	return attemptDatabaseQueueRecovery({
		request,
		pauseOnInit,
		currentTrack,
		restOfTracks,
	});
}

interface __attempDatabaseQueueRecoveryData {
	request: ComplexCommandRequest | Interaction;
	pauseOnInit: boolean;
	currentTrack: Track<unknown>;
	restOfTracks: Track<unknown>[];
}

async function attemptDatabaseQueueRecovery(data: __attempDatabaseQueueRecoveryData, retries: number = 3) {
	const {
		request,
		pauseOnInit,
		currentTrack,
		restOfTracks,
	} = data;

	const channel = (request.member as GuildMember).voice?.channel;
	if(!channel)
		return null;

	console.log('Request member is in voice channel. Recovering "current track" and rest of queue...');
	try {
		const player = useMainPlayer();
		const { queue } = await player.play(channel, currentTrack.url ?? currentTrack, {
			nodeOptions: { metadata: request },
		});

		console.log('"Current track" was set.');

		if(pauseOnInit) {
			console.log('Caller requested to keep recovered "current track" paused.');
			queue.node.pause();
		}

		console.log(`Reconstructing rest of queue with ${restOfTracks.length} tracks...`);
		if(restOfTracks.length)
			queue.tracks.add(restOfTracks);

		console.log({
			recoveredConnection: queue.connection.state,
			recoveredTracks: queue.tracks.map(t => t.toString()),
		});

		return queue;
	} catch(err) {
		console.log('Saved queue data retrieval failed');
		console.error(err);

		if(retries === 0) {
			console.log('Saved queue was deemed irrecoverable. Return value will be null');
			return null;
		}

		const remainingRetries = retries - 1;
		console.log(`Reattempting to recover saved queue (remaining retries: ${remainingRetries})`);
		return attemptDatabaseQueueRecovery(data, remainingRetries);
	}
}

/**@description Serializa y codifica un Track a un string Base-64*/
function serializeTrack(t: Track<unknown>): string {
	return encode(serialize(t));
}

/**@description Decodifica y deserializa un string Base-64 a un Track*/
function deserializeTrack(player: Player, t: string): Track<unknown> {
	return deserialize(player, decode(t)) as Track<unknown>;
}
