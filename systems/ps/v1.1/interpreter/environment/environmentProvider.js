const ALLOWED_SIZES = /**@type {const}*/([ 16, 32, 64, 128,  256,  512,  1024,  2048,  4096 ]);
const ALLOWED_EXTENSIONS = /**@type {const}*/([ 'webp', 'png', 'jpg', 'jpeg', 'gif' ]);

/**
 * @typedef {Object} ImageUrlOptions
 * @property {typeof ALLOWED_SIZES[number]} [size]
 * @property {typeof ALLOWED_EXTENSIONS[number]} [extension='webp']
 */

/**
 * @typedef {Object} PSGuildCreationData
 * @property {string} id
 * @property {string} name
 * @property {string} ownerId
 * @property {string?} [description]
 * @property {string?} [systemChannelId]
 * @property {(options: ImageUrlOptions) => string?} iconUrlHandler
 * @property {(options: ImageUrlOptions) => string?} bannerUrlHandler
 * @property {(options: ImageUrlOptions) => string?} splashUrlHandler
 * @property {number?} [premiumTier]
 * @property {Array<Omit<PSChannelCreationData, 'guild'>>} channels
 * @property {Array<Omit<PSRoleCreationData, 'guild'>>} roles
 * @property {Array<Omit<PSMemberCreationData, 'guild'>>} members
 */

/**
 * @typedef {Object} PSChannelCreationData
 * @property {PSGuild} guild
 * @property {string} id
 * @property {string} name
 * @property {boolean} nsfw
 */

/**
 * @typedef {Object} PSRoleCreationData
 * @property {PSGuild} guild
 * @property {string} id
 * @property {string} name
 * @property {(options: ImageUrlOptions) => string?} iconUrlHandler
 * @property {number} [color]
 */

/**
 * @typedef {Object} PSUserCreationData
 * @property {string} id
 * @property {string} username
 * @property {string} [displayName]
 */

/**
 * @typedef {Object} PSMemberCreationData
 * @property {PSGuild} guild
 * @property {PSUser} user
 * @property {string} [nickname]
 * @property {Array<string>} roleIds
 * @property {(options?: ImageUrlOptions) => string} displayAvatarUrlHandler
 */

class PSGuild {
	/**@readonly @type {string}*/ id;
	/**@readonly @type {string}*/ name;
	/**@readonly @type {PSMember}*/ owner;
	/**@readonly @type {string?}*/ description;
	/**@type {PSChannel?}*/ #systemChannel;
	/**@readonly @type {(options: ImageUrlOptions) => string?}*/ #iconUrlHandler;
	/**@readonly @type {(options: ImageUrlOptions) => string?}*/ #bannerUrlHandler;
	/**@readonly @type {(options: ImageUrlOptions) => string?}*/ #splashUrlHandler;
	/**@readonly @type {number?}*/ premiumTier;
	/**@readonly @type {Map<string, PSChannel>}*/ channels;
	/**@readonly @type {Map<string, PSRole>}*/ roles;
	/**@readonly @type {Map<string, PSMember>}*/ members;

	/**
	 * 
	 * @param {PSGuildCreationData} data 
	 */
	constructor(data) {
		const {
			id,
			name,
			ownerId,
			description = null,
			systemChannelId,
			iconUrlHandler,
			bannerUrlHandler,
			splashUrlHandler,
			premiumTier = null,
			channels,
			roles,
			members,
		} = data;

		this.id = id;
		this.name = name;
		this.description = description;
		this.#iconUrlHandler = iconUrlHandler;
		this.#bannerUrlHandler = bannerUrlHandler;
		this.#splashUrlHandler = splashUrlHandler;
		this.premiumTier = premiumTier;

		this.channels = new Map();
		for(const channelData of channels) {
			const channel = new PSChannel({ ...channelData, guild: this });
			this.channels.set(channel.id, channel);
		}

		this.roles = new Map();
		for(const roleData of roles) {
			const role = new PSRole({ ...roleData, guild: this });
			this.roles.set(role.id, role);
		}

		this.members = new Map();
		for(const memberData of members) {
			const member = new PSMember({ ...memberData, guild: this });
			this.members.set(member.id, member);
		}

		const owner = this.members.get(ownerId);
		if(!owner) throw new ReferenceError('Owner not found');
		this.owner = owner;
		
		if(systemChannelId) {
			const systemChannel = this.channels.get(systemChannelId)
			if(!systemChannel) throw new ReferenceError('System channel not found');
			this.#systemChannel = systemChannel;
		}
	}

