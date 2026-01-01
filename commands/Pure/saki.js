const { CommandTags, CommandManager, CommandOptions } = require("../Commons/commands");
const { hourai } = require('../../data/config.json');
const HouraiCfg = require('../../models/hourai.js');
const { CommandPermissions } = require('../Commons/cmdPerms.js');

let crazyBackupId = hourai.crazyBackupChannelId;

const positivos = [
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
];

const negativos = [
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
];

function recibirEstado(texto) {
    if(positivos.includes(texto))
        return 1;
    
    if(negativos.includes(texto))
        return -1;

    return 0;
}

function procesarConfig(dbDoc, appliedList, prompt, configId, displayText) {
    if(prompt) {
        const state = recibirEstado(prompt);

        if(state == 0)
            return false;

        dbDoc.configs ??= {};
        dbDoc.configs[configId] = (state == 1);
        dbDoc.markModified('configs');

        appliedList.push(`${displayText}: ${state == 1 ? '✅' : '❌'}`);
    }

    return true;
}

const tip = '⚠️ Estado inválido. Ingresa "Activado", "Desactivado" o similares para cambiar una configuración';

const perms = CommandPermissions.adminOnly();
const options = new CommandOptions()
    .addFlag([], 'bienvenida', 'Para habilitar o deshabilitar la bienvenida por completo', { name: 'estado', type: 'TEXT' })
    .addFlag([], 'despedida', 'Para habilitar o deshabilitar la bienvenida por completo', { name: 'estado', type: 'TEXT' })
    .addFlag([], 'ping', 'Para habilitar o deshabilitar el ping de bienvenida', { name: 'estado', type: 'TEXT' });
const flags = new CommandTags().add('MOD', 'HOURAI');
const command = new CommandManager('saki', flags)
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
        
        const houraiCfg = (await HouraiCfg.findOne({})) || new HouraiCfg();
        const applied = [];

        if(!procesarConfig(houraiCfg, applied, bienvenida, 'bienvenida', 'Bienvenida'))
            return request.reply({ content: tip });

        if(!procesarConfig(houraiCfg, applied, despedida, 'despedida', 'Despedida'))
            return request.reply({ content: tip });

        if(!procesarConfig(houraiCfg, applied, pingBienvenida, 'pingBienvenida', 'Ping de Bienvenida'))
            return request.reply({ content: tip });

        if(!applied.length)
            return request.reply({ content: '⚠️ No se aplicaron configuraciones.\nRevisa la página de ayuda del comando con `p!ayuda saki`' });

        await houraiCfg.save();

        return request.reply({
            content: [
                '## Se aplicaron configuraciones',
                '',
                ...applied.map(a => `* ${a}`),
            ].join('\n'),
        });
	});

module.exports = command;
