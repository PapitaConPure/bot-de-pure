const { ParserNodeTypes, ParserToLanguageType } = require('./psparser.js');
const { TuberScope } = require('./psscope.js');
const {
	TuberInterpreterError,
	//@ts-expect-error
	ParserNode,
	//@ts-expect-error
	RuntimeType,
	//@ts-expect-error
	ParserBlockNode,
	//@ts-expect-error
	RuntimeValue,
	//@ts-expect-error
	TextValue,
	//@ts-expect-error
	ListValue,
	//@ts-expect-error
	GlossaryValue,
	//@ts-expect-error
	RuntimePropertyNode,
	makeNumber,
	makeText,
	makeBoolean,
	makeList,
	makeGlossary,
	makeNada,
	makeFunction,
	isNotOperable,
	makeValue,
	extendList,
	extractFromRuntimeValue,
	ParserToRuntimeType,
	RuntimeToLanguageType,
	RuntimeNodeTypes,
	ParserStatementNodeTypes,
} = require('./commons.js');

function invalidToLanguage(value) {
	if(value == undefined) return 'Nada';
	if(isNaN(value)) return 'Innumerable';
	if(!isFinite(value)) return 'Infinito';
	return 'Desconocido';
}

/**
 * @type {Map<Readonly<import('./commons.js').LogicalOperator>, (left, right) => *>}
 */
const logicOperations = new Map();
logicOperations.set('y',          (left, right) => left && right);
logicOperations.set('o',          (left, right) => left || right);
logicOperations.set('es',         (left, right) => left === right);
logicOperations.set('no es',      (left, right) => left !== right);
logicOperations.set('parece',     (left, right) => left ==  right);
logicOperations.set('no parece',  (left, right) => left !=  right);
logicOperations.set('precede',    (left, right) => left <   right);
logicOperations.set('no precede', (left, right) => left >=  right);
logicOperations.set('excede',     (left, right) => left >   right);
logicOperations.set('no excede',  (left, right) => left <=  right);

/**@class Interpreta un programa PuréScript*/
class TuberInterpreter {
	/**@type {{ number: Number, name: String }}*/
	#currentStatement = { number: 0, name: 'PROGRAMA' };
	/**@type {Number}*/
	#processedSentences = 0;
	/**@type {Number}*/
	#maxSentences = 600;
	/**@type {Array<{ type: RuntimeType, name: String }>}*/
	#inputStack = [];
	/**@type {Array<ListValue>}*/
	#listStack = [];
	/**@type {Array<RuntimeValue>}*/
	#sendStack = [];
	/**@type {import('../../../commands/Commons/typings.js').CommandRequest}*/
	#request;
	/**@type {Boolean}*/
	#testDrive;

	/**
	 * Arroja un error con el statement actual
	 * @param {string} errorMessage
	 */
	#TuberInterpreterError(errorMessage = 'Ocurrió un error desconocido') {
		throw TuberInterpreterError(errorMessage, this.#currentStatement);
	}

