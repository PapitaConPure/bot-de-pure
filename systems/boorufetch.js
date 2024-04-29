const { default: axios } = require('axios');

/**
 * @class
 * Representa una conexión a un sitio Booru
 */
class Booru {
    /**@typedef {{ apiKey: String, userId: String }} Credentials*/

    /**
     * @constructor
     * @param {Credentials?} credentials Credenciales para autorizarse en la API
     */
    constructor(credentials) {
        this.setCredentials(credentials);
        this.apiPostsUrl = 'https://gelbooru.com/index.php?page=dapi&s=post&q=index';
    }

    /**
     * Establece las credenciales a usar para cada búsqueda
     * @param {Credentials} credentials Credenciales para autorizarse en la API
     */
    setCredentials(credentials) {
        if(!credentials) throw ReferenceError('No se han definido credenciales');
        if(!credentials.apiKey || !credentials.userId) throw TypeError('Credenciales inválidas');
        this.credentials = credentials;
        return this;
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
        postUrl = postUrl.replace(
			'page=post&s=view',
			'page=dapi&s=post&q=index&json=1',
		);
        postUrl = `${postUrl}&api_key=${apiKey}&user_id=${userId}`;
        const response = await axios.get(postUrl);
        if(!response.data?.post?.length) return undefined;
        return new Post(response.data.post[0]);
    }

    getCredentials() {
        if(!this.credentials) throw ReferenceError('No se han definido credenciales');
        return this.credentials;
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

module.exports = {
    Booru,
    Post,
}