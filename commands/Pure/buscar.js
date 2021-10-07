const { peopleid } = require('../../localdata/config.json');
const { randRange, fetchFlag } = require('../../func');
const { MessageEmbed, Permissions } = require('discord.js'); //Integrar discord.js
const { engines, getBaseTags, getSearchTags } = require('../../localdata/booruprops.js'); //Variables globales
const booru = require('booru');
const rakki = require('./rakkidei.js');
const { p_pure } = require('../../localdata/prefixget');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const brief = 'Muestra imágenes #THEME';
const desc = `${brief}\n` +
	'Por defecto, las imágenes se buscan con Gelbooru.\n' +
	'Si lo deseas, puedes usar otro `--motor` de esta lista:\n' +
	'```\n' +
	`${engines.map(e => `${e.charAt(0).toUpperCase()}${e.slice(1)}`).join(', ')}\n` +
	'```\n' +
	'**Nota:** #NSFW_NOTE\n' +
	'**Nota 2:** no todos los motores funcionan y con algunos no habrá búsqueda personalizada.';

const options = new CommandOptionsManager()
	.addParam('etiquetas', 'TEXT', 'para filtrar resultados de búsqueda', { poly: 'MULTIPLE', optional: true })
	.addFlag([], 'motor', 			'para usar otro motor', { name: 'nombre', type: 'TEXT' })
	.addFlag([], ['bomba', 'bomb'], 'para mostrar muchas imágenes');

module.exports = {
	name: 'buscar',
	aliases: [
        'imágenes', 'imagenes',
		'search', 'image',
		'img'
    ],
	brief: brief.replace('#THEME', 'de cualquier cosa'),
    desc: desc
		.replace('#THEME', 'de cualquier cosa')
		.replace('#NSFW_NOTE', 'en canales NSFW, los resultados serán, respectivamente, NSFW'),
	molds: { brief: brief, desc: desc },
    flags: [
        'common'
    ],
    options,
	callx: '<etiquetas?(...)>',
	
	async searchImage(message, args, searchOpt = { cmdtag: '', nsfwtitle: 'Búsqueda NSFW', sfwtitle: 'Búsqueda' }) {
		//Saber si el canal/thread es NSFW o perteneciente a un canal NSFW
		const isnsfw = message.channel.isThread()
			? message.channel.parent.nsfw
			: message.channel.nsfw;

		//Bannear lewds de Megumin y Holo >:C
		if(isnsfw) {
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
		const inputengine = fetchFlag(args, { property: true, long: ['motor'], callback: (x, i) => x[i], fallback: 'gelbooru' });
		const bomb = fetchFlag(args, { long: ['bomb', 'bomba'], callback: 5, fallback: 1 });
		const engine = inputengine.toLowerCase();
		if(!engines.includes(engine)) {
			message.channel.send(
				`:warning: El motor **${inputengine}** no aparece en la lista de motores soportados.\n` +
				`Usa \`${p_pure(message.guildId).raw}ayuda ${module.exports.name}\` para más información`
			);
			return;
		}
		const stags = [searchOpt.cmdtag, getBaseTags(engine, isnsfw)].join(' ');
		const extags = getSearchTags(args, engine, searchOpt.cmdtag);
		
		//Petición
		try {
			const response = await booru.search(engine, [stags, extags].join(' '), { limit: 100, random: true });
			//Manejo de respuesta
			if(!response.length) {
				message.channel.send({ content: `:warning: No hay resultados en **${inputengine}** para las tags **"${extags}"** en canales **${isnsfw ? 'NSFW' : 'SFW'}**` });
				return;
			}

			//Seleccionar imágenes
			const images = response
				.sort(() => 0.5 - Math.random())
				.slice(0, bomb);

			//Crear presentaciones
			const Embeds = [];
			images.forEach(image => {
				Embeds.push(new MessageEmbed()
					.setColor(isnsfw ? '#38214e' : '#fa7b62')
					.setImage(image.fileUrl));
			});

			//Formatear primera presentación
			Embeds[0]
				.setAuthor(`Desde ${images[0].booru.domain}`, (engine === 'gelbooru') ? 'https://i.imgur.com/outZ5Hm.png' : message.author.avatarURL({ dynamic: true, size: 128 }))
				.setTitle(isnsfw ? searchOpt.nsfwtitle : searchOpt.sfwtitle);
			if(extags.length)
				Embeds[0].addField('Tu búsqueda', `:mag_right: *${extags.trim().replace('*', '\\*').split(/ +/).join(', ')}*`);

			//Detallar acciones posteriores
			const le = bomb - 1; //Último embed
			const af = Embeds[le].fields.length; //Índice del campo de acciones
			Embeds[le].addField('Acciones', `<:tags:704612794921779290> Revelar etiquetas\n<:delete:704612795072774164> Eliminar`, true);

			//Rociar salsa sobre todo
			images.forEach((image, i) => {
				Embeds[i].addField('Salsa', [
					`[Gelbooru](https://gelbooru.com/index.php?page=post&s=view&id=${image.id})`,
					image.source ? `[Original](${image.source})` : null
				].join('\n'), true);
			});

			//Enviar mensaje y esperar reacciones
			const sent = await message.channel.send({
				reply: { messageReference: message.id },
				embeds: Embeds
			});
			const actions = [sent.client.emojis.cache.get('704612794921779290'), sent.client.emojis.cache.get('704612795072774164')];
			Promise.all(actions.map(action => sent.react(action)));
			const filter = (rc, user) => message.author.id === user.id && actions.some(action => rc.emoji.id === action.id);
			const collector = sent.createReactionCollector({ filter: filter, time: 4 * 60 * 1000 });
			let showtags = false;
			collector.on('collect', reaction => {
				if(reaction.emoji.id === actions[0].id) {
					if(!showtags) {
						images.forEach((image, i) => {
							Embeds[i].addField(`Tags (${Math.min(image.tags.length, 40)}/${image.tags.length})`, `*${image.tags.slice(0,40).join(', ')}*`);
						});
						Embeds[le].fields[af].value = `<:delete:704612795072774164> Eliminar`;
						sent.edit({ embeds: Embeds });
						showtags = true;
					}
				} else {
					sent.delete();
					if(!message.deleted && message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.MANAGE_MESSAGES))
						message.delete();
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
	},

	execute: async (message, args) => await module.exports.searchImage(message, args),
};