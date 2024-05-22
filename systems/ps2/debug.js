const { shortenText } = require('../../func');
const { TokenKinds, Token } = require('./lexer/tokens');
const chalk = require('chalk');

const exChalk = {
	orange: chalk.rgb(255, 162, 105),
	ice: chalk.rgb(27, 247, 236),
};

function isInstance(obj) {
	return obj?.constructor?.name && ![ 'Object', 'Array', 'Map' ].includes(obj.constructor.name);
}

/**
 * @param {*} value
 */
function stringifyPlainPSAST(value) {
	let valueStr;

	switch(typeof value) {
	case 'number': 
		valueStr = chalk.yellowBright(value);
		break;
	case 'string': 
		valueStr = chalk.greenBright(`'${value}'`);
		break;
	case 'boolean': 
		valueStr = chalk.cyanBright(`${value}`);
		break;
	case 'bigint': 
		valueStr = chalk.yellowBright(`${value}n`);
		break;
	case 'symbol': 
		valueStr = chalk.italic.greenBright(value.toString());
		break;
	case 'function':
		valueStr = chalk.blueBright(`fn ${value.name ?? chalk.italic.magentaBright('Anon')}${shortenText(value.toString(), 24)}`);
		break;
	case 'undefined':
		valueStr = chalk.bold.gray('undefined');
		break;
	default:
		valueStr = value;
		break;
	}

	return valueStr;
}

/**
 * @param {Object|Array} obj 
 * @returns {String}
 */
function stringifySimplePSAST(obj) {
	const isArray = Array.isArray(obj);
	const delims = isArray ? '[]' : '{}';
	let name = '';

	if(!isArray && obj.hasOwnProperty('kind')) {
		const { kind, ...rest } = obj;
		obj = rest;
		name = chalk.cyan(`${kind} `);
	}

	let result = `${name}${chalk.gray(delims[0])} `;

	const prefixer = isArray
		? (/**@type {String}*/key) => ''
		: (/**@type {String}*/key) => `${key}: `;

	let first = true;

	for(const key in obj) {
		if(first)
			first = false;
		else
			result += chalk.gray(', ');

		if(obj.hasOwnProperty(key)) {
			const value = obj[key];
			result += `${prefixer(key)}${stringifyPSAST(value)}`;
		}
	}

	result += ` ${chalk.gray(delims[1])}`;

	return result;
}

/**
 * 
 * @param {Map} map
 * @param {Number} [indentSize]
 * @param {Number} [indent] 
 * @returns {String}
 */
function stringifyPSASTMap(map, indentSize = 2, indent = indentSize) {
	let spaces = ' '.repeat(indent);

	let result = exChalk.orange(`Map (${exChalk.ice(map.size)})`);

	if(map.size === 0)
		return result;

	result += ` ${chalk.gray('{')}\n`;

	for(const [ key, value ] of map.entries()) {
		const stringifiedKey = stringifyPSAST(key, indentSize, indent + indentSize);
		const stringifiedValue = stringifyPSAST(value, indentSize, indent + indentSize);
		result += `${spaces}${chalk.gray(`(${stringifiedKey})`)} ${exChalk.ice('→')} ${stringifiedValue}\n`;
	}
	
	spaces = ' '.repeat(indent - indentSize);
	result += `${spaces}${chalk.gray('}')}`;

	return result;
}

/**
 * 
 * @param {Object|Array} obj 
 * @param {Number} [indentSize]
 * @param {Number} [indent] 
 * @returns {String}
 */
function stringifyPSAST(obj, indentSize = 2, indent = indentSize) {
	if(typeof obj !== 'object')
		return stringifyPlainPSAST(obj);

	if(obj == null)
		return chalk.red('null');

	if(obj instanceof Map)
		return stringifyPSASTMap(obj, indentSize, indent);

	if(isInstance(obj))
		return exChalk.orange(obj.toString());

	const values = Object.values(obj);
	if(values.length <= 2 && values.every(v => typeof v !== 'object' || v == null || isInstance(v))) {
		const simple = stringifySimplePSAST(obj);
		if(simple.length < 127)
			return simple;
	}

	const isArray = Array.isArray(obj);
	const delims = isArray ? '[]' : '{}';
	let spaces = ' '.repeat(indent);
	let name = '';

	if(!isArray && obj.hasOwnProperty('kind')) {
		const { kind, ...rest } = obj;
		obj = rest;
		name = chalk.cyan(`${kind} `);
	}

	let result = `${name}${chalk.gray(delims[0])}\n`;

	const prefixer = isArray
		? (/**@type {String}*/key) => `${spaces}`
		: (/**@type {String}*/key) => `${spaces}${key}: `;

	for(const key in obj) {
		if(obj.hasOwnProperty(key)) {
			const value = obj[key];
			result += `${prefixer(key)}${stringifyPSAST(value, indentSize, indent + indentSize)}\n`;
		}
	}

	spaces = ' '.repeat(indent - indentSize);
	result += `${spaces}${chalk.gray(delims[1])}`;

	return result;
}

module.exports = {
	stringifyPSAST,
};
