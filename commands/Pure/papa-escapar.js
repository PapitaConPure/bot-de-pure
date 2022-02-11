module.exports = {
	name: 'papa-escapar',
	aliases: [
		'papa-abandonar'
	],
	desc: 'Abandono.',
	flags: [
		'papa'
	],

	/**
	 * 
	 * @param {import('discord.js').Message} message 
	 * @param {Array<String>} args
	 * @returns 
	 */
	async execute(message, args) {
		//Acción de comando
		if(!args.length) return await message.reply({ content: message.client.guilds.cache.map(g => `**${g.name}** ${g.id}`).join('\n') });
		const search = args.join(' ');
		let guild = message.client.guilds.cache.get(search);
		if(!guild) guild = message.client.guilds.cache.find(g => g.name.toLowerCase().indexOf(search.toLowerCase()) !== -1);
		if(!guild) return await message.reply({ content: 'Servidor inválido' });

		return await guild.leave();
	}
};