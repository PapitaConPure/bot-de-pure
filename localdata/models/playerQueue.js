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
 * @param {import('../../commands/Commons/typings').ComplexCommandRequest} request 
 * @param {import('discord-player').GuildQueue} queue 
 * @returns 
 */
async function saveTracksQueue(request, queue) {
	if(!queue) return;

	const pqQuery = { guildId: request.guildId };
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
	
	const channel = /**@type {import('discord.js').GuildMember}*/(member).voice?.channel;
	if(!channel)
		return null;
	
	try {
		console.log('Request member is in voice channel. Reconstructing queue...');
		queue = player.queues.create(guild, { metadata: request });
		console.log({ creadedQueue: queue.connection });

		if(!queue.connection)
			await queue.connect(channel);
		if(!queue.isPlaying()) {
			await queue.play(currentTrack);
			if(pauseOnInit)
				queue.node.pause();
		}
		if(restOfTracks.length)
			queue.tracks.add(restOfTracks);
		console.log({ recoveredQueue: queue.connection });

		return queue;
	} catch(err) {
		console.log('Saved queue data retrieval failed');
		console.error(err);
		return null;
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
