import { EnvironmentProvider, PSGuild, PSChannel, PSRole, PSUser, PSMember } from '../v1.1';

export default class TestEnvironmentProvider implements EnvironmentProvider {
	fetchChannel(): PSChannel | null {
		return TestEnvironmentProvider.#makePSChannel();
	}
	
	fetchRole(): PSRole | null {
		return TestEnvironmentProvider.#makePSRole();
	}
	
	fetchMember(): PSMember | null {
		return TestEnvironmentProvider.#makePSMember();
	}
	
	getGuild(): PSGuild {
		return TestEnvironmentProvider.#makePSGuild();
	}

	getChannel(): PSChannel {
		return TestEnvironmentProvider.#makePSChannel();
	}

	getMember(): PSMember {
		return TestEnvironmentProvider.#makePSMember();
	}

	getUser(): PSUser {
		return TestEnvironmentProvider.#makePSUser();
	}

	static #makePSChannel(deep: boolean = true) {
		return new PSChannel({
			id: 'channelId',
			name: 'Canal',
			nsfw: false,
			guild: deep ? this.#makePSGuild(false) : undefined,
		});
	}

	static #makePSRole(deep: boolean = true) {
		return new PSRole({
			id: 'roleId',
			name: 'Rol',
			color: 0x123456,
			guild: deep ? this.#makePSGuild() : undefined,
			iconUrlHandler: () => 'https://random-images-website-thats-absolutely-not-real.xyz/roleIconUrl',
		});
	}

	static #makePSMember(deep: boolean = true) {
		return new PSMember({
			user: this.#makePSUser(),
			nickname: 'Member Nickname',
			roleIds: [ 'memberRoleId' ],
			guild: deep ? this.#makePSGuild() : undefined,
			displayAvatarUrlHandler: () => 'https://random-images-website-thats-absolutely-not-real.xyz/memberAvatarUrl',
		});
	}

	static #makePSUser() {
		return new PSUser({
			id: 'userId',
			username: 'user.name',
			displayName: 'User Display Name',
		});
	}

	static #makePSGuild(deep: boolean = true) {
		return new PSGuild({
			id: 'guildId',
			name: 'Servidor',
			description: 'Descripción del servidor.',
			ownerId: 'ownerId',
			systemChannelId: 'systemChannelId',
			premiumTier: 0,
			roles: [ deep ? this.#makePSRole(false) : undefined ],
			members: [ deep ? this.#makePSMember(false) : undefined ],
			channels: [ deep ? this.#makePSChannel(false) : undefined ],
			iconUrlHandler: () => 'https://random-images-website-thats-absolutely-not-real.xyz/guildIconUrl',
			splashUrlHandler: () => 'https://random-images-website-thats-absolutely-not-real.xyz/guildSplashUrl',
			bannerUrlHandler: () => 'https://random-images-website-thats-absolutely-not-real.xyz/guildBannerUrl',
		});
	}
}
