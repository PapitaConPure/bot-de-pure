/**@typedef {`#${string}`} HexColorCode*/

/**
 * Converts HSV/HSB to RGB (0~1)
 * @param {Number} hue Hue rotation, in degrees (0~360)
 * @param {Number} sat Saturation factor (0~1)
 * @param {Number} lit Lightness factor (0~1)
 * @returns {[ Number, Number, Number ]}
 */
function hsl2rgb(hue, sat, lit) {
	const a = sat * Math.min(lit, 1 - lit);
	const mapParam = (/**@type {Number}*/n, k = (n + hue / 30) % 12) => lit - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	return [ mapParam(0), mapParam(8), mapParam(4) ];
}

/**
 * Converts HSV/HSB to RGB (0~1)
 * @param {Number} hue Hue rotation, in degrees (0~360)
 * @param {Number} sat Saturation factor (0~1)
 * @param {Number} val Value factor (0~1)
 * @returns {[ Number, Number, Number ]}
 */
function hsv2rgb(hue, sat, val) {
	const mapParam = (/**@type {Number}*/n, k = (n + hue / 60) % 6) => val - val * sat * Math.max(Math.min(k, 4 - k, 1), 0);
	return [ mapParam(5), mapParam(3), mapParam(1) ];
}

/**
 * Converts HSL to #hexadecimal
 * @param {Number} hue Hue rotation, in degrees (0~360)
 * @param {Number} sat Saturation factor (0~1)
 * @param {Number} lit Lightness factor (0~1)
 * @returns {HexColorCode}
 */
function hsl2hex(hue, sat, lit) {
	const args = hsl2rgb(hue, sat, lit).map(x => x * 255);
	return rgb2hex(args[0], args[1], args[2]);
}

/**
 * Converts HSV/HSB to #hexadecimal
 * @param {Number} hue Hue rotation, in degrees (0~360)
 * @param {Number} sat Saturation factor (0~1)
 * @param {Number} lit Lightness factor (0~1)
 * @returns {HexColorCode}
 */
function hsv2hex(hue, sat, lit) {
	const args = hsv2rgb(hue, sat, lit).map(x => x * 255);
	return rgb2hex(args[0], args[1], args[2]);
}

/**
 * Converts RGB format to #hexadecimal
 * @param {Number} red   Red channel intensity (0~255)
 * @param {Number} green Green channel intensity (0~255)
 * @param {Number} blue  Blue channel intensity (0~255)
 * @returns {HexColorCode}
 */
function rgb2hex(red, green, blue) {
    const channelHex = (/**@type {Number}*/component) => Math.round(component).toString(16).padStart(2, '0');
    return `#${channelHex(red)}${channelHex(green)}${channelHex(blue)}`;
}

module.exports = {
	hsl2rgb,
	hsv2rgb,
	rgb2hex,
	hsl2hex,
	hsv2hex,
};
