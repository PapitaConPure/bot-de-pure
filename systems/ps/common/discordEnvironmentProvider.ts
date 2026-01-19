import { EnvironmentProvider, PSGuild, PSChannel, PSRole, PSUser, PSMember, PSMemberCreationData } from '../v1.1/interpreter/environment/environmentProvider';
import { ComplexCommandRequest } from '../../../commands/Commons/typings';
import { fetchChannel, fetchRole, fetchMember } from '../../../func';

export default class DiscordEnvironmentProvider implements EnvironmentProvider {
	static CACHE_LIFETIME: number = 5e3;

	static#GUILDS: Map<string, { validUntil: number; guild: PSGuild; }> = new Map();
	static#OWNERS: Map<string, { validUntil: number; owner: import('discord.js').GuildMember | null; }> = new Map();

	#request: ComplexCommandRequest;

	constructor(request: ComplexCommandRequest) {
		this.#request = request;
	}

	async prefetchOwner() {
		DiscordEnvironmentProvider.#OWNERS.set(this.#request.guild.ownerId, {
			validUntil: Date.now() + DiscordEnvironmentProvider.CACHE_LIFETIME,
			owner: await this.#request.guild.fetchOwner(),
		});
	}

	fetchChannel(query: string): PSChannel | null {
		const channel = fetchChannel(query, this.#request.guild);
		const psGuild = DiscordEnvironmentProvider.#getOrMakePSGuild(channel.guild);
		return psGuild.channels.get(channel.id) ?? null;
	}

	fetchRole(query: string): PSRole | null {
		const role = fetchRole(query, this.#request.guild);
		const psGuild = DiscordEnvironmentProvider.#getOrMakePSGuild(role.guild);
		return psGuild.roles.get(role.id) ?? null;
	}

	fetchMember(query: string): PSMember | null {
		const member = fetchMember(query, this.#request);
		const psGuild = DiscordEnvironmentProvider.#getOrMakePSGuild(member.guild);
		return psGuild.members.get(member.id) ?? null;
	}

	getGuild(): PSGuild {
		const guild = DiscordEnvironmentProvider.#getOrMakePSGuild(this.#request.guild);
		return guild;
	}

	getChannel(): PSChannel {
		const guild = DiscordEnvironmentProvider.#getOrMakePSGuild(this.#request.guild);
		return guild.channels.get(this.#request.channelId);
	}

	getMember(): PSMember {
		const guild = DiscordEnvironmentProvider.#getOrMakePSGuild(this.#request.guild);
		return guild.members.get(this.#request.userId);
	}

	getUser(): PSUser {
		const user = this.#request.user;
		return new PSUser({
			id: user.id,
			username: user.username,
			displayName: user.displayName,
		});
	}

	static#getOrMakePSGuild(guild: import('discord.js').Guild) {
		const existingPsGuild = DiscordEnvironmentProvider.#GUILDS.get(guild.id);

		if(existingPsGuild && Date.now() < existingPsGuild.validUntil)
			return existingPsGuild.guild;

		const members: Array<Omit<PSMemberCreationData, 'guild'>> = guild.members.cache.map((m, id) => ({
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
