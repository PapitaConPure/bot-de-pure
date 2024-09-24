const { default: axios } = require('axios');
const BooruTags = require('../../localdata/models/boorutags');

/**
 * @class
 * Representa una conexión a un sitio Booru
 */
class Booru {
	/**@typedef {{ apiKey: String, userId: String }} Credentials*/

	/**@type {Readonly<Number>}*/ static TAGS_SEMAPHORE_MAX = 100_000_000;
	/**@type {Readonly<Number>}*/ static TAGS_CACHE_LIFETIME = 4 * 60 * 60e3;
	/**@type {Map<String, Tag>}*/ static tagsCache = new Map();
	/**@type {Number}*/ static tagsSemaphoreCount = 0;
	/**@type {Number}*/ static tagsSemaphoreDone = 0;
	
	/**@type {String}*/ apiPostsUrl;
	/**@type {String}*/ apiTagsUrl;

	/**
	 * @constructor
	 * @param {Credentials?} credentials Credenciales para autorizarse en la API
	 */
	constructor(credentials) {
		this.setCredentials(credentials);
		this.apiPostsUrl = 'https://gelbooru.com/index.php?page=dapi&s=post&q=index';
		this.apiTagsUrl  = 'https://gelbooru.com/index.php?page=dapi&s=tag&q=index';
	}

	/**
	 * @typedef {Object} BooruSearchOptions
	 * @property {Number} [limit=1] Límite de resultados de la búsqueda
	 * @property {Boolean} [showDeleted] Si mostrar posts que fueron eliminados del Booru (true) o no (false)
	 * @property {Boolean} [random] Si los resultados se ordenan de forma aleatoria (true) o no (false)
	 */
	/**
	 * Devuelve resultados de búsqueda en forma de {@linkcode Post}s
	 * @param {String | Array<String>} tags Tags a buscar
	 * @param {BooruSearchOptions} searchOptions Opciones de búsqueda
	 * @returns {Promise<Array<Post>>}
	 */
	async search(tags, searchOptions = { limit: 1 }) {
		const { apiKey, userId } = this.getCredentials();
		if(Array.isArray(tags))
			tags = tags.join(' ');
		const response = await axios.get(`${this.apiPostsUrl}&json=1&api_key=${apiKey}&user_id=${userId}&limit=${searchOptions.limit}&tags=${tags}`);
		if(!response.data?.post?.length) return [];
		return response.data.post.map(p => new Post(p));
	}

	/**
	 * @param {String | Number} postId 
	 * @returns {Promise<Post | undefined>}
	 */
	 async fetchPostById(postId) {
		const { apiKey, userId } = this.getCredentials();
		if(![ 'string', 'number' ].includes(typeof postId))
			throw TypeError('ID de Post inválida');
		const response = await axios.get(`${this.apiPostsUrl}&json=1&api_key=${apiKey}&user_id=${userId}&id=${postId}`);
		if(!response.data?.post?.length) return undefined;
		return new Post(response.data.post[0]);
	}

	/**
	 * @param {String} postUrl
	 * @returns {Promise<Post | undefined>}
	 */
	 async fetchPostByUrl(postUrl) {
		const { apiKey, userId } = this.getCredentials();
		if(typeof postUrl !== 'string') throw TypeError('URL de Post inválida');
		postUrl = postUrl
			.replace(
				'page=post&s=view',
				'page=dapi&s=post&q=index&json=1')
			.replace(
				/&tags=[^&]+/,
				'');
		postUrl = `${postUrl}&api_key=${apiKey}&user_id=${userId}`;
		const response = await axios.get(postUrl);
		if(!response.data?.post?.length) return undefined;
		return new Post(response.data.post[0]);
	}

	/**
	 * @param {Post} post
	 */
	async fetchPostTags(post) {
		return this.fetchTagsByNames(...post.tags);
	}

	/**
	 * 
	 * @param {String | Number} postId 
	 */
	async fetchPostTagsById(postId) {
		const post = await this.fetchPostById(postId);
		return this.fetchTagsByNames(...post.tags);
	}

