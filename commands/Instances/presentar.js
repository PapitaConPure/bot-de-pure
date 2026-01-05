const { EmbedBuilder } = require('discord.js'); //Integrar discord.js
const { readdirSync } = require('fs'); //Para el contador de comandos
const { tenshiColor } = require('../../data/config.json');
const { CommandTags, Command } = require('../Commons/commands');

const embeds = [
    new EmbedBuilder()
        .setColor(tenshiColor)
        .setThumbnail('https://i.imgur.com/3Dp8zFa.jpg')
        .setTitle('¡Hola! ¡Permíteme presentarme!')
        .setDescription('Me llamo __Bot de Puré__ (♀️). Soy una bot de administración, entretenimiento, utilidad general y búsqueda de imágenes.'
            + '\n\n¡No dudes en investigar lo que puedo hacer!\nAl menos una risa te vas a llevar.')
        .addFields(
            {
                name: 'Comandos',
                value: `¡**${readdirSync('./commands/Instances').filter(file => file.endsWith('.js')).length}** en total!`,
                inline: true,
            },
            {
                name: 'Comprueba mi estado',
                value: '`p!estado` `/estado`',
                inline: true,
            },
            {
                name: 'Más información',
                value: '`p!ayuda` `/ayuda`',
                inline: true,
            },
        ),
    new EmbedBuilder()
        .setColor(0xbf94e4)
        .setTitle('Créditos')
        .setDescription('Todas estas personas hacen posible el proyecto de Bot de Puré. ¡Gracias!')
        .addFields(
            {
                name: 'Creador/Dueño',
                value: '🥔 `papitaconpure`',
                inline: true,
            },
            {
                name: 'Participantes',
                value: '🤠 `imbreaker.`\n🍗 `sassafras_doya`',
                inline: true,
            },
            {
                name: 'Colaboradores',
                value: '🧐 `superarathys12`\n🐶 `taton`',
                inline: true,
            },
            {
                name: 'Arte',
                value: '🍑 `rakkidei` — <:twitter2:1232243415165440040>[`@rakkidei`](https://x.com/rakkidei "@rakkidei") <:pixiv2:1334816111270563880>[`rakkidei`](https://www.pixiv.net/en/users/58442175 "Contiene enlaces a sus otras redes")',
            },
        ),
];

const flags = new CommandTags().add('COMMON');
const command = new Command('presentar', flags)
    .setAliases('presentacion', 'presentación', 'hola', 'saludar', 'presentarse', 'puré', 'pure')
    .setDescription('Me presento y digo cositas sobre mí~')
    .setExecution(async request => {
        return request.reply({ embeds });
    });

module.exports = command;
