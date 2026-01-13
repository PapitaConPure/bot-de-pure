import { PermissionFlagsBits, PermissionsBitField, BitField, PermissionResolvable, GuildMember, GuildChannelResolvable, GuildBasedChannel } from 'discord.js';

/**Representa un conjunto de permisos de comando*/
export class CommandPermissions {
	#requisites: bigint[];

	/**
	 * @description
	 * Crea un conjunto de permisos de comando.
	 * @param permissions Primer requisito inclusivo de permisos requeridos para ejecutar el comando
	 */
	constructor(permissions: PermissionResolvable = 0n) {
		this.#requisites = [];
		this.#add(permissions);
	};

	/**
	 * @description
	 * Agrega un requisito inclusivo de permisos de comando a este conjunto.
	 */
	requireAnyOf(permissions: PermissionResolvable) {
		this.#add(permissions);
		return this;
	}

	/**
	 * @description
	 * Comprueba si el miembro cumple todos los requisitos impuestos por este conjunto.
	 * @param member Miembro a comprobar
	 */
	isAllowed(member: GuildMember) {
		if(member?.permissions?.bitfield == undefined)
			throw new TypeError("Se esperaba un miembro de un servidor de Discord");

		const mbf = member.permissions.bitfield;

		if(mbf & PermissionFlagsBits.Administrator)
			return true;

		for(const requisite of this.#requisites) {
			const filter = requisite & mbf;
			if(!filter) return false;
		}

		return true;
	};

	/**
	 * @description
	 * Comprueba si el miembro cumple todos los requisitos impuestos por este conjunto en este canal.
	 * @param member Miembro a comprobar
	 * @param channel Canal en el cual comprobar
	 */
	isAllowedIn(member: GuildMember, channel: GuildChannelResolvable) {
		const memberChannelPermissions = member?.permissionsIn?.(channel);
		
		if(memberChannelPermissions?.bitfield == undefined)
			throw new TypeError("Se esperaba un miembro de un servidor de Discord");

		const mbf = memberChannelPermissions.bitfield;

		if(mbf & PermissionFlagsBits.Administrator)
			return true;

		for(const requisite of this.#requisites) {
			const filter = mbf & requisite;
			if(!filter) return false;
		}

		return true;
	};

	amAllowedIn(channel: GuildBasedChannel) {
		const { guild } = channel;
		return this.isAllowedIn(guild.members.me, channel);
	}

	/**
	 * @description
	 * Añade un nuevo requisito inclusivo de permisos.
	 * @param permissions Conjunto de permisos requeridos para ejecutar el comando
	 */
	#add(permissions: PermissionResolvable) {
		const bitfield = this.#resolveToBitfield(permissions);

		if(bitfield !== 0n)
			this.#requisites.push(bitfield);
	}

	/**
	 * @description
	 * Recupera un Bitfield de un PermissionResolvable.
	 * @param permissions Conjunto de permisos requeridos para ejecutar el comando
	 */
	#resolveToBitfield(permissions: PermissionResolvable) {
		if(Array.isArray(permissions))
			return this.#calcPerms(permissions);

		if(typeof permissions === 'bigint')
			return permissions;

		if(typeof permissions === 'string')
			return BigInt(PermissionFlagsBits[permissions]);

		if(permissions instanceof BitField)
			return BigInt(permissions.bitfield);

		throw new TypeError("Se esperaba un valor resolvible a uno o más permisos de Discord");
	}

	/**
	 * @description
	 * Recupera un Bitfield de un arreglo de PermissionResolvable.
	 * @param permissions Permisos de comando a introducir
	 */
	#calcPerms(permissions: Array<PermissionResolvable>) {
		let perms = 0n;
		for(const perm of permissions)
			perms |= this.#resolveToBitfield(perm);
		return perms;
	};

	get matrix() {
		return this.requisites.map(requisite => {
			const pbf = new PermissionsBitField(requisite);
			return pbf.toArray();
		});
	}

	get requisites() {
		return this.#requisites;
	}

	static adminOnly() {
		return new CommandPermissions('Administrator');
	}
}
