const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { serverid } = require('../../localdata/config.json'); //Variables globales
const { paginate, fetchArrows } = require('../../func');
const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);

module.exports = {
	name: 'emotes',
	aliases: [
		'emojis', 'emote', 'emoji',
		'emt'
	],
	brief: 'Muestra una lista de emotes disponibles',
    desc: 'Muestra una lista paginada de emotes a mi disposición',
    flags: [
        'common'
    ],
	
	async execute(message, _) {
		const guilds = message.client.guilds.cache;
		let emotes = (() => {
			const slot1Coll = guilds.get(serverid.slot1).emojis.cache.values();
			const slot2Coll = guilds.get(serverid.slot2).emojis.cache.values();
			const slot3Coll = guilds.get(serverid.slot3).emojis.cache.values();
			return [...slot1Coll, ...slot2Coll, ...slot3Coll].sort();
		})();
		emotes = paginate(emotes);
		let page = 0;
		const content = '**Oe mira po, emotes** <:yumou:708158159180660748>\n';
		const embed = new MessageEmbed()
			.setColor('#fecb4c')
			.setTitle('Emotes')

			.addField(`${'Nombre\`'.padEnd(24)}\`Emote`, emotes[0])

			.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
			.setFooter(`Reacciona a las flechas debajo para cambiar de página`);

		const sent = await message.channel.send({ content: content, embeds: [embed] });
		const arrows = fetchArrows(interaction.client.emojis.cache);
		await Promise.all([sent.react(arrows[0]), sent.react(arrows[1])]);
			
		const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
		collector.on('collect', reaction => {
			if(reaction.emoji.id === arrows[0].id) page = (page > 0)?(page - 1):(emotes.length - 1);
			else page = (page < (emotes.length - 1))?(page + 1):0;
			embed.fields[0].value = emotes[page];
			embed.setFooter(`Página ${page + 1}/${Math.ceil(emotes.length)}`);
			sent.edit({ content: content, embeds: [embed]});
		});
    },
	
	async interact(interaction, _) {
		const guilds = interaction.client.guilds.cache;
		let emotes = (() => {
			const slot1Coll = guilds.get(serverid.slot1).emojis.cache.values();
			const slot2Coll = guilds.get(serverid.slot2).emojis.cache.values();
			const slot3Coll = guilds.get(serverid.slot3).emojis.cache.values();
			return [...slot1Coll, ...slot2Coll, ...slot3Coll].sort();
		})();
		emotes = paginate(emotes);
		let page = 0;
		const content = '**Oe mira po, emotes** <:yumou:708158159180660748>\n';
		const embed = new MessageEmbed()
			.setColor('#fecb4c')
			.setTitle('Emotes')

			.addField(`${'Nombre\`'.padEnd(24)}\`Emote`, emotes[0])

			.setAuthor(`Comando invocado por ${interaction.member.user.username}`, interaction.member.user.avatarURL())
			.setFooter(`Reacciona a las flechas debajo para cambiar de página`);

		await interaction.reply({ content: content, embeds: [embed] });
		const sent = await interaction.fetchReply();
		const arrows = fetchArrows(interaction.client.emojis.cache);
		await Promise.all([sent.react(arrows[0]), sent.react(arrows[1])]);
		
		const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
		collector.on('collect', reaction => {
			if(reaction.emoji.id === arrows[0].id) page = (page > 0)?(page - 1):(emotes.length - 1);
			else page = (page < (emotes.length - 1))?(page + 1):0;
			embed.fields[0].value = emotes[page];
			embed.setFooter(`Página ${page + 1}/${Math.ceil(emotes.length)}`);
			sent.edit({ content: content, embeds: [embed]});
		});
    }
};