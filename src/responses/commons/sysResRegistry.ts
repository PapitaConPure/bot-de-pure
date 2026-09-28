import puré from '@/core/puréRegistry';
import type { SystemResponses } from './sysResBuilder';

interface SystemResponsesRegistryLogTableRow {
	name: string;
}

export function registerSystemsResponses(instances: SystemResponses<string>[], log: boolean = false) {
	const actionTableStack: SystemResponsesRegistryLogTableRow[] = [];

	for (const system of instances) {
		puré.systems.set(system.name, system);

		log
			&& actionTableStack.push({
				name: system.name,
			});
	}

	log && console.table(actionTableStack);
}
