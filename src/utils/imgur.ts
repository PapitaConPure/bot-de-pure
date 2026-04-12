import { Readable } from 'node:stream';
import { fetchExt } from './fetchext';

interface ImgurImageMap {
	url: string | URL;
	buffer: Buffer<ArrayBuffer>;
	stream: NodeJS.ReadableStream;
	blob: Blob;
}

export type ImgurImageKey = keyof ImgurImageMap & {};

interface BaseImgurImagePayload<TType extends ImgurImageKey, TImage extends ImgurImageMap[TType]> {
	type: TType;
	image: TImage;
}

export type ImgurImagePayload =
	| BaseImgurImagePayload<'url', string | URL>
	| BaseImgurImagePayload<'buffer', Buffer<ArrayBuffer>>
	| BaseImgurImagePayload<'stream', NodeJS.ReadableStream>
	| BaseImgurImagePayload<'blob', Blob>;

export interface ImgurImageUploadAPISchema {
	data: {
		link: string;
	};
	success: boolean;
	status: number;
}

interface BaseImgurImageUploadResult<TSuccess extends true | false> {
	success: TSuccess;
	status: number;
	statusText: string;
}

export interface ImgurImageUploadSuccessResult extends BaseImgurImageUploadResult<true> {
	data: {
		link: string;
	};
}

export interface ImgurImageUploadFailedResult extends BaseImgurImageUploadResult<false> {
	error: Error;
}

export type ImgurImageUploadResult = ImgurImageUploadSuccessResult | ImgurImageUploadFailedResult;

interface ImgurImageUploadOptions {
	timeout?: number;
}

export class ImgurClient {
	#clientId: string;

	constructor(clientId: string) {
		if (clientId == null)
			throw new TypeError(
				`Se esperaba un string para clientId, pero se recibió: ${clientId}`,
			);

		this.#clientId = clientId;
	}

	async upload(
		image: ImgurImagePayload,
		options: ImgurImageUploadOptions = {},
	): Promise<ImgurImageUploadResult> {
		const formDataImage = await this.#toFormDataImage(image);
		const { timeout } = options;

		const formData = new FormData();
		formData.append('image', formDataImage);

		if (image.type === 'url') formData.append('type', 'URL');

		const fetchResult = await fetchExt<ImgurImageUploadAPISchema>(
			'https://api.imgur.com/3/image',
			{
				init: {
					method: 'POST',
					headers: new Headers({
						Authorization: `Client-ID ${this.#clientId}`,
					}),
					body: formData,
					signal: timeout ? AbortSignal.timeout(timeout) : undefined,
				},
			},
		);

		if (fetchResult.success === false) {
			return {
				success: false,
				status: fetchResult.response?.status ?? 400,
				statusText: fetchResult.response?.statusText ?? 'Error',
				error: fetchResult.error,
			};
		}

		return {
			success: true,
			data: fetchResult.data.data,
			status: fetchResult.response.status,
			statusText: fetchResult.response.statusText,
		};
	}

	async #toFormDataImage(payload: ImgurImagePayload): Promise<string | Blob> {
		if (payload.type === 'url') return `${payload.image}`;

		if (payload.type === 'stream') {
			const stream = Readable.from(payload.image);
			return new Response(stream as unknown as ReadableStream).blob();
		}

		if (payload.type === 'buffer') return new Blob([payload.image]);

		return payload.toString();
	}
}
