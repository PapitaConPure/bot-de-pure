const Mongoose = require('mongoose');
const { serialize, deserialize, encode, decode, useMainPlayer, Track, Player } = require('discord-player');

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

const model = Mongoose.model('PlayerQueue', PlayerQueueSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} PlayerTrackDocument*/

/**
 * 
 * @param {import('../../commands/Commons/typings').ComplexCommandRequest | import('discord.js').Interaction} request 
 * @param {import('discord-player').GuildQueue} queue 
 * @returns 
 */
async function saveTracksQueue(request, queue) {
	if(!queue) return;

	const pqQuery = { guildId: request.guild.id };
	const playerQueue = (await model.findOne(pqQuery)) || new model(pqQuery);
	const serializedTracks = queue.tracks.map(serializeTrack);
	if(queue.currentTrack)
		serializedTracks.unshift(serializeTrack(queue.currentTrack));
	playerQueue.serializedTracks = serializedTracks;
	playerQueue.markModified('serializedTracks');
	return playerQueue.save();
}

/**
 * 
 * @param {import('../../commands/Commons/typings').ComplexCommandRequest | import('discord.js').Interaction} request
 * @param {Boolean} [pauseOnInit=true] Si pausar la "pista actual" al reactivar la reproducción de una queue recuperada. `true` por defecto
 */
async function tryRecoverSavedTracksQueue(request, pauseOnInit = true) {
	console.log('Attempting recovery of possible saved queue');
	const { guild, member } = request;
	const guildId = guild.id;

	const player = useMainPlayer();
	let queue = player.queues.get(guildId);
	console.log({ cachedQueue: queue });
	if(queue) return queue;

	console.log('Queue wasn\'t cached. Searching in DB...');
	const pqQuery = { guildId };
	console.log(pqQuery);
	const savedQueue = await model.findOne(pqQuery);
	
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

/**
 * @typedef {Object} __attempDatabaseQueueRecoveryData
 * @property {import('../../commands/Commons/typings').ComplexCommandRequest | import('discord.js').Interaction} request
 * @property {Boolean} pauseOnInit
 * @property {Track<unknown>} currentTrack
 * @property {Array<Track<unknown>>} restOfTracks
 * 
 * @param {__attempDatabaseQueueRecoveryData} data 
 * @param {Number} retries 
 * @returns 
 */
async function attemptDatabaseQueueRecovery(data, retries = 3) {
	const {
		request,
		pauseOnInit,
		currentTrack,
		restOfTracks,
	} = data;
	
	const channel = /**@type {import('discord.js').GuildMember}*/(request.member).voice?.channel;
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

/**
 * Serializa y codifica un Track a un string Base-64
 * @param {Track<unknown>} t 
 * @returns {String}
 */
function serializeTrack(t) {
	return encode(serialize(t));
}

/**
 * Decodifica y deserializa un string Base-64 a un Track
 * @param {Player} player 
 * @param {String} t 
 * @returns {Track<unknown>}
 */
function deserializeTrack(player, t) {
	return /**@type {Track<unknown>}*/(deserialize(player, decode(t)));
}

module.exports = {
	saveTracksQueue,
	tryRecoverSavedTracksQueue,
};
