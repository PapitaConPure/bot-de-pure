const { Scope } = require('./scope');
const { TokenKinds } = require('../lexer/tokens');
const { ExpressionKinds } = require('../ast/expressions');
const { StatementKinds } = require('../ast/statements');
const { ValueKinds, makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeEmbed, makeNada, coerceValue, isInternalOperable, makeNativeFunction, makeFunction, makeLambda, ValueKindTranslationLookups, defaultValueOf } = require('./values');
const { UnaryExpressionLookups, BinaryExpressionLookups: BinaryOperationLookups, ValueKindLookups } = require('./lookups');
const { NativeMethodsLookup } = require('./environment/environment');

/**Representa un Intérprete de PuréScript*/
class Interpreter {
	/**@type {Array<Error>}*/
	#errorStack;
	/**@type {Array<import('../purescript').TuberInput>}*/
	#inputStack;
	/**@type {Map<String, import('../purescript').TuberInput>}*/
	#inputLookup;
	/**@type {Array<import('./values').RuntimeValue>}*/
	#sendStack;
	/**@type {Map<String, import('./values').RuntimeValue>}*/
	#saveTable;
	/**@type {import('../../../commands/Commons/typings').ComplexCommandRequest?}*/
	#request;
	/**@type {Boolean}*/
	#stop;
	/**@type {Number}*/
	#quota;
	/**@type {(node: import('../ast/statements').ReadStatement, scope: Scope) => import('./values').NadaValue}*/
	#evaluateReadStatement;

	constructor() {
		this.#errorStack = [];
		this.#inputStack = [];
		this.#inputLookup = new Map();
		this.#sendStack = [];
		this.#saveTable = new Map();
		this.#request = null;
		this.#stop = false;
		this.#quota = 1000;
		this.#evaluateReadStatement = null;
	}

