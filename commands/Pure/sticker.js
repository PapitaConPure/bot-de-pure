const { CommandTags, CommandManager, CommandOptions } = require("../Commons/commands");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const options = new CommandOptions()
	.addParam('mensaje', 'MESSAGE', 'para especificar un mensaje por ID, enlace o respuesta');

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('sticker', flags)
	.setAliases('stickers', 'pegatina')
	.setDescription('Muestra el enlace del sticker especificado')
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const message = (await args.getMessage('mensaje', true))
			?? request.channel.messages.cache.get(/**@type {import('discord.js').Message}*/(request).reference?.messageId)
			?? (request.isMessage ? request.inferAsMessage() : null);

		if(!message || !message.stickers.size)
			return request.reply({ content: '⚠️️ Debes especificar un mensaje con un sticker' });

        const sticker = await message.stickers.first()?.fetch().catch(console.error);
        if(!sticker)
            return request.reply({ content: 'No se encontraron stickers...' });

        const embed = new EmbedBuilder()
            .setColor('Blurple')
            .setAuthor({ name: 'Sticker' })
            .setTitle(sticker.name)
            .setTimestamp(sticker.createdTimestamp)
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