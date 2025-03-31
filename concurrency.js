const { Queue } = require('./ds');

function createTaskScheduler() {
	/**@type {Queue<() => Promise<*>>}*/
	const queue = new Queue();
	
	/**@param {() => Promise<*>} callback*/
	const scheduleTask = async function(callback) {
		let resolveResult;
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

module.exports = {
	createTaskScheduler,
};