	/**
	 * 
	 * @param {Array<String>} tagNames 
	 */
	async fetchTagsByNames(...tagNames) {
		const semaphoreId = Booru.tagsSemaphoreCount++ % Booru.TAGS_SEMAPHORE_MAX

		const { apiKey, userId } = this.getCredentials();

		if(tagNames.some(t => typeof t !== 'string'))
			throw TypeError('Tags inválidas');

		while(semaphoreId !== Booru.tagsSemaphoreDone)
			await new Promise(resolve => setTimeout(resolve, 50));

		/**@type {Array<Tag>}*/
		const cachedTags = [];
		/**@type {Array<String>}*/
		const uncachedTagNames = [];
		tagNames.forEach(tn => {
			const cachedTag = Booru.tagsCache.get(tn);
			if(cachedTag && (Date.now() - Booru.TAGS_CACHE_LIFETIME) < (+cachedTag.fetchTimestamp))
				cachedTags.push(cachedTag);
			else
				uncachedTagNames.push(tn);
		});

		if(!uncachedTagNames.length) {
			Booru.tagsSemaphoreDone++;
			if(Booru.tagsSemaphoreDone > Booru.TAGS_SEMAPHORE_MAX)
				Booru.tagsSemaphoreDone = 0;
			return cachedTags;
		}
		
		try {
			const query = { name: { $in: uncachedTagNames } };
			const savedTags = (await BooruTags.find(query)).map(t => new Tag(t));

			const savedTagNames = savedTags.map(t => t.name);
			const missingTagNames = uncachedTagNames.filter(tn => !savedTagNames.includes(tn));
			
			if(missingTagNames.length) {
				const fetchedTags = [];

				for(let i = 0; i < missingTagNames.length; i += 100) {
					const namesBatch = missingTagNames.slice(i, i + 100).join('%20');
					const response = await axios.get(`${this.apiTagsUrl}&json=1&api_key=${apiKey}&user_id=${userId}&names=${namesBatch}`);
					if(response.data?.tag?.length) {
						const newTags = (/**@type {Array<TagResolvable>}*/(response.data.tag)).map(t => new Tag(t));
						fetchedTags.push(...newTags);
					}
				}
	
				if(fetchedTags.length) {
					savedTags.push(...fetchedTags);
					const bulkOps = fetchedTags.map(t => ({
						updateOne: {
							filter: { id: t.id },
							update: { $set: t },
							upsert: true,
						}
					}));
		
					await BooruTags.bulkWrite(bulkOps);
				}
			};

			savedTags.forEach(t => Booru.tagsCache.set(t.name, t));
			return [ ...cachedTags, ...savedTags ];
		} finally {
			Booru.tagsSemaphoreDone++;
			if(Booru.tagsSemaphoreDone > Booru.TAGS_SEMAPHORE_MAX)
				Booru.tagsSemaphoreDone = 0;
		}
	}

	/**
	 * Establece las credenciales a usar para cada búsqueda
	 * @param {Credentials} credentials Credenciales para autorizarse en la API
	 */
	setCredentials(credentials) {
		this.expectCredentials(credentials);
		this.credentials = credentials;
		return this;
	}

	/**
	 * Recupera las credenciales de búsqueda establecidas
	 */
	getCredentials() {
		this.expectCredentials(this.credentials);
		return this.credentials;
	}

	/**
	 * Establece las credenciales a usar para cada búsqueda
	 * @param {Credentials} credentials Credenciales para autorizarse en la API
	 */
	expectCredentials(credentials) {
		if(!credentials) throw ReferenceError('No se han definido credenciales');
		if(!credentials.apiKey || typeof credentials.apiKey !== 'string') throw TypeError('La clave de API es inválida');
		if(!credentials.userId || ![ 'string', 'number' ].includes(typeof credentials.userId)) throw TypeError('La ID de usuario es inválida');
	}
}

/**
 * @typedef {Post | Object} PostResolvable
 * @typedef {'general'|'sensitive'|'questionable'|'explicit'} Rating
 * @typedef {{ maxTags?: Number, title?: String, footer?: String, cornerIcon?: String, manageableBy?: String, isNotFeed?: Boolean }} PostFormatData
 * @typedef {PostFormatData & { ids: Array<String>, tags: String, faults?: Number }} FeedData
 */

/**
 * @class
 * Representa una imagen publicada en un {@linkcode Booru}
 */
class Post {
	/**@type {Number}*/ id;
	/**@type {String}*/ title;
	/**@type {Array<String>}*/ tags;
	/**@type {String}*/ source;
	/**@type {Number}*/ score;
	/**@type {Rating}*/ rating;
	/**@type {Date}*/ createdAt;
	/**@type {Number}*/ creatorId;
	/**@type {String}*/ fileUrl;
	/**@type {Array<Number>}*/ size;
	/**@type {String?}*/ previewUrl;
	/**@type {Array<Number>?}*/ previewSize;
	/**@type {String?}*/ sampleUrl;
	/**@type {Array<Number>?}*/ sampleSize;

