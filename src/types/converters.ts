import type { AttachmentBuilder, ContainerBuilder, Message, TextDisplayBuilder } from 'discord.js';
import type { FixedBitFieldResolvable } from './discord';

export interface ConverterContext {
	message: Message<true>;
	serviceLink: string | null | undefined;
}

export interface ConverterResult {
	content?: string;
	flags?: FixedBitFieldResolvable;
	components?: (TextDisplayBuilder | ContainerBuilder)[];
	files?: AttachmentBuilder[];
}

export interface ConverterService {
	name: string;
	link: string;
}

export interface ConversionMethod {
	/**
	 * Extrae aquellos enlaces del mensaje que están relacionados al sitio esperado por este conversor y los reenvía con un embed corregido, a través de una respuesta.
	 * @param message El mensaje a analizar.
	 * @param converterKeys Los identificadores de servicios de conversión a procesar.
	 */
	convert: (
		matchedLinks: RegExpMatchArray[],
		context: ConverterContext,
	) => Promise<ConverterResult> | ConverterResult;
}

export interface NativeConversionApproach extends ConversionMethod {
	key: string;
}

export interface ExternalConversionApproach extends ConversionMethod {
	/**Los servicios de terceros que utiliza este conversor.*/
	services: Record<string, ConverterService>;
}

/**Interfaz para definir un conversor de enlaces de mensaje de Discord.*/
export interface ConverterDefinition {
	/**El nombre del conversor.*/
	name: string;
	/**El patrón de búsqueda utilizado por el conversor.*/
	regex: RegExp;

	/**Define los métodos de conversión nativos de este conversor.*/
	native?: NativeConversionApproach;
	/**Define los métodos de conversión externos de este conversor.*/
	external?: ExternalConversionApproach;
}

export interface BaseConverterPayload<TContentful extends boolean> {
	contentful: TContentful;
}

export type EmptyConverterPayload = BaseConverterPayload<false>;

export type ContentfulConverterPayload = BaseConverterPayload<true> & ConverterResult;

export type ConverterPayload = EmptyConverterPayload | ContentfulConverterPayload;
