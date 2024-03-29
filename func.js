const Discord = require('discord.js'); //Discord.js
const global = require('./localdata/config.json'); //Variables globales
const images = require('./localdata/images.json'); //Imágenes globales
const { p_pure } = require('./localdata/customization/prefixes.js'); //Imágenes globales
const Canvas = require('canvas'); //Node Canvas
const chalk = require('chalk'); //Consola con formato bonito
const { colorsRow } = require('./localdata/houraiProps');
const { ButtonStyle, ChannelType } = require('discord.js');
const { fetchUserCache } = require('./usercache');
const Hourai = require('./localdata/models/hourai');
const concol = {
    orange: chalk.rgb(255, 140, 70),
    purple: chalk.rgb(158, 114,214),
};

module.exports = {
    //#region Lista
    /**
     * @template T
     * @param {Array<T> | Discord.Collection<Discord.Snowflake, T>} array 
     * @param {Number?} pagemax
     * @returns {Array<Array<T>> | Array<Array<[Discord.Snowflake, T]>>}
     */
    paginateRaw: function(array, pagemax = 10) {
        if(!Array.isArray(array))
            array = [...array.entries()];

		return array
            .map((_, i) => (i % pagemax === 0) ? array.slice(i, i + pagemax) : null)
            .filter(item => item);
    },

    /**
     * @param {Array | Discord.Collection} array 
     * @param {{
     *  pagemax: Number?,
     *  format: Function?,
     * }} itemsOptions 
     * @returns {Array<Array<*>>}
     */
    paginate: function(array, itemsOptions = { pagemax: 10, format: item => `\`${item.name.padEnd(24)}\`${item}` }) {
        const { pagemax, format } = itemsOptions;
		return module.exports.paginateRaw(array, pagemax)
            .map(page => page.map(format).join('\n'));
    },
    //#endregion

    //#region Temporizadores
    /**
     * Crea una promesa que dura la cantidad de milisegundos ingresados
     * @param {Number} ms
     * @returns {Promise<void>}
     */
    sleep: function(ms) {
        if(typeof ms !== 'number') throw 'Se esperaba un número de milisegundos durante el cuál esperar';
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * @param {Discord.GuildMember} miembro
     * @param {Discord.TextChannel} canal
     * @param {Number} rep
     */
    askForRole: async function(miembro, canal, rep) {
        const reps = 4;
        console.log(chalk.cyan('Comprobando miembro nuevo en Saki Scans para petición de rol de color...'));
        if(!canal.guild.members.cache.has(miembro.id)) {
            console.log(chalk.red(`El miembro se fue del servidor. Abortando.`));
            return canal.send({ content: `Se murió el wn de <@${miembro.user.id}> po <:mayuwu:1107843515385389128>` });
        }
        console.log(concol.orange('El miembro sigue en el servidor'));
        const hasColor = module.exports.hasColorRole(miembro);

        //Comprobación constante para ver si el miembro ya tiene roles de colores
        if(hasColor) {
            console.log(chalk.green(`El miembro ha recibido sus roles básicos.`));
            canal.send({ content: `Weno **${miembro.user.username}**, ya teni tu rol, q esti bien po <:junky:1107847993484386304>` });

            //Finalizar
            return setTimeout(module.exports.finalizarHourai, 1000, miembro, canal);
        }

        if(rep > 0)
            return setTimeout(module.exports.askForRole, 1000 * 60 / reps, miembro, canal, rep - 1);
        
        if(!miembro.roles.cache.has('1107831054791876691')) {
            console.log(chalk.magenta('El miembro está retenido.'));
            global.hourai.warn++;
            if(global.hourai.warn <= 6) {
                if(global.hourai.warn <= 3)
                    canal.send({ content: `Oigan cabros, creo que a este qliao (<@${miembro.user.id}>) lo mató Hourai <:mayuwu:1107843515385389128> (${global.hourai.warn}/3 llamados)` });
                setTimeout(module.exports.askForRole, 1000, miembro , canal, reps);
                console.log(chalk.cyan(`Volviendo a esperar confirmación de miembro (${global.hourai.warn}/6)...`));
            }
            return;
        }

        console.log(chalk.yellow('El miembro no ha recibido roles básicos.'));
        await canal.send({
            content: `Oe <@${miembro.user.id}> conchetumare vai a elegir un rol o te empalo altoke? <:mayuwu:1107843515385389128>`,
            files: [global.hourai.images.colors],
            components: [colorsRow],
        });
        setTimeout(module.exports.forceRole, 1000, miembro, canal, 2 * reps);
        console.log(chalk.magentaBright(`Esperando comprobación final de miembro en unos minutos...`));
    },
    
    /**
     * 
     * @param {Discord.GuildMember} miembro 
     * @param {Discord.TextChannel} canal 
     * @param {Number} rep 
     * @returns 
     */
    forceRole: function(miembro, canal, rep) {
        const reps = 4;
        console.log(chalk.cyan('Comprobando miembro nuevo en Saki Scans para forzado de rol de color'));
        if(!canal.guild.members.cache.get(miembro.id))
            return canal.send({ content: `Se fue cagando el <@${miembro?.user.id ?? 'nose'}> csm <:mayuwu:1107843515385389128>` }).catch(() => {});

        console.log(concol.orange('El miembro sigue en el servidor'));
        const hasColor = module.exports.hasColorRole(miembro);
        
        if(hasColor) {
            console.log(chalk.green('El miembro ya tiene los roles básicos.'));
            canal.send({ content: `Al fin qliao ya teni tu rol. Q esti bien **${miembro.user.username}**, po <:uwu:681935702308552730>` }).catch(() => {});

            //Finalizar
            return setTimeout(module.exports.finalizarHourai, 1000, miembro, canal);
        }

        if(rep > 0) {
            setTimeout(module.exports.forceRole, 1000 * 60 / reps, miembro, canal, rep - 1);
            return;
        }

        try {
            console.log(chalk.magentaBright('El miembro requiere roles básicos. Forzando roles...'));
            const colores = global.hourai.colorsList.map(c => c.roleId);
            canal.send({
                content:
                    `**${miembro.user.username}**, cagaste altiro watón fome <:tenshiSmug:1108791369897607219>\n` +
                    `Toma un rol random po <:mayuwu:1107843515385389128> <:hr:797294230463840267>`,
                files: [global.hourai.images.forcecolors]
            });
            miembro.roles.add(colores[Math.floor(Math.random() * 7)]);
            console.log(chalk.greenBright('Roles forzados.'));

            //Finalizar
            setTimeout(module.exports.finalizarHourai, 1000, miembro, canal);
        } catch(e) {
            console.log(chalk.red('El miembro ya no tiene ningún rol básico.'));
            console.error(e);
            canal.send({ content: `Espérate qué weá pasó con **${miembro.user.username}** <:reibu:1107876018171162705>\nOh bueno, ya me aburrí... chao.` }).catch(() => {});
        }
    },
    //#endregion

    //#region Comprobadores
    /**
     * @param {Discord.GuildMember} member
     */
    isNotModerator: (member) => !(member.permissions.has('ManageRoles') || member.permissions.has('ManageMessages')),

    /**
     * @param {Discord.User | Discord.GuildMember} user
     */
    isUsageBanned: async function(user) {
        const userCache = await fetchUserCache(user.id);
        return userCache.banned;
    },

    /**@param {Discord.GuildMember} member*/
    hasColorRole: function(member) {
        return member?.roles?.cache?.hasAny(...global.hourai.colorsList.map(c => c.roleId));
    },

    /**@param {Discord.GuildMember} member*/
    isBoosting: function(member) {
        return member.roles.premiumSubscriberRole ? true : false;
    },

    /**
     * 
     * @param {Discord.GuildChannel} channel 
     * @returns {Boolean}
     */
    isThread: function(channel) {
        return [ ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread ].includes(channel.type);
    },
    
    /**@param {import('discord.js').TextChannel} channel*/
    channelIsBlocked: function(channel) {
        const member = channel?.guild?.members.me;
        if(!member?.permissionsIn(channel)?.any?.([ 'SendMessages', 'SendMessagesInThreads' ], true)) return true;
        if(global.maintenance.length === 0) return false;

        return (global.maintenance.startsWith('!'))
            ? channel.id === global.maintenance.slice(1)
            : channel.id !== global.maintenance;
    },
    //#endregion

    //#region Anuncios
    /**
     * 
     * @param {Discord.GuildMember} miembro 
     * @param {Discord.TextChannel} canal 
     */
    finalizarHourai: function(miembro, canal) {
        //Mensaje de fin de bienvenida
        try {
            canal.send({
                content: [
                    //`Una última cosita ${miembro}, recuerda revisar el canal <#671817759268536320> en algún momento <:Junkoborga:751938096550903850>`,
                    //`También, si te interesa, puedes revisar los mensajes pinneados de este canal <:tenshipeacheems:854408293258493962>`,
                    `Okay, ya \'tamos ${miembro}, recuerda convivir adecuadamente con el resto <:comodowo:1107847983065747476>`,
                    'Si te interesa, puedes revisar los mensajes pinneados de este canal <:tenshiJuguito:1107843487891734588>',
                    'Y estate tranqui, que ya no vas a recibir tantos pings <:dormidowo:1108318689624866846>',
                    `Dicho esto, ¡disfruta el server po\'! Si quieres más roles, puedes usar \`${p_pure(global.serverid.saki).raw}roles\``,
                ].join('\n')
            });

            //Sugerir p!suicidio con 41% de probabilidad
            if(Math.random() < 0.3)
                setTimeout(() => {
                    canal.send({
                        content: `Por cierto, tenemos una tradición un poco más oscura. ¿Te atrevei a usar \`${p_pure(global.serverid.saki).raw}suicidio\`?`
                    });
                }, 1000 * 5);

            //Otorgar rol con 50% de probabilidad
            const gr = canal.guild.roles.cache;
            const role50 = gr.find(r => r.name.includes('Rol con 50% de probabilidades de tenerlo'));
            if(role50 && Math.random() < 0.5)
                miembro.roles.add(role50);
        } catch(e) {
            console.error(e);
        }
    },

    /**
     * Dibuja un avatar circular con Node Canvas
     * @param {Canvas.NodeCanvasRenderingContext2D} ctx El Canvas context2D utilizado
     * @param {Discord.User} user El usuario del cual dibujar la foto de perfil
     * @param {Number} xcenter La posición X del centro del círculo
     * @param {Number} ycenter La posición Y del centro del círculo
     * @param {Number} radius El radio del círculo
     * @param {{
     *  circleStrokeColor: String='#000000', 
     *  circleStrokeFactor: Number=0.02,
     * }} options 
     * @returns {Promise<void>}
     */
    dibujarAvatar: async function(ctx, user, xcenter, ycenter, radius, options = { circleStrokeColor: '#000000', circleStrokeFactor: 0.02 }) {
        //Fondo
        ctx.fillStyle = '#36393f';
        ctx.arc(xcenter, ycenter, radius, 0, Math.PI * 2, true);
        ctx.fill();

        //Foto de perfil
        ctx.strokeStyle = options.strokeColor;
        ctx.lineWidth = radius * 0.33 * options.strokeFactor;
        ctx.arc(xcenter, ycenter, radius + ctx.lineWidth, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.arc(xcenter, ycenter, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png', size: 1024 }));
        ctx.drawImage(avatar, xcenter - radius, ycenter - radius, radius * 2, radius * 2);
        ctx.restore();
    },

    /**
     * 
     * @param {Discord.GuildMember} miembro 
     * @param {*} forceHourai 
     * @returns 
     */
    dibujarBienvenida: async function(miembro, forceHourai = false) {
        //Dar bienvenida a un miembro nuevo de un servidor
        const servidor = miembro.guild; //Servidor

        const canal = servidor.channels.cache.get(servidor.systemChannelId); //Canal de mensajes de sistema
        //#region Comprobación de miembro y servidor
        if(canal === undefined) {
            console.log(chalk.blue('El servidor no tiene canal de mensajes de sistema.'));
            servidor.fetchOwner().then(ow => ow.user.send({
                content:
                    '¡Hola, soy Bot de Puré!\n' +
                    `¡Un nuevo miembro, **<@${miembro.id}> (${miembro.id})**, ha entrado a tu servidor **${servidor.name}**!\n\n` +
                    '*Si deseas que envíe una bienvenida a los miembros nuevos en lugar de enviarte un mensaje privado, selecciona un canal de mensajes de sistema en tu servidor.*\n' +
                    '*__Nota:__ Bot de Puré no opera con mensajes privados.*'
            }));
            return;
        }

        console.log(concol.purple`Un usuario ha entrado a ${servidor.name}...`);
        if(!servidor.members.me.permissionsIn(canal).has([ 'SendMessages', 'ViewChannel' ])) {
            console.log(chalk.red('No se puede enviar un mensaje de bienvenida en este canal.'));
            return;
        }
        canal.sendTyping();
        //#endregion
        
        //#region Creación de imagen
        const canvas = Canvas.createCanvas(1275, 825);
        const ctx = canvas.getContext('2d');

        const fondo = await Canvas.loadImage((servidor.id === global.serverid.saki) ? global.hourai.images.welcome : images.announcements.welcome);
        ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
        //#endregion

        //#region Texto
        //#region Propiedades de texto
        const strokeFactor = 0.09;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        //#endregion

        //#region Nombre del usuario
        ctx.textBaseline = 'top';
		ctx.textAlign = 'center';
        const xcenter = canvas.width / 2;
        let Texto = `${miembro.displayName}`;
        let fontSize = 100;
        ctx.font = `bold ${fontSize}px "headline"`;
        console.log(fontSize);
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, xcenter, 15);
        ctx.fillText(Texto, xcenter, 15);
        //#endregion
        
        //#region Texto inferior
        ctx.textBaseline = 'bottom';
        if(servidor.id === global.serverid.ar) Texto = 'Animal Realm!';
        else Texto = `${servidor.name}!`;
        fontSize = 100;
        ctx.font = `bold ${fontSize}px "headline"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, xcenter, canvas.height - 15);
        ctx.fillText(Texto, xcenter, canvas.height - 15);
        Texto = '¡Bienvenid@ a';
        ctx.lineWidth = Math.ceil(56 * strokeFactor);
        ctx.font = `bold 56px "headline"`;
        ctx.strokeText(Texto, xcenter, canvas.height - fontSize - 20);
        ctx.fillText(Texto, xcenter, canvas.height - fontSize - 20);
        //#endregion
        //#endregion
        
        await module.exports.dibujarAvatar(ctx, miembro.user, canvas.width / 2, (canvas.height - 56) / 2, 200, { circleStrokeFactor: strokeFactor });
        
        const imagen = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'bienvenida.png' });

        //#region Imagen y Mensaje extra
        const members = await servidor.members.fetch().catch(_ => servidor.members.cache);
        const peoplecnt = members.filter(member => !member.user.bot).size;
        if(forceHourai || servidor.id === global.serverid.saki) {
            const hourai = await Hourai.findOne() || new Hourai();
            if(hourai.configs?.bienvenida == false)
                return;
            
            await canal.send({files: [imagen]});

            const toSend = [
                `Wena po <@${miembro.user.id}> conchetumare, como estai.`,
                'Como tradición, elige un color con el menú de abajo <:mayuwu:1107843515385389128>',
                'Nota: si no lo haces, lo haré por ti, por aweonao <:junkNo:1107847991580164106>',
            ];

            if(hourai.configs?.pingBienvenida)
                toSend.push('<@&1107831054791876694>, vengan a saludar po maricones <:hl:797294230359375912><:miyoi:1107848008005062727><:hr:797294230463840267>');

            toSend.push(`*Por cierto, ahora hay **${peoplecnt}** wnes en el server* <:meguSmile:1107880958981587004>`);
            toSend.push(global.hourai.images.colors);

            hourai.save().catch(_ => undefined);

            return canal.send({
                content: toSend.join('\n'),
                components: [colorsRow],
            }).then(sent => {
                setTimeout(module.exports.askForRole, 1000, miembro, canal, 3 * 4);
                console.log('Esperando evento personalizado de Saki Scans en unos minutos...');
                return sent;
            });
        } else
            await canal.send({files: [imagen]});
        
        return canal.send({
            content:
                `¡Bienvenido al servidor **${miembro.displayName}**!\n` +
                `*Ahora hay **${peoplecnt}** usuarios en el server.*`
        });
        //#endregion
    },

    /**
     * 
     * @param {Discord.GuildMember} miembro 
     * @returns 
     */
    dibujarDespedida: async function(miembro) {
        //Dar despedida a ex-miembros de un servidor
        const servidor = miembro.guild;
        const canal = servidor.channels.cache.get(servidor.systemChannelId);

        //#region Comprobación de miembro y servidor
        if(!canal) {
            console.log('El servidor no tiene canal de mensajes de sistema.');
            return;
        }

        console.log(`Un usuario ha salido de ${servidor.name}...`);
        if(!servidor.members.me.permissionsIn(canal).has(['SendMessages', 'ViewChannel'])) {
            console.log('No se puede enviar un mensaje de despedida en este canal.');
            return;
        }
        canal.sendTyping();
        //#endregion
        
        //#region Creación de imagen
        const canvas = Canvas.createCanvas(1500, 900);
        const ctx = canvas.getContext('2d');

        const fondo = await Canvas.loadImage(images.announcements.farewell);
        ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
        //#endregion

        //#region Texto
        //#region Propiedades de Texto
        const strokeFactor = 0.09;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        //#endregion

        //#region Nombre del usuario
        ctx.textBaseline = 'bottom';
		ctx.textAlign = 'center';
        const xcenter = canvas.width / 2;
        let Texto = `Adiós, ${miembro.displayName}`;
        let fontSize = 90;
        ctx.font = `bold ${fontSize}px "headline"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, xcenter, canvas.height - 40);
        ctx.fillText(Texto, xcenter, canvas.height - 40);
        //#endregion
        //#endregion

        await module.exports.dibujarAvatar(ctx, miembro.user, canvas.width / 2, 80 + 200, 200, { circleStrokeFactor: strokeFactor });

        //#region Imagen y Mensaje extra
        const imagen = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'despedida.png' });
        const members = await servidor.members.fetch().catch(_ => servidor.members.cache);
        const peoplecnt = members.filter(member => !member.user.bot).size;
        if(servidor.id === global.serverid.saki) {
            const hourai = await Hourai.findOne() || new Hourai();
            if(hourai.configs?.despedida == false)
                return;

            await canal.send({ files: [imagen] });
            await canal.send({
                content:
                    'Nooooo po csm, perdimo otro weón <:meguDerp:1107848004775465032>\n' +
                    `*Ahora quedan **${peoplecnt}** aweonaos en el server.*`
            });

            hourai.save().catch(_ => undefined);
        } else { //Otros servidores
            await canal.send({ files: [imagen] });
            await canal.send({ content: `*Ahora hay **${peoplecnt}** usuarios en el server.*`});
        }
        
        //#endregion
        console.log('Despedida finalizada.');
    },
    //#endregion

    //#region Fetch
    /**
     * Extrae una ID de usuario de una mención
     * @param {String} data 
     * @returns {String}
     */
    extractUserID(data) {
        if(data.startsWith('<@') && data.endsWith('>')) {
            data = data.slice(2, -1);
            if(data.startsWith('!')) data = data.slice(1);
        }
        return data;
    },
    
    /**
     * Busca un usuario basado en la data ingresada.
     * Devuelve el usuario que más coincide con el término de búsqueda y contexto actual (si se encuentra alguno). Si no se encuentra ningún usuario, se devuelve undefined.
     * @param {Discord.User | String} data 
     * @param {{ guild: Discord.Guild, client: Discord.BaseClient }} param1 
     * @returns { Discord.User }
     */
    fetchUser: function(data, { guild, client }) {
        if(!data) return;
        if(!guild || !client) throw 'Se requiere la guild actual y el cliente en búsqueda de usuario';
        if(data.username) return data;
        
        const uc = client.users.cache;
        //console.log(`Buscando: ${data}`);
        //Descifrar posible mención
        data = module.exports.extractUserID(data);
        
        //Prioridad 1: Intentar encontrar por ID
        //console.log('Prioridad 1 alcanzada');
        if(!isNaN(data)) return uc.find(u => u.id === data);

        //Prioridad 2: Intentar encontrar por tag
        //console.log('Prioridad 2 alcanzada');
        data = data.toLowerCase();
        const taggeduser = uc.find(u => u.tag.toLowerCase() === data);
        if(taggeduser) return taggeduser;

        //Prioridad 3: Intentar encontrar por nombre de usuario en guild actual
        //console.log('Prioridad 3 alcanzada: nombres de usuario en servidor');
        const cmpnames = (a, b) => (a.toLowerCase().indexOf(data) <= b.toLowerCase().indexOf(data) && a.length <= b.length);
        let people = guild.members.cache.map(m => m.user).filter(u => u.username.toLowerCase().indexOf(data) !== -1);
        if(people.length)
            return people
                .sort()
                .reduce((a, b) => cmpnames(a.username, b.username)?a:b);

        //Prioridad 4: Intentar encontrar por apodo en guild actual
        //console.log('Prioridad 4 alcanzada: apodos en servidor');
        people = guild.members.cache.filter(m => m.nickname && m.nickname.toLowerCase().indexOf(data) !== -1);
        if(people.size)
            return people
                .sort()
                .reduce((a, b) => cmpnames(a.nickname, b.nickname)?a:b)
                .user;
        
        //Prioridad 5: Intentar encontrar por nombre de usuario en cualquier guild
        //console.log('Prioridad 5 alcanzada: nombres de usuario globales');
        people = uc.filter(u => u.username.toLowerCase().indexOf(data) !== -1);
        if(people.size)
            return people
                .sort()
                .reduce((a, b) => cmpnames(a.username, b.username)?a:b);

        //Búsqueda sin resultados
        //console.log('Sin resultados');
        return undefined;
    },

    /**
     * Busca un usuario basado en la data ingresada.
     * Devuelve el usuario que más coincide con el término de búsqueda y contexto actual (si se encuentra alguno). Si no se encuentra ningún usuario, se devuelve undefined.
     * @param {String} data 
     * @param {{ guild: Discord.Guild, client: Discord.Client }} param1 
     * @returns { Discord.GuildMember }
     */
    fetchMember: function(data, { guild: thisGuild, client }) {
        if(!data) return;
        if(!thisGuild || !client) throw 'Se requiere la guild actual y el cliente en búsqueda de miembro';
        // console.time('Buscar miembro');
        
        const otherGuilds = client.guilds.cache.filter(g => g.id !== thisGuild.id);
        data = module.exports.extractUserID(data);
        
        //Prioridad 1: Intentar encontrar por ID o tag
        let searchFn = (m) => m.id === data
        if(isNaN(data)) {
            data = data.toLowerCase();
            searchFn = (m) => m.tag.toLowerCase();
        }

        let member = thisGuild.members.cache.find(m => m.id === data);
        if(member) return member;
        member = otherGuilds.map(guild => guild.members.cache.find(m => m.id === data)).find(m => m);
        if(member) return member;

        //Prioridad 3: Intentar encontrar por nombre de usuario en guild actual
        const compareNames = (a, b) => (a.toLowerCase().indexOf(data) <= b.toLowerCase().indexOf(data) && a.length <= b.length);
        {
            const people = thisGuild.members.cache.filter(m => m.user.username.toLowerCase().indexOf(data) !== -1);
            if(people.size)
                return people
                    .sort()
                    .reduce((a, b) => compareNames(a.user.username, b.user.username) ? a : b);
        }

        //Prioridad 4: Intentar encontrar por apodo en guild actual
        {
            const people = thisGuild.members.cache.filter(m => m.nickname && m.nickname.toLowerCase().indexOf(data) !== -1);
            if(people.size)
                return people
                    .sort()
                    .reduce((a, b) => compareNames(a.nickname, b.nickname) ? a : b);
        }
        //Prioridad 5: Intentar encontrar por nombre de usuario en cualquier guild
        {
            const people = otherGuilds.map(guild => guild.members.cache.find(m => m.user.username.toLowerCase().indexOf(data) !== -1)).filter(m => m);
            if(people.length)
                return people
                    .sort()
                    .reduce((a, b) => compareNames(a.user.username, b.user.username) ? a : b);
        }
        // console.timeEnd('Buscar miembro');

        //Búsqueda sin resultados
        return undefined;
    },

    /**
     * Busca un usuario basado en la data ingresada.
     * Devuelve la ID del usuario que más coincide con el término de búsqueda y contexto actual (si se encuentra alguno). Si no se encuentra ningún usuario, se devuelve undefined.
     * @param {String} data 
     * @param {{ guild: Discord.Guild, client: Discord.BaseClient }} param1 
     * @returns {String}
     */
    fetchUserID: function(data, { guild, client }) {
        const user = module.exports.fetchUser(data, { guild, client });
        return (user === undefined) ? undefined : user.id;
    },

    /**
     * Busca un canal basado en la data ingresada.
     * Devuelve el canal que coincide con el término de búsqueda y contexto actual (si se encuentra alguno). Si no se encuentra ningún canal, se devuelve undefined.
     * @param {String} data 
     * @param {Discord.Guild} guild 
     * @returns {Discord.Channel}
     */
    fetchChannel: function(data, guild) {
        if(!data)
            return;

        const ccache = guild.channels.cache;
        if(data.startsWith('<#') && data.endsWith('>'))
            data = data.slice(2, -1);

        const channel = ccache.get(data) || ccache.filter(c => [ ChannelType.GuildText, ChannelType.GuildVoice ].includes(c.type)).find(c => c.name.toLowerCase().includes(data));

        if(!channel)
            return;
        if(![ ChannelType.GuildText, ChannelType.GuildVoice ].includes(channel.type))
            return;

        return channel;
    },

    /**
     * Busca un mensaje basado en la data ingresada.
     * Devuelve el mensaje que coincide con el término de búsqueda y contexto actual (si se encuentra alguno). Si no se encuentra ningún canal, se devuelve undefined.
     * @param {String} data 
     * @param {{ guild: Discord.Guild, channel: Discord.TextChannel }} channel 
     * @returns {Promise<Discord.Message>}
     */
    fetchMessage: async function(data, { guild, channel }) {
        const acceptedChannelTypes = [
            ChannelType.GuildText,
            ChannelType.GuildVoice,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.AnnouncementThread,
        ];

        console.log({ channelType: channel.type });

        if(!acceptedChannelTypes.includes(channel.type))
            return;

        const messages = channel.messages;
        let message = await messages.fetch(data);
        console.log({ data, message });

        if(!message) return;
        if(!acceptedChannelTypes.includes(message.channel.type)) return;
        return message;
    },

    /**
     * Busca un canal basado en la data ingresada.
     * Devuelve el canal que coincide con el término de búsqueda y contexto actual (si se encuentra alguno). Si no se encuentra ningún canal, se devuelve undefined.
     * @param {String} data 
     * @param {Discord.Guild} guild 
     * @returns {Discord.Role}
     */
    fetchRole: function(data, guild) {
        const rcache = guild.roles.cache;
        if(data.startsWith('<@&') && data.endsWith('>'))
            data = data.slice(3, -1);
        const role = rcache.get(data) || rcache.filter(r => r.name !== '@everyone').find(r => r.name.toLowerCase().includes(data));
        if(!role) return;
        return role;
    },

    /**
     * @deprecated
     * @param {Discord.Collection<Discord.Snowflake, Discord.Emoji>} emojiscache
     * @returns {[ Discord.Emoji, Discord.Emoji ]}
     */
    fetchArrows: (emojiscache) => [emojiscache.get('681963688361590897'), emojiscache.get('681963688411922460')],

    /**
     * @deprecated
     * @param {Array<String>} args
     * @param {{
     *  property: Boolean
     *  short: Array<String>
     *  long: Array<String>
     *  callback: *
     *  fallback: *
     * }} flag
     */
    fetchFlag: function(args, flag = { property, short: [], long: [], callback, fallback }) {
        //Ahorrarse procesamiento en vano si no se ingresa nada
        if(!args.length) return typeof flag.fallback === 'function' ? flag.fallback() : flag.fallback;

        let target; //Retorno. Devuelve callback si se ingresa la flag buscada de forma válida, o fallback si no
        const isFunc = (typeof flag.callback === 'function');

        if(!isFunc) {
            if(flag.property)
                throw TypeError('Las flags de propiedad deben llamar una función.');
            const temp = flag.callback;
            flag.callback = () => { return temp; }
        }

        //Recorrer parámetros e intentar procesar flags
        args.forEach((arg, i) => {
            if(flag.property && i === (args.length - 1))
                return;

            arg = arg.toLowerCase();
            if(flag.long?.length && arg.startsWith('--')) {
                if(flag.long.includes(arg.slice(2))) {
                    target = flag.property
                        ? flag.callback(args, i + 1)
                        : flag.callback();
                    args.splice(i, flag.property?2:1);
                }
                return;
            }

            if(!flag.short?.length || !arg.startsWith('-'))
                return;
            
            for(c of arg.slice(1)) {
                if(!flag.short.includes(c))
                    continue;

                target = flag.property
                    ? flag.callback(args, i + 1)
                    : flag.callback();

                if(arg.length <= 2) {
                    args.splice(i, flag.property ? 2 : 1);
                    continue;
                }

                const charactersToRemove = new RegExp(c, 'g')
                let temp = args.splice(i, flag.property ? 2 : 1);
                args.push(temp[0].replace(charactersToRemove, ''));
                if(flag.property) args.push(temp[1]);
            }
		});

        return target ? target : (typeof flag.fallback === 'function' ? flag.fallback() : flag.fallback);
    },
    
    /**
     * @deprecated
     * @param {Array<String>} args 
     * @param {Number} i 
     */
    fetchSentence: function(args, i) {
        if(i == undefined || i >= args.length)
            return undefined;
        if(!args[i].startsWith('"'))
            return args.splice(i, 1)[0];
    
        let last = i;
        let text;
        while(last < args.length && !args[last].endsWith('"'))
            last++;
        text = args.splice(i, last - i + 1).join(' ').slice(1);
    
        if(text.length === 0 || text === '"')
            return undefined;
    
        return text.endsWith('"') ? text.slice(0, -1) : text;
    },
    //#endregion

    //#region Otros
    /**
     * Devuelve el primer emoji global encontrado en el string
     * @param {String} emoji 
     * @returns {String?}
     */
    defaultEmoji: function(emoji) {
        if(!typeof emoji == 'string') return null;
        return emoji.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu)?.[0]; //Expresión RegExp cursed
    },

    /**
     * Devuelve el primer emoji de servidor encontrado con el string
     * @param {String} emoji 
     * @param {import('discord.js').Guild} guild 
     * @returns {Discord.Emoji?}
     */
    guildEmoji: function(emoji, guild) {
        if(typeof emoji !== 'string') return null;
        if(!guild.emojis) throw TypeError('Debes ingresar una Guild');
        const parsedEmoji = emoji.match(/^<a*:\w+:[0-9]+>\B/gu)?.[0];
        if(!parsedEmoji)
            return guild.emojis.cache.find(e => e.name === emoji) || null;
        return guild.emojis.resolve(parsedEmoji);
    },

    /**
     * Devuelve el primer emoji global o de servidor encontrado en el string
     * @param {String} emoji 
     * @param {import('discord.js').Guild} guild 
     * @returns {Discord.Emoji | String | null}
     */
    emoji: (emoji, guild) => module.exports.defaultEmoji(emoji) ?? module.exports.guildEmoji(emoji, guild),

    /**
     * Devuelve un valor acomodado al rango facilitado
     * @param {Number} value El valor a acomodar
     * @param {Number} min El mínimo del rango
     * @param {Number} max El máximo del rango
     */
    clamp: function(value, min, max) {
        if(min > max) {
            const temp = min;
            min = max;
            max = temp;
        }

        return Math.max(min, Math.min(value, max));
    },

    /**
     * Devuelve el valor mediano del conjunto especificado
     * @param {...Number} values Los valores del conjunto
     */
    median: function(...values) {
        if(!values.length) throw RangeError('Se esperaba al menos 1 número');
        values = values.sort((a, b) => a - b);
        const lowestHalf = Math.floor(values.length / 2);
        if(values.length % 2)
            return values[lowestHalf];
        return (values[lowestHalf] + values[lowestHalf + 1]) / 2;
    },

    /**
     * Devuelve un valor aleatorio entre 0 y otro valor
     * @param {Number} maxExclusive Máximo valor; excluído del resultado
     * @param {false | undefined} round Si el número debería ser redondeado hacia abajo
     * @returns 
     */
    rand: function(maxExclusive, round = true) {
        maxExclusive = 1 * maxExclusive;
        const negativeHandler = (maxExclusive < 0) ? -1 : 1;
        maxExclusive = maxExclusive * negativeHandler;
        const value = ((global.seed + maxExclusive * Math.random()) % maxExclusive) * negativeHandler;
        return round ? Math.floor(value) : value;
    },

    /**
     * Devuelve un valor aleatorio dentro de un rango entre 2 valores
     * @param {Number} minInclusive Mínimo valor; puede ser incluído en el resultado
     * @param {Number} maxExclusive Máximo valor; excluído del resultado
     * @param {false | undefined} round Si el número debería ser redondeado hacia abajo
     * @returns 
     */
    randRange: function(minInclusive, maxExclusive, round = true) {
        minInclusive = 1 * minInclusive;
        maxExclusive = 1 * maxExclusive;
        const range = maxExclusive - minInclusive;
        const value = minInclusive + ((global.seed + range * Math.random()) % range);
        return round ? Math.floor(value) : value;
    },

    /**
     * Devuelve un elemento aleatorio dentro de la Array especificada
     * @template T
     * @param {Array<T>} array 
     * @returns {T} elemento
     */
    randInArray: function(array) {
        const randomIndex = module.exports.rand(array.length);
        return array[randomIndex];
    },
    
    /**
     * Subdivide una array en partes del tamaño ingresado, resultando en una array conteniendo las sub-arrays obtenidas
     * @template T
     * @param {Array<T>} array 
     * @param {Number} divisionSize 
     * @returns {Array<Array<T>>} elemento
     */
    subdivideArray: function(array, divisionSize) {
        if(!array.length) return [[]];

        const subdivided = [];
        for (let i = 0; (i * divisionSize) < array.length; i++) {
            const j = i * divisionSize;
            subdivided[i] = array.slice(j, j + divisionSize);
        }
        return subdivided;
    },

    /**
     * Agrega filas de control de navegación de páginas.
     * 
     * Tanto `loadPage` como `loadPageExact` cumplen la función de ir a un número de página resaltado.
     * La diferencia es que en `loadPage` se extrae el número de página del primer argumento, y en `loadPageExact` se extrae de la opción seleccionada del SelectMenu
     * 
     * Tanto `loadPage` como `loadPageExact` deberían de usar el decorador {@linkcode module.exports.loadPageWrapper}
     * 
     * Interacciones:
     * 
     * ButtonInteraction `loadPage`
     * * `args[0]`: Número de página
     * * `args[1]`: Contexto del salto. Solo es necesario para que cada ID sea única.
     * * * `START`: "primera página"
     * * * `BACKWARD`: "página atrás"
     * * * `FORWARD`: "página delante"
     * * * `END`: "ultima página"
     * * * `RELOAD`: "actualizar"
     * 
     * SelectMenuInteraction `loadPageExact`
     * * `.values[0]`: página seleccionada
     * @param {String} commandFilename Nombre del archivo de comando
     * @param {Number} page Número de página actual
     * @param {Number} lastPage Número de última página
     */
    navigationRows: function(commandFilename, page, lastPage) {
		const backward = (page > 0) ? (page - 1) : lastPage;
		const forward = (page < lastPage) ? (page + 1) : 0;
        const maxGrowth = 12;
        const desiredMax = page + maxGrowth;
        const minPage = Math.max(0, page - maxGrowth - Math.max(0, desiredMax - lastPage));
        let i = minPage;

        return [
            new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${commandFilename}_loadPage_0_START`)
                    .setEmoji('934430008586403900')
                    .setStyle(ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId(`${commandFilename}_loadPage_${backward}_BACKWARD`)
                    .setEmoji('934430008343158844')
                    .setStyle(ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId(`${commandFilename}_loadPage_${forward}_FORWARD`)
                    .setEmoji('934430008250871818')
                    .setStyle(ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId(`${commandFilename}_loadPage_${lastPage}_END`)
                    .setEmoji('934430008619962428')
                    .setStyle(ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId(`${commandFilename}_loadPage_${page}_RELOAD`)
                    .setEmoji('934432754173624373')
                    .setStyle(ButtonStyle.Primary),
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId(`${commandFilename}_loadPageExact`)
                    .setPlaceholder('Seleccionar página')
                    .setOptions(Array(Math.min(lastPage + 1, 25)).fill(null).map(() => ({
                        value: `${i}`,
                        label: `Página ${++i}`,
                    }))),
            ),
        ];
    },

    shortNumberNames: [
        'millones', 'miles de millones', 'billones', 'miles de billones', 'trillones', 'miles de trillones', 'cuatrillones', 'miles de cuatrillones',
        'quintillones', 'miles de quintillones', 'sextillones', 'miles de sextillones', 'septillones', 'miles de septillones',
        'octillones', 'miles de octillones', 'nonillones', 'miles de nonillones', 'decillones', 'miles de decillones', 'undecillones', 'miles de undecillones',
        'duodecillones', 'miles de duodecillones', 'tredecillones', 'miles de tredecillones', 'quattuordecillones', 'miles de quattuordecillones',
        'quindecillones', 'miles de quindecillones', 'sexdecillones', 'miles de sexdecillones'
    ],

    /**
     * @function
     * @param {Number | String} num El número a mejorarle la visibilidad
     * @param {Boolean} shorten Si acortar el número para volverlo más fácil de leer
     * @param {Number} minDigits Cantidad mínima de dígitos para rellenar con 0s a la izquierda
     * @returns {String}
     */
    improveNumber: function(num, shorten = false, minDigits = 1) {
        if(typeof num === 'string')
            num = parseFloat(num);
        if(isNaN(num))
            return '0';
        
        /**
         * @param {Number} n
         * @param {Intl.NumberFormatOptions} nopt
         */
        const formatNumber = (n, nopt = {}) => n.toLocaleString('en', { maximumFractionDigits: 2, minimumIntegerDigits: minDigits, ...nopt });
        if((num < 1000000) || !shorten)
            return formatNumber(num);
        
        const googol = Math.pow(10, 100);
        if(num >= googol)
            return `${formatNumber(num / googol, { maximumFractionDigits: 4 })} Gúgol`;

        const jesus = module.exports.shortNumberNames;
        const ni = (num < Math.pow(10, 6 + jesus.length * 3))
            ? Math.floor((num.toLocaleString('fullwide', { useGrouping: false }).length - 7) / 3)
            : jesus.length - 1;
        const snum = formatNumber(num / Math.pow(1000, ni + 2), { minimumFractionDigits: 2 });
        
        return [ snum, jesus[ni] ].join(' ');
            
    },

    isShortenedNumberString: function(numberString) {
        return module.exports.shortNumberNames.some(snn => numberString.indexOf(snn) >= 0);
    },

    /**@param {Number} num*/
    quantityDisplay: function(num) {
        const numberString = module.exports.improveNumber(num, true);
        if(module.exports.isShortenedNumberString(numberString))
            return `${numberString} de`;
        return numberString;
    },
    
    /**@param {String[]} arr*/
    regroupText: (arr, sep = ',') => arr.join(' ').replace(/([\n ]*,[\n ]*)+/g, sep).split(sep).filter(a => a.length),

    /**
     * Limita un string a una cantidad definida de caracteres.
     * Si el string sobrepasa el máximo establecido, se reemplaza el final por un string suspensor para indicar el recorte
     * @param {String} text 
     * @param {Number?} max
     * @param {String?} suspensor 
     * @returns {String}
     */
    shortenText: function(text, max = 200, suspensor = '...') {
        if(typeof text !== 'string') throw TypeError('El texto debe ser un string');
        if(typeof max !== 'number') throw TypeError('El máximo debe ser un número');
        if(typeof suspensor !== 'string') throw TypeError('El suspensor debe ser un string');
        if(text.length < max) return text;
        return `${text.slice(0, max - suspensor.length)}${suspensor}`;
    },

    /**
     * Calcula la distancia entre dos strings con el algoritmo de distancia Levenshtein
     * @param {String} a 
     * @param {String} b 
     * @returns {Number}
     */
    levenshteinDistance: function(a, b) {
        const m = a.length + 1;
        const n = b.length + 1;
        let distance = new Array(m);
        for(let i = 0; i < m; ++i) {
            distance[i] = new Array(n);
            for(let j = 0; j < n; ++j)
                distance[i][j] = 0;
            distance[i][0] = i;
        }

        for(let j = 1; j < n; j++)
            distance[0][j] = j;

        let cost;
        for(let i = 1; i < m; i++)
            for(let j = 1; j < n; j++) {
                cost = a.at(i - 1) === b.at(j - 1) ? 0 : 1;

                distance[i][j] = Math.min(
                    distance[i - 1][j] + 1,
                    distance[i][j - 1] + 1,
                    distance[i - 1][j - 1] + cost,
                );
            }

        return distance[m - 1][n - 1];
    },

    /**
     * Calcula la distancia entre dos strings con el algoritmo de distancia Damerau-Levenshtein + peso Euclideano según distancia entre teclas del teclado
     * @param {String} a 
     * @param {String} b 
     * @returns {Number}
     */
    edlDistance: function(a, b) {
        const keyboardKeys = [
            [ ...'º1234567890\'¡' ],
            [ ...' qwertyuiop`+' ],
            [ ...' asdfghjklñ´ç' ],
            [ ...'<zxcvbnm,.-  ' ],
        ];
        const shiftKeyboardKeys = [
            [ ...'ª!"·$%&/()=?¿' ],
            [ ...'           ^*' ],
            [ ...'           ¨Ç' ],
            [ ...'>       ;:_  ' ],
        ];
        const altKeyboardKeys = [
            [ ...'\\|@#~€¬      ' ],
            [ ... '           []' ],
            [ ... '           {}' ],
            [ ... '             ' ],
        ];

        const keyboardCartesians = {};
        function assignToPlane(x, y, c) {
            if(c == undefined) return;
            keyboardCartesians[c] = { x, y };
        }
        for(let j = 0; j < keyboardKeys.length; j++) {
            keyboardKeys[j]     .forEach((char, i) => assignToPlane(i, j, char));
            shiftKeyboardKeys[j].forEach((char, i) => assignToPlane(i, j, char));
            altKeyboardKeys[j]  .forEach((char, i) => assignToPlane(i, j, char));
        }
        assignToPlane(keyboardCartesians['b'].x, keyboardCartesians['b'].y + 1, 'SPACE');
        const centerCartesian = { x: parseInt(keyboardKeys[1].length * 0.5), y: 1 };
        function euclideanDistance(a = 'g', b = 'h') {
            a = a.toLowerCase();
            b = b.toLowerCase();
            const aa = a === ' ' ? keyboardCartesians['SPACE'] : keyboardCartesians[a] ?? centerCartesian;
            const bb = b === ' ' ? keyboardCartesians['SPACE'] : keyboardCartesians[b] ?? centerCartesian;
            const x = (aa.x - bb.x) ** 2;
            const y = (aa.y - bb.y) ** 2;
            return Math.sqrt(x + y);
        }
        const normalizedEuclidean = euclideanDistance('w', 'd');
        const halfNormalizedEuclidean = normalizedEuclidean * 0.5;

        const m = a.length + 1;
        const n = b.length + 1;
        let distance = (new Array(m)).fill(null).map((element, i) => {
            element = (new Array(n)).fill(0);
            element[0] = i;
            return element;
        });
        for(let j = 1; j < n; j++)
            distance[0][j] = j;

        for(let i = 1; i < m; i++)
            for(let j = 1; j < n; j++) {
                const aa = a.at(i - 1);
                const bb = b.at(j - 1);
                const cost = aa === bb ? 0 : 1;

                const deletion = distance[i - 1][j] + 1;
                const insertion = distance[i][j - 1] + 1;
                const substitution = distance[i - 1][j - 1] + cost;
                distance[i][j] = Math.min(deletion, insertion, substitution);
                
                if(a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
                    distance[i][j] = Math.min(
                        distance[i][j],
                        distance[i - 2][j - 2] + 1,
                    );

                if(cost && substitution < insertion && substitution < deletion)
                    distance[i][j] += euclideanDistance(aa, bb) * halfNormalizedEuclidean - normalizedEuclidean;
            }

        return distance[m - 1][n - 1];
    },

    digitsOf64: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/',

    /**
     * @param {Number} n 
     * @param {String} s 
     * @returns {String}
     */
    radix10to64: function(n, s = '') {
        const newKey = n % 64;
        const remainder = Math.floor(n / 64);
        const stack = module.exports.digitsOf64[newKey] + s;
        return remainder <= 0 ? stack : module.exports.radix10to64(remainder, stack);
    },

    /**
     * @param {String} s 
     * @returns {Number}
     */
    radix64to10: function(s) {
        const digits = s.split('');
        let result = 0;
        for(const e in digits)
            result = (result * 64) + module.exports.digitsOf64.indexOf(digits[e]);
        return result;
    },

    digitsOf128: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/*ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÃÕáéíóúàèìòùäëïöüãõÑñÇçºª;:,.!·%¿?@#~€¬¨^<>',

    /**
     * @param {Number} n 
     * @param {String} s 
     * @returns {String}
     */
    radix10to128: function(n, s = '') {
        const newKey = n % 128;
        const remainder = Math.floor(n / 128);
        const stack = module.exports.digitsOf128[newKey] + s;
        return remainder <= 0 ? stack : module.exports.radix10to128(remainder, stack);
    },

    /**
     * @param {String} s 
     * @returns {Number}
     */
    radix128to10: function(s) {
        const digits = s.split('');
        let result = 0;
        for(const e in digits)
            result = (result * 128) + module.exports.digitsOf128.indexOf(digits[e]);
        return result;
    },

    /**@param {String} id*/
    compressId: function(id) {
        if(typeof id !== 'string')
            throw Error('La id debe ser un string');

        let mid = Math.floor(id.length * 0.5);
        if(id[mid] === '0')
            mid = Math.floor(mid * 0.5) || 1;
        while(id[mid] === '0' && mid < id.length - 1)
            mid++;

        let left = id.slice(0, mid);
        let right = id.slice(mid);
        const compr = [ left, right ].map(str => module.exports.radix10to128(parseInt(str)));
        
        return compr[0].length + compr.join('');
    },

    /**@param {String} id*/
    decompressId: function(id) {
        if(typeof id !== 'string')
            throw Error('La id debe ser un string');

        const mid = id[0];
        id = id.slice(1);
        let left = id.slice(0, mid);
        let right = id.slice(mid);
        const decomp = [ left, right ].map(str => module.exports.radix128to10(str, 36).toString());
        
        return decomp.join('');
    },

    /**
     * 
     * @param {String} str 
     * @returns {Number}
     */
    stringHexToNumber: function(str) {
        if(typeof str !== 'string')
            throw TypeError('Se esperaba un string de hexadecimal para convertir a número');
        if(!str.length)
            return 0;
        
        if(str.startsWith('#'))
            str = str.slice(1);
        return parseInt(`0x${str}`);
    },

    /**
     * Invierte 2 valores o referencias
     * @param {*} a 
     * @param {*} b 
     * @returns {[*, *]} Los valores intercambiados
     */
    swap: function(a, b) {
        const t = a;
        a = b;
        b = t;

        return [a, b];
    },

    /**
     * Reduce la presición de un número a solo los dígitos especificados.
     * Si la parte decimal tiene menos dígitos que lo especificado, se deja como está
     * @param {Number} num El número
     * @param {Number} precision La precisión
     */
    toPrecision: function(num, precision) {
        if(typeof num !== 'number') throw TypeError('Se esperaba un número válido');
        if(typeof precision !== 'number') throw TypeError('La presición debe ser un número');
        if(precision < 0 || precision > 14) throw RangeError('La presición debe ser un número entre 0 y 14');
    
        const abs = ~~num;
        const decimal = num - abs;
        const squash = 10 ** precision;
        const reduced = Math.floor(decimal * squash) / squash;
        return abs + reduced;
    },
    //#endregion
};