	/**
	 * @constructor
	 * @param {PostResolvable} data
	 */
	constructor(data) {
		this.id = data.id;
		this.title = data.title;
		this.tags = Array.isArray(data.tags) ? data.tags : data.tags?.split(' ');
		this.source = data.source;
		this.score = data.score;
		this.rating = data.rating;
		this.createdAt = data.created_at;
		this.creatorId = data.creator_id;
		this.fileUrl = data.file_url;
		this.size = [ data.width, data.height ];
		if(data.preview_url) {
			this.previewUrl = data.preview_url;
			this.previewSize = [ data.preview_width, data.preview_height ];
		}
		if(data.sample_url) {
			this.sampleUrl = data.sample_url;
			this.sampleSize = [ data.sample_width, data.sample_height ];
		}
	}
}

const TagTypes = /**@type {const}*/({
	GENERAL:    0,
	ARTIST:     1,
	UNKNOWN:    2,
	COPYRIGHT:  3,
	CHARACTER:  4,
	METADATA:   5,
	DEPRECATED: 6,
});
/**@typedef {import('types').ValuesOf<TagTypes>} TagType*/

/**
 * @typedef {{ id: Number, name: String, count: Number, type: TagType | Number, ambiguous?: Boolean, fetchTimestamp: Date }} TagData
 * @typedef {Tag | TagData} TagResolvable
 */

class Tag {
	/**@type {Number}*/ id;
	/**@type {String}*/ name;
	/**@type {Number}*/ count;
	/**@type {TagType}*/ type;
	/**@type {Boolean?}*/ ambiguous;
	/**@type {Date}*/ fetchTimestamp;

	/**
	 * @constructor
	 * @param {TagResolvable} data
	 */
	constructor(data) {
		if(!Object.values(TagTypes).some(t => t === data.type))
			throw 'Tipo de tag inválido. Solo se aceptan números: 0, 1, 2, 3, 4, 5, 6';

		this.id = data.id;
		this.name = data.name;
		this.count = data.count;
		this.type = /**@type {TagType}*/(data.type);
		this.ambiguous = !!data.ambiguous;
		this.fetchTimestamp = data.fetchTimestamp || new Date(Date.now());
	}

	get typeName() {
		switch(this.type) {
		case TagTypes.GENERAL:    return 'General';
		case TagTypes.ARTIST:     return 'Artist';
		case TagTypes.COPYRIGHT:  return 'Copyright';
		case TagTypes.CHARACTER:  return 'Character';
		case TagTypes.METADATA:   return 'Metadata';
		case TagTypes.DEPRECATED: return 'Deprecated';
		default: return 'Unknown';
		}
	}
	
	toString() {
		return `{${this.id} / ${this.typeName}} ${this.count} ${this.name}`;
	}
}

/*async function booruTagsFetchTest() {
	const mongoose = require('mongoose');
	mongoose.set("strictQuery", false);
	mongoose.connect(require('../../localenv.json')?.dburi, {
		//@ts-expect-error
		useUnifiedTopology: true,
		useNewUrlParser: true,
	});

	const booruApiKey = require('../../localenv.json')?.booruapikey;
	const booruUserId = require('../../localenv.json')?.booruuserid;
	const booru = new Booru({ apiKey: booruApiKey, userId: booruUserId });
	const post1 = await booru.fetchPostByUrl('https://gelbooru.com/index.php?page=post&s=view&id=10729083&tags=minato_aqua');
	const post2 = await booru.fetchPostByUrl('https://gelbooru.com/index.php?page=post&s=view&id=10721010&tags=minato_aqua');
	const [ tags1, tags2 ] = await Promise.all([
		booru.fetchPostTagsById(post1.id),
		booru.fetchPostTagsById(post2.id),
	]);
	console.log('tags1');
	console.table(tags1.map(t => ({ id: t.id, name: t.name, count: t.count, type: t.typeName, ambiguous: t.ambiguous })));
	console.log('tags2');
	console.table(tags2.map(t => ({ id: t.id, name: t.name, count: t.count, type: t.typeName, ambiguous: t.ambiguous })));
	console.log('finished');
}
booruTagsFetchTest();*/

module.exports = {
	Booru,
	Post,
	Tag,
	TagTypes,
};
