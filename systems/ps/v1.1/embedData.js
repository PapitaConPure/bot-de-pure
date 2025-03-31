/**
 * @typedef {number
 *         | readonly [ red: number, green: number, blue: number ]
 *         | 'Random'
 *         | `#${string}`
 * } ColorResolvable
 */

/**
 * @typedef {Object} AuthorData
 * @property {string} name
 * @property {string} [iconUrl]
 * @property {string} [url]
 */

/**
 * @typedef {Object} FooterData
 * @property {string} text
 * @property {string} [iconUrl]
 */

/**
 * @typedef {Object} EmbedFieldData
 * 
 * @property {string} name
 * Name of the field.
 * 
 * Length limit: 256 characters
 * 
 * @property {string} value
 * Value of the field
 *
 * Length limit: 1024 characters
 * 
 * @property {boolean} [inline]
 * Whether or not this field should display inline
 */

class EmbedData {
	/**@type {AuthorData?}*/ #author;
	/**@type {ColorResolvable}*/ #color;
	/**@type {string?}*/ #description;
	/**@type {Array<EmbedFieldData>?}*/ #fields;
	/**@type {FooterData?}*/ #footer;
	/**@type {string?}*/ #imageUrl;
	/**@type {string?}*/ #thumbUrl;
	/**@type {(Date | number)?}*/ #timestamp;
	/**@type {string?}*/ #title;
	/**@type {string?}*/ #url;

	constructor() {
		this.#author = null;
		this.#color = null;
		this.#description = null;
		this.#fields = null;
		this.#footer = null;
		this.#imageUrl = null;
		this.#thumbUrl = null;
		this.#timestamp = null;
		this.#title = null;
		this.#url = null;
	}

	/**
	 * @param {AuthorData?} options 
	 */
	setAuthor(options) {
		expectNonEmptyString(options?.name);
		options?.url && expectUrl(options?.url);
		options?.iconUrl && expectUrl(options?.iconUrl);

		this.#author = options;
		return this;
	}

	/**
	 * @param {ColorResolvable?} color 
	 */
	setColor(color) {
		if(color == null) {
			this.#color = null;
			return this;
		}

		if(typeof color === 'number') {
			if(color < 0x000000 || color > 0xffffff)
				throw new RangeError(`Invalid color value: ${color}`);

			this.#color = color;
			return this;
		}

		if(typeof color !== 'string')
			throw TypeError(`Invalid color type: ${typeof color}`);

		if(!color.startsWith('#'))
			throw RangeError(`Color hex string should begin with "#". Received: ${color}`);

		const match = color.match(/^#([0-9a-f]{1,6})$/i);
		if(!match)
			throw TypeError(`Invalid color hex format: ${color}`);

		this.#color = color;
		return this;
	}

	/**
	 * @param {string?} description 
	 */
	setDescription(description) {
		description != null && expectNonEmptyString(description);
		this.#description = description;

		return this;
	}

	/**
	 * @param  {Array<EmbedFieldData>?} fields 
	 */
	setFields(fields) {
		this.#fields = fields;
		return this;
	}

	/**
	 * @param {FooterData?} options 
	 */
	setFooter(options) {
		if(!options) {
			this.#footer = null;
			return this;
		}

		options.iconUrl && expectUrl(options.iconUrl);
		expectNonEmptyString(options.text);
		this.#footer = options;

		return this;
	}

	/**
	 * @param {string?} url 
	 */
	setImage(url) {
		url != null && expectUrl(url);
		this.#imageUrl = url;

		return this;
	}

	/**
	 * @param {string?} url 
	 */
	setThumbnail(url) {
		url != null && expectUrl(url);
		this.#thumbUrl = url;

		return this;
	}

	/**
	 * @param {(Date | number)?} timestamp
	 */
	setTimestamp(timestamp) {
		this.#timestamp = timestamp;
		return this;
	}

	/**
	 * @param {string?} title 
	 */
	setTitle(title) {
		title != null && expectNonEmptyString(title);
		this.#title = title;

		return this;
	}

	/**
	 * @param {string?} url 
	 */
	setUrl(url) {
		url != null && expectUrl(url);
		this.#url = url;

		return this;
	}

	/**
	 * @param  {...EmbedFieldData} fields 
	 */
	addFields(...fields) {
		this.#fields ??= [];
		this.#fields.push(...fields);
		return this;
	}

	get data() {
		return {
			author: this.#author,
			color: this.#color,
			description: this.#description,
			fields: this.#fields,
			footer: this.#footer,
			imageUrl: this.#imageUrl,
			thumbUrl: this.#thumbUrl,
			timestamp: this.#timestamp,
			title: this.#title,
			url: this.#url,
		};
	}

	toJSON() {
		return JSON.parse(JSON.stringify(this.data));
	}

	toString() {
		return JSON.stringify(this.data);
	}

	get [Symbol.toStringTag]() {
		return this.toString();
	}
}

/**
 * @param {*} str
 * @throws
 */
function expectNonEmptyString(str) {
	if(typeof str !== 'string' || str.length === 0)
		throw `The value must be a non-empty string. Received: ${str}`;
}

/**
 * @param {string} url
 * @throws
 */
function expectUrl(url) {
	new URL(url.trim());
}

module.exports = {
	EmbedData,
};
