const { shortenText } = require('./utils');
const { EmbedData } = require('../embedData');
const chalk = require('chalk');

const exChalk = {
	orange: chalk.rgb(237, 171, 130),
	ice: chalk.rgb(27, 247, 236),
	mint: chalk.rgb(13, 222, 191),
	peach: chalk.rgb(237, 130, 157),
};

/**
 * @param {*} obj
 */
function isInstance(obj) {
	return obj?.constructor?.name && ![ 'Object', 'Array', 'Map', 'EmbedData' ].includes(obj.constructor.name);
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
		valueStr = exChalk.orange(`${value}`);
		break;
	case 'bigint': 
		valueStr = chalk.yellowBright(`${value}n`);
		break;
	case 'symbol': 
		valueStr = chalk.italic.greenBright(value.toString());
		break;
	case 'function': {
		const fnString = value
			.toString()
			.slice(9 + value.name.length)
			.replace(/(\r?\n)+/g, '')
			.replace(/[\t ]+/g, ' ');
		valueStr = exChalk.peach(`fn ${value.name != null ? exChalk.ice(value.name) : exChalk.mint.italic('<anon>')}${chalk.gray(shortenText(fnString, 48))}`);
		break;
	}
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

	if(!isArray) {
		if(Object.prototype.hasOwnProperty.call(obj, 'equals')) {
			// eslint-disable-next-line no-unused-vars
			const { equals, ...rest } = obj;
			obj = rest;
		}
		if(Object.prototype.hasOwnProperty.call(obj, 'compareTo')) {
			// eslint-disable-next-line no-unused-vars
			const { compareTo, ...rest } = obj;
			obj = rest;
		}
		if(Object.prototype.hasOwnProperty.call(obj, 'kind')) {
			const { kind, ...rest } = obj;
			obj = rest;
			name = chalk.cyan(`${kind} `);
		}

		if(Object.keys(obj).length === 0)
			return name ?? chalk.gray(delims);
	}

	let result = `${name}${chalk.gray(delims[0])} `;

	const prefixer = isArray
		? () => ''
		: (/**@type {String}*/key) => `${key}: `;

	let first = true;

	for(const key in obj) {
		if(first)
			first = false;
		else
			result += chalk.gray(', ');

		if(Object.prototype.hasOwnProperty.call(obj, key)) {
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

	if(obj instanceof EmbedData)
		return stringifyPSAST(obj.data, indentSize, indent);

	if(isInstance(obj))
		return exChalk.orange(obj.toString());

	const isArray = Array.isArray(obj);
	const delims = isArray ? '[]' : '{}';
	let hasKind = false;
	let hasPositionalData = false;
	let name = '';
	let threshold = 2;

	if(!isArray) {
		hasKind = Object.prototype.hasOwnProperty.call(obj, 'kind');
		if(Object.prototype.hasOwnProperty.call(obj, 'equals')) {
			// eslint-disable-next-line no-unused-vars
			const { equals, ...rest } = obj;
			obj = rest;
		}
		if(Object.prototype.hasOwnProperty.call(obj, 'compareTo')) {
			// eslint-disable-next-line no-unused-vars
			const { compareTo, ...rest } = obj;
			obj = rest;
		}
		if(hasKind) {
			threshold = 3;
			if(Object.prototype.hasOwnProperty.call(obj, 'line'))
				hasPositionalData = true;
		}
	} else if(/**@type {Array}*/(obj).length === 0)
		return chalk.gray(delims);

	const values = Object.values(obj);
	if(values.length <= threshold && values.every(v => typeof v !== 'object' || v == null || isInstance(v))) {
		const simple = stringifySimplePSAST(obj);
		if(simple.length < 192)
			return simple;
	}

	if(!isArray && hasKind) {
		if(hasPositionalData) {
			const { kind, line, start, end, ...rest } = obj;
			obj = rest;
			name = chalk.cyan(`${kind} ${exChalk.peach(`(${exChalk.mint(line)}, ${exChalk.mint(`${start}~${end}`)})`)} `);
		} else {
			const { kind, ...rest } = obj;
			obj = rest;
			name = chalk.cyan(`${kind} `);
		}
	}

	if(values.length === 0)
		return name ?? chalk.gray(delims);

	let spaces = ' '.repeat(indent);
	let result = `${name}${chalk.gray(delims[0])}\n`;

	const prefixer = isArray
		? () => `${spaces}`
		: (/**@type {String}*/key) => `${spaces}${key}: `;

	for(const key in obj) {
		if(Object.prototype.hasOwnProperty.call(obj, key)) {
			const value = obj[key];
			result += `${prefixer(key)}${stringifyPSAST(value, indentSize, indent + indentSize)}\n`;
		}
	}

	spaces = ' '.repeat(indent - indentSize);
	result += `${spaces}${chalk.gray(delims[1])}`;

	return result;
}

/**
 * @param {*} ast
 * @param {Number} [indentSize]
 * @param {Number} [indentSteps]
 */
function logPSAST(ast, indentSize = 2, indentSteps = 0) {
	const indent = indentSize + indentSize * indentSteps;
	console.log(stringifyPSAST(ast, indentSize, indent));
}

module.exports = {
	stringifyPSAST,
	logPSAST
};
