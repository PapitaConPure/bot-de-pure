const Discord = require('discord.js'); //Integrar discord.js
const { p_pure } = require('../../localdata/config.json'); //Prefijos
const { fetchFlag, fetchUser } = require('../../func.js');

module.exports = {
	name: 'papa-responder',
	aliases: [
		'papa-r'
	],
	desc: `Manda una respuesta específica de \`${p_pure.raw}sugerir\` al \`--usuario\` designado\n` +
		'La respuesta si no se incluyen las banderas `--aceptar` y `--problema` es una confirmación de lectura',
	flags: [
		'papa'
	],
	options: [
		'`-u` o `--usuario` _(mención/texto/id)_ para especificar el usuario al cual responder',
		'`-a` o `--aceptar` para confirmar aceptación de sugerencia',
		'`-p` o `--problema` _(texto)_ para reportar un problema con la expresión de la sugerencia'
	],

	async execute(message, args) {
		//Variables de flags
		const user = fetchFlag(args, { property: true, short: ['u'], long: ['usuario'], callback: (x, i) => fetchUser(x[i], message) });
		const action = fetchFlag(args, { short: ['a'], long: ['aceptar'], callback: 'accept' })
			        || fetchFlag(args, { short: ['p'], long: ['problema'], callback: 'problem' });
		console.log(action);
		
		//Acción de comando
		if(user === undefined) {
			const sent = await message.channel.send({ content: ':warning: ¡Usuario no encontrado!' });
			setTimeout(() => sent.delete(), 1000 * 5);
			return;
		}

		if(action === undefined) //Confirmación de lectura
			user.send({ content: '📩 ¡Se confirmó que tu sugerencia ha sido leída! Si es aceptada, se te notificará de igual forma; en caso contrario, no recibirás ninguna notificación.' });
		else if(action === 'accept') //Confirmación de aceptación
			user.send({
				content:
					'💌 ¡Se confirmó que tu sugerencia ha sido aceptada! ¡¡¡Muchas gracias por tu colaboración!!! <:meguSmile:796930824627945483>\n' +
					'_Ten en cuenta que es probable que se hagan modificaciones al plan en base a diversos factores._'
			});
		else { //Reporte de problema
			const embed = new Discord.MessageEmbed()
				.setColor('#aa5555')
				.setAuthor('Bot de Puré#9243', message.client.user.avatarURL({ size: 256 }))
				.setTitle('Problema de presentación de sugerencia')
				.addField('Detalle', args.join(' '));
			user.send({
				content: ':mailbox_with_mail: Llegó una notificación emergente del Buzón de Sugerencias.\n*__Nota:__ Bot de Puré no opera con mensajes privados.*',
				embeds: [embed]
			});
		}
	}
};