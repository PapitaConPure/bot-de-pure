const { Scope } = require('./scope');
const { TokenKinds } = require('../lexer/tokens');
const { ExpressionKinds } = require('../ast/expressions');
const { StatementKinds } = require('../ast/statements');
const { ValueKinds, makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeEmbed, makeNada, makeValue } = require('./values');
const { UnaryExpressionLookups, BinaryExpressionLookups, ValueKindLookups } = require('./lookups');

/**Representa un Intérprete de PuréScript*/
class Interpreter {
	/**@type {Array<Error>}*/
	errorStack;
	/**@type {Array<*>}*/
	inputStack;
	/**@type {Array<import('./values').RuntimeValue>}*/
	sendStack;
	/**@type {Boolean}*/
	#isTestDrive;
	/**@type {Boolean}*/
	#stop;

	constructor() {
		this.errorStack = [];
		this.inputStack = [];
		this.sendStack = [];
		this.#isTestDrive = false;
		this.#stop = false;
	}

	/**
	 * @param {String} message
	 */
	TuberInterpreterError(message) {
		const error = new Error(message);
		error.name = 'TuberInterpreterError';
		return error;
	}

	/**
	 * @template {import('./values').ValueKind} T
	 * @param {import('./values').RuntimeValue} value
	 * @param {T} valueKind
	 * @returns {value is Extract<import('./values').RuntimeValue, { kind: T }>}
	 */
	is(value, valueKind) {
		return value.kind === valueKind;
	}

	/**
	 * @template {import('./values').ValueKind} T
	 * @param {import('./values').RuntimeValue} value
	 * @param {...T} valueKinds
	 * @returns {value is Extract<import('./values').RuntimeValue, { kind: T }>}
	 */
	isAnyOf(value, ...valueKinds) {
		return valueKinds.some(valueKind => value.kind === valueKind);
	}

	/**
	 * @template {import('./values').ValueKind} T
	 * @param {import('../ast/statements').Statement|import('../ast/expressions').Expression} node
	 * @param {import('./scope').Scope} scope
	 * @param {T} as
	 * @returns {Extract<import('./values').RuntimeValue, { kind: T }>}
	 */
	evaluateAs(node, scope, as) {
		return /**@type {Extract<import('./values').RuntimeValue, { kind: T }>}*/(makeValue(this, this.evaluate(node, scope), as));
	}

	/**
	 * Evalúa un nodo programa
	 * @param {import('../ast/statements').ProgramStatement} ast
	 * @param {import('./scope').Scope} scope
	 * @param {Boolean} [isTestDrive]
	 */
	evaluateProgram(ast, scope, isTestDrive = false) {
		if(ast == null || ast.kind !== StatementKinds.PROGRAM || ast.body == null)
			throw `Se esperaba AST válido para interrpretar`;

		this.errorStack = [];
		this.inputStack = [];
		this.sendStack = [];
		this.#isTestDrive = isTestDrive;
		this.#stop = false; //?
		const returned = this.#evaluateBlock(ast, scope);

		return {
			errorStack: this.errorStack,
			sendStack: this.sendStack,
			returned,
		};
	}

