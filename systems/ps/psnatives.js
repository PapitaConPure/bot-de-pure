const { TuberScope } = require('./psscope.js');
const { randRange, fetchUserID, shortenText, rand, fetchMember, fetchChannel, fetchRole } = require('../../func.js');
const {
    RuntimeValue,
    NumericValue,
    TextValue,
    BooleanValue,
    ListValue,
    GlossaryValue,
    EmbedValue,
    NadaValue,
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

/**@typedef {{ number: Number, name: String }} CurrentStatement*/

//#region Discord
//#region Colores
/**@type {Map<String, import('discord.js').ColorResolvable>}*/
const colors = new Map();
colors
    .set('colorAleatorio',     'RANDOM')
    .set('colorAmarillo',      'YELLOW')
    .set('colorAqua',          'AQUA')
    .set('colorAquaOscuro',    'DARK_AQUA')
    .set('colorAzul',          'BLUE')
    .set('colorAzulOscuro',    'DARK_BLUE')
    .set('colorBlanco',        'WHITE')
    .set('colorCasiNegro',     'DARK_BUT_NOT_BLACK')
    .set('colorDiscord',       'BLURPLE')
    .set('colorDorado',        'GOLD')
    .set('colorDoradoOscuro',  'DARK_GOLD')
    .set('colorFucsia',        'FUCHSIA')
    .set('colorGris',          'GREY')
    .set('colorGrisClaro',     'LIGHT_GREY')
    .set('colorGrisNegro',     'DARKER_GREY')
    .set('colorGrisOscuro',    'DARK_GREY')
    .set('colorGríspura',      'GREYPLE')
    .set('colorMarino',        'NAVY')
    .set('colorMarinoOscuro',  'DARK_NAVY')
    .set('colorNaranja',       'ORANGE')
    .set('colorNaranjaOscuro', 'DARK_ORANGE')
    .set('colorNegro',         'NOT_QUITE_BLACK')
    .set('colorPúrpura',       'PURPLE')
    .set('colorPúrpuraOscuro', 'DARK_PURPLE')
    .set('colorRojo',          'RED')
    .set('colorRojoOscuro',    'DARK_RED')
    .set('colorRosaClaro',     'LUMINOUS_VIVID_PINK')
    .set('colorRosaOscuro',    'DARK_VIVID_PINK')
    .set('colorVerde',         'GREEN')
    .set('colorVerdeOscuro',   'DARK_GREEN');
//#endregion

/**
 * @param {[ EmbedValue, TextValue, TextValue ]} param0 
 * @param {CurrentStatement} currentStatement
 */
function marcoAgregarCampo([marco, nombre, valor], currentStatement) {
    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
    if(isNotValidText(nombre))
        throw TuberInterpreterError('Se esperaba un Texto válido para el nombre del campo de Marco', currentStatement);
    if(isNotValidText(valor))
        throw TuberInterpreterError('Se esperaba un Texto válido para el valor del campo de Marco', currentStatement);

    marco.value.addFields({ name: nombre.value, value: valor.value });
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
 * @param {[ EmbedValue, TextValue ]} param0 
 * @param {CurrentStatement} currentStatement
 */
function marcoAsignarColor([marco, color], currentStatement) {
    if(marco?.type !== 'Embed')
        throw TuberInterpreterError('Se esperaba un Marco de primer argumento', currentStatement);
    if(isNotValidText(color))
        throw TuberInterpreterError('Se esperaba un Texto válido para el color del Marco (hexadecimal o predefinido)', currentStatement);

    try {
        marco.value.setColor(color.value);
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
 * @param {import('discord.js').GuildChannel | import('discord.js').TextChannel | import('discord.js').VoiceChannel} channel 
 */
function createDiscordChannel(channel) {
    const isNSFW = channel.nsfw
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
    const iconUrl = guild.iconURL({ format: 'jpg', size: 512 });
    const description = guild.description;
    const systemChannel = guild.systemChannel;
    const bannerUrl = guild.bannerURL({ format: 'jpg', size: 1024 });
    const premiumTier = guild.premiumTier === 'NONE' ? 'Ninguno' : guild.premiumTier.replace('TIER_', 'Nivel ');
    const splashUrl = guild.splashURL({ format: 'jpg', size: 512 });

    /**@type {Map<String, RuntimeValue>}*/
    const servidor = new Map()
        .set('id',               makeText(guild.id))
        .set('nombre',           makeText(guild.name))
        .set('ícono',            iconUrl ? makeText(iconUrl) : makeNada())
        .set('descripción',      description ? makeText(description) : makeNada())
        .set('canalSistema',     systemChannel ? makeGlossary(createDiscordChannel(systemChannel)) : makeNada())
        .set('cartel',           bannerUrl ? makeGlossary(bannerUrl) : makeNada())
        .set('nivel',            makeText(premiumTier))
        .set('imagenInvitación', splashUrl ? makeGlossary(splashUrl) : makeNada())
        .set('dueño',            makeGlossary(createDiscordMember(await guild.fetchOwner())));

    return servidor;
}

/**
 * @param {Array<RuntimeValue>} param0
 * @param {CurrentStatement} currentStatement
 * @param {import('../../commands/Commons/typings.js').CommandRequest} request
 */
function buscarMiembro([búsqueda], currentStatement, _, request) {
    if(isNotValidText(búsqueda))
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
    if(isNotValidText(búsqueda))
        throw TuberInterpreterError('Se esperaba un texto de búsqueda de canal como argumento de función', currentStatement);

    const canal = fetchChannel(búsqueda.value, request.guild);
    if(!canal)
        return makeNada();

    return makeGlossary(createDiscordChannel(canal));
}

/**
 * @param {Array<RuntimeValue>} param0
 * @param {CurrentStatement} currentStatement
 * @param {import('../../commands/Commons/typings.js').CommandRequest} request
 */
function buscarRol([búsqueda], currentStatement, _, request) {
    if(isNotValidText(búsqueda))
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
        return makeNumber(rand(x.value, true) + y.value);
    
    if(y.type !== 'Number' || isNotOperable(y.value))
        throw TuberInterpreterError('Se esperaba un Número o Dupla de segundo argumento', currentStatement);

    if(z == undefined)
        return makeNumber(randRange(x.value, y.value));
    
    if(z.type !== 'Boolean')
        throw TuberInterpreterError('Se esperaba una Dupla de tercer argumento', currentStatement);

    return makeNumber(randRange(x.value, y.value, true) + z.value);
}

/**@type {Array<Function>}*/
const nativeFunctions = [
    dado,

    esNúmero,
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
    if(isNotValidText(texto))
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de búsqueda de sub-texto', currentStatement);
    
    return makeNumber(member.value.indexOf(texto.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoÚltimaPosiciónDe(member, [texto], currentStatement) {
    if(isNotValidText(texto))
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de búsqueda de sub-texto', currentStatement);
    
    return makeNumber(member.value.lastIndexOf(texto.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoComienzaCon(member, [texto], currentStatement) {
    if(isNotValidText(texto))
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de comprobación de sub-texto', currentStatement);
    
    return makeBoolean(member.value.startsWith(texto.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoTerminaCon(member, [texto], currentStatement) {
    if(isNotValidText(texto))
        throw TuberInterpreterError('Se esperaba un Texto válido como argumento de comprobación de sub-texto', currentStatement);
    
    return makeBoolean(member.value.endsWith(texto.value));
}

/**
 * @param {TextValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 */
function textoIncluye(member, [texto], currentStatement) {
    if(isNotValidText(texto))
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
        return makeText();
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
    if(isNotValidText(ocurrencia))
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
    if(isNotValidText(separador))
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
 * @param {CurrentStatement} currentStatement
 */
function textoAMinúsculas(member, _) {    
    return makeText(member.value.toLowerCase());
}

/**
 * @param {TextValue} member
 * @param {CurrentStatement} currentStatement
 */
function textoAMayúsculas(member, _) {    
    return makeText(member.value.toUpperCase());
}

/**
 * @param {TextValue} member
 * @param {CurrentStatement} currentStatement
 */
function textoNormalizar(member, _) {    
    return makeText(member.value.trim());
}

/**
 * @param {TextValue} member
 * @param {CurrentStatement} currentStatement
 */
function aLista(member, _) {    
    return makeList([ ...member.value ].map(character => makeText(character)));
}

/**@type {Map<String, NativeFunctionValue>}*/
const Texto = new Map();
Texto
    .set('caracterEn',       makeNativeFunction(textoCaracterEn))
    .set('posiciónDe',       makeNativeFunction(textoPosiciónDe))
    .set('últimaPosiciónDe', makeNativeFunction(textoÚltimaPosiciónDe))
    .set('comienzaCon',      makeNativeFunction(textoComienzaCon))
    .set('terminaCon',       makeNativeFunction(textoTerminaCon))
    .set('incluye',          makeNativeFunction(textoIncluye))
    .set('repetir',          makeNativeFunction(textoRepetir))
    .set('reemplazar',       makeNativeFunction(textoReemplazar))
    .set('partir',           makeNativeFunction(textoPartir))
    .set('cortar',           makeNativeFunction(textoCortar))
    .set('aMinúsculas',      makeNativeFunction(textoAMinúsculas))
    .set('aMayúsculas',      makeNativeFunction(textoAMayúsculas))
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
 * @returns {TextValue}
 */
function listaVacía(member, _) {
    return makeBoolean(member.elements.length === 0);
}

/**
 * @param {ListValue} member
 * @param {Array<RuntimeValue>} param1
 * @param {CurrentStatement} currentStatement
 * @returns {TextValue}
 */
function listaIncluye(member, [ criteria ], currentStatement) {
    if(criteria == undefined)
        throw TuberInterpreterError('Se esperaba un valor como argumento de búsqueda en Lista', currentStatement);
    return makeBoolean(member.elements.some(el => el.value === criteria.value));
}

/**
 * @param {ListValue} member
 * @param {CurrentStatement} currentStatement
 */
function listaInvertir(member, _) {    
    return makeList(member.elements.slice().reverse());
}

/**
 * @param {ListValue} member
 * @param {CurrentStatement} currentStatement
 */
function listaOrdenar(member, _) {
    return makeList(member.elements.slice().sort((a, b) => (a.value < b.value) ? -1 : 1));
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
        return makeText(member.elements.slice(inicio.value));
    if(fin.type !== 'Number' || isNotOperable(fin.value))
        throw TuberInterpreterError('Se esperaba un Número válido como segundo argumento de recorte de Lista', currentStatement);
    // const pos1 = calculatePositionOffset(inicio.value, member.elements.length);
    // const pos2 = calculatePositionOffset(fin.value,    member.elements.length);

    return makeText(member.elements.slice(inicio.value, fin.value));
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
 * @param {CurrentStatement} currentStatement
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
    .set('incluye',      makeNativeFunction(listaIncluye))
    .set('invertir',     makeNativeFunction(listaInvertir))
    .set('ordenar',      makeNativeFunction(listaOrdenar))
    .set('cortar',       makeNativeFunction(listaCortar))
    .set('último',       makeNativeFunction(listaÚltimo))
    .set('robar',        makeNativeFunction(listaRobar))
    .set('robarPrimero', makeNativeFunction(listaRobarPrimero))
    .set('robarÚltimo',  makeNativeFunction(listaRobarÚltimo))
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
    .set('nombres',      makeNativeFunction(glosarioClaves))
    .set('valores',     makeNativeFunction(glosarioValores))
    .set('miembros',    makeNativeFunction(glosarioPropiedades));
//#endregion

/**@param {TuberScope} scope*/
function declareNatives(scope) {
    nativeFunctions.forEach(fn => scope.assignVariable(fn.name, makeNativeFunction(fn)));
    
    scope.assignVariable('Número',   makeGlossary(Número));
    scope.assignVariable('Texto',    makeGlossary(Texto));
    scope.assignVariable('Lista',    makeGlossary(Lista));
    scope.assignVariable('Glosario', makeGlossary(Glosario));
    scope.assignVariable('pi',       makeNumber(Math.PI));
    for(const [traducción, original] of colors)
        scope.assignVariable(traducción, makeText(original));
}

function TuberInitializerError(message) {
    const error = Error(message);
    error.name = 'TuberInitializerError';
    return error;
}

/**
 * 
 * @param {TuberScope} scope 
 * @param {import('../../commands/Commons/typings.js').CommandRequest} request 
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
            let arg = input.isAttachment ? attachmentsList.shift() : contentsList.shift();
            if(!arg) throw TuberInitializerError(`Se esperaba una entrada para "${input.name}"`);
            let makeFunction;
            switch(input.type) {
            case 'Number':
                makeFunction = makeNumber;
                arg = parseFloat(arg);
                if(isNotOperable(arg))
                    throw TuberInitializerError('Se esperaba un Número válido en entrada de Tubérculo');
                break;
            case 'Text':
                makeFunction = makeText;
                break;
            case 'Boolean':
                makeFunction = makeBoolean;
                arg = arg.toLowerCase();
                if(![ 'verdadero', 'falso' ].includes(arg))
                    throw TuberInitializerError('Se esperaba "Verdadero" o "Falso" en entrada de Tubérculo');
                arg = arg === 'verdadero';
                break;
            default:
                makeFunction = makeNada;
            }
            scope.assignVariable(input.name, makeFunction(arg));
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