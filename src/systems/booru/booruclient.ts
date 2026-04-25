import { BooruClient, Gelbooru, MemoryTagStore } from '@papitaconpure/booru-client';
import { booruApiKey, booruUserId } from '@/data/globalProps';
import BooruTags from '@/models/boorutags';
import { MongooseTagStore } from './dbTagStore';

let mainBooru: BooruClient<Gelbooru> | null = null;

export function getMainBooruClient() {
	if (booruApiKey == null || booruUserId == null) return undefined;

	if (!mainBooru)
		mainBooru = new BooruClient(new Gelbooru(), {
			credentials: { apiKey: booruApiKey, userId: booruUserId },
			tags: {
				storeChain: [new MemoryTagStore(), new MongooseTagStore(BooruTags)],
				cleanOnStartup: true,
				maxBatchingGraceWindowMs: 40,
				resolutionTimeoutMs: 60_000,
			},
		});

	return mainBooru;
}
