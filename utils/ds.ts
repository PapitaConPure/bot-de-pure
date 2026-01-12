class LinkedListNode<T> {
	value: T;
	next: LinkedListNode<T> | null;

	constructor(value: T) {
		this.value = value;
		this.next = null;
	}
}

/**Represents a Last-In First-Out dynamic data structure.*/
export class Stack<T> {
	count: number;
	#head: LinkedListNode<T> | null;

	/**Creates an empty stack.*/
	constructor() {
		this.count = 0;
		this.#head = null;
	}

	push(value: T) {
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

/**Represents a First-In First-Out dynamic data structure.*/
export class Queue<T> {
	count: number;
	#head: LinkedListNode<T> | null;
	#tail: LinkedListNode<T> | null;

	constructor() {
		this.count = 0;
		this.#head = null;
		this.#tail = null;
	}

	/**@param {T} value*/
	enqueue(value: T) {
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
