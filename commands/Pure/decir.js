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
        'say', 'echo',
    ],
    desc: 'Me hace decir lo que quieras que diga',
    flags: [
        'common',
        'emote',
    ],
    options,
    callx: '<mensaje>',
    experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
        //Acción de comando
        const del = isSlash ? options.fetchFlag(args, 'borrar', { callback: true }) : fetchFlag(args, { ...options.flags.get('borrar').structure, callback: true });

        if(!(args.data ?? args).length)
            return await request.reply({ content: ':warning: tienes que especificar lo que quieres que diga.' });

        const sentence = isSlash ? args.getString('mensaje') : args.join(' ');
        if(request.guild.id === serverid.hourai && sentence.toLowerCase().indexOf(/h+(\W*_*)*o+(\W*_*)*u+(\W*_*)*r+(\W*_*)*a+(\W*_*)*i+(\W*_*)*/g) !== -1)
            return await request.channel.send({ content: 'No me hagai decir weas de hourai, ¿yapo? Gracias <:haniwaSmile:659872119995498507>' });
        
        await request.reply({ content: sentence.split(/ +#[Nn] +/g).join('\n') });
        if(!isSlash && del && request.deletable && request.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES))
            return await request.delete();
    },
};