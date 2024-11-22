const { PSMember, PSChannel, PSGuild, PSRole } = require('./environmentProvider');
const { makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeNada } = require('../values');

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
 * @param {PSMember} member 
 * @returns {RegistryValue}
 */
function makeDiscordMember(member) {
    //const user = await member.user.fetch(true);
    const values = {
        id: makeText(member.id),
        avatar: makeText(member.displayAvatarUrl()),
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
 * @param {PSRole} role 
 * @returns {RegistryValue}
 */
function makeDiscordRole(role) {
    const roleIcon = role.iconUrl({ size: 256 });
	
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
 * @param {PSChannel} channel 
 * @returns {RegistryValue}
 */
function makeDiscordChannel(channel) {
    const isNSFW = 'nsfw' in channel;
	
    const values = {
        id:      makeText(channel.id),
        nombre:  makeText(channel.name),
        mención: makeText(`${channel}`),
        nsfw:    makeBoolean(channel.nsfw),
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
 * @param {PSGuild} guild 
 * @returns {Promise<RegistryValue>}
 */
async function makeDiscordGuild(guild) {
    const iconUrl = guild.iconUrl({ extension: 'jpg', size: 512 });
    const description = guild.description;
    const systemChannel = guild.systemChannel;
    const bannerUrl = guild.bannerUrl({ extension: 'jpg', size: 1024 });
    const premiumTier = guild.premiumTier ? `Nivel ${guild.premiumTier}` : 'Sin Nivel';
    const splashUrl = guild.splashUrl({ extension: 'jpg', size: 512 });

    const values = {
        id: makeText(guild.id),
        nombre: makeText(guild.name),
        ícono: iconUrl ? makeText(iconUrl) : makeNada(),
        descripción: description ? makeText(description) : makeNada(),
        canalSistema: systemChannel ? makeDiscordChannel(systemChannel) : makeNada(),
        cartel: bannerUrl ? makeText(bannerUrl) : makeNada(),
        nivel: makeText(premiumTier),
        imagenInvitación: splashUrl ? makeText(splashUrl) : makeNada(),
        dueño: makeDiscordMember(guild.owner),
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
 * @param {import('../../embedData').EmbedData} embed 
 * @returns {RegistryValue}
 */
function makeEmbedRegistry(embed) {
    /**@type {Map<String, RuntimeValue>}*/
    const properties = new Map()
        .set('color', makeText('#' + (embed.data.color || 0).toString(16).padStart(6, '0')))
        .set('título', makeText(embed.data.title || ''))
        .set('descripción', makeText(embed.data.description || ''));

    const embedData = embed.data;
    
    if(embedData.fields) {
        const fields = [];

        for(const field of embedData.fields) {
            /**@type {Map<String, RuntimeValue>}*/
            const fieldProps = new Map()
                .set('nombre', makeText(field.name || ''))
                .set('valor', makeText(field.value || ''))
                .set('alineado', makeBoolean(field.inline ?? false));

            fields.push(makeRegistry(fieldProps));
        }

        properties.set('enlace', makeList(fields));
    }
    
    if(embedData.author)
        properties.set('autor', makeRegistry(new Map()
            .set('nombre', embedData.author.name ? makeText(embedData.author.name) : makeNada())
            .set('ícono', embedData.author.iconUrl ? makeText(embedData.author.iconUrl) : makeNada())
        ));
        
    if(embedData.footer)
        properties.set('pie', makeRegistry(new Map()
            .set('texto', embedData.footer.text ? makeText(embedData.footer.text) : makeNada())
            .set('ícono', embedData.footer.iconUrl ? makeText(embedData.footer.iconUrl) : makeNada())
        ));
    
    if(embedData.timestamp)
        properties.set('tiempo', makeText(`<t:${+embedData.timestamp / 1000}:F>`));

    if(embedData.imageUrl)
        properties.set('imagen', makeText(embedData.imageUrl));
    
    if(embedData.thumbUrl)
        properties.set('miniatura', makeText(embedData.thumbUrl));
    
    if(embedData.url)
        properties.set('enlace', makeText(embedData.url));
    
    return makeRegistry(properties);
}

module.exports = {
	makeDiscordMember,
	makeDiscordRole,
	makeDiscordChannel,
	makeDiscordGuild,
    makeEmbedRegistry,
};
