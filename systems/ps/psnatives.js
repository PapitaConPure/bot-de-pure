const { TuberScope } = require('./psscope.js');
const { randRange, fetchUserID, shortenText, rand, fetchMember, fetchChannel, fetchRole, stringHexToNumber } = require('../../func.js');
const {
    //@ts-expect-error
    RuntimeValue,
    //@ts-expect-error
    NumericValue,
    //@ts-expect-error
    TextValue,
    //@ts-expect-error
    BooleanValue,
    //@ts-expect-error
    ListValue,
    //@ts-expect-error
    GlossaryValue,
    //@ts-expect-error
    EmbedValue,
    //@ts-expect-error
    NadaValue,
    //@ts-expect-error
    NativeFunctionValue,
    makeNumber,
    makeText,
    makeBoolean,
    makeList,
    makeGlossary,
    makeNativeFunction,
    makeNada,
    isNada,
    TuberInterpreterError,
    fileRegex,
    imageRegex,
    linkRegex,
    isNotOperable,
    makeValue,
    isNotValidText,
} = require('./commons.js');
const { Colors, GuildPremiumTier } = require('discord.js');

/**@typedef {{ number: Number, name: String }} CurrentStatement*/

//#region Discord
//#region Colores
/**@type {Map<String, Number>}*/
const colors = new Map();
colors
    .set('colorAleatorio',     Math.floor(Math.random() * 0xfffffe) + 1)
    .set('colorAmarillo',      Colors.Yellow)
    .set('colorAqua',          Colors.Aqua)
    .set('colorAquaOscuro',    Colors.DarkAqua)
    .set('colorAzul',          Colors.Blue)
    .set('colorAzulOscuro',    Colors.DarkBlue)
    .set('colorBlanco',        Colors.White)
    .set('colorCasiNegro',     Colors.DarkButNotBlack)
    .set('colorDiscord',       Colors.Blurple)
    .set('colorDorado',        Colors.Gold)
    .set('colorDoradoOscuro',  Colors.DarkGold)
    .set('colorFucsia',        Colors.Fuchsia)
    .set('colorGris',          Colors.Grey)
    .set('colorGrisClaro',     Colors.LightGrey)
    .set('colorGrisNegro',     Colors.DarkerGrey)
    .set('colorGrisOscuro',    Colors.DarkGrey)
    .set('colorGríspura',      Colors.Greyple)
    .set('colorMarino',        Colors.Navy)
    .set('colorMarinoOscuro',  Colors.DarkNavy)
    .set('colorNaranja',       Colors.Orange)
    .set('colorNaranjaOscuro', Colors.DarkOrange)
    .set('colorNegro',         Colors.NotQuiteBlack)
    .set('colorPúrpura',       Colors.Purple)
    .set('colorPúrpuraOscuro', Colors.DarkPurple)
    .set('colorRojo',          Colors.Red)
    .set('colorRojoOscuro',    Colors.DarkRed)
    .set('colorRosaClaro',     Colors.LuminousVividPink)
    .set('colorRosaOscuro',    Colors.DarkVividPink)
    .set('colorVerde',         Colors.Green)
    .set('colorVerdeOscuro',   Colors.DarkGreen);
//#endregion

/**
 * @param {[ EmbedValue, TextValue, TextValue, BooleanValue ]} param0 
 * @param {CurrentStatement} currentStatement
 */
function marcoAgregarCampo([marco, nombre, valor, alineado], currentStatement) {
    alineado ??= makeBoolean(false);

    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
    if(isNotValidText(nombre))
        throw TuberInterpreterError('Se esperaba un Texto válido para el nombre del campo de Marco', currentStatement);
    if(isNotValidText(valor))
        throw TuberInterpreterError('Se esperaba un Texto válido para el valor del campo de Marco', currentStatement);
    if(alineado.type !== 'Boolean')
        throw TuberInterpreterError('Se esperaba una Dupla válida para definir el alineamiento del campo de Marco', currentStatement);

    marco.value.addFields({ name: nombre.value, value: valor.value, inline: alineado.value });
    return makeNada();
}

/**
 * @param {[ EmbedValue, TextValue, TextValue ]} param0 
 * @param {CurrentStatement} currentStatement
 */
