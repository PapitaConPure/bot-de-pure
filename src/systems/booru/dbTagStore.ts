import type { Tag, TagStore } from '@papitaconpure/booru-client';
import type { AnyBulkWriteOperation, AnyKeys } from 'mongoose';
import type BooruTags from '@/models/boorutags';
import type { TagDocument } from '@/models/boorutags';
import type { TagPersistenceMapper } from './mapper/tagPersistenceMapper';
import { TagPersistenceMapperImpl } from './mapper/tagPersistenceMapperImpl';

export class MongooseTagStore implements TagStore {
	readonly #model: typeof BooruTags;
	readonly #mapper: TagPersistenceMapper<TagDocument, AnyKeys<TagDocument>>;
	readonly #ttl: number;

	constructor(
		model: typeof BooruTags,
		options: {
			mapper?: TagPersistenceMapper<TagDocument, AnyKeys<TagDocument>>;
			ttl?: number;
		} = {},
	) {
		const { ttl = 4 * 60 * 60e3, mapper = new TagPersistenceMapperImpl() } = options;

		this.#model = model;
		this.#mapper = mapper;
		this.#ttl = ttl;
	}

	async getMany(names: Iterable<string>): Promise<Tag[]> {
		const tagDocuments = await this.#model.find({ name: { $in: [...names] } });
		return tagDocuments.map((doc) => this.#mapper.fromDocument(doc));
	}

	async getOne(name: string): Promise<Tag | undefined> {
		const tagDocument = await this.#model.findOne({ name: name }).lean();
		if (!tagDocument) return undefined;
		return this.#mapper.fromDocument(tagDocument);
	}

	async setMany(tags: Iterable<Tag>): Promise<void> {
		const bulkOps: AnyBulkWriteOperation<TagDocument>[] = [...tags].map((t) => ({
			updateOne: {
				filter: { id: t.id },
				update: { $set: this.#mapper.toDocument(t) },
				upsert: true,
			},
		}));

		await this.#model.bulkWrite(bulkOps);
	}

	async setOne(tag: Tag): Promise<void> {
		await this.#model.updateOne(
			{ id: tag.id },
			{ $set: this.#mapper.toDocument(tag) },
			{ upsert: true },
		);
	}

	async cleanup?(): Promise<void> {
		await this.#model.deleteMany({
			fetchTimestamp: {
				$lt: new Date(Date.now() - this.#ttl),
			},
		});
	}
}
