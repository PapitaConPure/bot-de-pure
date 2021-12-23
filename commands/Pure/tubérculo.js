const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts.js');
const { p_pure } = require('../../localdata/prefixget.js');
const { fetchFlag } = require('../../func.js');
const { MessageEmbed } = require('discord.js');

const options = new CommandOptionsManager()
	.addParam('id', 	  'TEXT',           'para especificar sobre qué Tubérculo operar')
	.addParam('mensaje',  'TEXT',           'para especificar el texto del mensaje',     { optional: true })
	.addParam('archivos', ['FILE','IMAGE'], 'para especificar los archivos del mensaje', { poly: 'MULTIPLE', optional: true })
	.addFlag('c', 		['crear','agregar','añadir'], 'para crear un Tubérculo')
	.addFlag(['e','m'], ['editar','modificar'],       'para modificar un Tubérculo')
	.addFlag(['b','d'], ['borrar','eliminar'], 		  'para eliminar un Tubérculo');

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

		
		const gid = request.guild.id;
		const guildquery = { guildId: gid };
		const gcfg = (await GuildConfig.findOne(guildquery)) || new GuildConfig(guildquery);
		const executeTuber = async(tuber) => await request.reply({
			content: tuber.content,
			files: tuber.files,
		});
		gcfg.tubers = gcfg.tubers || {};

		if(!operation) { //Listar Tubérculos
			const embed = new MessageEmbed()
				.setColor('LUMINOUS_VIVID_PINK')
				.setAuthor(request.guild.name, request.guild.iconURL())
				.setTitle('Lista de Tubérculos');
			const pageMax = 10;
			const items = Object.entries(gcfg.tubers);
			for(let page = 0; items.length; page++)
				embed.addField(`Lista ${Math.ceil(page / pageMax) + 1}`, items.splice(0, pageMax).map(([tid,tuber]) => `**${tid}**, por ${tuber.author}`).join('\n'), true);
			request.reply({ embeds: [embed] });
		} else { //Realizar operación sobre ID de Tubérculo
			if(!id) return await request.reply({ content: `⚠️ Debes ingresar una TuberID válida\n${helpstr}` });

			switch(operation) {
				case 'crear':
					const content = (isSlash ? options.getString('mensaje') : args.join(' ')).split('#FIN#').join('\n');
					const urls = isSlash ? options.fetchParamPoly(args, 'archivos', args.getString, null).filter(att => att) : (request.attachments || []).map(att => att.proxyURL);

					//Incluir Tubérculo; crear colección de Tubérculos si es necesario
					const tuberContent = {
						author: (request.user ?? request.author).username,
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
					if(!gcfg.tubers[id]) return await request.reply({ content: `⚠️ El tubérculo **${id}** no existe` });

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
	}
};