function marcoAsignarAutor([marco, nombre, imagen], currentStatement) {
    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
    if(isNotValidText(nombre))
        throw TuberInterpreterError('Se esperaba un Texto válido para el nombre de autor del Marco', currentStatement);

    if(isNada(imagen)) {
        marco.value.setAuthor({ name: nombre.value });
        return makeNada();
    }
    
    if(isNotValidText(imagen))
        throw TuberInterpreterError('Se esperaba un Texto válido para el enlace del ícono del autor del Marco', currentStatement);
    if(!fileRegex.test(imagen.value))
        throw TuberInterpreterError('Se esperaba un enlace válido para el ícono del autor del Marco', currentStatement);

    marco.value.setAuthor({ name: nombre.value, iconURL: imagen.value });
    return makeNada();
}

/**
 * @param {[ EmbedValue, TextValue | NumericValue ]} param0 
 * @param {CurrentStatement} currentStatement
 */
function marcoAsignarColor([marco, color], currentStatement) {
    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
    if(isNotValidText(color) && color?.type !== 'Number')
        throw TuberInterpreterError('Se esperaba un Número o Texto válido para el color del Marco (hexadecimal o predefinido)', currentStatement);

    try {
        const targetColor = color.type === 'Text'
            ? stringHexToNumber(color.value)
            : color.value;

        marco.value.setColor(targetColor);
    } catch(e) {
        throw TuberInterpreterError(`Se recibió un código de color inválido "${color.value ?? 'Nada'}" en asignación de color de Marco`, currentStatement);
    }
    return makeNada();
}

/**
 * @param {[ EmbedValue, TextValue ]} param0
 * @param {CurrentStatement} currentStatement
 */
function marcoAsignarDescripción([marco, descripción], currentStatement) {
    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
    if(isNotValidText(descripción))
        throw TuberInterpreterError('Se esperaba un Texto válido para la descripción del Marco', currentStatement);

    marco.value.setDescription(descripción.value);
    return makeNada();
}

/**
 * @param {[ EmbedValue, TextValue ]} param0 
 * @param {CurrentStatement} currentStatement
 */
function marcoAsignarImagen([marco, imagen], currentStatement) {
    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
    if(isNotValidText(imagen))
        throw TuberInterpreterError('Se esperaba un Texto válido para el enlace de la imagen del Marco', currentStatement);
    if(!fileRegex.test(imagen.value))
        throw TuberInterpreterError('Se esperaba un enlace válido para la imagen del Marco', currentStatement);

    marco.value.setImage(imagen.value);
    return makeNada();
}

/**
 * @param {[ EmbedValue, TextValue ]} param0 
 * @param {CurrentStatement} currentStatement
 */
function marcoAsignarMiniatura([marco, imagen], currentStatement) {
    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
    if(isNotValidText(imagen))
        throw TuberInterpreterError('Se esperaba un Texto válido para el enlace de la miniatura del Marco', currentStatement);
    if(!fileRegex.test(imagen.value))
        throw TuberInterpreterError('Se esperaba un enlace válido para la miniatura del Marco', currentStatement);

    marco.value.setThumbnail(imagen.value);
    return makeNada();
}

/**
 * @param {[ EmbedValue, TextValue, TextValue ]} param0 
 * @param {CurrentStatement} currentStatement
 */
function marcoAsignarPie([marco, pie, imagen], currentStatement) {
    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
    if(isNotValidText(pie))
        throw TuberInterpreterError('Se esperaba un Texto válido para el pie del Marco', currentStatement);

    if(isNada(imagen)) {
        marco.value.setFooter({ text: pie.value });
        return makeNada();
    }
    
    if(isNotValidText(imagen))
        throw TuberInterpreterError('Se esperaba un Texto válido para el enlace del ícono del pie del Marco', currentStatement);
    if(!fileRegex.test(imagen.value))
        throw TuberInterpreterError('Se esperaba un enlace válido para el ícono del pie del Marco', currentStatement);

    marco.value.setFooter({ text: pie.value, iconURL: imagen.value });
    return makeNada();
}

/**
 * @param {[ EmbedValue, TextValue ]} param0 
 * @param {CurrentStatement} currentStatement
 */
function marcoAsignarTítulo([marco, título], currentStatement) {
    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
        
    if(isNotValidText(título))
        throw TuberInterpreterError('Se esperaba un Texto válido para el título del Marco', currentStatement);

    marco.value.setTitle(título.value);
    return makeNada();
}

/**
 * @param {import('discord.js').GuildMember} member 
 */
function createDiscordMember(member) {
    /**@type {Map<String, RuntimeValue>}*/
    const miembro = new Map();
    miembro
        .set('id',      makeText(member.id))
        .set('avatar',  makeText(member.displayAvatarURL()))
        .set('nombre',  makeText(member.displayName))
        .set('mención', makeText(`${member}`));
    return miembro;
}

