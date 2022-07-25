const { MessageAttachment } = require('discord.js');
const { CommandMetaFlagsManager } = require('../Commons/commands');

const readObj = (object, indent) => {
	let objret = '';
	Object.entries(object).forEach(([key, value]) => {
		if(typeof object[key] !== "object") objret += `${indent}"${key}": "${value}",\n`;
		else {
			if(indent.length < 4) objret += `${indent}"${key}": {\n${readObj(object[key], `${indent}\t`)}${indent}},\n`;
			else objret += `${indent}"${key}": [Object],\n`;
		}
	});
	return objret;
}

module.exports = {
	name: 'papa-json',
	desc: 'Busca un `<objeto>` JS con cierto siguiendo las indicaciones de `<(ruta, nombre)>` en el `<archivo>` especificado (o `global.json`)',
	flags: new CommandMetaFlagsManager().add('PAPA'),
	options:[
		'`<archivo?>` _(texto: *.json)_ para especificar en qué archivo buscar el objeto',
		'`<objeto? (ruta, nombre)>` _(texto, texto)_ para especificar la ruta relativa al archivo del objeto a buscar, en orden descendiente'
	],
	callx: '<archivo?> <objeto? (ruta..., nombre)>',

	async execute(message, args) {
		const [ mainobj ] = args;

		//Buscar objeto de forma descendiente
		let obj, name;
		if(args.length && mainobj.endsWith('.json')) {
			try { obj = require(`../../localdata/${mainobj}`); }
			catch(e) { obj = require('../../localdata/config.json'); }
			args = args.slice(1);
		} else {
			obj = require('../../localdata/config.json');
			name = 'global';
		}

		if(args.length)
			for(arg of args.slice(0, 4))
				if(obj[arg] !== undefined) {
					obj = obj[arg];
					name = arg;
				} else {
					obj = undefined;
					break;
				}

		//Acción de comando
		if(obj === undefined)
			return message.reply({ content: `:warning: El objeto "${args.join('.')}" no existe. Revisa que el identificador esté bien escrito.` });

		const jsonfile = new MessageAttachment(Buffer.from(JSON.stringify(obj, null, '\t'), 'utf-8'), 'myfile.json');
		return message.reply({ files: [ jsonfile ]});
	}
};