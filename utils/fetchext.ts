import { default as stream } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';

type FetchDataMap<TSchema> = {
	json: TSchema;
	text: string;
	arrayBuffer: ArrayBuffer;
	buffer: Buffer;
	webStream: ReadableStream;
	nodeStream: NodeJS.ReadableStream;
};
type FetchType = keyof FetchDataMap<unknown> & {};

type AssertedFetchData<TFetch extends FetchType, TSchema = unknown> = FetchDataMap<TSchema>[TFetch];

type ResponsePredicate = (s: Response) => boolean;
type StatusPredicate = (s: number) => boolean;

interface FetchExtOptions<TFetch extends FetchType> {
	type?: TFetch;
	init?: RequestInit;
	validateResponse?: ResponsePredicate;
	validateStatus?: StatusPredicate;
}

export interface FetchSuccessResult<TData> {
	success: true;
	data: TData;
	response: Response;
}

export interface FetchErrorResult {
	success: false;
	error: Error;
	response?: Response;
}

export type FetchResult<TData = unknown> = FetchSuccessResult<TData> | FetchErrorResult;

export async function fetchExt<TFetch extends Exclude<FetchType, 'json'>>(url: string | URL | Request, options: FetchExtOptions<TFetch>): Promise<FetchResult<AssertedFetchData<TFetch>>>;
export async function fetchExt<TSchema = unknown>(url: string | URL | Request, options?: FetchExtOptions<'json'>): Promise<FetchResult<TSchema>>;

export async function fetchExt<TSchema = unknown, TFetch extends FetchType = 'json'>(url: string | URL | Request, options: FetchExtOptions<TFetch> = {}): Promise<FetchResult<AssertedFetchData<TFetch, TSchema>>> {
	const {
		type = 'json',
		init,
		validateResponse,
		validateStatus,
	} = options;

	let response: Response;

	try {
		response = await fetch(url, init);
	} catch(err) {
		return {
			success: false as const,
			error: err instanceof Error ? err : new FetchError(`${err}`),
		};
	}

	const isValid = validateResponse
		? validateResponse(response)
		: validateStatus
			? validateStatus(response.status)
			: response.ok;

	if(!isValid) {
		return {
			success: false,
			error: new HTTPError(response.status, response.statusText),
			response,
		};
	}

	try {
		let data: AssertedFetchData<TFetch, TSchema>;

		switch(type) {
		case 'json':
			data = await response.json() as TSchema as AssertedFetchData<TFetch, TSchema>;
			break;

		case 'text':
			data = await response.text() as AssertedFetchData<TFetch, TSchema>;
			break;

		case 'arrayBuffer':
			data = await response.arrayBuffer() as AssertedFetchData<TFetch, TSchema>;
			break;

		case 'buffer': {
			const arrayBuffer = await response.arrayBuffer();
			data = Buffer.from(arrayBuffer) as AssertedFetchData<TFetch, TSchema>;
			break;
		}

		case 'webStream':
			if(!response.body)
				throw new ResponseError('Response body unavailable for stream extraction.');

			data = response.body as AssertedFetchData<TFetch, TSchema>;
			break;

		case 'nodeStream': {
			if(!response.body)
				throw new ResponseError('Response body unavailable for stream extraction.');

			data = stream.Readable.fromWeb(response.body as unknown as WebReadableStream<Uint8Array>) as AssertedFetchData<TFetch, TSchema>;
			break;
		}

		default:
			throw new RangeError(`Invalid or unsupported type: ${type}`);
		}

		return {
			success: true,
			data,
			response,
		};
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err : new Error(`${err}`),
			response,
		};
	}
}

export class HTTPError extends Error {
	constructor(status: number, statusText: string) {
		super(`${status} ${statusText}`);
		this.name = 'HTTPError';
	}
}

export class FetchError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'FetchError';
	}
}

export class ResponseError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'ResponseError';
	}
}
