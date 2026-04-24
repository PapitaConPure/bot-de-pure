const digitsOf64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';

export function radix10to64(n: number, s: string = ''): string {
	const newKey = n % 64;
	const remainder = Math.floor(n / 64);
	const stack = digitsOf64[newKey] + s;
	return remainder <= 0 ? stack : radix10to64(remainder, stack);
}

export function radix64to10(s: string): number {
	const digits = s.split('');
	let result = 0;
	for (const e in digits) result = result * 64 + digitsOf64.indexOf(digits[e]);
	return result;
}
const digitsOf128 =
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/*ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÃÕáéíóúàèìòùäëïöüãõÑñÇçºª;:,.!·%¿?@#~€¬¨^<>';

export function radix10to128(n: number, s: string = ''): string {
	const newKey = n % 128;
	const remainder = Math.floor(n / 128);
	const stack = digitsOf128[newKey] + s;
	return remainder <= 0 ? stack : radix10to128(remainder, stack);
}

export function radix128to10(s: string): number {
	const digits = s.split('');
	let result = 0;
	for (const e in digits) result = result * 128 + digitsOf128.indexOf(digits[e]);
	return result;
}
/**
 * @description
 * Comprime un snowflake de Discord dividiéndolo en dos partes, convirtiéndolas a un sistema arbitrario de base 128 y concatenando el resultado.
 *
 * La longitud del segmento izquierdo comprimido se antepone al resultado para permitir su decodificación.
 */

export function compressId(id: string): string {
	if (typeof id !== 'string') throw Error('La id debe ser un string');

	let mid = Math.floor(id.length * 0.5);

	if (id[mid] === '0') mid = Math.floor(mid * 0.5) || 1;

	while (id[mid] === '0' && mid < id.length - 1) mid++;

	const left = id.slice(0, mid);
	const right = id.slice(mid);
	const compr = [left, right].map((str) => {
		const int = parseInt(str, 10);
		if (Number.isNaN(int))
			throw TypeError(
				`No se pudo convertir ${str} a un entero al intentar comprimir la id: ${id}`,
			);
		return radix10to128(int);
	});

	return compr[0].length + compr.join('');
}
/**@description Realiza el proceso inverso de la función de compresión: {@linkcode compressId}.*/

export function decompressId(id: string): string {
	if (typeof id !== 'string') throw Error('La id debe ser un string');

	const mid = id[0];
	id = id.slice(1);
	const left = id.slice(0, +mid);
	const right = id.slice(+mid);
	const decomp = [left, right].map((str) => radix128to10(str).toString());

	return decomp.join('');
}
