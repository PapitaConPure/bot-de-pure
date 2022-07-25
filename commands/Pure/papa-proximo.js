const { modifyPresence } = require('../../presence.js');
const { CommandMetaFlagsManager } = require('../Commons/commands');

module.exports = {
	name: 'papa-próximo',
	aliases: [
		'papa-proximo'
	],
	desc: '...',
	flags: new CommandMetaFlagsManager().add('PAPA'),

	async execute(message, _) {
		await Promise.all([
			modifyPresence(message.client),
			message.react('✅'),
		]);
	}
};