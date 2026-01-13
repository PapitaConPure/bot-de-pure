import { ContextMenuAction } from '../Commons/actionBuilder';
import { MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { emojiRegex } from '../../func';
import { Translator } from '../../i18n';

const action = new ContextMenuAction('actionGetEmojis', 'Message')
    .setMessageResponse(async interaction => {
        const message = interaction.targetMessage;
        const uid = interaction.user.id;
        const translator = await Translator.from(uid);

        const emojisMatches = message.content.matchAll(emojiRegex);
        if(!emojisMatches)
            return interaction.reply({
                flags: MessageFlags.Ephemeral,
                content: 'No se encontraron emotes...',
            });

        const embeds: EmbedBuilder[] = [];
        const components: ActionRowBuilder<ButtonBuilder>[] = [];

        for(const emojiMatch of emojisMatches) {
            if(embeds.length >= 25) continue;

            const emoji = interaction.client.emojis.resolve(emojiMatch[1]);
            if(!emoji) continue;

            const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setAuthor({ name: 'Emoji' })
                .setTitle(emoji.name)
                .setImage(emoji.url)
                .setFooter({ text: emoji.animated ? '🎞️' : '🖼️' })
                .setTimestamp(emoji.createdTimestamp);

            embeds.push(embed);
                        
            const button = new ButtonBuilder()
                .setURL(emoji.url)
                .setEmoji('922669195521568818')
                .setLabel(emoji.name)
                .setStyle(ButtonStyle.Link);

            if(components.length && components[components.length - 1].components.length < 5) {
                components[components.length - 1].addComponents(button);
            } else {
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
                components.push(row);
            }
        }

        if(!embeds.length)
            return interaction.reply({
                flags: MessageFlags.Ephemeral,
                content: '⚠️️ Los emotes mencionados son inválidos o inaccesibles. Verifica que yo esté en el servidor con el emote',
            });
        
        return interaction.reply({ embeds, components });
    });

export default action;
