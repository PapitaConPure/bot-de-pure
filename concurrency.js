/**@template T*/
class QueueNode {
	/**@type {T}*/
	value;
	/**@type {QueueNode<T>?}*/
	next;

	/**@param {T} value*/
	constructor(value) {
		this.value = value;
	}
}

/**@template T*/
class Queue {
	/**@type {number}*/
	count;
	/**@type {QueueNode<T>?}*/
	#head;
	/**@type {QueueNode<T>?}*/
	#tail;

	constructor() {
		this.count = 0;
		this.#head = null;
		this.#tail = null;
	}

	/**@param {T} value*/
	enqueue(value) {
		const node = new QueueNode(value);

		if(this.#head == null) {
			this.#head = node;
			this.#tail = node;
		} else {
			this.#head.next = node;
			this.#head = node;
		}

		this.count++;
	}

	dequeue() {
		if(this.#tail == null) return null;

		const node = this.#tail;
		this.#tail = this.#tail.next;

		if(this.#tail == null)
			this.#head = null;

		this.count--;

		return node.value;
	}

	peek() {
		return this.#tail?.value;
	}
}

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
