/**@template T*/
class LinkedListNode {
	/**@type {T}*/
	value;
	/**@type {LinkedListNode<T>?}*/
	next;

	/**@param {T} value*/
	constructor(value) {
		this.value = value;
		this.next = null;
	}
}

/**
 * @template T
 * Represents a Last-In First-Out dynamic data structure
 */
class Stack {
	/**@type {number}*/
	count;
	/**@type {LinkedListNode<T>?}*/
	#head;

	/**Creates an empty stack*/
	constructor() {
		this.count = 0;
		this.#head = null;
	}

	/**@param {T} value*/
	push(value) {
		const node = new LinkedListNode(value);

		if(this.#head == null) {
			this.#head = node;
		} else {
			const temp = this.#head
			this.#head = node;
			this.#head.next = temp;
		}

		this.count++;
	}

	pop() {
		if(this.#head == null) return null;

		const node = this.#head;
		this.#head = this.#head.next;

		this.count--;

		return node.value;
	}

	peek() {
		return this.#head?.value;
	}
}

/**
 * @template T
 * Represents a First-In First-Out dynamic data structure
 */
class Queue {
	/**@type {number}*/
	count;
	/**@type {LinkedListNode<T>?}*/
	#head;
	/**@type {LinkedListNode<T>?}*/
	#tail;

	constructor() {
		this.count = 0;
		this.#head = null;
		this.#tail = null;
	}

	/**@param {T} value*/
	enqueue(value) {
		const node = new LinkedListNode(value);

		if(this.#tail == null) {
			this.#head = node;
			this.#tail = node;
		} else {
			this.#tail.next = node;
			this.#tail = node;
		}

		this.count++;
	}

	dequeue() {
		if(this.#head == null) return null;

		const node = this.#head;
		this.#head = this.#head.next;

		if(this.#head == null)
			this.#tail = null;

		this.count--;

		return node.value;
	}

	peek() {
		return this.#head?.value;
	}
}

module.exports = {
	Stack,
	Queue,
};
