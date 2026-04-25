import type { Tag, TagStore } from '@papitaconpure/booru-client';
import type { AnyBulkWriteOperation, AnyKeys } from 'mongoose';
import type BooruTags from '@/models/boorutags';
import type { TagSchemaType } from '@/models/boorutags';
import type { TagPersistenceMapper } from './mapper/tagPersistenceMapper';
import { TagPersistenceMapperImpl } from './mapper/tagPersistenceMapperImpl';

export class MongooseTagStore implements TagStore {
	readonly #model: typeof BooruTags;
	readonly #mapper: TagPersistenceMapper<TagSchemaType, AnyKeys<TagSchemaType>>;
	readonly #ttl: number;

	constructor(
		model: typeof BooruTags,
		options: {
			mapper?: TagPersistenceMapper<TagSchemaType, AnyKeys<TagSchemaType>>;
			ttl?: number;
		} = {},
	) {
		const { ttl = 4 * 60 * 60e3, mapper = new TagPersistenceMapperImpl() } = options;

		this.#model = model;
		this.#mapper = mapper;
		this.#ttl = ttl;
	}

	async getMany(names: Iterable<string>): Promise<Tag[]> {
		try {
			const tagDocuments = await this.#model.find({ name: { $in: [...names] } });
			return tagDocuments.map((doc) => this.#mapper.fromDocument(doc));
		} catch {
			return [];
		}
	}

	async getOne(name: string): Promise<Tag | undefined> {
		try {
			const tagDocument = await this.#model.findOne({ name: name }).lean();
			if (!tagDocument) return undefined;
			return this.#mapper.fromDocument(tagDocument);
		} catch {
			return undefined;
		}
	}

	async setMany(tags: Iterable<Tag>): Promise<void> {
		const bulkOps: AnyBulkWriteOperation<TagSchemaType>[] = [...tags].map((t) => ({
			updateOne: {
				filter: { name: t.name },
				update: { $set: this.#mapper.toDocument(t) },
				upsert: true,
			},
		}));

		await attemptManyTimes(() => this.#model.bulkWrite(bulkOps), 4);
	}

	async setOne(tag: Tag): Promise<void> {
		await attemptManyTimes(
			() =>
				this.#model.updateOne(
					{ name: tag.name },
					{ $set: this.#mapper.toDocument(tag) },
					{ upsert: true },
				),
			3,
		);
	}

	async cleanup?(): Promise<void> {
		const query = {
			fetchTimestamp: {
				$lt: new Date(Date.now() - this.#ttl),
			},
		};

		await attemptManyTimes(() => this.#model.deleteMany(query), 2);
	}
}

async function attemptManyTimes(fn: () => Promise<unknown>, times: number): Promise<void> {
	try {
		times--;
		await fn();
	} catch (err) {
		if (times < 0) throw err;
	}
}
