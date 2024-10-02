const { fetchUserCache } = require('./usercache.js');

const ConditionFields = /**@type {const}*/({
	Equal: '=',
	Distinct: '!=',
	Lesser: '<',
	Greater: '>',
	LesserOrEqual: '<=',
	GreaterOrEqual: '>=',
});

const Locales = /**@type {const}*/({
	Spanish: 'es',
	English: 'en',
});

/**
 * @typedef {typeof ConditionFields[keyof typeof ConditionFields]} ConditionString
 * @typedef {typeof Locales[keyof typeof Locales]} LocaleKey
 * @typedef {{ [P in LocaleKey]: String }} Translation
 */

/**@param {...String} lines*/
function paragraph(...lines) {
	return lines.join('\n');
}

/**
 * @param {Number} i Índice del valor de reemplazo
 * @param {String} [defaultValue] Valor por defecto si no se ingresó un valor en el índice
 */
function subl(i, defaultValue) {
	if(i == undefined) throw ReferenceError('Se esperaba un índice de componente de traducción');
	const baseSub = `${i}{...}`
	if(!defaultValue)
		return baseSub;
	return `${baseSub}<?{'${defaultValue}'}`;
}

/**
 * @param {Number} i Índice del valor a usar como operando izquierdo de la comprobación
 * @param {ConditionString} condition Condición a evaluar con el valor de comprobación
 * @param {*} rightOperand Operando derecho de la operación. Un valor cualquiera, no un índice
 * @param {String} whenTrue Valor de reemplazo en caso de verdadero
 * @param {String?} [whenFalse] Valor de reemplazo en caso de falso
 */
function subif(i, condition, rightOperand, whenTrue, whenFalse = '') {
	if(i == undefined) throw ReferenceError('Se esperaba un índice de componente de traducción');
	if(!whenTrue) throw ReferenceError('Se esperaba un valor para verdadero en componente de traducción');
	return `${i}{...}<!{${condition}:${rightOperand}|'${whenTrue}'}<?{'${whenFalse}'}`;
}