	/**
	 * Evalúa una sentencia o expresión y devuelve un valor extraído de las mismas
	 * @param {import('../ast/statements').Statement|import('../ast/expressions').Expression} node
	 * @param {import('./scope').Scope} scope
	 * @returns {import('./values').RuntimeValue}
	 */
	evaluate(node, scope) {
		switch(node.kind) {
		//Estructuras de control
		case StatementKinds.BLOCK:
			return this.#evaluateBlock(node, scope);

		case StatementKinds.CONDITIONAL:
			return this.#evaluateConditional(node, scope);

		case StatementKinds.WHILE:
			return this.#evaluateWhile(node, scope);

		case StatementKinds.DO_UNTIL:
			return this.#evaluateDoUntil(node, scope);

		case StatementKinds.REPEAT:
			return this.#evaluateRepeat(node, scope);

		case StatementKinds.FOR_EACH:
			return this.#evaluateForEach(node, scope);

		case StatementKinds.FOR:
			return this.#evaluateFor(node, scope);

		//Sentencias
		case StatementKinds.EXPRESSION:
			return this.evaluate(node.expression, scope);

		case StatementKinds.READ:
			return this.#evaluateRead(node, scope);

		case StatementKinds.DECLARATION:
			return this.#evaluateDeclaration(node, scope);

		case StatementKinds.SAVE:
			throw this.TuberInterpreterError('La característica todavía no está implementada: Secuencia "GUARDAR". ¡Vuelve a intentarlo en una futura versión de PuréScript!');

		case StatementKinds.ASSIGNMENT:
			return this.#evaluateAssignment(node, scope);

		case StatementKinds.RETURN:
			return this.#evaluateReturn(node, scope);

		case StatementKinds.END:
			return this.#evaluateEnd();

		case StatementKinds.STOP:
			return this.#evaluateStop(node, scope);

		case StatementKinds.SEND:
			return this.#evaluateSend(node, scope);

		//Expresiones
		case ExpressionKinds.NUMBER_LITERAL:
			return makeNumber(node.value);

		case ExpressionKinds.TEXT_LITERAL:
			return makeText(node.value);

		case ExpressionKinds.BOOLEAN_LITERAL:
			return makeBoolean(node.value);

		case ExpressionKinds.LIST_LITERAL:
			return this.#evaluateList(node, scope);

		case ExpressionKinds.REGISTRY_LITERAL:
			return this.#evaluateRegistry(node, scope);

		case ExpressionKinds.FUNCTION:
			throw this.TuberInterpreterError(`No implementado: ${node.kind}`);

		case ExpressionKinds.NADA_LITERAL:
			return makeNada();

		case ExpressionKinds.IDENTIFIER:
			return scope.lookup(node.name, true);

		case ExpressionKinds.UNARY:
			return this.#evaluateUnaryExpression(node, scope);

		case ExpressionKinds.BINARY:
			return this.#evaluateBinaryExpression(node, scope);
			
		case ExpressionKinds.CAST:
			return this.#evaluateCastExpression(node, scope);

		case ExpressionKinds.ARROW:
			throw this.TuberInterpreterError(`No implementado: ${node.kind}`);

		case ExpressionKinds.CALL:
			throw this.TuberInterpreterError(`No implementado: ${node.kind}`);

		default:
			throw this.TuberInterpreterError(`Se encontró un nodo desconocido u no implementado: ${node.kind}`);
		}
	}

	/**
	 * 
	 * @param {import('../ast/statements').ProgramStatement|import('../ast/statements').BlockStatement} node 
	 * @param {import('./scope').Scope} scope
	 * @param {Boolean} [avoidNewScope=false]
	 */
	#evaluateBlock(node, scope, avoidNewScope = false) {
		/**@type {import('./values').RuntimeValue}*/
		let returned = makeNada();

		const blockScope = avoidNewScope ? scope : new Scope(this, scope);
		for(const statement of node.body) {
			returned = this.evaluate(statement, blockScope);
			if(this.#stop) break;
		}

		return returned;
	}

	/**
	 * 
	 * @param {import('../ast/statements').ConditionalStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateConditional(node, scope) {
		const { test, consequent, alternate } = node;

		const testValue = this.evaluateAs(test, scope, ValueKinds.BOOLEAN);
		if(testValue.value)
			return this.#evaluateBlock(consequent, scope);
		
		if(alternate != null)
			return this.evaluate(alternate, scope);

		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/statements').WhileStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateWhile(node, scope) {
		const { test, body } = node;

		/**@type {import('./values').RuntimeValue}*/
		let evaluated = makeNada();

		while(this.evaluateAs(test, scope, ValueKinds.BOOLEAN).value === true) {
			evaluated = this.#evaluateBlock(body, scope);
			if(this.#stop) break;
		}

		return evaluated;
	}

	/**
	 * 
	 * @param {import('../ast/statements').DoUntilStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateDoUntil(node, scope) {
		const { test, body } = node;

		/**@type {import('./values').RuntimeValue}*/
		let evaluated = makeNada();

		do {
			evaluated = this.#evaluateBlock(body, scope);
			if(this.#stop) break;
		} while(this.evaluateAs(test, scope, ValueKinds.BOOLEAN).value === false);

		return evaluated;
	}

