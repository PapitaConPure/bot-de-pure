const { fetchUserCache } = require('./usercache.js');

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
            'También puede deberse a que estés banneado de usar a Bot de Puré',
            `Si no sabes la causa, puedes notificarle el problema a mi creador: <@${subl(0)}>`,
        ),
        paragraph(
            '⛔ You probably used a command while I was restarting. Use the command again in a few seconds and it should work',
            'If the command keeps getting rejected, I may be in maintenance or not have enough permissions in this channel',
            'It may also be because you were banned from using Bot de Puré',
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
    expiredWizardData: new Translation(
        '❌ Este asistente hace uso de memoria de sesión, pero no se encontró ninguna sesión. Vuelve a usar el comando para crear una nueva sesión de este asistente',
        '❌ This Wizard uses session memory, but no session was found. Use the command again to start a new session of this Wizard',
    ),

    invalidInput: new Translation(
        '⚠️️ Entrada inválida',
        '⚠️️ Invalid input',
    ),
    invalidNumber: new Translation(
        '⚠️️ Número inválido',
        '⚠️️ Invalid number',
    ),
    invalidId: new Translation(
        '⚠️️ ID inválida',
        '⚠️️ Invalid ID',
    ),
    invalidUser: new Translation(
        '⚠️️ Usuario inválido',
        '⚠️️ Invalid number',
    ),
    invalidMember: new Translation(
        '⚠️️ Miembro inválido',
        '⚠️️ Invalid member',
    ),
    invalidRole: new Translation(
        '⚠️️ Rol inválido',
        '⚠️️ Invalid role',
    ),
    invalidChannel: new Translation(
        '⚠️️ Canal inválido',
        '⚠️️ Invalid channel',
    ),
    invalidMessage: new Translation(
        '⚠️️ Mensaje inválido',
        '⚠️️ Invalid message',
    ),
    invalidTime: new Translation(
        '⚠️️ Tiempo inválido',
        '⚠️️ Invalid time',
    ),

    welcome: new Translation(
        'Bienvenido',
        'Welcome',
    ),
    name: new Translation(
        'Nombre',
        'Name',
    ),
    description: new Translation(
        'Descripción',
        'Description',
    ),
    icon: new Translation(
        'Ícono',
        'Icon',
    ),
    hours: new Translation(
        'Horas',
        'Hours',
    ),
    minutes: new Translation(
        'Minutos',
        'Minutes',
    ),
    seconds: new Translation(
        'Segundos',
        'Seconds',
    ),

    buttonStart: new Translation(
        'Comenzar',
        'Start',
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
    
    actionDeleteUserPost: new Translation(
        'Borrar Post',
        'Delete Post',
    ),

    cancelledStepName: new Translation(
        'Asistente cancelado',
        'Wizard cancelled',
    ),
    welcomeStepFooterName: new Translation(
        'Bienvenida',
        'Welcome',
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

    cultivarUnauthorized: new Translation(
        `¡Solo puedes cultivar una vez por día! Podrás volver a cultivar <t:${subl(0)}:R>`,
        `You can only cultivate once per day! You'll be able to cultivate again <t:${subl(0)}:R>`,
    ),
    cultivarTitle: new Translation(
        '¡Cultivaste papas!',
        'You grew potatoes!',
    ),
    cultivarDescription: new Translation(
        `Ahora tienes <:prc:1097208828946301123> ${subl(0)}`,
        `You now have <:prc:1097208828946301123> ${subl(0)}`,
    ),

    transferInputExpected: new Translation(
        '⚠️ Se esperaba que especifiques el monto a transferir y el usuario objetivo',
        '⚠️ Amount to transfer and target user to expected',
    ),
    transferHumanExpected: new Translation(
        '❌ No se puede transferir PRC a bots',
        '❌ Can\'t transfer PRC to bots',
    ),
    transferOtherExpected: new Translation(
        '❌ No puedes transferirte a ti mismo',
        '❌ You can\'t transfer PRC to yourself',
    ),
    transferInsufficient: new Translation(
        '⚠️ Saldo insuficiente',
        '⚠️ Insufficient funds',
    ),
    transferTitle: new Translation(
        'Transferencia completada',
        'Transfer completed',
    ),
    transferAuthorName: new Translation(
        'Comprobante de pago',
        'Receipt of payment',
    ),
    transferFromName: new Translation(
        'De',
        'From',
    ),
    transferForName: new Translation(
        'Para',
        'To',
    ),
    transferAmountName: new Translation(
        'Monto',
        'Amount',
    ),
    transferCodeName: new Translation(
        'Código de referencia',
        'Reference Code',
    ),

    poll: new Translation(
        'Encuesta',
        'Poll',
    ),
    pollWizardAuthor: new Translation(
        'Asistente de configuración de Encuestas',
        'Poll Configuration Wizard',
    ),
    pollResultsAuthor: new Translation(
        'Resultados de encuesta',
        'Poll results',
    ),
    pollCancelledStep: new Translation(
        'Se canceló la configuración de Encuesta',
        'The Polls Wizard has been terminated',
    ),
    pollFinishedStep: new Translation(
        'Se finalizó la configuración de Encuesta',
        'The Polls Wizard has been closed',
    ),
    pollOngoingStepFooterName: new Translation(
        'Encuesta en progreso',
        'Poll in progress',
    ),
    pollConcludedStepFooterName: new Translation(
        'Encuesta finalizada',
        'Poll concluded',
    ),
    pollWelcomeValue: new Translation(
        'Este asistente te guiará para realizar una encuesta al server. Comienza cuando gustes',
        'This Wizard will guide you through making a server poll. Start whenever you want',
    ),
    pollQuestionPromptTitle: new Translation(
        'Haz una Pregunta',
        'Ask a question',
    ),
    pollQuestion: new Translation(
        'Pregunta',
        'Question',
    ),
    pollAnswersName: new Translation(
        'Lista de Respuestas',
        'Answers List',
    ),
    pollAnswersValueEmpty: new Translation(
        'No has añadido respuestas todavía',
        'You haven\'t added any answers yet',
    ),
    pollAnswerPromptInput: new Translation(
        'Respuesta',
        'Answer',
    ),
    pollAnswersFooterName: new Translation(
        'Respuestas',
        'Answers',
    ),
    pollFinishTitle: new Translation(
        'Finalizar creación',
        'Finish configuration',
    ),
    pollFinishTimeName: new Translation(
        'Duración de Encuesta',
        'Poll Duration',
    ),
    pollFinishFooterName: new Translation(
        'Finalizar',
        'Finish',
    ),
    pollFinishButtonBegin: new Translation(
        'Iniciar en...',
        'Begin in...',
    ),
    pollFinishButtonReset: new Translation(
        'Reestablecer',
        'Reset',
    ),
    pollAnswerPromptTitleAdd: new Translation(
        'Añadir Respuesta',
        'Add Answer',
    ),
    pollAnswerPromptTitleRemove: new Translation(
        'Quitar Respuesta',
        'Remove Answer',
    ),
    pollChannelPromptTitle: new Translation(
        'Enviar Encuesta',
        'Send Poll',
    ),
    pollChannelPollLabel: new Translation(
        'Canal de encuesta',
        'Poll Channel',
    ),
    pollChannelPollPlaceholder: new Translation(
        'Nombre, #nombre o ID',
        'Name, #name or ID',
    ),
    pollChannelResultsLabel: new Translation(
        'Canal de resultados',
        'Results Channel',
    ),
    pollChannelResultsPlaceholder: new Translation(
        'Nombre, #nombre, ID o nada',
        'Name, #name, ID or nothing',
    ),
    pollTimePromptTitle: new Translation(
        'Modificar tiempo',
        'Modify time',
    ),
    pollResultsName: new Translation(
        'Respuestas de encuesta',
        'Poll Answers',
    ),
    pollEndTimeName: new Translation(
        'Finalización',
        'Conclusion',
    ),
    pollVoteReportAuthor: new Translation(
        'Voto recibido',
        'Vote received',
    ),
    pollVoteReportDeleted: new Translation(
        '_<Eliminó su voto>_',
        '_<Removed their vote>_',
    ),
    pollVoteSuccess: new Translation(
        '✅ ¡Voto registrado!',
        '✅ Vote registered!',
    ),
    pollVoteSwapSuccess: new Translation(
        '✅ ¡Voto cambiado!',
        '✅ Vote swapped!',
    ),
    pollVoteRemoveSuccess: new Translation(
        '✅ Voto eliminado',
        '✅ Vote deleted',
    ),
    pollVoteError: new Translation(
        '⚠️ ¡Parece que la encuesta ya terminó!',
        '⚠️ Seems like the poll has ended!',
    ),
    pollButtonToggleAnon: new Translation(
        'Voto anónimo',
        'Anonymous vote',
    ),
    pollInsufficientTime: new Translation(
        '⚠️ ¡Tiempo insuficiente! Pon al menos 10 segundos',
        '⚠️ Insufficient time! Set at least 10 seconds',
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
        '⚠️ No se modificaron las tags seguidas. Asegúrate de estar siguiendo 6 tags o menos',
        '⚠️ Followed tags were not modified. Make sure not to be following more than 6 tags',
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
    yoDashboardPRCName: new Translation(
        'Créditos',
        'Credits',
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
    yoDashboardMenuConfig: new Translation(
        'Preferencias',
        'Preferences',
    ),
    yoDashboardMenuConfigFeedDesc: new Translation(
        'Administra tus tags seguidas en Feeds de imágenes',
        'Preferences',
    ),
    yoDashboardMenuConfigPixixDesc: new Translation(
        'Corrige el formato de enlaces de pixiv automáticamente',
        'Fixes pixiv embeds automatically',
    ),
    yoDashboardMenuConfigTwitterDesc: new Translation(
        'Corrige el formato de enlaces de Twitter automáticamente (VX/FX)',
        'Fixes Twitter embeds automatically (VX/FX)',
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

/**@typedef {keyof localesObject} LocaleIds id de texto a mostrar en forma localizada*/

/**Clase de traducción de contenidos*/
class Translator {
    #locale;

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
        return Translator.getText(id, this.#locale, ...values);
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
        const userCache = await fetchUserCache(userId);
        return new Translator(userCache.language);
    }

    /**
     * Muestra un texto localizado según la configuración del usuario
     * @param {LocaleIds} id id de texto a mostrar en forma localizada
     * @param {LocaleKey} locale lenguaje al cual localizar el texto
     * @param {...String} values variables a insertar en el texto seleccionado como reemplazos de campos designados
     */
    static getText(id, locale, ...values) {
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

    /**
     * Muestra un texto localizado según la configuración del usuario
     * @param {LocaleIds} id id de traducción
     * @returns {Translation}
     */
    static getTranslation(id) {
        const localeSet = locales.get(id);
        if(!localeSet) throw ReferenceError(`Se esperaba una id de traducción válida. Se recibió: ${id}`);
        return localeSet;
    }
}

module.exports = {
    Translator,
};