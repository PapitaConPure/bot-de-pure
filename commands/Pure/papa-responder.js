const Discord = require('discord.js'); //Integrar discord.js
const { p_pure } = require('../../localdata/config.json'); //Prefijos
const { fetchUser } = require('../../func.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add(
	'PAPA',
	'OUTDATED',
);
const options = new CommandOptionsManager()
	.addFlag('u', 'usuario',  'para especificar el usuario al cual responder', 				 { name: 'u', type: 'USER' })
	.addFlag('a', 'aceptar',  'para confirmar la aceptación de sugerencia')
	.addFlag('p', 'problema', 'para reportar un problema con la expresión de la sugerencia', { name: 'txt', type: 'TEXT' });
const command = new CommandManager('papa-responder', flags)
	.setAliases('papa-r')
	.setDescription(
		`Manda una respuesta específica de \`${p_pure.raw}sugerir\` al \`--usuario\` designado\n`,
		'La respuesta si no se incluyen las banderas `--aceptar` y `--problema` es una confirmación de lectura',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const user = options.fetchFlag(args, 'usuario', { callback: (x) => fetchUser(x, request) });
		console.log(args);
		const action = options.fetchFlag(args, 'aceptar', { callback: 'accept' })
			        || options.fetchFlag(args, 'problema');
		console.log(action);
		console.log(args);
		
		if(user == undefined) {
			const sent = await request.reply({ content: '⚠️ ¡Usuario no encontrado!' });
			setTimeout(() => sent.delete(), 1000 * 5);
			return;
		}

		if(!action) //Confirmación de lectura
			return user.send({ content: '📩 ¡Se confirmó que tu sugerencia ha sido leída! Si es aceptada, se te notificará de igual forma; en caso contrario, no recibirás ninguna notificación.' });
		
		if(action === 'accept') //Confirmación de aceptación
			return user.send({
				content:
					'💌 ¡Se confirmó que tu sugerencia ha sido aceptada! ¡¡¡Muchas gracias por tu colaboración!!! <:meguSmile:1107880958981587004>\n' +
					'_Ten en cuenta que es probable que se hagan modificaciones al plan en base a diversos factores._'
			});
		//Reporte de problema
		const embed = new Discord.EmbedBuilder()
			.setColor(0xaa5555)
			.setAuthor({ name: 'Bot de Puré#9243', iconURL: request.client.user.avatarURL({ size: 256 }) })
			.setTitle('Problema de presentación de sugerencia')
			.addFields({ name: 'Detalle', value: action });
		return user.send({
			content: ':mailbox_with_mail: Llegó una notificación emergente del Buzón de Sugerencias.\n*__Nota:__ Bot de Puré no opera con mensajes privados.*',
			embeds: [embed]
		});
	});

module.exports = command;