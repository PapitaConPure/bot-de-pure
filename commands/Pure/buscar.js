const { peopleid, p_pure } = require('../../localdata/config.json');
const { randRange, fetchFlag } = require('../../func');
const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { engines, getBaseTags, getSearchTags } = require('../../localdata/booruprops.js'); //Variables globales
const booru = require('booru');
const rakki = require('./rakkidei.js');

module.exports = {
	name: 'buscar',
	aliases: [
        'imágenes', 'imagenes',
		'search', 'image',
		'img'
    ],
	brief: 'Busca y muestra imágenes',
    desc: 'Busca y muestra imágenes."\n' +
		'Por defecto, las imágenes se buscan con Gelbooru.\n' +
		'Si lo deseas, puedes usar otro `--motor` de esta lista:\n' +
		'```\n' +
		`${engines.map(e => `${e.charAt(0).toUpperCase()}${e.slice(1)}`).join(', ')}\n` +
		'```\n' +
		'**Nota:** en canales NSFW, los resultados serán, respectivamente, NSFW\n' +
		'**Nota 2:** no todos los motores funcionan y con algunos no habrá búsqueda personalizada',
    flags: [
        'common'
    ],
    options: [
		'`<etiquetas?(...)>` _(Texto [múltiple])_ para filtrar resultados de búsqueda',
		'`-m <nombre>` o `--motor <nombre>` _(Texto)_ para usar otro motor'
    ],
	callx: '<etiquetas?(...)>',
	
	async searchImage(message, args, searchOpt = { cmdtag: '', nsfwtitle: 'Búsqueda NSFW', sfwtitle: 'Búsqueda' }) {
		if(message.channel.nsfw) {
			if(searchOpt.cmdtag.length) {
				let abort = true;
				switch(searchOpt.cmdtag) {
				case 'megumin':
					if(message.author.id !== peopleid.papita)
						await rakki.execute(message, []);
					else abort = false;
					break;
				case 'holo':
					await rakki.execute(message, []);
					break;
				default:
					abort = false;
				}
				if(abort) return;
			} else if(['megumin', 'holo'].some(b => args.includes(b))) {
				await rakki.execute(message, []);
				return;
			}
		}

		//Acción de comando
		message.channel.sendTyping();
		const inputengine = fetchFlag(args, {property: true, short: ['m'], long: ['motor'], callback: (x, i) => x[i], fallback: 'gelbooru' });
		const engine = inputengine.toLowerCase();
		if(!engines.includes(engine)) {
			message.channel.send(
				`:warning: El motor **${inputengine}** no aparece en la lista de motores soportados.\n` +
				`Usa \`${p_pure.raw}ayuda ${module.exports.name}\` para más información`
			);
			return;
		}
		const stags = [searchOpt.cmdtag, getBaseTags(engine, message.channel.nsfw)].join(' ');
		const extags = getSearchTags(args, engine, searchOpt.cmdtag);
		
		//Petición
		try {
			const response = await booru.search(engine, [stags, extags].join(' '), { limit: 100, random: true })
			//Manejo de respuesta
			if(!response.length) {
				message.channel.send({ content: `:warning: No hay resultados en **${inputengine}** para las tags **"${extags}"** en canales **${message.channel.nsfw ? 'NSFW' : 'SFW'}**` });
				return;
			}

			//Dar formato a respuesta
			const image = response[randRange(0, response.length)];
			const Embed = new MessageEmbed()
				.setColor(message.channel.nsfw ? '#38214e' : '#fa7b62')
				.setAuthor(`Desde ${image.booru.domain}`, (engine === 'gelbooru') ? 'https://i.imgur.com/outZ5Hm.png' : message.author.avatarURL({ dynamic: true, size: 128 }))
				.setTitle(message.channel.nsfw ? searchOpt.nsfwtitle : searchOpt.sfwtitle)
				.setImage(image.fileUrl);
			if(extags.length)
				Embed.addField('Tu búsqueda', `:mag_right: *${extags.trim().replace('*', '\\*').split(/ +/).join(', ')}*`)
			Embed
				.addField('Acciones', `<:tags:704612794921779290> Revelar etiquetas\n<:delete:704612795072774164> Eliminar`, true)
				.addField('Salsa', [
						`[Gelbooru](https://gelbooru.com/index.php?page=post&s=view&id=${image.id})`,
						image.source ? `[Original](${image.source})` : null
					].join('\n'), true);
				
			const sent = await message.channel.send({
				reply: { messageReference: message.id },
				embeds: [Embed]
			});
			const actions = [sent.client.emojis.cache.get('704612794921779290'), sent.client.emojis.cache.get('704612795072774164')];
			Promise.all(actions.map(action => sent.react(action)));
			const filter = (rc, user) => message.author.id === user.id && actions.some(action => rc.emoji.id === action.id);
			const collector = sent.createReactionCollector({ filter: filter, time: 4 * 60 * 1000 });
			let showtags = false;
			collector.on('collect', reaction => {
				if(reaction.emoji.id === actions[0].id) {
					if(!showtags) {
						Embed.addField(`Tags (${Math.min(image.tags.length, 40)}/${image.tags.length})`, `*${image.tags.slice(0,40).join(', ')}*`);
						Embed.fields[1].value = `<:delete:704612795072774164> Eliminar`;
						sent.edit({ embeds: [Embed] });
						showtags = true;
					}
				} else {
					if(!message.deleted) message.delete();
					sent.delete();
				}
			});
		} catch(error) {
			console.error(error);
			const errorembed = new MessageEmbed()
				.setColor('RED')
				.addField(
					'Ocurrió un error al realizar una petición',
					'Es probable que le hayan pegado un tiro al que me suministra las imágenes, así que prueba buscar más tarde, a ver si revive 👉👈\n' +
					'```js\n' +
					`${[error.name, error.message].join(': ')}\n` +
					'```'
				);
			message.channel.send({ embeds: [errorembed] });
		}

		if(Math.random() < (1 / 40)) {
			const noticesent = await message.channel.send(
				'<:bot:828736342372253697> Con la reciente incorporación del comando `p!buscar`, se están buscando **nuevos atajos de etiquetas para búsquedas**.\n' +
				'Si se te ocurre alguna tag que te gustaría escribir más fácilmente... ten, prefabriqué esto para ti:\n' +
				'`p!sugerir -t "Diccionario de Búsqueda" <atajo> → <etiqueta>`\n' +
				'Solo tienes que reemplazar los `<campos>` por el atajo y a qué etiqueta de booru se traduce. ¡Gracias de antemano!' +
				'Nota: las tags están adaptadas a Gelbooru. Por motivos de consistencia, deberías buscar las etiquetas ahí'
			);
			setTimeout(() => noticesent.delete(), 1000 * 60);
		}
	},

	execute: async (message, args) => await module.exports.searchImage(message, args),
};