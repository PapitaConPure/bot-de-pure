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
	Spanish:  'es',
	English:  'en',
	Japanese: 'ja',
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

	if(typeof rightOperand === 'boolean')
		rightOperand = `__${rightOperand}__`;

	return `${i}{...}<!{${condition}:${rightOperand}|'${whenTrue}'}<?{'${whenFalse}'}`;
}

/**@satisfies {Record<String, Translation>}*/
let localesObject = /**@type {const}*/({
	currentLanguage: {
		es: 'Español',
		en: 'English',
		ja: '日本語',
	},
	currentLanguageEmoji: {
		en: '<:en:1084646415319453756>',
		es: '<:es:1084646419853488209>',
		ja: '🇯🇵',
	},
	
	dmDisclaimer: {
		es: 'Nota: Bot de Puré no opera con mensajes privados',
		en: 'Note: Bot de Puré does not reply to DMs',
		ja: '注: ピューレボットはDMに返信しません'
	},
	dmInteraction: {
		es: '❌ Solo respondo a comandos en servidores',
		en: '❌ I only respond to commands on servers',
		ja: '❌ サーバー上のコマンドにのみ応答します',
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
		ja: paragraph(
			'⛔ You probably used a command while I was restarting. Use the command again in a few seconds and it should work',
			'If the command keeps getting rejected, I may be in maintenance or not have enough permissions in this channel',
			'It may also be because you were banned from using Bot de Puré',
			`If you're not sure, you can tell my creator about the problem: <@${subl(0)}>`,
		),
	},
	unknownInteraction: {
		es: '🍔 Recibí una acción, pero no sé cómo responderla. Esto es un problema... mientras arreglo algunas cosas, toma una hamburguesa',
		en: '🍔 I received an action, but I don\'t know how to reply to it. This is a problem... while I fix some things, take this burger',
		ja: '🍔 リクエストを受け取ったのですが、返信の仕方がわかりません。これは問題です...いくつか修正している間、このハンバーガーを受け取ってください',
	},
	huskInteraction: {
		es: '☕ Parece que encontraste un botón, menú desplegable o ventana modal sin función. Mientras conecto algunos cables, ten un café',
		en: '☕ Seems like you found a button, select menu, or modal window without a function. While I wire some things up, have this coffee',
		ja: '☕ 機能のないボタン、選択メニュー、またはモーダルウィンドウを見つけたようです。配線している間にコーヒーを飲みましょう',
	},
	unauthorizedInteraction: {
		es: '❌ No puedes hacer eso. Si intentaste interactuar con un mensaje de comando, prueba usando el comando tú mismo',
		en: '❌ You can\'t do that. If you tried to interact with a command message, try calling the command yourself',
		ja: '❌ それはできません。コマンドメッセージとやり取りしようとした場合は、自分でコマンドを呼び出してみてください',
	},
	
	expiredWizardData: {
		es: '❌ Este asistente hace uso de memoria de sesión, pero no se encontró ninguna sesión. Vuelve a usar el comando para crear una nueva sesión de este asistente',
		en: '❌ This Wizard uses session memory, but no session was found. Use the command again to start a new session of this Wizard',
		ja: '❌ This Wizard uses session memory, but no session was found. Use the command again to start a new session of this Wizard',
	},

	missingMemberChannelPermissionsTitle: {
		es: 'Permisos insuficientes',
		en: 'Insufficient permissions',
		ja: '権限が不十分です',
	},
	missingMemberChannelPermissionsDescription: {
		es: 'Este comando u esta acción requiere permisos para ejecutarse que no tienes actualmente',
		en: 'This command or action requires permissions that you don\'t currently have to execute',
		ja: 'このコマンドまたはアクションを実行するには、現在所有していない権限が必要です',
	},
	missingMemberChannelPermissionsFullRequisitesName: {
		es: 'Árbol de requisitos',
		en: 'Requisites tree',
		ja: '権限ツリー',
	},
	missingClientChannelPermissionsDescription: {
		es: paragraph(
			'No tengo los permisos necesarios para ejecutar el comando o la acción que acabas de pedirme en este canal',
			'Soy una niña educada, así que no haré nada hasta que me den permiso. Puedes comentarle el asunto a algún moderador del server para que lo revise',
		),
		en: paragraph(
			'I don\t have the required permissions to execute the command or action that you requested in this channel',
			'I\'m a well educated girl, so I won\'t do anything until I\'m given permission to do so. You can ask a mod to review and address the issue',
		),
		ja: paragraph(
			'I don\t have the required permissions to execute the command or action that you requested in this channel',
			'I\'m a well educated girl, so I won\'t do anything until I\'m given permission to do so. You can ask a mod to review and address the issue',
		),
	},

	somethingWentWrong: {
		es: '⚠️️ Algo salió mal',
		en: '⚠️️ Something went wrong',
		ja: '⚠️️ 問題が発生しました',
	},

	voiceExpected: {
		es: '❌ Debes conectarte a un canal de voz primero',
		en: '❌ You need to connect to a voice channel first',
		ja: '❌ まず音声チャンネルに接続する必要があります',
	},
	voiceSameChannelExpected: {
		es: '❌ Ya estoy conectada a otro chat de voz. ¡Ven conmigo antes de hacer eso!',
		en: '❌ I\'m already connected to another voice channel. Come here before doing that!',
		ja: '❌ すでに別の音声チャネルに接続しています。その前にここに来てください！',
	},
	voiceSessionReasonFirstMemberAdd: {
		es: 'Inclusión de primer miembro en sesión PuréVoice',
		en: 'First member addition in PuréVoice Session',
		ja: 'Purevoiceセッションに最初のメンバーを含める',
	},
	voiceSessionReasonMemberAdd: {
		es: 'Inclusión de miembro en sesión PuréVoice',
		en: 'Member addition in PuréVoice Session',
		ja: 'メンバーがPuréVoiceセッションに参加しました',
	},
	voiceSessionReasonRoleCreate: {
		es: 'Inyectar Rol Efímero PuréVoice',
		en: 'Inject PuréVoice Ephemeral Rol',
		ja: 'PuréVoice一時的なロールを注入する',
	},
	voiceSessionReasonRoleEdit: {
		es: 'Conceder envío de mensajes a rol de sesión PuréVoice',
		en: 'Grant permission to send messages for PuréVoice session role',
		ja: 'PuréVoiceセッションロールのメッセージを送信する許可を付与します',
	},
	voiceSessionReasonChannelCreate: {
		es: 'Desplegar Canal Automutable PuréVoice',
		en: 'Deploy PuréVoice Automutable Channel',
		ja: 'PuréVoice自動可変チャネルのデプロイ',
	},
	voiceSessionReasonChannelForceName: {
		es: 'Renombrar sesión PuréVoice (forzado automáticamente)',
		en: 'Rename PuréVoice session (automatically forced)',
		ja: 'PuréVoiceセッションの名前を変更する (自動的に強制)',
	},
	voiceSessionNewMemberName: {
		es: 'Nueva conexión',
		en: 'Member addition in PuréVoice Session',
		ja: 'メンバーがPuréVoiceセッションに参加しました',
	},
	voiceSessionNewMemberValueMemberIntegrated: {
		es: `El miembro **${subl(0)}** fue incorporado a la sesión`,
		en: `The miembro **${subl(0)}** was attached to the session`,
		ja: `メンバー**${subl(0)}**がセッションに接続されました`,
	},
	voiceSessionNewMemberValueBotAttached: {
		es: `El bot **${subl(0)}** fue anexado a la sesión`,
		en: `The bot **${subl(0)}** was attached to the session`,
		ja: `ボット**${subl(0)}**がセッションに接続されました`,
	},
	voiceSessionNewMemberContentHint: {
		es: `👋 ${subl(0)}, ¡puedes conversar por aquí!`,
		en: `👋 ${subl(0)}, you can chat over here!`,
		ja: `👋 ${subl(0)}、ここでチャットできますよ！`,
	},
	voiceSessionNewSessionTitle: {
		es: '✅ Sesión inicializada',
		en: '✅ Session initialized',
		ja: '✅ セッション初期化',
	},
	voiceSessionNewSessionCustomizeName: {
		es: '🎨 Personalizar sesión',
		en: '🎨 Customize session',
		ja: '🎨 セッションをカスタマイズ',
	},
	voiceSessionNewSessionCustomizeValue: {
		es: `Puedes personalizar el nombre y emote del canal y rol de la sesión\n\`\`\`${subl(0)}voz <Nombre>[ -e <Emote>]\`\`\``,
		en: `You can customize the channel name and emote as well as the session role\n\`\`\`${subl(0)}vc <Name>[ -e <Emote>]\`\`\``,
		ja: `チャンネル名とエモート、セッションロールをカスタマイズできます\n\`\`\`${subl(0)}vc 「名前」[ -e 「エモート」]\`\`\``,
	},
	voiceSessionNewSessionNamingName: {
		es: '🏷️ Nombre',
		en: '🏷️ Name',
		ja: '🏷️ 名前',
	},
	voiceSessionNewSessionNamingValue: {
		es: `Puedes usar \`${subl(0)}voz <Nombre>\` para cambiar el nombre`,
		en: `You can use \`${subl(0)}vc <Name>\` to change the name`,
		ja: `\`${subl(0)}vc 「名前」\`を使用して名前を変更できます`,
	},
	voiceSessionNewSessionEmoteName: {
		es: '🐴 Emote',
		en: '🐴 Emote',
		ja: '🐴 エモート',
	},
	voiceSessionNewSessionEmoteValue: {
		es: 'Añade `--emote <Emote>` o `-e <Emote>` para cambiar el emote',
		en: 'Add `--emote <Emote>` or `-e <Emote>` to change the emote',
		ja: 'エモートを変更するには、`--emote 「エモート」`または`-e 「エモート」`を追加します',
	},
	voiceSessionNewSessionRoleName: {
		es: '📣 Rol Efímero',
		en: '📣 Ephemeral Role',
		ja: '📣 一時的なロール',
	},
	voiceSessionNewSessionRoleValue: {
		es: `Este rol menciona a todos en la sesión\n${subl(0)}`,
		en: `This role mentions everyone in the session\n${subl(0)}`,
		ja: `この役割はセッション内の全員にメンションします\n${subl(0)}`,
	},
	voiceSessionNewSessionRenameName: {
		es: '🧹 Renombrar sesión',
		en: '🧹 Rename Session',
		ja: '🧹 セッション名前を変更',
	},
	voiceSessionNewSessionRenameValue: {
		es: 'Debes esperar 20 minutos entre cada renombrado de la sesión',
		en: 'You must wait 20 minutes between each session renaming',
		ja: '各セッションの名前変更の間には20分待つ必要があります',
	},
	voiceSessionNewSessionAutonameName: {
		es: '⏱️ Nombre automático',
		en: '⏱️ Auto-naming',
		ja: '⏱️ 自動命名',
	},
	voiceSessionNewSessionAutonameValue: {
		es: 'Si no escribes un nombre de sesión en 3 minutos, se nombrará automáticamente',
		en: 'If you don\'t enter a session name within 3 minutes, it\'ll be automatically renamed',
		ja: '3分以内にセッション名を入力しないと、自動的に名前が変更されます',
	},

	invalidInput: {
		es: '⚠️️ Entrada inválida',
		en: '⚠️️ Invalid input',
		ja: '⚠️️ 無効な入力',
	},
	invalidNumber: {
		es: '⚠️️ Número inválido',
		en: '⚠️️ Invalid number',
		ja: '⚠️️ 無効な番号',
	},
	invalidId: {
		es: '⚠️️ ID inválida',
		en: '⚠️️ Invalid ID',
		ja: '⚠️️ 無効なID',
	},
	invalidUser: {
		es: '⚠️️ Usuario inválido',
		en: '⚠️️ Invalid user',
		ja: '⚠️️ 無効なユーザー',
	},
	invalidMember: {
		es: '⚠️️ Miembro inválido',
		en: '⚠️️ Invalid member',
		ja: '⚠️️ 無効なメンバー',
	},
	invalidRole: {
		es: '⚠️️ Rol inválido',
		en: '⚠️️ Invalid role',
		ja: '⚠️️ 無効なロール',
	},
	invalidChannel: {
		es: '⚠️️ Canal inválido',
		en: '⚠️️ Invalid channel',
		ja: '⚠️️ 無効なチァネル',
	},
	invalidMessage: {
		es: '⚠️️ Mensaje inválido',
		en: '⚠️️ Invalid message',
		ja: '⚠️️ 無効なメッセーギ',
	},
	invalidTime: {
		es: '⚠️️ Tiempo inválido',
		en: '⚠️️ Invalid time',
		ja: '⚠️️ 無効な時刻',
	},

	welcome: {
		es: 'Bienvenido',
		en: 'Welcome',
		ja: 'ようこそ',
	},
	name: {
		es: 'Nombre',
		en: 'Name',
		ja: '名前',
	},
	description: {
		es: 'Descripción',
		en: 'Description',
		ja: '説明',
	},
	icon: {
		es: 'Ícono',
		en: 'Icon',
		ja: 'アイコン',
	},
	duration: {
		es: 'Duración',
		en: 'Duration',
		ja: '間隔',
	},
	hours: {
		es: 'Horas',
		en: 'Hours',
		ja: '時間',
	},
	minutes: {
		es: 'Minutos',
		en: 'Minutes',
		ja: '分',
	},
	seconds: {
		es: 'Segundos',
		en: 'Seconds',
		ja: '秒',
	},
	yes: {
		es: 'Sí',
		en: 'Yes',
		ja: 'はい',
	},
	no: {
		es: 'No',
		en: 'No',
		ja: 'いいえ',
	},
	on: {
		es: 'Activo',
		en: 'On',
		ja: 'オン',
	},
	off: {
		es: 'Inactivo',
		en: 'Off',
		ja: 'オフ',
	},
	enabled: {
		es: 'Activado',
		en: 'Enabled',
		ja: '有効',
	},
	disabled: {
		es: 'Desactivado',
		en: 'Disabled',
		ja: '無効',
	},
	always: {
		es: 'Siempre',
		en: 'Always',
		ja: '常に',
	},
	never: {
		es: 'Nunca',
		en: 'Never',
		ja: 'なし',
	},
	source: {
		es: 'Origen',
		en: 'Source',
		ja: '出典',
	},
	emoji: {
		es: 'Emoji',
		en: 'Emoji',
		ja: '絵文字',
	},
	emote: {
		es: 'Emote',
		en: 'Emote',
		ja: 'エモート',
	},

	buttonStart: {
		es: 'Comenzar',
		en: 'Start',
		ja: '始める',
	},
	buttonCreate: {
		es: 'Crear',
		en: 'Create',
		ja: '作成',
	},
	buttonDelete: {
		es: 'Eliminar',
		en: 'Delete',
		ja: '削除',
	},
	buttonEdit: {
		es: 'Editar',
		en: 'Edit',
		ja: '編集',
	},
	buttonCustomize: {
		es: 'Personalizar',
		en: 'Customize',
		ja: 'カスタマイズ',
	},
	buttonView: {
		es: 'Ver',
		en: 'View',
		ja: '表示',
	},
	buttonBack: {
		es: 'Volver',
		en: 'Back',
		ja: '戻る',
	},
	buttonCancel: {
		es: 'Cancelar',
		en: 'Cancel',
		ja: '中止',
	},
	buttonFinish: {
		es: 'Finalizar',
		en: 'Finish',
		ja: '完了',
	},
	buttonRegister: {
		es: 'Registrar',
		en: 'Register',
		ja: '登録',
	},
	buttonShowMeHow: {
		es: 'Muéstrame cómo',
		en: 'Show me how',
		ja: 'やり方を見せて',
	},

	commandByName: {
		es: `Comando invocado por ${subl(0)}`,
		en: `Command called by ${subl(0)}`,
		ja: `${subl(0)}によって呼び出されたコマンド`,
	},
	
	actionDeleteUserPost: {
		es: 'Borrar Post',
		en: 'Delete Post',
		ja: '投稿を削除',
	},
	actionPVTransferAdmin: {
		es: 'Sesión PV • Ceder Administrador',
		en: 'PV Session • Transfer Admin',
		ja: 'PVセッション・アドミンを移行る',
	},
	actionPVGiveMod: {
		es: 'Sesión PV • Volver Moderador',
		en: 'PV Session • Promote to Mod',
		ja: 'PVセッション・モデレーターを与える',
	},
	actionPVRemoveMod: {
		es: 'Sesión PV • Quitar Moderador',
		en: 'PV Session • Demote Mod ',
		ja: 'PVセッション・モデレーターを与える',
	},
	actionPVBanMember: {
		es: 'Sesión PV • Expulsar',
		en: 'PV Session • Ban',
		ja: 'PVセッション・禁止する',
	},
	actionPVUnbanMember: {
		es: 'Sesión PV • Remover Expulsión',
		en: 'PV Session • Unban',
		ja: 'PVセッション・禁止を解除',
	},

	cancelledStepName: {
		es: 'Asistente cancelado',
		en: 'Wizard cancelled',
		ja: 'Wizard cancelled',
	},
	welcomeStepFooterName: {
		es: 'Bienvenida',
		en: 'Welcome',
		ja: 'ようこそ',
	},
	cancelledStepFooterName: {
		es: 'Operación Abortada',
		en: 'Operation Aborted',
		ja: '操作中止',
	},
	finishedStepFooterName: {
		es: 'Operación Finalizada',
		en: 'Operation Concluded',
		ja: '操作完了',
	},
	toggledOn: {
		es: 'Activado',
		en: 'Enabled',
		ja: '有効',
	},
	toggledOff: {
		es: 'Desactivado',
		en: 'Disabled',
		ja: '無効',
	},
	goToUserPreferences: {
		es: 'Preferencias de Usuario',
		en: 'User Preferences',
		ja: 'ユーザー設定',
	},

	aislarNoTimeProvided: {
		es: '⚠️ Debes indicar la duración del castigo en minutos',
		en: '⚠️ You need to indicate the timeout duration in minutes',
		ja: '⚠️ You need to indicate the timeout duration in minutes',
	},
	aislarInvalidTime: {
		es: '⚠️ Debes indicar la duración del castigo en minutos. Ingresa 0 para revocarlo',
		en: '⚠️ You need to indicate the timeout duration in minutes. Use 0 to revoke a timeout',
		ja: '⚠️ You need to indicate the timeout duration in minutes. Use 0 to revoke a timeout',
	},
	aislarNoMembersMentioned: {
		es: '⚠️ Debes mencionar al menos un miembro a aislar',
		en: '⚠️ You need to mention at least one member to timeout',
		ja: '⚠️ You need to mention at least one member to timeout',
	},
	aislarSomeMembersWereInvalid: {
		es: 'Algunos de los miebros que se intentó aislar fueron inválidos',
		en: 'Some of the members you tried to timeout were invalid',
		ja: 'Some of the members you tried to timeout were invalid',
	},
	aislarNoUpdatedMembers: {
		es: '⚠️ No pude actualizar ninguno de los miembros mencionados. Revisa que tenga permisos para administrar miembros',
		en: '⚠️ None of the mentioned members were updated. It could be that I don\'t have permission to manage members',
		ja: '⚠️ None of the mentioned members were updated. It could be that I don\'t have permission to manage members',
	},

	cultivarUnauthorized: {
		es: `¡Solo puedes cultivar una vez por día! Podrás volver a cultivar <t:${subl(0)}:R>`,
		en: `You can only cultivate once per day! You'll be able to cultivate again <t:${subl(0)}:R>`,
		ja: `You can only cultivate once per day! You'll be able to cultivate again <t:${subl(0)}:R>`,
	},
	cultivarTitle: {
		es: '¡Cultivaste papas!',
		en: 'You grew potatoes!',
		ja: 'You grew potatoes!',
	},
	cultivarDescription: {
		es: `Ahora tienes <:prc:1097208828946301123> ${subl(0)}`,
		en: `You now have <:prc:1097208828946301123> ${subl(0)}`,
		ja: `You now have <:prc:1097208828946301123> ${subl(0)}`,
	},

	transferInputExpected: {
		es: '⚠️ Se esperaba que especifiques el monto a transferir y el usuario objetivo',
		en: '⚠️ Amount to transfer and target user to expected',
		ja: '⚠️ Amount to transfer and target user to expected',
	},
	transferHumanExpected: {
		es: '❌ No se puede transferir PRC a bots',
		en: '❌ Can\'t transfer PRC to bots',
		ja: '❌ Can\'t transfer PRC to bots',
	},
	transferOtherExpected: {
		es: '❌ No puedes transferirte a ti mismo',
		en: '❌ You can\'t transfer PRC to yourself',
		ja: '❌ You can\'t transfer PRC to yourself',
	},
	transferInsufficient: {
		es: '⚠️ Saldo insuficiente',
		en: '⚠️ Insufficient funds',
		ja: '⚠️ Insufficient funds',
	},
	transferTitle: {
		es: 'Transferencia completada',
		en: 'Transfer completed',
		ja: 'Transfer completed',
	},
	transferAuthorName: {
		es: 'Comprobante de pago',
		en: 'Receipt of payment',
		ja: 'Receipt of payment',
	},
	transferFromName: {
		es: 'De',
		en: 'From',
		ja: '差出人',
	},
	transferForName: {
		es: 'Para',
		en: 'To',
		ja: '宛先',
	},
	transferAmountName: {
		es: 'Monto',
		en: 'Amount',
		ja: '金額',
	},
	transferCodeName: {
		es: 'Código de referencia',
		en: 'Reference Code',
		ja: '参照コード',
	},

	playSearchExpected: {
		es: '⚠️ Se esperaba una búsqueda',
		en: '⚠️ Search expected',
		ja: '⚠️ 検索が予想されました',
	},
	playTitleQueueAdded: {
		es: 'Se agregó a la cola...',
		en: 'Added to queue...',
		ja: 'キューに追加されました…',
	},
	playTitleQueueNew: {
		es: 'Se comenzó a reproducir...',
		en: 'Started playing...',
		ja: '再生を開始しました…',
	},
	playFooterTextQueueSize: {
		es: `${subl(0)} pistas en cola (${subl(1)})`,
		en: `${subl(0)} queued tracks (${subl(1)})`,
		ja: `${subl(0)}トラックがキューにある(${subl(1)})`,
	},
	playFooterTextQueueEmpty: {
		es: 'La cola está vacía',
		en: 'The queue is empty',
		ja: 'キューは空です',
	},
	playValueTrackSourceArbitrary: {
		es: 'Fuente arbitraria',
		en: 'Arbitrary source',
		ja: '任意のソース',
	},
	
	pauseTitleNoTrack: {
		es: 'No hay ninguna pista a pausar actualmente',
		en: 'No track currently playing to pause',
		ja: '一時停止するために再生中のトラックがない',
	},
	pauseTitleTrackAlreadyPaused: {
		es: 'La pista actual ya está pausada',
		en: 'The current track is already paused',
		ja: '現在のトラックはすでに一時停止されています',
	},
	pauseTitlePaused: {
		es: 'Pista pausada',
		en: 'Track paused',
		ja: 'トラック一時停止ました',
	},
	
	resumirTitleNoTrack: {
		es: 'No hay ninguna pista a resumir actualmente',
		en: 'No track currently playing to resume',
		ja: '再開できる現在再生中のトラックはありません',
	},
	resumirTitleTrackAlreadyResumed: {
		es: 'La pista actual ya está sonando',
		en: 'The current track is already playing',
		ja: '現在のトラックはすでに再生中です',
	},
	resumirTitleResumed: {
		es: 'Pista resumida',
		en: 'Track resumed',
		ja: 'トラック再開ました',
	},

	queueTitle: {
		es: 'Cola de reproducción',
		en: 'Music Queue',
		ja: '再生キュー',
	},
	queueDescriptionEmptyQueue: {
		es: 'La cola de reproducción está vacía',
		en: 'The music queue is empty',
		ja: '再生キューが空です',
	},
	queueNowPlayingName: {
		es: 'Escuchando Ahora',
		en: 'Now Playing',
		ja: '今聴いている',
	},
	queueModalAddQueryLabel: {
		es: 'Busca una pista',
		en: 'Track query',
		ja: 'トラックを検索',
	},
	queueModalAddQueryPlaceholder: {
		es: 'Busca una pista',
		en: 'Track query',
		ja: 'トラックを検索',
	},
	queueButtonSkip: {
		es: 'Saltar Pista',
		en: 'Skip Track',
		ja: 'スキップ',
	},
	queueButtonClearQueue: {
		es: 'Vaciar Cola',
		en: 'Clear Queue',
		ja: 'キューをクリア',
	},
	queueClearTitleQueueCleared: {
		es: 'La cola de reproducción fue vaciada',
		en: 'Queue has been cleared',
		ja: 'キューがクリアされました',
	},
	queueMenuDequeuePlaceholder: {
		es: 'Quitar una pista de la cola...',
		en: 'Dequeue a track...',
		ja: 'トラックをキューから削除します…',
	},
	queueDequeueTitleTrackNotFound: {
		es: 'No se encontró la pista a quitar',
		en: 'Couldn\'t find the track to remove',
		ja: '削除するトラックが見つかりませんでした',
	},
	queueDequeueDescriptionTrackNotFound: {
		es: 'Puedes usar p!cola nuevamente e intentarlo otra vez',
		en: 'You can use p!queue once more and try it again',
		ja: 'もう一度p!queueを使用して再試行してください',
	},
	queueDequeueTitleDequeued: {
		es: 'Pista quitada',
		en: 'Track removed',
		ja: 'トラックが削除されました',
	},
	queueSkipTitleNoTrack: {
		es: 'No hay ninguna pista a saltar actualmente',
		en: 'No track currently playing to skip',
		ja: 'スキップできる現在再生中のトラックはありません',
	},
	queueSkipTitleSkipped: {
		es: 'Pista saltada',
		en: 'Track skipped',
		ja: 'トラックがスキップされました',
	},

	poll: {
		es: 'Encuesta',
		en: 'Poll',
		ja: 'ポール',
	},
	pollWizardAuthor: {
		es: 'Asistente de configuración de Encuestas',
		en: 'Poll Configuration Wizard',
		ja: 'Poll Configuration Wizard',
	},
	pollResultsAuthor: {
		es: 'Resultados de encuesta',
		en: 'Poll results',
		ja: 'Poll results',
	},
	pollCancelledStep: {
		es: 'Se canceló la configuración de Encuesta',
		en: 'The Polls Wizard has been terminated',
		ja: 'The Polls Wizard has been terminated',
	},
	pollFinishedStep: {
		es: 'Se finalizó la configuración de Encuesta',
		en: 'The Polls Wizard has been closed',
		ja: 'The Polls Wizard has been closed',
	},
	pollOngoingStepFooterName: {
		es: 'Encuesta en progreso',
		en: 'Poll in progress',
		ja: 'Poll in progress',
	},
	pollConcludedStepFooterName: {
		es: 'Encuesta finalizada',
		en: 'Poll concluded',
		ja: 'Poll concluded',
	},
	pollWelcomeValue: {
		es: 'Este asistente te guiará para realizar una encuesta al server. Comienza cuando gustes',
		en: 'This Wizard will guide you through making a server poll. Start whenever you want',
		ja: 'This Wizard will guide you through making a server poll. Start whenever you want',
	},
	pollQuestionPromptTitle: {
		es: 'Haz una Pregunta',
		en: 'Ask a question',
		ja: 'Ask a question',
	},
	pollQuestion: {
		es: 'Pregunta',
		en: 'Question',
		ja: 'Question',
	},
	pollAnswersName: {
		es: 'Lista de Respuestas',
		en: 'Answers List',
		ja: 'Answers List',
	},
	pollAnswersValueEmpty: {
		es: 'No has añadido respuestas todavía',
		en: 'You haven\'t added any answers yet',
		ja: 'You haven\'t added any answers yet',
	},
	pollAnswerPromptInput: {
		es: 'Respuesta',
		en: 'Answer',
		ja: 'Answer',
	},
	pollAnswersFooterName: {
		es: 'Respuestas',
		en: 'Answers',
		ja: 'Answers',
	},
	pollFinishTitle: {
		es: 'Finalizar creación',
		en: 'Finish configuration',
		ja: 'Finish configuration',
	},
	pollFinishTimeName: {
		es: 'Duración de Encuesta',
		en: 'Poll Duration',
		ja: 'Poll Duration',
	},
	pollFinishFooterName: {
		es: 'Finalizar',
		en: 'Finish',
		ja: 'Finish',
	},
	pollFinishButtonBegin: {
		es: 'Iniciar en...',
		en: 'Begin in...',
		ja: 'Begin in...',
	},
	pollFinishButtonReset: {
		es: 'Reestablecer',
		en: 'Reset',
		ja: 'Reset',
	},
	pollAnswerPromptTitleAdd: {
		es: 'Añadir Respuesta',
		en: 'Add Answer',
		ja: 'Add Answer',
	},
	pollAnswerPromptTitleRemove: {
		es: 'Quitar Respuesta',
		en: 'Remove Answer',
		ja: 'Remove Answer',
	},
	pollChannelPromptTitle: {
		es: 'Enviar Encuesta',
		en: 'Send Poll',
		ja: 'Send Poll',
	},
	pollChannelPollLabel: {
		es: 'Canal de encuesta',
		en: 'Poll Channel',
		ja: 'Poll Channel',
	},
	pollChannelPollPlaceholder: {
		es: 'Nombre, #nombre o ID',
		en: 'Name, #name or ID',
		ja: 'Name, #name or ID',
	},
	pollChannelResultsLabel: {
		es: 'Canal de resultados',
		en: 'Results Channel',
		ja: 'Results Channel',
	},
	pollChannelResultsPlaceholder: {
		es: 'Nombre, #nombre, ID o nada',
		en: 'Name, #name, ID or nothing',
		ja: 'Name, #name, ID or nothing',
	},
	pollTimePromptTitle: {
		es: 'Modificar tiempo',
		en: 'Modify time',
		ja: 'Modify time',
	},
	pollResultsName: {
		es: 'Respuestas de encuesta',
		en: 'Poll Answers',
		ja: 'Poll Answers',
	},
	pollEndTimeName: {
		es: 'Finalización',
		en: 'Conclusion',
		ja: 'Conclusion',
	},
	pollVoteReportAuthor: {
		es: 'Voto recibido',
		en: 'Vote received',
		ja: 'Vote received',
	},
	pollVoteReportDeleted: {
		es: '_<Eliminó su voto>_',
		en: '_<Removed their vote>_',
		ja: '_<Removed their vote>_',
	},
	pollVoteSuccess: {
		es: '✅ ¡Voto registrado!',
		en: '✅ Vote registered!',
		ja: '✅ Vote registered!',
	},
	pollVoteSwapSuccess: {
		es: '✅ ¡Voto cambiado!',
		en: '✅ Vote swapped!',
		ja: '✅ Vote swapped!',
	},
	pollVoteRemoveSuccess: {
		es: '✅ Voto eliminado',
		en: '✅ Vote deleted',
		ja: '✅ Vote deleted',
	},
	pollVoteError: {
		es: '⚠️ ¡Parece que la encuesta ya terminó!',
		en: '⚠️ Seems like the poll has ended!',
		ja: '⚠️ Seems like the poll has ended!',
	},
	pollButtonToggleAnon: {
		es: 'Voto anónimo',
		en: 'Anonymous vote',
		ja: 'Anonymous vote',
	},
	pollInsufficientTime: {
		es: '⚠️ ¡Tiempo insuficiente! Pon al menos 10 segundos',
		en: '⚠️ Insufficient time! Set at least 10 seconds',
		ja: '⚠️ Insufficient time! Set at least 10 seconds',
	},
	
	feedAuthor: {
		es: 'Asistente de configuración de Feed de imágenes',
		en: 'Imageboard Feed Configuration Wizard',
		ja: 'Imageboard Feed Configuration Wizard',
	},
	feedCancelledStep: {
		es: 'Se canceló la configuración de Feeds',
		en: 'The Feeds Wizard has been terminated',
		ja: 'The Feeds Wizard has been terminated',
	},
	feedFinishedStep: {
		es: 'Se finalizó la configuración de Feeds',
		en: 'The Feeds Wizard has been closed',
		ja: 'The Feeds Wizard has been closed',
	},
	feedSelectFeed: {
		es: 'Selecciona un Feed...',
		en: 'Select a Feed...',
		ja: 'Select a Feed...',
	},
	feedViewUrlsName: {
		es: 'Enlaces',
		en: 'Links',
		ja: 'Links',
	},
	feedViewTagsLinkName: {
		es: 'Seguir Tags',
		en: 'Follow Tags',
		ja: 'Follow Tags',
	},
	feedSetTagsAdd: {
		es: `Se comenzaron a seguir las tags: ${subl(0)}`,
		en: `Started following the tags: ${subl(0)}`,
		ja: `Started following the tags: ${subl(0)}`,
	},
	feedSetTagsRemove: {
		es: `Se dejaron de seguir las tags: ${subl(0)}`,
		en: `Stopped following the tags: ${subl(0)}`,
		ja: `Stopped following the tags: ${subl(0)}`,
	},
	feedSetTagsUnchanged: {
		es: '⚠️ No se modificaron las tags seguidas. Asegúrate de estar siguiendo 6 tags o menos',
		en: '⚠️ Followed tags were not modified. Make sure not to be following more than 6 tags',
		ja: '⚠️ Followed tags were not modified. Make sure not to be following more than 6 tags',
	},
	feedSetTagsButtonView: {
		es: 'Ver Tags Seguidas',
		en: 'View Followed Tags',
		ja: 'View Followed Tags',
	},
	feedSetTagsButtonAdd: {
		es: 'Seguir Tags',
		en: 'Follow Tags',
		ja: 'Follow Tags',
	},
	feedSetTagsButtonRemove: {
		es: 'Dejar de Seguir Tags',
		en: 'Unfollow Tags',
		ja: 'Unfollow Tags',
	},
	feedEditTagsTitleAdd: {
		es: 'Seguir Tags...',
		en: 'Follow Tags...',
		ja: 'Follow Tags...',
	},
	feedEditTagsTitleRemove: {
		es: 'Dejar de Seguir Tags...',
		en: 'Unfollow Tags...',
		ja: 'Unfollow Tags...',
	},
	feedEditTagsInputAdd: {
		es: 'Tags que quieres seguir, sin comas',
		en: 'Tags you wanna follow, without commas',
		ja: 'Tags you wanna follow, without commas',
	},
	feedEditTagsInputRemove: {
		es: 'Tags a dejar de seguir, sin comas',
		en: 'Tags you wanna unfollow, without commas',
		ja: 'Tags you wanna unfollow, without commas',
	},
	feedDeletePostTitle: {
		es: 'Post Eliminado',
		en: 'Post Deleted',
		ja: 'Post Deleted',
	},
	feedDeletePostAdvice: {
		es: 'Puedes blacklistear tags si colocas un "-" delante',
		en: 'You can blacklist a tag if you put a "-" in front',
		ja: 'You can blacklist a tag if you put a "-" in front',
	},
	feedDeletePostTagsName: {
		es: 'Tags Rescatadas',
		en: 'Recovered Tags',
		ja: 'Recovered Tags',
	},
	feedDeletePostLinkName: {
		es: 'Enlace',
		en: 'Link',
		ja: 'リンク',
	},
	feedFeedbackExpired: {
		es: '❌ Esta campaña de retroalimentación ha finalizado',
		en: '❌ This feedback campaign has already finished',
		ja: '❌ このフィードバックキャンペーンはすでに終了しています',
	},
	feedFeedbackThanks: {
		es: '💖 ¡Gracias por responder!',
		en: '💖 Thanks for your feedback!',
		ja: '💖 フィードバックありがとうございます！',
	},
	feedFeedbackTitle: {
		es: 'Dar Retroalimentación',
		en: 'Give Feedback',
		ja: 'フィードバックを送る',
	},
	feedFeedbackName: {
		es: 'Retroalimentación',
		en: 'Feedback',
		ja: 'フィードバック',
	},

	booruNotifTitle: {
		es: 'Notificación de Feed Suscripto',
		en: 'Subscribed Feed Notification',
		ja: 'Subscribed Feed Notification',
	},
	booruNotifDescription: {
		es: '¡Esta publicación podría interesarte!',
		en: 'This post could catch your eye!',
		ja: 'This post could catch your eye!',
	},
	booruNotifTagsName: {
		es: 'Tags de Interés',
		en: 'Tags of Interest',
		ja: 'Tags of Interest',
	},

	inforolNoRoleProvided: {
		es: '❌ ¡Debes indicar al menos un rol!',
		en: '❌ You must indicate at least one role!',
		ja: '❌ 少なくとも1つのロールを指定する必要があります',
	},
	inforolNoMembersFound: {
		es: '⚠️ No se encontró ningún miembro con los roles indicados...',
		en: '⚠️ Couldn\'t find any member with the provided roles...',
		ja: '⚠️ 指定されたロールを持つメンバーが見つかりませんでした…',
	},
	inforolDashboardTitle: {
		es: 'Análisis de roles (Total)',
		en: 'Roles analysis (Total)',
		ja: 'ロール分析（合計）',
	},
	inforolDashboardRolesListName: {
		es: 'Roles en análisis',
		en: 'Analyzed roles',
		ja: '分析中のロール',
	},
	inforolDashboardCaseName: {
		es: 'Criterio',
		en: 'Criterion',
		ja: '条件',
	},
	inforolDashboardCaseValue: {
		es: `Coincidencia *${subif(0, '=', true, 'exacta', 'parcial')}*`,
		en: `*${subif(0, '=', true, 'Exact', 'Partial')}* match`,
		ja: `*${subif(0, '=', true, '厳密', '部分')}*一致`,
	},
	inforolDashboardCountName: {
		es: 'Cuenta total',
		en: 'Total count',
		ja: '合計数',
	},
	inforolDashboardFooter: {
		es: 'Página principal',
		en: 'Main page',
		ja: '全体図',
	},
	inforolDetailTitle: {
		es: 'Análisis de roles (Detalle)',
		en: 'Roles analysis (Detail)',
		ja: 'ロール分析（詳細）',
	},
	inforolDetailMembersListName: {
		es: 'Lista de usuarios',
		en: 'Users list',
		ja: 'ユーザーリスト',
	},

	yoCancelledStep: {
		es: 'Se canceló la configuración de Preferencias de Usuario',
		en: 'The User Preferences configuration was cancelled',
		ja: 'ユーザー設定の構成がキャンセルされました',
	},
	yoFinishedStep: {
		es: 'Se cerró el Asistente de Preferencias de Usuario',
		en: 'The User Preferences Wizard has been closed',
		ja: 'ユーザー設定ウィザードが閉じました',
	},
	yoDashboardAuthor: {
		es: 'Preferencias de Usuario',
		en: 'User Preferences',
		ja: 'ユーザー設定',
	},
	yoDashboardLanguageName: {
		es: 'Idioma',
		en: 'Language',
		ja: '言語',
	},
	yoDashboardPRCName: {
		es: 'Créditos',
		en: 'Credits',
		ja: 'クレジット',
	},
	yoDashboardFeedTagsName: {
		es: 'Tags de Feed seguidas',
		en: 'Followed Feed Tags',
		ja: 'フォローされたフィードタグ',
	},
	yoDashboardFeedTagsValue: {
		es: `<:tagswhite:921788204540100608> Siguiendo ${subl(0)} tag${subif(0, '!=', 1, 's')} en ${subl(1)} canal${subif(1, '!=', 1, 'es')}`,
		en: `<:tagswhite:921788204540100608> Following ${subl(0)} tag${subif(0, '!=', 1, 's')} in ${subl(1)} channel${subif(1, '!=', 1, 's')}`,
		ja: `<:tagswhite:921788204540100608> ${subl(1)}チャンネルで${subl(0)}タグをフォロー`,
	},
	yoDashboardName: {
		es: 'Panel Principal',
		en: 'Dashboard',
		ja: 'ダッシュボード',
	},
	yoDashboardButtonLanguage: {
		es: 'Español',
		en: 'English',
		ja: '日本語',
	},
	yoDashboardButtonTags: {
		es: 'Tags Seguidas...',
		en: 'Followed Tags...',
		ja: 'フォロー中のタグ…',
	},
	yoDashboardMenuConfig: {
		es: 'Preferencias',
		en: 'Preferences',
		ja: '設定',
	},
	yoDashboardMenuConfigFeedDesc: {
		es: 'Administra tus tags seguidas en Feeds de imágenes',
		en: 'Manage your followed tags in Imageboard Feeds',
		ja: 'フォローしている画像掲示板フィードタグを管理する',
	},
	yoDashboardMenuConfigVoiceDesc: {
		es: 'Configura preferencias personales de sesiones PuréVoice',
		en: 'Configure personal preferences for PuréVoice sessions',
		ja: 'PuréVoiceセッションの個人設定を構成する',
	},
	yoDashboardMenuConfigPixixDesc: {
		es: 'Corrige el formato de enlaces de pixiv automáticamente',
		en: 'Fixes pixiv embeds automatically',
		ja: 'pixivの埋め込みを自動的に修正します',
	},
	yoDashboardMenuConfigTwitterDesc: {
		es: 'Corrige el formato de enlaces de X automáticamente (VX/FX)',
		en: 'Fixes X embeds automatically (VX/FX)',
		ja: 'Xの埋め込みを自動的に修正します (VX/FX)',
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
		ja: paragraph(
			'画像掲示板のフィードを購読していません！',
			'PuréFeedシステムがインストールされているチャンネルであれば、タグのフォローを開始できます',
		),
	},
	yoVoiceStep: {
		es: 'Preferencias personales de PuréVoice',
		en: 'PuréVoice personal preferences',
		ja: 'PuréVoiceの個人設定',
	},
	yoVoiceTitle: {
		es: 'Configura tus preferencias personales del sistema PuréVoice',
		en: 'Configure your personal preferences for the PuréVoice system',
		ja: 'PuréVoiceシステムの個人設定を構成する',
	},
	yoVoicePingName: {
		es: 'Menciones',
		en: 'Pings',
		ja: 'メンション',
	},
	yoVoiceAutonameName: {
		es: 'Nombre automático',
		en: 'Autoname',
		ja: '自動名',
	},
	yoVoiceKillDelayName: {
		es: 'Retardo de muerte',
		en: 'Kill delay',
		ja: 'キル遅延',
	},
	yoVoiceAutonameValueNone: {
		es: '_Ninguno._',
		en: '_None._',
		ja: '「なし。」',
	},
	yoVoiceAutonameButtonLabel: {
		es: 'Nombre de Sesión Automático...',
		en: 'Session Autoname...',
		ja: 'セッション自動名…',
	},
	yoVoiceAutonameModalTitle: {
		es: 'Dar Nombre Automático',
		en: 'Set Autoname',
		ja: '自動名を設定',
	},
	yoVoiceAutonameModalNamingPlaceholder: {
		es: 'Bhava-Agra',
		en: 'Bhava-Agra',
		ja: '有頂天',
	},
	yoVoiceAutonameModalEmojiPlaceholder: {
		es: 'Emoji unicode. (Ejemplo: 🍑)',
		en: 'Unicode emoji. (Example: 🍑)',
		ja: 'Unicode絵文字。(例: 🍑)',
	},
	yoVoiceAutonameSuccess: {
		es: '✅ Nombre automático actualizado',
		en: '✅ Autoname updated',
		ja: '✅ 自動名が更新されました',
	},
	yoVoiceKillDelayButtonLabel: {
		es: 'Retardo de Muerte de Sesión...',
		en: 'Session Kill Delay...',
		ja: 'セッションキル遅延…',
	},
	yoVoiceKillDelayModalTitle: {
		es: 'Indicar Retardo de Muerte',
		en: 'Set Kill Delay',
		ja: 'キル遅延を設定',
	},
	yoVoiceKillDelayModalDelayLabel: {
		es: 'Duración de retardo',
		en: 'Delay duration',
		ja: '遅延期間',
	},
	yoVoiceKillDelayModalDelayPlaceholder: {
		es: 'Ejemplo: 4m 45s. 0 = inactivo. 10m máx.',
		en: 'e.g., 4m 45s. 0 = disabled. 10m max.',
		ja: 'たとえば、4m 45s。0＝無効。最大10m。',
	},
	yoVoiceKillDelaySuccess: {
		es: '✅ Retardo de muerte actualizado',
		en: '✅ Kill delay updated',
		ja: '✅ キル遅延が更新されました',
	},
	yoVoiceMenuPing: {
		es: 'Configurar menciones...',
		en: 'Configure pings...',
		ja: 'メンションを設定…',
	},
	yoVoiceMenuPingAlwaysDesc: {
		es: 'Serás mencionado al crear o unirte a una sesión',
		en: 'You\'ll be pinged when creating or joining a session',
		ja: 'セッションを作成または参加するときにメンションされます',
	},
	yoVoiceMenuPingOnCreateLabel: {
		es: 'Al crear',
		en: 'On creation',
		ja: '作成について',
	},
	yoVoiceMenuPingOnCreateDesc: {
		es: 'Solo serás mencionado al crear una nueva sesión',
		en: 'You\'ll only be pinged when creating a new session',
		ja: '新しいセッションを作成するときにのみメンションされます',
	},
	yoVoiceMenuPingNeverDesc: {
		es: 'No serás mencionado al crear o unirte a una sesión',
		en: 'You won\'t be pinged when creating or joining a session',
		ja: 'セッションの作成時またはセッションへの参加時にメンションされることはありません',
	},
	yoPixivStep: {
		es: 'Conversor de enlaces de pixiv',
		en: 'pixiv link converter',
		ja: 'pixivリンクコンバーター',
	},
	yoPixivTitle: {
		es: `El conversor de enlaces de pixiv está actualmente ${subif(0, '=', true, 'activado', 'desactivado')}`,
		en: `The pixiv link converter is currently ${subif(0, '=', true, 'enabled', 'disabled')}`,
		ja: `pixivリンクコンバーターは現在${subif(0, '=', true, '有効', '無効')}です`,
	},
	yoPixivStateAlreadySet: {
		es: `⚠️️ El servicio ya estaba ${subif(0, '=', true, 'activado', 'desactivado')}`,
		en: `⚠️️ The service was already ${subif(0, '=', true, 'enabled', 'disabled')}`,
		ja: `⚠️️ サービスはすでに${subif(0, '=', true, '有効', '無効')}になっています`,
	},
	yoTwitterStep: {
		es: 'Conversor de enlaces de Twitter/X',
		en: 'Twitter/X link converter',
		ja: 'Twitter/Xリンクコンバーター',
	},
	yoTwitterTitle: {
		es: 'Elige el servicio de conversión a usar para Twitter/X',
		en: 'Choose which conversion service to use for Twitter/X',
		ja: 'Twitter/Xに使用する変換サービスを選択してください',
	},
	yoTwitterMenuService: {
		es: 'Servicio',
		en: 'Service',
		ja: 'サービス',
	},
	yoTwitterMenuServiceVxDesc: {
		es: 'Opción recomendada',
		en: 'Recommended solution',
		ja: '推奨される解決策',
	},
	yoTwitterMenuServiceFxDesc: {
		es: 'Buena alternativa, pero menos segura y privada',
		en: 'Good alternative, but less safe and private',
		ja: '良い代替手段だが、安全性とプライバシーは劣る',
	},
	yoTwitterMenuServiceNoneLabel: {
		es: 'Ninguno',
		en: 'None',
		ja: 'なし',
	},
	yoTwitterMenuServiceNoneDesc: {
		es: 'No convertir enlaces de Twitter/X automáticamente',
		en: 'Do not convert Twitter/X links automatically',
		ja: 'Twitter/Xリンクを自動的に変換しない',
	},
	yoTwitterSuccess: {
		es: '✅ Servicio de conversión actualizado',
		en: '✅ Converter service updated',
		ja: '✅ コンバーターサービスが更新されました',
	},
	yoSelectTagsChannelTitle: {
		es: 'Selecciona uno de tus Feeds seguidos',
		en: 'Select one of the Feeds you follow',
		ja: 'フォローしているフィードのいずれかを選択して',
	},
	yoTagsName: {
		es: 'Tags Seguidas',
		en: 'Followed Tags',
		ja: 'フォロー中のタグ',
	},
	yoTagsValueDefault: {
		es: '<Todavía no sigues ninguna tag>',
		en: '<You aren\'t following any tag yet>',
		ja: '【まだタグをフォローしていません】',
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
		if(this.is('es')) return 'ja';
		return 'en';
	}

	/**
	 * Devuelve el traductor del siguiente lenguaje al actual
	 * @returns {Translator}
	 */
	get nextTranslator() {
		return new Translator(this.next);
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
		const subLocaleRegex = /(\d+){\.\.\.}(?:<!{((?:[!=<>]{1,2}):[^\|]+)\|'((?:(?!'}).)*)'})?(?:<\?{'((?:(?!'}).)*)'})?/g;
		const translation = translationTemplate.replace(subLocaleRegex, (_match, /**@type {String}*/i, /**@type {String}*/condition, /**@type {String}*/whenTrue, /**@type {String}*/defaultValue) => {
			const value = values[i];
	
			if(condition != undefined) {
				const leftValue = (typeof value === 'boolean') ? `__${value}__` : `${value}`;
				const [ operator, rightValue ] = /**@type {[ ConditionString, String ]}*/(condition.split(':'));
				
				if(!conditionFns.has(operator))
					throw 'Operador inválido';

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
