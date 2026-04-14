import { BooruClient, Gelbooru } from '@papitaconpure/booru-client';
import { booruApiKey, booruUserId } from '@/data/globalProps';

let mainBooru: BooruClient | null = null;

export function useMainBooruClient() {
	if (!mainBooru)
		mainBooru = new BooruClient(new Gelbooru(), { apiKey: booruApiKey, userId: booruUserId });

	return mainBooru;
}
