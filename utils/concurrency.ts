import { Queue } from './ds';

export function createTaskScheduler() {
	const queue: Queue<() => Promise<void>> = new Queue();
	
	const scheduleTask = async function(callback: () => Promise<any>) {
		let resolveResult: (value: any) => void;
		const result = new Promise(resolve => {
			resolveResult = resolve;
		});
	
		const performQueueStep = async () => {
			const result = await callback();
			queue.dequeue();
			queue.peek()?.();
			resolveResult(result);
		};
	
		queue.enqueue(performQueueStep);
	
		if(queue.count === 1)
			await performQueueStep();
	
		return result;
	}

	return {
		queue,
		scheduleTask,
	};
}