/**@satisfies {Record<String, Translation>}*/
let localesObject = /**@type {const}*/({
	currentLanguage: {
		es: 'Español',
		en: 'English',
	},
	dmDisclaimer: {
		es: 'Nota: Bot de Puré no opera con mensajes privados',
		en: 'Note: Bot de Puré does not reply to DMs',
	},
	dmInteraction: {
		es: '❌ Solo respondo a comandos en servidores',
		en: '❌ I only respond to commands on servers',
	},
	blockedInteraction: {
		es: paragraph(
			'⛔ Probablemente usaste un comando mientras me reiniciaba. Usa el comando nuevamente en unos segundos y debería funcionar',
			'Si el comando se sigue rechazando, es posible que esté en mantenimiento o que no tenga suficientes permisos en este canal',
			'También puede deberse a que estés banneado de usar a Bot de Puré',
			`Si no sabes la causa, puedes notificarle el problema a mi creador: <@${subl(0)}>`,
		),
		en: paragraph(
			'⛔ You probably used a command while I was restarting. Use the command again in a few seconds and it should work',
			'If the command keeps getting rejected, I may be in maintenance or not have enough permissions in this channel',
			'It may also be because you were banned from using Bot de Puré',
			`If you're not sure, you can tell my creator about the problem: <@${subl(0)}>`,
		),
	},
	unknownInteraction: {
		es: '🍔 Recibí una acción, pero no sé cómo responderla. Esto es un problema... mientras arreglo algunas cosas, toma una hamburguesa',
		en: '🍔 I received an action, but I don\'t know how to reply to it. This is a problem... while I fix some things, take this burger',
	},
	huskInteraction: {
		es: '☕ Parece que encontraste un botón, menú desplegable o ventana modal sin función. Mientras conecto algunos cables, ten un café',
		en: '☕ Seems like you found a button, select menu, or modal window without a function. While I wire some things up, take this coffee',
	},
	unauthorizedInteraction: {
		es: '❌ No puedes hacer eso',
		en: '❌ You can\'t do that',
	},
	expiredWizardData: {
		es: '❌ Este asistente hace uso de memoria de sesión, pero no se encontró ninguna sesión. Vuelve a usar el comando para crear una nueva sesión de este asistente',
		en: '❌ This Wizard uses session memory, but no session was found. Use the command again to start a new session of this Wizard',
	},

	somethingWentWrong: {
		es: '⚠️️ Algo salió mal',
		en: '⚠️️ Something went wrong',
	},
	voiceExpected: {
		es: '❌ Debes conectarte a un canal de voz primero',
		en: '❌ You need to connect to a voice channel first',
	},

	invalidInput: {
		es: '⚠️️ Entrada inválida',
		en: '⚠️️ Invalid input',
	},
	invalidNumber: {
		es: '⚠️️ Número inválido',
		en: '⚠️️ Invalid number',
	},
	invalidId: {
		es: '⚠️️ ID inválida',
		en: '⚠️️ Invalid ID',
	},
	invalidUser: {
		es: '⚠️️ Usuario inválido',
		en: '⚠️️ Invalid number',
	},
	invalidMember: {
		es: '⚠️️ Miembro inválido',
		en: '⚠️️ Invalid member',
	},
	invalidRole: {
		es: '⚠️️ Rol inválido',
		en: '⚠️️ Invalid role',
	},
	invalidChannel: {
		es: '⚠️️ Canal inválido',
		en: '⚠️️ Invalid channel',
	},
	invalidMessage: {
		es: '⚠️️ Mensaje inválido',
		en: '⚠️️ Invalid message',
	},
	invalidTime: {
		es: '⚠️️ Tiempo inválido',
		en: '⚠️️ Invalid time',
	},

	welcome: {
		es: 'Bienvenido',
		en: 'Welcome',
	},
	name: {
		es: 'Nombre',
		en: 'Name',
	},
	description: {
		es: 'Descripción',
		en: 'Description',
	},
	icon: {
		es: 'Ícono',
		en: 'Icon',
	},
	hours: {
		es: 'Horas',
		en: 'Hours',
	},
	minutes: {
		es: 'Minutos',
		en: 'Minutes',
	},
	seconds: {
		es: 'Segundos',
		en: 'Seconds',
	},
	yes: {
		es: 'Sí',
		en: 'Yes',
	},
	no: {
		es: 'No',
		en: 'No',
	},
	on: {
		es: 'Activo',
		en: 'On',
	},
	off: {
		es: 'Inactivo',
		en: 'Off',
	},
	enabled: {
		es: 'Activado',
		en: 'Enabled',
	},
	disabled: {
		es: 'Desactivado',
		en: 'Disabled',
	},
	always: {
		es: 'Siempre',
		en: 'Always',
	},
	never: {
		es: 'Nunca',
		en: 'Never',
	},

	buttonStart: {
		es: 'Comenzar',
		en: 'Start',
	},
	buttonCreate: {
		es: 'Crear',
		en: 'Create',
	},
	buttonDelete: {
		es: 'Eliminar',
		en: 'Delete',
	},
	buttonEdit: {
		es: 'Editar',
		en: 'Edit',
	},
	buttonCustomize: {
		es: 'Personalizar',
		en: 'Customize',
	},
	buttonView: {
		es: 'Ver',
		en: 'View',
	},
	buttonBack: {
		es: 'Volver',
		en: 'Back',
	},
	buttonCancel: {
		es: 'Cancelar',
		en: 'Cancel',
	},
	buttonFinish: {
		es: 'Finalizar',
		en: 'Finish',
	},
	buttonRegister: {
		es: 'Registrar',
		en: 'Register',
	},
	
	actionDeleteUserPost: {
		es: 'Borrar Post',
		en: 'Delete Post',
	},

	cancelledStepName: {
		es: 'Asistente cancelado',
		en: 'Wizard cancelled',
	},
	welcomeStepFooterName: {
		es: 'Bienvenida',
		en: 'Welcome',
	},
	cancelledStepFooterName: {
		es: 'Operación Abortada',
		en: 'Operation Aborted',
	},
	finishedStepFooterName: {
		es: 'Operación Finalizada',
		en: 'Operation Concluded',
	},
	toggledOn: {
		es: 'Activado',
		en: 'Enabled',
	},
	toggledOff: {
		es: 'Desactivado',
		en: 'Disabled',
	},
	goToUserPreferences: {
		es: 'Preferencias de Usuario',
		en: 'User Preferences',
	},

	cultivarUnauthorized: {
		es: `¡Solo puedes cultivar una vez por día! Podrás volver a cultivar <t:${subl(0)}:R>`,
		en: `You can only cultivate once per day! You'll be able to cultivate again <t:${subl(0)}:R>`,
	},
	cultivarTitle: {
		es: '¡Cultivaste papas!',
		en: 'You grew potatoes!',
	},
	cultivarDescription: {
		es: `Ahora tienes <:prc:1097208828946301123> ${subl(0)}`,
		en: `You now have <:prc:1097208828946301123> ${subl(0)}`,
	},

	transferInputExpected: {
		es: '⚠️ Se esperaba que especifiques el monto a transferir y el usuario objetivo',
		en: '⚠️ Amount to transfer and target user to expected',
	},
	transferHumanExpected: {
		es: '❌ No se puede transferir PRC a bots',
		en: '❌ Can\'t transfer PRC to bots',
	},
	transferOtherExpected: {
		es: '❌ No puedes transferirte a ti mismo',
		en: '❌ You can\'t transfer PRC to yourself',
	},
	transferInsufficient: {
		es: '⚠️ Saldo insuficiente',
		en: '⚠️ Insufficient funds',
	},
	transferTitle: {
		es: 'Transferencia completada',
		en: 'Transfer completed',
	},
	transferAuthorName: {
		es: 'Comprobante de pago',
		en: 'Receipt of payment',
	},
	transferFromName: {
		es: 'De',
		en: 'From',
	},
	transferForName: {
		es: 'Para',
		en: 'To',
	},
	transferAmountName: {
		es: 'Monto',
		en: 'Amount',
	},
	transferCodeName: {
		es: 'Código de referencia',
		en: 'Reference Code',
	},

	playSearchExpected: {
		es: '⚠️ Se esperaba una búsqueda',
		en: '⚠️ Search expected',
	},
	playTitleQueueAdded: {
		es: 'Se agregó a la cola...',
		en: 'Added to queue...',
	},
	playTitleQueueNew: {
		es: 'Se comenzó a reproducir...',
		en: 'Started playing...',
	},
	playFooterTextQueueSize: {
		es: `${subl(0)} videos en cola`,
		en: `${subl(0)} queued videos`,
	},
	playFooterTextQueueEmpty: {
		es: 'La cola está vacía',
		en: 'The queue is empty',
	},

	poll: {
		es: 'Encuesta',
		en: 'Poll',
	},
	pollWizardAuthor: {
		es: 'Asistente de configuración de Encuestas',
		en: 'Poll Configuration Wizard',
	},
	pollResultsAuthor: {
		es: 'Resultados de encuesta',
		en: 'Poll results',
	},
	pollCancelledStep: {
		es: 'Se canceló la configuración de Encuesta',
		en: 'The Polls Wizard has been terminated',
	},
	pollFinishedStep: {
		es: 'Se finalizó la configuración de Encuesta',
		en: 'The Polls Wizard has been closed',
	},
	pollOngoingStepFooterName: {
		es: 'Encuesta en progreso',
		en: 'Poll in progress',
	},
	pollConcludedStepFooterName: {
		es: 'Encuesta finalizada',
		en: 'Poll concluded',
	},
	pollWelcomeValue: {
		es: 'Este asistente te guiará para realizar una encuesta al server. Comienza cuando gustes',
		en: 'This Wizard will guide you through making a server poll. Start whenever you want',
	},
	pollQuestionPromptTitle: {
		es: 'Haz una Pregunta',
		en: 'Ask a question',
	},
	pollQuestion: {
		es: 'Pregunta',
		en: 'Question',
	},
	pollAnswersName: {
		es: 'Lista de Respuestas',
		en: 'Answers List',
	},
	pollAnswersValueEmpty: {
		es: 'No has añadido respuestas todavía',
		en: 'You haven\'t added any answers yet',
	},
	pollAnswerPromptInput: {
		es: 'Respuesta',
		en: 'Answer',
	},
	pollAnswersFooterName: {
		es: 'Respuestas',
		en: 'Answers',
	},
	pollFinishTitle: {
		es: 'Finalizar creación',
		en: 'Finish configuration',
	},
	pollFinishTimeName: {
		es: 'Duración de Encuesta',
		en: 'Poll Duration',
	},
	pollFinishFooterName: {
		es: 'Finalizar',
		en: 'Finish',
	},
	pollFinishButtonBegin: {
		es: 'Iniciar en...',
		en: 'Begin in...',
	},
	pollFinishButtonReset: {
		es: 'Reestablecer',
		en: 'Reset',
	},
	pollAnswerPromptTitleAdd: {
		es: 'Añadir Respuesta',
		en: 'Add Answer',
	},
	pollAnswerPromptTitleRemove: {
		es: 'Quitar Respuesta',
		en: 'Remove Answer',
	},
	pollChannelPromptTitle: {
		es: 'Enviar Encuesta',
		en: 'Send Poll',
	},
	pollChannelPollLabel: {
		es: 'Canal de encuesta',
		en: 'Poll Channel',
	},
	pollChannelPollPlaceholder: {
		es: 'Nombre, #nombre o ID',
		en: 'Name, #name or ID',
	},
	pollChannelResultsLabel: {
		es: 'Canal de resultados',
		en: 'Results Channel',
	},
	pollChannelResultsPlaceholder: {
		es: 'Nombre, #nombre, ID o nada',
		en: 'Name, #name, ID or nothing',
	},
	pollTimePromptTitle: {
		es: 'Modificar tiempo',
		en: 'Modify time',
	},
	pollResultsName: {
		es: 'Respuestas de encuesta',
		en: 'Poll Answers',
	},
	pollEndTimeName: {
		es: 'Finalización',
		en: 'Conclusion',
	},
	pollVoteReportAuthor: {
		es: 'Voto recibido',
		en: 'Vote received',
	},
	pollVoteReportDeleted: {
		es: '_<Eliminó su voto>_',
		en: '_<Removed their vote>_',
	},
	pollVoteSuccess: {
		es: '✅ ¡Voto registrado!',
		en: '✅ Vote registered!',
	},
	pollVoteSwapSuccess: {
		es: '✅ ¡Voto cambiado!',
		en: '✅ Vote swapped!',
	},
	pollVoteRemoveSuccess: {
		es: '✅ Voto eliminado',
		en: '✅ Vote deleted',
	},
	pollVoteError: {
		es: '⚠️ ¡Parece que la encuesta ya terminó!',
		en: '⚠️ Seems like the poll has ended!',
	},
	pollButtonToggleAnon: {
		es: 'Voto anónimo',
		en: 'Anonymous vote',
	},
	pollInsufficientTime: {
		es: '⚠️ ¡Tiempo insuficiente! Pon al menos 10 segundos',
		en: '⚠️ Insufficient time! Set at least 10 seconds',
	},
	
	feedAuthor: {
		es: 'Asistente de configuración de Feed de imágenes',
		en: 'Imageboard Feed Configuration Wizard',
	},
	feedCancelledStep: {
		es: 'Se canceló la configuración de Feeds',
		en: 'The Feeds Wizard has been terminated',
	},
	feedFinishedStep: {
		es: 'Se finalizó la configuración de Feeds',
		en: 'The Feeds Wizard has been closed',
	},
	feedSelectFeed: {
		es: 'Selecciona un Feed...',
		en: 'Select a Feed...',
	},
	feedViewUrlsName: {
		es: 'Enlaces',
		en: 'Links',
	},
	feedViewTagsLinkName: {
		es: 'Seguir Tags',
		en: 'Follow Tags',
	},
	feedSetTagsAdd: {
		es: `Se comenzaron a seguir las tags: ${subl(0)}`,
		en: `Started following the tags: ${subl(0)}`,
	},
	feedSetTagsRemove: {
		es: `Se dejaron de seguir las tags: ${subl(0)}`,
		en: `Stopped following the tags: ${subl(0)}`,
	},
	feedSetTagsUnchanged: {
		es: '⚠️ No se modificaron las tags seguidas. Asegúrate de estar siguiendo 6 tags o menos',
		en: '⚠️ Followed tags were not modified. Make sure not to be following more than 6 tags',
	},
	feedSetTagsButtonView: {
		es: 'Ver Tags Seguidas',
		en: 'View Followed Tags',
	},
	feedSetTagsButtonAdd: {
		es: 'Seguir Tags',
		en: 'Follow Tags',
	},
	feedSetTagsButtonRemove: {
		es: 'Dejar de Seguir Tags',
		en: 'Unfollow Tags',
	},
	feedEditTagsTitleAdd: {
		es: 'Seguir Tags...',
		en: 'Follow Tags...',
	},
	feedEditTagsTitleRemove: {
		es: 'Dejar de Seguir Tags...',
		en: 'Unfollow Tags...',
	},
	feedEditTagsInputAdd: {
		es: 'Tags que quieres seguir, sin comas',
		en: 'Tags you wanna follow, without commas',
	},
	feedEditTagsInputRemove: {
		es: 'Tags a dejar de seguir, sin comas',
		en: 'Tags you wanna unfollow, without commas',
	},
	feedDeletePostTitle: {
		es: 'Post Eliminado',
		en: 'Post Deleted',
	},
	feedDeletePostAdvice: {
		es: 'Puedes blacklistear tags si colocas un "-" delante',
		en: 'You can blacklist a tag if you put a "-" in front',
	},
	feedDeletePostTagsName: {
		es: 'Tags Rescatadas',
		en: 'Recovered Tags',
	},
	feedDeletePostLinkName: {
		es: 'Enlace',
		en: 'Link',
	},

	booruNotifTitle: {
		es: 'Notificación de Feed Suscripto',
		en: 'Subscribed Feed Notification',
	},
	booruNotifDescription: {
		es: '¡Esta publicación podría interesarte!',
		en: 'This post could catch your eye!',
	},
	booruNotifTagsName: {
		es: 'Tags de Interés',
		en: 'Tags of Interest',
	},

	yoCancelledStep: {
		es: 'Se canceló la configuración de Preferencias de Usuario',
		en: 'The User Preferences configuration was cancelled',
	},
	yoFinishedStep: {
		es: 'Se cerró el Asistente de Preferencias de Usuario',
		en: 'The User Preferences Wizard has been closed',
	},
	yoDashboardAuthor: {
		es: 'Preferencias de Usuario',
		en: 'User Preferences',
	},
	yoDashboardLanguageName: {
		es: 'Idioma',
		en: 'Language',
	},
	yoDashboardPRCName: {
		es: 'Créditos',
		en: 'Credits',
	},
	yoDashboardFeedTagsName: {
		es: 'Tags de Feed seguidas',
		en: 'Followed Feed Tags',
	},
	yoDashboardFeedTagsValue: {
		es: `<:tagswhite:921788204540100608> Siguiendo ${subl(0)} tag${subif(0, '!=', 1, 's')} en ${subl(1)} canal${subif(1, '!=', 1, 'es')}`,
		en: `<:tagswhite:921788204540100608> Following ${subl(0)} tag${subif(0, '!=', 1, 's')} in ${subl(1)} channel${subif(1, '!=', 1, 's')}`,
	},
	yoDashboardName: {
		es: 'Panel Principal',
		en: 'Dashboard',
	},
	yoDashboardButtonLanguage: {
		es: 'English',
		en: 'Español',
	},
	yoDashboardButtonTags: {
		es: 'Tags Seguidas...',
		en: 'Followed Tags...',
	},
	yoDashboardMenuConfig: {
		es: 'Preferencias',
		en: 'Preferences',
	},
	yoDashboardMenuConfigFeedDesc: {
		es: 'Administra tus tags seguidas en Feeds de imágenes',
		en: 'Manage your followed tags in Imageboard Feeds',
	},
	yoDashboardMenuConfigVoiceDesc: {
		es: 'Configura preferencias personales de sesiones PuréVoice',
		en: 'Configure personal preferences for PuréVoice sessions',
	},
	yoDashboardMenuConfigPixixDesc: {
		es: 'Corrige el formato de enlaces de pixiv automáticamente',
		en: 'Fixes pixiv embeds automatically',
	},
	yoDashboardMenuConfigTwitterDesc: {
		es: 'Corrige el formato de enlaces de X automáticamente (VX/FX)',
		en: 'Fixes X embeds automatically (VX/FX)',
	},
	yoFeedEmptyError: {
		es: paragraph(
			'¡No tienes ninguna suscripción a Feeds de imágenes!',
			'Puedes comenzar a seguir tags en cualquier canal con un Sistema PuréFeed instalado',
		),
		en: paragraph(
			'You\'re not subscribed to any image Feeds!',
			'You can start following tags in any channel that has a PuréFeed system installed',
		),
	},
	yoVoiceStep: {
		es: 'Preferencias personales de PuréVoice',
		en: 'PuréVoice personal preferences',
	},
	yoVoiceTitle: {
		es: 'Configura tus preferencias personales del sistema PuréVoice',
		en: 'Configure your personal preferences for the PuréVoice system',
	},
	yoVoicePingName: {
		es: 'Menciones',
		en: 'Pings',
	},
	yoVoiceAutonameName: {
		es: 'Nombre automático',
		en: 'Autoname',
	},
	yoVoiceMenuPing: {
		es: 'Configurar menciones...',
		en: 'Configure pings...',
	},
	yoVoiceMenuPingAlwaysDesc: {
		es: 'Serás mencionado al crear o unirte a una sesión',
		en: 'You\'ll be pinged when creating or joining a session',
	},
	yoVoiceMenuPingOnCreateLabel: {
		es: 'Al crear',
		en: 'On creation',
	},
	yoVoiceMenuPingOnCreateDesc: {
		es: 'Solo serás mencionado al crear una nueva sesión',
		en: 'You\'ll only be pinged when creating a new session',
	},
	yoVoiceMenuPingNeverDesc: {
		es: 'No serás mencionado al crear o unirte a una sesión',
		en: 'You won\'t be pinged when creating or joining a session',
	},
	yoPixivStep: {
		es: 'Conversor de enlaces de pixiv',
		en: 'pixiv link converter',
	},
	yoPixivTitle: {
		es: 'Activa o desactiva el servicio de conversión',
		en: 'Enable or disable the conversion service',
	},
	yoPixivStateAlreadySet: {
		es: `⚠️️ El servicio ya estaba ${subif(0, '=', true, 'activado', 'desactivado')}`,
		en: `⚠️️ The service was already ${subif(0, '=', true, 'enabled', 'disabled')}`,
	},
	yoTwitterStep: {
		es: 'Conversor de enlaces de Twitter/X',
		en: 'Twitter/X link converter',
	},
	yoTwitterTitle: {
		es: 'Elige el servicio de conversión a usar para Twitter/X',
		en: 'Choose which conversion service to use for Twitter/X',
	},
	yoTwitterMenuService: {
		es: 'Servicio',
		en: 'Service',
	},
	yoTwitterMenuServiceVxDesc: {
		es: 'Opción recomendada',
		en: 'Recommended solution',
	},
	yoTwitterMenuServiceFxDesc: {
		es: 'Buena alternativa, pero menos segura y privada',
		en: 'Good alternative, but less safe and private',
	},
	yoTwitterMenuServiceNoneLabel: {
		es: 'Ninguno',
		en: 'None',
	},
	yoTwitterMenuServiceNoneDesc: {
		es: 'No convertir enlaces de Twitter/X automáticamente',
		en: 'Do not convert Twitter/X links automatically',
	},
	yoTwitterSuccess: {
		es: '✅ Servicio de conversión actualizado',
		en: '✅ Converter service updated',
	},
	yoSelectTagsChannelTitle: {
		es: 'Selecciona uno de tus Feeds seguidos',
		en: 'Select one of the Feeds you follow',
	},
	yoTagsName: {
		es: 'Tags Seguidas',
		en: 'Followed Tags',
	},
	yoTagsValueDefault: {
		es: '<Todavía no sigues ninguna tag>',
		en: '<You aren\'t following any tag yet>',
	},
});