	get request() {
		return this.#request;
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
	 * @param {import('../ast/expressions').Expression} node
	 * @param {import('./scope').Scope} scope
	 * @param {T} as
	 * @returns {Extract<import('./values').RuntimeValue, { kind: T }>}
	 */
	evaluateAs(node, scope, as, mustBeDeclared = true) {
		return /**@type {Extract<import('./values').RuntimeValue, { kind: T }>}*/(coerceValue(this, this.evaluate(node, scope, mustBeDeclared), as));
	}

	/**
	 * Evalúa un nodo programa
	 * @param {import('../ast/statements').ProgramStatement} ast
	 * @param {import('./scope').Scope} scope
	 * @param {import('../../../commands/Commons/typings').ComplexCommandRequest} request
	 * @param {Boolean} [isTestDrive]
	 */
	evaluateProgram(ast, scope, request, isTestDrive = false) {
		if(ast == null || ast.kind !== StatementKinds.PROGRAM || ast.body == null)
			throw `Se esperaba AST válido para interrpretar`;

		this.#errorStack = [];
		this.#inputStack = [];
		this.#sendStack = [];
		this.#request = request;
		this.#stop = false;
		this.#evaluateReadStatement = isTestDrive
			? this.#evaluateTestDriveRead
			: this.#evaluateProductionRead;
			
		const returned = this.#evaluateBlock(ast, scope);

		return {
			errorStack: this.#errorStack.slice(),
			sendStack: this.#sendStack.slice(),
			saveTable: new Map(this.#saveTable.entries()),
			returned,
		};
	}

	/**
	 * Evalúa una sentencia y devuelve el valor Nada
	 * @param {import('../ast/statements').Statement} node
	 * @param {import('./scope').Scope} scope
	 * @returns {import('./values').RuntimeValue}
	 */
	evaluateStatement(node, scope) {
		if(this.#quota-- <= 0)
			throw this.TuberInterpreterError(`Límite de ejecución de sentencias agotado. Esto puede deberse a un bucle infinito, abuso de estructuras iterativas o código poco eficiente`);

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

		//Imperativas
		case StatementKinds.EXPRESSION:
			return this.#evaluateExpressionStatement(node, scope);

		case StatementKinds.READ:
			return this.#evaluateReadStatement(node, scope);

		case StatementKinds.DECLARATION:
			return this.#evaluateDeclarationStatement(node, scope);

		case StatementKinds.SAVE:
			return this.#evaluateSaveStatement(node, scope);

		case StatementKinds.ASSIGNMENT:
			return this.#evaluateAssignmentStatement(node, scope);

		case StatementKinds.RETURN:
			return this.#evaluateReturnStatement(node, scope);

		case StatementKinds.END:
			return this.#evaluateEndStatement();

		case StatementKinds.STOP:
			return this.#evaluateStopStatement(node, scope);

		case StatementKinds.SEND:
			return this.#evaluateSendStatement(node, scope);

		default:
			throw this.TuberInterpreterError(`Se encontró un nodo inesperado u no implementado al evaluar sentencia: ${node.kind}`);
		}
	}

	/**
	 * Evalúa una sentencia o expresión y devuelve un valor extraído de las mismas
	 * @param {import('../ast/expressions').Expression} node
	 * @param {import('./scope').Scope} scope
	 * @param {Boolean} [mustBeDeclared]
	 * @returns {import('./values').RuntimeValue}
	 */
	evaluate(node, scope, mustBeDeclared = true) {
		if(this.#quota <= 0)
			throw this.TuberInterpreterError(`Límite de ejecución de sentencias agotado. Esto puede deberse a un bucle infinito, abuso de estructuras iterativas o código poco eficiente`);
		
		this.#quota -= 0.1;

		switch(node.kind) {
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
			return this.#evaluateFunction(node, scope);

		case ExpressionKinds.NADA_LITERAL:
			return makeNada();

		case ExpressionKinds.IDENTIFIER:
			return scope.lookup(node.name, mustBeDeclared);

		case ExpressionKinds.UNARY:
			return this.#evaluateUnaryExpression(node, scope, mustBeDeclared);

		case ExpressionKinds.BINARY:
			return this.#evaluateBinaryExpression(node, scope, mustBeDeclared);
			
		case ExpressionKinds.CAST:
			return this.#evaluateCastExpression(node, scope, mustBeDeclared);

		case ExpressionKinds.SEQUENCE:
			return this.#evaluateSequence(node, scope);

		case ExpressionKinds.ARROW:
			return this.#evaluateArrowExpression(node, scope);

		case ExpressionKinds.CALL:
			return this.#evaluateCallExpression(node, scope);

		default:
			throw this.TuberInterpreterError(`Se encontró un nodo inesperado u no implementado al evaluar expresión: ${node.kind}`);
		}
	}

	/**
	 * 
	 * @param {import('../ast/statements').ProgramStatement|import('../ast/statements').BlockStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateBlock(node, scope) {
		/**@type {import('./values').RuntimeValue}*/
		let returned = makeNada();

		const blockScope = new Scope(this, scope);
		for(const statement of node.body) {
			returned = this.evaluateStatement(statement, blockScope);
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

		const testValue = this.evaluateAs(test, scope, ValueKinds.BOOLEAN, false);
		if(testValue.value)
			return this.#evaluateBlock(consequent, scope);
		
		if(alternate != null)
			return this.evaluateStatement(alternate, scope);

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
			throw this.TuberInterpreterError(`Se esperaba un valor de Lista o Registro en expresión de contenedor de Sentencia "PARA CADA", pero "${this.#exprStr(container)}" fue de tipo ${ValueKindTranslationLookups.get(containerValue.kind)}`);

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
		const stepFn = () => this.evaluateStatement(step, forScope);

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
	 * @param {import('../ast/statements').ExpressionStatement} node 
	 * @param {Scope} scope 
	 * @returns 
	 */
	#evaluateExpressionStatement(node, scope) {
		this.evaluate(node.expression, scope);
		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/statements').ReadStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateTestDriveRead(node, scope) {
		const { receptor, dataKind, optional, fallback } = node;
		
		//Cargar valor de prueba
		const valueKind = ValueKindLookups.get(dataKind.kind);
		const fallbackValue = (fallback != null) ? this.evaluate(fallback, scope) : defaultValueOf(valueKind);
		const coercedValue = coerceValue(this, fallbackValue, valueKind);
		const name = this.#exprStr(receptor);
		this.#assignValueToExpression(receptor, coercedValue, scope);
		
		//Registrar nueva Entrada o marcar Entrada existente como extensiva
		if(this.#inputLookup.has(name)) {
			const input = this.#inputLookup.get(name);
			input.spread = true;
		} else {
			//No aceptar más Entradas extensivas si ya se detectó una
			if(this.#inputStack.length > 0 && this.#inputStack[this.#inputStack.length - 1].spread) {
				const spreadInput = this.#inputStack[this.#inputStack.length - 1];
				throw this.TuberInterpreterError([
					'Solo puede haber una única Entrada extensiva por Tubérculo, y debe ser la última Entrada del mismo.',
					`La Entrada anterior, "${spreadInput.name}", se detectó como extensiva. Sin embargo, luego se leyó una Entrada con otro nombre: "${name}".`,
					`Acomoda tu código de forma tal que la Entrada extensiva sea la última en ser leída`,
				].join('\n'));
			}

			const input = /**@type {import('../purescript').TuberInput}*/({
				kind: valueKind,
				name,
				optional,
				spread: false,
			});
	
			this.#inputStack.push(input);
			this.#inputLookup.set(name, input);
		}

		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/statements').ReadStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateProductionRead(node, scope) {
		const { receptor, dataKind, optional, fallback } = node;

		const receptorString = this.#exprStr(receptor);
		const valueKind = ValueKindLookups.get(dataKind.kind);
		let receptionValue = scope.lookup(receptorString, false);

		if(receptionValue.kind === ValueKinds.NADA) {
			if(optional)
				receptionValue = (fallback != null) ? this.evaluate(fallback, scope) : defaultValueOf(valueKind);
			else 
				throw this.TuberInterpreterError(`No se recibió un valor para la Entrada obligatoria "${receptorString}" de tipo ${dataKind.translated}`);
		}

		const coercedValue = coerceValue(this, receptionValue, valueKind);
		this.#assignValueToExpression(receptor, coercedValue, scope);

		return makeNada();
	}

	/**
	 * Evalúa una sentencia de declaración de variable.
	 * 
	 * La variable no debe estar ya declarada en el mismo ámbito.
	 * Si la variable existía en un ámbito padre, se declara otra en el ámbito actual que opaca la del ámbito padre
	 * @param {import('../ast/statements').DeclarationStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateDeclarationStatement(node, scope) {
		const { dataKind, declarations } = node;

		const valueKind = ValueKindLookups.get(dataKind.kind);
		for(const declaration of declarations)
			scope.declareVariable(declaration, valueKind);

		return makeNada();
	}

	/**
	 * Evalúa una sentencia de guardado de variable.
	 * 
	 * La variable se guarda en la base de datos para recuperarla en ejecuciones subsecuentes.
	 * @param {import('../ast/statements').SaveStatement} node 
	 * @param {Scope} scope 
	 */
	#evaluateSaveStatement(node, scope) {
		const { identifier, expression } = node;

		const value = this.evaluate(expression, scope);
		this.#saveTable.set(identifier, value);

		return makeNada();
	}

	/**
	 * Evalúa una sentencia de asignación de variable.
	 * 
	 * Si la variable no está declarada en este ámbito o los ámbitos padre, se la declara en este ámbito
	 * @param {import('../ast/statements').AssignmentStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateAssignmentStatement(node, scope) {
		const { operator, receptor, reception } = node;

		/**@type {import('./values').RuntimeValue}*/
		let receptionValue;
		if(reception == null) {
			if(!operator.isAny(TokenKinds.ADD, TokenKinds.SUBTRACT))
				throw this.TuberInterpreterError('La omisión del valor de recepción en una sentencia de asignación solo puede hacerse con los Indicadores de Sentencia "SUMAR" y "RESTAR"');

			receptionValue = makeNumber(1);
		} else
			receptionValue = this.evaluate(reception, scope, false);

		//SUMAR, RESTAR, etc...
		if(BinaryOperationLookups.has(operator.kind)) {
			const operation = BinaryOperationLookups.get(operator.kind);
			const receptorValue = this.evaluate(receptor, scope, false);
			receptionValue = operation(this, receptorValue, receptionValue);
		}

		this.#assignValueToExpression(receptor, receptionValue, scope);

		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/statements').ReturnStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateReturnStatement(node, scope) {
		const returned = this.evaluate(node.expression, scope, false);
		this.#stop = true;
		return returned;
	}

	/**
	 * 
	 */
	#evaluateEndStatement() {
		this.#stop = true;
		return makeNada();
	}
	
