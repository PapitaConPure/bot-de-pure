import type {
	EnvironmentProvider,
	PSChannel,
	PSMember,
	PSRole,
} from '../v1.1/interpreter/environment/environmentProvider';
import { PSGuild, PSUser } from '../v1.1/interpreter/environment/environmentProvider';

export default class TestEnvironmentProvider implements EnvironmentProvider {
	guild: PSGuild;
	channel: PSChannel;
	role: PSRole;
	user: PSUser;
	member: PSMember;

	constructor() {
		this.guild = new PSGuild({
			id: '123456789012345678',
			name: 'Servidor de Prueba',
			ownerId: '123456789012345684',
			description: 'Este ser un servidor que realmente no existe',
			systemChannelId: '123456789012345680',
			iconUrlHandler: this.testUrlHandler,
			bannerUrlHandler: this.testUrlHandler,
			splashUrlHandler: this.testUrlHandler,
			premiumTier: 0,
			channels: [
				{
					id: '123456789012345680',
					name: 'canal-de-prueba-2',
					nsfw: false,
				},
			],
			roles: [
				{
					id: '123456789012345681',
					name: 'Rol de Prueba 1',
					iconUrlHandler: () => 'https://i.imgur.com/ALNMRS6.png',
					color: 0x608cf3,
				},
				{
					id: '123456789012345682',
					name: 'Rol de Prueba 2',
					iconUrlHandler: () => null,
				},
			],
			members: [
				{
					user: new PSUser({
						id: '123456789012345683',
						username: 'usuario.de.prueba',
						displayName: 'Usuario de Prueba',
					}),
					displayAvatarUrlHandler: () => 'https://i.imgur.com/P9eeVWC.png',
					roleIds: ['123456789012345682'],
				},
				{
					user: new PSUser({
						id: '123456789012345684',
						username: 'otro.usuario',
						displayName: 'Otro Usuario',
					}),
					nickname: 'Otro Usuario',
					displayAvatarUrlHandler: () => 'https://i.imgur.com/P9eeVWC.png',
					roleIds: [],
				},
			],
		});

		this.channel = this.guild.registerChannel({
			id: '123456789012345679',
			name: 'canal-de-prueba-1',
			nsfw: false,
		});

		this.user = new PSUser({
			id: '651250669390528561',
			username: 'botdepure',
		});

		this.member = this.guild.registerMember({
			user: this.user,
			nickname: 'Bot de Puré',
			displayAvatarUrlHandler: () => 'https://i.imgur.com/P9eeVWC.png',
			roleIds: ['123456789012345681', '123456789012345682'],
		});
	}

	getGuild() {
		return this.guild;
	}

	getChannel() {
		return this.channel;
	}

	getUser() {
		return this.user;
	}

	getMember() {
		return this.member;
	}

	fetchChannel(query: string) {
		if (!Number.isNaN(+query)) {
			const channel = this.guild.channels.get(query);
			if (channel) return channel;
		}

		let bestScore = 0;
		let bestMatch: PSChannel | undefined;

		for (const channel of this.guild.channels.values()) {
			if (channel.name.includes(query) && channel.name.length > bestScore) {
				bestScore = channel.name.length;
				bestMatch = channel;
			}
		}

		return bestMatch ?? null;
	}

	fetchRole(query: string) {
		if (!Number.isNaN(+query)) {
			const role = this.guild.roles.get(query);
			if (role) return role;
		}

		let bestScore = 0;
		let bestMatch: PSRole | undefined;

		for (const roles of this.guild.roles.values()) {
			if (roles.name.includes(query) && roles.name.length > bestScore) {
				bestScore = roles.name.length;
				bestMatch = roles;
			}
		}

		return bestMatch ?? null;
	}

	fetchMember(query: string) {
		if (!Number.isNaN(+query)) {
			const member = this.guild.members.get(query);
			if (member) return member;
		}

		let bestScore = 0;
		let bestMatch: PSMember | undefined;

		for (const member of this.guild.members.values()) {
			const tryName = (/**@type {string?}*/ name: string | null) => {
				if (name?.includes(query) && name.length > bestScore) {
					bestScore = name.length;
					bestMatch = member;
					return true;
				}
				return false;
			};

			if (tryName(member.nickname)) continue;
			if (tryName(member.user.displayName)) continue;
			if (tryName(member.user.username)) continue;
		}

		return bestMatch ?? null;
	}

	private testUrlHandler() {
		return '';
	}
}
