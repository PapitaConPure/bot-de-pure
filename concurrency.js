/**@param {() => Promise<*>} callback*/
async function scheduleTask(callback) {
	scheduleTask['queue'] ??= [];
	const queue = scheduleTask['queue'];

	let resolveResult;
	const result = new Promise(resolve => {
		resolveResult = resolve;
	});

	const performQueueStep = async () => {
		const result = await callback();
		queue.shift();
		queue[0]?.();
		resolveResult(result);
	};

	queue.push(performQueueStep);

	if(queue.length === 1)
		await performQueueStep();

	return result;
}

module.exports = {
	scheduleTask,
};