/**
 * @param {import('discord.js').GuildBasedChannel} channel 
 */
function createDiscordChannel(channel) {
    const isNSFW = 'nsfw' in channel;
    /**@type {Map<String, RuntimeValue>}*/
    const canal = new Map();
    canal
        .set('id',      makeText(channel.id))
        .set('nombre',  makeText(channel.name))
        .set('mención', makeText(`${channel}`))
        .set('nsfw',    isNSFW != undefined ? makeBoolean(isNSFW) : makeNada());
    return canal;
}

/**
 * @param {import('discord.js').Role} role 
 */
function createDiscordRole(role) {
    const roleIcon = role.iconURL({ size: 256 })
    /**@type {Map<String, RuntimeValue>}*/
    const rol = new Map();
    rol
        .set('id',      makeText(role.id))
        .set('nombre',  makeText(role.name))
        .set('mención', makeText(`${role}`))
        .set('color',   makeText(role.hexColor))
        .set('ícono',   roleIcon ? makeText(roleIcon) : makeNada());
    return rol;
}

/**
 * @param {import('discord.js').Guild} guild 
 */
async function createDiscordGuild(guild) {
    const iconUrl = guild.iconURL({ extension: 'jpg', size: 512 });
    const description = guild.description;
    const systemChannel = guild.systemChannel;
    const bannerUrl = guild.bannerURL({ extension: 'jpg', size: 1024 });
    const premiumTier = guild.premiumTier === GuildPremiumTier.None ? 'Ninguno' : `Nivel ${guild.premiumTier ?? 0}`;
    const splashUrl = guild.splashURL({ extension: 'jpg', size: 512 });

    /**@type {Map<String, RuntimeValue>}*/
    const servidor = new Map()
        .set('id',               makeText(guild.id))
        .set('nombre',           makeText(guild.name))
        .set('ícono',            iconUrl ? makeText(iconUrl) : makeNada())
        .set('descripción',      description ? makeText(description) : makeNada())
        .set('canalSistema',     systemChannel ? makeGlossary(createDiscordChannel(systemChannel)) : makeNada())
        .set('cartel',           bannerUrl ? makeText(bannerUrl) : makeNada())
        .set('nivel',            makeText(premiumTier))
        .set('imagenInvitación', splashUrl ? makeText(splashUrl) : makeNada())
        .set('dueño',            makeGlossary(createDiscordMember(await guild.fetchOwner())));

    return servidor;
}

/**
 * @param {Array<RuntimeValue>} param0
 * @param {CurrentStatement} currentStatement
 * @param {import('../../commands/Commons/typings.js').CommandRequest} request
 */
