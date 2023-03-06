const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { randRange, fetchUserID, shortenText } = require('../../func.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu, MessageAttachment, ThreadChannel } = require('discord.js');
const { NodeTypes, TokenToLanguage, NodeToLanguage } = require('./psparser.js');
const { TuberScope } = require('./psscope.js');
const {
    TuberInterpreterError,
    NodeType,
    TuberNode,
    ProgramType,
    TuberIdentifierNode,
    TuberBinaryNode,
    TuberStatementNode,
    TuberBlockNode,
    TuberProgramNode,
    TuberRuntimeNode,
    RuntimeValue,
    NumericValue,
    TextValue,
    BooleanValue,
    ListValue,
    GlossaryValue,
    PropertyValue,
    NadaValue,
    NativeFunctionValue,
    makeNumber,
    makeText,
    makeBoolean,
    makeList,
    makeGlossary,
    makeNada,
    makeNativeFunction,
    makeFunction,
    isNada,
    isNotOperable,
    makeValue,
    NodeToProgram,
    extendList,
    ProgramToLanguage,
} = require('./commons.js');

function invalidToLanguage(value) {
    if(value == undefined) return 'Indefinido';
    if(isNaN(value)) return 'Innumerable';
    if(!isFinite(value)) return 'Infinito';
    return 'Desconocido';
}

/**@class Interpreta un programa PuréScript*/
class TuberInterpreter {
    /**@type {{ number: Number, name: String }}*/
    #currentStatement = { number: 0, name: 'PROGRAMA' };
    /**@type {Number}*/
    #processedSentences = 0;
    /**@type {Number}*/
    #maxSentences = 600;
    /**@type {Array<{ type: ProgramType, name: String }>}*/
    #inputStack = [];
    /**@type {Array<ListValue>}*/
    #listStack = [];
    /**@type {Array<RuntimeValue>}*/
    #sendStack = [];
    /**@type {import('../../commands/Commons/typings.js').CommandRequest}*/
    #request;
    /**@type {Boolean}*/
    #testDrive;

    /**
     * Tira un error si `node` no es del tipo especificado
     * @param {RuntimeValue} node 
     * @param {NodeType} type 
     * @param {String} errorMessage 
     * @returns {void}
     */
    #expectNode(node, type, errorMessage) {
        if(node?.type !== type)
            throw TuberInterpreterError(errorMessage, this.#currentStatement);
    }

    /**
     * Tira un error si `value` no es del tipo especificado
     * @param {RuntimeValue} value 
     * @param {NodeType} type 
     * @param {String} errorMessage 
     * @returns {void}
     */
    #expectRuntimeValue(value, type, errorMessage) {
        if(value?.type !== type)
            throw TuberInterpreterError(errorMessage, this.#currentStatement);
    }

    /**
     * 
     * @param {TuberProgramNode} node 
     * @param {TuberScope} scope
     */
    evaluateProgram(node, scope, request, isTestDrive) {
        if(node.type !== 'Program')
            throw TuberInterpreterError('Programa inválido', this.#currentStatement);

        const programScope = new TuberScope(scope);

        this.#request = request;
        this.#testDrive = isTestDrive;
        this.#evaluateBlock(node, programScope);

        console.log('Variables finales:');
        console.dir(programScope.variables, { depth: null });

        console.log('Entradas registradas:');
        console.dir(this.#inputStack);

        return {
            inputStack: this.#inputStack,
            sendStack: this.#sendStack,
        };
    }

    /**
     * 
     * @param {TuberProgramNode | TuberBlockNode} node 
     * @param {*} scope 
     */
    #evaluateBlock(node, scope) {
        let lastEvaluated;
        let lastStatementName = 'Programa';
        for(let i = 0; i < node.body.length; i++) {
            const statement = JSON.parse(JSON.stringify(node.body[i]));
            let statementName = statement.operator ?? NodeToLanguage.get(statement.type);
            statementName ??= statement.expression?.type === 'CallExpression' ? 'EJECUTAR' : undefined;
            if(statementName == undefined) {
                const fallback = 'expresión posterior a muchas sentencias';
                statementName = lastStatementName.length > 64 || lastStatementName === fallback
                    ? fallback
                    : `expresión posterior a ${lastStatementName}`;
            }

            this.#currentStatement.name = statementName;
            this.#currentStatement.number = statement.number;
            lastStatementName = this.#currentStatement.name;
            // console.log('ESTOY EN', '[', this.#currentStatement.number, this.#currentStatement.name, ']');
            scope.updateCurrentStatement(this.#currentStatement);
            lastEvaluated = this.#evaluateStatement(statement, scope);
            if(!lastEvaluated)
                return makeNada();
            if(lastEvaluated.type === 'BreakStatement' || lastEvaluated.type !== 'Nada')
                break;
        }

        return lastEvaluated;
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateStatement(node, scope) {
        let result = makeNada();

        // console.log('----------------------------------------------------------------------------------------');
        // console.log(this.#currentStatement);
        // console.dir(node, { depth: null });
        // console.log('----------------------------------------------------------------------------------------');
        
        switch(node.type) {
        case 'RegistryStatement':
            this.#evaluateRegistry(node, scope);
            break;
        case 'DeclareStatement':
            this.#evaluateDeclaration(node, scope);
            break;
        case 'RelationalStatement':
            this.#evaluateRelational(node, scope);
            break;
        case 'SendStatement':
            this.#evaluateSend(node, scope);
            break;
        case 'ReturnStatement':
            return this.#evaluate(node.value, scope);
        case 'BreakStatement':
            return node;
        case 'BlockStatement': {
            const blockScope = new TuberScope(scope);
            return this.#evaluateBlock(node, blockScope);
        }
        case 'ConditionalStatement': {
            const test = makeValue(this.#evaluate(node.test, scope), 'Boolean');
            const blockScope = new TuberScope(scope);
            if(test.value)
                return this.#evaluateBlock(node.consequent, blockScope);
            else if(node.alternate)
                return this.#evaluateStatement(node.alternate, scope);
            break;
        }
        case 'WhileLoopStatement': {
            while(makeValue(this.#evaluate(node.test, scope), 'Boolean').value) {
                const blockScope = new TuberScope(scope);
                const lastEvaluated = this.#evaluateBlock(node, blockScope);
                if(lastEvaluated.type === 'BreakStatement')
                    break;
                if(lastEvaluated.type !== 'Nada')
                    return lastEvaluated;
            }
            break;
        }
        case 'DoWhileLoopStatement': {
            do {
                const blockScope = new TuberScope(scope);
                const lastEvaluated = this.#evaluateBlock(node, blockScope);
                if(lastEvaluated.type === 'BreakStatement')
                    break;
                if(lastEvaluated.type !== 'Nada')
                    return lastEvaluated;
            } while(makeValue(this.#evaluate(node.test, scope), 'Boolean').value)
            break;
        }
        case 'ForLoopStatement': {
            const forScope = new TuberScope(scope);
            const { receptor, reception } = node.assignment;
            forScope.assignVariable(receptor.name, this.#evaluate(reception, forScope));

            while(makeValue(this.#evaluate(node.test, forScope), 'Boolean').value) {
                const blockScope = new TuberScope(forScope);
                const lastEvaluated = this.#evaluateBlock(node, blockScope);
                if(lastEvaluated.type === 'BreakStatement')
                    break;
                if(lastEvaluated.type !== 'Nada')
                    return lastEvaluated;
                this.#evaluateExpression(node.step, forScope);
            }
            break;
        }
        case 'ForInLoopStatement': {
            const list = this.#evaluate(node.list, scope);
            // console.log('La lista en cuestión:', list);
            if(list.type !== 'List')
                throw TuberInterpreterError('Se esperaba un identificador de Lista en estructura PARA CADA');
            if(node.element.type !== 'Identifier')
                throw TuberInterpreterError('Se esperaba un identificador de elemento de Lista en estructura PARA CADA');

            for(let element of list.elements) {
                if(element == undefined) continue;
                const blockScope = new TuberScope(scope);
                blockScope.assignVariable(node.element.name, element);
                // console.log('node.element.name:', node.element.name, 'element:', element);
                const lastEvaluated = this.#evaluateBlock(node, blockScope);
                if(lastEvaluated.type === 'BreakStatement')
                    break;
                if(lastEvaluated.type !== 'Nada')
                    return lastEvaluated;
            }
            break;
        }
        case 'ExpressionStatement':
            this.#evaluateExpression(node, scope);
            break;
        case 'CommentStatement':
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
     * @param {TuberStatementNode} node 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateRegistry(node, scope) {
        let { initialize, as } = node;

        this.#expectNode(initialize, 'AssignExpression', 'Se esperaba una asignación en registro');

        let { receptor, reception } = initialize;

        // console.log(node);

        if(as === 'funcion') {
            this.#expectNode(reception, 'BlockStatement', `Se esperaba una cuerpo de función en registro de función`);
            reception = makeFunction(reception.body, receptor.arguments);
            this.#expectNode(receptor, 'CallExpression', `Se esperaba una maqueta de función en registro de función`);
            this.#expectNode(receptor.emitter, 'Identifier', `Se esperaba un identificador de función en registro de función`);
        } else {
            reception = this.#evaluate(reception);
            this.#expectNode(receptor, 'Identifier', `Se esperaba un identificador en registro de ${as}`);
        }
        // console.log('registry.receptor: ', receptor);
        // console.log('registry.reception:', reception);

        switch(as) {
        case 'entrada':
            // console.log(this.#testDrive);
            if(!this.#testDrive) return;
            this.#inputStack.push({ type: reception.type, name: receptor.name });
            // console.log(this.#inputStack);
            return scope.assignVariable(receptor.name, reception);
        case 'lista':
            this.#listStack.push(reception);
            return scope.assignVariable(receptor.name, reception);
        case 'funcion':
            // this.#sendStack.push(reception);
            return scope.assignVariable(receptor.emitter.name, reception);
        }
    }

    /**
     * 
     * @param {TuberStatementNode} node 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateDeclaration(node, scope) {
        let { identifier, as } = node;

        this.#expectRuntimeValue(identifier, 'Identifier', `Se esperaba un identificador`);

        return scope.declareVariable(identifier.name, NodeToProgram.get(as));
    }

    /**
     * Evalúa una sentencia relacional
     * @param {TuberStatementNode} node 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateRelational(node, scope) {
        const { operator, expression } = node;

        if(expression.type !== NodeTypes.ASSIGN)
            throw TuberInterpreterError('Se esperaba una asignación', this.#currentStatement);
        
        let { receptor, reception } = expression;

        if(receptor.type === 'CallExpression') {
            this.#expectNode(reception, 'BlockStatement', 'Se esperaba un cuerpo de Función válido');
            reception = makeFunction(reception.body, receptor.arguments, reception.identifier);
        } else
            reception = this.#evaluate(reception, scope, true);
        
        if(receptor.type === 'CallExpression')
            receptor = receptor.emitter;

        if(receptor.type === 'ArrowExpression')
            receptor = this.#evaluateArrowExpression(receptor, scope, true);
        else
            this.#expectRuntimeValue(receptor, 'Identifier', `Se esperaba un identificador en asignación. Se obtuvo "${receptor.type}"`);
        // console.log('Receptor:', receptor);
        // console.log('Reception:', reception);

        switch(operator) {
        case 'extender':
            if(!receptor.container) {
                receptor = this.#evaluate(receptor, scope);
                this.#expectRuntimeValue(receptor, 'List', `No se puede extender el identificador "${receptor.name}" porque no es una Lista`);
                return extendList(receptor, reception);
            }
            
            let list;
            if(receptor.container.elements)
                list = receptor.container.elements[receptor.property.value];
            
            if(receptor.container.properties)
                list = receptor.container.properties.get(receptor.property.name, reception);

            this.#expectRuntimeValue(list, 'List', 'No se puede extender el miembro de estructura porque no es una Lista');
            
            return extendList(list, reception);
        case 'cargar':
            if(!receptor.container) {
                if(reception.identifier && receptor.name !== reception.identifier)
                    scope.assignVariable(reception.identifier.name, reception);
                return scope.assignVariable(receptor.name, reception);
            }

            if(receptor.container.elements)
                receptor.container.elements[receptor.property.value] = reception;
            
            if(receptor.container.properties)
                receptor.container.properties.set(receptor.property.name, reception);

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
            if(receptorVariable.type === 'Text') {
                if(operator !== 'sumar')
                    throw TuberInterpreterError(`Se esperaba sumar a "${receptor.name}"; se intentó ${operator} en cambio`, this.#currentStatement);
                const result = this.#evaluateConcatenationBinaryExpression('+', receptorVariable, reception);
                return scope.assignVariable(receptor.name, result);
            }

            if(receptorVariable.type !== 'Number')
                throw TuberInterpreterError(`No se puede ${operator} a "${receptor.name}" porque no es un Número`, this.#currentStatement);

            if(reception.type !== 'Number')
                throw TuberInterpreterError(`No se puede ${operator} a "${receptor.name}" porque "${reception.value}" no es un Número`, this.#currentStatement);

            const result = operations[operator](receptorVariable.value, reception.value);
            if(isNotOperable(result))
                throw TuberInterpreterError(`No se puede ${operator} a "${receptor.name}" porque el Número "${invalidToLanguage(result)}" es inoperable`, this.#currentStatement);

            return scope.assignVariable(receptor.name, makeNumber(result));
        }
        }
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     */
    #evaluateSend(node, scope) {
        const emission = this.#evaluate(node.value, scope);
        switch(emission.type) {
        case 'List':
            //Handlear envío de lista de imágenes luego
        case 'Glossary':
            //Handlear envío de glosarios de marcos luego
        case 'Number':
        case 'Boolean':
        case 'Text':
        case 'Embed':
            // console.log('=========================================================================envío')
            this.#sendStack.push(emission);
            break;
        case 'Identifier':
            throw TuberInterpreterError('Bueno... no me esperaba que de hecho ocurra un caso en el que un Identificador llegue acá', this.#currentStatement);
        case 'NativeFunction':
            throw TuberInterpreterError('No se puede enviar una función. ¡Asegúrate de ejecutarla y enviar el valor que devuelve!', this.#currentStatement);
        case 'Nada':
            throw TuberInterpreterError('No se puede enviar nada', this.#currentStatement);
        }
    }
    
    /**
     * Evalúa un nodo al nivel más básico
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     */
    #evaluate(node, scope, mustBeDeclared = false) {
        // console.log('En evaluate:', node);

        if(node == undefined)
            return makeNada();

        switch(node.type) {
        case 'NumericLiteral':
        case 'TextLiteral':
        case 'BooleanLiteral':
            return makeValue(node, NodeToProgram.get(node.as) ?? NodeToProgram.get(node.type));
        case 'ListExpression': {
            node = this.#createList(node, scope);
            return makeValue(node, NodeToProgram.get(node.as) ?? 'List');
        }
        case 'GlossaryExpression':
            node = this.#createGlossary(node, scope);
            return makeValue(node, NodeToProgram.get(node.as) ?? 'Glossary');
        case 'Identifier': {
            const variable = this.#evaluateIdentifier(node, scope, mustBeDeclared);
            return makeValue(variable, NodeToProgram.get(node.as) ?? variable.type);
        }
        case 'ArrowExpression': {
            // console.log('Antes de los eventos')
            console.dir(node, { depth: null });
            const evaluation = this.#evaluateArrowExpression(node, scope);
            // console.log('Evaluación de ArrowExpression:', evaluation);
            return makeValue(evaluation, NodeToProgram.get(node.as) ?? evaluation.type);
        }
        case 'UnaryExpression': {
            const result = this.#evaluateUnaryExpression(node, scope);
            return makeValue(result, NodeToProgram.get(node.as) ?? result.type);
        }
        case 'BinaryExpression': {
            const result = this.#evaluateBinaryExpression(node, scope);
            return makeValue(result, NodeToProgram.get(node.as) ?? result.type);
        }
        case 'LogicalExpression': {
            const evaluation = this.#evaluateLogicalExpression(node, scope);
            // console.log('Evaluación en LogicalExpression:', evaluation);
            return makeValue(evaluation, NodeToProgram.get(node.as) ?? evaluation.type);
        }
        case 'CallExpression': {
            const evaluation = this.#evaluateCallExpression(node, scope);
            // console.log('Evaluación en CallExpression:', evaluation);
            return makeValue(evaluation, NodeToProgram.get(node.as) ?? evaluation.type);
        }
        case 'TextTemplateExpression':
            return this.#createTextFromTemplate(node, scope);
        case 'NadaLiteral':
            return makeValue(makeNada(), NodeToProgram.get(node.as) ?? 'Nada');
        }

        throw TuberInterpreterError(`Nodo no implementado: ${node.type}`, this.#currentStatement);
    }

    /**
     * 
     * @param {*} identifier 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateIdentifier(identifier, scope, mustBeDeclared = false) {
        /**@type {RuntimeValue}*/
        const variable = scope.lookup(identifier.name, mustBeDeclared);
        // console.log('evaluateIdentifier:', identifier, variable, scope);

        return variable;
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateExpression(node, scope) {
        switch(node.expression.type) {
        case NodeTypes.UPDATE: {
            const { operator, argument } = node.expression;
            
            if(argument.type !== 'Identifier')
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
        case NodeTypes.FUNCTION_CALL:
            return this.#evaluateCallExpression(node.expression, scope);
        default: 
            throw TuberInterpreterError('Se esperaba una expresión válida', this.#currentStatement);
        }
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateArrowExpression(node, scope, asIdentifier = false) {
        // console.log('En evaluateArrowExpression', node.container);
        if([
            'Identifier',
            'NumericLiteral',
            'TextLiteral',
            'BooleanLiteral',
            'ListExpression',
            'GlossaryExpression',
            'CallExpression',
            'ArrowExpression',
            'BinaryExpression',
        ].includes(node.container.type))
            node.container = this.#evaluate(node.container, scope);

        // console.log('ostiaaaaaa', node.container);

        return this.#evaluateMembers(node.container, node.property, scope, asIdentifier);
    }

    /**
     * 
     * @param {TuberNode | RuntimeValue} container 
     * @param {TuberNode} property 
     */
    #evaluateMembers(container, property, scope, asIdentifier = false) {
        if(!container || container.type === 'Nada')
            throw TuberInterpreterError('Contenedor inexistente en expresión de flecha', this.#currentStatement);

        // console.log('Dios soy yo de nuevo', container, property);

        if(container.type === 'Number') {
            if(property.type === 'Identifier') {
                const listMethod = scope.lookup('Número').properties.get(property.name);
                if(listMethod)
                    return listMethod;
            }

            throw TuberInterpreterError(`Se esperaba un método de Número; se recibió: ${property.name ?? property.value ?? 'Nada'}`, this.#currentStatement);
        }

        if(container.type === 'Text') {
            if(property.type === 'Identifier') {
                if(property.name === 'largo')
                    return makeNumber(container.value.length);

                const listMethod = scope.lookup('Texto', false)?.properties?.get(property.name);
                if(listMethod)
                    return listMethod;
            }

            throw TuberInterpreterError(`Se esperaba un método de Texto; se recibió: ${property.name ?? property.value ?? 'Nada'}`, this.#currentStatement);
        }

        if(container.type === 'Boolean') {
            if(property.type === 'Identifier') {
                const listMethod = scope.lookup('Dupla', false)?.properties?.get(property.name);
                if(listMethod)
                    return listMethod;
            }

            throw TuberInterpreterError(`Se esperaba un método de Dupla; se recibió: ${property.name ?? property.value ?? 'Nada'}`, this.#currentStatement);
        }

        if(container.type === 'List') {
            if(property.type === 'Identifier') {
                if(asIdentifier)
                    return { container, property: this.#evaluate(property, scope) };
                if(property.name === 'largo')
                    return makeNumber(container.elements.length);
                const listMethod = scope.lookup('Lista').properties.get(property.name);
                if(listMethod)
                    return listMethod;
            }

            if(property.type === 'ArrowExpression') {
                const memberName = property.container.name;
                const member = scope.lookup(memberName);
                return this.#evaluateMembers(container.elements[member.value], property.property, scope, asIdentifier);
            }

            property = this.#evaluate(property, scope);

            if(property.type === 'Number') {
                if(asIdentifier)
                    return { container, property };
                
                const calculatedIndex = property.value >= 0 ? property.value : container.elements.length - property.value;
                return container.elements[calculatedIndex] ?? makeNada();
            }

            throw TuberInterpreterError(`Se esperaba un índice (Número); se recibió: ${property.type}`, this.#currentStatement);
        }

        if(container.type === 'Glossary') {
            if(property.type === 'Identifier') {
                if(asIdentifier)
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

            if(property.type === 'ArrowExpression')
                return this.#evaluateMembers(container.properties.get(property.container.name), property.property, scope, asIdentifier);
            
            throw TuberInterpreterError(`Se esperaba un miembro o método de Glosario; se recibió: ${property.type}`, this.#currentStatement);
        }

        const nodeName = container
            ? ProgramToLanguage.get(container.type) ?? NodeToLanguage.get(container.type) ?? container.type
            : 'Nada';
        throw TuberInterpreterError(`No se puede acceder a miembros de variables de tipo ${nodeName}`, this.#currentStatement);
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateUnaryExpression(node, scope) {
        let { operator, argument } = node;
        argument = this.#evaluate(argument, scope);

        // console.log('Argumento en evaluateUnaryExpression:', argument);
        switch(operator) {
        case 'no':
            return makeBoolean(!argument.value);
        case '-':
            return makeNumber(-argument.value);
        case '+':
            return makeNumber(+argument.value);
        }

        throw TuberInterpreterError('Operador unario inválido', this.#currentStatement);
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateBinaryExpression(node, scope) {
        let { operator, leftOperand, rightOperand } = node;
        leftOperand = this.#evaluate(leftOperand, scope);
        rightOperand = this.#evaluate(rightOperand, scope);

        if([ leftOperand.type, rightOperand.type ].includes('Text'))
            return this.#evaluateConcatenationBinaryExpression(operator, leftOperand, rightOperand);

        // if([ leftOperand.type, rightOperand.type ].includes('Number'))
        return this.#evaluateNumericBinaryExpression(operator, leftOperand, rightOperand);

        // return makeNada();
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     * @returns {BooleanValue}
     */
    #evaluateLogicalExpression(node, scope) {
        let { leftHand, rightHand, operator } = node;
        leftHand = this.#evaluate(leftHand, scope);
        rightHand = this.#evaluate(rightHand, scope);
        // console.log({ left: leftHand, right: rightHand });

        const operations = {
            'y':          (left, right) => makeValue(leftHand, 'Boolean').value && makeValue(rightHand, 'Boolean') ? right : left,
            'o':          (left, right) => makeValue(leftHand, 'Boolean').value ? left : right,
            'es':         (left, right) => left === right,
            'no es':      (left, right) => left !== right,
            'parece':     (left, right) => left ==  right,
            'no parece':  (left, right) => left !=  right,
            'precede':    (left, right) => left <   right,
            'no precede': (left, right) => left >=  right,
            'excede':     (left, right) => left >   right,
            'no excede':  (left, right) => left <=  right,
        };

        if(typeof operations[operator] !== 'function')
            throw TuberInterpreterError(`Operador lógico inválido: ${operator}`, this.#currentStatement);
        
        const leftValue = leftHand ? (leftHand.value ?? leftHand.elements ?? leftHand.properties) : undefined;
        const rightValue = rightHand ? (rightHand.value ?? rightHand.elements ?? rightHand.properties) : undefined;
        // console.log({ leftValue, rightValue });
        
        let result = operations[operator](leftValue, rightValue);
        // console.log({ result });

        if(typeof result === 'boolean')
            return makeBoolean(result);

        if(result === leftValue)
            result = leftHand;
        else
            result = rightHand;

        return result;
    }

    /**
     * 
     * @param {NumericValue} node 
     * @param {TuberScope} scope 
     */
    #evaluateConcatenationBinaryExpression(operator, leftOperand, rightOperand) {
        /**@type {TextValue}*/
        const evaluation = { type: 'Text', value: null }

        if(operator !== '+')
            throw TuberInterpreterError('Se esperaba operador "+" en concatenación de Textos', this.#currentStatement);

        leftOperand = makeValue(leftOperand, 'Text');
        rightOperand = makeValue(rightOperand, 'Text');

        const result = leftOperand.value + rightOperand.value;

        if(typeof result !== 'string')
            throw TuberInterpreterError(`Concatenación inválida: ${leftOperand.value ?? 'Nada'} ${operator ?? '?'} ${rightOperand.value ?? 'Nada'}`, this.#currentStatement);

        evaluation.value = result;
        return evaluation;
    }

    /**
     * 
     * @param {NumericValue} node 
     * @param {TuberScope} scope 
     */
    #evaluateNumericBinaryExpression(operator, leftOperand, rightOperand) {
        /**@type {NumericValue}*/
        const evaluation = { type: 'Number', value: null }

        leftOperand = makeValue(leftOperand, 'Number');
        rightOperand = makeValue(rightOperand, 'Number');

        if(isNotOperable(leftOperand.value) || isNotOperable(rightOperand.value))
            throw TuberInterpreterError(`El operando ${leftOperand.value ?? 'Nada'} no puede ser operado con el operando ${rightOperand.value ?? 'Nada'}`);

        const operations = {
            '+': () => leftOperand.value + rightOperand.value,
            '-': () => leftOperand.value - rightOperand.value,
            '*': () => leftOperand.value * rightOperand.value,
            '/': () => leftOperand.value / rightOperand.value,
            '%': () => leftOperand.value % rightOperand.value,
            '^': () => leftOperand.value ** rightOperand.value,
        };

        if(typeof operations[operator] !== 'function')
            throw TuberInterpreterError('Operador inválido', this.#currentStatement);

        const result = operations[operator]();

        if(isNotOperable(result))
            throw TuberInterpreterError(`Operación inválida: ${leftOperand.value} ${operator} ${rightOperand.value}`, this.#currentStatement);

        evaluation.value = result;
        return evaluation;
    }

    /**
     * 
     * @param {{ ...TuberNode, emitter: TuberNode, arguments: Array<TuberNode> }} node 
     * @param {TuberScope} scope 
     * @returns {RuntimeValue}
     */
    #evaluateCallExpression(node, scope) {
        let { emitter, arguments: args } = node;

        const fn = this.#evaluate(emitter, scope);

        // console.log('fn en cuestión:', fn, '+', emitter);

        // console.log('fn "', emitter?.name ?? 'anónima', '":', fn);

        // if(emitter.type === 'ArrowExpression') {
        //     emitter = this.#evaluateArrowExpression(emitter, scope, true);
        // }

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
                // console.log('El nuevo emitter en expresión compleja de Función nativa', emitter);
                result = fn.call(emitter.container, args, this.#currentStatement, functionScope, this.#request);
            } else
                result = fn.call(args, this.#currentStatement, functionScope, this.#request);
        } else {
            for(let i = 0; i < Math.max(fn.arguments.length, args.length); i++) {
                // console.log(`fn.arguments[${i}]:`, fn.arguments[i], `args[${i}]:`, args[i]);
                if(fn.arguments[i] == undefined) continue;
                if(args[i] == undefined) {
                    functionScope.declareVariable(fn.arguments[i].name, 'Nada');
                    if(fn.arguments[i].default)
                        functionScope.assignVariable(fn.arguments[i].name, this.#evaluate(fn.arguments[i].default));
                    continue;
                }
                
                if(![ 'List', 'Glossary', 'Embed', 'Function', 'NativeFunction' ].includes(args[i].type)) {
                    functionScope.declareVariable(fn.arguments[i].name, 'Nada');
                    functionScope.assignVariable(fn.arguments[i].name, args[i]);
                    // console.log(`Se declaró variable de Función "${fn.arguments[i].name}"`);
                } else {
                    functionScope.declareMirror(fn.arguments[i].name, node.arguments[i]);
                    // console.log(`Se declaró mirror en Función "${fn.arguments[i].name}" =>`, node.arguments[i]);
                }
            }
            // console.log('scope de función:', functionScope.variables);
            result = this.#evaluateBlock(fn, functionScope);
        }
        // console.log('scope general luego de la función:', scope.variables);

        if(result.type === 'Number' && isNotOperable(result?.value))
            return makeNada();
        
        if(result.type === 'BreakStatement')
            return makeNada();
        
        return result;
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     * @returns {ListValue}
     */
    #createList(node, scope) {
        let { elements } = node;
        elements = elements.map(element => this.#evaluate(element, scope));
        return { ...node, ...makeList(elements) };
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     * @returns {GlossaryValue}
     */
    #createGlossary(node, scope) {
        /**@type {GlossaryValue}*/
        const glossary = makeGlossary(new Map());
        const { properties } = node;

        properties.forEach(property => {
            const { key, value } = this.#evaluateProperty(property, scope);
            glossary.properties.set(key.name ?? `${key.value}`, value);
        });

        return { ...node, ...glossary };
    }

    /**
     * 
     * @param {{ key: String, value: RuntimeValue }} node 
     * @param {TuberScope} scope 
     * @returns {PropertyValue}
     */
    #evaluateProperty(node, scope) {
        let { key, value } = node;

        if(!node.type === NodeTypes.PROPERTY)
            throw TuberInterpreterError('Se esperaba una propiedad válida en expresión de Glosario', this.#currentStatement);

        value = this.#evaluate(value, scope);

        return { key, value };
    }

    /**
     * 
     * @param {TuberNode} node 
     * @param {TuberScope} scope 
     * @returns {TextValue}
     */
    #createTextFromTemplate(node, scope) {
        /**@type {GlossaryValue}*/
        let result = '';

        if(node.type !== 'TextTemplateExpression')
            throw TuberInterpreterError('Se esperaba una plantilla de Texto', this.#currentStatement)

        node.expressions.forEach(expression => {
            result += makeValue(this.#evaluate(expression, scope), 'Text').value;
        });

        return { type: 'Text', value: result };
    }
};

module.exports = {
    TuberInterpreterError,
    TuberInterpreter,
};