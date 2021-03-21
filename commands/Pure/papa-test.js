//const Discord = require('discord.js'); //Integrar discord.js
//const global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
//const uwu = require('./uwu.js');

module.exports = {
	name: 'papa-test',
    desc: 'Comando de pruebas :flushed: :point_right: :point_left:',
    flags: [
        'papa'
    ],
    options: [

    ],
	
	execute(message, args) {
        //uwu.execute(message, args);
        /*message.channel.send(
            `Wena po <@${message.author.id}> conchetumare, como estai. Porfa revisa el canal <#671817759268536320> para que no te funemos <:haniwaSmile:659872119995498507> \n` +
            'También elige un rol de color reaccionando con <:FrenchDoll:819772377814532116><:OrleansDoll:819772377642041345><:HollandDoll:819772377624870973><:RussianDoll:819772377894354944><:LondonDoll:819772377856606228><:TibetanDoll:819772377482526741><:KyotoDoll:819772377440583691> cuando el ícono ":cinema:" aparezca <:mayuwu:654489124413374474> \n' +
            'Nota: si no lo haces, lo haré por ti, por aweonao <:junkNo:697321858407727224>\n' +
            'WENO YA PO CSM. <@&654472238510112799>, vengan a saludar maricones <:venAqui:668644938346659851><:miyoi:674823039086624808><:venAqui2:668644951353065500>\n' +
            `*Por cierto, ahora hay **${message.channel.guild.members.cache.filter(m => !m.user.bot).size}** wnes en el server* <:meguSmile:694324892073721887>\n` +
            'https://imgur.com/D5Z8Itb'
        ).then(sent => func.askColor(sent, message.member));*/
    },
};