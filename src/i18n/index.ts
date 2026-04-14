import type { UserCacheResolvable } from '@/utils/usercache';
import { fetchUserCache } from '@/utils/usercache';
import type { ValuesOf } from '../types/util';
import Locales, { defaultLocale } from './locales';

export { Locales };

export type LocaleKey = ValuesOf<typeof Locales>;

type ConditionString = (typeof ConditionFields)[keyof typeof ConditionFields];

type Translation = Record<LocaleKey, string>;

export const validLocaleKeys: string[] = Object.values(Locales);
export function isValidLocaleKey(locale: unknown): locale is LocaleKey {
	return typeof locale === 'string' && validLocaleKeys.includes(locale);
}

function paragraph(...lines: string[]) {
	return lines.join('\n');
}

/**
 * @param i Índice del valor de reemplazo
 * @param defaultValue Valor por defecto si no se ingresó un valor en el índice
 */
function subl(i: number, defaultValue?: string) {
	if (i == null) throw ReferenceError('Se esperaba un índice de componente de traducción');

	const baseSub = `${i}{...}`;

	if (!defaultValue) return baseSub;

	return `${baseSub}<?{'${defaultValue}'}`;
}

export const ConditionFields = {
	Equal: '=',
	Distinct: '!=',
	Lesser: '<',
	Greater: '>',
	LesserOrEqual: '<=',
	GreaterOrEqual: '>=',
} as const;

/**
 * @param i Índice del valor a usar como operando izquierdo de la comprobación
 * @param condition Condición a evaluar con el valor de comprobación
 * @param Operando derecho de la operación. Un valor cualquiera, no un índice
 * @param whenTrue Valor de reemplazo en caso de verdadero
 * @param whenFalse Valor de reemplazo en caso de falso
 */
function subif<TReplacement>(
	i: number,
	condition: ConditionString,
	rightOperand: TReplacement,
	whenTrue: string,
	whenFalse: string | null = '',
) {
	if (i == null) throw ReferenceError('Se esperaba un índice de componente de traducción');
	if (!whenTrue)
		throw ReferenceError('Se esperaba un valor para verdadero en componente de traducción');

	const r = typeof rightOperand === 'boolean' ? `__${rightOperand}__` : rightOperand;

	return `${i}{...}<!{${condition}:${r}|'${whenTrue}'}<?{'${whenFalse}'}`;
}

