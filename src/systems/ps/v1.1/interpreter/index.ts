import { Input, InputReader, ProductionInputReader, TestDriveInputReader } from './inputReader';
import { RuntimeValue, AssertedRuntimeValue, ValueKinds, ValueKindTranslationLookups, makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeEmbed, makeFunction, makeLambda, makeNativeFunction, makeNada, coerceValue, isInternalOperable, ValueKind, AnyFunctionValue } from './values';
import { UnaryOperationLookups, BinaryOperationLookups, ValueKindLookups } from './lookups';
import { EnvironmentProvider } from './environment/environmentProvider';
import { NativeMethodsLookup } from './environment';
import { Scope } from './scope';
import { Token, TokenKinds } from '../lexer/tokens';
import { AssignmentStatement, BlockStatement, ConditionalStatement, DeclarationStatement, DeleteStatement, DoUntilStatement, ExpressionStatement, ForEachStatement, ForStatement, FullForStatement, InsertionStatement, LoadStatement, ProgramStatement, ReadStatement, RepeatStatement, ReturnStatement, SaveStatement, SendStatement, ShortForStatement, Statement, StatementKinds, StopStatement, WhileStatement } from '../ast/statements';
import { ArrowExpression, BinaryExpression, CallExpression, CastExpression, ConditionalExpression, Expression, ExpressionKinds, FunctionExpression, ListLiteralExpression, RegistryLiteralExpression, SequenceExpression, UnaryExpression } from '../ast/expressions';
import { iota, shortenText } from '../util/utils';
import { ValuesOf } from '../util/types';

export const Stops = ({
	NONE: iota(0),
	BREAK: iota(),
	RETURN: iota(),
	ABORT: iota(),
}) as const;
export type StopKind = ValuesOf<typeof Stops>;

export interface EvaluationResult {
	returned: RuntimeValue;
	inputStack: Input[];
	sendStack: RuntimeValue[];
	saveTable: Map<string, RuntimeValue>;
	errorStack: Error[];
}

/**@description Representa un Intérprete de PuréScript.*/
export class Interpreter {
	#inputReader: InputReader;
	#errorStack: Error[];
	#sendStack: RuntimeValue[];
	#saveTable: Map<string, RuntimeValue>;
	#source: string;
	#provider: EnvironmentProvider;
	#stop: StopKind;
	#quota: number;
	#lastNodes: Array<Statement | Expression>;

	constructor() {
		this.#errorStack = [];
		this.#sendStack = [];
		this.#saveTable = new Map();
		this.#source = '';
		this.#stop = Stops.NONE;
		this.#quota = 0;
		this.#lastNodes = [];
	}

	get provider() {
		return this.#provider;
	}

	get hasArgs() {
		return this.#inputReader.hasArgs;
	}

	TuberInterpreterError(message: string, node: Expression | Statement | Token | null = null) {
		node ??= this.#lastNodes[0];

		const { lineString, offset, markLength } = this.#setupInterpreterErrorDisplay(node);
		const specifier = this.#formatInterpreterErrorDisplay(node, lineString, offset, markLength);

		const stackTrace = this.#generateStackTrace();

		const err = new Error(`${specifier}${message}\n${stackTrace}`);
		err.name = 'TuberInterpreterError';
		return err;
	}

	TuberSendError(message: string, node: Expression | Statement | Token | null = null) {
		node ??= this.#lastNodes[0];

		const { lineString, offset, markLength } = this.#setupInterpreterErrorDisplay(node);
		const specifier = this.#formatInterpreterErrorDisplay(node, lineString, offset, markLength);

		const err = new Error(specifier + message);
		err.name = 'TuberSendError';
		return err;
	}

	#setupInterpreterErrorDisplay(node: Expression | Statement | Token): { lineString: string | null; offset: number; markLength: number; } {
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
			lineString = lineString.slice(0, maxLength - suspensorLength) + ' ' + suspensor;
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

