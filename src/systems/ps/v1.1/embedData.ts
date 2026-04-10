export type ColorResolvable = number |
	readonly [red: number, green: number, blue: number] |
	'Random' |
	`#${string}`;

export interface AuthorData {
	name: string;
	iconUrl?: string;
	url?: string;
}

export interface FooterData {
	text: string;
	iconUrl?: string;
}

export interface EmbedFieldData {
	name: string;
	value: string;
	inline?: boolean;
}

export interface EmbedResolvable {
	author: AuthorData;
	color: ColorResolvable;
	description: string;
	fields: EmbedFieldData[];
	footer: FooterData;
	imageUrl: string;
	thumbUrl: string;
	timestamp: (Date | number);
	title: string;
	url: string;
}

export class EmbedData {
	#author: AuthorData | null;
	#color: ColorResolvable | null;
	#description: string | null;
	#fields: EmbedFieldData[] | null;
	#footer: FooterData | null;
	#imageUrl: string | null;
	#thumbUrl: string | null;
	#timestamp: (Date | number) | null;
	#title: string | null;
	#url: string | null;

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

	/**@description Hard-copies the supplied data into an EmbedData instance.*/
	static from(data: EmbedResolvable) {
		const embed = new EmbedData();

		embed.#color = data.color;
		embed.#description = data.description;
		embed.#imageUrl = data.imageUrl;
		embed.#thumbUrl = data.thumbUrl;
		embed.#timestamp = data.timestamp;
		embed.#title = data.title;
		embed.#url = data.url;

		if(data.author) {
			const { name, iconUrl, url } = data.author;
			embed.#author = { name, iconUrl, url };
		}

		if(data.fields?.length)
			embed.#fields = JSON.parse(JSON.stringify(data.fields));

		if(data.footer) {
			const { text, iconUrl } = data.footer;
			embed.#footer = { text, iconUrl };
		}

		return embed;
	}

	/**@description Returns a hard-copy of this instance.*/
	copy() {
		return EmbedData.from(this.data);
	}

	setAuthor(options: AuthorData | null) {
		expectNonEmptyString(options?.name);
		options?.url && expectUrl(options?.url);
		options?.iconUrl && expectUrl(options?.iconUrl);

		this.#author = options;
		return this;
	}

	setColor(color: ColorResolvable | null) {
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

	setDescription(description: string | null) {
		description != null && expectNonEmptyString(description);
		this.#description = description;

		return this;
	}

	setFields(fields: EmbedFieldData[] | null) {
		this.#fields = fields;
		return this;
	}

	setFooter(options: FooterData | null) {
		if(!options) {
			this.#footer = null;
			return this;
		}

		options.iconUrl && expectUrl(options.iconUrl);
		expectNonEmptyString(options.text);
		this.#footer = options;

		return this;
	}

	setImage(url: string | null) {
		url != null && expectUrl(url);
		this.#imageUrl = url;

		return this;
	}

	setThumbnail(url: string | null) {
		url != null && expectUrl(url);
		this.#thumbUrl = url;

		return this;
	}

	setTimestamp(timestamp: (Date | number) | null) {
		this.#timestamp = timestamp;
		return this;
	}

	setTitle(title: string | null) {
		title != null && expectNonEmptyString(title);
		this.#title = title;

		return this;
	}

	setUrl(url: string | null) {
		url != null && expectUrl(url);
		this.#url = url;

		return this;
	}

	addFields(...fields: EmbedFieldData[]) {
		this.#fields ??= [];
		this.#fields.push(...fields);
		return this;
	}

	get empty() {
		return !this.#author?.name
			&& !this.#description
			&& !this.#fields?.length
			&& !this.#footer?.text
			&& !this.#imageUrl
			&& !this.#thumbUrl
			&& !this.#title;
	}

	get data() {
		return /**@type {EmbedResolvable}*/({
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
		});
	}

	hardCopiedData() {
		return /**@type {EmbedResolvable}*/(JSON.parse(JSON.stringify(this.data)));
	}

	toString() {
		return JSON.stringify(this.data);
	}

	get [Symbol.toStringTag]() {
		return this.toString();
	}
}

/**@throws {TypeError}*/
function expectNonEmptyString(str: unknown) {
	if(typeof str !== 'string' || str.length === 0)
		throw TypeError(`The value must be a non-empty string. Received: ${str}`);
}

/**@throws {TypeError}*/
function expectUrl(url: string) {
	new URL(url.trim());
}
