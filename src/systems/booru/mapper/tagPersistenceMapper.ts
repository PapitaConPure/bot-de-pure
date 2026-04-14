import type { Tag } from '@papitaconpure/booru-client';

export interface TagPersistenceMapper<TDocIn, TDocOut = TDocIn> {
	toDocument(tag: Tag): TDocOut;
	fromDocument(doc: TDocIn): Tag;
}
