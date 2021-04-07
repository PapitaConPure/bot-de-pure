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
	flags: [
		'papa'
	],
	options:[
		'`<archivo?>` _(texto: *.json)_ para especificar en qué archivo buscar el objeto',
		'`<objeto? (ruta, nombre)>` _(texto, texto)_ para especificar la ruta relativa al archivo del objeto a buscar, en orden descendiente'
	],
	callx: '<archivo?> <objeto? (ruta..., nombre)>',

	execute(message, args) {
		//Buscar objeto de forma descendiente
		let obj, name;
		if(args.length && args[0].endsWith('.json')) {
			try { obj = require(`../../${args[0]}`); }
			catch(e) { obj = require('../../config.json'); }
			name = args[0].slice(0, -5);
			args = args.slice(1);
		} else {
			obj = require('../../config.json');
			name = 'global';
		}

		if(args.length)
			for(arg of args.slice(0, 4))
				if(obj[arg] !== undefined) {
					obj = obj[arg];
					name = arg;
				} else break;

		//Acción de comando
		if(obj === undefined) {
			message.channel.send(`:warning: El objeto "${args.join('\\')}" no existe. Revisa que el identificador esté bien escrito.`);
			return;
		}
		
		(readObj(obj, '\t').match(/[\s\S]{1,1966}/g) || ['\t[Empty]\n']).map(async (a) => 
			await message.channel.send(`\`\`\`json\n"${name}": {\n${a}}\n\`\`\``)
		);
	}
};