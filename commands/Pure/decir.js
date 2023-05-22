const { serverid } = require('../../localdata/config.json'); //Variables globales
const { Permissions } = require('discord.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");

const options = new CommandOptionsManager()
    .addParam('mensaje', 'TEXT', 'para especificar qué decir')
    .addFlag(['b', 'd'], ['borrar', 'delete'], 'para borrar el mensaje original');
const flags = new CommandMetaFlagsManager().add(
    'COMMON',
    'EMOTE',
);
const command = new CommandManager('decir', flags)
    .setAliases(
        'exclamar', 'escribir',
        'say', 'echo',
    )
    .setLongDescription('Me hace decir lo que quieras que diga')
    .setOptions(options)
    .setExecution(async (request, args, isSlash) => {
        const deleteFlag = options.fetchFlag(args, 'borrar');

        if(!(args.data ?? args).length)
            return request.reply({ content: ':warning: tienes que especificar lo que quieres que diga.' });

        const sentence = isSlash ? args.getString('mensaje') : args.join(' ');
        if(request.guild.id === serverid.saki && sentence.toLowerCase().indexOf(/h+(\W*_*)*o+(\W*_*)*u+(\W*_*)*r+(\W*_*)*a+(\W*_*)*i+(\W*_*)*/g) !== -1)
            return request.reply({ content: 'No me hagai decir weas de hourai, ¿yapo? Gracias <:haniwaSmile:1107847987201318944>' });
        
        if(!isSlash && deleteFlag && request.deletable && request.guild.members.me.permissions.has('ManageMessages'))
            request.delete();
        
        return request.reply({ content: sentence.split(/ +#[Nn] +/g).join('\n') });
    });

module.exports = command;