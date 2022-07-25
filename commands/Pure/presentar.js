const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { readdirSync } = require('fs'); //Para el contador de comandos
const { tenshiColor } = require('../../localdata/config.json');
const { CommandMetaFlagsManager } = require('../Commons/commands');

const embed = new MessageEmbed()
    .setColor(tenshiColor)
    .setThumbnail('https://i.imgur.com/3Dp8zFa.jpg')
    .addField('Creador/Dueño', ':potato: Papita con Puré#6932', true)
    .addField('Participantes', ':horse: GoddamnBernkastel#7784\n:cowboy: Imagine Breaker#6299\n:poultry_leg: Sassafras#3331', true)
    .addField('Colaboradores', ':peach: Rakkidei#4790\n:face_with_monocle: Super Arathy\'s 12#8235\n:dog: Taton#0122', true)
    .addField('¡Permíteme presentarme!', '¡Hola! Soy __Bot de Puré__ (:female_sign:), un bot dedicado al entretenimiento con tecnologías de complemento de chat y de búsqueda de imágenes')
    .addField('Historia', 'Habiendo sido creado como un proyecto de prueba para un evento competitivo de una pequeña comunidad, actualmente me encuentro como un bot bastante decente y con varias funcionalidades extra que ya distorsionaron mi propósito original por completo')
    .addField('¡Juguemos juntos~♪!', '¡No dudes en investigar lo que puedo hacer! Al menos una risa te vas a llevar')
    .addField('Por cierto...', 'La mayoría de imágenes que Bot de Puré utiliza fueron dibujadas por Rakkidei, puedes seguirlo en [Twitter](https://twitter.com/rakkidei) y [pixiv](https://www.pixiv.net/en/users/58442175) (donde también puedes encontrar sus otras redes y demás)')
    .addField('Comandos', `¡Ofrezco ${readdirSync('./commands/Pure').filter(file => file.endsWith('.js')).length} comandos en total!`)
    .addField('Comentario de mi padre', '_"Quiero café. Necesito café, ya."_');

module.exports = {
	name: 'presentar',
    aliases: [
        'presentacion', 'presentación', 'hola', 'saludar', 'presentarse', 'puré', 'pure'
    ],
    desc: 'Me presento y digo cositas sobre mí~',
    flags: new CommandMetaFlagsManager().add('COMMON'),
    experimental: true,
	
	async execute(request, _, isSlash = false) {
        if(!embed.author)
            embed.setAuthor({ name: 'Presentación', iconURL: request.client.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }) });
        return request.reply({ embeds: [embed] });
    },
};