import puré from '@/core/puréRegistry';
import type { AutoSystem } from './autoSystemBuilder';

interface AutoSystemRegistryLogTableRow {
	name: string;
}

export function registerAutoSystems(systems: AutoSystem[], log: boolean = false) {
	const actionTableStack: AutoSystemRegistryLogTableRow[] = [];

	for (const system of systems) {
		puré.systems.set(system.name, system);

		log
			&& actionTableStack.push({
				name: system.name,
			});
	}

	log && console.table(actionTableStack);
}