function buscarMiembro([búsqueda], currentStatement, _, request) {
    if(búsqueda?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un texto de búsqueda de miembro como argumento de función', currentStatement);

    const miembro = fetchMember(búsqueda.value, request);
    if(!miembro)
        return makeNada();

    return makeGlossary(createDiscordMember(miembro));
}

/**
 * @param {Array<RuntimeValue>} param0
 * @param {CurrentStatement} currentStatement
 * @param {import('../../commands/Commons/typings.js').CommandRequest} request
 */
function buscarCanal([búsqueda], currentStatement, _, request) {
    if(búsqueda?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un texto de búsqueda de canal como argumento de función', currentStatement);

    const canal = fetchChannel(búsqueda.value, request.guild);
    if(!canal || !canal)
        return makeNada();

    return makeGlossary(createDiscordChannel(canal));
}

/**
 * @param {Array<RuntimeValue>} param0
 * @param {CurrentStatement} currentStatement
 * @param {import('../../commands/Commons/typings.js').CommandRequest} request
 */
function buscarRol([búsqueda], currentStatement, _, request) {
    if(búsqueda?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un texto de búsqueda de rol como argumento de función', currentStatement);

    const rol = fetchRole(búsqueda.value, request.guild);
    if(!rol)
        return makeNada();

    return makeGlossary(createDiscordRole(rol));
}
//#endregion

//#region Funciones
/**@param {Array<RuntimeValue>} param0*/
function esNada([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de tipo');
    return makeBoolean(isNada(x) || x.type === 'Nada');
}

/**@param {Array<RuntimeValue>} param0*/
function esNúmero([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de tipo');
    return makeBoolean(x?.type === 'Number');
}

function esNumero([x]) { return esNúmero([x]); }

/**@param {Array<RuntimeValue>} param0*/
function esTexto([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de tipo');
    return makeBoolean(x?.type === 'Text');
}

/**@param {Array<RuntimeValue>} param0*/
function esDupla([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de tipo');
    return makeBoolean(x?.type === 'Boolean');
}

/**@param {Array<RuntimeValue>} param0*/
function esLista([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de tipo');
    return makeBoolean(x?.type === 'List');
}

/**@param {Array<RuntimeValue>} param0*/
function esGlosario([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de tipo');
    return makeBoolean(x?.type === 'Glossary');
}

/**@param {Array<RuntimeValue>} param0*/
function esMarco([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de tipo');
    return makeBoolean(x?.type === 'Embed');
}

/**@param {Array<RuntimeValue>} param0*/
function esEnlace([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de enlace');
    if(x.type !== 'Text') return false;
    if(!x.value.length)   return false;
    return makeBoolean(linkRegex.test(x.value));
}

/**@param {Array<RuntimeValue>} param0*/
function esArchivo([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de enlace');
    if(x.type !== 'Text') return false;
    if(!x.value.length)   return false;
    return makeBoolean(fileRegex.test(x.value));
}

/**@param {Array<RuntimeValue>} param0*/
function esImagen([x]) {
    if(x == undefined) throw Error('Se esperaba un argumento en comprobación de enlace');
    if(x.type !== 'Text') return false;
    if(!x.value.length)   return false;
    return makeBoolean(imageRegex.test(x.value));
}

/**
 * @param {Array<RuntimeValue>} param0
 * @param {CurrentStatement} currentStatement
 */
function dado([x, y, z], currentStatement) {
    if(x == undefined)
        return makeNumber(Math.random());
    
    if(x.type !== 'Number' || isNotOperable(x.value))
        throw TuberInterpreterError('Se esperaba un Número de primer argumento', currentStatement);
    
    if(y == undefined)
        return makeNumber(rand(x.value));

    if(y.type === 'Boolean')
        return makeNumber(rand(x.value, true) + (+y.value));
    
    if(y.type !== 'Number' || isNotOperable(y.value))
        throw TuberInterpreterError('Se esperaba un Número o Dupla de segundo argumento', currentStatement);

    if(z == undefined)
        return makeNumber(randRange(x.value, y.value));
    
    if(z.type !== 'Boolean')
        throw TuberInterpreterError('Se esperaba una Dupla de tercer argumento', currentStatement);

    return makeNumber(randRange(x.value, y.value, true) + (+z.value));
}

/**@type {Array<Function>}*/
const nativeFunctions = [
    dado,

    esNúmero,
    esNumero,
    esTexto,
    esDupla,
    esLista,
    esGlosario,
    esMarco,
    esNada,
    esEnlace,
    esArchivo,
    esImagen,

    marcoAgregarCampo,
    marcoAsignarAutor,
    marcoAsignarColor,
    marcoAsignarDescripción,
    marcoAsignarImagen,
    marcoAsignarMiniatura,
    marcoAsignarPie,
    marcoAsignarTítulo,

    buscarMiembro,
    buscarCanal,
    buscarRol,
];
//#endregion

function calculatePositionOffset(value, length) {
    value = Math.floor(value);
    if(value < 0)
        value = length + value;
    return value;
}

//#region Métodos
/**
 * @param {NumericValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function númeroRedondear(member, [haciaArriba], currentStatement) {
    const val = member.value;
    if(haciaArriba == undefined)
        return makeNumber(Math.floor(val + 0.5));
    if(haciaArriba?.type !== 'Boolean')
        throw TuberInterpreterError('Se esperaba una Dupla como parámetro de redondeo de número', currentStatement);
    return makeNumber(haciaArriba?.value ? Math.ceil(val) : Math.floor(val));
}

/**
 * @param {NumericValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function númeroATexto(member, [precision], currentStatement) {
    if(precision == undefined)
        return makeText(`${member.value}`);
    if(precision.type !== 'Number' || isNotOperable(precision.value))
        throw TuberInterpreterError('Se esperaba un Número válido como parámetro de función', currentStatement);
    if(precision.value < 1)
        throw TuberInterpreterError('La precisión debe ser mayor o igual a 1', currentStatement);
    if(precision.value > 100)
        throw TuberInterpreterError('La precisión debe ser menor o igual a 100', currentStatement);
    return makeText(member.value.toPrecision(precision.value));
}

/**@type {Map<String, NativeFunctionValue>}*/
const Número = new Map();
Número
    .set('redondear', makeNativeFunction(númeroRedondear))
    .set('aTexto',    makeNativeFunction(númeroATexto));

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoCaracterEn(member, [posición], currentStatement) {
    if(posición == undefined || posición.type !== 'Number' || isNotOperable(posición.value))
        throw TuberInterpreterError('Se esperaba un Número válido como argumento de posición de caracter', currentStatement);
    const pos = calculatePositionOffset(posición.value, member.value.length);

    const str = member.value.charAt(pos);
    if(str?.length)
        return makeText(str);
    return makeNada();
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoPosiciónDe(member, [texto], currentStatement) {
    if(texto?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de búsqueda de sub-texto', currentStatement);
    
    return makeNumber(member.value.indexOf(texto.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoÚltimaPosiciónDe(member, [texto], currentStatement) {
    if(texto?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de búsqueda de sub-texto', currentStatement);
    
    return makeNumber(member.value.lastIndexOf(texto.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoComienzaCon(member, [texto], currentStatement) {
    if(texto?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de comprobación de sub-texto', currentStatement);
    
    return makeBoolean(member.value.startsWith(texto.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoTerminaCon(member, [texto], currentStatement) {
    if(texto?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de comprobación de sub-texto', currentStatement);
    
    return makeBoolean(member.value.endsWith(texto.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoIncluye(member, [texto], currentStatement) {
    if(texto?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de comprobación de sub-texto', currentStatement);
    
    return makeBoolean(member.value.includes(texto.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoRepetir(member, [veces], currentStatement) {
    veces ??= makeNumber(0);
    if(veces == undefined)
        return makeText('');
    if(veces.type !== 'Number' || isNotOperable(veces.value))
        throw TuberInterpreterError('Se esperaba un Número válido como argumento de repeticiones de Texto', currentStatement);
    let pos = Math.floor(veces.value);
    if(pos < 0 || (pos * member.value.length) > 1024)
        throw TuberInterpreterError('Se esperaba un Número positivo no-tan-exagerado como argumento de repeticiones de Texto', currentStatement);

    return makeText(member.value.repeat(pos));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoReemplazar(member, [ocurrencia, reemplazo], currentStatement) {
    if(ocurrencia?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de ocurrencia a reemplazar', currentStatement);
    if(reemplazo?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un Texto como argumento de reemplazo de ocurrencia', currentStatement);
    
    return makeText(member.value.replace(ocurrencia.value, reemplazo.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoPartir(member, [separador], currentStatement) {
    if(separador?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento separador de Texto', currentStatement);
    
    return makeList(member.value.split(separador.value).map(split => makeText(split)));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoCortar(member, [inicio, fin], currentStatement) {
    if(inicio == undefined || inicio.type !== 'Number' || isNotOperable(inicio.value))
        throw TuberInterpreterError('Se esperaba un Número válido como primer argumento de recorte de Texto', currentStatement);
    if(fin == undefined)
        return makeText(member.value.slice(inicio.value));
    if(fin.type !== 'Number' || isNotOperable(fin.value))
        throw TuberInterpreterError('Se esperaba un Número válido como segundo argumento de recorte de Texto', currentStatement);

    return makeText(member.value.slice(inicio.value, fin.value));
}

/**
 * @param {TextValue} member
 * @param {CurrentStatement} _
 */
function textoAMinúsculas(member, _) {    
    return makeText(member.value.toLowerCase());
}

/**
 * @param {TextValue} member
 * @param {CurrentStatement} _
 */
function textoAMayúsculas(member, _) {    
    return makeText(member.value.toUpperCase());
}

/**
 * @param {TextValue} member
 * @param {CurrentStatement} _
 */
function textoNormalizar(member, _) {    
    return makeText(member.value.trim());
}

/**
 * @param {TextValue} member
 * @param {CurrentStatement} _
 */
function aLista(member, _) {    
    return makeList([ ...member.value ].map(character => makeText(character)));
}

/**@type {Map<String, NativeFunctionValue>}*/
const Texto = new Map();
Texto
    .set('caracterEn',       makeNativeFunction(textoCaracterEn))
    .set('posiciónDe',       makeNativeFunction(textoPosiciónDe))
    .set('posicionDe',       makeNativeFunction(textoPosiciónDe))
    .set('últimaPosiciónDe', makeNativeFunction(textoÚltimaPosiciónDe))
    .set('ultimaPosicionDe', makeNativeFunction(textoÚltimaPosiciónDe))
    .set('comienzaCon',      makeNativeFunction(textoComienzaCon))
    .set('terminaCon',       makeNativeFunction(textoTerminaCon))
    .set('incluye',          makeNativeFunction(textoIncluye))
    .set('repetir',          makeNativeFunction(textoRepetir))
    .set('reemplazar',       makeNativeFunction(textoReemplazar))
    .set('partir',           makeNativeFunction(textoPartir))
    .set('cortar',           makeNativeFunction(textoCortar))
    .set('aMinúsculas',      makeNativeFunction(textoAMinúsculas))
    .set('aMinusculas',      makeNativeFunction(textoAMinúsculas))
    .set('aMayúsculas',      makeNativeFunction(textoAMayúsculas))
    .set('aMayusculas',      makeNativeFunction(textoAMayúsculas))
    .set('normalizar',       makeNativeFunction(textoNormalizar))
    .set('aLista',           makeNativeFunction(aLista));

/**
 * @param {ListValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 * @returns {TextValue}
 */
function listaUnir(member, [seperator], currentStatement) {
    seperator ??= makeText(",");
    if(seperator?.type !== 'Text')
        throw TuberInterpreterError('Se esperaba un Texto como separador en unión de Lista', currentStatement);

    const value = member.elements.map(element => makeValue(element, 'Text').value).join(seperator.value);
    
    return makeText(value);
}
/**
 * @param {ListValue} member
 * @returns {BooleanValue}
 */
function listaVacía(member, _) {
    return makeBoolean(member.elements.length === 0);
}

/**
 * @param {ListValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 * @returns {BooleanValue}
 */
function listaIncluye(member, [ criteria ], currentStatement) {
    if(criteria == undefined)
        throw TuberInterpreterError('Se esperaba un valor como argumento de búsqueda en Lista', currentStatement);

    return makeBoolean(member.elements.some(el => el.equals(criteria)));
}

/**
 * @param {ListValue} member
 * @param {CurrentStatement} _
 */
function listaInvertir(member, _) {    
    return makeList(member.elements.slice().reverse());
}

/**
 * @param {ListValue} member
 * @param {CurrentStatement} _
 */
function listaOrdenar(member, _) {
    return makeList(member.elements.slice().sort((a, b) => a.compareTo(b).value));
}

/**
 * @param {ListValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function listaCortar(member, [inicio, fin], currentStatement) {
    if(inicio == undefined || inicio.type !== 'Number' || isNotOperable(inicio.value))
        throw TuberInterpreterError('Se esperaba un Número válido como primer argumento de recorte de Lista', currentStatement);
    if(fin == undefined)
        return makeList(member.elements.slice(inicio.value));
    if(fin.type !== 'Number' || isNotOperable(fin.value))
        throw TuberInterpreterError('Se esperaba un Número válido como segundo argumento de recorte de Lista', currentStatement);
    // const pos1 = calculatePositionOffset(inicio.value, member.elements.length);
    // const pos2 = calculatePositionOffset(fin.value,    member.elements.length);

    return makeList(member.elements.slice(inicio.value, fin.value));
}

/**
 * @param {ListValue} member
 * @returns {RuntimeValue}
 */
function listaÚltimo(member, _) {
    const value = member.elements[member.elements.length - 1];
    if(value == undefined)
        return makeNada();
    return value;
}

/**
 * @param {ListValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 * @returns {RuntimeValue}
 */
function listaRobar(member, [index], currentStatement) {
    if(index?.type !== 'Number')
        throw TuberInterpreterError('Se esperaba un Número válido especificando el índice del cual robar un elemento', currentStatement);
    const taken = member.elements.splice(index.value, 1)?.[0];
    if(taken == undefined)
        return makeNada();
    return taken;
}

/**
 * @param {ListValue} member
 * @returns {RuntimeValue}
 */
function listaRobarPrimero(member, _) {
    const taken = member.elements.shift();
    if(taken == undefined)
        return makeNada();
    return taken;
}

/**
 * @param {ListValue} member
 * @returns {RuntimeValue}
 */
function listaRobarÚltimo(member, _) {
    const taken = member.elements.pop();
    if(taken == undefined)
        return makeNada();
    return taken;
}

/**
 * @param {ListValue} member
 * @param {CurrentStatement} _
 */
function listaAGlosario(member, _) {
    const glossaryContent = new Map();
    member.elements.forEach((element, i) => {
        glossaryContent.set(`v${i}`, element);
    });
    return makeGlossary(glossaryContent);
}

/**@type {Map<String, NativeFunctionValue>}*/
const Lista = new Map();
Lista
    .set('unir',         makeNativeFunction(listaUnir))
    .set('vacía',        makeNativeFunction(listaVacía))
    .set('vacia',        makeNativeFunction(listaVacía))
    .set('incluye',      makeNativeFunction(listaIncluye))
    .set('invertir',     makeNativeFunction(listaInvertir))
    .set('ordenar',      makeNativeFunction(listaOrdenar))
    .set('cortar',       makeNativeFunction(listaCortar))
    .set('último',       makeNativeFunction(listaÚltimo))
    .set('ultimo',       makeNativeFunction(listaÚltimo))
    .set('robar',        makeNativeFunction(listaRobar))
    .set('robarPrimero', makeNativeFunction(listaRobarPrimero))
    .set('robarÚltimo',  makeNativeFunction(listaRobarÚltimo))
    .set('robarUltimo',  makeNativeFunction(listaRobarÚltimo))
    .set('aGlosario',    makeNativeFunction(listaAGlosario));

/**
 * @param {GlossaryValue} member
 * @param {CurrentStatement} currentStatement
 * @returns {ListValue}
 */
function glosarioClaves(member, _, currentStatement) {
    if(member?.type !== 'Glossary')
        throw TuberInterpreterError('Se esperaba un Glosario válido del cuál extraer claves', currentStatement);
    return makeList(Array.from(member.properties.keys()).map(key => makeText(key)));
}

/**
 * @param {GlossaryValue} member
 * @param {CurrentStatement} currentStatement
 * @returns {ListValue}
 */
function glosarioValores(member, _, currentStatement) {
    if(member?.type !== 'Glossary')
        throw TuberInterpreterError('Se esperaba un Glosario válido del cuál extraer valores', currentStatement);
    return makeList(Array.from(member.properties.values()));
}

/**
 * @param {GlossaryValue} member
 * @param {CurrentStatement} currentStatement
 * @returns {ListValue}
 */
function glosarioPropiedades(member, _, currentStatement) {
    if(member?.type !== 'Glossary')
        throw TuberInterpreterError('Se esperaba un Glosario válido del cuál extraer propiedades', currentStatement);

    return makeList(Array.from(member.properties.entries()).map(([ key, value ]) => makeList([ makeText(key), value ])));
}

/**@type {Map<String, NativeFunctionValue>}*/
const Glosario = new Map();
Glosario
    .set('nombres',     makeNativeFunction(glosarioClaves))
    .set('valores',     makeNativeFunction(glosarioValores))
    .set('miembros',    makeNativeFunction(glosarioPropiedades));

/**
 * 
 * @param {EmbedValue} member 
 * @param {[ TextValue, TextValue, BooleanValue ]} param1 
 * @param {CurrentStatement} currentStatement 
 * @returns {NadaValue}
 */
function wrapperMarcoAgregarCampo(member, [ nombre, valor, alineado ], currentStatement) {
    return marcoAgregarCampo([ member, nombre, valor, alineado ], currentStatement);
}

/**
 * 
 * @param {EmbedValue} member 
 * @param {Array<TextValue>} param1 
 * @param {CurrentStatement} currentStatement 
 * @returns {NadaValue}
 */
function wrapperMarcoAsignarAutor(member, [ nombre, autor ], currentStatement) {
    return marcoAsignarAutor([ member, nombre, autor ], currentStatement);
}

/**
 * 
 * @param {EmbedValue} member 
 * @param {[ NumericValue | TextValue ]} param1 
 * @param {CurrentStatement} currentStatement 
 * @returns {NadaValue}
 */
function wrapperMarcoAsignarColor(member, [ color ], currentStatement) {
    return marcoAsignarColor([ member, color ], currentStatement);
}

/**
 * 
 * @param {EmbedValue} member 
 * @param {Array<TextValue>} param1 
 * @param {CurrentStatement} currentStatement 
 * @returns {NadaValue}
 */
function wrapperMarcoAsignarDescripción(member, [ descripción ], currentStatement) {
    return marcoAsignarDescripción([ member, descripción ], currentStatement);
} 
/**
 * 
 * @param {EmbedValue} member 
 * @param {Array<TextValue>} param1 
 * @param {CurrentStatement} currentStatement 
 * @returns {NadaValue}
 */
function wrapperMarcoAsignarImagen(member, [ imagen ], currentStatement) {
    return marcoAsignarImagen([ member, imagen ], currentStatement);
}

/**
 * 
 * @param {EmbedValue} member 
 * @param {Array<TextValue>} param1 
 * @param {CurrentStatement} currentStatement 
 * @returns {NadaValue}
 */
function wrapperMarcoAsignarMiniatura(member, [ imagen ], currentStatement) {
    return marcoAsignarMiniatura([ member, imagen ], currentStatement);
}

/**
 * 
 * @param {EmbedValue} member 
 * @param {Array<TextValue>} param1 
 * @param {CurrentStatement} currentStatement 
 * @returns {NadaValue}
 */
function wrapperMarcoAsignarPie(member, [ pie, imagen ], currentStatement) {
    return marcoAsignarPie([ member, pie, imagen ], currentStatement);
}

/**
 * 
 * @param {EmbedValue} member 
 * @param {Array<TextValue>} param1 
 * @param {CurrentStatement} currentStatement 
 * @returns {NadaValue}
 */
function wrapperMarcoAsignarTítulo(member, [ título ], currentStatement) {
    return marcoAsignarTítulo([ member, título ], currentStatement);
}

const Marco = new Map();
Marco
    .set('agregarCampo',       makeNativeFunction(wrapperMarcoAgregarCampo))
    .set('asignarAutor',       makeNativeFunction(wrapperMarcoAsignarAutor))
    .set('asignarColor',       makeNativeFunction(wrapperMarcoAsignarColor))
    .set('asignarDescripción', makeNativeFunction(wrapperMarcoAsignarDescripción))
    .set('asignarDescripcion', makeNativeFunction(wrapperMarcoAsignarDescripción))
    .set('asignarImagen',      makeNativeFunction(wrapperMarcoAsignarImagen))
    .set('asignarMiniatura',   makeNativeFunction(wrapperMarcoAsignarMiniatura))
    .set('asignarPie',         makeNativeFunction(wrapperMarcoAsignarPie))
    .set('asignarTítulo',      makeNativeFunction(wrapperMarcoAsignarTítulo))
    .set('asignarTitulo',      makeNativeFunction(wrapperMarcoAsignarTítulo))
//#endregion

/**@param {TuberScope} scope*/
function declareNatives(scope) {
    nativeFunctions.forEach(fn => scope.assignVariable(fn.name, makeNativeFunction(fn)));
    
    scope.assignVariable('Número',   makeGlossary(Número));
    scope.assignVariable('Texto',    makeGlossary(Texto));
    scope.assignVariable('Lista',    makeGlossary(Lista));
    scope.assignVariable('Glosario', makeGlossary(Glosario));
    scope.assignVariable('Marco',    makeGlossary(Marco));
    scope.assignVariable('pi',       makeNumber(Math.PI));
    for(const [traducción, original] of colors)
        scope.assignVariable(traducción, makeNumber(original));
}

function TuberInitializerError(message) {
    const error = Error(message);
    error.name = 'TuberInitializerError';
    return error;
}

/**
 * 
 * @param {TuberScope} scope 
 * @param {import('../../commands/Commons/typings.js').ComplexCommandRequest} request 
 * @param {import('./purescript.js').Tubercle} tuber
 * @param {Array<String>} args 
 */
async function declareContext(scope, request, tuber, args) {
    if(tuber.inputs && args != undefined) {
        const argsList = args;
        const attachmentsList = [
            // ...(request.attachments ? request.attachments.map(attachment => attachment.proxyURL)) : ,
            // ...argsList.map(arg => arg.match(fileRegex) ? arg : undefined).filter(arg => arg),
        ];
        const contentsList = argsList.filter(arg => arg);
        
        tuber.inputs.forEach(input => {
            //@ts-expect-error
            let arg = input.isAttachment ? attachmentsList.shift() : contentsList.shift();
            if(!arg) throw TuberInitializerError(`Se esperaba una entrada para "${input.name}"`);
            switch(input.type) {
            case 'Number':
                if(isNotOperable(+arg))
                    throw TuberInitializerError('Se esperaba un Número válido en entrada de Tubérculo');

                scope.assignVariable(input.name, makeNumber(+arg));
                break;
            case 'Text':
                scope.assignVariable(input.name, makeText(arg));
                break;
            case 'Boolean':
                arg = arg.toLowerCase();

                if(![ 'verdadero', 'falso' ].includes(arg))
                    throw TuberInitializerError('Se esperaba "Verdadero" o "Falso" en entrada de Tubérculo');

                scope.assignVariable(input.name, makeBoolean(arg === 'verdadero'))
                break;
            default:
                scope.assignVariable(input.name, makeNada());
            }
        });
    }

    const usuario = createDiscordMember(request.member);
    scope.assignVariable('usuario', makeGlossary(usuario));

    const canal = createDiscordChannel(request.channel);
    scope.assignVariable('canal', makeGlossary(canal));

    const servidor = await createDiscordGuild(request.guild);
    scope.assignVariable('servidor', makeGlossary(servidor));
}

module.exports = {
    declareNatives,
    declareContext,
}