	get systemChannel() {
		return this.#systemChannel;
	}

	/**
	 * @param {Omit<PSChannelCreationData, 'guild'>} data 
	 * @returns {PSChannel}
	 */
	registerChannel(data) {
		const channel = new PSChannel({ ...data, guild: this });
		this.channels.set(channel.id, channel);
		return channel;
	}

	/**
	 * @param {Omit<PSRoleCreationData, 'guild'>} data 
	 * @returns {PSRole}
	 */
	registerRole(data) {
		const role = new PSRole({ ...data, guild: this });
		this.roles.set(role.id, role);
		return role;
	}

	/**
	 * @param {Omit<PSMemberCreationData, 'guild'>} data 
	 * @returns {PSMember}
	 */
	registerMember(data) {
		const member = new PSMember({ ...data, guild: this });
		this.members.set(member.id, member);
		return member;
	}

	/**
	 * @param {...Omit<PSChannelCreationData, 'guild'>} channelsData
	 * @returns {Map<string, PSChannel>}
	 */
	registerChannels(...channelsData) {
		const channels = new Map();
		
		for(const data of channelsData)
			channels.set(data.id, this.registerChannel(data));

		return channels;
	}

	/**
	 * @param {...Omit<PSRoleCreationData, 'guild'>} rolesData
	 * @returns {Map<string, PSRole>}
	 */
	registerRoles(...rolesData) {
		const roles = new Map();
		
		for(const data of rolesData)
			roles.set(data.id, this.registerRole(data));

		return roles;
	}

	/**
	 * @param {...Omit<PSMemberCreationData, 'guild'>} membersData
	 * @returns {Map<string, PSMember>}
	 */
	registerMembers(...membersData) {
		const members = new Map();
		
		for(const data of membersData)
			members.set(data.user.id, this.registerMember(data));

		return members;
	}

	/**
	 * @param {string} id 
	 */
	setSystemChannel(id) {
		const systemChannel = this.channels.get(id);
		if(!systemChannel) throw new ReferenceError(`Channel for ID "${id}" not found`);
		this.#systemChannel = systemChannel;
	}

	/**
	 * @param {ImageUrlOptions} options 
	 */
	iconUrl(options) {
		return this.#iconUrlHandler(options);
	}

	/**
	 * @param {ImageUrlOptions} options 
	 */
	bannerUrl(options) {
		return this.#bannerUrlHandler(options);
	}

	/**
	 * @param {ImageUrlOptions} options 
	 */
	splashUrl(options) {
		return this.#splashUrlHandler(options);
	}

	toString() {
		return this.name;
	}

	get [Symbol.toStringTag]() {
		return this.toString();
	}
}

class PSChannel {
	/**@readonly @type {PSGuild}*/ guild;
	/**@readonly @type {string}*/ id;
	/**@readonly @type {string}*/ name;
	/**@readonly @type {boolean}*/ nsfw;

	/**
	 * 
	 * @param {PSChannelCreationData} data 
	 */
	constructor(data) {
		const { id, name, guild, nsfw } = data;
		this.id = id;
		this.name = name;
		this.guild = guild;
		this.nsfw = nsfw;
	}

	toString() {
		return `<#${this.id}>`;
	}

	get [Symbol.toStringTag]() {
		return this.toString();
	}
}

class PSRole {
	/**@readonly @type {PSGuild}*/ guild;
	/**@readonly @type {string}*/ id;
	/**@readonly @type {string}*/ name;
	/**@readonly @type {(options: ImageUrlOptions) => string?}*/ #iconUrlHandler;
	/**@readonly @type {number}*/ color;

