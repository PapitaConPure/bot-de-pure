const globalConfigs = require('../../data/config.json');
const { MessageFlags, ContainerBuilder } = require('discord.js');
const Reminder = require('../../models/reminders');
const Logger = require('../../utils/logs');
const { Translator } = require('../../i18n');
const { decompressId } = require('../../func');
const Int32 = require('mongoose-int32');

const { debug, info, error } = Logger('DEBUG', 'Reminders');

/**@type {import('discord.js').Client}*/
let schedulerClient = null;
/**@type {Map<string, NodeJS.Timeout>}*/
const scheduledIds = new Map();

/**
 * Programa el recordatorio indicado a ejecutarse en el tiempo que trae especificado
 * @param {import('../../models/reminders').ReminderDocument} reminder El recordatorio a programar
 */
async function scheduleReminder(reminder) {
	if(!reminder)
		throw new TypeError(`Expected a ReminderDocument. Got: ${reminder == null ? reminder : typeof reminder}`);

	const debugId = decompressId(reminder._id);

	debug(`Cleaning up duplicate reminders of #${debugId}`);
	clearScheduledReminder(reminder._id);
	
	debug(`Attempting to schedule reminder #${debugId}`);

	const ms = timeUntil(reminder.date);
	debug(`Reminder #${debugId} time to trigger: ${ms / 1000} seconds (${ms}ms)`);

	if(ms < 1) {
		triggerReminder(reminder);
		info('A reminder was about to be scheduled, but it\'s already expired so it was triggered immediately instead.');
		return;
	}

	if(ms > Int32.INT32_MAX) {
		const newTimeout = setTimeout(scheduleReminder, Int32.INT32_MAX, reminder);
		scheduledIds.set(reminder._id, newTimeout);
		info(`Reminder #${debugId} would take longer to trigger than what's representable by int32, so it will be stalled for the maximum int32 duration`);
		return;
	}

	const newTimeout = setTimeout(triggerReminder, ms, reminder);
	scheduledIds.set(reminder._id, newTimeout);

	info(`Scheduled reminder #${debugId}`);
}

/**
 * Dispara todos los recordatorios pendientes que ya estén expirados y programa aquellos que no lo estén
 * @throws {RemindersSchedulerError}
 */
async function processReminders() {
	try {
		debug('Attempting to process all registered reminders');
		const dueReminders = await Reminder.find();
		const reminders = await Promise.allSettled(dueReminders.map(reminder => scheduleReminder(reminder)));
		const failedSchedules = reminders.filter(trigger => trigger.status === 'rejected');
		if(failedSchedules.length)
			throw new RemindersSchedulerError(`Couldn't process every reminder.\nReceived the following reasons:\n${failedSchedules.map(t => t.reason).join('\n')}`);
	} catch(err) {
		const message = 'Failed to process all reminders.';
		error(err, message);
		throw new RemindersSchedulerError(message);
	}
}

/**
 * Dispara el recordatorio indicado inmediatamente
 * @param {import('../../models/reminders').ReminderDocument} reminder El recordatorio a disparar
 */
async function triggerReminder(reminder) {
	if(!reminder)
		throw new TypeError(`Expected a ReminderDocument. Got: ${reminder == null ? reminder : typeof reminder}`);

	debug(`Attempting to trigger reminder #${reminder._id}.`);
	
	const channelId = decompressId(reminder.channelId);
	const userId = decompressId(reminder.userId);
	
	debug(`Fetching the specified channel for reminder #${reminder._id}.`);
	const channel = schedulerClient.channels.cache.get(channelId)
	?? await schedulerClient.channels.fetch(channelId);
	
	debug(`Fetching the specified user for reminder #${reminder._id}.`);
	const user = schedulerClient.users.cache.get(userId)
		?? await schedulerClient.users.fetch(userId);

	try {
		if(channel.isSendable() && channel.isTextBased() && !channel.isDMBased()) {
			await sendReminder(channel, user, reminder.content);
			debug(`Reminder message for ${user.username} has been sent to ${channelId}.`);
		}

		await Reminder.findByIdAndDelete(reminder._id);

		info(`The reminder #${reminder._id} for ${user.username} has been triggered, sent to ${channelId}, and deleted appropiately.`);
	} catch(err) {
		error(err);
		throw new RemindersSchedulerError('Couldn\'t trigger a reminder.');
	}
}

/**
 * Envía el contenido de recordatorio indicado en el canal de Discord especificado, mencionando al miembro suministrado
 * @param {import('discord.js').GuildTextBasedChannel} channel El canal destino del envío
 * @param {import('discord.js').User} user El usuario a mencionar con el recordatorio
 * @param {string} reminderContent El contenido del recordatorio
 */
async function sendReminder(channel, user, reminderContent) {
	debug('Attempting to send a reminder message.');

	const translator = await Translator.from(user.id);

	const container = new ContainerBuilder()
		.setAccentColor(globalConfigs.tenshiColor)
		.addTextDisplayComponents(
			textDisplay => textDisplay.setContent(translator.getText('reminderTriggerEpigraph', user)),
			textDisplay => textDisplay.setContent(reminderContent),
		);

	return channel.send({
		flags: MessageFlags.IsComponentsV2,
		components: [container],
	});
}

/**
 * Limpia cualquier posible timeout previamente asociado a la ID de recordatorio especificada
 * @param {string} reminderId
 */
function clearScheduledReminder(reminderId) {
	const samePreviousReminder = scheduledIds.get(reminderId);

	if(samePreviousReminder) {
		debug(`Scheduled reminder #${reminderId} has been cleared.`);
		clearTimeout(samePreviousReminder);
	}

	return samePreviousReminder;
}

/**
 * * Si el resultado es positivo, devuelve cuántos milisegundos faltan para alcanzar la fecha indicada
 * * Si el resultado es negativo, devuelve hace cuántos milisegundos ocurrió la fecha indicada
 * * Si el resultado es 0, la fecha indicada es ahora mismo
 * @param {Date} date
 */
function timeUntil(date) {
	const now = Date.now();
	const then = +date;
	return then - now;
}

/**
 * Inicializa el programador de recordatorios con el cliente indicado
 * @param {import('discord.js').Client} client 
 */
function initRemindersScheduler(client) {
	if(!client)
		throw new TypeError(`Expected a Discord client. Got: ${client == null ? client : typeof client}`);
	
	debug('Attempting to initialize the scheduler.');
	schedulerClient = client;
}

/**@class Representa un error en relación al programador de recordatorios*/
class RemindersSchedulerError extends Error {
	/**@param {string} [message]*/
	constructor(message = undefined) {
		super(message);
		this.name = 'RemindersSchedulerError';
	}
}

module.exports = {
	initRemindersScheduler,
	scheduleReminder,
	triggerReminder,
	processReminders,
};
