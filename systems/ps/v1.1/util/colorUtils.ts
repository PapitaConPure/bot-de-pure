type HexColorCode = `#${string}`;

/**
 * @description Converts HSV/HSB to RGB (0~1).
 * @param hue Hue rotation, in degrees (0~360).
 * @param sat Saturation factor (0~1).
 * @param lit Lightness factor (0~1).
 */
export function hsl2rgb(hue: number, sat: number, lit: number): [number, number, number] {
	const a = sat * Math.min(lit, 1 - lit);
	const mapParam = (/**@type {number}*/n: number, k = (n + hue / 30) % 12) => lit - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	return [ mapParam(0), mapParam(8), mapParam(4) ];
}

/**
 * @description Converts HSV/HSB to RGB (0~1).
 * @param hue Hue rotation, in degrees (0~360).
 * @param sat Saturation factor (0~1).
 * @param val Value factor (0~1).
 * @returns {[ number, number, number ]}
 */
export function hsv2rgb(hue: number, sat: number, val: number): [number, number, number] {
	const mapParam = (/**@type {number}*/n: number, k = (n + hue / 60) % 6) => val - val * sat * Math.max(Math.min(k, 4 - k, 1), 0);
	return [ mapParam(5), mapParam(3), mapParam(1) ];
}

/**
 * @description Converts HSL to #hexadecimal.
 * @param hue Hue rotation, in degrees (0~360.)
 * @param sat Saturation factor (0~1).
 * @param lit Lightness factor (0~1).
 */
export function hsl2hex(hue: number, sat: number, lit: number): HexColorCode {
	const args = hsl2rgb(hue, sat, lit).map(x => x * 255);
	return rgb2hex(args[0], args[1], args[2]);
}

/**
 * @description Converts HSV/HSB to #hexadecimal.
 * @param hue Hue rotation, in degrees (0~360).
 * @param sat Saturation factor (0~1).
 * @param lit Lightness factor (0~1).
 */
export function hsv2hex(hue: number, sat: number, lit: number): HexColorCode {
	const args = hsv2rgb(hue, sat, lit).map(x => x * 255);
	return rgb2hex(args[0], args[1], args[2]);
}

/**
 * @description Converts RGB format to #hexadecimal.
 * @param red   Red channel intensity (0~255).
 * @param green Green channel intensity (0~255).
 * @param blue  Blue channel intensity (0~255).
 */
export function rgb2hex(red: number, green: number, blue: number): HexColorCode {
	const channelHex = (/**@type {number}*/component: number) => Math.round(component).toString(16).padStart(2, '0');
	return `#${channelHex(red)}${channelHex(green)}${channelHex(blue)}`;
}
