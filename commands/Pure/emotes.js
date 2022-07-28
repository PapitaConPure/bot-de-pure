const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { serverid } = require('../../localdata/config.json'); //Variables globales
const { paginate, fetchArrows } = require('../../func');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('emotes', flags)
	.setAliases(
		'emojis', 'emote', 'emoji',
		'emt',
	)
	.setBriefDescription('Muestra una lista de emotes disponibles')
	.setLongDescription('Muestra una lista paginada de emotes a mi disposición')
	.setExecution(async request => {
		const user = (request.author ?? request.user);
		const guilds = request.client.guilds.cache;
		const emotes = paginate([
			...guilds.get(serverid.slot1).emojis.cache.values(),
			...guilds.get(serverid.slot2).emojis.cache.values(),
			...guilds.get(serverid.slot3).emojis.cache.values(),
		].sort());
		let page = 0;
		const content = '**Oe mira po, emotes** <:yumou:708158159180660748>\n';
		const embed = new MessageEmbed()
			.setColor('#fecb4c')
			.setTitle('Emotes')
			.setAuthor({ name: `Comando invocado por ${user.username}`, iconURL: user.avatarURL() })
			.setFooter({ text: `Reacciona a las flechas debajo para cambiar de página` })
			.addFields({ name: `${'Nombre\`'.padEnd(24)}\`Emote`, value: emotes[0] });

		const sent = await request.reply({ content: content, embeds: [embed], fetchReply: true });
		const arrows = fetchArrows(request.client.emojis.cache);
		await Promise.all([sent.react(arrows[0]), sent.react(arrows[1])]);
			
		const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
		const collector = sent.createReactionCollector({ filter, time: 8 * 60 * 1000 });
		collector.on('collect', reaction => {
			if(reaction.emoji.id === arrows[0].id) page = (page > 0) ? (page - 1) : (emotes.length - 1);
			else page = (page < (emotes.length - 1)) ? (page + 1) : 0;
			embed.fields[0].value = emotes[page];
			embed.setFooter({ text: `Página ${page + 1}/${Math.ceil(emotes.length)}` });
			sent.edit({ content: content, embeds: [embed]});
		});
	});

module.exports = command;