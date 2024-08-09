const { ValueKinds, makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeNada, isNada, isOperable, isInternalOperable, coerceValue } = require('../values');
const { Scope } = require('../scope');
const { GuildPremiumTier } = require('discord.js');

/**
 * @typedef {import('../values').NumberValue} NumberValue
 * @typedef {import('../values').TextValue} TextValue
 * @typedef {import('../values').BooleanValue} BooleanValue
 * @typedef {import('../values').ListValue} ListValue
 * @typedef {import('../values').RegistryValue} RegistryValue
 * @typedef {import('../values').NativeFunctionValue} NativeFunctionValue
 * @typedef {import('../values').FunctionValue} FunctionValue
 * @typedef {import('../values').NadaValue} NadaValue
 * @typedef {import('../values').RuntimeValue} RuntimeValue
 */

/**
 * @param {Date} date
 * @returns {RegistryValue}
 */
function makeDate(date) {
    //PENDIENTE: Implementar una forma de lidiar con husos horarios
    const nombresMes = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
    ];

    const nombresDia = [
        'Domingo',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
    ];

    const values = {
        año: makeNumber(date.getFullYear()),
        mes: makeNumber(date.getMonth() + 1),
        dia: makeNumber(date.getDate() + 1),
        hora: makeNumber(date.getHours()),
        minuto: makeNumber(date.getMinutes()),
        segundo: makeNumber(date.getSeconds()),
        milisegundo: makeNumber(date.getMilliseconds()),
        marcaHoraria: makeNumber(date.getTime()), //Milisegundos desde el epoch
        diaSemana: makeNumber(date.getDay() + 1),
        nombreMes: makeText(nombresMes[date.getMonth()]),
        nombreDia: makeText(nombresDia[date.getDay()]),
    };
    
    /**@type {Map<String, RuntimeValue>}*/
    const miembro = new Map();
    miembro
        .set('mes',     values.mes)
		
    return makeRegistry(miembro);
}

/**
 * @param {import('discord.js').GuildMember} member 
 * @returns {RegistryValue}
 */
function makeDiscordMember(member) {
    //const user = await member.user.fetch(true);
    const values = {
        id: makeText(member.id),
        avatar: makeText(member.displayAvatarURL()),
        //color: makeText(user.hexAccentColor),
        nombre: makeText(member.displayName),
        mención: makeText(`${member}`),
        //portada: makeText(user.bannerURL())
    };
    
    /**@type {Map<String, RuntimeValue>}*/
    const miembro = new Map();
    miembro
        .set('id',      values.id)
        //.set('acento',  values.color)
        .set('avatar',  values.avatar)
        //.set('color',   values.color)
        .set('icono',   values.avatar)
        .set('ícono',   values.avatar)
        //.set('imagen',  values.portada)
        .set('perfil',  values.avatar)
        .set('pfp',     values.avatar)
        //.set('portada', values.portada)
        .set('nombre',  values.nombre)
        .set('mencion', values.mención)
        .set('mención', values.mención);
		
    return makeRegistry(miembro);
}

/**
 * @param {import('discord.js').Role} role 
 * @returns {RegistryValue}
 */
function makeDiscordRole(role) {
    const roleIcon = role.iconURL({ size: 256 });
	
    const values = {
        id:      makeText(role.id),
        nombre:  makeText(role.name),
        mención: makeText(`${role}`),
        color:   makeText(role.hexColor),
        ícono:   roleIcon ? makeText(roleIcon) : makeNada(),
    };

    /**@type {Map<String, RuntimeValue>}*/
    const rol = new Map();
    rol
        .set('id',      values.id)
        .set('nombre',  values.nombre)
        .set('mencion', values.mención)
        .set('mención', values.mención)
        .set('color',   values.color)
        .set('icono',   values.ícono)
        .set('ícono',   values.ícono);

    return makeRegistry(rol);
}

/**
 * @param {import('discord.js').GuildBasedChannel} channel 
 * @returns {RegistryValue}
 */
function makeDiscordChannel(channel) {
    const isNSFW = 'nsfw' in channel;
	
    const values = {
        id:      makeText(channel.id),
        nombre:  makeText(channel.name),
        mención: makeText(`${channel}`),
        nsfw:    isNSFW != undefined ? makeBoolean(isNSFW) : makeNada(),
    };

    /**@type {Map<String, RuntimeValue>}*/
    const canal = new Map();
    canal
        .set('id',      values.id)
        .set('nombre',  values.nombre)
        .set('mencion', values.mención)
        .set('mención', values.mención)
        .set('nsfw',    values.nsfw);

    return makeRegistry(canal);
}

