import { Tag, type TagType } from '@papitaconpure/booru-client';
import type { AnyKeys } from 'mongoose';
import type { TagDocument } from '@/models/boorutags';
import type { TagPersistenceMapper } from './tagPersistenceMapper';

export class TagPersistenceMapperImpl
	implements TagPersistenceMapper<TagDocument, AnyKeys<TagDocument>>
{
	fromDocument(doc: TagDocument): Tag {
		return new Tag({
			id: doc.id,
			name: doc.name,
			count: doc.count,
			type: doc.type as TagType,
			fetchTimestamp: doc.fetchTimestamp,
		});
	}

	toDocument(tag: Tag): AnyKeys<TagDocument> {
		return {
			id: tag.id,
			name: tag.name,
			count: tag.count,
			type: tag.type,
			fetchTimestamp: new Date(tag.fetchTimestamp),
		};
	}
}
