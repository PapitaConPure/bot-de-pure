const { Permissions } = require('discord.js');
const { fetchFlag } = require('../../func');
const { auditError } = require('../../systems/auditor');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('PAPA');
const options = new CommandOptionsManager()
    .addParam('mensaje', 'TEXT', 'para especificar qué decir')
    .addFlag('bd', ['borrar', 'delete'],            'para borrar el mensaje original')
    .addFlag('sg', ['servidor', 'server', 'guild'], 'para enviar en otro server', { name: 'sv', type: 'GUILD' })
    .addFlag('c',  ['canal', 'channel'],            'para enviar en otro canal',  { name: 'ch', type: 'CHANNEL' });
const command = new CommandManager('papa-decir', flags)
    .setDescription('Me hace decir lo que quieras que diga (privilegios elevados')
    .setOptions(options)
    .setExecution(async (message, args) => {
        const del = fetchFlag(args, { short: ['b', 'd'], long: ['borrar', 'delete'], callback: true });
        const gcache = message.client.guilds.cache;
        let guild = fetchFlag(args, {
			property: true,
			short: [ 's', 'g' ],
			long: [ 'server', 'guild' ],
			callback: (x,i) => gcache.get(x[i]) || gcache.find(g => g.name.toLowerCase().indexOf(x[i]) !== -1)
		});
        let needch = false;
        if(!guild) guild = message.guild;
        else needch = true;
        const ccache = guild.channels.cache;
        let channel = fetchFlag(args, {
			property: true,
			short: [ 'c' ],
			long: [ 'canal', 'channel' ],
			callback: (x,i) => {
				let cs = x[i];
				if(cs.startsWith('<#') && cs.endsWith('>'))
					cs = cs.slice(2, -1);
				return ccache.get(cs) || ccache.find(g => g.name.toLowerCase().indexOf(cs) !== -1);
			}
		});
        if(!args.length)
            return message.reply({ content: ':warning: tienes que especificar lo que quieres que diga.' });

        if(!channel) {
            if(!needch) channel = message.channel;
            else channel = guild.systemChannel;
        }
        if(!channel)
            return message.reply({ content: ':warning: debes especificar un canal de la guild que ingresaste.' });
        
        if(del && message.deletable && message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES))
            message.delete().catch(auditError);

        return message.reply(args.join(' ').split(/ +#ENDL +/g).join('\n'));
    });

module.exports = command;