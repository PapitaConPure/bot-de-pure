export const ALLOWED_SIZES = [ 16, 32, 64, 128, 256, 512, 1024, 2048, 4096 ] as const;
export const ALLOWED_EXTENSIONS = [ 'webp', 'png', 'jpg', 'jpeg', 'gif' ] as const;

export interface ImageUrlOptions {
	size?: (typeof ALLOWED_SIZES)[number];
	extension?: (typeof ALLOWED_EXTENSIONS)[number];
}

export interface PSGuildCreationData {
	id: string;
	name: string;
	ownerId: string;
	description?: string | null;
	systemChannelId?: string | null;
	iconUrlHandler: (options?: ImageUrlOptions) => string | null;
	bannerUrlHandler: (options?: ImageUrlOptions) => string | null;
	splashUrlHandler: (options?: ImageUrlOptions) => string | null;
	premiumTier?: number | null;
	channels: Omit<PSChannelCreationData, 'guild'>[];
	roles: Omit<PSRoleCreationData, 'guild'>[];
	members: Omit<PSMemberCreationData, 'guild'>[];
}

export interface PSChannelCreationData {
	guild: PSGuild;
	id: string;
	name: string;
	nsfw: boolean;
}

export interface PSRoleCreationData {
	guild: PSGuild;
	id: string;
	name: string;
	iconUrlHandler: (options?: ImageUrlOptions) => string | null;
	color?: number;
}

export interface PSUserCreationData {
	id: string;
	username: string;
	displayName?: string;
}

export interface PSMemberCreationData {
	guild: PSGuild;
	user: PSUser;
	nickname?: string;
	roleIds: string[];
	displayAvatarUrlHandler: (options?: ImageUrlOptions) => string;
}

export class PSGuild {
	id: string;
	name: string;
	owner: PSMember;
	description: string | null;
	#systemChannel: PSChannel | null;
	#iconUrlHandler: (options?: ImageUrlOptions) => string | null;
	#bannerUrlHandler: (options?: ImageUrlOptions) => string | null;
	#splashUrlHandler: (options?: ImageUrlOptions) => string | null;
	premiumTier: number | null;
	channels: Map<string, PSChannel>;
	roles: Map<string, PSRole>;
	members: Map<string, PSMember>;

	constructor(data: PSGuildCreationData) {
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
		this.owner =
			owner ??
			new PSMember({
				user: new PSUser({
					id: ownerId,
					username: 'Dueño desconocido',
					displayName: 'Nombre de dueño desconocido',
				}),
				guild: this,
				roleIds: [],
				displayAvatarUrlHandler: () => '',
			});

		if(systemChannelId) {
			const systemChannel = this.channels.get(systemChannelId);
			if(!systemChannel) throw new ReferenceError('System channel not found');
			this.#systemChannel = systemChannel;
		}
	}

	get systemChannel() {
		return this.#systemChannel;
	}

	registerChannel(data: Omit<PSChannelCreationData, 'guild'>): PSChannel {
		const channel = new PSChannel({ ...data, guild: this });
		this.channels.set(channel.id, channel);
		return channel;
	}

	registerRole(data: Omit<PSRoleCreationData, 'guild'>): PSRole {
		const role = new PSRole({ ...data, guild: this });
		this.roles.set(role.id, role);
		return role;
	}

	registerMember(data: Omit<PSMemberCreationData, 'guild'>): PSMember {
		const member = new PSMember({ ...data, guild: this });
		this.members.set(member.id, member);
		return member;
	}

	registerChannels(
		...channelsData: Omit<PSChannelCreationData, 'guild'>[]
	): Map<string, PSChannel> {
		const channels = new Map();

		for(const data of channelsData) channels.set(data.id, this.registerChannel(data));

		return channels;
	}

	registerRoles(...rolesData: Omit<PSRoleCreationData, 'guild'>[]): Map<string, PSRole> {
		const roles = new Map();

		for(const data of rolesData) roles.set(data.id, this.registerRole(data));

		return roles;
	}

	registerMembers(...membersData: Omit<PSMemberCreationData, 'guild'>[]): Map<string, PSMember> {
		const members = new Map();

		for(const data of membersData) members.set(data.user.id, this.registerMember(data));

		return members;
	}

	setSystemChannel(id: string) {
		const systemChannel = this.channels.get(id);
		if(!systemChannel) throw new ReferenceError(`Channel for ID "${id}" not found`);
		this.#systemChannel = systemChannel;
	}

	iconUrl(options?: ImageUrlOptions) {
		return this.#iconUrlHandler(options);
	}

	bannerUrl(options?: ImageUrlOptions) {
		return this.#bannerUrlHandler(options);
	}

	splashUrl(options?: ImageUrlOptions) {
		return this.#splashUrlHandler(options);
	}

	toString() {
		return this.name;
	}

	get [Symbol.toStringTag]() {
		return this.toString();
	}
}

export class PSChannel {
	guild: PSGuild;
	id: string;
	name: string;
	nsfw: boolean;

	constructor(data: PSChannelCreationData) {
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

export class PSRole {
	guild: PSGuild;
	id: string;
	name: string;
	#iconUrlHandler: (options?: ImageUrlOptions) => string | null;
	color: number;

	constructor(data: PSRoleCreationData) {
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

	iconUrl(options?: ImageUrlOptions) {
		return this.#iconUrlHandler(options);
	}

	toString() {
		return `<@&${this.id}>`;
	}

	get [Symbol.toStringTag]() {
		return this.toString();
	}
}

export class PSUser {
	id: string;
	username: string;
	#displayName: string | null;

	constructor(data: PSUserCreationData) {
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

export class PSMember {
	guild: PSGuild;
	user: PSUser;
	nickname: string | null;
	roles: Map<string, PSRole>;
	#displayAvatarUrlHandler: (options?: ImageUrlOptions) => string;

	constructor(data: PSMemberCreationData) {
		const { guild, user, roleIds, nickname = null, displayAvatarUrlHandler } = data;
		this.guild = guild;
		this.user = user;
		this.nickname = nickname;
		this.roles = new Map();
		this.#displayAvatarUrlHandler = displayAvatarUrlHandler;
		roleIds.forEach((roleId) => {
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

	displayAvatarUrl(options?: ImageUrlOptions) {
		return this.#displayAvatarUrlHandler(options);
	}

	toString() {
		return this.user.toString();
	}

	get [Symbol.toStringTag]() {
		return this.user.toString();
	}
}

/**@description Un adaptador de plataforma específica de funcionalidades de PuréScript.*/
export interface EnvironmentProvider {
	getGuild(): PSGuild;
	getChannel(): PSChannel;
	getUser(): PSUser;
	getMember(): PSMember;
	fetchChannel(query: string): PSChannel | null;
	fetchRole(query: string): PSRole | null;
	fetchMember(query: string): PSMember | null;
	// makeEmbedBuilder(embedData: EmbedData);
}