/**@typedef {keyof localesObject} LocaleIds id de texto a mostrar en forma localizada*/

const locales = new Map(Object.entries(localesObject));
localesObject = null;

/**@type {Map<ConditionString, (a: String, b: String) => Boolean>}*/
const conditionFns = new Map();
conditionFns
	.set('=',  (a, b) => a === b)
	.set('!=', (a, b) => a !== b)
	.set('<',  (a, b) => a <   b)
	.set('>',  (a, b) => a >   b)
	.set('<=', (a, b) => a <=  b)
	.set('>=', (a, b) => a >=  b);

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
	 * @param {...*} values variables a insertar en el texto seleccionado como reemplazos de campos designados
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

	/**
	 * @param {import('discord.js').User | import('discord.js').GuildMember | String} user
	 */
	static async from(user) {
		const userId = (typeof user === 'string') ? user : user.id;
		const userCache = await fetchUserCache(userId);
		return new Translator(userCache.language);
	}

	/**
	 * Muestra un texto localizado según la configuración del usuario
	 * @param {LocaleIds} id id de texto a mostrar en forma localizada
	 * @param {LocaleKey} locale lenguaje al cual localizar el texto
	 * @param {...*} values variables a insertar en el texto seleccionado como reemplazos de campos designados
	 */
	static getText(id, locale, ...values) {
		const localeSet = locales.get(id);
		if(!localeSet) throw ReferenceError(`Se esperaba una id de texto localizado válido. Se recibió: ${id}`);
		const translationTemplate = localeSet[locale];
		if(!translationTemplate) throw RangeError(`Se esperaba una clave de localización válida. Se recibió: ${id} :: ${locale}`);
	
		//Ejemplo: 1{...}<?{'por defecto'}
		const subLocaleRegex = /(\d+){\.\.\.}(?:<!{((?:[!=<>]{1,2}):[0-9]+)\|'((?:(?!'}).)*)'})?(?:<\?{'((?:(?!'}).)*)'})?/g;
		const translation = translationTemplate.replace(subLocaleRegex, (_, i, condition, whenTrue, defaultValue) => {
			const value = values[i];
	
			if(condition != undefined) {
				const leftValue = `${value}`;
				let rightValue = '';
				let operator = '';
				let cursor = 0;

				while(condition[cursor] !== ':') {
					operator += condition[cursor];
					cursor++;
				}
				cursor++;
				while(cursor < condition.length) {
					rightValue += condition[cursor];
					cursor++;
				}

				//@ts-expect-error
				const conditionFn = conditionFns.get(operator);
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
	ConditionFields,
	Locales,
};