const { Permissions } = require('discord.js');
const { fetchFlag } = require('../../func');
const global = require('../../localdata/config.json'); //Variables globales
const decir = require('./decir.js');

module.exports = {
	name: 'papa-decir',
    desc: 'Me hace decir lo que quieras que diga (permite que me diga comandos a mí misma)',
    flags: [
        'papa'
    ],
    options: [
        '`<mensaje>` _(texto)_ para especificar qué decir',
        '`-b` o `--borrar` para borrar el mensaje original',
        '`-s <sv>` o `--server <sv>` _(server)_ para enviar en otro server',
        '`-c <ch>` o `--canal <ch>` _(canal)_ para enviar en otro canal'
    ],
    callx: '<mensaje>',
	
	async execute(message, args) {
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
        if(!args.length) {
            message.channel.send({ content: ':warning: tienes que especificar lo que quieres que diga.' });
            return;
        }
        console.log(needch, guild ? guild.name : null, channel ? channel.name : null);
        if(!channel) {
            if(!needch) channel = message.channel;
            else channel = guild.systemChannel;
        }
        if(!channel) {
            message.channel.send({ content: ':warning: debes especificar un canal de la guild que ingresaste.' });
            return;
        }
        
        await channel.send(args.join(' ').split(/ +#ENDL +/g).join('\n'));
        global.cansay = 2;
        if(del && !message.deleted && message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES))
            await message.delete()
    },
};