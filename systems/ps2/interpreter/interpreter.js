const { ProductionInputReader, TestDriveInputReader } = require('./inputReader');
const { Scope } = require('./scope');
const { TokenKinds } = require('../lexer/tokens');
const { ExpressionKinds } = require('../ast/expressions');
const { StatementKinds } = require('../ast/statements');
const { ValueKinds, makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeEmbed, makeNada, coerceValue, isInternalOperable, makeNativeFunction, makeFunction, makeLambda, ValueKindTranslationLookups, defaultValueOf } = require('./values');
const { UnaryOperationLookups, BinaryOperationLookups, ValueKindLookups } = require('./lookups');
const { NativeMethodsLookup } = require('./environment/environment');
const { shortenText } = require('../../../func');
const Ut = require('../../../utils');

const Stops = /**@type {const}*/({
	NONE: Ut.Iota(0),
	BREAK: Ut.iota,
	RETURN: Ut.iota,
	ABORT: Ut.iota,
});
/**@typedef {import('types').ValuesOf<Stops>} StopKind*/

/**Representa un Intérprete de PuréScript*/
class Interpreter {
	/**@type {import('./inputReader').InputReader}*/
	#inputReader;
	/**@type {Array<Error>}*/
	#errorStack;
	/**@type {Array<import('./values').RuntimeValue>}*/
	#sendStack;
	/**@type {Map<String, import('./values').RuntimeValue>}*/
	#saveTable;
	/**@type {String}*/
	#source;
	/**@type {import('../../../commands/Commons/typings').ComplexCommandRequest?}*/
	#request;
	/**@type {StopKind}*/
	#stop;
	/**@type {Number}*/
	#quota;
	/**@type {Array<import('../ast/statements').Statement | import('../ast/expressions').Expression>}*/
	#lastNodes;

	constructor() {
		this.#errorStack = [];
		this.#sendStack = [];
		this.#saveTable = new Map();
		this.#source = '';
		this.#request = null;
		this.#stop = Stops.NONE;
		this.#quota = 0;
		this.#lastNodes = [];
	}

	get request() {
		return this.#request;
	}

	get hasArgs() {
		return this.#inputReader.hasArgs;
	}

	/**
	 * @param {String} message
	 * @param {import('../ast/expressions').Expression | import('../ast/statements').Statement | import('../lexer/tokens').Token} node
	 */
	TuberInterpreterError(message, node = null) {
		node ??= this.#lastNodes[0];

		const { lineString, offset, markLength } = this.#setupInterpreterErrorDisplay(node);
		const specifier = this.#formatInterpreterErrorDisplay(node, lineString, offset, markLength);

		const stackTrace = this.#generateStackTrace();

		const err = new Error(`${specifier}${message}\n${stackTrace}`);
		err.name = 'TuberInterpreterError';
		return err;
	}

	/**
	 * @param {String} message
	 * @param {import('../ast/expressions').Expression | import('../ast/statements').Statement | import('../lexer/tokens').Token} node
	 */
	TuberSendError(message, node = null) {
		node ??= this.#lastNodes[0];

		const { lineString, offset, markLength } = this.#setupInterpreterErrorDisplay(node);
		const specifier = this.#formatInterpreterErrorDisplay(node, lineString, offset, markLength);

		const err = new Error(specifier + message);
		err.name = 'TuberSendError';
		return err;
	}

	/**
	 * 
	 * @param {import('../ast/expressions').Expression | import('../ast/statements').Statement | import('../lexer/tokens').Token} node
	 * @returns {{ lineString: String, offset: Number, markLength: Number }}
	 */
	#setupInterpreterErrorDisplay(node) {
		if(node == null) {
			return {
				lineString: null,
				offset: 0,
				markLength: 0,
			};
		}

		const suspensor = '(...)';
		const maxLength = 55;

		const nodeLength = node.end - node.start;
		const columnEnd = node.column + nodeLength;

		const sourceLines = this.#source.split(/\r?\n/g);
		let lineString = sourceLines[node.line - 1];
		const offset = Math.max(0, lineString.length - maxLength);

