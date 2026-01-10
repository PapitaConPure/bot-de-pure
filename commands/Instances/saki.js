const { CommandTags, Command, CommandOptions } = require("../Commons/commands");
const { hourai } = require('../../data/config.json');
const HouraiCfg = require('../../models/hourai.js');
const { CommandPermissions } = require('../Commons/cmdPerms.js');

let crazyBackupId = hourai.crazyBackupChannelId;

const positivos = new Set([
    'habilitado',
    'habilitar',
    'encendido',
    'encendida',
    'encender',
    'activado',
    'activada',
    'activar',
    'true',
    'on',
    '1',
]);

const negativos = new Set([
    'deshabilitado',
    'deshabilitar',
    'desactivado',
    'desactivada',
    'desactivar',
    'apagado',
    'apagada',
    'apagar',
    'false',
    'off',
    '0',
]);

function recibirEstado(texto) {
    if(positivos.has(texto))
        return 1;
    
    if(negativos.has(texto))
        return -1;

    return 0;
}

/**
 * 
 * @param {import("../../models/hourai.js").SakiDocument} dbDoc 
 * @param {string[]} appliedList 
 * @param {string} prompt 
 * @param {string} configId 
 * @param {string} displayText 
 */
function procesarConfig(dbDoc, appliedList, prompt, configId, displayText) {
    if(!prompt)
        return true;
    
    const state = recibirEstado(prompt);

    if(state === 0)
        return false;

    dbDoc.configs[configId] = (state === 1);
    dbDoc.markModified('configs');

    appliedList.push(`${displayText}: ${state === 1 ? '✅' : '❌'}`);

    return true;
}

const tip = '⚠️ Estado inválido. Ingresa "Activado", "Desactivado" o similares para cambiar una configuración';

const perms = CommandPermissions.adminOnly();
const options = new CommandOptions()
    .addFlag([], 'bienvenida', 'Para habilitar o deshabilitar la bienvenida por completo', { name: 'estado', type: 'TEXT' })
    .addFlag([], 'despedida', 'Para habilitar o deshabilitar la bienvenida por completo', { name: 'estado', type: 'TEXT' })
    .addFlag([], 'ping', 'Para habilitar o deshabilitar el ping de bienvenida', { name: 'estado', type: 'TEXT' });
const flags = new CommandTags().add('MOD', 'SAKI');
const command = new Command('saki', flags)
	.setAliases(
		'sakiscans',
		'configsaki', 'sakiconfig'
	)
	.setBriefDescription(`Traslada mensajes pinneados a <#${crazyBackupId}>`)
	.setLongDescription(
		`Envía mensajes pinneados en el canal actual a <#${crazyBackupId}>`,
		'Esto eliminará todos los pins en el canal luego de reenviarlos',
	)
    .setPermissions(perms)
    .setOptions(options)
	.setExecution(async (request, args) => {
		const bienvenida = args.parseFlagExpr('bienvenida');
		const despedida = args.parseFlagExpr('despedida');
		const pingBienvenida = args.parseFlagExpr('ping');
        
        const sakiCfg = (await HouraiCfg.findOne({})) || new HouraiCfg();
        const applied = /**@type {string[]}*/([]);

        if(!procesarConfig(sakiCfg, applied, bienvenida, 'bienvenida', 'Bienvenida'))
            return request.reply({ content: tip });

        if(!procesarConfig(sakiCfg, applied, despedida, 'despedida', 'Despedida'))
            return request.reply({ content: tip });

        if(!procesarConfig(sakiCfg, applied, pingBienvenida, 'pingBienvenida', 'Ping de Bienvenida'))
            return request.reply({ content: tip });

        if(!applied.length)
            return request.reply({ content: '⚠️ No se aplicaron configuraciones.\nRevisa la página de ayuda del comando con `p!ayuda saki`' });

        await sakiCfg.save();

        return request.reply({
            content: [
                '## Se aplicaron configuraciones',
                '',
                ...applied.map(a => `* ${a}`),
            ].join('\n'),
        });
	});

module.exports = command;
