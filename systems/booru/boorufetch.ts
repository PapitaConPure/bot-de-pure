import BooruTags from '../../models/boorutags';
import { shuffleArray, decodeEntities } from '../../func';
import { noDataBase } from '../../data/globalProps';
import { ValuesOf } from '../../types/util';
import { fetchExt, FetchResult } from '../../utils/fetchext';

export const PostRating = ({
	General: 'general',
	Sensitive: 'sensitive',
	Questionable: 'questionable',
	Explicit: 'explicit',
}) as const;
type Rating = ValuesOf<typeof PostRating>;

export interface APIPostData {
	id: number;
	title: string;
	tags: string[] | string;
	source: string | string[];
	score: number;
	rating: Rating;
	created_at: Date | string | number;
	creator_id: number;
	file_url: string;
	width: number;
	height: number;
	preview_url?: string;
	preview_width?: number;
	preview_height?: number;
	sample_url?: string;
	sample_width?: number;
	sample_height?: number;
}

export type PostResolvable = Post | APIPostData;

/**@satisfies {Record<string, number>}*/
export const TagTypes = ({
	GENERAL:    0,
	ARTIST:     1,
	UNKNOWN:    2,
	COPYRIGHT:  3,
	CHARACTER:  4,
	METADATA:   5,
	DEPRECATED: 6,
}) as const;
export type TagType = ValuesOf<typeof TagTypes>;

interface APITagData {
	id: number;
	name: string;
	count: number;
	type: TagType | number;
	ambiguous?: boolean;
}

interface TagData {
	id: number;
	name: string;
	count: number;
	type: TagType | number;
	ambiguous?: boolean;
	fetchTimestamp: Date;
}

export type TagResolvable = Tag | TagData | APITagData;

export interface Credentials {
	apiKey: string;
	userId: string;
}

interface ExpectAPIFetchOptions {
	dontThrowOnEmptyFetch?: boolean;
}

interface ExpectAPITagFetchOptions {
	tags?: string;
}

interface BooruSearchOptions {
	limit?: number;
	random?: boolean;
}

/**@class Representa una conexión a un sitio Booru.*/
export class Booru {
	static readonly API_URI       = 'https://gelbooru.com/index.php';
	static readonly API_POSTS_URL = 'https://gelbooru.com/index.php';
	static readonly API_TAGS_URL  = 'https://gelbooru.com/index.php?page=dapi&s=tag&q=index';

