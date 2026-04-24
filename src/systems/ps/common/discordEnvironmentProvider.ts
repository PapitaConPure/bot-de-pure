import type { ComplexCommandRequest } from 'types/commands';
import { fetchChannel, fetchMember, fetchRole, isNSFWChannel } from '@/utils/discord';
import type {
	EnvironmentProvider,
	PSChannel,
	PSMember,
	PSMemberCreationData,
	PSRole,
} from '../v1.1/interpreter/environment/environmentProvider';
import { PSGuild, PSUser } from '../v1.1/interpreter/environment/environmentProvider';

export default class DiscordEnvironmentProvider implements EnvironmentProvider {
	static CACHE_LIFETIME: number = 5e3;

	static #GUILDS: Map<string, { validUntil: number; guild: PSGuild }> = new Map();
	static #OWNERS: Map<
		string,
		{ validUntil: number; owner: import('discord.js').GuildMember | null }
	> = new Map();

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
		if (!channel) return null;

		const psGuild = DiscordEnvironmentProvider.#getOrMakePSGuild(channel.guild);
		return psGuild.channels.get(channel.id) ?? null;
	}

	fetchRole(query: string): PSRole | null {
		const role = fetchRole(query, this.#request.guild);
		if (!role) return null;

		const psGuild = DiscordEnvironmentProvider.#getOrMakePSGuild(role.guild);
		return psGuild.roles.get(role.id) ?? null;
	}

	fetchMember(query: string): PSMember | null {
		const member = fetchMember(query, this.#request);
		if (!member) return null;

		const psGuild = DiscordEnvironmentProvider.#getOrMakePSGuild(member.guild);
		return psGuild.members.get(member.id) ?? null;
	}

	getGuild(): PSGuild {
		const guild = DiscordEnvironmentProvider.#getOrMakePSGuild(this.#request.guild);
		return guild;
	}

	getChannel(): PSChannel {
		const guild = DiscordEnvironmentProvider.#getOrMakePSGuild(this.#request.guild);
		return guild.channels.get(this.#request.channelId) as PSChannel;
	}

	getMember(): PSMember {
		const guild = DiscordEnvironmentProvider.#getOrMakePSGuild(this.#request.guild);
		return guild.members.get(this.#request.userId) as PSMember;
	}

	getUser(): PSUser {
		const user = this.#request.user;
		return new PSUser({
			id: user.id,
			username: user.username,
			displayName: user.displayName,
		});
	}

	static #getOrMakePSGuild(guild: import('discord.js').Guild) {
		const existingPsGuild = DiscordEnvironmentProvider.#GUILDS.get(guild.id);

		if (existingPsGuild && Date.now() < existingPsGuild.validUntil)
			return existingPsGuild.guild;

		const members: Omit<PSMemberCreationData, 'guild'>[] = guild.members.cache.map((m, id) => ({
			user: new PSUser({
				id,
				username: m.user.username,
				displayName: m.user.displayName,
			}),
			displayAvatarUrlHandler: (options) => m.displayAvatarURL(options),
			roleIds: m.roles.cache.map((r) => r.id),
			nickname: m.nickname ?? undefined,
		}));

		if (!guild.members.cache.get(guild.ownerId)) {
			const owner = DiscordEnvironmentProvider.#OWNERS.get(guild.ownerId)?.owner;
			owner
				&& members.push({
					user: new PSUser({
						id: owner.id,
						username: owner.user.username,
						displayName: owner.user.displayName,
					}),
					nickname: owner.nickname ?? undefined,
					roleIds: owner.roles.cache.map((r) => r.id),
					displayAvatarUrlHandler: (options) => owner.displayAvatarURL(options),
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
				nsfw: isNSFWChannel(ch),
			})),
			members,
			roles: guild.roles.cache.map((r, id) => ({
				id,
				name: r.name,
				color: r.colors.primaryColor,
				iconUrlHandler: (options) => r.iconURL(options),
			})),
			iconUrlHandler: (options) => guild.iconURL(options),
			splashUrlHandler: (options) => guild.splashURL(options),
			bannerUrlHandler: (options) => guild.bannerURL(options),
		});

		DiscordEnvironmentProvider.#GUILDS.set(guild.id, {
			validUntil: Date.now() + DiscordEnvironmentProvider.CACHE_LIFETIME, //5 segundos
			guild: psGuild,
		});

		return psGuild;
	}
}
