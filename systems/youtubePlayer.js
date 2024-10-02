const { Player } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');

let player;

/**
 * Registra un reproductor y extractor de YouTube
 * @param {import('discord.js').Client} client
 */
async function prepareYouTubePlayer(client) {
	player = new Player(client);

	player.extractors.register(YoutubeiExtractor, {});
	await player.extractors.loadDefault((ext) => ext !== 'YouTubeExtractor');
	
	//player.events.on('playerStart', (queue, track) => {
	//	queue.metadata.channel.send(`Started playing **${track.title}**!`);
	//});
}

module.exports = {
	prepareYouTubePlayer,
};
