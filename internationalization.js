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
        if(!es) throw ReferenceError('Se esperaba un texto en español');
        if(!en) throw ReferenceError('Se esperaba un texto en inglés');
        this.es = es;
        this.en = en;
    }

    /**@param {LocaleKey} locale*/
    get(locale) {
        if(![ 'es', 'en' ].includes(locale)) throw RangeError('Clave de lenguaje sin covertura');
        return this[locale];
    }
}

/**@param {...String} lines*/
function paragraph(...lines) {
    return lines.join('\n');
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
    currentLanguage: new Translation(
        'Español',
        'English',
    ),
    dmDisclaimer: new Translation(
        'Nota: Bot de Puré no opera con mensajes privados',
        'Note: Bot de Puré does not reply to DMs',
    ),
    dmInteraction: new Translation(
        '❌ Solo respondo a comandos en servidores',
        '❌ I only respond to commands on servers',
    ),
    blockedInteraction: new Translation(
        paragraph(
            '⛔ Probablemente usaste un comando mientras me reiniciaba. Usa el comando nuevamente en unos segundos y debería funcionar',
            'Si el comando se sigue rechazando, es posible que esté en mantenimiento o que no tenga suficientes permisos en este canal',
            `Si no sabes la causa, puedes notificarle el problema a mi creador: <@${subl(0)}>`,
        ),
        paragraph(
            '⛔ You probably used a command while I was restarting. Use the command again in a few seconds and it should work',
            'If the command keeps getting rejected, I may be in maintenance or not have enough permissions in this channel',
            `If you're not sure, you can tell my creator about the problem: <@${subl(0)}>`,
        ),
    ),
    unknownInteraction: new Translation(
        '🍔 Recibí una acción, pero no sé cómo responderla. Esto es un problema... mientras arreglo algunas cosas, toma una hamburguesa',
        '🍔 I received an action, but I don\'t know how to reply to it. This is a problem... while I fix some things, take this burger',
    ),
    huskInteraction: new Translation(
        '☕ Parece que encontraste un botón, menú desplegable o ventana modal sin función. Mientras conecto algunos cables, ten un café',
        '☕ Seems like you found a button, select menu, or modal window without a function. While I wire some things up, take this coffee',
    ),
    unauthorizedInteraction: new Translation(
        '❌ No puedes hacer eso',
        '❌ You can\'t do that',
    ),

    buttonCreate: new Translation(
        'Crear',
        'Create',
    ),
    buttonDelete: new Translation(
        'Eliminar',
        'Delete',
    ),
    buttonEdit: new Translation(
        'Editar',
        'Edit',
    ),
    buttonCustomize: new Translation(
        'Personalizar',
        'Customize',
    ),
    buttonView: new Translation(
        'Ver',
        'View',
    ),
    buttonBack: new Translation(
        'Volver',
        'Back',
    ),
    buttonCancel: new Translation(
        'Cancelar',
        'Cancel',
    ),
    buttonFinish: new Translation(
        'Finalizar',
        'Finish',
    ),

    cancelledStepName: new Translation(
        'Asistente cancelado',
        'Wizard cancelled',
    ),
    cancelledStepFooterName: new Translation(
        'Operación Abortada',
        'Operation Aborted',
    ),
    finishedStepFooterName: new Translation(
        'Operación Finalizada',
        'Operation Concluded',
    ),
    toggledOn: new Translation(
        'Activado',
        'Enabled',
    ),
    toggledOff: new Translation(
        'Desactivado',
        'Disabled',
    ),
    goToUserPreferences: new Translation(
        'Preferencias de Usuario',
        'User Preferences',
    ),
    
    feedAuthor: new Translation(
        'Asistente de configuración de Feed de imágenes',
        'Imageboard Feed Configuration Wizard',
    ),
    feedCancelledStep: new Translation(
        'Se canceló la configuración de Feeds',
        'The Feeds Wizard has been terminated',
    ),
    feedFinishedStep: new Translation(
        'Se finalizó la configuración de Feeds',
        'The Feeds Wizard has been closed',
    ),
    feedSelectFeed: new Translation(
        'Selecciona un Feed...',
        'Select a Feed...',
    ),
    feedViewUrlsName: new Translation(
        'Enlaces',
        'Links',
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
        'Tags que quieres seguir, sin comas',
        'Tags you wanna follow, without commas',
    ),
    feedEditTagsInputRemove: new Translation(
        'Tags a dejar de seguir, sin comas',
        'Tags you wanna unfollow, without commas',
    ),
    feedDeletePostTitle: new Translation(
        'Post Eliminado',
        'Post Deleted',
    ),
    feedDeletePostAdvice: new Translation(
        'Puedes blacklistear tags si colocas un "-" delante',
        'You can blacklist a tag if you put a "-" in front',
    ),
    feedDeletePostTagsName: new Translation(
        'Tags Rescatadas',
        'Recovered Tags',
    ),
    feedDeletePostLinkName: new Translation(
        'Enlace',
        'Link',
    ),

    booruNotifTitle: new Translation(
        'Notificación de Feed Suscripto',
        'Subscribed Feed Notification',
    ),
    booruNotifDescription: new Translation(
        '¡Esta publicación podría interesarte!',
        'This post could catch your eye!',
    ),
    booruNotifTagsName: new Translation(
        'Tags de Interés',
        'Tags of Interest',
    ),

    yoCancelledStep: new Translation(
        'Se canceló la configuración de Preferencias de Usuario',
        'The User Preferences configuration was cancelled',
    ),
    yoFinishedStep: new Translation(
        'Se cerró el Asistente de Preferencias de Usuario',
        'The User Preferences Wizard has been closed',
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

/**@type {Map<String, LocaleKey>}*/
const userLocalesCache = new Map();

/**
 * Guarda una ID en caché para uso posterior
 * @param {String} userId 
 */
async function cacheLocale(userId) {
    if(!userId) throw ReferenceError('Se esperaba una ID de usuario');
    const userQuery = { userId };
    let userConfigs = await UserConfigs.findOne(userQuery);
    if(!userConfigs) {
        userConfigs = new UserConfigs(userQuery);
        await userConfigs.save();
    }

    return userLocalesCache.set(userId, userConfigs.language);
}

/**
 * Sobreescribe una ID en caché para uso posterior
 * @param {String} userId 
 */
async function recacheLocale(userId) {
    return cacheLocale(userId);
}

/**
 * Devuelve el lenguaje vinculado a la ID de usuario cacheada.
 * Si la ID no está cacheada, se realiza una llamada a la base de datos, se cachea el lenguaje del usuario y se devuelve lo obtenido
 * @param {String} userId 
 * @returns {Promise<LocaleKey>}
 */
async function fetchLocaleFor(userId) {
    if(!userId) throw ReferenceError('Se esperaba una ID de usuario al recolectar lenguaje');
    if(!userLocalesCache.has(userId))
        await cacheLocale(userId);
    
    return userLocalesCache.get(userId);
}

/**Clase de traducción de contenidos*/
class Translator {
    #locale

    /**@param {LocaleKey} locale lenguaje al cual localizar el texto*/
    constructor(locale) {
        if(!locale) throw ReferenceError('Un Translator requiere un lenguaje para operar');
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

    /**@param {String} userId*/
    static async from(userId) {
        const locale = await fetchLocaleFor(userId);
        return new Translator(locale);
    }
}

module.exports = {
    recacheLocale,
    Translator,
};