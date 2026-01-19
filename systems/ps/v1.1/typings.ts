export type PSBufferType = 'url' | 'buffer' | 'stream';
export interface PSBaseAttachment<T extends PSBufferType> {
	type: T;
}

export type PSURLAttachment = PSBaseAttachment<'url'> & { url: string; };

export type PSBufferAttachment = PSBaseAttachment<'buffer'> & { buffer: Buffer | Uint8Array; };

export type PSAttachment = PSURLAttachment | PSBufferAttachment;
