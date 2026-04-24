import { Translator } from '@/i18n';

/**@description Crea una promesa que dura la cantidad de milisegundos indicados.*/
export function sleep(ms: number): Promise<void> {
	if (typeof ms !== 'number')
		throw 'Se esperaba un número de milisegundos durante el cuál esperar';
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @pure
 * @description Devuelve el valor ingresado, restringido al rango facilitado.
 */
export function clamp(value: number, min: number, max: number) {
	if (min > max) {
		const temp = min;
		min = max;
		max = temp;
	}

	return Math.max(min, Math.min(value, max));
}

/**
 * @pure
 * @description Devuelve la mediana del conjunto especificado.
 */
export function median(...values: number[]) {
	if (!values.length) throw RangeError('Se esperaba al menos 1 número');
	values = values.sort((a, b) => a - b);
	const lowestHalf = Math.floor(values.length / 2);
	if (values.length % 2) return values[lowestHalf];
	return (values[lowestHalf] + values[lowestHalf + 1]) / 2;
}

export function subdivideArray<T>(array: T[], divisionSize: number): T[][] {
	if (!array.length) return [[]];

	const subdivided: T[][] = [];
	for (let i = 0; i * divisionSize < array.length; i++) {
		const j = i * divisionSize;
		subdivided[i] = array.slice(j, j + divisionSize);
	}
	return subdivided;
}

/**
 * @pure
 * @param arr An array of strings to regroup
 * @param sep A separator to use for defining new array groups
 */
export function regroupText(arr: string[], sep = ',') {
	const sepRegex = new RegExp(`([\\n ]*${sep}[\\n ]*)+`, 'g');
	return arr
		.join(' ')
		.replace(sepRegex, sep)
		.split(sep)
		.filter((a) => a.length);
}

/**
 * @pure
 * @param num The number to display
 * @param translator A Translator to format the number internationally
 */
export function quantityDisplay(num: number, translator: Translator) {
	return improveNumber(num, {
		appendOf: true,
		shorten: true,
		translator,
	});
}

/**
 * @description
 * Limita un string a una cantidad definida de caracteres.
 * Si el string sobrepasa el máximo establecido, se reemplaza el final por un string suspensor para indicar el recorte.
 */
export function shortenText(
	text: string,
	max: number | null = 200,
	suspensor: string | null = '...',
): string {
	if (typeof text !== 'string') throw TypeError('El texto debe ser un string');
	if (typeof max !== 'number') throw TypeError('El máximo debe ser un número');
	if (typeof suspensor !== 'string') throw TypeError('El suspensor debe ser un string');
	if (text.length < max) return text;
	return `${text.slice(0, max - suspensor.length)}${suspensor}`;
}

/**
 * @description
 * Limita un string a una cantidad definida de caracteres de forma floja (no recorta palabras).
 * Si el string sobrepasa el máximo establecido, se reemplaza el final por un string suspensor para indicar el recorte.
 */
export function shortenTextLoose(
	text: string,
	max: number | null = 200,
	hardMax: number | null = 256,
	suspensor: string | null = '...',
): string {
	if (typeof text !== 'string') throw TypeError('El texto debe ser un string');
	if (typeof max !== 'number') throw TypeError('El máximo debe ser un número');
	if (typeof hardMax !== 'number') throw TypeError('El máximo verdadero debe ser un número');
	if (typeof suspensor !== 'string') throw TypeError('El suspensor debe ser un string');

	if (text.length < max) return text;

	const trueMax = Math.min(text.length, hardMax);
	const whitespaces = [' ', '\n', '\t'];
	let calculatedMax = max;
	while (calculatedMax < trueMax && !whitespaces.includes(text[calculatedMax])) calculatedMax++;

	if (calculatedMax + suspensor.length > hardMax) calculatedMax = hardMax - suspensor.length;

	if (calculatedMax <= text.length) return text;

	return `${text.slice(0, calculatedMax)}${suspensor}`;
}

interface SmartShortenStructDefinition {
	start: string;
	end: string;
	dynamic: boolean;
}

interface SmartShortenOptions {
	max: number;
	hardMax: number;
	suspensor: string;
	structs: SmartShortenStructDefinition[];
}

/**
 * @description
 * Limita un string a una cantidad definida de caracteres de forma inteligente (no recorta palabras ni estructuras).
 */
export function shortenTextSmart(text: string, options: Partial<SmartShortenOptions>): string {
	options ??= {};
	options.max ??= 200;
	options.hardMax ??= 256;
	options.suspensor ??= '...';
	options.structs ??= [];
	const { max, hardMax, suspensor } = options;

	if (text.length < max) return text;

	const trueHardMax = Math.min(text.length, hardMax);

	const whitespaceOffset =
		/\s/.exec(text.slice(max, trueHardMax - suspensor.length))?.index ?? -1;
	const trueMax = max + (whitespaceOffset > 0 ? whitespaceOffset : 0);

	//PENDIENTE
	return `${text.slice(0, trueMax)}${suspensor}`;
}

/**@description Devuelve una representación del string ingresado con su primer caracter en mayúscula.*/
export const toCapitalized = (text: string) => `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`;
interface LowerCaseNormalizationOptions {
	removeCarriageReturns?: boolean;
}

/**@description Obtiene una representación en minúsculas, normalizada y sin diacríticos del string ingresado.*/
export function toLowerCaseNormalized(
	text: string,
	options: LowerCaseNormalizationOptions = {},
): string {
	options.removeCarriageReturns ??= false;

	text = text
		.toLowerCase()
		.normalize('NFD')
		.replace(/([aeioun])[\u0300-\u030A]/gi, '$1');

	if (options.removeCarriageReturns) text = text.replace(/\r/g, '');

	return text;
}

/**
 * Calcula la distancia entre dos strings con el algoritmo de distancia Levenshtein.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshteinDistance(a: string, b: string): number {
	const m = a.length + 1;
	const n = b.length + 1;
	const distance = new Array(m);
	for (let i = 0; i < m; ++i) {
		distance[i] = new Array(n);
		for (let j = 0; j < n; ++j) distance[i][j] = 0;
		distance[i][0] = i;
	}

	for (let j = 1; j < n; j++) distance[0][j] = j;

	let cost: number;
	for (let i = 1; i < m; i++)
		for (let j = 1; j < n; j++) {
			cost = a.at(i - 1) === b.at(j - 1) ? 0 : 1;

			distance[i][j] = Math.min(
				distance[i - 1][j] + 1,
				distance[i][j - 1] + 1,
				distance[i - 1][j - 1] + cost,
			);
		}

	return distance[m - 1][n - 1];
}

/**
 * @description
 * Calcula la distancia entre dos strings con el algoritmo de distancia Damerau-Levenshtein + peso Euclideano según distancia entre teclas del teclado.
 *
 * Asume una distribución de teclado de tipo QWERTY en Español (España).
 */
export function edlDistance(a: string, b: string): number {
	const keyboardKeys = [
		[..."º1234567890'¡"],
		[...' qwertyuiop`+'],
		[...' asdfghjklñ´ç'],
		[...'<zxcvbnm,.-  '],
	];
	const shiftKeyboardKeys = [
		[...'ª!"·$%&/()=?¿'],
		[...'           ^*'],
		[...'           ¨Ç'],
		[...'>       ;:_  '],
	];
	const altKeyboardKeys = [
		[...'\\|@#~€¬      '],
		[...'           []'],
		[...'           {}'],
		[...'			 '],
	];

	const keyboardCartesians: Record<string, { x: number; y: number }> = {};
	function assignToPlane(x: number, y: number, c: string) {
		if (c == null) return;
		keyboardCartesians[c] = { x, y };
	}
	for (let j = 0; j < keyboardKeys.length; j++) {
		keyboardKeys[j].forEach((char, i) => assignToPlane(i, j, char));
		shiftKeyboardKeys[j].forEach((char, i) => assignToPlane(i, j, char));
		altKeyboardKeys[j].forEach((char, i) => assignToPlane(i, j, char));
	}
	assignToPlane(keyboardCartesians.b.x, keyboardCartesians.b.y + 1, 'SPACE');
	const centerCartesian = { x: parseInt(`${keyboardKeys[1].length * 0.5}`, 10), y: 1 };
	function euclideanDistance(a = 'g', b = 'h') {
		a = a.toLowerCase();
		b = b.toLowerCase();
		const aa =
			a === ' ' ? keyboardCartesians.SPACE : (keyboardCartesians[a] ?? centerCartesian);
		const bb =
			b === ' ' ? keyboardCartesians.SPACE : (keyboardCartesians[b] ?? centerCartesian);
		const x = (aa.x - bb.x) ** 2;
		const y = (aa.y - bb.y) ** 2;
		return Math.sqrt(x + y);
	}
	const normalizedEuclidean = euclideanDistance('w', 'd');
	const halfNormalizedEuclidean = normalizedEuclidean * 0.5;

	const m = a.length + 1;
	const n = b.length + 1;
	const distance = new Array(m).fill(null).map((element, i) => {
		element = new Array(n).fill(0);
		element[0] = i;
		return element as number[];
	});
	for (let j = 1; j < n; j++) distance[0][j] = j;

	for (let i = 1; i < m; i++)
		for (let j = 1; j < n; j++) {
			const aa = a.at(i - 1);
			const bb = b.at(j - 1);
			const cost = aa === bb ? 0 : 1;

			const deletion = distance[i - 1][j] + 1;
			const insertion = distance[i][j - 1] + 1;
			const substitution = distance[i - 1][j - 1] + cost;
			distance[i][j] = Math.min(deletion, insertion, substitution);

			if (a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
				distance[i][j] = Math.min(distance[i][j], distance[i - 2][j - 2] + 1);

			if (cost && substitution < insertion && substitution < deletion)
				distance[i][j] +=
					euclideanDistance(aa, bb) * halfNormalizedEuclidean - normalizedEuclidean;
		}

	return distance[m - 1][n - 1];
}
export const shortnumberNames = {
	es: [
		'millones',
		'miles de millones',
		'billones',
		'miles de billones',
		'trillones',
		'miles de trillones',
		'cuatrillones',
		'miles de cuatrillones',
		'quintillones',
		'miles de quintillones',
		'sextillones',
		'miles de sextillones',
		'septillones',
		'miles de septillones',
		'octillones',
		'miles de octillones',
		'nonillones',
		'miles de nonillones',
		'decillones',
		'miles de decillones',
		'undecillones',
		'miles de undecillones',
		'duodecillones',
		'miles de duodecillones',
		'tredecillones',
		'miles de tredecillones',
		'quattuordecillones',
		'miles de quattuordecillones',
		'quindecillones',
		'miles de quindecillones',
		'sexdecillones',
		'miles de sexdecillones',
	],
	en: [
		'millions',
		'billions',
		'trillions',
		'quadrillions',
		'quintillions',
		'sextillions',
		'septillions',
		'octillions',
		'nonillions',
		'decillions',
		'undecillions',
		'duodecillions',
		'tredecillions',
		'quattuordecillions',
		'quindecillions',
		'sexdecillions',
		'septendecillions',
		'octodecillions',
		'novemdecillions',
		'vigintillions',
		'unvigintillions',
		'duovigintillions',
		'trevigintillions',
		'quattuorvigintillions',
		'quinvigintillions',
		'sexvigintillions',
		'septenvigintillions',
		'octovigintillions',
		'novemvigintillions',
		'trigintillions',
		'untrigintillions',
		'duotrigintillions',
	],
	ja: [
		'millions',
		'billions',
		'trillions',
		'quadrillions',
		'quintillions',
		'sextillions',
		'septillions',
		'octillions',
		'nonillions',
		'decillions',
		'undecillions',
		'duodecillions',
		'tredecillions',
		'quattuordecillions',
		'quindecillions',
		'sexdecillions',
		'septendecillions',
		'octodecillions',
		'novemdecillions',
		'vigintillions',
		'unvigintillions',
		'duovigintillions',
		'trevigintillions',
		'quattuorvigintillions',
		'quinvigintillions',
		'sexvigintillions',
		'septenvigintillions',
		'octovigintillions',
		'novemvigintillions',
		'trigintillions',
		'untrigintillions',
		'duotrigintillions',
	],
} as const;

interface ImproveNumberOptions {
	appendOf?: boolean;
	shorten?: boolean;
	translator?: Translator;
	minDigits?: number;
}

/**
 * @pure
 * @param num El número a mejorarle la visibilidad
 * @param options Opciones para mejorar el número
 */
export function improveNumber(num: number | string, options: ImproveNumberOptions = {}): string {
	const {
		appendOf = false,
		shorten = false,
		translator = new Translator('es'),
		minDigits = 1,
	} = options;

	if (typeof num === 'string') num = parseFloat(num);

	if (Number.isNaN(num)) return '0';

	/**
	 * @param {number} n
	 * @param {Intl.numberFormatOptions} nopt
	 */
	const formatnumber = (n: number, nopt: Intl.NumberFormatOptions = {}) =>
		n.toLocaleString(translator.locale, {
			maximumFractionDigits: 2,
			minimumIntegerDigits: minDigits,
			...nopt,
		});
	if (num < 1000000 || !shorten) return formatnumber(num);

	const ofPrefix = appendOf ? translator.getText('genericNumberOfPrefix') : '';
	const ofSuffix = appendOf ? translator.getText('genericNumberOfSuffix') : '';

	const obtainShortenednumber = () => {
		const googol = 10 ** 100;
		if (num >= googol)
			return `${formatnumber(num / googol, { maximumFractionDigits: 4 })} Gúgol`;

		const jesus = shortnumberNames[translator.locale];
		const ni =
			num < 10 ** (6 + jesus.length * 3)
				? Math.floor(
						(num.toLocaleString('fullwide', { useGrouping: false }).length - 7) / 3,
					)
				: jesus.length - 1;
		const snum = formatnumber(num / 1000 ** (ni + 2), { minimumFractionDigits: 2 });

		return [snum, jesus[ni]].join(' ');
	};

	return `${ofPrefix}${obtainShortenednumber()}${ofSuffix}`;
}

/**
 * @description
 * Reduce la presición de un número a solo los dígitos especificados.
 *
 * Si la parte decimal tiene menos dígitos que lo especificado, se deja como está.
 */
export function toPrecision(num: number, precision: number) {
	if (typeof num !== 'number') throw TypeError('Se esperaba un número válido');
	if (typeof precision !== 'number') throw TypeError('La presición debe ser un número');
	if (precision < 0 || precision > 14)
		throw RangeError('La presición debe ser un número entre 0 y 14');

	const abs = ~~num;
	const decimal = num - abs;
	const squash = 10 ** precision;
	const reduced = Math.floor(decimal * squash) / squash;
	return abs + reduced;
}
