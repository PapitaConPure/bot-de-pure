const { PermissionFlagsBits, PermissionsBitField, BitField } = require('discord.js');

/**Representa un conjunto de permisos de comando*/
class CommandPermissions {
    /**@type {Array<bigint>}*/
    #requisites;

    /**
     * Crea un conjunto de permisos de comando
     * @constructor
     * @param {import('discord.js').PermissionResolvable} permissions Primer requisito inclusivo de permisos requeridos para ejecutar el comando
     */
    constructor(permissions = 0n) {
        this.#requisites = [];
        this.#add(permissions);
    };

    /**
     * Agrega un requisito inclusivo de permisos de comando a este conjunto
     * @param {import('discord.js').PermissionResolvable} permissions 
     * @returns 
     */
    requireAnyOf(permissions) {
        this.#add(permissions);
        return this;
    }

    /**
     * Comprueba si el miembro cumple todos los requisitos impuestos por este conjunto
     * @param {import('discord.js').GuildMember} member Miembro a comprobar
     */
    isAllowed(member) {
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
     * Comprueba si el miembro cumple todos los requisitos impuestos por este conjunto en este canal
     * @param {import('discord.js').GuildMember} member Miembro a comprobar
     * @param {import('discord.js').GuildChannelResolvable} channel Canal en el cual comprobar
     */
    isAllowedIn(member, channel) {
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

    /**
     * @param {import('discord.js').GuildBasedChannel} channel
     */
    amAllowedIn(channel) {
        const { guild } = channel;
        return this.isAllowedIn(guild.members.me, channel);
    }

    /**
     * Añade un nuevo requisito inclusivo de permisos
     * @param {import('discord.js').PermissionResolvable} permissions Conjunto de permisos requeridos para ejecutar el comando
     */
    #add(permissions) {
        const bitfield = this.#resolveToBitfield(permissions);

        if(bitfield !== 0n)
            this.#requisites.push(bitfield);
    }

    /**
     * Recupera un Bitfield de un PermissionResolvable
     * @param {import('discord.js').PermissionResolvable} permissions Conjunto de permisos requeridos para ejecutar el comando
     */
    #resolveToBitfield(permissions) {
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
     * Recupera un Bitfield de un arreglo de PermissionResolvable
     * @param {Array<import('discord.js').PermissionResolvable>} permissions Permisos de comando a introducir
     */
    #calcPerms(permissions) {
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
};

module.exports = {
    CommandPermissions,
};