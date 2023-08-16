const { CommandMetaFlagsManager, CommandManager, CommandOptionsManager } = require("../Commons/commands");
const {  } = require("../../func");
const { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const flags = new CommandMetaFlagsManager().add('COMMON');
const options = new CommandOptionsManager()
	.addParam('mensaje', 'MESSAGE', ' para especificar un mensaje por ID o respuesta');
const command = new CommandManager('sticker', flags)
	.setAliases('stickers', 'pegatina')
	.setDescription('Muestra el enlace del sticker especificado')
	.setOptions(options)
	.setExecution(async (request, args) => {
        /**@type {Message<true>}*/
		const message = (await options.in(request).fetchParam(args, 'mensaje', true)) ?? request.channel.messages.cache.get(request.reference?.messageId);

		if(!message || !message.stickers.size)
			return request.reply({ content: '⚠️️ Debes especificar un mensaje con un sticker' });

        const sticker = await message.stickers.first().fetch().catch(console.error);

        const embed = new EmbedBuilder()
            .setColor('Blurple')
            .setAuthor({ name: 'Sticker' })
            .setTitle(sticker.name)
            .setImage(sticker.url);
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(sticker.url)
                .setEmoji('922669195521568818')
                .setStyle(ButtonStyle.Link),
        );

        return request.reply({
            embeds: [embed],
            components: [row],
        });
	});

module.exports = command;