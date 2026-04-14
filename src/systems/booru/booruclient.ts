import { BooruClient, Gelbooru, MemoryTagStore } from '@papitaconpure/booru-client';
import { booruApiKey, booruUserId } from '@/data/globalProps';
import BooruTags from '@/models/boorutags';
import { MongooseTagStore } from './dbTagStore';

let mainBooru: BooruClient | null = null;

export function getMainBooruClient(): BooruClient {
	if (!mainBooru)
		mainBooru = new BooruClient(
			new Gelbooru(),
			{ apiKey: booruApiKey, userId: booruUserId },
			{
				tagStoreChain: [new MemoryTagStore(), new MongooseTagStore(BooruTags)],
			},
		);

	return mainBooru;
}
