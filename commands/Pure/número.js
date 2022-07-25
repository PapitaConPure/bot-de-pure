const { improveNumber, fetchFlag } = require('../../func.js'); //Funciones globales
const { CommandOptionsManager, CommandMetaFlagsManager } = require('../Commons/commands');

const options = new CommandOptionsManager()
	.addParam('num', 'NUMBER', 'para designar el número a operar')
	.addFlag(['a','s'], 'acortar', 'para acortar el número')
	.addFlag(['m','d'], ['mínimo','minimo','digitos'], 'para designar el mínimo de dígitos', { name: 'minimo', type: 'NUMBER' })
	.addFlag(['n','e'], 'exponente', 'para exponenciar el número', { name: 'exp', type: 'NUMBER' });

module.exports = {
	name: 'número',
	aliases: [
		'numero',
		'núm',
		'num',
	],
	desc: 'Para operar un número. Sí, solo eso, tenía ganas de jugar con algo',
	flags: new CommandMetaFlagsManager().add('COMMON'),
	options: options,
	callx: '<num>',
    experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Acción de comando
		const shorten = fetchFlag(args, { ...options.flags.get('acortar').structure, callback: true, fallback: false });
		const getFunc = (x,i) => x[i];
		const min = fetchFlag(args, { property: true, ...options.flags.get('mínimo').structure, callback: getFunc, fallback: 1 });
		const exp = fetchFlag(args, { property: true, ...options.flags.get('exponente').structure, callback: getFunc });

		if(!args.length) return request.reply({ content: '⚠ Debes ingresar un número' });
		let num = args.shift();
		if(typeof exp !== 'undefined') num = Math.pow(num, exp);
		request.reply({ content: improveNumber(num, shorten, min) });
	}
};