	/**
	 * 
	 * @param {import('../ast/statements').RepeatStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateRepeat(node, scope) {
		const { times, body } = node;

		/**@type {import('./values').RuntimeValue}*/
		let evaluated = makeNada();

		const timesValue = this.evaluateAs(times, scope, ValueKinds.NUMBER).value;
		for(let i = 0; i < timesValue; i++) {
			evaluated = this.#evaluateBlock(body, scope);
			if(this.#stop) break;
		}

		return evaluated;
	}

	/**
	 * 
	 * @param {import('../ast/statements').ForEachStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateForEach(node, scope) {
		const { identifier, container, body } = node;

		/**@type {import('./values').RuntimeValue}*/
		let evaluated = makeNada();

		const containerValue = this.evaluate(container, scope);
		if(!this.isAnyOf(containerValue, ValueKinds.LIST, ValueKinds.REGISTRY))
			throw this.TuberInterpreterError(`Se esperaba un valor de Lista o Registro en expresión de contenedor de Sentencia "PARA CADA"`);

		const entryNames = (this.is(containerValue, ValueKinds.LIST) ? containerValue.elements : containerValue.entries).keys();
		const forEachScope = new Scope(this, scope);
		const getFn = this.is(containerValue, ValueKinds.LIST)
			? (idx => containerValue.elements[idx])
			: (name => makeList([ makeText(name), containerValue.entries.get(name) ]));

		for(const entryName of entryNames) {
			forEachScope.assignVariable(identifier, getFn(entryName));
			evaluated = this.#evaluateBlock(body, forEachScope);
			if(this.#stop) break;
		}

		return evaluated;
	}

	/**
	 * 
	 * @param {import('../ast/statements').ForStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateFor(node, scope) {
		return (node.full === true)
			? this.#evaluateFullFor(node, scope)
			: this.#evaluateShortFor(node, scope);
	}

	/**
	 * 
	 * @param {import('../ast/statements').FullForStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateFullFor(node, scope) {
		const { start, test, step, identifier, body } = node;

		/**@type {import('./values').RuntimeValue}*/
		let evaluated = makeNada();

		const forScope = new Scope(this, scope);
		const startValue = this.evaluate(start, scope);
		const testFn = () => this.evaluateAs(test, forScope, ValueKinds.BOOLEAN).value;
		const stepFn = () => this.evaluate(step, forScope);

		for(forScope.assignVariable(identifier, startValue); testFn(); stepFn()) {
			evaluated = this.#evaluateBlock(body, forScope);
			if(this.#stop) break;
		}

		return evaluated;
	}

	/**
	 * 
	 * @param {import('../ast/statements').ShortForStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateShortFor(node, scope) {
		const { from, to, identifier, body } = node;

		/**@type {import('./values').RuntimeValue}*/
		let evaluated = makeNada();

		const fromValue = this.evaluateAs(from, scope, ValueKinds.NUMBER).value;
		const toValue = this.evaluateAs(to, scope, ValueKinds.NUMBER).value;
		const forScope = new Scope(this, scope);

		let i;
		const { testFn, stepFn } = (fromValue < toValue)
			? { testFn: () => i <= toValue, stepFn: () => i++ }
			: { testFn: () => i >= toValue, stepFn: () => i-- };

		for(i = fromValue; testFn(); stepFn()) {
			forScope.assignVariable(identifier, makeNumber(i));
			evaluated = this.#evaluateBlock(body, forScope);
			if(this.#stop) break;
		}

		return evaluated;
	}

	/**
	 * 
	 * @param {import('../ast/statements').ReadStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateRead(node, scope) {
		const { receptor, dataKind, optional, fallback } = node;
		// PENDIENTE
		//this.inputStack.push();
		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/statements').DeclarationStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateDeclaration(node, scope) {
		const { dataKind, declaration } = node;

		const valueKind = ValueKindLookups.get(dataKind.kind);
		scope.declareVariable(declaration, valueKind);

		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/statements').AssignmentStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateAssignment(node, scope) {
		const { operator, receptor, reception } = node;

		/**@type {import('./values').RuntimeValue}*/
		let receptionValue;
		if(reception == null) {
			if(!operator.isAny(TokenKinds.ADD, TokenKinds.SUBTRACT))
				throw this.TuberInterpreterError('La omisión del valor de recepción en una sentencia de asignación solo puede hacerse con los Indicadores de Sentencia "SUMAR" y "RESTAR"');

			receptionValue = makeNumber(1);
		} else
			receptionValue = this.evaluate(reception, scope);

