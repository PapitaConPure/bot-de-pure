const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { CommandTags, Command } = require('../Commons/commands');
const GuildConfig = require('../../models/guildconfigs.js');
const { tenshiColor } = require('../../data/config.json');
const { makeButtonRowBuilder } = require('../../utils/tsCasts.js');

const tags = new CommandTags().add('PAPA');
const command = new Command('papa-feedback', tags)
    .setLongDescription('Comando de feedback')
    .setExecution(async request => {
        const { client } = request;
        
        const feedbackEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Bot de Puré • PuréFeed', iconURL: client.user.displayAvatarURL({ size: 256 }) })
            .setColor(tenshiColor)
            .setTitle('Retroalimentación / Feedback / フィードバック')
            .setFooter({ text: 'Papita con Puré', iconURL: 'https://cdn.discordapp.com/emojis/1107848137458073701.gif?size=96' })
            .setTimestamp(Date.now())
            .addFields(
                {
                    name: '<:es:1084646419853488209>',
                    value: '¿Qué piensas del nuevo formato de etiquetas de Post?\nSolo se registra una respuesta por usuario',
                    inline: true,
                },
                {
                    name: '<:en:1084646415319453756>',
                    value: 'What do you think about the new Post tags formatting?\nOnly one answer is registered per user',
                    inline: true,
                },
                {
                    name: '🇯🇵',
                    value: '新しい投稿タグ形式についてどう思いますか？\nユーザーごとに登録できる回答は1つだけです',
                    inline: true,
                },
            );

        const feedbackRows = [
            makeButtonRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('feed_giveFeedback_Y')
                    .setEmoji('1163687887120891955')
                    .setLabel('Me gusta / I like it / いいね')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('feed_giveFeedback_N')
                    .setEmoji('1355143793577426962')
                    .setLabel('No me gusta / I don\'t like it / 良くないです')
                    .setStyle(ButtonStyle.Danger),
            ),
            makeButtonRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('feed_giveFeedback_F')
                    .setEmoji('✉')
                    .setLabel('Redactar una respuesta / Write an answer / 書き込み応答')
                    .setStyle(ButtonStyle.Primary),
            ),
        ];

        const guildConfigs = /**@type {Array<import('../../models/guildconfigs.js').GuildConfigDocument>}*/(await GuildConfig.find({}));
        const guilds = client.guilds.cache;
        guildConfigs.forEach(guildConfig => {
            const guild = guilds.get(guildConfig.guildId);
            const channels = guild.channels.cache;
            Object.entries(guildConfig.feeds).forEach(([ channelId ]) => {
                const channel = channels.get(channelId);
                if(!channel.isSendable()) return;
                channel.send({
                    embeds: [ feedbackEmbed ],
                    components: feedbackRows,
                });
            })
        });
    });

module.exports = command;