	/**
	 * 
	 * @param {PSRoleCreationData} data 
	 */
	constructor(data) {
		const { id, name, guild, iconUrlHandler, color } = data;
		this.id = id;
		this.name = name;
		this.guild = guild;
		this.#iconUrlHandler = iconUrlHandler;
		this.color = color || 0x000000;
	}

	get hexColor() {
		return '#' + this.color.toString(16);
	}

	/**
	 * @param {ImageUrlOptions} options 
	 */
	iconUrl(options) {
		return this.#iconUrlHandler(options);
	}

	toString() {
		return `<@&${this.id}>`;
	}

	get [Symbol.toStringTag]() {
		return this.toString();
	}
}

class PSUser {
	/**@readonly @type {string}*/ id;
	/**@readonly @type {string}*/ username;
	/**@readonly @type {string?}*/ #displayName;

	/**
	 * 
	 * @param {PSUserCreationData} data 
	 */
	constructor(data) {
		const { id, username, displayName = null } = data;
		this.id = id;
		this.username = username;
		this.#displayName = displayName;
	}

	get displayName() {
		return this.#displayName || this.username;
	}

	toString() {
		return `<@${this.id}>`;
	}

	get [Symbol.toStringTag]() {
		return this.toString();
	}
}

class PSMember {
	/**@readonly @type {PSGuild}*/ guild;
	/**@readonly @type {PSUser}*/ user;
	/**@readonly @type {string?}*/ nickname;
	/**@readonly @type {Map<string, PSRole>}*/ roles;
	/**@readonly @type {(options?: ImageUrlOptions) => string}*/ #displayAvatarUrlHandler;

	/**
	 * 
	 * @param {PSMemberCreationData} data 
	 */
	constructor(data) {
		const { guild, user, roleIds, nickname = null, displayAvatarUrlHandler } = data;
		this.guild = guild;
		this.user = user;
		this.nickname = nickname;
		this.roles = new Map();
		this.#displayAvatarUrlHandler = displayAvatarUrlHandler;
		roleIds.forEach(roleId => {
			const role = guild.roles.get(roleId);
			if(role) this.roles.set(roleId, role);
		});
	}

	get id() {
		return this.user.id;
	}

	get displayName() {
		return this.nickname || this.user.displayName;
	}

	/**
	 * @param {ImageUrlOptions} [options] 
	 */
	displayAvatarUrl(options) {
		return this.#displayAvatarUrlHandler(options);
	}

	toString() {
		return this.user.toString();
	}

	get [Symbol.toStringTag]() {
		return this.user.toString();
	}
}

/**
 * Un adaptador de plataforma específica de funcionalidades de PuréScript
 * @interface EnvironmentProvider
 */
function EnvironmentProvider() {}

// /**
//  * @function
//  * @param {import('./embedData').EmbedData} embedData 
//  * @returns {*}
//  */
// EnvironmentProvider.prototype.makeEmbedBuilder = function(embedData) {
// 	throw 'No implementado';
// }

/**
 * @function
 * @returns {PSGuild}
 */
EnvironmentProvider.prototype.getGuild = function() {
	throw 'No implementado';
}

/**
 * @function
 * @returns {PSChannel}
 */
EnvironmentProvider.prototype.getChannel = function() {
	throw 'No implementado';
}

/**
 * @function
 * @returns {PSUser}
 */
EnvironmentProvider.prototype.getUser = function() {
	throw 'No implementado';
}

/**
 * @function
 * @returns {PSMember}
 */
EnvironmentProvider.prototype.getMember = function() {
	throw 'No implementado';
}

/**
 * @function
 * @param {string} query 
 * @returns {PSChannel?}
 */
EnvironmentProvider.prototype.fetchChannel = function(query) {
	throw 'No implementado';
}

/**
 * @function
 * @param {string} query 
 * @returns {PSRole?}
 */
EnvironmentProvider.prototype.fetchRole = function(query) {
	throw 'No implementado';
}

/**
 * @function
 * @param {string} query 
 * @returns {PSMember?}
 */
EnvironmentProvider.prototype.fetchMember = function(query) {
	throw 'No implementado';
}

module.exports = {
	PSGuild,
	PSChannel,
	PSRole,
	PSUser,
	PSMember,
	EnvironmentProvider,
};
