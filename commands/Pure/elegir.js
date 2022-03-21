const { MessageEmbed } = require('discord.js');
const { regroupText, randRange } = require('../../func.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts.js')

const options = new CommandOptionsManager()
	.addParam('opciones', 'TEXT', 'para asignar una opción elegible', { poly: 'MULTIPLE', polymax: 10 });

module.exports = {
	name: 'elegir',
	aliases: [
		'choose'
	],
	desc: 'Elige una de las opciones que hayas especificado, puedes separar opciones con comas',
	flags: [
		'common'
	],
	options: options,
	callx: '<opciones...>',
	experimental: true,

	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Acción de comando
		const choices = isSlash
			? options.fetchParamPoly(args, 'opciones', args.getString)
			: regroupText(args);
		
		if(!choices.length || choices.length < 2)
			return await request.reply({
				content: `⚠️ Debes ingresar al menos dos opciones separadas por comas ","\nUsa \`${p_pure(request.guild.id).raw}ayuda\` para más información`,
				ephemeral: true,
			});
		
		const embed = new MessageEmbed()
			.setColor('GREYPLE')
			.addField('Yo digo que...', `_"${choices[randRange(0, choices.length)]}"_`);
		return await request.reply({ embeds: [embed] });
	}
};