/**@satisfies {Record<string, Translation>}*/
const localesObject = {
	currentLanguage: {
		es: 'Español',
		en: 'English',
		ja: '日本語',
	},
	currentLanguageEmojiId: {
		en: '1084646415319453756',
		es: '1084646419853488209',
		ja: '🇯🇵',
	},
	currentLanguageEmoji: {
		en: '<:en:1084646415319453756>',
		es: '<:es:1084646419853488209>',
		ja: '🇯🇵',
	},
	languageMenuPlaceholder: {
		es: 'Seleccionar idioma',
		en: 'Select Language',
		ja: '言語を選択',
	},

	dmDisclaimer: {
		es: 'Nota: Bot de Puré no opera con mensajes privados',
		en: 'Note: Bot de Puré does not reply to DMs',
		ja: '注: ピューレボットは DM に返信しません',
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
	insufficientPermissions: {
		es: '❌ No tienes permiso para hacer esto',
		en: "❌ You're not allowed to do that",
		ja: '❌ あなたにはそれをする許可がありません',
	},
	invalidEmptyCommandName: {
		es: '❌ Debes escribir un comando después del prefijo (por ejemplo: p!help)',
		en: '❌ You need to type a command after the prefix (for example: p!help)',
		ja: '❌ プレフィックスの後にコマンドを入力してください（例: p!help）',
	},
	unknownInteraction: {
		es: '🍔 Recibí una acción, pero no sé cómo responderla. Esto es un problema... mientras arreglo algunas cosas, toma una hamburguesa',
		en: "🍔 I received an action, but I don't know how to reply to it. This is a problem... while I fix some things, take this burger",
		ja: '🍔 リクエストを受け取ったのですが、返信の仕方がわかりません。これは問題です...いくつか修正している間、このハンバーガーを受け取ってください',
	},
	huskInteraction: {
		es: '☕ Parece que encontraste un botón, menú desplegable o ventana modal sin función. Mientras conecto algunos cables, ten un café',
		en: '☕ Seems like you found a button, select menu, or modal window without a function. While I wire some things up, have this coffee',
		ja: '☕ 機能のないボタン、選択メニュー、またはモーダルウィンドウを見つけたようです。配線している間にコーヒーを飲みましょう',
	},
	unauthorizedInteraction: {
		es: '❌ No puedes hacer eso. Si intentaste interactuar con un mensaje de comando, prueba usando el comando tú mismo',
		en: "❌ You can't do that. If you tried to interact with a command message, try calling the command yourself",
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
		en: "This command or action requires permissions that you don't currently have to execute",
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
			"I'm a well educated girl, so I won't do anything until I'm given permission to do so. You can ask a mod to review and address the issue",
		),
		ja: paragraph(
			'I don\t have the required permissions to execute the command or action that you requested in this channel',
			"I'm a well educated girl, so I won't do anything until I'm given permission to do so. You can ask a mod to review and address the issue",
		),
	},

	suggestHelpForCommand: {
		es: `Usa \`${subl(0)}ayuda ${subl(1)}\` para más información`,
		en: `Use \`${subl(0)}help ${subl(1)}\` for more information`,
		ja: `詳細については\`${subl(0)}help ${subl(1)}\`を使用してください`,
	},

	somethingWentWrong: {
		es: '⚠️️ Algo salió mal',
		en: '⚠️️ Something went wrong',
		ja: '⚠️️ 問題が発生しました',
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
		ja: '⚠️️ 無効な ID',
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
	invalidDate: {
		es: '⚠️️ Fecha inválida',
		en: '⚠️️ Invalid date',
		ja: '⚠️️ 無効な日付',
	},
	invalidTime: {
		es: '⚠️️ Tiempo inválido',
		en: '⚠️️ Invalid time',
		ja: '⚠️️ 無効な時刻',
	},
	invalidEmoji: {
		es: '⚠️️ Emoji inválido',
		en: '⚠️️ Invalid emoji',
		ja: '⚠️️ 無効な絵文字',
	},
	userConfigRecommended: {
		es: `⚠️ Es recomendable configurar tus preferencias con \`${subl(0)}yo\` antes de usar este comando`,
		en: `⚠️ It's recommended to configure your preferences through \`${subl(0)}me\` before using this command`,
		ja: `⚠️ このコマンドを使用する前に、\`${subl(0)}me\`で設定を行うことをお勧めします`,
	},

	welcome: {
		es: 'Bienvenid@',
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
		ja: '見る',
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
	buttonClose: {
		es: 'Cerrar',
		en: 'Close',
		ja: '閉じる',
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
	buttonRefresh: {
		es: 'Refrescar',
		en: 'Refresh',
		ja: '更新',
	},
	buttonExpand: {
		es: 'Expandir',
		en: 'Expand',
		ja: '拡大',
	},
	buttonShowMeHow: {
		es: 'Muéstrame cómo',
		en: 'Show me how',
		ja: 'やり方を見せて',
	},

	genericCounter: {
		es: `${subl(0)}${subif(1, '=', true, ' de')}`,
		en: `${subl(0)}${subif(1, '=', true, ' of')}`,
		ja: `${subl(0)}`,
	},

	genericNumberOfPrefix: {
		es: '',
		en: '',
		ja: '',
	},
	genericNumberOfSuffix: {
		es: ' de',
		en: ' of',
		ja: '',
	},

	commandByName: {
		es: `Comando invocado por ${subl(0)}`,
		en: `Command called by ${subl(0)}`,
		ja: `${subl(0)}によって呼び出されたコマンド`,
	},

	actionGetEmojis: {
		es: 'Obtener Emojis',
		en: 'Fetch Emojis',
		ja: '絵文字を取得',
	},
	actionGetSticker: {
		es: 'Obtener Sticker',
		en: 'Fetch Sticker',
		ja: 'ステッカーを取得',
	},
	actionFindSource: {
		es: 'Buscar Fuente',
		en: 'Find Source',
		ja: 'ソースを検索',
	},
	actionDeleteUserPost: {
		es: 'Borrar Post',
		en: 'Delete Post',
		ja: '投稿を削除',
	},
	actionPVTransferAdmin: {
		es: 'Sesión PV • Ceder Administrador',
		en: 'PV Session • Transfer Admin',
		ja: 'PV セッション・アドミンを移行る',
	},
	actionPVGiveMod: {
		es: 'Sesión PV • Volver Moderador',
		en: 'PV Session • Promote to Mod',
		ja: 'PV セッション・モデレーターを与える',
	},
	actionPVRemoveMod: {
		es: 'Sesión PV • Quitar Moderador',
		en: 'PV Session • Demote Mod ',
		ja: 'PV セッション・モデレーターを与える',
	},
	actionPVBanMember: {
		es: 'Sesión PV • Expulsar',
		en: 'PV Session • Ban',
		ja: 'PV セッション・禁止する',
	},
	actionPVUnbanMember: {
		es: 'Sesión PV • Remover Expulsión',
		en: 'PV Session • Unban',
		ja: 'PV セッション・禁止を解除',
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
		es: 'Preferencias de usuario',
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
		en: "⚠️ None of the mentioned members were updated. It could be that I don't have permission to manage members",
		ja: "⚠️ None of the mentioned members were updated. It could be that I don't have permission to manage members",
	},

	anarquiaCouldNotLoadEmoji: {
		es: '⚠️ No pude cargar la imagen del emote que mencionaste. ¡Prueba una vez más! Si sigues sin poder, puede ser un problema con el emote en cuestión',
		en: "⚠️ Couldn't load the image for the emote you mentioned. Try it again! If you still can't, it could be due to an issue with the emote in question",
		ja: '⚠️ 指定したエモートの画像を読み込めませんでした。もう一度お試しください！それでも読み込めない場合は、問題のエモートに問題がある可能性があります',
	},
	anarquiaSkillIssue: {
		es: '❌ No tienes ninguna carga de esta habilidad. Interactúa más con la Tabla de Puré para tener oportunidad de recibir habilidades especiales',
		en: '❌ You have no stacks of this skill. Interact more with the Puré Matrix for a chance to receive special skills',
		ja: '❌ このスキルのスタックはありません。特別なスキルを受け取る機会を得るために、Puré Matrix ともっと交流する',
	},

	avatarUserNotFoundNotice: {
		es: paragraph(
			`⚠️ ¡Usuario${subif(1, '!=', 1, 's')} **${subl(0)}** no encontrado${subif(1, '!=', 1, 's')}!`,
			`-# Recuerda separar cada usuario con una coma y escribir correctamente. Usa \`${subl(2)}ayuda avatar\` para más información`,
		),
		en: paragraph(
			`⚠️ User${subif(1, '!=', 1, 's')} **${subl(0)}** ${subif(1, '!=', 1, 'were', 'was')} not found!`,
			`-# Remember to separate each username with a comma and spell correctly. Use \`${subl(2)}help avatar\` for more information`,
		),
		ja: paragraph(
			`⚠️ ユーザー**${subl(0)}**が見つかりませんでした！`,
			`各ユーザー名はカンマで区切り、正しく入力してください。詳細については \`${subl(2)}help avatar\` を使用してください。`,
		),
	},
	avatarGlobalProfileEpigraph: {
		es: '-# Perfil global',
		en: '-# Global profile',
		ja: '-# グローバルプロフィール',
	},
	avatarGuildProfileEpigraph: {
		es: '-# Perfil de servidor',
		en: '-# Guild Profile',
		ja: '-# サーバープロファイル',
	},
	avatarGuildProfileSource: {
		es: `📍 En _${subl(0)}_`,
		en: `📍 On _${subl(0)}_`,
		ja: `📍 _${subl(0)}_に`,
	},
	avatarAvatar: {
		es: 'Avatar',
		en: 'Avatar',
		ja: 'アバター',
	},
	avatarBanner: {
		es: 'Portada',
		en: 'Banner',
		ja: 'バナー',
	},
	avatarGlobalAvatarAlt: {
		es: `Avatar global de ${subl(0)}`,
		en: `${subl(0)}'s global avatar`,
		ja: `${subl(0)}さんのグローバルアバター`,
	},
	avatarGlobalBannerAlt: {
		es: `Portada global de ${subl(0)}`,
		en: `${subl(0)}'s global banner`,
		ja: `${subl(0)}さんのグローバルバナー`,
	},
	avatarGuildAvatarAlt: {
		es: `Avatar global de ${subl(0)}`,
		en: `${subl(0)}'s global avatar`,
		ja: `${subl(0)}さんのグローバルアバター`,
	},
	avatarGuildBannerAlt: {
		es: `Portada de servidor de ${subl(0)}`,
		en: `${subl(0)}'s guild banner`,
		ja: `${subl(0)}さんのサーバーバナー`,
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

	transferAmountExpected: {
		es: '⚠️ Se esperaba que especifiques el monto a transferir',
		en: '⚠️ Amount to transfer expected',
		ja: '⚠️ 送金金額を示すことが期待されていました',
	},
	transferTargetExpected: {
		es: '⚠️ Se esperaba que indiques el usuario objetivo',
		en: '⚠️ Target user expected',
		ja: '⚠️ 対象ユーザーを示すことが期待されていました',
	},
	transferHumanExpected: {
		es: '❌ No se puede transferir <:prc:1097208828946301123> a bots',
		en: "❌ Can't transfer <:prc:1097208828946301123> to bots",
		ja: '❌ <:prc:1097208828946301123>をボットに転送できません',
	},
	transferOtherExpected: {
		es: '❌ No puedes transferirte <:prc:1097208828946301123> a ti mismo',
		en: "❌ You can't transfer <:prc:1097208828946301123> to yourself",
		ja: '❌ <:prc:1097208828946301123>を自分自身に譲渡することはできません',
	},
	transferAmountTooLow: {
		es: '❌ El monto de la transferencia es demasiado bajo. Debes transferir al menos <:prc:1097208828946301123> 1',
		en: '❌ The transfer amount is too low. You must transfer at least <:prc:1097208828946301123> 1',
		ja: '❌ 転送量が少なすぎます。少なくとも<:prc:1097208828946301123> 1を転送する必要があります',
	},
	transferInsufficient: {
		es: '⚠️ Saldo insuficiente',
		en: '⚠️ Insufficient funds',
		ja: '⚠️ 残高不足',
	},
	transferError: {
		es: '⚠️ Ocurrió un error interno durante la transacción',
		en: '⚠️ An internal error occurred during the transaction',
		ja: '⚠️ トランザクション中に内部エラーが発生しました',
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

	queueExpected: {
		es: '⚠️ No se encontró una cola de reproducción',
		en: "⚠️ Couldn't find a player queue",
		ja: '⚠️ 再生キューが見つかりません',
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
	queueDescriptionLoopTrack: {
		es: '<:repeat:1356977712149037087> Modo de repetición de pista activo',
		en: '<:repeat:1356977712149037087> Track loop mode is enabled',
		ja: '<:repeat:1356977712149037087> トラックループモードが有効になりました',
	},
	queueDescriptionLoopQueue: {
		es: '<:repeat:1356977712149037087> Modo de repetición de cola activo',
		en: '<:repeat:1356977712149037087> Queue loop mode is enabled',
		ja: '<:repeat:1356977712149037087> キューループモードが有効になりました',
	},
	queueDescriptionLoopAutoplay: {
		es: '<:headphonessimple:1360868342411427892> Auto-DJ activo',
		en: '<:headphonessimple:1360868342411427892> Auto DJ is enabled',
		ja: '<:headphonessimple:1360868342411427892> オート DJ が有効になりました',
	},
	queueDescriptionShuffle: {
		es: '<:shuffle:1356977721799868426> Modo de cola aleatoria activo',
		en: '<:shuffle:1356977721799868426> Queue shuffle mode is enabled',
		ja: '<:shuffle:1356977721799868426> キューシャッフルが有効になりました',
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
		en: "Couldn't find the track to remove",
		ja: '削除するトラックが見つかりませんでした',
	},
	queueDequeueDescriptionTrackNotFound: {
		es: 'Puedes usar p!cola nuevamente e intentarlo otra vez',
		en: 'You can use p!queue once more and try it again',
		ja: 'もう一度 p!queue を使用して再試行してください',
	},
	queueDequeueTitleDequeued: {
		es: 'Pista quitada',
		en: 'Track removed',
		ja: 'トラックが削除されました',
	},
	queueSkipTitleNoTrack: {
		es: 'No hay ninguna pista a saltar actualmente',
		en: 'No currently playing track to skip',
		ja: 'スキップできる現在再生中のトラックはありません',
	},
	queueSkipTitleSkipped: {
		es: 'Pista saltada',
		en: 'Track skipped',
		ja: 'トラックがスキップされました',
	},
	queueShuffleTitle: {
		es: `Se ${subif(0, '=', true, 'activó', 'desactivó')} el modo de cola aleatoria`,
		en: `Queue shuffle mode ${subif(0, '=', true, 'enabled', 'disabled')}`,
		ja: `キューシャッフルが${subif(0, '=', true, '有効', '無効')}になりました`,
	},
	queueLoopTitleAutoplayEnabled: {
		es: '⚠️ El modo de repetición no se puede alternar.',
		en: '⚠️ Loop mode cannot be toggled',
		ja: '⚠️ リピートモードを切り替えることはできません。',
	},
	queueLoopDescAutoplayEnabled: {
		es: paragraph(
			'El modo de repetición no se puede alternar porque el <:headphonessimple:1360868342411427892> Auto-DJ está activo.',
			`Debes desactivar el <:headphonessimple:1360868342411427892> Auto-DJ para usar este botón. También puedes usar \`${subl(0, '/')}repetir\`.`,
		),
		en: paragraph(
			'Loop mode cannot be toggled because <:headphonessimple:1360868342411427892> Auto-DJ is active.',
			`You must turn off <:headphonessimple:1360868342411427892> Auto DJ to use this button. You can also use \`${subl(0, '/')}loop\`.`,
		),
		ja: paragraph(
			'リピートモードは、<:headphonessimple:1360868342411427892> オート DJ がアクティブなため変更できません。',
			`このボタンを使用するには、<:headphonessimple:1360868342411427892> オート DJ をオフにする必要があります。\`${subl(0, '/')}loop\`を使用することもできます。`,
		),
	},
	queueLoopTitle: {
		es: 'Establece un modo de repetición',
		en: 'Set a loop mode',
		ja: 'リピートモードを設定',
	},
	queueLoopMenuPlaceholder: {
		es: 'Modo de repetición...',
		en: 'Loop mode...',
		ja: 'リピートモード…',
	},
	queueLoopMenuOffDesc: {
		es: 'Desactivar cualquier modo de repetición activo',
		en: 'Disable any active loop mode',
		ja: 'リピートを無効にします',
	},
	queueLoopMenuTrackLabel: {
		es: 'Pista',
		en: 'Track',
		ja: 'トラック',
	},
	queueLoopMenuTrackDesc: {
		es: 'Repetir la pista actual',
		en: 'Loop the current track',
		ja: '現在のトラックをリピートします',
	},
	queueLoopMenuQueueLabel: {
		es: 'Cola',
		en: 'Queue',
		ja: 'キュー',
	},
	queueLoopMenuQueueDesc: {
		es: 'Repetir la cola completa',
		en: 'Loop the entire queue',
		ja: 'キュー全体をリピートします',
	},
	queueLoopMenuAutoplayLabel: {
		es: 'Auto-DJ',
		en: 'Auto DJ',
		ja: 'オート DJ',
	},
	queueLoopMenuAutoplayDesc: {
		es: 'Agregar pistas similares indefinidamente',
		en: 'Queue up similar tracks indefinitely',
		ja: '類似のトラックを無限に追加します',
	},
	queueLoopTitleNoTrack: {
		es: 'No hay ninguna pista a repetir actualmente',
		en: 'No currently playing track to loop',
		ja: 'ループできる現在再生中のトラックはありません',
	},
	queueLoopOffTitle: {
		es: 'Se desactivó el modo de repetición activo',
		en: 'Active loop mode has been disabled',
		ja: 'アクティブリピートモードが無効になりました',
	},
	queueLoopTrackTitle: {
		es: 'Se activó el modo de repetición de pista',
		en: 'Track loop mode has been enabled',
		ja: 'トラックのリピートモードが有効になりました',
	},
	queueLoopQueueTitle: {
		es: 'Se activó el modo de repetición de cola',
		en: 'Queue loop mode has been enabled',
		ja: 'キューのリピートモードが有効になりました',
	},
	queueLoopAutoplayTitle: {
		es: 'Se activó el Auto-DJ',
		en: 'Auto DJ has been enabled',
		ja: '自動 DJ が有効になりました',
	},
	sonandoTitle: {
		es: 'Escuchando Ahora',
		en: 'Now Playing',
		ja: '今聴いている',
	},

	catboxInvalidImage: {
		es: '⚠️ Debes indicar un enlace de imagen o una imagen directa a subir a Catbox',
		en: '⚠️ You must supply an image link or file to upload to Catbox',
		ja: '⚠️ Catbox にアップロードするイメージのリンクまたはファイルを提供する必要があります',
	},

	imgurRegisterTitle: {
		es: 'Haz click aquí para crear una Aplicación de Imgur',
		en: 'Click here to create an Imgur Application',
		ja: 'Imgur アプリケーションを作成するにはこちらをクリックしてください',
	},
	imgurRegisterDesc: {
		es: 'Precisarás la ID de cliente de la misma para registrar la aplicación en Bot de Puré. Si no tienes cuenta de Imgur, deberás crear una primero',
		en: "You'll need this App's client ID to register it within Bot de Puré. If you don't have an Imgur account, you'll have to sign up first",
		ja: 'Bot de Puréにアプリを登録するには、アプリのクライアント ID が必要になります。Imgur アカウントをお持ちでない場合は、まずアカウントを作成する必要があります',
	},
	imgurRegisterAuthTypeValue: {
		es: 'Selecciona la tercera opción (uso anónimo sin autorización)',
		en: 'Select the third option (anonymous usage without authorization)',
		ja: '3番目のオプション（許可なしの匿名使用）を選択します',
	},
	imgurRegisterFillFormName: {
		es: 'Rellenar formulario',
		en: 'Fill out the form',
		ja: 'フォームに記入する',
	},
	imgurRegisterFillFormValue: {
		es: 'El resto de campos son irrelevantes, rellena con cualquier dato válido',
		en: 'Remaining fields are irrelevant, fill them with any valid data',
		ja: '残りのフィールドは無関係なので、有効なデータを入力してください',
	},
	imgurRegisterLastlyName: {
		es: 'Por último...',
		en: 'Lastly...',
		ja: 'ついに…',
	},
	imgurRegisterLastlyValue: {
		es: paragraph(
			'Verifica el Captcha y envía el formulario de solicitud de creación de aplicación.',
			'Luego de crear la aplicación, copia la ID de Cliente (Client ID) que se te presenta y pégala luego de presionar el botón de este mensaje',
		),
		en: paragraph(
			'Verify the Captcha and submit the application creation request form.',
			'After creating the application, copy the Client ID that appears and paste it after pressing the button below this message',
		),
		ja: paragraph(
			'キャプチャを確認し、アプリケーション作成リクエストフォームを送信します。',
			'アプリケーションを作成したら、表示されるクライアント ID(Client ID)をコピーし、このメッセージのボタンを押した後に貼り付けます。',
		),
	},
	imgurRegisterModalTitle: {
		es: 'Registrar Aplicación de Imgur',
		en: 'Register Imgur Application',
		ja: 'Imgur アプリを登録する',
	},
	imgurRegisterModalClientIdLabel: {
		es: 'ID de Cliente de Imgur',
		en: 'Imgur Client ID',
		ja: 'Imgur クライアント ID',
	},
	imgurRegisterSuccess: {
		es: 'Se registró una Aplicación de Imgur personal',
		en: 'Personal Imgur Application has been registered',
		ja: '個人用の Imgur アプリケーションが登録されました',
	},
	imgurInvalidImage: {
		es: '⚠️ Debes indicar un enlace de imagen o una imagen directa a subir a Imgur',
		en: '⚠️ You must supply an image link or file to upload to Imgur',
		ja: '⚠️ Imgur にアップロードするイメージのリンクまたはファイルを提供する必要があります',
	},
	imgurUploadSuccessTitle: {
		es: 'Tu imagen',
		en: 'Your image',
		ja: 'あなたのイメーギ',
	},
	imgurUploadErrorTitle: {
		es: `⚠️ No se pudo subir la imagen Nº${subl(0)}`,
		en: `⚠️ Could not upload image No. ${subl(0)}`,
		ja: `⚠️ イメージ${subl(0)}をアップロードできません`,
	},
	imgurUploadErrorDesc: {
		es: 'Si es un problema de frecuencia de subida, prueba registrar tu propia aplicación para subir imágenes sin restricción global',
		en: 'Si es un problema de frecuencia de subida, prueba registrar tu propia aplicación para subir imágenes sin restricción global',
		ja: 'Si es un problema de frecuencia de subida, prueba registrar tu propia aplicación para subir imágenes sin restricción global',
	},

	saucenaoRegisterTitle: {
		es: 'Registra tu cuenta de SauceNAO en Bot de Puré',
		en: 'Register your SauceNAO account within Bot de Puré',
		ja: 'Bot de Puréで SauceNAO アカウントを登録する',
	},
	saucenaoRegisterAccountName: {
		es: 'Crea una cuenta',
		en: 'Create an account',
		ja: 'アカウントを作成する',
	},
	saucenaoRegisterAccountValue: {
		es: 'Si no tienes una cuenta de SauceNAO, puedes crearla [aquí](https://saucenao.com/user.php)',
		en: "If you don' have a SauceNAO account, you can create one [here](https://saucenao.com/user.php)",
		ja: 'SauceNAO アカウントをお持ちでない場合は、[こちら](https://saucenao.com/user.php)から作成できます',
	},
	saucenaoRegisterFooter: {
		es: 'Si seguir estos pasos no funciona, presiona el botón "regen" en la página del paso 2, copia la nueva clave y repite el paso 3',
		en: 'If following these steps doesn\'t work, press the "regen" button in the page from step 2, copy the new key and repeat step 3',
		ja: 'これらの手順に従っても機能しない場合は、手順 2のページで「regen」ボタンを押し、新しいキーをコピーして手順 3を繰り返します',
	},
	saucenaoRegisterAfterName: {
		es: 'Enlaza tu cuenta',
		en: 'Link your account',
		ja: 'アカウントをリンクする',
	},
	saucenaoRegisterAfterValue: {
		es: paragraph(
			'1. Inicia sesión en SauceNAO y dirígete [aquí](https://saucenao.com/user.php?page=search-api)',
			'2. Copia la clave de API (api key) que se te presenta',
			'3. Presiona el botón de este mensaje y pega la clave',
		),
		en: paragraph(
			'1. Log in to SauceNAO and go [here](https://saucenao.com/user.php?page=search-api)',
			'2. Copy the API key that is presented to you',
			'3. Press the button below this message and paste the key',
		),
		ja: paragraph(
			'1. SauceNAO にログインして[こちら](https://saucenao.com/user.php?page=search-api)へ',
			'2. 提示された API キー（api key）をコピーします',
			'3. このメッセージのボタンを押してキーを貼り付けます',
		),
	},
	saucenaoRegisterModalTitle: {
		es: 'Registrar Aplicación de SauceNAO',
		en: 'Register SauceNAO Application',
		ja: 'SauceNAO アプリを登録する',
	},
	saucenaoRegisterModalApiKeyLabel: {
		es: 'Clave de API de SauceNAO',
		en: 'SauceNAO API key',
		ja: 'SauceNAO API キー',
	},
	saucenaoRegisterSuccess: {
		es: 'Se registró una Aplicación de SauceNAO personal',
		en: 'Personal SauceNAO Application has been registered',
		ja: '個人用の SauceNAO アプリケーションが登録されました',
	},
	saucenaoUnregisteredNotice: {
		es: paragraph(
			'❌ Para usar este comando, debes [registrarte en SauceNAO](https://saucenao.com/user.php) y usar `p!saucenao --registrar`.',
			'Luego de haberte registrado en SauceNAO, puedes copiar tu clave API [aquí](https://saucenao.com/user.php?page=search-api "Este enlace lleva a tu panel de control de SauceNAO")',
		),
		en: paragraph(
			'❌ To use this command, you need to [sign up on SauceNAO](https://saucenao.com/user.php) and use `p!saucenao --register`.',
			'After signing up, you can copy your API key [here](https://saucenao.com/user.php?page=search-api "This link will take you to your SauceNAO dashboard")',
		),
		ja: paragraph(
			'❌ このコマンドを使用するには、[SauceNAO にサインアップ](https://saucenao.com/user.php)して`p!saucenao --register`を使用する必要があります。',
			'登録後、API キー[こちら](https://saucenao.com/user.php?page=search-api "このリンクは SauceNAO ダッシュボードにリンクします")からコピーできます',
		),
	},
	saucenaoInvalidImage: {
		es: '⚠️ Debes indicar un enlace de imagen o una imagen directa a buscar en SauceNAO',
		en: '⚠️ You must supply an image link or file to search on SauceNAO',
		ja: '⚠️ SauceNAO で検索するには、画像リンクまたは直接画像を示す必要があります',
	},
	saucenaoInvalidToken: {
		es: '⚠️ Clave de API de SauceNAO inválida',
		en: '⚠️ Invalid SauceNAO API key',
		ja: '⚠️ 無効な SauceNAO API キー',
	},
	saucenaoSearchSuccess: {
		es: `Resultado de la imagen Nº${subl(0)}`,
		en: `Image No. ${subl(0)} result`,
		ja: `画像#${subl(0)}結果`,
	},
	saucenaoSearchRedactedTitle: {
		es: `🔞 Se ocultó un resultado de la imagen Nº${subl(0)}`,
		en: `🔞 A result for image No. ${subl(0)} was hidden`,
		ja: `🔞 画像#${subl(0)}の結果は非表示になりました`,
	},
	saucenaoSearchRedactedDesc: {
		es: 'Puedes ver resultados NSFW en canales NSFW',
		en: `You can get NSFW results in NSFW channels`,
		ja: `NSFW チャンネルで NSFW の結果を得ることができます`,
	},
	saucenaoSearchNoResult: {
		es: `No se encontraron resultados para la imagen Nº${subl(0)}`,
		en: `No results were found for image No. ${subl(0)}`,
		ja: `画像#${subl(0)}に該当する結果は見つかりませんでした`,
	},
	saucenaoSearchErrorTitle: {
		es: `Resultado parcial de la imagen Nº${subl(0)}`,
		en: `Image No. ${subl(0)} partial result`,
		ja: `画像#${subl(0)}の部分結果`,
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
		en: "You haven't added any answers yet",
		ja: "You haven't added any answers yet",
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
	feedDeletePostTagsInaccessible: {
		es: 'Puede que el Post eliminado de Discord haya sido también eliminado del Booru del que se originó, pues no se pudieron recuperar sus tags',
		en: "The Post just deleted from Discord may have also been deleted from the Booru, given that I couldn't retrieve its tags",
		ja: 'Discord から削除された投稿は、タグを取得できなかったため、Booru からも削除された可能性があります',
	},
	feedDeletePostTagsUnknownError: {
		es: 'Post eliminado (no se pudo recuperar la información del Post y/o sus tags)',
		en: "Post deleted (couldn't retrieve the Post information and/or its tags)",
		ja: '投稿が削除されました（投稿情報やタグを取得できませんでした）',
	},
	feedPostTagsInaccessible: {
		es: '⚠️ Puede que el Post del que se intentó recuperar las tags se haya eliminado',
		en: '⚠️ The Post from which I tried to retrieve the tags may have been deleted',
		ja: '⚠️ タグを取得したポストが削除されている可能性があります',
	},
	feedPostTagsUnknownError: {
		es: paragraph(
			'⚠️ Ocurrió un problema al contactar con el Booru para recuperar las tags.',
			'Inténtalo de nuevo. Si el problema persiste, es probable que el objetivo no esté disponible o que se trate de un bug de mi parte',
		),
		en: paragraph(
			'⚠️ There was a problem contacting the Booru to retrieve the tags.',
			"Please try again. If the problem persists, it's likely that the target is unavailable or there's a bug on my end",
		),
		ja: paragraph(
			'⚠️ booru サービスに接続してタグを取得できませんでした。',
			'もう一度お試しください。問題が解決しない場合は、ターゲットが利用できないか、こちら側にバグがある可能性があります',
		),
	},
	feedContributeNoPendingRequest: {
		es: '¡Este post ya no tiene pedidos pendientes relevantes! ¡Bien!',
		en: "This post doesn't have relevant pending requests anymore! Sweet!",
		ja: 'このポストには関連する保留中の注文がなくなりました。素晴らしい！',
	},
	feedContributeDescription: {
		es: 'Este Post tiene etiquetas que indican pedidos pendientes. Puedes contribuir a la calidad de Gelbooru ayudando a etiquetar correctamente, entre otras cosas.',
		en: 'This post contains tags that signal pending requests. You could help Gelbooru get better by tagging posts appropiately, among other things.',
		ja: 'この投稿には保留中の注文を示すタグが付いています。適切なタグを付けるなど、Gelbooru の品質向上に貢献してください。',
	},
	feedContributeTagsName: {
		es: '<:handshake:1355496081550606486> Tags de pedidos pendientes',
		en: '<:handshake:1355496081550606486> Pending requests tags',
		ja: '<:handshake:1355496081550606486> 保留中のリクエストタグ',
	},
	feedContributeDanbooruFooter: {
		es: 'Este Post fue automáticamente portado desde Danbooru, por lo que es mejor concretar los pedidos ahí. Los cambios utilitarios hechos en Danbooru se verán reflejados en Gelbooru.',
		en: "This post was automatically ported from Danbooru, so it's best to concrete the requests there. Utility changes made in Danbooru will be reflected in Gelbooru.",
		ja: 'この投稿は Danbooru から自動的に移行されたため、リクエストは Danbooru へ送信することをお勧めします。Danbooru で行われたユーティリティの変更は Gelbooru にも反映されます。',
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

	infoGuildBannerAlt: {
		es: 'Portada del servidor',
		en: 'Guild banner',
		ja: 'サーバーバナー',
	},
	infoGuildIconAlt: {
		es: 'Ícono del servidor',
		en: 'Guild Icon',
		ja: 'サーバーアイコン',
	},
	infoGuildOwnerAvatarAlt: {
		es: 'Avatar del dueño del servidor',
		en: 'Guild Owner Avatar',
		ja: 'サーバー所有者のアバター',
	},
	infoTargetMemberAvatarAlt: {
		es: `Avatar de ${subl(0)}`,
		en: `${subl(0)}'s Avatar`,
		ja: `${subl(0)}さんのアバター`,
	},
	infoGuildEpigraph: {
		es: `-# Servidor ${subif(0, '=', true, 'público', 'privado')}`,
		en: `-# ${subif(0, '=', true, 'Public', 'Private')} Guild`,
		ja: `-# ${subif(0, '=', true, '公開', '非公開')}サーバー`,
	},
	infoGuildCreatedAt: {
		es: `🗓️ Creado el <t:${subl(0)}:f>`,
		en: `🗓️ Created on <t:${subl(0)}:f>`,
		ja: `🗓️ <t:${subl(0)}:f>作成`,
	},
	infoGuildOwnerEpigraph: {
		es: '-# Dueño del servidor',
		en: '-# Guild Owner',
		ja: '-# サーバー所有者',
	},
	infoGuildBasicInfoTitle: {
		es: '## Información básica',
		en: '## Basic Information',
		ja: '## 基本情報',
	},
	infoGuildMemberCount: {
		es: paragraph(
			'### Miembros',
			`🧑‍🦲 **${subl(0)}** humanos (aproximado)`,
			`🤖 **${subl(1)}** bots (aproximado)`,
			`👥 **${subl(2)}** miembros totales`,
		),
		en: paragraph(
			'### Members',
			`🧑‍🦲 **${subl(0)}** humans (approximate)`,
			`🤖 **${subl(1)}** bots (approximate)`,
			`👥 **${subl(2)}** total members`,
		),
		ja: paragraph(
			'### メンバー',
			`🧑‍🦲 **${subl(0)}人**の人間（近似）`,
			`🤖 **${subl(1)}体**のボット（近似）`,
			`👥 **${subl(2)}名**のメンバー総数`,
		),
	},
	infoGuildChannelCount: {
		es: paragraph(
			'### Canales',
			`#️⃣ **${subl(0)}** canales de texto`,
			`🔊 **${subl(1)}** canales de voz`,
			`📣 **${subl(2)}** canales de noticias`,
			`🏷️ **${subl(3)}** categorías`,
			`🧵 **${subl(4)}** hilos`,
		),
		en: paragraph(
			'### Channels',
			`#️⃣ **${subl(0)}** text channels`,
			`🔊 **${subl(1)}** voice channels`,
			`📣 **${subl(2)}** news channels`,
			`🏷️ **${subl(3)}** categories`,
			`🧵 **${subl(4)}** threads`,
		),
		ja: paragraph(
			'### チャネル',
			`#️⃣ **${subl(0)}個**のテキストチャンネル`,
			`🔊 **${subl(1)}個**のボイスチャンネル`,
			`📣 **${subl(2)}個**のニュースチャンネル`,
			`🏷️ **${subl(3)}個**のカテゴリー`,
			`🧵 **${subl(4)}個**のスレッド`,
		),
	},
	infoGuildSecurity: {
		es: paragraph(
			'### Seguridad',
			`Verificación Nivel **${subl(0)}**`,
			`MFA Nivel **${subl(1)}**`,
		),
		en: paragraph(
			'### Security',
			`Verification Level **${subl(0)}**`,
			`MFA Level **${subl(1)}**`,
		),
		ja: paragraph('### 安全', `検証レベル **${subl(0)}**`, `多要素認証レベル **${subl(1)}**`),
	},
	infoStatsMemberMessageCountItem: {
		es: `<@${subl(0)}>: **${subl(1)}** mensajes`,
		en: `<@${subl(0)}>: **${subl(1)}** messages`,
		ja: `<@${subl(0)}>さん：**${subl(1)}件**のメッセージ`,
	},
	infoStatsChannelMessageCountItem: {
		es: `<#${subl(0)}>: **${subl(1)}** mensajes`,
		en: `<#${subl(0)}>: **${subl(1)}** messages`,
		ja: `<#${subl(0)}>：**${subl(1)}件**のメッセージ`,
	},
	infoStatsChannelEmptyNotice: {
		es: '_Este canal no tiene mensajes_',
		en: '_This channel has no messages_',
		ja: '_このチャンネルにはメッセージがありません_',
	},
	infoStatsTitle: {
		es: '## Estadísticas de actividad',
		en: '## Activity Stats',
		ja: '## アクティビティ統計',
	},
	infoStatsTopMembersSubtitle: {
		es: `### Miembros más activos (canal: ${subl(0)})`,
		en: `### Most active members (channel: ${subl(0)})`,
		ja: `### 最もアクティブなメンバー（チャネル：${subl(0)}）`,
	},
	infoStatsTopChannelsSubtitle: {
		es: `### Canales más activos`,
		en: '### Most active channels',
		ja: '### 最もアクティブなチャネル',
	},
	infoStatsTargetMemberTotalMessageSum: {
		es: `${subl(0)} envió un total de **${subl(1)}** mensajes en *"${subl(2)}"*`,
		en: `${subl(0)} has sent a total of **${subl(1)}** messages on *"${subl(2)}"*`,
		ja: `${subl(0)}さんは*『${subl(2)}』*で合計**${subl(1)}件**のメッセージを送信しました。`,
	},
	infoStatsTargetMemberTitle: {
		es: `## Actividad de ${subl(0)}`,
		en: `## ${subl(0)}'s Activity`,
		ja: `## ${subl(0)}さんのアクティビティ`,
	},
	infoStatsTargetMemberTopChannelsSubtitle: {
		es: '### Su mayor participación',
		en: '### Most concurred channels',
		ja: '### 彼らのより大きな参加',
	},
	infoStatsTargetMemberNoDataNotice: {
		es: `_No hay datos de ${subl(0)} para mostrar._`,
		en: `_There is no data on ${subl(0)} to show._`,
		ja: `_${subl(0)}さんに関して表示できるデータはありません。_`,
	},
	infoStatsSinceFooter: {
		es: `-# Estas estadísticas toman información desde el <t:${subl(0)}:d>`,
		en: `-# These stats are being collected since <t:${subl(0)}:d>`,
		ja: `-# これらの統計は<t:${subl(0)}:d>から収集されています`,
	},
	infoTimeTitle: {
		es: '## Estadísticas de tiempo',
		en: '## Time Stats',
		ja: '## 時間統計',
	},
	infoTimeGuildCreatedAt: {
		es: `🗓️ El servidor se creó <t:${subl(0)}:R>`,
		en: `🗓️ The guild was created <t:${subl(0)}:R>`,
		ja: `🗓️ ギルドは<t:${subl(0)}:R>に作成されました`,
	},
	infoTimeBotLastResetAt: {
		es: `🕰️ Me reinicié por última vez <t:${subl(0)}:R>`,
		en: `🕰️ I was last reset <t:${subl(0)}:R>`,
		ja: `🕰️ 最後にリセットされたのは<t:${subl(0)}:R>です`,
	},

	inforolNoRoleProvided: {
		es: '❌ ¡Debes indicar al menos un rol!',
		en: '❌ You must indicate at least one role!',
		ja: '❌ 少なくとも 1つのロールを指定する必要があります',
	},
	inforolNoMembersFound: {
		es: '⚠️ No se encontró ningún miembro con los roles indicados...',
		en: "⚠️ Couldn't find any member with the provided roles...",
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

	estadoTitle: {
		es: `# Estado de ${subl(0)}`,
		en: `# ${subl(0)}'s Status`,
		ja: `# ${subl(0)}の状態`,
	},
	estadoVersion: {
		es: `-# Versión ${subl(0)}`,
		en: `-# Version ${subl(0)}`,
		ja: `-# Version ${subl(0)}`,
	},
	estadoAvatarAlt: {
		es: `Avatar de ${subl(0)}`,
		en: `${subl(0)}\`s avatar`,
		ja: `${subl(0)}のアバター`,
	},
	estadoCommandsAndServersCount: {
		es: `Ofreciendo un total de **${subl(0)}** comandos en **${subl(1)}** servidores`,
		en: `Offering **${subl(0)}** commands total on **${subl(1)}** guilds`,
		ja: `**${subl(1)}個**のサーバーで合計**${subl(0)}個**のコマンドを提供`,
	},
	presentarBotOwnerEpigrapgh: {
		es: '-# Creador',
		en: '-# Creator',
		ja: '-# クリエイター',
	},
	presentarArtistEpigrapgh: {
		es: '-# Artista',
		en: '-# Artist',
		ja: '-# アーティスト',
	},
	estadoDevelopmentTitle: {
		es: '## Desarrollo',
		en: '## Development',
		ja: '## 開発',
	},
	estadoDevelopmentChangesButton: {
		es: 'Notas de cambios',
		en: 'Changelog',
		ja: '変更履歴を表示',
	},
	estadoDevelopmentUpcomingButton: {
		es: 'Características planeadas',
		en: 'Planned features',
		ja: '計画されている機能',
	},
	estadoChangesTitle: {
		es: '## Notas de cambios',
		en: '## Changelog',
		ja: '## 変更履歴',
	},
	estadoUpcomingTitle: {
		es: '## Características planeadas',
		en: '## Planned features',
		ja: '## 計画されている機能',
	},
	estadoStatsTitle: {
		es: '## Estadísticas de uso',
		en: '## Usage Stats',
		ja: '## 使用状況統計',
	},
	estadoStatsRegisteredMessagesCount: {
		es: `🎦 **${subl(0)}** mensajes registrados`,
		en: `🎦 **${subl(0)}** messages recorded`,
		ja: `🎦 **${subl(0)}件**のメッセージが記録されました`,
	},
	estadoStatsProcessedCommandsCount: {
		es: `⚙️ **${subl(0)}** comandos procesados`,
		en: `⚙️ **${subl(0)}** commands processed`,
		ja: `⚙️ **${subl(0)}件**のコマンドが処理されました`,
	},
	estadoStatsSuccessfulCommandsCount: {
		es: `✅ **${subl(0)}** (${subl(1)}%) ejecuciones de comando exitosas`,
		en: `✅ **${subl(0)}** (${subl(1)}%) successful command executions`,
		ja: `✅ **${subl(0)}件**（${subl(1)}％）のコマンド実行が成功しました`,
	},
	estadoStatsFailedCommandsCount: {
		es: `⚠️️ **${subl(0)}** (${subl(1)}%) ejecuciones de comando fallidas`,
		en: `⚠️️ **${subl(0)}** (${subl(1)}%) failed command executions`,
		ja: `⚠️️ **${subl(0)}件**（${subl(1)}％）のコマンド実行が失敗しました`,
	},

	horaDateButNoTime: {
		es: '⚠️️ No puedes indicar una `--fecha` si no especificas una `<hora>`',
		en: "⚠️️ You can't provide a `--date` if you don't specify a `<time>`",
		ja: '⚠️️ `<time>`を指定しないと`--date`を指定することはできません',
	},
	horaAdaptedToYourTimezone: {
		es: 'Adaptado a tu huso horario',
		en: 'Adapted to your time zone',
		ja: 'あなたのタイムゾーンに合わせて',
	},

	recordarRemindersListTitle: {
		es: '## Recordatorios',
		en: '## Reminders',
		ja: '## リマインダー',
	},
	recordarRemindersListFooter: {
		es: `-# **${subl(0)}/${subl(1)}** recordatorios programados`,
		en: `-# **${subl(0)}/${subl(1)}** scheduled reminders`,
		ja: `-# **${subl(0)}/${subl(1)}件**の予定リマインダー`,
	},
	recordarDateOrTimeRequired: {
		es: '⚠️️ Debes indicar al menos una `--fecha` o una `--hora`',
		en: '⚠️️ You must specify at least a `--date` or an `--hour`',
		ja: '⚠️️ 少なくとも`--date`または`--time`を指定する必要があります',
	},
	recordarNoReminders: {
		es: '_No tienes ningún recordatorio pendiente_',
		en: "_You don't have any pending reminders_",
		ja: '_保留中のリマインダーはありません_',
	},
	recordarReminderContentTooLong: {
		es: `⚠️️ El recordatorio ingresado es demasiado largo. Acórtalo a ${subl(0)} caracteres o menos`,
		en: `⚠️️ The reminder you entered is too long. Shorten it to ${subl(0)} characters or less`,
		ja: `⚠️️ 入力したリマインダーが長すぎます。${subl(0)}文字以下に短縮してください`,
	},
	recordarTooManyReminders: {
		es: '⚠️️ Tienes demasiados recordatorios pendientes. Borra alguno para crear otro',
		en: '⚠️️ You have too many pending reminders. Delete some to create a new one',
		ja: '⚠️️ 保留中のリマインダーが多すぎます。1つ削除して新しいリマインダーを作成してください',
	},
	recordarReminderTooSoon: {
		es: `⚠️️ ¡La fecha del recordatorio (<t:${subl(0)}:F>) es muy pronto! Indica una fecha a más de 1 minuto a futuro`,
		en: `⚠️️ The reminder scheduled date (<t:${subl(0)}:F>) is too soon! Enter a date at least 1 minute in the future`,
		ja: `⚠️️ リマインダーの予定日（<t:${subl(0)}:F>）が早すぎます。1分以上先の日付を入力してください`,
	},
	recordarReminderCreateTitle: {
		es: '## Recordatorio establecido',
		en: '## Reminder set',
		ja: '## リマインダーを設定しました',
	},
	recordarReminderCreateDateDescription: {
		es: `Se programó un recordatorio para el <t:${subl(0)}:F> (<t:${subl(0)}:R>)`,
		en: `A reminder was scheduled for <t:${subl(0)}:F> (<t:${subl(0)}:R>)`,
		ja: `リマインダーは<t:${subl(0)}:F>（<t:${subl(0)}:R>）に予定されています`,
	},
	recordarReminderCreateContentSubtitle: {
		es: '### Contenido',
		en: '### Content',
		ja: '### コンテンツ',
	},
	recordarReminderNotFound: {
		es: '⚠️️ Este recordatorio ya expiró o fue eliminado manualmente',
		en: '⚠️️ This reminder has already expired or been manually deleted',
		ja: '⚠️️ このリマインダーは既に期限切れか手動で削除されました',
	},
	recordarReminderEditSuccessTitle: {
		es: '## Se editó el recordatorio',
		en: '## The reminder has been edited',
		ja: '## リマインダーが編集されました',
	},
	recordarReminderDeleteSuccess: {
		es: '✅ Se eliminó el recordatorio',
		en: '✅ The reminder has been deleted',
		ja: '✅ リマインダーは削除されました',
	},
	recordarCreateReminderModalTitle: {
		es: 'Crear recordatorio',
		en: 'Create Reminder',
		ja: 'リマインダーを作成',
	},
	recordarEditReminderModalTitle: {
		es: 'Editar recordatorio',
		en: 'Edit Reminder',
		ja: 'リマインダーを編集',
	},
	reminderEditReminderModalDateLabel: {
		es: 'Fecha',
		en: 'Date',
		ja: '日付',
	},
	reminderEditReminderModalDatePlaceholder: {
		es: 'dd/MM/AAAA',
		en: 'MM/dd/YYYY',
		ja: 'YYYY.MM.dd',
	},
	reminderEditReminderModalTimeLabel: {
		es: 'Hora',
		en: 'Time',
		ja: '時刻',
	},
	reminderEditReminderModalTimePlaceholder: {
		es: 'hh:mm:ss',
		en: 'HH:mm:ss AM/PM',
		ja: '◯時◯分◯秒',
	},
	reminderEditReminderModalChannelLabel: {
		es: 'Canal',
		en: 'Channel',
		ja: 'チャネル',
	},
	reminderEditReminderModalContentLabel: {
		es: 'Contenido',
		en: 'Content',
		ja: '内容',
	},
	reminderTriggerEpigraph: {
		es: `-# Recordatorio para ${subl(0)}`,
		en: `-# Reminder for ${subl(0)}`,
		ja: `-# ${subl(0)}さんへのリマインダー`,
	},

	serverDashboardServerEpigraph: {
		es: '-# Preferencias de servidor',
		en: '-# Server Preferences',
		ja: '-# サーバー設定',
	},
	serverDashboardLanguageName: {
		es: '### -# Idioma',
		en: '### -# Language',
		ja: '### -# 言語',
	},
	serverDashboardMenuConfig: {
		es: 'Sistemas de servidor',
		en: 'Server Systems',
		ja: 'サーバーシステム',
	},
	serverDashboardMenuConfigConfessionsLabel: {
		es: 'Confesiones',
		en: 'Confessions',
		ja: '告白',
	},

	voiceExpected: {
		es: '❌ Debes conectarte a un canal de voz primero',
		en: '❌ You need to connect to a voice channel first',
		ja: '❌ まず音声チャンネルに接続する必要があります',
	},
	voiceWizardAuthorName: {
		es: 'Asistente de Configuración de Sistema PuréVoice',
		en: 'PuréVoice System Configuration Wizard',
		ja: 'PuréVoice システム設定ウィザード',
	},
	voiceWizardWelcome: {
		es: 'Si es la primera vez que configuras un Sistema PuréVoice, ¡no te preocupes! Solo sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras',
		en: "If this is your first time setting up a PuréVoice System, don't worry! Just follow the Wizard's instructions and adapt your Feed to what you want",
		ja: '初めて PuréVoice システムをセットアップする場合でも、心配する必要はありません。ウィザードの指示に従って、必要に応じてフィードを調整するだけです',
	},
	voiceInstallationStartFieldName: {
		es: 'Inyección de Sistema PuréVoice',
		en: 'PuréVoice System Injection',
		ja: 'PuréVoice システム注入',
	},
	voiceInstallationStartFieldValue: {
		es: '¿Qué deseas hacer ahora mismo?',
		en: 'What do you want to do now?',
		ja: '今、何をしたいですか？',
	},
	voiceInstallationSelectFieldName: {
		es: 'Instalación',
		en: 'Installation',
		ja: 'インストール',
	},
	voiceInstallationSelectFieldValue: {
		es: 'Selecciona el tipo de instalación que deseas realizar',
		en: 'Select the installation type that best fits your needs',
		ja: 'ご自身のニーズに最も適したインストールタイプを選択してください',
	},
	voiceInstallationSelectButtonCreateNew: {
		es: 'Crear categoría con PuréVoice',
		en: 'Create a category for PuréVoice',
		ja: 'PuréVoice のカテゴリを作成する',
	},
	voiceInstallationSelectButtonInject: {
		es: 'Inyectar PuréVoice en categoría',
		en: 'Inject PuréVoice into category',
		ja: 'PuréVoice をカテゴリーに導入',
	},
	voiceInstallationModalDescription: {
		es: 'Menciona el nombre de la categoría a la cual inyectarle PuréVoice',
		en: 'Mention the name of the category you want to inject PuréVoice into',
		ja: 'PuréVoice を導入するカテゴリ名を指定してください',
	},
	voiceCategoryInstalledFieldName: {
		es: 'La categoría fue instalada',
		en: 'The category has been installed',
		ja: 'カテゴリがインストールされました',
	},
	voiceCategoryInstalledFieldValue: {
		es: paragraph(
			'Se ha preparado una categoría que escala de forma dinámica sus canales de voz.',
			`Puedes reubicar el Sistema PuréVoice creado en el futuro, solo usa \`${subl(0)} voz -a\` otra vez`,
		),
		en: paragraph(
			'A category that dynamically scales its voice channels has been prepared.',
			`You can relocate the created PuréVoice System in the future, just use \`${subl(0)} voice -w\` again`,
		),
		ja: paragraph(
			'動的に音声チャネルを拡張するカテゴリが用意されました。',
			`作成した PuréVoice システムは将来的に再配置できます。\`${subl(0)} voice -w\`を再度使用するだけです`,
		),
	},
	voiceCategoryInstallSuccess: {
		es: '✅ Instalación de Sistema PuréVoice finalizada',
		en: '✅ PuréVoice System installation finished',
		ja: '✅ PuréVoice システムのインストールが完了しました',
	},
	voiceCategoryInstallError: {
		es: paragraph(
			'⚠️ Ocurrió un error al inyectar PuréVoice en una categoría.',
			'Asegúrate de que tenga los permisos necesarios para realizar esta acción (administrar canales).',
			'También, verifica que el nombre ingresado no esté ya ocupado por alguna otra categoría o canal',
		),
		en: paragraph(
			'⚠️ An error occurred while injecting PuréVoice into a category.',
			'Make sure I have the necessary permissions to perform this action (manage channels).',
			'Also, verify that the name entered is not already occupied by some other category or channel',
		),
		ja: paragraph(
			'⚠️ PuréVoice をカテゴリに挿入中にエラーが発生しました。',
			'このアクション (チャネルの管理) を実行するために必要な権限があることを確認してください。',
			'また、入力した名前が他のカテゴリやチャンネルにすでに占有されていないことを確認してください',
		),
	},
	voiceUninstallFieldName: {
		es: 'Desinstalación del Sistema PuréVoice del servidor',
		en: 'Uninstalling the PuréVoice System from the server',
		ja: 'PuréVoice システムをサーバーからアンインストールする',
	},
	voiceUninstallFieldValue: {
		es: paragraph(
			'Esto borrará todas los canales creados por el Sistema. La categoría del Sistema y los canales creados manualmente se ignorarán.',
			'Confirma la desasociación del servidor con PuréVoice',
		),
		en: paragraph(
			'This will delete all channels created by the System. The System category and manually created channels will be ignored.',
			'Confirm the disassociation of this server with PuréVoice',
		),
		ja: paragraph(
			'これにより、システムによって作成されたすべてのチャンネルが削除されます。システム カテゴリと手動で作成したチャネルは無視されます。',
			'このサーバーと PuréVoice の関連付けが解除されていることを確認します',
		),
	},
	voiceRelocatedFieldName: {
		es: 'Sistema PuréVoice reubicado',
		en: 'PuréVoice System relocated',
		ja: 'PuréVoice システム移転',
	},
	voiceRelocatedFieldValue: {
		es: 'Se reubicó el Sistema PuréVoice asociado al servidor',
		en: "This server's PuréVoice System has been relocated",
		ja: 'サーバーに関連付けられている PuréVoice システムは移転されました',
	},
	voiceUninstalledFieldName: {
		es: 'Sistema PuréVoice eliminado',
		en: 'PuréVoice System removed',
		ja: 'PuréVoice システムが削除されました',
	},
	voiceUninstalledFieldValue: {
		es: 'Se eliminó el Sistema PuréVoice asociado al servidor',
		en: "This server's PuréVoice System has been removed",
		ja: 'サーバーに関連付けられた PuréVoice システムが削除されました',
	},
	voiceCancelledFieldValue: {
		es: 'Se canceló la configuración del Sistema PuréVoice',
		en: 'The PuréVoice System wizard has been cancelled',
		ja: 'PuréVoice システムウィザードはキャンセルされました',
	},
	voiceInstallationModalTitle: {
		es: `${subif(0, '=', true, 'Creación', 'Selección')} de categoría`,
		en: `Category ${subif(0, '=', true, 'Creation', 'Selection')}`,
		ja: `カテゴリの${subif(0, '=', true, '作成', '選択')}`,
	},
	voiceRelocateModalTitle: {
		es: 'Reubicar Sistema PuréVoice',
		en: 'Relocate PuréVoice System',
		ja: 'PuréVoice システムを移設する',
	},
	voiceModalCategoryLabel: {
		es: 'Categoría',
		en: 'Category',
		ja: 'カテゴリ',
	},
	voiceCreateCategoryModalCategoryNameLabel: {
		es: 'Nombre de la nueva categoría',
		en: 'Name of the new category',
		ja: '新しいカテゴリの名前',
	},
	voiceSameChannelExpected: {
		es: '❌ Ya estoy conectada a otro chat de voz. ¡Ven conmigo antes de hacer eso!',
		en: "❌ I'm already connected to another voice channel. Come here before doing that!",
		ja: '❌ すでに別の音声チャネルに接続しています。その前にここに来てください！',
	},
	voiceButtonRelocate: {
		es: 'Reubicar',
		en: 'Relocate',
		ja: '移転する',
	},
	voiceButtonInstall: {
		es: 'Instalar',
		en: 'Install',
		ja: 'インストール',
	},
	voiceButtonUninstall: {
		es: 'Desinstalar',
		en: 'Uninstall',
		ja: 'アンインストール',
	},
	voiceButtonUninstallConfirm: {
		es: 'DESINSTALAR',
		en: 'UNINSTALL',
		ja: '本当にアンインストール',
	},
	voiceSessionNameExpected: {
		es: paragraph(
			'⚠️ Debes ingresar un nombre de sesión para ejecutar este comando.',
			'Si estás buscando iniciar el Asistente de configuración, usa la bandera `--asistente` o `-a`.',
			`Usa \`${subl(0)}ayuda voz\` para más información`,
		),
		en: paragraph(
			'⚠️ You must enter a session name to execute this command.',
			"If you're trying to start the configuration Wizard, use the `--wizard` or `-w` flag.",
			`Use \`${subl(0)}help voice\` for more information`,
		),
		ja: paragraph(
			'⚠️ このコマンドを実行するにはセッション名を入力する必要があります。',
			'設定ウィザードを起動しようとしている場合は、`--wizard`または`-w`フラグを使用してください。',
			`詳細については、\`${subl(0)}help voice\`を使用してください`,
		),
	},
	voiceSessionNameTooLong: {
		es: '⚠️ Intenta acortar un poco el nombre. El límite para nombres de sesión es de 24(+3) caracteres',
		en: '⚠️ Try shortening the name a bit. The limit for session names is 24(+3) characters',
		ja: '⚠️ セッション名の長さを少し短くしてみてください。セッション名の制限は 24文字（+3文字）です。',
	},
	voiceSessionRenameTooSoon: {
		es: paragraph(
			`❌ Por cuestiones técnicas, solo puedes cambiar el nombre de la sesión una vez cada 20 minutos.`,
			`Inténtalo de nuevo <t:${subl(0)}:R> o conéctate a una nueva sesión`,
		),
		en: paragraph(
			`❌ For technical reasons, you can only change the session name once every 20 minutes.`,
			`Try again <t:${subl(0)}:R> or connect to a new session`,
		),
		ja: paragraph(
			`❌ 技術的な理由により、セッション名を変更できるのは 20分ごとに 1回のみです。`,
			`<t:${subl(0)}:R>にもう一度お試しいただくか、新しいセッションに接続してください`,
		),
	},
	voiceReasonCategoryCreate: {
		es: 'Preparar categoría recipiente de PuréVoice',
		en: 'Prepare PuréVoice container category',
		ja: 'PuréVoice コンテナカテゴリを準備する',
	},
	voiceReasonSystemRelocate: {
		es: `PuréVoice reubicado por ${subl(0)}`,
		en: `PuréVoice relocated by ${subl(0)}`,
		ja: `PuréVoice は${subl(0)}によって移転されました`,
	},
	voiceReasonSystemRemove: {
		es: `PuréVoice desinstalado por ${subl(0)}`,
		en: `PuréVoice uninstalled by ${subl(0)}`,
		ja: `PuréVoice が${subl(0)}さんによってアンインストールされました`,
	},
	voiceSessionReasonRename: {
		es: 'Renombrar sesión PuréVoice',
		en: 'PuréVoice session rename',
		ja: 'PuréVoice セッション名変更',
	},
	voiceSessionReasonFirstMemberAdd: {
		es: 'Inclusión de primer miembro en sesión PuréVoice',
		en: 'First member addition in PuréVoice session',
		ja: 'Purevoice セッションに最初のメンバーを含める',
	},
	voiceSessionReasonMemberAdd: {
		es: 'Inclusión de miembro en sesión PuréVoice',
		en: 'Member addition in PuréVoice session',
		ja: 'メンバーが PuréVoice セッションに参加しました',
	},
	voiceSessionReasonRoleCreate: {
		es: 'Inyectar Rol Efímero PuréVoice',
		en: 'Inject PuréVoice Ephemeral Rol',
		ja: 'PuréVoice 一時的なロールを注入する',
	},
	voiceSessionReasonRoleEdit: {
		es: 'Conceder envío de mensajes a rol de sesión PuréVoice',
		en: 'Grant permission to send messages for PuréVoice session role',
		ja: 'PuréVoice セッションロールのメッセージを送信する許可を付与します',
	},
	voiceSessionReasonChannelCreate: {
		es: 'Desplegar Canal Automutable PuréVoice',
		en: 'Deploy PuréVoice Automutable Channel',
		ja: 'PuréVoice 自動可変チャネルのデプロイ',
	},
	voiceSessionReasonChannelForceName: {
		es: 'Renombrar sesión PuréVoice (forzado automáticamente)',
		en: 'Rename PuréVoice session (automatically forced)',
		ja: 'PuréVoice セッションの名前を変更する (自動的に強制)',
	},
	voiceSessionReasonFreeze: {
		es: `Sesión congelada por ${subl(0)}`,
		en: `Session freezed by ${subl(0)}`,
		ja: `${subl(0)}さんによるセッションの軽やかさ`,
	},
	voiceSessionReasonUnfreeze: {
		es: `Sesión descongelada por ${subl(0)}`,
		en: `Session unfreezed by ${subl(0)}`,
		ja: `${subl(0)}さんによってセッションの凍結が解除されました`,
	},
	voiceSessionNewMemberName: {
		es: 'Nueva conexión',
		en: 'New connection',
		ja: '新しい接続',
	},
	voiceSessionNewMemberValueMemberIntegrated: {
		es: `El miembro **${subl(0)}** fue incorporado a la sesión`,
		en: `The member **${subl(0)}** was incorporated to the session`,
		ja: `メンバー**${subl(0)}**さんがセッションに接続されました`,
	},
	voiceSessionNewMemberValueBotAttached: {
		es: `El bot **${subl(0)}** fue anexado a la sesión`,
		en: `The bot **${subl(0)}** was attached to the session`,
		ja: `ボット**${subl(0)}**がセッションに接続されました`,
	},
	voiceSessionNewMemberContentHint: {
		es: `👋 ${subl(0)}, ¡puedes conversar por aquí!`,
		en: `👋 ${subl(0)}, you can chat over here!`,
		ja: `👋 ${subl(0)}さん、ここでチャットできますよ！`,
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
		en: `You can use \`${subl(0)}vc <Name>\` to rename the session`,
		ja: `\`${subl(0)}vc 「名前」\`を使用して名前を変更できます`,
	},
	voiceSessionNewSessionEmoteName: {
		es: '🐴 Emote',
		en: '🐴 Emote',
		ja: '🐴 エモート',
	},
	voiceSessionNewSessionEmoteValue: {
		es: 'Añade `--emote <Emote>` o `-e <Emote>` para cambiar el emote',
		en: 'Add `--emote <Emote>` or `-e <Emote>` to set the session emote',
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
		es: '⌛ Debes esperar 20 minutos entre cada renombrado de la sesión',
		en: '⌛ You must wait 20 minutes between each session renaming',
		ja: '⌛ 各セッションの名前変更の間には 20分待つ必要があります',
	},
	voiceSessionNewSessionAutonameName: {
		es: '⏱️ Nombre automático',
		en: '⏱️ Auto-naming',
		ja: '⏱️ 自動命名',
	},
	voiceSessionNewSessionAutonameValue: {
		es: 'Si no escribes un nombre de sesión en 3 minutos, se nombrará automáticamente',
		en: "If you don't enter a session name within 3 minutes, it'll be automatically renamed",
		ja: '3分以内にセッション名を入力しないと、自動的に名前が変更されます',
	},
	voiceSessionRenameInvalidEmoji: {
		es: paragraph(
			'⚠️️ El emoji indicado no es un emoji Unicode admitido',
			'Recuerda que no se pueden usar emotes personalizados para nombres de canales',
			'También, ten en cuenta que algunos emotes estándar de Discord no son *tan estándar* y __no se espera__ que se detecten/funcionen correctamente',
		),
		en: paragraph(
			"⚠️️ The supplied emoji isn't a valid Unicode emoji",
			'Remember that you cannot use custom emotes for channel names.',
			"Also, keep in mind that some standard Discord emotes aren't *so standard* and are __not expected__ to be detected/function correctly",
		),
		ja: paragraph(
			'⚠️️ 示された絵文字は、サポートされている Unicode 絵文字ではありません。',
			'チャンネル名にはカスタムエモートを使用できないことにご注意ください。',
			'また、一部の標準 Discord 絵文字は*それほど標準的ではない*ため、正しく検出・機能することが__期待されていません__。',
		),
	},
	voiceSessionRenameSuccess: {
		es: '✅ Nombre aplicado',
		en: '✅ Name applied',
		ja: '✅ 名前が申請されました',
	},
	voiceSessionFreezeSuccess: {
		es: `❄️ La sesión "${subl(0)}" fue **${subif(1, '=', true, 'congelada', 'descongelada')}**`,
		en: `❄️ Session "${subl(0)}" was **${subif(1, '=', true, 'freezed', 'unfreezed')}**`,
		ja: `❄️ セッション「${subl(0)}」が**${subif(1, '=', true, '凍結', '凍結解除')}**されました`,
	},
	voiceSessionRenameError: {
		es: '⚠️ Ocurrió un error al aplicar el nombre de sesión',
		en: '⚠️ An error occurred while applying the session name',
		ja: '⚠️ セッション名前の適用中にエラーが発生しました',
	},
	voiceSessionJoinExpected: {
		es: '❌ Debes entrar a una sesión PuréVoice para realizar esta acción',
		en: '❌ You must join a PuréVoice session to do this',
		ja: '❌ この操作を実行するには、PuréVoice セッションにログインする必要があります',
	},
	voiceSessionMemberExpected: {
		es: '❌ Debes formar parte de la sesión para hacer esto',
		en: '❌ You must be a part of the session to do this',
		ja: '❌ これを行うにはセッションに参加する必要があります',
	},
	voiceSessionAdminOrModExpected: {
		es: '❌ Debes ser administrador o moderador de la sesión para hacer esto',
		en: '❌ You must be the administrator or a moderator of the session to do this',
		ja: '❌ これを行うには、セッションの管理者またはモデレータである必要があります',
	},
	voiceSessionModExpected: {
		es: '❌ Debes ser moderador de la sesión para hacer esto',
		en: '❌ You must be a moderator of the session to do this',
		ja: '❌ これを行うにはセッションモデレータである必要があります',
	},
	voiceSessionAdminExpected: {
		es: '❌ Debes ser administrador de la sesión para hacer esto',
		en: '❌ You must be the session administrator to do this',
		ja: '❌ これを行うにはセッション管理者である必要があります',
	},
	voiceCommandRenameMemberExpected: {
		es: `⚠️ Debes entrar a una sesión PuréVoice para ejecutar este comando de esta forma.\nUsa \`${subl(0)}ayuda voz\` para más información`,
		en: `⚠️ You must join a PuréVoice session to use this command this way.\nUse \`${subl(0)}help voice\` for more information`,
		ja: `⚠️ これを行うにはセッションに参加する必要があります。\n 詳細については、\`${subl(0)}help voice\`を使用してください`,
	},

	yoCancelledStep: {
		es: 'Se canceló la configuración de Preferencias de usuario',
		en: 'The User Preferences configuration was cancelled',
		ja: 'ユーザー設定の構成がキャンセルされました',
	},
	yoFinishedStep: {
		es: 'Se cerró el Asistente de preferencias de usuario.',
		en: 'The User Preferences Wizard has been closed.',
		ja: 'ユーザー設定ウィザードが閉じました。',
	},
	yoDashboardEpigraph: {
		es: '-# Preferencias de usuario',
		en: '-# User Preferences',
		ja: '-# ユーザー設定',
	},
	yoDashboardLanguageName: {
		es: '### -# Idioma',
		en: '### -# Language',
		ja: '### -# 言語',
	},
	yoDashboardTimezoneName: {
		es: '### -# Huso Horario',
		en: '### -# Time Zone',
		ja: '### -# 時間帯',
	},
	yoDashboardNoTZ: {
		es: '<:clock:1357498813144760603> _Sin huso horario_',
		en: '<:clock:1357498813144760603> _No time zone_',
		ja: '<:clock:1357498813144760603> _時間帯なし_',
	},
	yoDashboardPRC: {
		es: `<:prc:1097208828946301123> ${subl(0)} créditos`,
		en: `<:prc:1097208828946301123> ${subl(0)} credits`,
		ja: `<:prc:1097208828946301123> ${subl(0)}クレジット`,
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
		es: 'Edita tus tags seguidas en Feeds de imágenes',
		en: 'Manage your followed tags in Imageboard Feeds',
		ja: 'フォローしている画像掲示板フィードタグを管理する',
	},
	yoDashboardMenuConfigVoiceDesc: {
		es: 'Configura tus preferencias de sesiones de VC',
		en: 'Configure your voice chat session preferences',
		ja: 'ボイスチャットセッションの個人設定を構成する',
	},
	yoDashboardMenuConfigPixixDesc: {
		es: 'Corrige enlaces de pixiv que envíes',
		en: 'Fixes pixiv embeds automatically',
		ja: 'pixiv の埋め込みを自動的に修正します',
	},
	yoDashboardMenuConfigTwitterDesc: {
		es: 'Corrige enlaces de Twitter/X que envíes',
		en: 'Fixes Twitter/X embeds automatically',
		ja: 'Twitter/X の埋め込みを自動的に修正します',
	},
	yoDashboardTimezone: {
		es: 'Huso Horario...',
		en: 'Time Zone...',
		ja: '時間帯…',
	},
	yoTimezoneModalTitle: {
		es: 'Establecer Huso Horario',
		en: 'Set Time Zone',
		ja: '時間帯を設定',
	},
	yoTimezoneModalTutorial: {
		es: paragraph(
			'Se aceptan:',
			'* identificadores de zona horaria según el listado de la *Internet Assigned Numbers Authority*.',
			'* desplazamientos horarios relativos a UTC (en horas y minutos).',
			'* Algunas abreviaturas comunes de zona horaria son reconocidas y convertidas a zonas horarias *IANA*, pero no todas.',
			'',
			'Si ingresas un identificador *IANA*, tu huso horario se ajustará **automáticamente** a los __horarios de verano__.',
			'',
			'-# Puedes consultar [este listado](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) para indicar la zona horaria mejor adecuada a donde vives (columna "TZ Identifier"), o utilizar [esta página](https://myutcoffset.com) para conocer tu desplazamiento horario.',
		),
		en: paragraph(
			'Accepted values:',
			'* time zone identifiers from the *Internet Assigned Numbers Authority* list.',
			'* UTC-relative time offsets (in hours and minutes).',
			'* some common time zone abbreviations are recognized and converted to *IANA* time zones, but not all.',
			'',
			'If you enter an *IANA* identifier, your time zone will **automatically** adjust for __daylight saving time__.',
			'',
			'-# You can check [this list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) to find the time zone that best matches where you live (the "TZ Identifier" column), or use [this page](https://myutcoffset.com) to find your UTC offset.',
		),
		ja: paragraph(
			'以下の形式が利用できます:',
			'* *Internet Assigned Numbers Authority* によって定義されたタイムゾーン識別子。',
			'* UTC に対する時差（時間および分）。',
			'* 一部の一般的なタイムゾーンの略称は *IANA* タイムゾーンに変換されますが、すべてが対応しているわけではありません。',
			'',
			'*IANA* 識別子を入力した場合、__夏時間__は**自動的に**適用されます。',
			'',
			'-# [こちらの一覧](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List)（「TZ Identifier」列）から、お住まいの地域に最も近いタイムゾーンを確認するか、[こちらのページ](https://myutcoffset.com)で UTC との時差を確認できます。',
		),
	},
	yoTimezoneModalTimezoneLabel: {
		es: 'Huso horario',
		en: 'Time zone',
		ja: '時間帯',
	},
	yoTimezoneModalTimezonePlaceholder: {
		es: 'America/Buenos_Aires, UTC+3, JST, -3, GMT+5, UTC-4, etc.',
		en: 'America/New_York, UTC+3, JST, -3, GMT+5, UTC-4, etc.',
		ja: 'Asia/Tokyo, UTC+3、JST、-3、GMT+5、UTC-4など',
	},
	yoTimezoneInvalidTimezone: {
		es: '⚠️ El huso horario especificado tiene un formato inválido',
		en: '⚠️ The specified timezone has an invalid format',
		ja: '⚠️ 指定されたタイムゾーンは無効な形式です',
	},
	yoFeedEmptyError: {
		es: paragraph(
			'¡No tienes ninguna suscripción a Feeds de imágenes!',
			'Puedes comenzar a seguir tags en cualquier canal con un Sistema Boorutato instalado',
		),
		en: paragraph(
			"You're not subscribed to any image Feeds!",
			'You can start following tags in any channel that has a Boorutato system installed',
		),
		ja: paragraph(
			'画像掲示板のフィードを購読していません！',
			'Boorutato システムがインストールされているチャンネルであれば、タグのフォローを開始できます',
		),
	},
	yoVoiceTitle: {
		es: '## <:purevoice:1460145551847723132> Preferencias de PuréVoice',
		en: '## <:purevoice:1460145551847723132> PuréVoice preferences',
		ja: '## <:purevoice:1460145551847723132> PuréVoice の個人設定',
	},
	yoVoiceDescription: {
		es: '-# Configura tus preferencias de PuréVoice',
		en: '-# Configure your PuréVoice preferences',
		ja: '-# PuréVoice の個人設定を構成する',
	},
	yoVoicePingName: {
		es: '### -# Menciones',
		en: '### -# Pings',
		ja: '### -# メンション',
	},
	yoVoiceAutonameName: {
		es: '### -# Nombre automático',
		en: '### -# Autoname',
		ja: '### -# 自動名',
	},
	yoVoiceKillDelayName: {
		es: '### -# Retardo de muerte',
		en: '### -# Kill delay',
		ja: '### -# キル遅延',
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
		ja: 'Unicode 絵文字。(例: 🍑)',
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
		ja: 'たとえば、4m 45s。0＝無効。最大 10m。',
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
		en: "You'll be pinged when creating or joining a session",
		ja: 'セッションを作成または参加するときにメンションされます',
	},
	yoVoiceMenuPingOnCreateLabel: {
		es: 'Al crear',
		en: 'On creation',
		ja: '作成について',
	},
	yoVoiceMenuPingOnCreateDesc: {
		es: 'Solo serás mencionado al crear una nueva sesión',
		en: "You'll only be pinged when creating a new session",
		ja: '新しいセッションを作成するときにのみメンションされます',
	},
	yoVoiceMenuPingNeverDesc: {
		es: 'No serás mencionado al crear o unirte a una sesión',
		en: "You won't be pinged when creating or joining a session",
		ja: 'セッションの作成時またはセッションへの参加時にメンションされることはありません',
	},
	yoConversionServiceName: {
		es: '### -# Servicio',
		en: '### -# Service',
		ja: '### -# サービス',
	},
	yoConversionServiceMenuService: {
		es: 'Elige un servicio...',
		en: 'Choose a service...',
		ja: 'サービスを選択する…',
	},
	yoConversionServiceMenuServiceNoneLabel: {
		es: 'Ninguno',
		en: 'None',
		ja: 'なし',
	},
	yoConversionServiceSuccess: {
		es: '✅ Servicio de conversión actualizado',
		en: '✅ Converter service updated',
		ja: '✅ コンバーターサービスが更新されました',
	},
	yoPixivStep: {
		es: 'Conversor de enlaces de pixiv',
		en: 'pixiv links converter',
		ja: 'pixiv リンクコンバーター',
	},
	yoPixivTitle: {
		es: '## <:pixivfullcolor:1460135891841585385> Preferencias de PuréPix',
		en: '## <:pixivfullcolor:1460135891841585385> PuréPix preferences',
		ja: '## <:pixivfullcolor:1460135891841585385> PuréPix の個人設定',
	},
	yoPixivDesc: {
		es: '-# Configura la conversión de enlaces de pixiv.',
		en: '-# Configure the conversion of pixiv links.',
		ja: '-# pixiv リンクの変換サービスを設定する。',
	},
	yoPixivMenuServicePhixivDesc: {
		es: 'Opción recomendada.',
		en: 'Recommended solution.',
		ja: '推奨される解決策。',
	},
	yoPixivMenuServiceWebhookLabel: {
		es: 'Webhook de Agente Puré.',
		en: 'Puré Agent Webhook.',
		ja: 'エージェント Puréウェブフック。',
	},
	yoPixivMenuServiceWebhookDesc: {
		es: 'Alternativa estéticamente agradable, pero menos compatible.',
		en: 'Aesthetically pleasing alternative, but less compatible.',
		ja: '見た目も美しい代替品だが、互換性は低い。',
	},
	yoPixivMenuServiceNoneDesc: {
		es: 'No convertir enlaces de pixiv automáticamente.',
		en: 'Do not convert pixiv links automatically.',
		ja: 'pixiv リンクを自動的に変換しない。',
	},
	yoTwitterStep: {
		es: 'Conversor de enlaces de Twitter/X',
		en: 'Twitter/X link converter',
		ja: 'Twitter/X リンクコンバーター',
	},
	yoTwitterTitle: {
		es: '## <:twitterfullcolor:1460135894404305019> Preferencias de Puréet',
		en: '## <:twitterfullcolor:1460135894404305019> Puréet preferences',
		ja: '## <:twitterfullcolor:1460135894404305019> Puréet の個人設定',
	},
	yoTwitterDesc: {
		es: '-# Configura la conversión de enlaces de Twitter/X.',
		en: '-# Configure the conversion of Twitter/X links.',
		ja: '-# Twitter/X リンクの変換サービスを設定する。',
	},
	yoTwitterMenuServiceVxDesc: {
		es: 'Opción recomendada.',
		en: 'Recommended solution.',
		ja: '推奨される解決策。',
	},
	yoTwitterMenuServiceFxDesc: {
		es: 'Buena alternativa, pero menos segura y privada.',
		en: 'Good alternative, but less safe and private.',
		ja: '良い代替手段だが、安全性とプライバシーは劣る。',
	},
	yoTwitterMenuServiceNoneDesc: {
		es: 'No convertir enlaces de Twitter/X automáticamente.',
		en: 'Do not convert Twitter/X links automatically.',
		ja: 'Twitter/X リンクを自動的に変換しない。',
	},
	yoSelectTagsChannelTitle: {
		es: 'Selecciona uno de tus Feeds seguidos.',
		en: 'Select one of the Feeds you follow.',
		ja: 'フォローしているフィードのいずれかを選択して。',
	},
	yoTagsName: {
		es: 'Tags Seguidas',
		en: 'Followed Tags',
		ja: 'フォロー中のタグ',
	},
	yoTagsValueDefault: {
		es: '<Todavía no sigues ninguna tag>',
		en: "<You aren't following any tag yet>",
		ja: '【まだタグをフォローしていません】',
	},
} as const;

export type LocaleIds = keyof typeof localesObject;

/**@type {Map<ConditionString, (a: String, b: String) => Boolean>}*/
const conditionFns: Map<ConditionString, (a: string, b: string) => boolean> = new Map();
conditionFns
	.set('=', (a, b) => a === b)
	.set('!=', (a, b) => a !== b)
	.set('<', (a, b) => a < b)
	.set('>', (a, b) => a > b)
	.set('<=', (a, b) => a <= b)
	.set('>=', (a, b) => a >= b);

const reverseDateMappers: Record<
	LocaleKey,
	(a?: number, b?: number, c?: number) => { day?: number; month?: number; year?: number }
> = {
	en: (a, b, c) => ({ day: b, month: a, year: c }),
	es: (a, b, c) => ({ day: a, month: b, year: c }),
	ja: (a, b, c) => ({ day: c, month: b, year: a }),
};

/**Clase de traducción de contenidos.*/
export class Translator {
	#locale: LocaleKey;

	/**@param locale lenguaje al que traduce esta instancia*/
	constructor(locale: LocaleKey) {
		if (!locale) throw ReferenceError('Un Translator requiere un lenguaje para operar');
		this.#locale = locale;
	}

	/**
	 * @description Muestra un texto localizado según la configuración del usuario.
	 * @param id id de texto a mostrar en forma localizada
	 * @param values variables a insertar en el texto seleccionado como reemplazos de campos designados
	 */
	getText(id: LocaleIds, ...values: unknown[]) {
		return Translator.getText(id, this.#locale, ...values);
	}

	/**@description Determina si el traductor es del lenguaje ingresado.*/
	is(locale: LocaleKey) {
		return this.#locale === locale;
	}

	/**@description El lenguaje del traductor.*/
	get locale() {
		return this.#locale;
	}

	/**@description Devuelve la siguiente clave del lenguaje del traductor actual.*/
	get next(): LocaleKey {
		if (this.is('en')) return 'es';
		if (this.is('es')) return 'ja';
		return 'en';
	}

	/**@description Devuelve el traductor del siguiente lenguaje al actual.*/
	get nextTranslator(): Translator {
		return new Translator(this.next);
	}

	/**@description Instancia un {@link Translator} en base al idioma del usuario indicado*/
	static async from(user: UserCacheResolvable) {
		const userCache = await fetchUserCache(user);
		return new Translator(userCache?.language ?? defaultLocale);
	}

	/**
	 * @description Muestra un texto localizado según la configuración del usuario
	 * @param id id de texto a mostrar en forma localizada
	 * @param locale lenguaje al cual localizar el texto
	 * @param values variables a insertar en el texto seleccionado como reemplazos de campos designados
	 */
	static getText(id: LocaleIds, locale: LocaleKey, ...values: unknown[]) {
		const localeSet = localesObject[id];
		if (!localeSet)
			throw ReferenceError(
				`Se esperaba una id de texto localizado válido. Se recibió: ${id}`,
			);
		const translationTemplate = localeSet[locale];
		if (translationTemplate == null)
			throw RangeError(
				`Se esperaba una clave de localización válida. Se recibió: ${id} :: ${locale}`,
			);

		//Ejemplo: 1{...}<?{'por defecto'}
		const subLocaleRegex =
			/(\d+){\.\.\.}(?:<!{((?:[!=<>]{1,2}):[^|]+)\|'((?:(?!'}).)*)'})?(?:<\?{'((?:(?!'}).)*)'})?/g;
		const translation = translationTemplate.replace(
			subLocaleRegex,
			(_match, i: string, condition: string, whenTrue: string, defaultValue: string) => {
				const value = values[+i];

				if (condition != null) {
					const leftValue = typeof value === 'boolean' ? `__${value}__` : `${value}`;
					const [operator, rightValue] = condition.split(':') as [
						ConditionString,
						string,
					];

					if (!conditionFns.has(operator)) throw 'Operador inválido';

					const conditionFn = conditionFns.get(operator);
					return conditionFn?.(leftValue, rightValue) ? whenTrue : (defaultValue ?? '');
				}

				if (value != null) return `${value}`;

				if (defaultValue != null) return defaultValue;

				throw ReferenceError(
					`Se esperaba un valor de reemplazo en índice [${i}] para texto localizado ${id} :: ${locale}`,
				);
			},
		);

		return translation;
	}

	/**
	 * @description Mapea los componentes ingresados a día, mes y año teniendo en cuenta el orden en el que se especifican en la traducción indicada
	 * @param locale id de idioma de origen de la fecha
	 * @param component1 primer componente de fecha, en orden traducido
	 * @param component2 segundo componente de fecha, en orden traducido
	 * @param component3 tercer componente de fecha, en orden traducido
	 */
	static mapReverseDateUTCComponents(
		locale: LocaleKey,
		component1?: number,
		component2?: number,
		component3?: number,
	) {
		const { day, month, year } = reverseDateMappers[locale](component1, component2, component3);
		const tzNow = new Date(Date.now());
		const utcNow = new Date(
			Date.UTC(
				tzNow.getUTCFullYear(),
				tzNow.getUTCMonth(),
				tzNow.getUTCDate(),
				tzNow.getUTCHours(),
				tzNow.getUTCMinutes(),
				tzNow.getUTCSeconds(),
				tzNow.getUTCMilliseconds(),
			),
		);

		return {
			day: day ?? utcNow.getUTCDate(),
			month: month ?? utcNow.getUTCMonth() + 1,
			year: year ?? utcNow.getUTCFullYear(),
		};
	}

	/**
	 * @description Mapea los componentes ingresados a día, mes y año teniendo en cuenta el orden en el que se especifican en la traducción indicada
	 * @param id id de traducción
	 * @param component1 primer componente de fecha, en orden traducido
	 * @param component2 segundo componente de fecha, en orden traducido
	 * @param component3 tercer componente de fecha, en orden traducido
	 */
	static reverseSearchUTCDate(
		id: LocaleKey,
		component1?: number,
		component2?: number,
		component3?: number,
	) {
		const { day, month, year } = Translator.mapReverseDateUTCComponents(
			id,
			component1,
			component2,
			component3,
		);
		return new Date(year, month, day, 0, 0, 0, 0);
	}

	/**
	 * @description Muestra un texto localizado según la configuración del usuario
	 * @param id id de traducción
	 */
	static getTranslation(id: LocaleIds): Translation {
		const localeSet = localesObject[id];
		if (!localeSet)
			throw ReferenceError(`Se esperaba una id de traducción válida. Se recibió: ${id}`);
		return localeSet;
	}
}