	/**
	 * Tira un error si `node` no es del tipo especificado
	 * @param {import('./commons.js').ParserNode} node 
	 * @param {import('./commons.js').ParserNodeType} type 
	 * @param {String} errorMessage 
	 * @returns {void}
	 */
	#expectNode(node, type, errorMessage) {
		if(node?.type !== type)
			throw this.#TuberInterpreterError(errorMessage);
	}

	/**
	 * Tira un error si `value` no es del tipo especificado
	 * @param {RuntimeValue} value 
	 * @param {RuntimeType} type 
	 * @param {String} errorMessage 
	 * @returns {void}
	 */
	#expectRuntimeValue(value, type, errorMessage) {
		if(value?.type !== type)
			throw this.#TuberInterpreterError(errorMessage);
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserProgramNode} node 
	 * @param {TuberScope} scope
	 */
	evaluateProgram(node, scope, request, isTestDrive) {
		if(node.type !== 'Program')
			throw this.#TuberInterpreterError('Programa inválido');

		const programScope = new TuberScope(scope);

		this.#request = request;
		this.#testDrive = isTestDrive;
		this.#evaluateBlock(node.body, programScope);

		console.log('Variables finales:');
		console.dir(programScope.variables, { depth: null });

		return {
			inputStack: this.#inputStack,
			sendStack: this.#sendStack,
		};
	}

	/**
	 * 
	 * @param {Readonly<Array<(import('./commons.js').ParserBlockItem)>>} body 
	 * @param {*} scope 
	 */
	#evaluateBlock(body, scope) {
		let lastEvaluated;
		let lastStatementName = 'Programa';
		for(let i = 0; i < body.length; i++) {
			const statement = JSON.parse(JSON.stringify(body[i]));
			let statementName = ParserToLanguageType.get((statement.type === ParserStatementNodeTypes.Expression) ? (statement.expression?.type ?? statement.type) : statement.type);
			
			if(statementName == undefined) {
				const fallback = 'expresión posterior a muchas sentencias';
				statementName = lastStatementName.length > 64 || lastStatementName === fallback
					? fallback
					: `expresión posterior a ${lastStatementName}`;
			}

			this.#currentStatement.name = statementName;
			this.#currentStatement.number = statement.number;
			lastStatementName = this.#currentStatement.name;
			scope.updateCurrentStatement(this.#currentStatement);
			lastEvaluated = this.#evaluateStatement(statement, scope);
			if(!lastEvaluated)
				return makeNada();
			if(lastEvaluated.type === ParserNodeTypes.Break || lastEvaluated.type !== 'Nada')
				break;
		}

		return lastEvaluated;
	}

	/**
	 * 
	 * @param {ParserNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimeValue|import('./commons.js').ParserValueStatementNode|import('./commons.js').ParserBreakStatementNode}
	 */
	#evaluateStatement(node, scope) {
		let result = makeNada();
		
		switch(/**@type {import('./commons.js').ParserStatementNodeType}*/(node.type)) {
		case ParserNodeTypes.Registry:
			this.#evaluateRegistry(/**@type {import('./commons.js').ParserRegistryStatementNode}*/(node), scope);
			break;

		case ParserNodeTypes.Declare:
			this.#evaluateDeclaration(/**@type {import('./commons.js').ParserDeclarationStatementNode}*/(node), scope);
			break;

		case ParserNodeTypes.Relational:
			this.#evaluateRelational(/**@type {import('./commons.js').ParserRelationalStatementNode}*/(node), scope);
			break;

		case ParserNodeTypes.Send:
			this.#evaluateSend(/**@type {import('./commons.js').ParserValueStatementNode}*/(node).value, scope);
			break;

		case ParserNodeTypes.Return:
			return this.#evaluate(/**@type {import('./commons.js').ParserValueStatementNode}*/(node).value, scope);

		case ParserNodeTypes.Break:
			return /**@type {import('./commons.js').ParserBreakStatementNode}*/(node);

		case ParserNodeTypes.Stop: {
			const assertedNode = /**@type {import('./commons.js').ParserStopStatementNode}*/(node);
			const test = makeValue(this.#evaluate(assertedNode.test, scope), 'Boolean');

			if(test.value) {
				this.#evaluateSend(assertedNode.stopMessage, scope);
				return;
			}
			
			break;
		}

		case ParserNodeTypes.Block: {
			const blockScope = new TuberScope(scope);
			return this.#evaluateBlock(/**@type {ParserBlockNode}*/(node).body, blockScope);
		}

		case ParserNodeTypes.Conditional: {
			const assertedNode = /**@type {import('types').Flatten<import('./commons.js').ParserConditionalStatementNode>}*/(node);
			const test = makeValue(this.#evaluate(assertedNode.test, scope), 'Boolean');
			const blockScope = new TuberScope(scope);
			if(test.value)
				return this.#evaluateBlock(assertedNode.consequent.body, blockScope);
			if(assertedNode.alternate)
				return this.#evaluateStatement(assertedNode.alternate, scope);
			break;
		}

		case ParserNodeTypes.WhileLoop: {
			const assertedNode = /**@type {import('./commons.js').ParserWhileStatementNode}*/(node);
			while(makeValue(this.#evaluate(assertedNode.test, scope), 'Boolean').value) {
				const blockScope = new TuberScope(scope);
				const lastEvaluated = this.#evaluateBlock(assertedNode.body, blockScope);
				if(lastEvaluated.type === ParserNodeTypes.Break)
					break;
				if(lastEvaluated.type !== 'Nada')
					return lastEvaluated;
			}
			break;
		}

		case ParserNodeTypes.DoWhileLoop: {
			const assertedNode = /**@type {import('./commons.js').ParserWhileStatementNode}*/(node);
			do {
				const blockScope = new TuberScope(scope);
				const lastEvaluated = this.#evaluateBlock(assertedNode.body, blockScope);
				if(lastEvaluated.type === 'BreakStatement')
					break;
				if(lastEvaluated.type !== 'Nada')
					return lastEvaluated;
			} while(makeValue(this.#evaluate(assertedNode.test, scope), 'Boolean').value);
			break;
		}

		case ParserNodeTypes.ForLoop: {
			const assertedNode = /**@type {import('./commons.js').ParserForStatementNode}*/(node);
			const forScope = new TuberScope(scope);
			const { receptor, reception } = assertedNode.assignment;

			if(receptor.type !== ParserNodeTypes.Identifier)
				throw this.#TuberInterpreterError(`Se esperaba una asignación directa a identificador en la primera expresión de sentencia PARA`);

			forScope.assignVariable(receptor.name, this.#evaluate(reception, forScope));

			while(makeValue(this.#evaluate(JSON.parse(JSON.stringify(assertedNode.test)), forScope), 'Boolean').value) {
				const blockScope = new TuberScope(forScope);
				const lastEvaluated = this.#evaluateBlock(assertedNode.body, blockScope);
				if(lastEvaluated.type === ParserNodeTypes.Break)
					break;
				if(lastEvaluated.type !== 'Nada')
					return lastEvaluated;
				this.#evaluateExpression(assertedNode.step, forScope);
			}
			break;
		}

		case ParserNodeTypes.ForInLoop: {
			const assertedNode = /**@type {import('./commons.js').ParserForInStatementNode}*/(node);
			const list = this.#evaluate(assertedNode.list, scope);

			if(list.type !== 'List')
				throw this.#TuberInterpreterError('Se esperaba un identificador de Lista en estructura PARA CADA');
			if(assertedNode.element.type !== ParserNodeTypes.Identifier)
				throw this.#TuberInterpreterError('Se esperaba un identificador de elemento de Lista en estructura PARA CADA');

			for(let element of list.elements) {
				if(element == undefined) continue;
				const blockScope = new TuberScope(scope);
				blockScope.assignVariable(assertedNode.element.name, element);
				
				const lastEvaluated = this.#evaluateBlock(assertedNode.body, blockScope);
				if(lastEvaluated.type === ParserNodeTypes.Break)
					break;
				if(lastEvaluated.type !== 'Nada')
					return lastEvaluated;
			}
			break;
		}

		case ParserNodeTypes.Expression:
			this.#evaluateExpression(/**@type {import('./commons.js').ParserExpressionStatementNode}*/(node), scope);
			break;

		case ParserNodeTypes.Comment:
			break;
			
		default:
			throw TuberInterpreterError(`Nodo no implementado: ${node.type}\nPrueba a usarlo en una versión posterior de PuréScript`, this.#currentStatement);
		}

		this.#processedSentences++;
		if(this.#processedSentences > this.#maxSentences)
			throw TuberInterpreterError('Límite de sentencias procesadas alcanzado. El Tubérculo fue terminado para proteger a Bot de Puré', this.#currentStatement);

		return result;
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserRegistryStatementNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimeValue}
	 */
	#evaluateRegistry(node, scope) {
		let { initialize, as } = node;

		this.#expectNode(initialize, ParserNodeTypes.AssignExpression, 'Se esperaba una asignación en registro');

		let { receptor, reception } = initialize;

		if(as === ParserNodeTypes.CallExpression) {
			const assertedReceptor = /**@type {Readonly<import('./commons.js').ParserCallExpressionNode>}*/(receptor);
			const assertedReception = /**@type {import('./commons.js').ParserBlockNode}*/(reception);
			this.#expectNode(assertedReception, 'BlockStatement', 'Se esperaba una cuerpo de función en registro de función');
			this.#expectNode(assertedReceptor, ParserNodeTypes.CallExpression, 'Se esperaba una maqueta de función en registro de función');
			this.#expectNode(assertedReceptor.emitter, ParserNodeTypes.Identifier, 'Se esperaba un identificador de función en registro de función');
			const functionValue = makeFunction(assertedReception.body, assertedReceptor.arguments);
			//this.#sendStack.push(functionValue);
			return scope.assignVariable(/**@type {import('./commons.js').ParserIdentifierNode}*/(assertedReceptor.emitter).name, functionValue);
		}

		if(receptor.type !== ParserNodeTypes.Identifier)
			throw TuberInterpreterError(`Se esperaba un identificador en registro de ${as}`, this.#currentStatement);

		const receptionValue = this.#evaluate(reception, scope);

		if(as === ParserNodeTypes.Input) {
			if(!this.#testDrive) return;
			this.#inputStack.push({ type: receptionValue.type, name: receptor.name });
		}

		if(as === ParserNodeTypes.List)
			//@ts-expect-error
			this.#listStack.push(receptionValue);
		
		return scope.assignVariable(receptor.name, receptionValue);
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserDeclarationStatementNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimeValue}
	 */
	#evaluateDeclaration(node, scope) {
		let { identifier, as } = node;

		this.#expectNode(identifier, ParserNodeTypes.Identifier, `Se esperaba un identificador`);

		return scope.declareVariable(identifier.name, ParserToRuntimeType.get(as));
	}

	/**
	 * Evalúa una sentencia relacional
	 * @param {import('./commons.js').ParserRelationalStatementNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimeValue}
	 */
	#evaluateRelational(node, scope) {
		const { operator, expression } = node;

		if(expression.type !== ParserNodeTypes.AssignExpression)
			throw TuberInterpreterError('Se esperaba una asignación', this.#currentStatement);
		
		let { receptor, reception } = expression;

		/**@type {RuntimeValue}*/
		let receptionValue;
		if(receptor.type === 'CallExpression') {
			this.#expectNode(reception, 'BlockStatement', 'Se esperaba un cuerpo de Función válido');
			const assertedReceptor = /**@type {import('./commons.js').ParserCallExpressionNode}*/(receptor);
			const assertedReception = /**@type {import('./commons.js').ParserNamedBlockNode}*/(reception);
			receptionValue = makeFunction(assertedReception.body, assertedReceptor.arguments, assertedReception.identifier); //this.#evaluateSimpleIdentifier(assertedReception.identifier)
			receptor = receptor.emitter;
		} else
			receptionValue = this.#evaluate(reception, scope, true);
		
		if(receptor.type === 'ArrowExpression')
			receptor = this.#evaluateArrowExpression(receptor, scope, true);
		else
			this.#expectNode(receptor, ParserNodeTypes.Identifier, `Se esperaba un identificador en asignación. Se obtuvo "${receptor.type}"`);

		switch(operator) {
		case 'extender':
			if(!('container' in receptor)) {
				const receptorValue = this.#evaluate(receptor, scope);
				this.#expectRuntimeValue(receptorValue, 'List', `No se puede extender el identificador "${receptor.type === ParserNodeTypes.Identifier ? receptor.name : receptor.emitter.name}" porque no es una Lista`);
				extendList(receptorValue, receptionValue);
				return receptorValue;
			}
			
			/**@type {RuntimeValue}*/
			let list;
			if(receptor.container.type === ParserNodeTypes.List && receptor.container.elements)
				list = receptor.container.elements[receptor.property.value];
			
			if(receptor.container.type === ParserNodeTypes.Glossary && receptor.container.properties)
				list = receptor.container.properties.get(receptor.property.name);

			this.#expectRuntimeValue(list, RuntimeNodeTypes.List, 'No se puede extender el miembro de estructura porque no es una Lista');
			
			return extendList(list, receptionValue);

		case 'cargar':
			if(!receptor.container) {
				if(receptionValue.identifier && receptor.name !== receptionValue.identifier)
					scope.assignVariable(receptionValue.identifier.name, receptionValue);
				
				return scope.assignVariable(receptor.name, makeValue(receptionValue, ParserToRuntimeType.get(receptionValue.type) ?? receptionValue.type));
			}

			if(receptor.container.elements)
				receptor.container.elements[receptor.property.value] = receptionValue;
			
			if(receptor.container.properties)
				receptor.container.properties.set(receptor.property.name, receptionValue);

			return makeNada();
		case 'guardar':
			throw TuberInterpreterError(`Nodo no implementado: ${node.type}\nPrueba a usarlo en una versión posterior de PuréScript`, this.#currentStatement);
			return makeNada();
		default: {
			const operations = {
				'sumar': (a, b) => +a + b,
				'restar': (a, b) => +a - b,
				'multiplicar': (a, b) => +a * b,
				'dividir': (a, b) => +a / b,
			};

			const receptorVariable = scope.lookup(receptor.name);
			if(receptorVariable.type === RuntimeNodeTypes.Text) {
				if(operator !== 'sumar')
					throw TuberInterpreterError(`Se esperaba sumar a "${receptor.name}"; se intentó ${operator} en cambio`, this.#currentStatement);
				const result = this.#evaluateConcatenationBinaryExpression('+', receptorVariable, receptionValue);
				return scope.assignVariable(receptor.name, result);
			}

			if(receptorVariable.type !== RuntimeNodeTypes.Number)
				throw TuberInterpreterError(`No se puede ${operator} a "${receptor.name}" porque no es un Número`, this.#currentStatement);

			if(receptionValue.type !== RuntimeNodeTypes.Number)
				throw TuberInterpreterError(`No se puede ${operator} a "${receptor.name}" porque "${receptionValue.value}" no es un Número`, this.#currentStatement);

			const result = operations[operator](receptorVariable.value, receptionValue.value);
			if(isNotOperable(result))
				throw TuberInterpreterError(`No se puede ${operator} a "${receptor.name}" porque el Número "${invalidToLanguage(result)}" es inoperable`, this.#currentStatement);

			return scope.assignVariable(receptor.name, makeNumber(result));
		}
		}
	}

	/**
	 * 
	 * @param {ParserNode} value 
	 * @param {TuberScope} scope 
	 */
	#evaluateSend(value, scope) {
		const emission = this.#evaluate(value, scope);

		switch(emission.type) {
		case RuntimeNodeTypes.List:
			//Handlear envío de lista de imágenes luego
		case RuntimeNodeTypes.Glossary:
			//Handlear envío de glosarios de marcos luego
		case RuntimeNodeTypes.Number:
		case RuntimeNodeTypes.Boolean:
		case RuntimeNodeTypes.Text:
		case RuntimeNodeTypes.Embed:
			this.#sendStack.push(emission);
			break;
		case RuntimeNodeTypes.NativeFunction:
			throw this.#TuberInterpreterError('No se puede enviar una función. ¡Asegúrate de ejecutarla y enviar el valor que devuelve!');
		case RuntimeNodeTypes.Function:
			throw this.#TuberInterpreterError('No se puede enviar una función. ¡Asegúrate de ejecutarla y enviar el valor que devuelve!');
		case RuntimeNodeTypes.Nada:
			throw this.#TuberInterpreterError('No se puede enviar nada');
		default:
			throw this.#TuberInterpreterError('Expresión inesperada en envío de mensaje');
		}
	}
	
	/**
	 * Evalúa un nodo al nivel más básico
	 * @param {ParserNode} node 
	 * @param {TuberScope} scope 
	 */
	#evaluate(node, scope, mustBeDeclared = false) {
		if(node == undefined)
			return makeNada();

		let evaluation;
		switch(node.type) {
		case ParserNodeTypes.Numeric:
		case ParserNodeTypes.Text:
		case ParserNodeTypes.Boolean:
			return makeValue(node, ParserToRuntimeType.get(node.as) ?? ParserToRuntimeType.get(node.type));
		
		case ParserNodeTypes.List:
			const newList = this.#createList(node, scope);
			return makeValue(newList, ParserToRuntimeType.get(node.as) ?? RuntimeNodeTypes.List);
		
		case ParserNodeTypes.Glossary:
			const newGlossary = this.#createGlossary(node, scope);
			return makeValue(newGlossary, ParserToRuntimeType.get(node.as) ?? RuntimeNodeTypes.Glossary);
		
		case ParserNodeTypes.Identifier:
			evaluation = this.#evaluateIdentifier(node, scope, mustBeDeclared);
			return makeValue(evaluation, ParserToRuntimeType.get(node.as) ?? evaluation.type);

		case ParserNodeTypes.ArrowExpression:
			evaluation = this.#evaluateArrowExpression(node, scope);
			return makeValue(evaluation, ParserToRuntimeType.get(node.as) ?? evaluation.type);

		case ParserNodeTypes.UnaryExpression:
			evaluation = this.#evaluateUnaryExpression(node, scope);
			return makeValue(evaluation, ParserToRuntimeType.get(node.as) ?? evaluation.type);

		case ParserNodeTypes.BinaryExpression:
			evaluation = this.#evaluateBinaryExpression(node, scope);
			return makeValue(evaluation, ParserToRuntimeType.get(node.as) ?? evaluation.type);
		
		case ParserNodeTypes.LogicalExpression:
			evaluation = this.#evaluateLogicalExpression(node, scope);
			return makeValue(evaluation, ParserToRuntimeType.get(node.as) ?? evaluation.type);
			
		case ParserNodeTypes.CallExpression:
			evaluation = this.#evaluateCallExpression(node, scope);
			return makeValue(evaluation, ParserToRuntimeType.get(node.as) ?? evaluation.type);

		case ParserNodeTypes.TextTemplate:
			return this.#createTextFromTemplate(node, scope);
			
		case ParserNodeTypes.Nada:
			return makeValue(makeNada(), ParserToRuntimeType.get(node.as) ?? RuntimeNodeTypes.Nada);
		}

		throw this.#TuberInterpreterError(`Nodo no implementado: ${node.type}`);
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserIdentifierNode} identifier 
	 * @param {TuberScope} scope 
	 * @param {Boolean} [mustBeDeclared=false] 
	 * @returns {RuntimeValue}
	 */
	#evaluateIdentifier(identifier, scope, mustBeDeclared = false) {
		/**@type {RuntimeValue}*/
		const variable = scope.lookup(identifier.name, mustBeDeclared);

		return variable;
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserExpressionNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimeValue}
	 */
	#evaluateExpression(node, scope) {
		if(!('expression' in node))
			throw this.#TuberInterpreterError('Se esperaba una expresión válida');

		switch(node.expression.type) {
		case ParserNodeTypes.UpdateExpression: {
			const { operator, argument } = node.expression;
			
			if(argument.type !== 'IdentifierExpression')
				throw TuberInterpreterError(`Se esperaba un identificador al ${operator}`, this.#currentStatement);

			const variable = scope.lookup(argument.name);
			
			if(variable.type !== 'Number')
				throw TuberInterpreterError(`No se puede ${operator === 'sumar' ? 'incrementar' : 'decrementar'} a "${argument.name}" porque no es un Número`, this.#currentStatement);

			const outcomes = {
				'sumar': variable.value + 1,
				'restar': variable.value - 1,
			};
			
			return scope.assignVariable(argument.name, makeNumber(outcomes[operator]));
		}
		case ParserNodeTypes.CallExpression:
			return this.#evaluateCallExpression(node.expression, scope);
		default: 
			throw this.#TuberInterpreterError('Se esperaba una expresión válida');
		}
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserArrowExpressionNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimeValue}
	 */
	#evaluateArrowExpression(node, scope, asIdentifier = false) {
		const containerName = node.container.name ?? node.container.value;
		const propertyName = node.property.name ?? node.property.value;

		//@ts-expect-error
		node.container = this.#evaluate(node.container, scope);

		return this.#evaluateMembers(node.container, node.property, scope, { asIdentifier, containerName, propertyName });
	}

	/**
	 * @typedef {Object} EvaluateMembersOptions
	 * @property {Boolean} [asIdentifier=false]
	 * @property {String} [containerName=undefined]
	 * @property {String} [propertyName=undefined]
	 * 
	 * @param {ParserNode | RuntimeValue} container 
	 * @param {ParserNode} property 
	 * @param {TuberScope} scope 
	 * @param {EvaluateMembersOptions} options 
	 */
	#evaluateMembers(container, property, scope, options) {
		options ??= {};
		options.asIdentifier ??= false;
		options.propertyName ??= 'Desconocido';

		if(!container || container.type === RuntimeNodeTypes.Nada) {
			if(options.containerName)
				throw this.#TuberInterpreterError(`No se puede acceder a los miembros de "${options.containerName}" porque es de tipo Nada o la expresión está mal formulada. Se intentó acceder el miembro: "${options.propertyName}"`);
		}

		if(container.type === 'Number') {
			if(property.type !== 'IdentifierExpression')
				throw this.#TuberInterpreterError(`Se esperaba un método de Número para "${options.containerName ?? 'Desconocido'}", pero se recibió: ${property.name ?? property.value ?? 'Nada'}`);
			
			return scope.lookup('Número').properties.get(property.name);
		}

		if(container.type === 'Text') {
			if(property.type !== 'IdentifierExpression')
				throw this.#TuberInterpreterError(`Se esperaba un método de Texto para "${options.containerName ?? 'Desconocido'}", pero se recibió: ${property.name ?? property.value ?? 'Nada'}`);
				
			if(property.name === 'largo')
				return makeNumber(container.value.length);

			return scope.lookup('Texto', false).properties.get(property.name);
		}

		if(container.type === 'Boolean') {
			if(property.type !== 'IdentifierExpression')
				throw this.#TuberInterpreterError(`Se esperaba un método de Dupla para "${options.containerName ?? 'Desconocido'}", pero se recibió: ${property.name ?? property.value ?? 'Nada'}`);
			
			const listMethod = scope.lookup('Dupla', false).properties.get(property.name);
			if(listMethod)
				return listMethod;
		}

		if(container.type === 'List') {
			if(property.type === 'IdentifierExpression') {
				if(property.name === 'largo')
					return makeNumber(container.elements.length);
				
				const listMethod = scope.lookup('Lista').properties.get(property.name);
				if(listMethod)
					return listMethod;
			}

			const evaluatedProperty = this.#evaluate(property, scope);

			if(evaluatedProperty.type !== 'Number')
				throw this.#TuberInterpreterError(`Se esperaba un índice (Número) para "${options.containerName ?? 'Desconocido'}", pero se recibió: ${evaluatedProperty.type}`);

			if(options.asIdentifier)
				return { container, evaluatedProperty };
			
			const calculatedIndex = evaluatedProperty.value >= 0 ? evaluatedProperty.value : container.elements.length - evaluatedProperty.value;
			return container.elements[calculatedIndex] ?? makeNada();
		}

		if(container.type === 'Glossary') {
			if(property.type !== 'IdentifierExpression')
				throw this.#TuberInterpreterError(`Se esperaba un miembro o método de Glosario para "${options.containerName ?? 'Desconocido'}", pero se recibió: ${property.type}`);

			if(options.asIdentifier)
				return { container, property };

			if(property.name === 'tamaño')
				return makeNumber(container.properties.size);

			const member = container.properties.get(property.name);
			if(member)
				return member;

			const glossaryMethod = scope.lookup('Glosario').properties.get(property.name);
			if(glossaryMethod)
				return glossaryMethod;

			return makeNada();
		}

		if(container.type === 'Embed') {
			const embedMethod = scope.lookup('Marco').properties.get(property.name);
			if(embedMethod)
				return embedMethod;
		}
			
		throw this.#TuberInterpreterError(`No se puede acceder a miembros de "${options.containerName}" porque su tipo no es de un candidato válido para expresiones de flecha`);
	}

	/**
	 * 
	 * @param {ParserNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimeValue}
	 */
	#evaluateUnaryExpression(node, scope) {
		let { operator, argument } = node;
		argument = this.#evaluate(argument, scope);

		switch(operator) {
		case 'no':
			return makeBoolean(!argument.value);
		case '-':
			return makeNumber(-argument.value);
		case '+':
			return makeNumber(+argument.value);
		}

		throw this.#TuberInterpreterError('Operador unario inválido');
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserBinaryExpressionNode} node
	 * @param {TuberScope} scope
	 * @returns {RuntimeValue}
	 */
	#evaluateBinaryExpression(node, scope) {
		let { operator, leftOperand, rightOperand } = node;
		const leftValue = this.#evaluate(leftOperand, scope);
		const rightValue = this.#evaluate(rightOperand, scope);

		if([ leftValue.type, rightValue.type ].includes('Text')) {
			if(operator !== '+')
				throw this.#TuberInterpreterError(`Se esperaba el operador "+" en expresión de concatenación de Textos`);

			return this.#evaluateConcatenationBinaryExpression(operator, leftValue, rightValue);
		}

		return this.#evaluateNumericBinaryExpression(operator, leftValue, rightValue);
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserLogicalExpressionNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimeValue}
	 */
	#evaluateLogicalExpression(node, scope) {
		let { leftOperand, rightOperand, operator } = node;
		const leftEvaluated = this.#evaluate(leftOperand, scope);
		const rightEvaluated = this.#evaluate(rightOperand, scope);

		if(!logicOperations.has(operator))
			throw this.#TuberInterpreterError(`Operador lógico inválido: ${operator}`);
		
		const leftValue =  extractFromRuntimeValue(leftEvaluated);
		const rightValue = extractFromRuntimeValue(rightEvaluated);
		
		let result = logicOperations.get(operator)(leftValue, rightValue);

		if(typeof result === 'boolean')
			return makeBoolean(result);

		if(result === leftValue)
			return leftEvaluated;
		
		return rightEvaluated;
	}

	/**
	 * @param {import('./commons.js').ConcatenationOperator} operator
	 * @param {RuntimeValue} leftOperand
	 * @param {RuntimeValue} rightOperand
	 */
	#evaluateConcatenationBinaryExpression(operator, leftOperand, rightOperand) {
		leftOperand = makeValue(leftOperand, RuntimeNodeTypes.Text);
		rightOperand = makeValue(rightOperand, RuntimeNodeTypes.Text);

		const result = leftOperand.value + rightOperand.value;

		if(typeof result !== 'string')
			throw this.#TuberInterpreterError(`Concatenación inválida: ${leftOperand.value ?? 'Nada'} ${operator ?? '?'} ${rightOperand.value ?? 'Nada'}`);

		return makeText(result);
	}

	/**
	 * 
	 * @param {import('./commons.js').ArithmeticOperator} operator 
	 * @param {RuntimeValue} leftOperand
	 * @param {RuntimeValue} rightOperand
	 */
	#evaluateNumericBinaryExpression(operator, leftOperand, rightOperand) {
		leftOperand = makeValue(leftOperand, 'Number');
		rightOperand = makeValue(rightOperand, 'Number');

		if(isNotOperable(leftOperand.value) || isNotOperable(rightOperand.value))
			throw this.#TuberInterpreterError(`El operando ${leftOperand.value ?? 'Nada'} no puede ser operado con el operando ${rightOperand.value ?? 'Nada'}`);

		/**@type {{[key in import('./commons.js').ArithmeticOperator]: () => number}}*/
		const operations = {
			'+': () => leftOperand.value + rightOperand.value,
			'-': () => leftOperand.value - rightOperand.value,
			'*': () => leftOperand.value * rightOperand.value,
			'/': () => leftOperand.value / rightOperand.value,
			'%': () => leftOperand.value % rightOperand.value,
			'^': () => leftOperand.value ** rightOperand.value,
		};

		if(typeof operations[operator] !== 'function')
			throw this.#TuberInterpreterError('Operador inválido');

		const result = operations[operator]();

		if(isNotOperable(result))
			throw this.#TuberInterpreterError(`Operación inválida: ${leftOperand.value} ${operator} ${rightOperand.value}`);

		return makeNumber(result);
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserCallExpressionNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimeValue}
	 */
	#evaluateCallExpression(node, scope) {
		let { emitter, arguments: args } = node;

		const fn = this.#evaluate(emitter, scope);

		if(fn.type !== 'NativeFunction' && fn.type !== 'Function')
			throw TuberInterpreterError('Se esperaba un identificador de Función', this.#currentStatement);

		args = args.map(arg => this.#evaluate(arg, scope));
		
		const functionScope = new TuberScope(scope);
		let result;
		if(fn.type === 'NativeFunction') {
			if(emitter.container) {
				if(emitter.container.type === 'ListExpression')
					emitter.container = this.#createList(emitter.container, scope);
				if(emitter.container.type === 'GlossaryExpression')
					emitter.container = this.#createGlossary(emitter.container, scope);
				if(emitter.property.type === 'ArrowExpression')
					emitter = this.#evaluateArrowExpression(emitter, scope, true);
				result = fn.call(emitter.container, args, this.#currentStatement, functionScope, this.#request);
			} else
				result = fn.call(args, this.#currentStatement, functionScope, this.#request);
		} else {
			for(let i = 0; i < Math.max(fn.arguments.length, args.length); i++) {
				if(fn.arguments[i] == undefined) continue;
				if(args[i] == undefined) {
					functionScope.declareVariable(fn.arguments[i].name, RuntimeNodeTypes.Nada);
					if(fn.arguments[i].default)
						functionScope.assignVariable(fn.arguments[i].name, this.#evaluate(fn.arguments[i].default, functionScope));
					continue;
				}
				
				if(![ 'List', 'Glossary', 'Embed', 'Function', 'NativeFunction' ].includes(args[i].type)) {
					functionScope.declareVariable(fn.arguments[i].name, RuntimeNodeTypes.Nada);
					functionScope.assignVariable(fn.arguments[i].name, args[i]);
				} else {
					functionScope.declareMirror(fn.arguments[i].name, node.arguments[i]);
				}
			}
			result = this.#evaluateBlock(fn.body, functionScope);
		}

		if(result.type === 'Number' && isNotOperable(result?.value))
			return makeNada();
		
		if(result.type === 'BreakStatement')
			return makeNada();
		
		return result;
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserListExpressionNode} node 
	 * @param {TuberScope} scope 
	 * @returns {ListValue}
	 */
	#createList(node, scope) {
		let { elements } = node;
		const value = elements.map(element => this.#evaluate(element, scope));
		return { ...node, ...makeList(value) };
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserGlossaryExpressionNode} node 
	 * @param {TuberScope} scope 
	 * @returns {GlossaryValue}
	 */
	#createGlossary(node, scope) {
		const glossary = makeGlossary(new Map());
		const { properties } = node;
		
		properties.forEach(property => {
			const { key, value } = this.#evaluateProperty(property, scope);

			glossary.properties.set(key.name, value);
		});

		return { ...node, ...glossary };
	}

    /**
     * 
     * @param {import('./commons.js').ParserIdentifierNode} node 
     * @returns {import('./commons.js').IdentifierValue}
     */
    #evaluateSimpleIdentifier(node) {
        const result = {
            type: RuntimeNodeTypes.Identifier,
            name: node.name,
        };

        if(node.as)
            result.as = node.as;

        return result;
    }

	/**
	 * 
	 * @param {import('./commons.js').ParserPropertyExpressionNode} node 
	 * @param {TuberScope} scope 
	 * @returns {RuntimePropertyNode}
	 */
	#evaluateProperty(node, scope) {
		let { key, value } = node;

		if(node.type !== ParserNodeTypes.Property)
			throw TuberInterpreterError('Se esperaba una propiedad válida en expresión de Glosario', this.#currentStatement);
		
		let keyNode;
		
		if(key.type === ParserNodeTypes.Identifier)
			keyNode = key;
		else
			keyNode = /**@type {import('./commons.js').ParserIdentifierNode}*/({
				type: ParserNodeTypes.Identifier,
				name: key.value.toString(),
			});

		const evaluatedValue = this.#evaluate(value, scope);

		return {
			type: RuntimeNodeTypes.Property,
			key: keyNode,
			value: evaluatedValue
		};
	}

	/**
	 * 
	 * @param {import('./commons.js').ParserTextTemplateExpressionNode} node 
	 * @param {TuberScope} scope 
	 * @returns {TextValue}
	 */
	#createTextFromTemplate(node, scope) {
		if(node.type !== ParserNodeTypes.TextTemplate)
			throw TuberInterpreterError('Se esperaba una plantilla de Texto', this.#currentStatement)

		let result = '';

		node.expressions.forEach(expression => {
			result += makeValue(this.#evaluate(expression, scope), RuntimeNodeTypes.Text).value;
		});

		return makeText(result);
	}
};

module.exports = {
	TuberInterpreterError,
	TuberInterpreter,
};