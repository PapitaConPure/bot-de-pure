import { Queue } from './ds';

export function createTaskScheduler() {
	const queue: Queue<() => Promise<void>> = new Queue();

	const scheduleTask = async (callback: () => Promise<unknown>) => {
		let resolveResult: (value: unknown) => void;
		const result = new Promise((resolve) => {
			resolveResult = resolve;
		});

		const performQueueStep = async () => {
			const result = await callback();
			queue.dequeue();
			queue.peek()?.();
			resolveResult(result);
		};

		queue.enqueue(performQueueStep);

		if (queue.count === 1) await performQueueStep();

		return result;
	};

	return {
		queue,
		scheduleTask,
	};
}
