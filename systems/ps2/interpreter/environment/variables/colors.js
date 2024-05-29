const { Colors } = require('discord.js');

/**@type {Map<String, Number>}*/
const NativeColorsLookup = new Map();
NativeColorsLookup
	.set('colorAnaranjado',       Colors.Orange)
	.set('colorAnaranjadoOscuro', Colors.DarkOrange)
    .set('colorAmarillo',         Colors.Yellow)
    .set('colorAqua',             Colors.Aqua)
    .set('colorAquaOscuro',       Colors.DarkAqua)
    .set('colorAzul',             Colors.Blue)
    .set('colorAzulOscuro',       Colors.DarkBlue)
    .set('colorBlanco',           Colors.White)
    .set('colorCasiNegro',        Colors.DarkButNotBlack)
    .set('colorCeleste',          Colors.Aqua)
    .set('colorCelesteOscuro',    Colors.DarkAqua)
    .set('colorDiscord',          Colors.Blurple)
    .set('colorDorado',           Colors.Gold)
    .set('colorDoradoOscuro',     Colors.DarkGold)
    .set('colorFucsia',           Colors.Fuchsia)
    .set('colorGris',             Colors.Grey)
    .set('colorGrisClaro',        Colors.LightGrey)
    .set('colorGrisNegro',        Colors.DarkerGrey)
    .set('colorGrisOscuro',       Colors.DarkGrey)
    .set('colorGríspura',         Colors.Greyple)
    .set('colorNaranja',          Colors.Orange)
    .set('colorNaranjaOscuro',    Colors.DarkOrange)
    .set('colorNegro',            Colors.NotQuiteBlack)
    .set('colorMarino',           Colors.Navy)
    .set('colorMarinoOscuro',     Colors.DarkNavy)
    .set('colorMorado',           Colors.Purple)
    .set('colorMoradoOscuro',     Colors.DarkPurple)
    .set('colorPurpura',          Colors.Purple)
    .set('colorPúrpura',          Colors.Purple)
    .set('colorPurpuraOscuro',    Colors.DarkPurple)
    .set('colorPúrpuraOscuro',    Colors.DarkPurple)
    .set('colorRojo',             Colors.Red)
    .set('colorRojoOscuro',       Colors.DarkRed)
    .set('colorRosaClaro',        Colors.LuminousVividPink)
    .set('colorRosaOscuro',       Colors.DarkVividPink)
    .set('colorVerde',            Colors.Green)
    .set('colorVerdeOscuro',      Colors.DarkGreen)
    .set('colorVioleta',          Colors.Purple)
    .set('colorVioletaOscuro',    Colors.DarkPurple);

module.exports = {
	NativeColorsLookup,
};