/**
 * @param {import('discord.js').Guild} guild 
 * @returns {Promise<RegistryValue>}
 */
async function makeDiscordGuild(guild) {
    const iconUrl = guild.iconURL({ extension: 'jpg', size: 512 });
    const description = guild.description;
    const systemChannel = guild.systemChannel;
    const bannerUrl = guild.bannerURL({ extension: 'jpg', size: 1024 });
    const premiumTier = guild.premiumTier === GuildPremiumTier.None ? 'Ninguno' : `Nivel ${guild.premiumTier ?? 0}`;
    const splashUrl = guild.splashURL({ extension: 'jpg', size: 512 });

    const values = {
        id: makeText(guild.id),
        nombre: makeText(guild.name),
        ícono: iconUrl ? makeText(iconUrl) : makeNada(),
        descripción: description ? makeText(description) : makeNada(),
        canalSistema: systemChannel ? makeDiscordChannel(systemChannel) : makeNada(),
        cartel: bannerUrl ? makeText(bannerUrl) : makeNada(),
        nivel: makeText(premiumTier),
        imagenInvitación: splashUrl ? makeText(splashUrl) : makeNada(),
        dueño: makeDiscordMember(await guild.fetchOwner()),
    };

    /**@type {Map<String, RuntimeValue>}*/
    const servidor = new Map()
        .set('id',               values.id)
        .set('nombre',           values.nombre)
        .set('icono',            values.ícono)
        .set('ícono',            values.ícono)
        .set('descripcion',      values.descripción)
        .set('descripción',      values.descripción)
        .set('canalSistema',     values.canalSistema)
        .set('canalDeSistema',   values.canalSistema)
        .set('cartel',           values.cartel)
        .set('portada',          values.cartel)
        .set('nivel',            values.nivel)
        .set('imagenInvitacion', values.imagenInvitación)
        .set('imagenInvitación', values.imagenInvitación)
        .set('dueño',            values.dueño);
    
    return makeRegistry(servidor);
}

/**
 * @param {import('discord.js').EmbedBuilder} embed 
 * @returns {RegistryValue}
 */
function makeEmbedRegistry(embed) {
    /**@type {Map<String, RuntimeValue>}*/
    const properties = new Map()
        .set('color', makeText('#' + (embed.data.color || 0).toString(16).padStart(6, '0')))
        .set('título', makeText(embed.data.title || ''))
        .set('descripción', makeText(embed.data.description || ''));
    
    if(embed.data.fields) {
        const fields = [];

        for(const field of embed.data.fields) {
            /**@type {Map<String, RuntimeValue>}*/
            const fieldProps = new Map()
                .set('nombre', makeText(field.name || ''))
                .set('valor', makeText(field.value || ''))
                .set('alineado', makeBoolean(field.inline ?? false));

            fields.push(makeRegistry(fieldProps));
        }

        properties.set('enlace', makeList(fields));
    }
    
    if(embed.data.author)
        properties.set('autor', makeRegistry(new Map()
            .set('nombre', embed.data.author.name ? makeText(embed.data.author.name) : makeNada())
            .set('ícono', embed.data.author.name ? makeText(embed.data.author.icon_url) : makeNada())
        ));
        
    if(embed.data.footer)
        properties.set('pie', makeRegistry(new Map()
            .set('texto', embed.data.author.name ? makeText(embed.data.footer.text) : makeNada())
            .set('ícono', embed.data.author.name ? makeText(embed.data.footer.icon_url) : makeNada())
        ));
    
    if(embed.data.timestamp)
        properties.set('tiempo', makeText(embed.data.timestamp));

    if(embed.data.image?.url)
        properties.set('imagen', makeText(embed.data.image.url));
    
    if(embed.data.video?.url)
        properties.set('video', makeText(embed.data.video.url));
    
    if(embed.data.thumbnail?.url)
        properties.set('miniatura', makeText(embed.data.thumbnail.url));
    
    if(embed.data.url)
        properties.set('enlace', makeText(embed.data.url));
    
    return makeRegistry(properties);
}

module.exports = {
	makeDiscordMember,
	makeDiscordRole,
	makeDiscordChannel,
	makeDiscordGuild,
    makeEmbedRegistry,
};
