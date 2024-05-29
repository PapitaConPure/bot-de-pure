const { ValueKinds, makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeNada, isNada, isOperable, isInternalOperable, coerceValue } = require('../values');
const { expectParam, getParamOrNada, calculatePositionOffset } = require('./nativeUtils');
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
 * @param {import('discord.js').GuildMember} member 
 * @returns {RegistryValue}
 */
function makeDiscordMember(member) {
    /**@type {Map<String, RuntimeValue>}*/
    const miembro = new Map();
    miembro
        .set('id',      makeText(member.id))
        .set('avatar',  makeText(member.displayAvatarURL()))
        .set('nombre',  makeText(member.displayName))
        .set('mención', makeText(`${member}`));
		
    return makeRegistry(miembro);
}

/**
 * @param {import('discord.js').Role} role 
 * @returns {RegistryValue}
 */
function makeDiscordRole(role) {
    const roleIcon = role.iconURL({ size: 256 })
	
    /**@type {Map<String, RuntimeValue>}*/
    const rol = new Map();
    rol
        .set('id',      makeText(role.id))
        .set('nombre',  makeText(role.name))
        .set('mención', makeText(`${role}`))
        .set('color',   makeText(role.hexColor))
        .set('ícono',   roleIcon ? makeText(roleIcon) : makeNada());

    return makeRegistry(rol);
}

/**
 * @param {import('discord.js').GuildBasedChannel} channel 
 * @returns {RegistryValue}
 */
function makeDiscordChannel(channel) {
    const isNSFW = 'nsfw' in channel;
	
    /**@type {Map<String, RuntimeValue>}*/
    const canal = new Map();
    canal
        .set('id',      makeText(channel.id))
        .set('nombre',  makeText(channel.name))
        .set('mención', makeText(`${channel}`))
        .set('nsfw',    isNSFW != undefined ? makeBoolean(isNSFW) : makeNada());

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

    /**@type {Map<String, RuntimeValue>}*/
    const servidor = new Map()
        .set('id',               makeText(guild.id))
        .set('nombre',           makeText(guild.name))
        .set('ícono',            iconUrl ? makeText(iconUrl) : makeNada())
        .set('descripción',      description ? makeText(description) : makeNada())
        .set('canalSistema',     systemChannel ? makeDiscordChannel(systemChannel) : makeNada())
        .set('cartel',           bannerUrl ? makeText(bannerUrl) : makeNada())
        .set('nivel',            makeText(premiumTier))
        .set('imagenInvitación', splashUrl ? makeText(splashUrl) : makeNada())
        .set('dueño',            makeDiscordMember(await guild.fetchOwner()));

    return makeRegistry(servidor);
}

module.exports = {
	makeDiscordMember,
	makeDiscordRole,
	makeDiscordChannel,
	makeDiscordGuild,
};
