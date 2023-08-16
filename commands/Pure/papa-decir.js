const { ChannelType } = require('discord.js');
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
        const deleteAfter = options.fetchFlag(args, 'borrar');
        const guildsCache = message.client.guilds.cache;
        let guild = options.fetchFlag(args, 'servidor', {
			callback: (x) => guildsCache.get(x) || guildsCache.find(g => g.name.toLowerCase().indexOf(x) !== -1)
		});
        let needch = false;
        if(!guild) guild = message.guild;
        else needch = true;
        const ccache = guild.channels.cache;
        let channel = options.fetchFlag(args, 'canal', {
			callback: (cs) => {
				if(cs.startsWith('<#') && cs.endsWith('>'))
					cs = cs.slice(2, -1);
				const channel = ccache.get(cs) || ccache.filter(c => c.type === ChannelType.GuildText).find(c => c.name.toLowerCase().indexOf(cs) !== -1);
                if(channel.type !== ChannelType.GuildText) return;
                return channel;
			}
		});

        if(!args.length)
            return message.reply({ content: '⚠️ tienes que especificar lo que quieres que diga.' });

        if(!channel) {
            if(!needch) channel = message.channel;
            else channel = guild.systemChannel;
        }
        if(!channel)
            return message.reply({ content: '⚠️ debes especificar un canal de la guild que ingresaste.' });
        
        if(deleteAfter && message.deletable && message.guild.members.me.permissions.has('ManageMessages'))
            message.delete().catch(auditError);

        return channel.send(args.join(' ').split(/ +#ENDL +/g).join('\n'));
    });

module.exports = command;