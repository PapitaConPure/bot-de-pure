import { Tag, type TagType } from '@papitaconpure/booru-client';
import type { AnyKeys } from 'mongoose';
import type { TagSchemaType } from '@/models/boorutags';
import type { TagPersistenceMapper } from './tagPersistenceMapper';

export class TagPersistenceMapperImpl
	implements TagPersistenceMapper<TagSchemaType, AnyKeys<TagSchemaType>>
{
	fromDocument(doc: TagSchemaType): Tag {
		return new Tag({
			id: doc.id,
			name: doc.name,
			count: doc.count,
			type: doc.type as TagType,
			fetchTimestamp: doc.fetchTimestamp,
		});
	}

	toDocument(tag: Tag): AnyKeys<TagSchemaType> {
		return {
			id: tag.id,
			name: tag.name,
			count: tag.count,
			type: tag.type,
			fetchTimestamp: new Date(tag.fetchTimestamp),
		};
	}
}
