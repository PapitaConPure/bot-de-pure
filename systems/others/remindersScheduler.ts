import { MessageFlags, ContainerBuilder, Client, GuildTextBasedChannel, User } from 'discord.js';
import Reminder, { ReminderDocument } from '../../models/reminders';
import Logger from '../../utils/logs';
import { decompressId } from '../../func';
import { tenshiColor } from '../../data/globalProps';
import { Translator } from '../../i18n';
import Int32 from 'mongoose-int32';

const { debug, info, error } = Logger('WARN', 'Reminders');

let schedulerClient: Client = null;
const scheduledIds = new Map<string, NodeJS.Timeout>();

/**
 * @description Programa el recordatorio indicado a ejecutarse en el tiempo que trae especificado.
 * @param reminder El recordatorio a programar.
 */
export async function scheduleReminder(reminder: ReminderDocument) {
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
		info(`Reminder #${debugId} would take longer to trigger than what's representable by int32, so it will be stalled for the maximum int32 duration and checked again`);
		return;
	}

	const newTimeout = setTimeout(triggerReminder, ms, reminder);
	scheduledIds.set(reminder._id, newTimeout);

	info(`Scheduled reminder #${debugId}`);
}

/**
 * @description Dispara todos los recordatorios pendientes que ya estén expirados y programa aquellos que no lo estén.
 * @throws {RemindersSchedulerError}
 */
export async function processReminders() {
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
 * @description Dispara el recordatorio indicado inmediatamente.
 * @param reminder El recordatorio a disparar.
 */
async function triggerReminder(reminder: ReminderDocument) {
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
 * Envía el contenido de recordatorio indicado en el canal de Discord especificado, mencionando al miembro suministrado.
 * @param channel El canal destino del envío.
 * @param user El usuario a mencionar con el recordatorio.
 * @param reminderContent El contenido del recordatorio.
 */
async function sendReminder(channel: GuildTextBasedChannel, user: User, reminderContent: string) {
	debug('Attempting to send a reminder message.');

	const translator = await Translator.from(user.id);

	const container = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents(
			textDisplay => textDisplay.setContent(translator.getText('reminderTriggerEpigraph', user)),
			textDisplay => textDisplay.setContent(reminderContent),
		);

	return channel.send({
		flags: MessageFlags.IsComponentsV2,
		components: [container],
	});
}

/**@description Limpia cualquier posible timeout previamente asociado a la ID del recordatorio especificado.*/
export function clearScheduledReminder(reminder: ReminderDocument): NodeJS.Timeout;
/**@description Limpia cualquier posible timeout previamente asociado a la ID de recordatorio especificada.*/
export function clearScheduledReminder(reminderId: string): NodeJS.Timeout;
export function clearScheduledReminder(reminder: ReminderDocument | string): NodeJS.Timeout {
	const id: string = typeof reminder === 'string' ? reminder : reminder.id;

	const samePreviousReminderTimeout = scheduledIds.get(id);
	if(samePreviousReminderTimeout) {
		debug(`Scheduled reminder #${id} has been cleared.`);
		clearTimeout(samePreviousReminderTimeout);
	}

	return samePreviousReminderTimeout;
}

/**
 * @description
 * * Si el resultado es positivo, devuelve cuántos milisegundos faltan para alcanzar la fecha indicada.
 * * Si el resultado es negativo, devuelve hace cuántos milisegundos ocurrió la fecha indicada.
 * * Si el resultado es `0`, la fecha indicada es ahora mismo.
 */
function timeUntil(date: Date) {
	const now = Date.now();
	const then = +date;
	return then - now;
}

/**@description Inicializa el programador de recordatorios con el cliente indicado.*/
export function initRemindersScheduler(client: Client) {
	if(!client)
		throw new TypeError(`Expected a Discord client. Got: ${client == null ? client : typeof client}`);

	debug('Initializing the scheduler.');
	schedulerClient = client;
}

/**@class Representa un error en relación al programador de recordatorios.*/
export class RemindersSchedulerError extends Error {
	constructor(message: string = undefined) {
		super(message);
		this.name = 'RemindersSchedulerError';
	}
}
