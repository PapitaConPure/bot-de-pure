const { peopleid } = require('../../localdata/config.json');
const { fetchFlag } = require('../../func');
const { MessageEmbed, Permissions } = require('discord.js'); //Integrar discord.js
const { engines, getBaseTags, getSearchTags } = require('../../localdata/booruprops.js'); //Variables globales
const { formatBooruPostMessage } = require('../../systems/boorusend.js');
const booru = require('booru');
const rakki = require('./rakkidei.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
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
	.addParam('etiquetas', 'TEXT',  'para filtrar resultados de búsqueda', { optional: true })
//	.addFlag([], 'motor', 			'para usar otro motor', { name: 'nombre', type: 'TEXT' })
	.addFlag([], ['bomba', 'bomb'], 'para mostrar una cierta cantidad de imágenes', { name: 'cnt', type: 'NUMBER' });

module.exports = {
	name: 'buscar',
	aliases: [
        'imágenes', 'imagenes',
		'search', 'image',
		'img',
    ],
	brief: brief.replace('#THEME', 'de cualquier cosa'),
    desc: desc
		.replace('#THEME', 'de cualquier cosa')
		.replace('#NSFW_NOTE', 'en canales NSFW, los resultados serán, respectivamente, NSFW'),
	molds: { brief: brief, desc: desc },
    flags: [
        'common',
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
				return rakki.execute(request, [], isSlash);
		}

		//Acción de comando
		if(!isSlash) request.channel.sendTyping();
		const poolSize = isSlash
			? options.fetchFlag(args, 'bomba', { callback: x => Math.max(2, Math.min(x, 10)), fallback: 1 })
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
		const stags = [searchOpt.cmdtag, getBaseTags('gelbooru', isnsfw)].join(' ');
		const words = isSlash
			? (args.getString('etiquetas', false) ?? '').split(/ +/)
			: args;
		const extags = getSearchTags(words, 'gelbooru', searchOpt.cmdtag);
		/**@type {import('discord.js').User} */
		const author = (request.author ?? request.user);
		
		//Petición
		try {
			const response = await booru.search('gelbooru', [stags, extags].join(' '), { limit: 100, random: true });
			//Manejo de respuesta
			if(!response.length)
				return request.reply({ content: `:warning: No hay resultados en **Gelbooru** para las tags **"${extags}"** en canales **${isnsfw ? 'NSFW' : 'SFW'}**` });

			//Seleccionar imágenes
			const posts = response
				.sort(() => 0.5 - Math.random())
				.slice(0, poolSize);

			//Crear presentaciones
			/**@type {Array<MessageEmbed>}*/
			const messages = posts.map(post => formatBooruPostMessage(post, {
				maxTags: 40,
				title: isnsfw ? searchOpt.nsfwtitle : searchOpt.sfwtitle,
				cornerIcon: author.avatarURL({ size: 128, dynamic: true }),
				manageableBy: author.id,
			}));
			if(extags.length)
				messages[posts.length - 1].embeds[0].addField('Tu búsqueda', `:mag_right: *${extags.trim().replace('*', '\\*').split(/ +/).join(', ')}*`);

			//Enviar mensajes
			await request.reply(messages.shift());
			return Promise.all(messages.map(message => request.channel.send(message)));
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
			return request.reply({ embeds: [errorembed] });
		}
	},

	execute: async (request, args, isSlash = false) => await module.exports.searchImage(request, args, isSlash),
};