	static readonly POSTS_API = Booru.#createBooruEndpoint({
		//timeout: 10000,
		page: 'dapi',
		s: 'post',
		q: 'index',
		json: '1',
	});

	static readonly TAGS_API = Booru.#createBooruEndpoint({
		//timeout: 10000,
		page: 'dapi',
		s: 'tag',
		q: 'index',
		json: '1',
	});

	static readonly TAGS_SEMAPHORE_MAX: number  = 100_000_000;
	static readonly TAGS_CACHE_LIFETIME: number = 4 * 60 * 60e3;
	static readonly TAGS_DB_LIFETIME: number    = 4 * 60 * 60e3; //De momento, exactamente igual que la vida en caché

	static tagsCache: Map<string, Tag> = new Map();
	static tagsSemaphoreCount: number = 0;
	static tagsSemaphoreDone: number = 0;

	credentials: Credentials;

	/**@param credentials Credenciales para autorizarse en la API*/
	constructor(credentials: Credentials | null) {
		this.setCredentials(credentials);
	}

	static #createBooruEndpoint(defaultParams: Record<string, string>) {
		const endpointURL = new URL(Booru.API_URI);

		for(const [ name, value ] of Object.entries(defaultParams))
			endpointURL.searchParams.set(name, value);

		return {
			async request<TSchema>(params: Record<string, unknown>) {
				const searchURL = new URL(endpointURL);

				for(const [ name, value ] of Object.entries(params))
					searchURL.searchParams.set(name, `${value}`);

				return fetchExt<TSchema>(searchURL, {
					type: 'json',
					init: {
						referrer: 'https://papitaconpure.github.io',
						signal: AbortSignal.timeout(10_000),
					},
				});
			},
		};
	}

	/**
	 * @description
	 * Libera memoria de Tags guardadas en caché que no se han refrescado en mucho tiempo.
	 *
	 * Se recomienda usar esto luego de llamar cualquier función que recupere Tags de un Post.
	 */
	static cleanupTagsCache() {
		const now = Date.now();
		for(const [ key, tag ] of Booru.tagsCache.entries())
			if((now - (+tag.fetchTimestamp)) > Booru.TAGS_CACHE_LIFETIME)
				Booru.tagsCache.delete(key);
	}

	/**
	 * @description Verifica que el código de estado de una respuesta sea 200 y que los datos de Post sean válidos.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownPostError}
	 */
	static #expectPosts(fetchResult: FetchResult<{ post: APIPostData[] }>, options: ExpectAPIFetchOptions = {}): PostResolvable[] {
		const { dontThrowOnEmptyFetch = false } = options;

		if(fetchResult.success === false)
			throw new BooruFetchError(`Booru API Posts fetch failed: ${fetchResult.error.name} ${fetchResult.error.message || ''}`, { cause: fetchResult.error });

		if(!Array.isArray(fetchResult.data?.post)) {
			if(dontThrowOnEmptyFetch)
				return [];
			else
				throw new BooruUnknownPostError(`Couldn't fetch any Posts from the Booru API`);
		}

		return fetchResult.data.post;
	}

	/**
	 * @description Verifica que el código de estado de una respuesta sea 200 y que los datos de Post sean válidos.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownTagError}
	 */
	static #expectTags(fetchResult: FetchResult<{ tag: APITagData[] }>, options: ExpectAPIFetchOptions & ExpectAPITagFetchOptions = {}): TagResolvable[] {
		const {
			dontThrowOnEmptyFetch = false,
			tags = null,
		} = options;

		if(fetchResult.success === false)
			throw new BooruFetchError(`Booru API Tags fetch failed: ${fetchResult.error.name} ${fetchResult.error.message || ''}`, { cause: fetchResult.error });

		if(!Array.isArray(fetchResult.data?.tag)) {
			if(dontThrowOnEmptyFetch)
				return [];
			else
				throw new BooruUnknownTagError(`Couldn't fetch any Tags from the Booru API${tags ? `. Tried to fetch: ${tags}` : ''}`);
		}

		return fetchResult.data.tag;
	}

	/**
	 * @description Devuelve resultados de búsqueda en forma de {@linkcode Post}s.
	 * @param tags Tags a buscar
	 * @param searchOptions Opciones de búsqueda
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async search(tags: string | string[], searchOptions: BooruSearchOptions = {}): Promise<Post[]> {
		const { limit = 1, random = false } = searchOptions;

		const { apiKey, userId } = this.#getCredentials();
		if(Array.isArray(tags))
			tags = tags.join(' ');

		const fetchResult = await Booru.POSTS_API.request<{ post: APIPostData[] }>({
			'api_key': apiKey,
			'user_id': userId,
			'limit': limit,
			'tags': tags,
		});

		const posts = Booru.#expectPosts(fetchResult, { dontThrowOnEmptyFetch: true });

		if(random)
			shuffleArray(posts);

		return posts.map(p => new Post(p));
	}

	/**
	 * @description Obtiene y devuelve un {@linkcode Post} por ID.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownPostError}
	 */
	async fetchPostById(postId: string | number): Promise<Post | undefined> {
		const { apiKey, userId } = this.#getCredentials();
		if(![ 'string', 'number' ].includes(typeof postId))
			throw TypeError('Invalid Post ID');

		const response = await Booru.POSTS_API.request<{ post: APIPostData[] }>({
			'api_key': apiKey,
			'user_id': userId,
			'id': postId,
		});
		const [ post ] = Booru.#expectPosts(response);
		return new Post(post);
	}

	/**
	 * @description Obtiene y devuelve un {@linkcode Post} por enlace.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostByUrl(postUrl: string): Promise<Post | undefined> {
		const { apiKey, userId } = this.#getCredentials();

		if(typeof postUrl !== 'string')
			throw TypeError('Invalid Post URL');

		const url = new URL(postUrl);
		url.searchParams.set('page', 'dapi');
		url.searchParams.set('s', 'post');
		url.searchParams.set('q', 'index');
		url.searchParams.set('json', '1');
		url.searchParams.delete('tags');
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('user_id', userId);

		const response = await fetchExt<{ post: APIPostData[] }>(url.toString());
		const [ post ] = Booru.#expectPosts(response);
		return new Post(post);
	}

	/**
	 * @description Obtiene y devuelve las {@linkcode Tag}s del {@linkcode Post} indicado.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostTags(post: Post) {
		if(!Array.isArray(post?.tags))
			throw ReferenceError('Invalid Post');

		return this.fetchTagsByNames(...post.tags);
	}

	/**
	 * @description Obtiene un {@linkcode Post} desde el enlace indicado y devuelve sus {@linkcode Tag}s.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostTagsByUrl(postUrl: string) {
		const post = await this.fetchPostByUrl(postUrl);
		return post
			? this.fetchTagsByNames(...post.tags)
			: undefined;
	}

	/**
	 * @description Obtiene el {@linkcode Post} con la ID indicada y devuelve sus {@linkcode Tag}s.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostTagsById(postId: string | number) {
		const post = await this.fetchPostById(postId);
		return post
			? this.fetchTagsByNames(...post.tags)
			: undefined;
	}

	/**
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchTagsByNames(...tagNames: string[]) {
		const semaphoreId = Booru.tagsSemaphoreCount++ % Booru.TAGS_SEMAPHORE_MAX;

		const { apiKey, userId } = this.#getCredentials();

		if(tagNames.some(t => typeof t !== 'string'))
			throw TypeError('Invalid Tags');

		while(semaphoreId !== Booru.tagsSemaphoreDone)
			await new Promise(resolve => setTimeout(resolve, 50));

		const cachedTags: Tag[] = [];
		const uncachedTagNames: string[] = [];

		tagNames
			.map(decodeEntities)
			.forEach(tn => {
				const cachedTag = Booru.tagsCache.get(tn);
				if(cachedTag && (Date.now() - (+cachedTag.fetchTimestamp)) < Booru.TAGS_CACHE_LIFETIME)
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
			const savedTags = (noDataBase ? [] : await BooruTags.find(query)).map(t => new Tag(t));

			const savedTagNames = savedTags.map(t => t.name);
			const missingTagNames = uncachedTagNames.filter(tn => !savedTagNames.includes(tn));

			if(missingTagNames.length) {
				const fetchedTags: Tag[] = [];

				for(let i = 0; i < missingTagNames.length; i += 100) {
					const namesBatch = missingTagNames.slice(i, i + 100).join(' ');
					const response = await Booru.TAGS_API.request<{ tag: APITagData[] }>({
						'api_key': apiKey,
						'user_id': userId,
						'names': namesBatch,
					});
					const tags = Booru.#expectTags(response, { tags: namesBatch });

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

					!noDataBase && await BooruTags.bulkWrite(bulkOps);
				}
			}

			savedTags.forEach(t => Booru.tagsCache.set(t.name, t));
			return [ ...cachedTags, ...savedTags ];
		} finally {
			Booru.tagsSemaphoreDone = (Booru.tagsSemaphoreDone + 1) % Booru.TAGS_SEMAPHORE_MAX;
		}
	}

	/**
	 * @description Establece las credenciales a usar para cada búsqueda.
	 * @param credentials Credenciales para autorizarse en la API
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 */
	setCredentials(credentials: Credentials) {
		this.#expectCredentials(credentials);
		this.credentials = credentials;
		return this;
	}

	/**
	 * @description Recupera las credenciales de búsqueda establecidas.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 */
	#getCredentials() {
		this.#expectCredentials(this.credentials);
		return this.credentials;
	}

	/**
	 * @description Establece las credenciales a usar para cada búsqueda.
	 * @param credentials Credenciales para autorizarse en la API
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 */
	#expectCredentials(credentials: Credentials) {
		if(!credentials) throw ReferenceError('No credentials were defined');
		if(!credentials.apiKey || typeof credentials.apiKey !== 'string') throw TypeError('API Key is invalid');
		if(!credentials.userId || ![ 'string', 'number' ].includes(typeof credentials.userId)) throw TypeError('User ID is invalid');
	}
}

