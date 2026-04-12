import { default as stream } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';

interface FetchDataMap<TSchema> {
	json: TSchema;
	text: string;
	arrayBuffer: ArrayBuffer;
	buffer: Buffer<ArrayBuffer>;
	webStream: ReadableStream;
	nodeStream: NodeJS.ReadableStream;
}
type FetchType = keyof FetchDataMap<unknown> & {};

type AssertedFetchData<TFetch extends FetchType, TSchema = unknown> = FetchDataMap<TSchema>[TFetch];

type ResponsePredicate = (s: Response) => boolean;
type StatusPredicate = (s: number) => boolean;

interface FetchExtOptions<TFetch extends FetchType> {
	/**El tipo con el cual interpretar la respuesta.*/
	type?: TFetch;
	/**Idéntico al parámetro `init` de la función {@linkcode fetch}*/
	init?: RequestInit;
	/**Un predicado para verificar el código HTTP obtenido con la respuesta.*/
	validateStatus?: StatusPredicate;
	/**Un predicado para verificar la respuesta inicial obtenida.*/
	validateResponse?: ResponsePredicate;
}

interface BaseFetchResult<TSuccess extends true | false> {
	success: TSuccess;
}

export interface FetchSuccessResult<TData> extends BaseFetchResult<true> {
	data: TData;
	response: Response;
}

export interface FetchErrorResult extends BaseFetchResult<false> {
	error: Error;
	response?: Response;
}

export type FetchResult<TData = unknown> = FetchSuccessResult<TData> | FetchErrorResult;

export async function fetchExt<TFetch extends Exclude<FetchType, 'json'>>(
	url: string | URL | Request,
	options: FetchExtOptions<TFetch>,
): Promise<FetchResult<AssertedFetchData<TFetch>>>;
export async function fetchExt<TSchema = unknown>(
	url: string | URL | Request,
	options?: FetchExtOptions<'json'>,
): Promise<FetchResult<TSchema>>;

/**
 * Realiza una consulta y obtiene un dato utilizando la API nativa fetch(), ofreciendo algunas utilidades por encima de esta.
 * @template TSchema Si la respuesta esperada es `'json'` (por defecto lo es), define la estructura esperada del JSON
 * @template TFetch Define el tipo de respuesta esperado (por defecto: `'json'`)
 * @param url La URL a la cual realizar una consulta.
 * @param options Opciones de la consulta a realizar y la manipulación del dato obtenido en consecuencia.
 * @returns Un objeto conteniendo el {@link Response} obtenido y si el resultado fue validado y extraído correctamente.
 * Si lo fue, el objeto también contiene el dato extraído y convertido. Si no, contiene un error describiendo el problema.
 */
export async function fetchExt<TSchema = unknown, TFetch extends FetchType = 'json'>(
	url: string | URL | Request,
	options: FetchExtOptions<TFetch> = {},
): Promise<FetchResult<AssertedFetchData<TFetch, TSchema>>> {
	const { type = 'json', init, validateStatus, validateResponse } = options;

	let response: Response;

	try {
		response = await fetch(url, init);
	} catch (err) {
		return {
			success: false as const,
			error: err instanceof Error ? err : new FetchError(`${err}`),
		};
	}

	if (validateStatus && !validateStatus(response.status)) {
		return {
			success: false as const,
			error: new HTTPError(response.status, response.statusText),
			response,
		};
	}

	if (validateResponse && !validateResponse(response)) {
		return {
			success: false as const,
			error: new ResponseError('Response state was not valid.', response),
			response,
		};
	}

	try {
		let data: AssertedFetchData<TFetch, TSchema>;

		switch (type) {
			case 'json':
				data = (await response.json()) as TSchema as AssertedFetchData<TFetch, TSchema>;
				break;

			case 'text':
				data = (await response.text()) as AssertedFetchData<TFetch, TSchema>;
				break;

			case 'arrayBuffer':
				data = (await response.arrayBuffer()) as AssertedFetchData<TFetch, TSchema>;
				break;

			case 'buffer': {
				const arrayBuffer = await response.arrayBuffer();
				data = Buffer.from(arrayBuffer) as AssertedFetchData<TFetch, TSchema>;
				break;
			}

			case 'webStream':
				if (!response.body)
					throw new ResponseError(
						'Response body unavailable for stream extraction.',
						response,
					);

				data = response.body as AssertedFetchData<TFetch, TSchema>;
				break;

			case 'nodeStream': {
				if (!response.body)
					throw new ResponseError(
						'Response body unavailable for stream extraction.',
						response,
					);

				data = stream.Readable.fromWeb(
					response.body as unknown as WebReadableStream<Uint8Array>,
				) as AssertedFetchData<TFetch, TSchema>;
				break;
			}

			default:
				throw new RangeError(`Invalid or unsupported type: ${type}`);
		}

		return {
			success: true as const,
			data,
			response,
		};
	} catch (err) {
		return {
			success: false as const,
			error: err instanceof Error ? err : new Error(`${err}`),
			response,
		};
	}
}

export class HTTPError extends Error {
	constructor(status: number, statusText: string);
	constructor(status: number, statusText: string, options?: ErrorOptions);
	constructor(status: number, statusText: string, options?: ErrorOptions) {
		super(`${status} ${statusText}`, options);
		this.name = 'HTTPError';
	}
}

export class FetchError extends Error {
	constructor();
	constructor(message?: string);
	constructor(message?: string, options?: ErrorOptions);
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'FetchError';
	}
}

export class ResponseError extends Error {
	#response: Response | undefined;

	constructor();
	constructor(message?: string);
	constructor(message?: string, response?: Response);
	constructor(message?: string, response?: Response, options?: ErrorOptions);
	constructor(message?: string, response?: Response, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ResponseError';
		this.#response = response;
	}

	get response() {
		return this.#response;
	}
}
