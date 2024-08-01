const { CommandTags, CommandManager, CommandOptions, CommandOptionSolver } = require("../Commons/commands");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const flags = new CommandTags().add('COMMON');
const options = new CommandOptions()
	.addParam('mensaje', 'MESSAGE', ' para especificar un mensaje por ID o respuesta');
const command = new CommandManager('sticker', flags)
	.setAliases('stickers', 'pegatina')
	.setDescription('Muestra el enlace del sticker especificado')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const message = CommandOptionSolver.asMessage(await options.in(request).fetchParam(args, 'mensaje', true)) ?? request.channel.messages.cache.get(/**@type {import('discord.js').Message}*/(request).reference?.messageId);

		if(!message || !message.stickers.size)
			return request.reply({ content: '⚠️️ Debes especificar un mensaje con un sticker' });

        const sticker = await message.stickers.first()?.fetch().catch(console.error);
        
        if(!sticker)
            return request.reply({ content: 'No se encontraron Stickers...' });


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