		if(lineString.length < maxLength) {
			return {
				lineString,
				offset,
				markLength: nodeLength,
			};
		}

		const suspensorLength = suspensor.length + 1; //Considera el espacio

		if(columnEnd < maxLength) //Suspensor a la derecha
			lineString = lineString.slice(0, maxLength - suspensorLength) + ' ' + suspensor
		else if(node.column >= lineString.length) //Suspensor a la izquierda
			lineString = suspensor + ' ' + lineString.slice(lineString.length - maxLength - 1 + suspensorLength);
		else { //Dos suspensores
			let center = (node.column + columnEnd) * 0.5;
			const half1 = Math.floor(maxLength * 0.5);
			const half2 = maxLength - half1;
			if(node.column < (center - half1))
				center = node.column + half1;
			lineString = suspensor + ' ' + lineString.slice(center - half1 + suspensorLength, center + half2 - suspensorLength) + ' ' + suspensor;
		}

		return {
			lineString,
			offset,
			markLength: nodeLength,
		};
	}

	/**
	 * 
	 * @param {import('../ast/expressions').Expression | import('../ast/statements').Statement | import('../lexer/tokens').Token} node
	 * @param {String} lineString 
	 * @param {Number} offset 
	 * @param {Number} markLength 
	 */
	#formatInterpreterErrorDisplay(node, lineString, offset, markLength) {
		if(node == null)
			return '```arm\n//No hay información adicional para mostrar...\n```';

		const col = Math.max(0, Math.min(node.column - offset - 1, lineString.length));
		const rest = Math.max(1, Math.min(col + markLength, lineString.length) - col);

		return [
			'```arm',
			lineString || '//No hay información adicional para mostrar...',
			lineString ? `${' '.repeat(col)}${'↑'.repeat(rest)}` : '',
			'```',
			`En línea **${node.line}**, columnas **${node.column}** a **${node.column + markLength}** - `,
		].join('\n');
	}

	#generateStackTrace() {
		const stackTrace = [];

		while(this.#lastNodes.length > 0 && stackTrace.length < 6) {
			const node = this.forgetLastNode();
			if(node.kind === ExpressionKinds.CALL)
				stackTrace.push(`- En \`${this.astString(node.fn)}\``);
		}

		stackTrace.push(`- En raíz de ejecución`);

		return stackTrace.join('\n');
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
	 * @param {StopKind} stopKind
	 */
	checkStop(stopKind) {
		return this.#stop >= stopKind;
	}

	/**
	 * @param {StopKind} stopKind 
	 */
	eatStop(stopKind) {
		const test = this.#stop >= stopKind;

		if(this.#stop <= stopKind)
			this.#stop = Stops.NONE;

		return test;
	}

	/**
	 * 
	 * @param {import('../ast/expressions').Expression | import('../ast/statements').Statement} node 
	 */
	rememberNode(node) {
		this.#lastNodes.unshift(node);
	}

	forgetLastNode() {
		return this.#lastNodes.shift();
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
	 * @param {String} source
	 * @param {import('../../../commands/Commons/typings').ComplexCommandRequest} request
	 * @param {Array<String>} args
	 * @param {Boolean} [isTestDrive]
	 */
	evaluateProgram(ast, scope, source, request, args, isTestDrive = false) {
		if(ast == null || ast.kind !== StatementKinds.PROGRAM || ast.body == null)
			throw `Se esperaba AST válido para interpretar`;

		if(typeof source !== 'string')
			throw new Error('Se esperaba un String válido para proveer información de errores de evaluación');

		this.#saveTable = new Map();
		this.#errorStack = [];
		this.#sendStack = [];
		this.#source = source.replace(/(^\s+)|(\s+$)/g, '');
		this.#request = request;
		this.#stop = Stops.NONE;
		this.#quota = 1000;

		this.#inputReader = isTestDrive
			? new TestDriveInputReader(this, args)
			: new ProductionInputReader(this, args);
			
		const returned = this.#evaluateBlock(ast, scope);
		const inputStack = this.#inputReader.inputStack;
		const sendStack = this.#sendStack.slice();
		const saveTable = new Map(this.#saveTable.entries());
		const errorStack = this.#errorStack.slice();

		return {
			returned,
			inputStack,
			sendStack,
			saveTable,
			errorStack,
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
			throw this.TuberInterpreterError(`Límite de ejecución de sentencias agotado. Esto puede deberse a un bucle infinito, abuso de estructuras iterativas o código poco eficiente`, node);
		
		this.rememberNode(node);

		let returnValue;
		switch(node.kind) {
		//Estructuras de control
		case StatementKinds.BLOCK:
			returnValue = this.#evaluateBlock(node, scope);
			break;

		case StatementKinds.CONDITIONAL:
			returnValue = this.#evaluateConditional(node, scope);
			break;

		case StatementKinds.WHILE:
			returnValue = this.#evaluateWhile(node, scope);
			break;

		case StatementKinds.DO_UNTIL:
			returnValue = this.#evaluateDoUntil(node, scope);
			break;

		case StatementKinds.REPEAT:
			returnValue = this.#evaluateRepeat(node, scope);
			break;

		case StatementKinds.FOR_EACH:
			returnValue = this.#evaluateForEach(node, scope);
			break;

		case StatementKinds.FOR:
			returnValue = this.#evaluateFor(node, scope);
			break;

		//Inmediatas
		case StatementKinds.EXPRESSION:
			returnValue = this.#evaluateExpressionStatement(node, scope);
			break;

		case StatementKinds.READ:
			returnValue = this.#evaluateReadStatement(node, scope);
			break;

		case StatementKinds.DECLARATION:
			returnValue = this.#evaluateDeclarationStatement(node, scope);
			break;

		case StatementKinds.SAVE:
			returnValue = this.#evaluateSaveStatement(node, scope);
			break;

		case StatementKinds.LOAD:
			returnValue = this.#evaluateLoadStatement(node, scope);
			break;

		case StatementKinds.ASSIGNMENT:
			returnValue = this.#evaluateAssignmentStatement(node, scope);
			break;

		case StatementKinds.INSERTION:
			returnValue = this.#evaluateInsertionStatement(node, scope);
			break;
			
		case StatementKinds.DELETE:
			returnValue = this.#evaluateDeleteStatement(node, scope);
			break;

		case StatementKinds.RETURN:
			returnValue = this.#evaluateReturnStatement(node, scope);
			break;

		case StatementKinds.END:
			returnValue = this.#evaluateEndStatement();
			break;

		case StatementKinds.STOP:
			returnValue = this.#evaluateStopStatement(node, scope);
			break;

		case StatementKinds.SEND:
			returnValue = this.#evaluateSendStatement(node, scope);
			break;

		default:
			throw new Error(`Se encontró un nodo inesperado u no implementado al evaluar sentencia: ${node.kind}`);
		}

		this.forgetLastNode();
		return returnValue;
	}

	/**
	 * Evalúa una sentencia o expresión y devuelve un valor extraído de las mismas
	 * @param {import('../ast/expressions').Expression} node
	 * @param {import('./scope').Scope} scope
	 * @param {Boolean} [mustBeDeclared]
	 * @returns {import('./values').RuntimeValue}
	 */
	evaluate(node, scope, mustBeDeclared = true) {
		this.rememberNode(node)

		if(this.#quota <= 0)
			throw this.TuberInterpreterError(`Límite de ejecución de sentencias agotado. Esto puede deberse a un bucle infinito, abuso de estructuras iterativas o código poco eficiente`, node);
		
		this.#quota -= 0.1;

		let returnValue;
		switch(node.kind) {
		case ExpressionKinds.NUMBER_LITERAL:
			returnValue = makeNumber(node.value);
			break;

		case ExpressionKinds.TEXT_LITERAL:
			returnValue = makeText(node.value);
			break;

		case ExpressionKinds.BOOLEAN_LITERAL:
			returnValue = makeBoolean(node.value);
			break;

		case ExpressionKinds.LIST_LITERAL:
			returnValue = this.#evaluateList(node, scope);
			break;

		case ExpressionKinds.REGISTRY_LITERAL:
			returnValue = this.#evaluateRegistry(node, scope);
			break;

		case ExpressionKinds.FUNCTION:
			returnValue = this.#evaluateFunction(node, scope);
			break;

		case ExpressionKinds.NADA_LITERAL:
			returnValue = makeNada();
			break;

		case ExpressionKinds.IDENTIFIER:
			returnValue = scope.lookup(node.name, mustBeDeclared);
			break;

		case ExpressionKinds.UNARY:
			returnValue = this.#evaluateUnary(node, scope, mustBeDeclared);
			break;

		case ExpressionKinds.BINARY:
			returnValue = this.#evaluateBinary(node, scope, mustBeDeclared);
			break;
			
		case ExpressionKinds.CAST:
			returnValue = this.#evaluateCast(node, scope, mustBeDeclared);
			break;

		case ExpressionKinds.SEQUENCE:
			returnValue = this.#evaluateSequence(node, scope);
			break;

		case ExpressionKinds.ARROW:
			returnValue = this.#evaluateArrow(node, scope);
			break;

		case ExpressionKinds.CALL:
			returnValue = this.#evaluateCall(node, scope);
			break;

		default:
			throw new Error(`Se encontró un nodo inesperado u no implementado al evaluar expresión: ${node.kind}`);
		}

		this.forgetLastNode();
		return returnValue;
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
			if(this.checkStop(Stops.BREAK)) break;
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
			if(this.eatStop(Stops.BREAK)) break;
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
			if(this.eatStop(Stops.BREAK)) break;
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
			if(this.eatStop(Stops.BREAK)) break;
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
			throw this.TuberInterpreterError(`Se esperaba un valor de Lista o Registro en expresión de contenedor de Sentencia \`PARA CADA\`, pero \`${this.astString(container)}\` fue de tipo ${ValueKindTranslationLookups.get(containerValue.kind)}`, container);

		const entryNames = (this.is(containerValue, ValueKinds.LIST) ? containerValue.elements : containerValue.entries).keys();
		const forEachScope = new Scope(this, scope);
		const getFn = this.is(containerValue, ValueKinds.LIST)
			? (idx => containerValue.elements[idx])
			: (name => makeList([ makeText(name), containerValue.entries.get(name) ]));

		for(const entryName of entryNames) {
			forEachScope.assignVariable(identifier, getFn(entryName));
			evaluated = this.#evaluateBlock(body, forEachScope);
			if(this.eatStop(Stops.BREAK)) break;
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
		const { init, test, step, identifier, body } = node;

		/**@type {import('./values').RuntimeValue}*/
		let evaluated = makeNada();

		const forScope = new Scope(this, scope);
		const startValue = this.evaluate(init, forScope);
		const startFn = () => {
			forScope.declareVariable(identifier, startValue.kind);
			forScope.assignVariable(identifier, startValue);
		};
		const testFn = () => this.evaluateAs(test, forScope, ValueKinds.BOOLEAN).value;
		const stepFn = () => this.evaluateStatement(step, forScope);

		for(startFn(); testFn(); stepFn()) {
			evaluated = this.#evaluateBlock(body, forScope);
			if(this.eatStop(Stops.BREAK)) break;
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
			if(this.eatStop(Stops.BREAK)) break;
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
	 * Evalúa una sentencia de lectura de Entrada de Usuario.
	 * 
	 * El comportamiento exacto depende de si el programa actual se evalúa en modo prueba o no.
	 * * Si es una ejecución de prueba, ocurre el primer punto que aplique entre los siguientes:
	 *   1. Si la Entrada tiene valor de falla, se asume el valor de falla especificado por el programador
	 *   2. Se asume el valor por defecto del tipo esperado de la Entrada
	 * * Si es una ejecución ordinaria, ocurre el primer punto que aplique entre los siguientes:
	 *   1. Si quien ejecuta el script da un valor, se asume ese valor
	 *   2. Si la Entrada es opcional y tiene valor de falla, se asume el valor de falla especificado por el programador
	 *   3. Si la Entrada es opcional y no tiene valor de falla, se asume el valor por defecto del tipo esperado de la Entrada
	 *   4. Se lanza un error
	 * @param {import('../ast/statements').ReadStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateReadStatement(node, scope) {
		const coercedValue = this.#inputReader.readInput(node, scope);
		this.#assignValueToExpression(node.receptor, coercedValue, scope);
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

		const valueKind = dataKind != null ? ValueKindLookups.get(dataKind.kind) : ValueKinds.NADA;
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
		
		if(!this.isAnyOf(value, ValueKinds.NUMBER, ValueKinds.TEXT, ValueKinds.BOOLEAN, ValueKinds.LIST, ValueKinds.REGISTRY)) {
			const kindStr = ValueKindTranslationLookups.get(value.kind) ?? 'Desconocido';
			throw this.TuberInterpreterError(`Tipo de dato inválido al intentar guardar un valor bajo el nombre: \`${identifier}\`. El tipo del valor recibido fue: _${kindStr}_`, expression);
		}

		this.#saveTable.set(identifier, value);

		return makeNada();
	}

	/**
	 * Evalúa una sentencia de borrado de variable guardada.
	 * 
	 * La variable se borra de la base de datos para no recuperarla en ejecuciones subsecuentes
	 * @param {import('../ast/statements').DeleteStatement} node 
	 * @param {Scope} scope 
	 */
	#evaluateDeleteStatement(node, scope) {
		const { identifier } = node;
		this.#saveTable.set(identifier, makeNada());
		return makeNada();
	}

	/**
	 * Evalúa una sentencia de guardado de variable.
	 * 
	 * La variable se guarda en la base de datos para recuperarla en ejecuciones subsecuentes.
	 * @param {import('../ast/statements').LoadStatement} node 
	 * @param {Scope} scope 
	 */
	#evaluateLoadStatement(node, scope) {
		const { identifier } = node;

		const value = scope.lookup(identifier, false);

		if(value.kind === ValueKinds.NADA)
			scope.assignVariable(identifier, value);

		return makeNada();
	}

	/**
	 * Evalúa una sentencia de asignación de variable.
	 * 
	 * Si la variable no está declarada en este ámbito o los ámbitos padre y la sentencia es CARGAR, se la declara en este ámbito
	 * @param {import('../ast/statements').AssignmentStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateAssignmentStatement(node, scope) {
		const { operator, receptor, reception } = node;

		/**@type {import('./values').RuntimeValue}*/
		let receptionValue;
		let implicit = false;
		
		if(reception == null) {
			if(!operator.isAny(TokenKinds.ADD, TokenKinds.SUBTRACT))
				throw this.TuberInterpreterError('La omisión del valor de recepción en una sentencia de asignación solo puede hacerse con los indicadores de Sentencia \`SUMAR\` y \`RESTAR\`', operator);

			receptionValue = makeNumber(1);
			implicit = true;
		} else {
			receptionValue = this.evaluate(reception, scope, false);
			
			if(this.is(receptionValue, ValueKinds.FUNCTION))
				receptionValue.name = shortenText(this.astString(receptor), 96);
		}

		if(operator.is(TokenKinds.EXTEND)) {
			const receptorValue = this.evaluate(receptor, scope, false);
			if(!this.is(receptorValue, ValueKinds.LIST))
				throw this.TuberInterpreterError(`El receptor en Sentencia \`EXTENDER\` debe ser una Lista, y \`${this.astString(receptor)}\` no lo era`, receptor);

			receptorValue.elements.push(receptionValue);
			return makeNada();
		}

		//SUMAR, RESTAR, etc...
		if(BinaryOperationLookups.has(operator.kind)) {
			const receptorValue = this.evaluate(receptor, scope, false);
			
			if(receptorValue.kind === ValueKinds.TEXT) {
				if(implicit)
					throw this.TuberInterpreterError('La omisión del valor de recepción en una sentencia de asignación solo puede hacerse con Números', operator);

				if(!operator.is(TokenKinds.ADD))
					throw this.TuberInterpreterError('Las únicas sentencias de asignación que se pueden usar con Textos son `CARGAR` y `SUMAR`', operator);
			}

			const operation = BinaryOperationLookups.get(operator.kind);


			receptionValue = operation(this, receptorValue, receptionValue, receptor, reception);
		}

		this.#assignValueToExpression(receptor, receptionValue, scope);

		return makeNada();
	}

	/**
	 * Evalúa una sentencia de inserción de variable de Lista.
	 * 
	 * La variable debe estar declarada y debe ser una Lista
	 * @param {import('../ast/statements').InsertionStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateInsertionStatement(node, scope) {
		const { receptor, reception, index } = node;
		
		const receptorValue = this.evaluate(receptor, scope, false);
		if(receptorValue.kind !== ValueKinds.LIST)
			throw this.TuberInterpreterError(`El receptor en Sentencia \`EXTENDER\` debe ser una Lista, y \`${this.astString(receptor)}\` no lo era`, receptor);
		
		const receptionValue = this.evaluate(reception, scope, false);
		const indexValue = this.evaluateAs(index, scope, ValueKinds.NUMBER, true);

		receptorValue.elements.splice(indexValue.value, 0, receptionValue);

		return makeNada();
	}

	/**
	 * Evalúa una sentencia de retorno de valor.
	 * 
	 * Devuelve el valor de la expresión indicada.
	 * Todas las sentencias luego de esta se ignoran hasta que finaliza un ámbito de Función o el Programa
	 * @param {import('../ast/statements').ReturnStatement} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateReturnStatement(node, scope) {
		const returned = this.evaluate(node.expression, scope, false);
		this.#stop = Stops.RETURN;
		return returned;
	}

	/**
	 * Evalúa una sentencia de corte de Función o Programa.
	 * 
	 * Todas las sentencias luego de esta se ignoran hasta que finaliza un ámbito de Función o el Programa
	 */
	#evaluateEndStatement() {
		this.#stop = Stops.BREAK;
		return makeNada();
	}
	
	/**
	 * Evalúa una sentencia de finalización condicional.
	 * 
	 * Si la condición se cumple, se envía Y devuelve el mensaje de finalización indicado.
	 * Todas las sentencias luego de esta se ignoran hasta que finaliza el Programa (no aplica a Programas que ejecutan Programas).
	 * 
	 * Los ámbitos de Función son irrelevantes para esta sentencia
	 * @param {import('../ast/statements').StopStatement} node
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateStopStatement(node, scope) {
		const { condition, stopMessage } = node;

		const conditionValue = coerceValue(this, this.evaluate(condition, scope, false), ValueKinds.BOOLEAN);
		const stopMessageValue = coerceValue(this, this.evaluate(stopMessage, scope), ValueKinds.TEXT);

		if(conditionValue.value) {
			this.#stop = Stops.ABORT;
			this.#sendStack = [ stopMessageValue ];
			return stopMessageValue;
		}

		return makeNada();
	}

	/**
	 * Evalúa una sentencia de envío de valor.
	 * 
	 * Añade un valor a la pila de valores enviados.
	 * Dichos valores serían enviados en conjunto al finalizar el Programa.
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
	 * Evalúa una expresión de Lista y retorna un valor de Lista
	 * @param {import('../ast/expressions').ListLiteralExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateList(node, scope) {
		const { elements } = node;
		const evaluatedElements = elements.map(e => this.evaluate(e, scope));
		return makeList(evaluatedElements);
	}

	/**
	 * Evalúa una expresión de Registro y retorna un valor de Registro
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
	 * Evalúa una expresión de Función de usuario y devuelve un valor de Función de usuario
	 * @param {import('../ast/expressions').FunctionExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateFunction(node, scope) {
		if(node.expression === true)
			return makeLambda(node.body, node.args);

		const fnValue = makeFunction(node.body, node.args, new Scope(this).include(scope));
		fnValue.name = '[Función]';
		return fnValue;
	}

	/**
	 * Evalúa una expresión unaria y devuelve el valor resultante de la operación
	 * @param {import('../ast/expressions').UnaryExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateUnary(node, scope, mustBeDeclared = true) {
		const { operator, argument } = node;

		const argumentValue = this.evaluate(argument, scope, mustBeDeclared);

		const operation = UnaryOperationLookups.get(operator.kind);
		if(operation == null)
			throw this.TuberInterpreterError(`Operación unaria inválida. No se puede evaluar ${this.astString(node)} porque el operador "${operator.value}" es inválido`, operator);

		return operation(this, argumentValue, argument);
	}

	/**
	 * Evalúa una expresión binaria y devuelve el valor resultante de la operación
	 * @param {import('../ast/expressions').BinaryExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateBinary(node, scope, mustBeDeclared = true) {
		const { operator, left, right } = node;

		//Caso especial de operaciones binarias lógicas
		if(operator.isAny(TokenKinds.AND, TokenKinds.OR))
			return this.#evaluateLogical(node, scope, mustBeDeclared);

		const leftValue = this.evaluate(left, scope, mustBeDeclared);
		const rightValue = this.evaluate(right, scope, mustBeDeclared);

		const operation = BinaryOperationLookups.get(operator.kind);

		if(operation == null)
			throw this.TuberInterpreterError(`Operación binaria inválida. No se puede evaluar ${this.astString(node)} porque el operador "${operator.value}" es inválido`, operator);

		return operation(this, leftValue, rightValue, left, right);
	}

	/**
	 * Evalúa una expresión binaria lógica y devuelve el valor resultante de la operación
	 * @param {import('../ast/expressions').BinaryExpression} node 
	 * @param {import('./scope').Scope} scope
	 */
	#evaluateLogical(node, scope, mustBeDeclared = true) {
		const { operator, left, right } = node;

		const leftValue = this.evaluate(left, scope, mustBeDeclared);
		const leftTruth = this.is(leftValue, ValueKinds.NADA) ? makeBoolean(false) : coerceValue(this, leftValue, ValueKinds.BOOLEAN);

		//Evaluación de cortocircuito
		if((leftTruth.value === true  && operator.is(TokenKinds.OR))
		|| (leftTruth.value === false && operator.is(TokenKinds.AND)))
			return leftValue;

		const rightValue = this.evaluate(right, scope, mustBeDeclared);
		return rightValue;
	}

	/**
	 * Evalúa una expresión de conversión de valor.
	 * 
	 * Si es posible, convierte un valor de un cierto tipo al tipo indicado
	 * @param {import('../ast/expressions').CastExpression} node 
	 * @param {import("./scope").Scope} scope
	 */
	#evaluateCast(node, scope, mustBeDeclared = true) {
		const { argument, as } = node;
		const value = this.evaluate(argument, scope, false);
		const valueKind = ValueKindLookups.get(as.kind);
		return coerceValue(this, value, valueKind);
	}

	/**
	 * Evalúa una expresión de secuencia de expresiones.
	 * 
	 * Evalúa todas las expresiones en orden de izquierda a derecha y devuelve el valor de la última expresión evaluada
	 * @param {import('../ast/expressions').SequenceExpression} node 
	 * @param {import("./scope").Scope} scope
	 */
	#evaluateSequence(node, scope) {
		/**@type {import('./values').RuntimeValue}*/
		let lastEvaluation = makeNada();

		for(const expression of node.expressions)
			lastEvaluation = this.evaluate(expression, scope);

		return lastEvaluation;
	}

	/**
	 * Satanás está DIRECTAMENTE INVOLUCRADO en esta función
	 * @param {import('../ast/expressions').ArrowExpression} node 
	 * @param {import("./scope").Scope} scope
	 */
	#evaluateArrow(node, scope) {
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
			throw this.TuberInterpreterError(`El contenedor "${this.astString(holder)}" en expresión de flecha "->" fue de tipo Lógico, el cual no contiene miembros accedibles por clave`, holder);
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
			throw this.TuberInterpreterError(`El contenedor "${this.astString(holder)}" en expresión de flecha "->" fue de tipo Nada`, holder);
		}
	}

	/**
	 * Evalúa una expresión de llamado de Función o Método.
	 * 
	 * Ejecuta la Función especificada, si existe, con los argumentos indicados, si aplica.
	 * 
	 * Es irrelevante si la Función es nativa o de usuario. Superficialmente, se ejecutarán de forma similar
	 * @param {import('../ast/expressions').CallExpression} node 
	 * @param {import("./scope").Scope} scope
	 */
	#evaluateCall(node, scope) {
		const { fn, args } = node;

		const fnValue = this.evaluate(fn, scope);
		if(!this.isAnyOf(fnValue, ValueKinds.NATIVE_FN, ValueKinds.FUNCTION))
			throw this.TuberInterpreterError(`No se pudo llamar ${this.astString(fn)} porque no era una Función. En cambio, era de tipo ${ValueKindTranslationLookups.get(fnValue.kind)}`, fn);

		const argValues = args.map(arg => this.evaluate(arg, scope, false));
		
		return this.callFunction(fnValue, argValues, scope);
	}

	/**
	 * Evalúa un llamado de valor de Función o Método.
	 * 
	 * Ejecuta el valor de Función especificado, con los argumentos indicados, si aplica.
	 * 
	 * Es irrelevante si la Función es nativa o de usuario. Superficialmente, se ejecutarán de forma similar
	 * @param {import('./values').FunctionValue | import('./values').NativeFunctionValue} fnValue
	 * @param {Array<import('./values').RuntimeValue>} argValues
	 * @param {import("./scope").Scope} scope
	 */
	callFunction(fnValue, argValues, scope) {
		let returnedValue;

		if(this.is(fnValue, ValueKinds.NATIVE_FN)) {
			const fnScope = new Scope(this, scope);
			returnedValue = fnValue.call(fnValue.self, argValues, fnScope);
		} else {
			let fnScope;

			if(fnValue.lambda === false) {
				fnValue.scope.include(scope);
				fnScope = new Scope(this, fnValue.scope);
			} else
				fnScope = new Scope(this, scope);

			fnValue.args.forEach((arg, i) => {
				/**@type {import('./values').RuntimeValue}*/
				let value;
				if(i < argValues.length)
					value = argValues[i];
				else if(arg.optional)
					value = this.evaluate(arg.fallback, scope);
				else
					throw this.TuberInterpreterError(`Se esperaba un valor para el parámetro \`${arg.identifier}\` de la Función \`${fnValue.name}\``, arg);

				fnScope.declareVariable(arg.identifier, ValueKinds.NADA);
				fnScope.assignVariable(arg.identifier, value);
			});

			if(fnValue.lambda === false)
				returnedValue = this.#evaluateBlock(fnValue.body, fnScope);
			else
				returnedValue = this.evaluate(fnValue.expression, fnScope);
		}

		this.eatStop(Stops.RETURN);
		return returnedValue;
	}

	/**
	 * Función de utilidad para intentar encontrar un método nativo y enlazarlo a un valor correspondiente.
	 * 
	 * Si no se encuentra un método con el nombre solicitado para el tipo del valor indicado, se devuelve `null`
	 * @param {import('./values').RuntimeValue} value 
	 * @param {String} key 
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
					throw this.TuberInterpreterError(`Se esperaba un índice válido en lado derecho de expresión de flecha "->" para la Lista \`${this.astString(receptor.holder)}\` en expresión receptora de sentencia de asignación. Sin embargo, se recibió: ${identifier}`, receptor);

				holderValue.elements[index] = receptionValue;
				break;

			case ValueKinds.REGISTRY:
				if(receptionValue.kind === ValueKinds.NATIVE_FN)
					receptionValue = receptionValue.with(holderValue);
				holderValue.entries.set(identifier, receptionValue);
				break;

			default:
				throw this.TuberInterpreterError(`Expresión de flecha inválida como receptora de sentencia de asignación. El tipo de \`${this.astString(receptor.holder)}\` no tiene miembros asignables`, receptor);
			}
			break;

		default:
			throw this.TuberInterpreterError(`La expresión ${this.astString(receptor)} es inválida como receptora de una sentencia de asignación`, receptor);
		}
	}

	/**
	 * Devuelve el fragmento de código fuento del cual se originó el nodo AST indicado
	 * @param {import('../ast/expressions').Expression | import('../ast/statements').Statement | import('../lexer/tokens').Token} node
	 * @returns {String} 
	 */
	astString(node) {
		return this.#source.slice(node.start, node.end);
	}
}

module.exports = {
	Interpreter,
};
