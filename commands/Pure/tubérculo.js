const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts.js');
const { p_pure } = require('../../localdata/prefixget.js');
const { fetchFlag, isNotModerator } = require('../../func.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

const options = new CommandOptionsManager()
	.addParam('id', 	  'TEXT',           'para especificar sobre qué Tubérculo operar')
	.addParam('mensaje',  'TEXT',           'para especificar el texto del mensaje',     { optional: true })
	.addParam('archivos', ['FILE','IMAGE'], 'para especificar los archivos del mensaje', { poly: 'MULTIPLE', optional: true })
	.addFlag(['c','m'], ['crear','agregar','añadir'], 'para crear o editar un Tubérculo')
	.addFlag(['b','d'], ['borrar','eliminar'], 		  'para eliminar un Tubérculo');

const pageMax = 10;
const paginationRows = (page, backward, forward, lastPage) => {
	let i = 0;
	return [
		new MessageActionRow().addComponents(
			new MessageButton()
			.setCustomId('tubérculo_loadPage_0_START')
			.setEmoji('934430008586403900')
			.setStyle('PRIMARY'),
			new MessageButton()
				.setCustomId(`tubérculo_loadPage_${backward}_BACKWARD`)
				.setEmoji('934430008343158844')
				.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(`tubérculo_loadPage_${forward}_FORWARD`)
				.setEmoji('934430008250871818')
				.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(`tubérculo_loadPage_${lastPage}_END`)
				.setEmoji('934430008619962428')
				.setStyle('PRIMARY'),
			new MessageButton()
				.setCustomId(`tubérculo_loadPage_${page}_RELOAD`)
				.setEmoji('934432754173624373')
				.setStyle('SUCCESS'),
		),
		new MessageActionRow().addComponents(
			new MessageSelectMenu()
				.setCustomId('tubérculo_loadPageExact')
				.setPlaceholder('Seleccionar página')
				.setOptions(Array(Math.min(lastPage + 1, 24)).fill(null).map(() => ({
					value: `${i}`,
					label: `Página ${++i}`,
				}))),
		),
	]
};

module.exports = {
	name: 'tubérculo',
	aliases: [
		'tuberculo',
		'tubercle', 'tuber', 't'
	],
	brief : 'Permite crear, editar, listar, borrar o ejecutar comandos personalizados de servidor',
	desc: [
		'Permite `--crear`, *editar*, *listar*, `--borrar` o __ejecutar__ Tubérculos (comandos personalizados de servidor).',
		'Usar el comando sin más listará todos los Tubérculos de los que dispone el servidor actual',
		'En caso de estar creando un Tubérculo, se requerirá un `<mensaje>` y/o `<archivos>`, junto a la `<id>` que quieras darle al mismo. Si la ID ya está registrada, será *reemplazada (editada)*',
		'En cualquier parte del contenido del mensaje, coloca "#FIN#" para bajar un renglón',
		'En caso de estar editando o borrando un Tubérculo existente, se requerirá su TuberID',
		'⚠️ Ten en cuenta que este comando es experimental y cualquier Tubérculo ingresado podría ser eventualmente perdido a medida que me actualizo',
	].join('\n'),
	flags: [
		'common'
	],
	options,
	callx: '<mensaje?> <archivos>',
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Determinar operación
		const helpstr = `Usa \`${p_pure(request.guild).raw}ayuda ${module.exports.name}\` para más información`;
		const operation = (isSlash
			? [
				args.getBoolean('crear' ),
				args.getBoolean('borrar'),
			] : [
				fetchFlag(args, { ...options.flags.get('crear').structure,  callback: 'crear'  }),
				fetchFlag(args, { ...options.flags.get('borrar').structure, callback: 'borrar' }),
			]
		).find(op => op);

		//Adquirir ID de Tubérculo
		const id = isSlash ? args.getString('id') : args.shift();

		//Preparar ejecución
		const gid = request.guild.id;
		const guildquery = { guildId: gid };
		const gcfg = (await GuildConfig.findOne(guildquery)) || new GuildConfig(guildquery);
		const executeTuber = async(tuber) => await request.reply({
			content: tuber.content,
			files: tuber.files,
		});
		gcfg.tubers = gcfg.tubers || {};

		if(!operation && !id) { //Listar Tubérculos
			const members = request.guild.members.cache;
			const items = Object.entries(gcfg.tubers).reverse();
			const lastPage = Math.ceil(items.length / pageMax) - 1;
			request.reply({
				embeds: [
					new MessageEmbed()
						.setColor('LUMINOUS_VIVID_PINK')
						.setAuthor(request.guild.name, request.guild.iconURL())
						.setTitle('Arsenal de Tubérculos del Servidor')
						.addField(`🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ 1 / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
							items.splice(0, pageMax)
								.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? request.guild.me).user.username}`)
								.join('\n'), true)
				],
				components: (items.length < pageMax) ? null : paginationRows(0, lastPage, 1, lastPage),
			});
		} else { //Realizar operación sobre ID de Tubérculo
			if(!id) return await request.reply({ content: `⚠️ Debes ingresar una TuberID válida\n${helpstr}` });

			switch(operation) {
				case 'crear':
					if(id.length > 24)
						return await request.reply({ content: '⚠️ Las TuberID solo pueden medir hasta 24 caracteres' });
					if(gcfg.tubers[id] && isNotModerator(request.member) && gcfg.tubers[id].author !== (request.author ?? request.user).id)
						return await request.reply({ content: `⛔ Acción denegada. La TuberID **${id}** le pertenece a *${gcfg.tubers[id].author}*` });
					
					const content = (isSlash ? options.getString('mensaje') : args.join(' ')).split('#FIN#').join('\n');
					const urls = isSlash ? options.fetchParamPoly(args, 'archivos', args.getString, null).filter(att => att) : (request.attachments || []).map(att => att.proxyURL);

					//Incluir Tubérculo; crear colección de Tubérculos si es necesario
					const tuberContent = {
						author: (request.user ?? request.author).id,
						content: content || null,
						files: urls,
					};
					gcfg.tubers[id] = tuberContent;
				
					try {
						await executeTuber(gcfg.tubers[id]);
						gcfg.markModified('tubers');
					} catch(error) {
						console.log('Ocurrió un error al añadir un nuevo Tubérculo');
						console.error(error);
						return await request.reply({ content: '❌ Hay un problema con el Tubérculo que intentaste crear' });
					}
					break;
				
				case 'borrar':
					if(!gcfg.tubers[id])
						return await request.reply({ content: `⚠️ El tubérculo **${id}** no existe` });
					if(isNotModerator(request.member) && gcfg.tubers[id].author !== (request.author ?? request.user).id)
						return await request.reply({ content: `⛔ Acción denegada. La TuberID **${id}** le pertenece a *${gcfg.tubers[id].author}*` });

					gcfg.tubers[id] = null;
					delete gcfg.tubers[id];
					gcfg.markModified('tubers');
					request.reply({ content: '✅ Tubérculo eliminado con éxito' });
					break;
				
				default:
					if(!gcfg.tubers[id]) return await request.reply({ content: `⚠️ El tubérculo **${id}** no existe` });
					await executeTuber(gcfg.tubers[id])
					.catch(error => {
						console.log('Ocurrió un error al ejecutar un Tubérculo');
						console.error(error);
						request.reply({ content: '❌ Parece que hay un problema con este Tubérculo. Prueba creándolo nuevamente o eliminándolo si no se usa más' });
					});
					break;
			}
		}
		gcfg.save(); //Guardar en Configuraciones de Servidor si se cambió algo
	},

	/**
	 * 
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<any>} param1 
	 */
	async ['loadPage'](interaction, [ page ]) {
		page = parseInt(page);
		const { guild, message } = interaction;
		const gcfg = await GuildConfig.findOne({ guildId: guild.id });
		const items = Object.entries(gcfg.tubers).reverse();
		
		const members = guild.members.cache;
		const lastPage = Math.ceil(items.length / pageMax) - 1;
		const backward = (page > 0) ? (page - 1) : lastPage;
		const forward = (page < lastPage) ? (page + 1) : 0;
		const oembed = message.embeds[0];
		return await interaction.update({
			embeds: [
				new MessageEmbed()
				.setColor(oembed.color)
				.setAuthor(oembed.author.name, oembed.author.url)
				.setTitle(oembed.title)
				.addField(`🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${page + 1} / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
					items.splice(page * pageMax, pageMax)
						.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? guild.me).user.username}`)
						.join('\n'), true)
			],
			components: (items.length < pageMax) ? null : paginationRows(page, backward, forward, lastPage),
		});
	},

	/**
	 * 
	 * @param {import('discord.js').SelectMenuInteraction} interaction
	 */
	async ['loadPageExact'](interaction) {
		module.exports['loadPage'](interaction, [ interaction.values[0] ]);
	},
};