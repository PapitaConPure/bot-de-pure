const UserConfigs = require('./localdata/models/userconfigs');

/**
 * @typedef {'en' | 'es'} LocaleKey
*/

/**@class */
class Translation {
    /**
     * Representa un conjunto de traducciones
     * @param {String} es El texto a mostrar en español
     * @param {String} en El texto a mostrar en inglés
     */
    constructor(es, en) {
        this.es = es;
        this.en = en;
    }

    /**@param {LocaleKey} locale*/
    get(locale) {
        if(![ 'es', 'en' ].includes(locale)) throw RangeError('Clave de lenguaje sin covertura');
        return this[locale];
    }
}

/**
 * @param {Number} i Índice del valor de reemplazo
 * @param {String?} defaultValue Valor por defecto si no se ingresó un valor en el índice
 */
function subl(i, defaultValue) {
    if(i == undefined) throw ReferenceError('Se esperaba un índice de componente de traducción');
    const baseSub = `${i}{...}`
    if(!defaultValue)
        return baseSub;
    return `${baseSub}<?{'${defaultValue}'}`;
}

/**
 * @param {Number} i Índice del valor de comprobación
 * @param {String} condition Condición a evaluar con el valor de comprobación
 * @param {String} whenTrue Valor de reemplazo en caso de verdadero
 * @param {String?} whenFalse Valor de reemplazo en caso de falso
 */
function subif(i, condition, whenTrue, whenFalse = '') {
    if(i == undefined) throw ReferenceError('Se esperaba un índice de componente de traducción');
    if(!whenTrue) throw ReferenceError('Se esperaba un valor para verdadero en componente de traducción');
    return `${i}{...}<!{${condition}|'${whenTrue}'}<?{'${whenFalse}'}`;
}

let localesObject = {
    back: new Translation(
        'Volver',
        'Back',
    ),
    cancel: new Translation(
        'Cancelar',
        'Cancel',
    ),
    finish: new Translation(
        'Finalizar',
        'Finish',
    ),
    cancelledStepName: new Translation(
        'Asistente cancelado',
        'Wizard cancelled',
    ),
    cancelledStepValue: new Translation(
        'Se canceló la configuración de Preferencias de Usuario',
        'The User Preferences configuration was cancelled',
    ),
    cancelledStepFooterName: new Translation(
        'Operación Abortada',
        'Operation Aborted',
    ),
    finishedStepDescription: new Translation(
        'Se cerró el Asistente de Preferencias de Usuario',
        'The User Preferences Wizard has been closed',
    ),
    finishedStepFooterName: new Translation(
        'Operación Finalizada',
        'Operation Concluded',
    ),
    unauthorizedInteraction: new Translation(
        '❌ No puedes hacer eso',
        '❌ You can\'t do that',
    ),
    toggledOn: new Translation(
        'Activado',
        'Enabled',
    ),
    toggledOff: new Translation(
        'Desactivado',
        'Disabled',
    ),
    currentLanguage: new Translation(
        'Español',
        'English',
    ),

    feedSelectFeed: new Translation(
        'Selecciona un Feed...',
        'Select a Feed...',
    ),
    feedViewTagsLinkName: new Translation(
        'Seguir Tags',
        'Follow Tags',
    ),
    feedSetTagsAdd: new Translation(
        `Se comenzaron a seguir las tags: ${subl(0)}`,
        `Started following the tags: ${subl(0)}`,
    ),
    feedSetTagsRemove: new Translation(
        `Se dejaron de seguir las tags: ${subl(0)}`,
        `Stopped following the tags: ${subl(0)}`,
    ),
    feedSetTagsUnchanged: new Translation(
        '⚠ No se modificaron las tags seguidas. Asegúrate de estar siguiendo 6 tags o menos',
        '⚠ Followed tags were not modified. Make sure not to be following more than 6 tags',
    ),
    feedSetTagsButtonView: new Translation(
        'Ver Tags Seguidas',
        'View Followed Tags',
    ),
    feedSetTagsButtonAdd: new Translation(
        'Seguir Tags',
        'Follow Tags',
    ),
    feedSetTagsButtonRemove: new Translation(
        'Dejar de Seguir Tags',
        'Unfollow Tags',
    ),
    feedEditTagsTitleAdd: new Translation(
        'Seguir Tags...',
        'Follow Tags...',
    ),
    feedEditTagsTitleRemove: new Translation(
        'Dejar de Seguir Tags...',
        'Unfollow Tags...',
    ),
    feedEditTagsInputAdd: new Translation(
        'Elige qué tags quieres seguir',
        'Choose which tags you wanna follow',
    ),
    feedEditTagsInputRemove: new Translation(
        'Elige qué tags quieres dejar de seguir',
        'Choose which tags you wanna unfollow',
    ),

    yoDashboardAuthor: new Translation(
        'Preferencias de Usuario',
        'User Preferences',
    ),
    yoDashboardLanguageName: new Translation(
        'Idioma',
        'Language',
    ),
    yoDashboardFeedTagsName: new Translation(
        'Tags de Feed seguidas',
        'Followed Feed Tags',
    ),
    yoDashboardFeedTagsValue: new Translation(
        `<:tagswhite:921788204540100608> Siguiendo ${subl(0)} tag${subif(0, '!=1', 's')} en ${subl(1)} canal${subif(1, '!=1', 'es')}`,
        `<:tagswhite:921788204540100608> Following ${subl(0)} tag${subif(0, '!=1', 's')} in ${subl(1)} channel${subif(1, '!=1', 's')}`,
    ),
    yoDashboardName: new Translation(
        'Panel Principal',
        'Dashboard',
    ),
    yoDashboardButtonLanguage: new Translation(
        'English',
        'Español',
    ),
    yoDashboardButtonTags: new Translation(
        'Tags Seguidas...',
        'Followed Tags...',
    ),
    yoSelectTagsChannelTitle: new Translation(
        'Selecciona uno de tus Feeds seguidos',
        'Select one of the Feeds you follow',
    ),
    yoTagsName: new Translation(
        'Tags Seguidas',
        'Followed Tags',
    ),
    yoTagsValueDefault: new Translation(
        '<Todavía no sigues ninguna tag>',
        '<You aren\'t following any tag yet>',
    ),
};

