const { fetchChannel, fetchRole, fetchMember } = require('../../../func');
const { EnvironmentProvider, PSGuild, PSChannel, PSRole, PSUser, PSMember } = require('../v1.1');

/**@implements {EnvironmentProvider}*/
class DiscordEnvironmentProvider {
	/**@readonly @type {number}*/
	static CACHE_LIFETIME = 5e3;

	/**@type {Map<string, { validUntil: number, guild: PSGuild }>}*/
	static #GUILDS = new Map();
	/**@type {Map<string, { validUntil: number, owner: import('discord.js').GuildMember? }>}*/
	static #OWNERS = new Map();

	/**@type {import('../../../commands/Commons/typings').ComplexCommandRequest}*/
	#request;

	/**
	 * 
	 * @param {import('../../../commands/Commons/typings').ComplexCommandRequest} request 
	 */
	constructor(request) {
		this.#request = request;
	}

	async prefetchOwner() {
		DiscordEnvironmentProvider.#OWNERS.set(this.#request.guild.ownerId, {
			validUntil: Date.now() + DiscordEnvironmentProvider.CACHE_LIFETIME,
			owner: await this.#request.guild.fetchOwner(),
		});
	}

	/**
	 * @param {string} query 
	 * @return {PSChannel?}
	 */
	fetchChannel(query) {
		const channel = fetchChannel(query, this.#request.guild);
		const psGuild = DiscordEnvironmentProvider.#getOrMakePSGuild(channel.guild);
		return psGuild.channels.get(channel.id) ?? null;
	}
	
	/**
	 * @param {string} query 
	 * @return {PSRole?}
	 */
	fetchRole(query) {
		const role = fetchRole(query, this.#request.guild);
		const psGuild = DiscordEnvironmentProvider.#getOrMakePSGuild(role.guild);
		return psGuild.roles.get(role.id) ?? null;
	}
	
	/**
	 * @param {string} query 
	 * @return {PSMember?}
	 */
	fetchMember(query) {
		const member = fetchMember(query, this.#request);
		const psGuild = DiscordEnvironmentProvider.#getOrMakePSGuild(member.guild);
		return psGuild.members.get(member.id) ?? null;
	}
	
	/**
	 * @return {PSGuild}
	 */
	getGuild() {
		const guild = DiscordEnvironmentProvider.#getOrMakePSGuild(this.#request.guild);
		return guild;
	}

	/**
	 * @return {PSChannel}
	 */
	getChannel() {
		const guild = DiscordEnvironmentProvider.#getOrMakePSGuild(this.#request.guild);
		return guild.channels.get(this.#request.channelId);
	}

	/**
	 * @return {PSMember}
	 */
	getMember() {
		const guild = DiscordEnvironmentProvider.#getOrMakePSGuild(this.#request.guild);
		return guild.members.get(this.#request.userId);
	}

	/**
	 * @return {PSUser}
	 */
	getUser() {
		const user = this.#request.user;
		return new PSUser({
			id: user.id,
			username: user.username,
			displayName: user.displayName,
		});
	}

	/**
	 * @param {import('discord.js').Guild} guild
	 */
	static #getOrMakePSGuild(guild) {
		const existingPsGuild = DiscordEnvironmentProvider.#GUILDS.get(guild.id);

		if(existingPsGuild && Date.now() < existingPsGuild.validUntil)
			return existingPsGuild.guild;

		/**@type {Array<Omit<import('../v1.1/interpreter/environment/environmentProvider').PSMemberCreationData, 'guild'>>}*/
		const members = guild.members.cache.map((m, id) => ({
			user: new PSUser({
				id,
				username: m.user.username,
				displayName: m.user.displayName,
			}),
			displayAvatarUrlHandler: options => m.displayAvatarURL(options),
			roleIds: m.roles.cache.map(r => r.id),
			nickname: m.nickname,
		}));

		if(!guild.members.cache.get(guild.ownerId)) {
			const owner = DiscordEnvironmentProvider.#OWNERS.get(guild.ownerId).owner;
			owner && members.push({
				user: new PSUser({
					id: owner.id,
					username: owner.user.username,
					displayName: owner.user.displayName,
				}),
				nickname: owner.nickname,
				roleIds: owner.roles.cache.map(r => r.id),
				displayAvatarUrlHandler: options => owner.displayAvatarURL(options),
			});
		}

		const psGuild = new PSGuild({
			id: guild.id,
			name: guild.name,
			ownerId: guild.ownerId,
			systemChannelId: guild.systemChannelId,
			premiumTier: guild.premiumTier,
			channels: guild.channels.cache.map((ch, id) => ({
				id,
				name: ch.name,
				nsfw: ch.isSendable() ? (ch.isThread() ? ch.parent.nsfw : ch.nsfw) : false,
			})),
			members,
			roles: guild.roles.cache.map((r, id) => ({
				id,
				name: r.name,
				color: r.color,
				iconUrlHandler: options => r.iconURL(options),
			})),
			iconUrlHandler: options => guild.iconURL(options),
			splashUrlHandler: options => guild.splashURL(options),
			bannerUrlHandler: options => guild.bannerURL(options),
		});

		DiscordEnvironmentProvider.#GUILDS.set(guild.id, {
			validUntil: Date.now() + DiscordEnvironmentProvider.CACHE_LIFETIME, //5 segundos
			guild: psGuild,
		});

		return psGuild;
	}
}

module.exports = DiscordEnvironmentProvider;
