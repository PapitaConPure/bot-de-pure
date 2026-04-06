export interface ConverterBasePayload<TContentful extends boolean> {
	contentful: TContentful;
}

export type EmptyConverterPayload = ConverterBasePayload<false>;

export interface ContentfulConverterPayloadData {
	content: string;
}

export type ContentfulConverterPayload = ConverterBasePayload<true> & ContentfulConverterPayloadData;

export type ConverterPayload = EmptyConverterPayload | ContentfulConverterPayload;

export const ConverterEmptyPayload: ConverterPayload = {
	contentful: false,
};