/**@class Representa una imagen publicada en un {@linkcode Booru}*/
export class Post {
	id: number;
	title: string;
	tags: string[];
	sources: string[];
	source: string;
	score: number;
	rating: Rating;
	createdAt: Date;
	creatorId: number;
	fileUrl: string;
	size: number[];
	previewUrl: string | null;
	previewSize: number[] | null;
	sampleUrl: string | null;
	sampleSize: number[] | null;

	constructor(data: PostResolvable) {
		this.id = data.id;
		this.title = data.title;
		this.tags = Array.isArray(data.tags) ? data.tags.map(decodeEntities) : decodeEntities(data.tags ?? '').split(' ');
		if(data.source) {
			const sources = (typeof data.source === 'object')
				? (Array.isArray(data.source) ? data.source : Object.values(data.source as Record<string, string>))
				: (data.source.split(/[ \n]+/));
			this.sources = sources;
			this.source = sources.join(' ');
		}
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

	/**@description Tries to find sources that match an URL pattern, and returns all matches (if any)*/
	findUrlSources() {
		return this.sources
			.map(getSourceUrl)
			.filter(s => s);
	}

	/**
	 * @description
	 * Finds and returns the first source that matches an URL pattern.
	 *
	 * If no URL source is found, `undefined` is returned
	 */
	findFirstUrlSource() {
		return this.sources
			.map(getSourceUrl)
			.find(s => s);
	}

	/**
	 * @description
	 * Finds and returns the last source that matches an URL pattern.
	 *
	 * If no URL source is found, `undefined` is returned.
	 */
	findLastUrlSource() {
		return this.sources
			.map(getSourceUrl)
			.findLast(s => s);
	}
}

/**@class Representa una tag de {@linkcode Post} de un {@linkcode Booru}.*/
export class Tag {
	id: number;
	name: string;
	count: number;
	type: TagType;
	ambiguous: boolean | null;
	fetchTimestamp: Date;

	constructor(data: TagResolvable) {
		if(!Object.values(TagTypes).some(t => t === data.type))
			throw RangeError('Tipo de tag inválido. Solo se aceptan números: 0, 1, 2, 3, 4, 5, 6');

		this.id = data.id;
		this.name = decodeEntities(data.name);
		this.count = data.count;
		this.type = data.type as TagType;
		this.ambiguous = !!data.ambiguous;
		this.fetchTimestamp = ('fetchTimestamp' in data) ? data.fetchTimestamp : new Date(Date.now());
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

function getSourceUrl(source: string) {
	if(!source) return null;
	const smatch = source.match(/(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-])+\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_/.0-9#:?=&;,]*)?)?/);
	if(!smatch) return null;
	return source.slice(smatch.index, smatch.index + smatch[0].length);
}

export class BooruError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'BooruError';
	}
}

export class BooruFetchError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'BooruFetchError';
	}
}

export class BooruUnknownPostError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'BooruUnknownPostError';
	}
}

export class BooruUnknownTagError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'BooruUnknownTagError';
	}
}