	/**
	 * 
	 * @param {import('../ast/statements').StopStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateStopStatement(node, scope) {
		const { condition, stopMessage } = node;

		const conditionValue = coerceValue(this, this.evaluate(condition, scope, false), ValueKinds.BOOLEAN);
		const stopMessageValue = coerceValue(this, this.evaluate(stopMessage, scope), ValueKinds.TEXT);

		if(conditionValue.value) {
			this.#stop = true;
			this.#sendStack.push(stopMessageValue)
			return stopMessageValue;
		}

		return makeNada();
	}

	/**
	 * 
	 * @param {import('../ast/statements').SendStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateSendStatement(node, scope) {
		let sendValue = this.evaluate(node.expression, scope, false);

		switch(sendValue.kind) {
		case ValueKinds.LIST:
			sendValue = makeList([ ... sendValue.elements ]);
			break;
		case ValueKinds.REGISTRY:
			sendValue = makeRegistry(new Map([ ...sendValue.entries.entries() ]));
			break;
		}

		this.#sendStack.push(sendValue);
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

		const registryValue = makeRegistry(new Map());
		
		for(const [ key, value ] of entries.entries()) {
			let evaluated = this.evaluate(value, scope);

			if(evaluated.kind === ValueKinds.NATIVE_FN)
				evaluated = evaluated.with(registryValue);

			registryValue.entries.set(key, evaluated);
		}

		return registryValue;
	}

	/**
	 * 
	 * @param {import('../ast/expressions').FunctionExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateFunction(node, scope) {
		if(node.expression === true)
			return makeLambda(node.body, node.args);

		return makeFunction(node.body, node.args, scope);
	}

	/**
	 * 
	 * @param {import('../ast/expressions').UnaryExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateUnaryExpression(node, scope, mustBeDeclared = true) {
		const { operator, argument } = node;

		const argumentValue = this.evaluate(argument, scope, mustBeDeclared);

		const operation = UnaryExpressionLookups.get(operator.kind);
		if(operation == null)
			throw this.TuberInterpreterError(`Operación unaria inválida. No se puede evaluar ${this.#exprStr(node)} porque el operador "${operator.value}" es inválido`);

		return operation(this, argumentValue);
	}

	/**
	 * 
	 * @param {import('../ast/expressions').BinaryExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateBinaryExpression(node, scope, mustBeDeclared = true) {
		const { operator, left, right } = node;

		const leftValue = this.evaluate(left, scope, mustBeDeclared);
		const rightValue = this.evaluate(right, scope, mustBeDeclared);

		const operation = BinaryOperationLookups.get(operator.kind);
		if(operation == null)
			throw this.TuberInterpreterError(`Operación binaria inválida. No se puede evaluar ${this.#exprStr(node)} porque el operador "${operator.value}" es inválido`);
		
		return operation(this, leftValue, rightValue);
	}

	/**
	 * @param {import('../ast/expressions').CastExpression} node 
	 * @param {import("./scope").Scope} scope
	 */
	#evaluateCastExpression(node, scope, mustBeDeclared = true) {
		const { argument, as } = node;
		const value = this.evaluate(argument, scope, false);
		const valueKind = ValueKindLookups.get(as.kind);
		return coerceValue(this, value, valueKind);
	}

	/**
	 * 
	 * @param {import('../ast/expressions').SequenceExpression} node 
	 * @param {import("./scope").Scope} scope
	 */
	#evaluateSequence(node, scope) {
		/**@type {import('./values').RuntimeValue}*/
		let lastEvaluation = makeNada();

		for(const expression of node.expressions) {
			lastEvaluation = this.evaluate(expression, scope);
		}

		return lastEvaluation;
	}

	/**
	 * Satanás está DIRECTAMENTE INVOLUCRADO en esta función
	 * @param {import('../ast/expressions').ArrowExpression} node 
	 * @param {import("./scope").Scope} scope
	 */
	#evaluateArrowExpression(node, scope) {
		const { holder } = node;

		const holderValue = this.evaluate(holder, scope);
		const keyString = node.computed === true ? this.evaluateAs(node.key, scope, ValueKinds.TEXT).value : node.key;

		switch(holderValue.kind) {
		case ValueKinds.NUMBER: {
			const method = this.#tryFindNativeMethod(holderValue, keyString);
			if(method) return method;
			return makeNada();
		}

		case ValueKinds.TEXT: {
			if(keyString === 'largo')
				return makeNumber(holderValue.value.length);

			const method = this.#tryFindNativeMethod(holderValue, keyString);
			if(method) return method;
			return makeNada();
		}

		case ValueKinds.BOOLEAN: {
			throw this.TuberInterpreterError(`El contenedor "${this.#exprStr(holder)}" en expresión de flecha "->" fue de tipo Dupla, el cual no contiene miembros accedibles por clave`);
		}

		case ValueKinds.LIST: {
			if(keyString === 'largo')
				return makeNumber(holderValue.elements.length);

			const method = this.#tryFindNativeMethod(holderValue, keyString);
			if(method) return method;

			const index = +keyString;
			if(isInternalOperable(index))
				return holderValue.elements[index] ?? makeNada();

			return makeNada();
		}

		case ValueKinds.REGISTRY: {
			const method = this.#tryFindNativeMethod(holderValue, keyString);
			if(method) return method;

			if(holderValue.entries.has(keyString)) {
				const value = holderValue.entries.get(keyString);
				
				if(this.is(value, ValueKinds.NATIVE_FN))
					return value.with(holderValue);
	
				return value;
			}
			
			if(keyString === 'largo' || keyString === 'tamaño')
				return makeNumber(holderValue.entries.size);

			return makeNada();
		}

		case ValueKinds.EMBED: {
			if(keyString === 'largo')
				return makeNumber(holderValue.value.data.fields.length);

			const method = this.#tryFindNativeMethod(holderValue, keyString);
			if(method) return method;
			return makeNada();
		}

		case ValueKinds.NATIVE_FN: {
			if(keyString === 'largo')
				return makeNumber(holderValue.call.length);

			const method = this.#tryFindNativeMethod(holderValue, keyString);
			if(method) return method;
			return makeNada();
		}

		case ValueKinds.FUNCTION: {
			if(keyString === 'largo')
				return makeNumber(holderValue.args.length);

			const method = this.#tryFindNativeMethod(holderValue, keyString);
			if(method) return method;
			return makeNada();
		}

		default:
			throw this.TuberInterpreterError(`El contenedor "${this.#exprStr(holder)}" en expresión de flecha "->" fue de tipo Nada`);
		}
	}

	/**
	 * 
	 * @param {import('../ast/expressions').CallExpression} node 
	 * @param {import("./scope").Scope} scope
	 */
	#evaluateCallExpression(node, scope) {
		const { fn, args } = node;

		const fnValue = this.evaluate(fn, scope);
		if(!this.isAnyOf(fnValue, ValueKinds.NATIVE_FN, ValueKinds.FUNCTION))
			throw this.TuberInterpreterError(`No se pudo llamar ${this.#exprStr(fn)} porque no era una Función. En cambio, era de tipo ${ValueKindTranslationLookups.get(fnValue.kind)}`);

		const argValues = args.map(arg => this.evaluate(arg, scope, false));
		let returnedValue;

		if(this.is(fnValue, ValueKinds.NATIVE_FN)) {
			const fnScope = new Scope(this, scope);
			returnedValue = fnValue.call(fnValue.self, argValues, fnScope);
		} else {
			const fnScope = new Scope(this, scope);
			const itpt = this;
			fnValue.args.forEach((arg, i) => {
				/**@type {import('./values').RuntimeValue}*/
				let value;
				if(i < argValues.length)
					value = argValues[i];
				else if(arg.optional)
					value = this.evaluate(arg.fallback, scope);
				else
					throw this.TuberInterpreterError(`Se esperaba un valor para el argumento "${arg.identifier}" de la Función ${itpt.#exprStr(fn)}`);

				fnScope.assignVariable(arg.identifier, argValues[i]);
			});

			if(fnValue.lambda === false) {
				fnScope.include(fnValue.scope);
				returnedValue = this.#evaluateBlock(fnValue.body, fnScope);
			} else
				returnedValue = this.evaluate(fnValue.expression, fnScope);
		}

		this.#stop = false;
		return returnedValue;
	}

	/**
	 * 
	 * @param {import('./values').RuntimeValue} value 
	 * @param {String} key 
	 * @returns 
	 */
	#tryFindNativeMethod(value, key) {
		const lookup = NativeMethodsLookup.get(value.kind);
		if(lookup.has(key)) {
			const method = lookup.get(key);
			return makeNativeFunction(value, method);
		}

		return null;
	}

	/**
	 * Asigna un valor concreto a un valor receptor. La expresión receptora DEBE evaluar a una referencia asignable
	 * @param {import('../ast/expressions').Expression} receptor
	 * @param {import('./values').RuntimeValue} receptionValue
	 * @param {import("./scope").Scope} scope
	 */
	#assignValueToExpression(receptor, receptionValue, scope) {
		/**@type {String}*/
		let identifier;
		switch(receptor.kind) {
		case ExpressionKinds.IDENTIFIER: {
			identifier = receptor.name;
			scope.assignVariable(identifier, receptionValue);
			break;
		}
			
		case ExpressionKinds.ARROW:
			if(receptor.computed === true) {
				const evaluated = this.evaluate(receptor.key, scope);
				identifier = coerceValue(this, evaluated, ValueKinds.TEXT).value;
			} else
				identifier = receptor.key;
			
			//Modificar por referencia
			const holderValue = this.evaluate(receptor.holder, scope);
			switch(holderValue.kind) {
			case ValueKinds.LIST:
				const index = +identifier;
				if(!isInternalOperable(index))
					throw this.TuberInterpreterError(`Se esperaba un índice válido en lado derecho de expresión de flecha "->" para la Lista "${this.#exprStr(receptor.holder)}" en expresión receptora de sentencia de asignación. Sin embargo, se recibió: ${identifier}`);

				holderValue.elements[index] = receptionValue;
				break;

			case ValueKinds.REGISTRY:
				if(receptionValue.kind === ValueKinds.NATIVE_FN)
					receptionValue = receptionValue.with(holderValue);
				holderValue.entries.set(identifier, receptionValue);
				break;

			default:
				throw this.TuberInterpreterError(`Expresión de flecha inválida como receptora de sentencia de asignación. El tipo de "${this.#exprStr(receptor.holder)}" no tiene miembros asignables`);
			}
			break;

		default:
			throw this.TuberInterpreterError(`La expresión ${this.#exprStr(receptor)} es inválida como receptora de una sentencia de asignación`);
		}
	}

	/**
	 * Reconstruye un String de código fuente a partir de una expresión de AST
	 * @param {import('../ast/expressions').Expression} node
	 * @returns {String} 
	 */
	#exprStr(node) {
		switch(node.kind) {
		case ExpressionKinds.ARGUMENT:
			return node.identifier;

		case ExpressionKinds.ARROW: {
			const holderString = this.#exprStr(node.holder);
			const actualKey = (node.computed) ? this.#exprStr(node.key) : node.key;
			return `${holderString}->${actualKey}`;
		}

		case ExpressionKinds.IDENTIFIER:
			return node.name;

		case ExpressionKinds.UNARY: {
			const argumentString = this.#exprStr(node.argument);
			return `${node.operator.value} ${argumentString})`;
		}

		case ExpressionKinds.BINARY: {
			const leftString = this.#exprStr(node.left);
			const rightString = this.#exprStr(node.right);
			return `(${leftString} ${node.operator.value} ${rightString})`;
		}

		case ExpressionKinds.NUMBER_LITERAL:
			return `${node.value}`;

		case ExpressionKinds.TEXT_LITERAL:
			return `'${node.value}'`;

		case ExpressionKinds.BOOLEAN_LITERAL:
			return node.value ? 'Verdadero' : 'Falso';

		case ExpressionKinds.LIST_LITERAL: {
			const stringifiedElements = node.elements.map(el => this.#exprStr(el));
			return `(Lista ${stringifiedElements.join(', ')})`;
		}

		case ExpressionKinds.REGISTRY_LITERAL: {
			const entriesArray = [ ...node.entries.entries() ];
			const stringifiedEntries = entriesArray.map(([ k, expr ]) => `${k}: ${this.#exprStr(expr)}`);
			return `(Registro ${stringifiedEntries.join(', ')})`;
		}

		case ExpressionKinds.CALL: {
			const fnString = this.#exprStr(node.fn);
			const argsString = node.args.map(arg => this.#exprStr(arg)).join(', ');
			return `${fnString}(${argsString})`;
		}

		case ExpressionKinds.CAST: {
			const operatorString = node.as.value;
			const argumentString = this.#exprStr(node.argument);
			return `(${operatorString} ${argumentString})`;
		}

		case ExpressionKinds.FUNCTION: {
			const argsString = node.args.map(arg => this.#exprStr(arg)).join(', ');

			if(node.expression === true) {
				const bodyString = this.#exprStr(node.body);
				return `(${argsString}) tal que ${bodyString}`;
			}

			return `Función(${argsString}) ... FIN`;
		}

		case ExpressionKinds.SEQUENCE: {
			const stringifiedExpressions = node.expressions.map(expression => this.#exprStr(expression));
			return `${stringifiedExpressions.join(', ')}`;
		}

		case ExpressionKinds.NADA_LITERAL:
			return 'Nada';

		default:
			return 'Desconocido';
		}
	}
}

module.exports = {
	Interpreter,
};
