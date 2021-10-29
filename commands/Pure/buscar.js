const { peopleid } = require('../../localdata/config.json');
const { fetchFlag } = require('../../func');
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
	.addParam('etiquetas', 'TEXT', 'para filtrar resultados de búsqueda', { poly: 'MULTIPLE', optional: true, polymax: 8 })
	.addFlag([], 'motor', 			'para usar otro motor', { name: 'nombre', type: 'TEXT' })
	.addFlag([], ['bomba', 'bomb'], 'para mostrar una cierta cantidad de imágenes', { name: 'cnt', type: 'NUMBER' });

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
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async searchImage(request, args, isSlash, searchOpt = { cmdtag: '', nsfwtitle: 'Búsqueda NSFW', sfwtitle: 'Búsqueda' }) {
		//Saber si el canal/thread es NSFW o perteneciente a un canal NSFW
		const isnsfw = request.channel.isThread()
			? request.channel.parent.nsfw
			: request.channel.nsfw;

		//Bannear lewds de Megumin y Holo >:C
		if(isnsfw) {
			if(searchOpt.cmdtag.length) {
				let abort = true;
				switch(searchOpt.cmdtag) {
				case 'megumin':
					if(request.author.id !== peopleid.papita)
						await rakki.execute(request, [], isSlash);
					else abort = false;
					break;
				case 'holo':
					await rakki.execute(request, [], isSlash);
					break;
				default:
					abort = false;
				}
				if(abort) return;
			} else if(['megumin', 'holo'].some(b => args.includes(b)))
				return await rakki.execute(request, [], isSlash);
		}

		//Acción de comando
		if(!isSlash) request.channel.sendTyping();
		const inputengine = isSlash
			? options.fetchFlag(args, 'motor', { callback: 'gelbooru', fallback: 'gelbooru' })
			: fetchFlag(args, { property: true, long: ['motor'], callback: (x, i) => x[i], fallback: 'gelbooru' });
		const bomb = isSlash
			? options.fetchFlag(args, 'bomba', { callback: 5, fallback: 1 })
			: fetchFlag(args, {
				property: true,
				...options.flags.get('bomba').structure,
				callback: (x,i) => {
					const cnt = parseInt(x[i]);
					if(isNaN(cnt)) return 1;
					return Math.max(2, Math.min(cnt, 10));
				},
				fallback: 1,
			});
		const engine = inputengine.toLowerCase();
		if(!engines.includes(engine))
			return await request.reply(
				`:warning: El motor **${inputengine}** no aparece en la lista de motores soportados.\n` +
				`Usa \`${p_pure(request.guild.id).raw}ayuda ${module.exports.name}\` para más información`
			);
		const stags = [searchOpt.cmdtag, getBaseTags(engine, isnsfw)].join(' ');
		const words = isSlash
			? options.fetchParamPoly(args, 'etiquetas', args.getString, null).filter(wrd => wrd)
			: args;
		const extags = getSearchTags(words, engine, searchOpt.cmdtag);
		
		//Petición
		try {
			const response = await booru.search(engine, [stags, extags].join(' '), { limit: 100, random: true });
			//Manejo de respuesta
			if(!response.length)
				return await request.reply({ content: `:warning: No hay resultados en **${inputengine}** para las tags **"${extags}"** en canales **${isnsfw ? 'NSFW' : 'SFW'}**` });

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
			const author = (request.author ?? request.user);
			Embeds[0]
				.setAuthor(`Desde ${images[0].booru.domain}`, (engine === 'gelbooru') ? 'https://i.imgur.com/outZ5Hm.png' : user.avatarURL({ dynamic: true, size: 128 }))
				.setTitle(isnsfw ? searchOpt.nsfwtitle : searchOpt.sfwtitle);
			if(extags.length)
				Embeds[0].addField('Tu búsqueda', `:mag_right: *${extags.trim().replace('*', '\\*').split(/ +/).join(', ')}*`);

			//Detallar acciones posteriores
			const le = images.length - 1; //Último embed
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
			const sentqueue = (await Promise.all([
				request.reply({ embeds: Embeds }),
				isSlash ? request.fetchReply() : null,
			])).filter(sq => sq);
			const sent = sentqueue.pop();
			const actions = [sent.client.emojis.cache.get('704612794921779290'), sent.client.emojis.cache.get('704612795072774164')];
			Promise.all(actions.map(action => sent.react(action)));
			const filter = (rc, user) => author.id === user.id && actions.some(action => rc.emoji.id === action.id);
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
					if(!isSlash && !request.deleted && request.guild.me.permissionsIn(request.channel).has(Permissions.FLAGS.MANAGE_MESSAGES))
						request.delete();
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
			return await request.reply({ embeds: [errorembed] });
		}
	},

	execute: async (request, args, isSlash = false) => await module.exports.searchImage(request, args, isSlash),
};