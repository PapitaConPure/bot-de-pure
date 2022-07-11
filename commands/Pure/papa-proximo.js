const { modifyPresence } = require('../../presence.js');

module.exports = {
	name: 'papa-próximo',
	aliases: [
		'papa-proximo'
	],
	desc: '...',
	flags: [
		'papa'
	],

	async execute(message, _) {
		await Promise.all([
			modifyPresence(message.client),
			message.react('✅'),
		]);
	}
};