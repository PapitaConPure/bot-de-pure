const { EmbedBuilder } = require('discord.js'); //Integrar discord.js
const { readdirSync } = require('fs'); //Para el contador de comandos
const { tenshiColor } = require('../../localdata/config.json');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const embed = new EmbedBuilder()
    .setColor(tenshiColor)
    .setThumbnail('https://i.imgur.com/3Dp8zFa.jpg')
    .addFields(
        {
            name: 'Creador/Dueño',
            value: '🥔 Papita con Puré#6932',
            inline: true,
        },
        {
            name: 'Participantes',
            value: '🤠 Imagine Breaker#6299\n🍗 Sassafras#3331',
            inline: true,
        },
        {
            name: 'Colaboradores',
            value: '🍑 Rakkidei#4790\n🧐 Super Arathy\'s 12#8235\n🐶 Taton#0122',
            inline: true,
        },
        {
            name: '¡Permíteme presentarme!',
            value: '¡Hola! Soy __Bot de Puré__ (♀), un bot dedicado al entretenimiento con tecnologías de complemento de chat y de búsqueda de imágenes',
        },
        {
            name: 'Historia',
            value: 'Habiendo sido creado como un proyecto de prueba para un evento competitivo de una pequeña comunidad, actualmente me encuentro como un bot bastante decente y con varias funcionalidades extra que ya distorsionaron mi propósito original por completo',
        },
        {
            name: '¡Juguemos juntos~♪!',
            value: '¡No dudes en investigar lo que puedo hacer! Al menos una risa te vas a llevar',
        },
        {
            name: 'Por cierto...',
            value: 'La mayoría de imágenes que Bot de Puré utiliza fueron dibujadas por Rakkidei, puedes seguirlo en [Twitter](https://twitter.com/rakkidei) y [pixiv](https://www.pixiv.net/en/users/58442175) (donde también puedes encontrar sus otras redes y demás)',
        },
        {
            name: 'Comandos',
            value: `¡Ofrezco ${readdirSync('./commands/Pure').filter(file => file.endsWith('.js')).length} comandos en total!`,
        },
        {
            name: 'Comentario de mi padre',
            value: '_"Quiero café. Necesito café, ya."_',
        },
    );

const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('presentar', flags)
    .setAliases('presentacion', 'presentación', 'hola', 'saludar', 'presentarse', 'puré', 'pure')
    .setDescription('Me presento y digo cositas sobre mí~')
    .setExecution(async request => {
        if(!embed.author)
            embed.setAuthor({ name: 'Presentación', iconURL: request.client.user.avatarURL({ extension: 'png', size: 1024 }) });
        return request.reply({ embeds: [embed] });
    });

module.exports = command;