	#formatInterpreterErrorDisplay(node: Expression | Statement | Token, lineString: string | null, offset: number, markLength: number) {
		if(node == null)
			return '```arm\n//No hay información adicional para mostrar...\n```';

		const col = Math.max(0, Math.min(node.column - offset - 1, lineString?.length || 0));
		const rest = Math.max(1, Math.min(col + markLength, lineString?.length || 1) - col);

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
			if(node?.kind === ExpressionKinds.CALL)
				stackTrace.push(`- En \`${this.astString(node.fn)}\``);
		}

		stackTrace.push(`- En raíz de ejecución`);

		return stackTrace.join('\n');
	}

	isTestDrive() {
		return this.#inputReader.isTestDrive();
	}

	is<TKind extends ValueKind>(value: RuntimeValue | null | undefined, valueKind: TKind): value is AssertedRuntimeValue<TKind> {
		return value?.kind === valueKind;
	}

	isAnyOf<TKind extends ValueKind>(value: RuntimeValue, ...valueKinds: TKind[]): value is AssertedRuntimeValue<TKind> {
		return valueKinds.some(valueKind => value.kind === valueKind);
	}

	checkStop(stopKind: StopKind) {
		return this.#stop >= stopKind;
	}

	eatStop(stopKind: StopKind) {
		const test = this.#stop >= stopKind;

		if(this.#stop <= stopKind)
			this.#stop = Stops.NONE;

		return test;
	}

	/**@description Agrega el nodo indicado a una pila de nodos para diagnóstico de errores.*/
	rememberNode(node: Expression | Statement) {
		this.#lastNodes.unshift(node);
	}

	/**@description Elimina el último nodo recordado de la pila para diagnóstico de errores y lo devuelve.*/
	forgetLastNode() {
		return this.#lastNodes.shift();
	}

	evaluateAs<TKind extends ValueKind>(node: Expression, scope: Scope, as: TKind, mustBeDeclared = true): AssertedRuntimeValue<TKind> {
		return coerceValue(this, this.evaluate(node, scope, mustBeDeclared), as);
	}

	/**@description Evalúa un nodo programa.*/
	evaluateProgram(ast: ProgramStatement, scope: Scope, source: string, provider: EnvironmentProvider, args: string[] | null = undefined, isTestDrive: boolean = false): EvaluationResult {
		if(ast == null || ast.kind !== StatementKinds.PROGRAM || ast.body == null)
			throw `Se esperaba AST válido para interpretar`;

		if(typeof source !== 'string')
			throw new Error('Se esperaba un string válido para proveer información de errores de evaluación');

		this.#saveTable = new Map();
		this.#errorStack = [];
		this.#sendStack = [];
		this.#lastNodes = [];
		this.#source = source.replace(/(^\s+)|(\s+$)/g, '');
		this.#provider = provider;
		this.#stop = Stops.NONE;
		this.#quota = 2000;

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

	/**@description Evalúa una sentencia y devuelve el valor Nada.*/
	evaluateStatement(node: Statement, scope: Scope): RuntimeValue {
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
			returnValue = this.#evaluateConditionalStmt(node, scope);
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

	/**@description Evalúa una sentencia o expresión y devuelve un valor extraído de las mismas.*/
	evaluate(node: Expression, scope: Scope, mustBeDeclared: boolean = true): RuntimeValue {
		this.rememberNode(node);

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

		case ExpressionKinds.EMBED_LITERAL:
			returnValue = makeEmbed();
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

		case ExpressionKinds.CONDITIONAL:
			returnValue = this.#evaluateConditionalExpr(node, scope, mustBeDeclared);
			break;

		case ExpressionKinds.CAST:
			returnValue = this.#evaluateCast(node, scope);
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

	#evaluateBlock(node: ProgramStatement | BlockStatement, scope: Scope) {
		let returned: RuntimeValue = makeNada();

		const blockScope = new Scope(this, scope);
		for(const statement of node.body) {
			returned = this.evaluateStatement(statement, blockScope);
			if(this.checkStop(Stops.BREAK)) break;
		}

		return returned;
	}

	#evaluateConditionalStmt(node: ConditionalStatement, scope: Scope) {
		const { test, consequent, alternate } = node;

		const testValue = this.evaluateAs(test, scope, ValueKinds.BOOLEAN, false);
		if(testValue.value)
			return this.#evaluateBlock(consequent, scope);

		if(alternate != null)
			return this.evaluateStatement(alternate, scope);

		return makeNada();
	}

	#evaluateWhile(node: WhileStatement, scope: Scope) {
		const { test, body } = node;

		let evaluated: RuntimeValue = makeNada();

		while(this.evaluateAs(test, scope, ValueKinds.BOOLEAN).value === true) {
			evaluated = this.#evaluateBlock(body, scope);
			if(this.eatStop(Stops.BREAK)) break;
		}

		return evaluated;
	}

	#evaluateDoUntil(node: DoUntilStatement, scope: Scope) {
		const { test, body } = node;

		let evaluated: RuntimeValue = makeNada();

		do {
			evaluated = this.#evaluateBlock(body, scope);
			if(this.eatStop(Stops.BREAK)) break;
		} while(this.evaluateAs(test, scope, ValueKinds.BOOLEAN).value === false);

		return evaluated;
	}

	#evaluateRepeat(node: RepeatStatement, scope: Scope) {
		const { times, body } = node;

		let evaluated: RuntimeValue = makeNada();

		const timesValue = this.evaluateAs(times, scope, ValueKinds.NUMBER).value;
		for(let i = 0; i < timesValue; i++) {
			evaluated = this.#evaluateBlock(body, scope);
			if(this.eatStop(Stops.BREAK)) break;
		}

		return evaluated;
	}

	#evaluateForEach(node: ForEachStatement, scope: Scope) {
		const { identifier, container, body } = node;

		let evaluated: RuntimeValue = makeNada();

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

	#evaluateFor(node: ForStatement, scope: Scope) {
		return (node.full === true)
			? this.#evaluateFullFor(node, scope)
			: this.#evaluateShortFor(node, scope);
	}

	#evaluateFullFor(node: FullForStatement, scope: Scope) {
		const { init, test, step, identifier, body } = node;

		let evaluated: RuntimeValue = makeNada();

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

	#evaluateShortFor(node: ShortForStatement, scope: Scope) {
		const { from, to, identifier, body } = node;

		let evaluated: RuntimeValue = makeNada();

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

	#evaluateExpressionStatement(node: ExpressionStatement, scope: Scope) {
		this.evaluate(node.expression, scope);
		return makeNada();
	}

	/**
	 * @description
	 * Evalúa una sentencia de lectura de Entrada de Usuario.
	 *
	 * El comportamiento exacto depende de si el programa actual se evalúa en modo prueba o no.
	 * * Si es una ejecución de prueba, ocurre el primer punto que aplique entre los siguientes:
	 *   1. Si la Entrada tiene valor de falla, se asume el valor de falla especificado por el programador.
	 *   2. Se asume el valor por defecto del tipo esperado de la Entrada.
	 * * Si es una ejecución ordinaria, ocurre el primer punto que aplique entre los siguientes:
	 *   1. Si quien ejecuta el script da un valor, se asume ese valor.
	 *   2. Si la Entrada es opcional y tiene valor de falla, se asume el valor de falla especificado por el programador.
	 *   3. Si la Entrada es opcional y no tiene valor de falla, se asume el valor por defecto del tipo esperado de la Entrada.
	 *   4. Se lanza un error.
	 */
	#evaluateReadStatement(node: ReadStatement, scope: Scope) {
		const coercedValue = this.#inputReader.readInput(node, scope);
		this.#assignValueToExpression(node.receptor, coercedValue, scope);
		return makeNada();
	}

	/**
	 * @description
	 * Evalúa una sentencia de declaración de variable.
	 *
	 * La variable no debe estar ya declarada en el mismo ámbito.
	 * Si la variable existía en un ámbito padre, se declara otra en el ámbito actual que opaca la del ámbito padre.
	 */
	#evaluateDeclarationStatement(node: DeclarationStatement, scope: Scope) {
		const { dataKind, declarations } = node;

		const valueKind = dataKind != null ? (ValueKindLookups.get(dataKind.kind) ?? ValueKinds.NADA) : ValueKinds.NADA;
		for(const declaration of declarations)
			scope.declareVariable(declaration, valueKind);

		return makeNada();
	}

	/**
	 * @description
	 * Evalúa una sentencia de guardado de variable.
	 *
	 * La variable se guarda en la base de datos para recuperarla en ejecuciones subsecuentes.
	 */
	#evaluateSaveStatement(node: SaveStatement, scope: Scope) {
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
	 * @description
	 * Evalúa una sentencia de borrado de variable guardada.
	 *
	 * La variable se borra de la base de datos para no recuperarla en ejecuciones subsecuentes.
	 */
	#evaluateDeleteStatement(node: DeleteStatement, _scope: Scope) {
		const { identifier } = node;
		this.#saveTable.set(identifier, makeNada());
		return makeNada();
	}

	/**
	 * @description
	 * Evalúa una sentencia de guardado de variable.
	 *
	 * La variable se guarda en la base de datos para recuperarla en ejecuciones subsecuentes.
	 */
	#evaluateLoadStatement(node: LoadStatement, scope: Scope) {
		const { identifier, conditional } = node;

		if(conditional) {
			const assignment = node.expressions
				.map(expr => this.evaluate(expr, scope, false))
				.find(value => coerceValue(this, value, ValueKinds.BOOLEAN).value);

			scope.assignVariable(identifier, assignment);
		} else {
			const value = scope.lookup(identifier, false);

			if(value.kind === ValueKinds.NADA)
				scope.assignVariable(identifier, value);
		}

		return makeNada();
	}

	/**
	 * @description
	 * Evalúa una sentencia de asignación de variable.
	 *
	 * Si la variable no está declarada en este ámbito o los ámbitos padre y la sentencia es CARGAR, se la declara en este ámbito.
	 */
	#evaluateAssignmentStatement(node: AssignmentStatement, scope: Scope) {
		const { operator, receptor, reception } = node;

		let receptionValue: RuntimeValue;
		let implicit = false;

		if(reception == null) {
			if(!operator.isAny(TokenKinds.ADD, TokenKinds.SUBTRACT))
				throw this.TuberInterpreterError('La omisión del valor de recepción en una sentencia de asignación solo puede hacerse con los indicadores de Sentencia `SUMAR` y `RESTAR`', operator);

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
			if(!operation) throw 'Operación binaria desconocida';
			receptionValue = operation(this, receptorValue, receptionValue, receptor, reception);
		}

		this.#assignValueToExpression(receptor, receptionValue, scope);

		return makeNada();
	}

	/**
	 * @description
	 * Evalúa una sentencia de inserción de variable de Lista.
	 *
	 * La variable debe estar declarada y debe ser una Lista.
	 */
	#evaluateInsertionStatement(node: InsertionStatement, scope: Scope) {
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
	 * @description
	 * Evalúa una sentencia de retorno de valor.
	 *
	 * Devuelve el valor de la expresión indicada.
	 * Todas las sentencias luego de esta se ignoran hasta que finaliza un ámbito de Función o el Programa.
	 */
	#evaluateReturnStatement(node: ReturnStatement, scope: Scope) {
		const returned = this.evaluate(node.expression, scope, false);
		this.#stop = Stops.RETURN;
		return returned;
	}

	/**
	 * @description
	 * Evalúa una sentencia de corte de Función o Programa.
	 *
	 * Todas las sentencias luego de esta se ignoran hasta que finaliza un ámbito de Función o el Programa.
	 */
	#evaluateEndStatement() {
		this.#stop = Stops.BREAK;
		return makeNada();
	}

	/**
	 * @description
	 * Evalúa una sentencia de finalización condicional.
	 *
	 * Si la condición se cumple, se envía Y devuelve el mensaje de finalización indicado.
	 * Todas las sentencias luego de esta se ignoran hasta que finaliza el Programa (no aplica a Programas que ejecutan Programas).
	 *
	 * Los ámbitos de Función son irrelevantes para esta sentencia.
	 */
	#evaluateStopStatement(node: StopStatement, scope: Scope) {
		const { condition, stopMessage } = node;

		const conditionValue = condition ? coerceValue(this, this.evaluate(condition, scope, false), ValueKinds.BOOLEAN) : makeBoolean(true);
		const stopMessageValue = coerceValue(this, this.evaluate(stopMessage, scope), ValueKinds.TEXT);

		if(conditionValue.value) {
			this.#stop = Stops.ABORT;
			this.#sendStack = [ stopMessageValue ];
			return stopMessageValue;
		}

		return makeNada();
	}

	/**
	 * @description
	 * Evalúa una sentencia de envío de valor.
	 *
	 * Añade un valor a la pila de valores enviados.
	 * Dichos valores serían enviados en conjunto al finalizar el Programa.
	 */
	#evaluateSendStatement(node: SendStatement, scope: Scope) {
		let sendValue = this.evaluate(node.expression, scope, false);

		switch(sendValue.kind) {
		case ValueKinds.LIST:
			sendValue = makeList([ ... sendValue.elements ]);
			break;
		case ValueKinds.REGISTRY:
			sendValue = makeRegistry(new Map([ ...sendValue.entries.entries() ]));
			break;
		case ValueKinds.EMBED: {
			if(sendValue.value.empty)
				throw this.TuberInterpreterError('No se puede enviar un valor de Marco vacío', node);

			const embedDataCopy = sendValue.value.copy();
			sendValue = makeEmbed();
			sendValue.value = embedDataCopy;
			break;
		}
		}

		this.#sendStack.push(sendValue);
		return makeNada();
	}

	/**@description Evalúa una expresión de Lista y retorna un valor de Lista.*/
	#evaluateList(node: ListLiteralExpression, scope: Scope) {
		const { elements } = node;
		const evaluatedElements = elements.map(e => this.evaluate(e, scope));
		return makeList(evaluatedElements);
	}

	/**@description  Evalúa una expresión de Registro y retorna un valor de Registro.*/
	#evaluateRegistry(node: RegistryLiteralExpression, scope: Scope) {
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

	/**@description Evalúa una expresión de Función de usuario y devuelve un valor de Función de usuario.*/
	#evaluateFunction(node: FunctionExpression, scope: Scope) {
		if(node.expression === true)
			return makeLambda(node.body, node.args);

		const fnValue = makeFunction(node.body, node.args, new Scope(this).include(scope));
		fnValue.name = '[Función]';
		return fnValue;
	}

	/**@description Evalúa una expresión unaria y devuelve el valor resultante de la operación.*/
	#evaluateUnary(node: UnaryExpression, scope: Scope, mustBeDeclared = true) {
		const { operator, argument } = node;

		const argumentValue = this.evaluate(argument, scope, mustBeDeclared);

		const operation = UnaryOperationLookups.get(operator.kind);
		if(operation == null)
			throw this.TuberInterpreterError(`Operación unaria inválida. No se puede evaluar ${this.astString(node)} porque el operador "${operator.value}" es inválido`, operator);

		return operation(this, argumentValue, argument);
	}

	/**@description Evalúa una expresión binaria y devuelve el valor resultante de la operación.*/
	#evaluateBinary(node: BinaryExpression, scope: Scope, mustBeDeclared = true) {
		const { operator, left, right } = node;

		if(operator.is(TokenKinds.AFTER))
			return this.#evaluateAfter(node, scope, mustBeDeclared);

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

	/**@description Evalúa una expresión ternaria condicional y devuelve el valor resultante de la operación.*/
	#evaluateConditionalExpr(node: ConditionalExpression, scope: Scope, mustBeDeclared = true) {
		const { test, consequent, alternate } = node;

		const testValue = this.evaluateAs(test, scope, ValueKinds.BOOLEAN, false);
		const consequentValue = this.evaluate(consequent, scope, mustBeDeclared);
		const alternateValue = this.evaluate(alternate, scope, mustBeDeclared);

		return testValue.value ? consequentValue : alternateValue;
	}

	/**@description Evalúa una expresión binaria "luego" y devuelve el valor resultante de la operación.*/
	#evaluateAfter(node: BinaryExpression, scope: Scope, mustBeDeclared = true) {
		const { left, right } = node;

		if(this.isTestDrive())
			return this.evaluate(left, scope, mustBeDeclared);
		else
			return this.evaluate(right, scope, mustBeDeclared);
	}

	/**@description Evalúa una expresión binaria lógica y devuelve el valor resultante de la operación.*/
	#evaluateLogical(node: BinaryExpression, scope: Scope, mustBeDeclared = true) {
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
	 * @description
	 * Evalúa una expresión de conversión de valor.
	 *
	 * Si es posible, convierte un valor de un cierto tipo al tipo indicado.
	 */
	#evaluateCast(node: CastExpression, scope: Scope) {
		const { argument, as } = node;
		const value = this.evaluate(argument, scope, false);
		const valueKind = ValueKindLookups.get(as.kind);
		if(!valueKind) throw 'Tipo de valor inválido al castear';
		return coerceValue(this, value, valueKind);
	}

	/**
	 * @description
	 * Evalúa una expresión de secuencia de expresiones.
	 *
	 * Evalúa todas las expresiones en orden de izquierda a derecha y devuelve el valor de la última expresión evaluada.
	 */
	#evaluateSequence(node: SequenceExpression, scope: Scope) {
		let lastEvaluation: RuntimeValue = makeNada();

		for(const expression of node.expressions)
			lastEvaluation = this.evaluate(expression, scope);

		return lastEvaluation;
	}

	/**@description Satanás está DIRECTAMENTE INVOLUCRADO en esta función.*/
	#evaluateArrow(node: ArrowExpression, scope: Scope) {
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

			const entryValue = holderValue.entries.get(keyString);
			if(entryValue) {
				if(this.is(entryValue, ValueKinds.NATIVE_FN))
					return entryValue.with(holderValue);

				if(this.is(entryValue, ValueKinds.FUNCTION))
					entryValue.self = holderValue;

				return entryValue;
			}

			if(keyString === 'largo' || keyString === 'tamaño')
				return makeNumber(holderValue.entries.size);

			return makeNada();
		}

		case ValueKinds.EMBED: {
			if(keyString === 'largo')
				return makeNumber(holderValue.value.data.fields?.length || 0);

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
	 * @description
	 * Evalúa una expresión de llamado de Función o Método.
	 *
	 * Ejecuta la Función especificada, si existe, con los argumentos indicados, si aplica.
	 *
	 * Es irrelevante si la Función es nativa o de usuario. Superficialmente, se ejecutarán de forma similar.
	 */
	#evaluateCall(node: CallExpression, scope: Scope) {
		const { fn, args } = node;

		const fnValue = this.evaluate(fn, scope);
		if(!this.isAnyOf(fnValue, ValueKinds.NATIVE_FN, ValueKinds.FUNCTION))
			throw this.TuberInterpreterError(`No se pudo llamar ${this.astString(fn)} porque no era una Función. En cambio, era de tipo ${ValueKindTranslationLookups.get(fnValue.kind)}`, fn);

		const argValues = args.map(arg => this.evaluate(arg, scope, false));

		return this.callFunction(fnValue, argValues, scope);
	}

	/**
	 * @description
	 * Evalúa un llamado de valor de Función o Método.
	 *
	 * Ejecuta el valor de Función especificado, con los argumentos indicados, si aplica.
	 *
	 * Es irrelevante si la Función es nativa o de usuario. Superficialmente, se ejecutarán de forma similar.
	 */
	callFunction(fnValue: AnyFunctionValue, argValues: RuntimeValue[], scope: Scope) {
		let returnedValue;

		if(this.is(fnValue, ValueKinds.NATIVE_FN)) {
			const fnScope = new Scope(this, scope);
			returnedValue = fnValue.call(fnValue.self ?? makeNada(), argValues, fnScope);
		} else {
			const fnScope = scope.createFunctionScope(fnValue, argValues);

			if(fnValue.lambda === false)
				returnedValue = this.#evaluateBlock(fnValue.body, fnScope);
			else
				returnedValue = this.evaluate(fnValue.expression, fnScope);
		}

		this.eatStop(Stops.RETURN);
		return returnedValue;
	}

	/**
	 * @description
	 * Función de utilidad para intentar encontrar un método nativo y enlazarlo a un valor correspondiente.
	 *
	 * Si no se encuentra un método con el nombre solicitado para el tipo del valor indicado, se devuelve `null`
	 */
	#tryFindNativeMethod(value: RuntimeValue, key: string) {
		const lookup = NativeMethodsLookup.get(value.kind);
		if(!lookup) throw 'Tipo de valor inválido al intentar encontrar método nativo para el mismo';

		const method = lookup.get(key);
		if(method)
			return makeNativeFunction(value, method);

		return null;
	}

	/**@description Asigna un valor concreto a un valor receptor. La expresión receptora DEBE evaluar a una referencia asignable.*/
	#assignValueToExpression(receptor: Expression, receptionValue: RuntimeValue, scope: Scope) {
		let identifier: string;
		switch(receptor.kind) {
		case ExpressionKinds.IDENTIFIER: {
			identifier = receptor.name;
			scope.assignVariable(identifier, receptionValue);
			break;
		}

		case ExpressionKinds.ARROW: {
			if(receptor.computed === true) {
				const evaluated = this.evaluate(receptor.key, scope);
				identifier = coerceValue(this, evaluated, ValueKinds.TEXT).value;
			} else
				identifier = receptor.key;

			//Modificar por referencia
			const holderValue = this.evaluate(receptor.holder, scope);
			switch(holderValue.kind) {
			case ValueKinds.LIST: {
				const index = +identifier;
				if(!isInternalOperable(index))
					throw this.TuberInterpreterError(`Se esperaba un índice válido en lado derecho de expresión de flecha "->" para la Lista \`${this.astString(receptor.holder)}\` en expresión receptora de sentencia de asignación. Sin embargo, se recibió: ${identifier}`, receptor);

				holderValue.elements[index] = receptionValue;
				break;
			}

			case ValueKinds.REGISTRY:
				if(receptionValue.kind === ValueKinds.NATIVE_FN)
					receptionValue = receptionValue.with(holderValue);
				holderValue.entries.set(identifier, receptionValue);
				break;

			default:
				throw this.TuberInterpreterError(`Expresión de flecha inválida como receptora de sentencia de asignación. El tipo de \`${this.astString(receptor.holder)}\` no tiene miembros asignables`, receptor);
			}
			break;
		}

		default:
			throw this.TuberInterpreterError(`La expresión ${this.astString(receptor)} es inválida como receptora de una sentencia de asignación`, receptor);
		}
	}

	/**@description Devuelve el fragmento de código fuento del cual se originó el nodo AST indicado.*/
	astString(node: Expression | Statement | Token): string {
		return this.#source.slice(node.start, node.end);
	}
}