		if(BinaryExpressionLookups.has(operator.kind)) {
			const operation = BinaryExpressionLookups.get(operator.kind);
			const receptorValue = this.evaluate(receptor, scope);
			receptionValue = operation(this, receptorValue, receptionValue);
		}

		/**@type {String}*/
		let identifier;
		switch(receptor.kind) {
		case ExpressionKinds.IDENTIFIER:
			identifier = receptor.name;
			scope.assignVariable(identifier, receptionValue);
			break;
		case ExpressionKinds.ARROW:
			// PENDIENTE
			if(receptor.computed === true) {
				identifier = makeValue(this, this.evaluate(receptor, scope), ValueKinds.TEXT).value;
			} else {
				identifier = receptor.key;
			}
			scope.assignVariable(identifier, receptionValue);
			break;
		default:
			throw this.TuberInterpreterError(`Expresión inválida en lado receptor (izquierdo) de sentencia de asignación. Se recibió: ${receptor.kind}`);
		}

		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/statements').ReturnStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateReturn(node, scope) {
		this.#stop = true;
		return this.evaluate(node.expression, scope);
	}

	/**
	 * 
	 */
	#evaluateEnd() {
		this.#stop = true;
		return makeNada();
	}
	
	/**
	 * 
	 * @param {import('../ast/statements').StopStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateStop(node, scope) {
		const { condition, stopMessage } = node;

		const conditionValue = makeValue(this, this.evaluate(condition, scope), ValueKinds.BOOLEAN);
		const stopMessageValue = makeValue(this, this.evaluate(stopMessage, scope), ValueKinds.TEXT);

		if(conditionValue.value) {
			this.#stop = true;
			this.sendStack.push(stopMessageValue)
			return stopMessageValue;
		}

		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/statements').SendStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateSend(node, scope) {
		const send = this.evaluate(node.expression, scope);
		this.sendStack.push(send);
		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/expressions').ListLiteralExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateList(node, scope) {
		const { elements } = node;
		const evaluatedElements = elements.map(e => this.evaluate(e, scope));
		return makeList(evaluatedElements);
	}

	/**
	 * 
	 * @param {import('../ast/expressions').RegistryLiteralExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateRegistry(node, scope) {
		const { entries } = node;
		
		const evaluatedEntries = new Map();
		for(const [ key, value ] of entries.entries())
			evaluatedEntries.set(key, this.evaluate(value, scope));

		return makeRegistry(evaluatedEntries);
	}

	/**
	 * 
	 * @param {import('../ast/expressions').UnaryExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateUnaryExpression(node, scope) {
		const { operator, argument } = node;

		const argumentValue = this.evaluate(argument, scope);

		const operation = UnaryExpressionLookups.get(operator.kind);
		if(operation == null)
			throw this.TuberInterpreterError('Operación binaria inválida');

		return operation(this, argumentValue);
	}

	/**
	 * 
	 * @param {import('../ast/expressions').BinaryExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateBinaryExpression(node, scope) {
		const { operator, left, right } = node;

		const leftValue = this.evaluate(left, scope);
		const rightValue = this.evaluate(right, scope);

		const operation = BinaryExpressionLookups.get(operator.kind);
		if(operation == null)
			throw this.TuberInterpreterError('Operación binaria inválida');
		
		return operation(this, leftValue, rightValue);
	}

	/**
	 * @param {import('../ast/expressions').CastExpression} node 
	 * @param {import("./scope").Scope} scope
	 */
	#evaluateCastExpression(node, scope) {
		const { argument, as } = node;
		const value = this.evaluate(argument, scope)
		const valueKind = ValueKindLookups.get(as.kind);
		return makeValue(this, value, valueKind);
	}
}

module.exports = {
	Interpreter,
};
