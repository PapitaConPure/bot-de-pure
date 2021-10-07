const { fetchFlag } = require('../../func');
const { serverid } = require('../../localdata/config.json'); //Variables globales
const { Permissions } = require('discord.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const options = new CommandOptionsManager()
    .addParam('mensaje', 'TEXT', 'para especificar qué decir')
    .addFlag(['b', 'd'], ['borrar', 'delete'], 'para borrar el mensaje original');

module.exports = {
	name: 'decir',
    aliases: [
        'exclamar', 'escribir',
        'say', 'echo'
    ],
    desc: 'Me hace decir lo que quieras que diga',
    flags: [
        'common',
        'emote'
    ],
    options,
    callx: '<mensaje>',
	
	async execute(message, args) {
        //Acción de comando
        const del = fetchFlag(args, { short: ['b', 'd'], long: ['borrar', 'delete'], callback: true });

        if(!args.length) {
            message.channel.send({ content: ':warning: tienes que especificar lo que quieres que diga.' });
            return;
        }

        const sentence = args.join(' ');
        if(message.guild.id === serverid.hourai && sentence.toLowerCase().indexOf(/h+(\W*_*)*o+(\W*_*)*u+(\W*_*)*r+(\W*_*)*a+(\W*_*)*i+(\W*_*)*/g) !== -1){
            message.channel.send({ content: 'No me hagai decir weas de hourai, ¿yapo? Gracias <:haniwaSmile:659872119995498507>' });
            return;
        }
        
        await message.channel.send(sentence.split(/ +#[Nn] +/g).join('\n'));
        if(del && !message.deleted && message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES))
            await message.delete()
    },
};