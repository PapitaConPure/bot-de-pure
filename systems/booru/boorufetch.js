const { default: axios } = require('axios');
const BooruTags = require('../../localdata/models/boorutags');

/**
 * @typedef {Object} APIPostData
 * @property {Number} id
 * @property {String} title
 * @property {Array<String> | String} tags
 * @property {String} source
 * @property {Number} score
 * @property {Rating} rating
 * @property {Date | String | Number} created_at
 * @property {Number} creator_id
 * @property {String} file_url
 * @property {Number} width
 * @property {Number} height
 * @property {String} [preview_url]
 * @property {Number} [preview_width]
 * @property {Number} [preview_height]
 * @property {String} [sample_url]
 * @property {Number} [sample_width]
 * @property {Number} [sample_height]
 * @typedef {Post | APIPostData} PostResolvable
 * @typedef {'general'|'sensitive'|'questionable'|'explicit'} Rating
 */

/**
 * @class
 * Representa una conexión a un sitio Booru
 */
class Booru {
	/**@readonly @type {String}*/ static API_POSTS_URL = 'https://gelbooru.com/index.php?page=dapi&s=post&q=index';
	/**@readonly @type {String}*/ static API_TAGS_URL  = 'https://gelbooru.com/index.php?page=dapi&s=tag&q=index';
	/**@readonly @type {Number}*/ static TAGS_SEMAPHORE_MAX = 100_000_000;
	/**@readonly @type {Number}*/ static TAGS_CACHE_LIFETIME = 4 * 60 * 60e3;
	/**@readonly @type {Number}*/ static TAGS_DB_LIFETIME    = 4 * 60 * 60e3; //De momento, exactamente igual que la vida en caché

	/**@type {Map<String, Tag>}*/ static tagsCache = new Map();
	/**@type {Number}*/ static tagsSemaphoreCount = 0;
	/**@type {Number}*/ static tagsSemaphoreDone = 0;
	
	/**@typedef {{ apiKey: String, userId: String }} Credentials*/
	/**@type {Credentials}*/ credentials;

	/**
	 * @constructor
	 * @param {Credentials?} credentials Credenciales para autorizarse en la API
	 */
	constructor(credentials) {
		this.setCredentials(credentials);
	}

	/**
	 * Libera memoria de Tags guardadas en caché que no se han refrescado en mucho tiempo
	 * Se recomienda usar esto luego de llamar cualquier función que recupere Tags de un Post
	 */
	static cleanupTagsCache() {
		const now = Date.now();
		for(const [key, tag] of Booru.tagsCache.entries())
			if((now - (+tag.fetchTimestamp)) > Booru.TAGS_CACHE_LIFETIME)
				Booru.tagsCache.delete(key);
	}

	/**
	 * @typedef {Object} ExpectAPIFetchOptions
	 * @property {Boolean} [dontThrowOnEmptyFetch=false]
	 */
	/**
	 * Verifica que el código de estado de una respuesta sea 200 y que los datos de Post sean válidos
	 * @param {import('axios').AxiosResponse} response 
	 * @param {ExpectAPIFetchOptions} options
	 * @returns {Array<PostResolvable>}
	 * @throws {BooruError}
	 */
	static #expectPosts(response, options = {}) {
		options.dontThrowOnEmptyFetch ??= false;

		if(response.status !== 200)
			throw new BooruError(`Recolección de Posts de API de Booru fallida: ${response.statusText ?? 'Error desconocido'}`);

		if(!Array.isArray(response.data?.post)) {
			if(options.dontThrowOnEmptyFetch)
				return [];
			else
				throw new BooruError(`No se recolectó ningún Post de API de Booru`);
		}