//Engañar al intérprete para guardar las claves de textMap en LocaleIds
const locales = new Map(Object.entries(localesObject));
localesObject = null;
delete localesObject;

/**@type {Map<'='|'!='|'<'|'>'|'<='|'>=', (a, b) => Boolean>}*/
const conditionals = new Map();
conditionals
    .set('=',  (a, b) => a === b)
    .set('!=', (a, b) => a !== b)
    .set('<',  (a, b) => a <   b)
    .set('>',  (a, b) => a >   b)
    .set('<=', (a, b) => a <=  b)
    .set('>=', (a, b) => a >=  b);

/**
 * Muestra un texto localizado según la configuración del usuario
 * @typedef {keyof localesObject} LocaleIds id de texto a mostrar en forma localizada
 * @param {LocaleIds} id id de texto a mostrar en forma localizada
 * @param {LocaleKey} locale lenguaje al cual localizar el texto
 * @param {...String} values variables a insertar en el texto seleccionado como reemplazos de campos designados
 */
function getText(id, locale, ...values) {
    const localeSet = locales.get(id);
    if(!localeSet) throw ReferenceError(`Se esperaba una id de texto localizado válido. Se recibió: ${id}`);
    const translationTemplate = localeSet[locale];
    if(!translationTemplate) throw RangeError(`Se esperaba una clave de localización válida. Se recibió: ${id} :: ${locale}`);

    //Ejemplo: 1{...}<?{'por defecto'}
    const subLocaleRegex = /(\d+){\.\.\.}(?:<!{((?:[=<>]{1}|(?:[!<>]=))[0-9]+)\|'((?:(?!'}).)*)'})?(?:<\?{'((?:(?!'}).)*)'})?/g;
    const translation = translationTemplate.replace(subLocaleRegex, (_, i, condition, whenTrue, defaultValue) => {
        const value = values[i];

        if(condition != undefined) {
            const divisionChar = condition.match(/[0-9]/gi)[0];
            const leftValue = `${value}`;
            let cursor = 0;
            let operator = '';
            let rightValue = '';
            while(condition[cursor] !== divisionChar) {
                operator += condition[cursor];
                cursor++;
            }
            while(cursor < condition.length) {
                rightValue += condition[cursor];
                cursor++;
            }
            const conditionFn = conditionals.get(operator);
            return conditionFn(leftValue, rightValue) ? whenTrue : (defaultValue ?? '');
        }
        
        if(value != undefined)
            return value;
        
        if(defaultValue != undefined)
            return defaultValue;

        throw ReferenceError(`Se esperaba un valor de reemplazo en índice [${i}] para texto localizado ${id} :: ${locale}`);
    });

    return translation;
}

/**Clase de traducción de contenidos*/
class Translator {
    #locale

    /**@param {LocaleKey} locale lenguaje al cual localizar el texto*/
    constructor(locale) {
        if(!locale) throw new ReferenceError('Un Translator requiere un lenguaje para operar');
        this.#locale = locale;
    }

    /**
     * Muestra un texto localizado según la configuración del usuario
     * @param {LocaleIds} id id de texto a mostrar en forma localizada
     * @param {...String} values variables a insertar en el texto seleccionado como reemplazos de campos designados
     */
    getText(id, ...values) {
        return getText(id, this.#locale, ...values);
    }

    /**
     * Determina si el traductor es del lenguaje ingresado
     * @param {LocaleKey} locale 
     */
    is(locale) {
        return this.#locale === locale;
    }

    /**El lenguaje del traductor*/
    get locale() {
        return this.#locale;
    }

    /**
     * Devuelve la siguiente clave del lenguaje del traductor actual
     * @returns {LocaleKey}
     */
    get next() {
        if(this.is('en')) return 'es';
        return 'en';
    }
}

/**@type {Map<String, LocaleKey>}*/
const userLocalesCache = new Map();

/**
 * Guarda una ID en caché para posterior uso
 * @param {String} userId 
 */
async function cacheLocale(userId) {
    const userQuery = { userId };
    let userConfigs = await UserConfigs.findOne(userQuery);
    if(!userConfigs) {
        userConfigs = new UserConfigs(userQuery);
        await userConfigs.save();
    }

    return userLocalesCache.set(userId, userConfigs.language);
}

/**
 * Devuelve el lenguaje vinculado a la ID de usuario cacheada.
 * Si la ID no está cacheada, se realiza una llamada a la base de datos, se cachea el lenguaje del usuario y se devuelve lo obtenido
 * @param {String} userId 
 * @returns {Promise<LocaleKey>}
 */
async function fetchLocaleFor(userId) {
    console.log(userId, '?', userLocalesCache);
    if(!userLocalesCache.has(userId))
        await cacheLocale();
    
    return userLocalesCache.get(userId);
}

async function recacheLocale(userId) {
    return cacheLocale(userId);
}

module.exports = {
    getText,
    Translator,
    fetchLocaleFor,
    recacheLocale,
};