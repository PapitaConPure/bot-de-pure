import type {
	GuildBasedChannel,
	GuildChannelResolvable,
	GuildMember,
	PermissionResolvable,
	PermissionsString,
} from 'discord.js';
import { BitField, PermissionFlagsBits, PermissionsBitField } from 'discord.js';

/**Representa un conjunto de permisos de comando*/
export class CommandPermissions<TPerms extends PermissionResolvable = never> {
	#requisites: bigint[];

	/**
	 * @description
	 * Crea un conjunto de permisos de comando.
	 * @param permissions Primer requisito inclusivo de permisos requeridos para ejecutar el comando
	 */
	constructor(permissions?: TPerms) {
		this.#requisites = [];
		this.#add(permissions ?? 0n);
	}

	/**
	 * @description
	 * Agrega un requisito inclusivo de permisos de comando a este conjunto.
	 */
	requireAnyOf<TAddedPerms extends PermissionResolvable>(permissions: TAddedPerms) {
		this.#add(permissions);
		return this as CommandPermissions<TPerms | TAddedPerms>;
	}

	/**
	 * @description
	 * Comprueba si el miembro cumple todos los requisitos impuestos por este conjunto.
	 * @param member Miembro a comprobar
	 */
	isAllowed(member: GuildMember): boolean {
		if (member?.permissions?.bitfield == null)
			throw new TypeError('Se esperaba un miembro de un servidor de Discord');

		const mbf = member.permissions.bitfield;

		if (mbf & PermissionFlagsBits.Administrator) return true;

		for (const requisite of this.#requisites) {
			const filter = requisite & mbf;
			if (!filter) return false;
		}

		return true;
	}

	/**
	 * @description
	 * Comprueba si el miembro cumple todos los requisitos impuestos por este conjunto en este canal.
	 * @param member Miembro a comprobar
	 * @param channel Canal en el cual comprobar
	 */
	isAllowedIn(member: GuildMember, channel: GuildChannelResolvable): boolean {
		const memberChannelPermissions = member?.permissionsIn?.(channel);

		if (memberChannelPermissions?.bitfield == null)
			throw new TypeError('Se esperaba un miembro de un servidor de Discord');

		const mbf = memberChannelPermissions.bitfield;

		if (mbf & PermissionFlagsBits.Administrator) return true;

		for (const requisite of this.#requisites) {
			const filter = mbf & requisite;
			if (!filter) return false;
		}

		return true;
	}

	amAllowedIn(channel: GuildBasedChannel): boolean {
		const { guild } = channel;
		return !!guild.members.me && this.isAllowedIn(guild.members.me, channel);
	}

	/**
	 * @description
	 * Añade un nuevo requisito inclusivo de permisos.
	 * @param permissions Conjunto de permisos requeridos para ejecutar el comando
	 */
	#add(permissions: PermissionResolvable): void {
		const bitfield = this.#resolveToBitfield(permissions);

		if (bitfield !== 0n) this.#requisites.push(bitfield);
	}

	/**
	 * @description
	 * Recupera un Bitfield de un PermissionResolvable.
	 * @param permissions Conjunto de permisos requeridos para ejecutar el comando
	 */
	#resolveToBitfield(permissions: PermissionResolvable): bigint {
		if (Array.isArray(permissions)) return this.#resolveArrayToBitfield(permissions);

		if (typeof permissions === 'bigint') return permissions;

		if (typeof permissions === 'string')
			return BigInt((PermissionFlagsBits as { [K: string]: bigint })[permissions]);

		if (permissions instanceof BitField) return BigInt(permissions.bitfield);

		throw new TypeError('Se esperaba un valor resolvible a uno o más permisos de Discord');
	}

	/**
	 * @description
	 * Recupera un Bitfield de un arreglo de PermissionResolvable.
	 * @param permissions Permisos de comando a introducir
	 */
	#resolveArrayToBitfield(permissions: Array<PermissionResolvable>): bigint {
		let perms = 0n;
		for (const perm of permissions) perms |= this.#resolveToBitfield(perm);
		return perms;
	}

	get matrix(): PermissionsString[][] {
		return this.#requisites.map((requisite) => {
			const pbf = new PermissionsBitField(requisite);
			return pbf.toArray();
		});
	}

	get requisiteTreeString(): string {
		return this.matrix
			.map((requisite, n) => `${n + 1}. ${requisite.map((p) => `\`${p}\``).join(' **o** ')}`)
			.join('\n');
	}

	get requisites(): readonly bigint[] {
		return [...this.#requisites];
	}

	static from<TPerms extends PermissionResolvable>(
		commandPermissions: CommandPermissions<TPerms>,
	) {
		return new CommandPermissions(commandPermissions.requisites) as CommandPermissions<TPerms>;
	}

	static adminOnly() {
		return new CommandPermissions('Administrator');
	}
}