		return response.data.post;
	}

	/**
	 * Verifica que el código de estado de una respuesta sea 200 y que los datos de Post sean válidos
	 * @param {import('axios').AxiosResponse} response 
	 * @param {ExpectAPIFetchOptions} options
	 * @returns {Array<TagResolvable>}
	 * @throws {BooruError}
	 */
	static #expectTags(response, options = {}) {
		options.dontThrowOnEmptyFetch ??= false;

		if(response.status !== 200 || !Array.isArray(response.data?.tag))
			throw new BooruError(`Recolección de Tags de API de Booru fallida: ${response.statusText ?? 'Error desconocido'}`);

		if(!Array.isArray(response.data?.tag)) {
			if(options.dontThrowOnEmptyFetch)
				return [];
			else
				throw new BooruError(`No se recolectó ninguna Tag de API de Booru`);
		}

		return response.data.tag;
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
		const { apiKey, userId } = this.#getCredentials();
		if(Array.isArray(tags))
			tags = tags.join(' ');
		
		const response = await axios.get(`${Booru.API_POSTS_URL}&json=1&api_key=${apiKey}&user_id=${userId}&limit=${searchOptions.limit}&tags=${tags}`);
		const posts = Booru.#expectPosts(response, { dontThrowOnEmptyFetch: true });
		return posts.map(p => new Post(p));
	}

	/**
	 * @param {String | Number} postId 
	 * @returns {Promise<Post | undefined>}
	 */
	async fetchPostById(postId) {
		const { apiKey, userId } = this.#getCredentials();
		if(![ 'string', 'number' ].includes(typeof postId))
			throw TypeError('ID de Post inválida');

		const response = await axios.get(`${Booru.API_POSTS_URL}&json=1&api_key=${apiKey}&user_id=${userId}&id=${postId}`);
		const [ post ] = Booru.#expectPosts(response);
		return new Post(post);
	}

	/**
	 * @param {String} postUrl
	 * @returns {Promise<Post | undefined>}
	 * @throws {TypeError | BooruError}
	 */
	async fetchPostByUrl(postUrl) {
		const { apiKey, userId } = this.#getCredentials();
		if(typeof postUrl !== 'string')
			throw TypeError('URL de Post inválida');

		postUrl = postUrl
			.replace(
				'page=post&s=view',
				'page=dapi&s=post&q=index&json=1')
			.replace(
				/&tags=[^&]+/,
				'');
		postUrl = `${postUrl}&api_key=${apiKey}&user_id=${userId}`;
		
		const response = await axios.get(postUrl);
		const [ post ] = Booru.#expectPosts(response);
		return new Post(post);
	}

	/**
	 * @param {Post} post
	 * @throws {ReferenceError | TypeError | BooruError}
	 */
	async fetchPostTags(post) {
		if(!Array.isArray(post?.tags))
			throw ReferenceError('Post inválido');

		return this.fetchTagsByNames(...post.tags);
	}

	/**
	 * 
	 * @param {String} postUrl 
	 * @throws {TypeError | BooruError}
	 */
	async fetchPostTagsByUrl(postUrl) {
		const post = await this.fetchPostByUrl(postUrl);
		return post
			? this.fetchTagsByNames(...post.tags)
			: undefined;
	}

	/**
	 * 
	 * @param {String | Number} postId 
	 * @throws {TypeError | BooruError}
	 */
	async fetchPostTagsById(postId) {
		const post = await this.fetchPostById(postId);
		return post
			? this.fetchTagsByNames(...post.tags)
			: undefined;
	}

	/**
	 * 
	 * @param {Array<String>} tagNames 
	 * @throws {TypeError | BooruError}
	 */
	async fetchTagsByNames(...tagNames) {
		const semaphoreId = Booru.tagsSemaphoreCount++ % Booru.TAGS_SEMAPHORE_MAX

		const { apiKey, userId } = this.#getCredentials();

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
			Booru.tagsSemaphoreDone = (Booru.tagsSemaphoreDone + 1) % Booru.TAGS_SEMAPHORE_MAX;
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
					const response = await axios.get(`${Booru.API_TAGS_URL}&json=1&api_key=${apiKey}&user_id=${userId}&names=${namesBatch}`);
					const tags = Booru.#expectTags(response);
					
					if(tags.length) {
						const newTags = tags.map(t => new Tag(t));
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
						},
					}));
		
					await BooruTags.bulkWrite(bulkOps);
				}
			};

			savedTags.forEach(t => Booru.tagsCache.set(t.name, t));
			return [ ...cachedTags, ...savedTags ];
		} finally {
			Booru.tagsSemaphoreDone = (Booru.tagsSemaphoreDone + 1) % Booru.TAGS_SEMAPHORE_MAX;
		}
	}

	/**
	 * Establece las credenciales a usar para cada búsqueda
	 * @param {Credentials} credentials Credenciales para autorizarse en la API
	 * @throws {ReferenceError | TypeError}
	 */
	setCredentials(credentials) {
		this.#expectCredentials(credentials);
		this.credentials = credentials;
		return this;
	}

	/**
	 * Recupera las credenciales de búsqueda establecidas
	 * @throws {ReferenceError | TypeError}
	 */
	#getCredentials() {
		this.#expectCredentials(this.credentials);
		return this.credentials;
	}

	/**
	 * Establece las credenciales a usar para cada búsqueda
	 * @param {Credentials} credentials Credenciales para autorizarse en la API
	 * @throws {ReferenceError | TypeError}
	 */
	#expectCredentials(credentials) {
		if(!credentials) throw ReferenceError('No se han definido credenciales');
		if(!credentials.apiKey || typeof credentials.apiKey !== 'string') throw TypeError('La clave de API es inválida');
		if(!credentials.userId || ![ 'string', 'number' ].includes(typeof credentials.userId)) throw TypeError('La ID de usuario es inválida');
	}
}

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
		this.creatorId = ('creatorId' in data) ? data.creatorId : data.creator_id;

		const createdAt = ('createdAt' in data) ? data.createdAt : data.created_at;
		this.createdAt = (typeof createdAt === 'string' || typeof createdAt === 'number') ? new Date(createdAt) : createdAt;

		
		this.fileUrl = ('fileUrl' in data) ? data.fileUrl : data.file_url;
		this.size = ('size' in data) ? data.size : [ data.width, data.height ];

		if('preview_url' in data) {
			this.previewUrl = data.preview_url;
			this.previewSize = [ data.preview_width, data.preview_height ];
		} else if('previewUrl' in data) {
			this.previewUrl = data.previewUrl;
			this.previewSize = data.size;
		}

		if('sample_url' in data) {
			this.sampleUrl = data.sample_url;
			this.sampleSize = [ data.sample_width, data.sample_height ];
		} else if('sampleUrl' in data) {
			this.sampleUrl = data.sampleUrl;
			this.sampleSize = data.size;
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

/**
 * @class
 * Representa una tag de {@linkcode Post} de un {@linkcode Booru}
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
			throw RangeError('Tipo de tag inválido. Solo se aceptan números: 0, 1, 2, 3, 4, 5, 6');

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

class BooruError extends Error {
    /**
	 * @param {String} message Mensaje del error
	 */
    constructor(message) {
        super(message);
        this.name = 'BooruError';
    }
}

module.exports = {
	Booru,
	Post,
	Tag,
	BooruError,
	TagTypes,
};
