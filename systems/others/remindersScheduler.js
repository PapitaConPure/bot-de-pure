const globalConfigs = require('../../data/config.json');
const { MessageFlags, ContainerBuilder } = require('discord.js');
const Reminder = require('../../models/reminders');
const Logger = require('../../utils/logs');
const { Translator } = require('../../i18n');
const { decompressId } = require('../../func');

const { debug, info, error } = Logger('DEBUG', 'Reminders');

/**
 * Representa un único programador de recordatorios
 * @class
 * @static
 */
class RemindersScheduler {
	/**@type {import('discord.js').Client}*/
	#client;

	/**
	 * Inicializa el programador de recordatorios, disparando todos los recordatorios pendientes que estén expirados
	 * @param {import('discord.js').Client} client 
	 */
	constructor(client) {
		this.#client = client;
	}

	/**
	 * Dispara todos los recordatorios pendientes que ya estén expirados
	 * @throws {RemindersSchedulerError}
	 */
	async triggerDueReminders() {
		try {
			const dueReminders = await Reminder.find({ date: { $lte: new Date(Date.now()) } });
			const triggers = await Promise.allSettled(dueReminders.map(reminder => this.triggerReminder(reminder)));
			const failedTriggers = triggers.filter(trigger => trigger.status === 'rejected');
			if(failedTriggers.length)
				throw new RemindersSchedulerError(`Couldn't trigger all reminders.\nReceived the following reasons:\n${failedTriggers.map(t => t.reason).join('\n')}`);
		} catch(err) {
			const message = 'Failed to trigger all due reminders.';
			error(err, message);
			throw new RemindersSchedulerError(message);
		}
	}

	/**
	 * Programa el recordatorio indicado a ejecutarse en el tiempo que trae especificado
	 * @param {import('../../models/reminders').ReminderDocument} reminder El recordatorio a programar
	 */
	scheduleReminder(reminder) {
		debug('Attempting to schedule a reminder');

		const ms = timeUntil(reminder.date);

		if(ms <= 0) {
			this.triggerReminder(reminder);
			info('A reminder was about to be scheduled, but it\'s already expired so it was triggered immediately instead.');
		} else {
			setTimeout(this.triggerReminder, ms, reminder);
			info('Scheduling a reminder');
		}
	}

	/**
	 * Dispara el recordatorio indicado
	 * @param {import('../../models/reminders').ReminderDocument} reminder El recordatorio a disparar
	 */
	async triggerReminder(reminder) {
		debug(`Attempting to trigger reminder #${reminder._id}.`);
		
		const channelId = decompressId(reminder.channelId);
		const userId = decompressId(reminder.userId);
		
		debug(`Fetching the specified channel for reminder #${reminder._id}.`);
		const channel = this.#client.channels.cache.get(channelId)
		?? await this.#client.channels.fetch(channelId);
		
		debug(`Fetching the specified user for reminder #${reminder._id}.`);
		const user = this.#client.users.cache.get(userId)
			?? await this.#client.users.fetch(userId);

		try {
			if(channel.isSendable() && channel.isTextBased() && !channel.isDMBased()) {
				await this.#sendReminder(channel, user, reminder.content);
				debug(`Reminder message for ${user.username} has been sent to ${channelId}.`);
			}
	
			await Reminder.findByIdAndDelete(reminder._id);

			info(`The reminder #${reminder._id} for ${user.username} has been triggered, sent to ${channelId}, and deleted appropiately.`);
		} catch(err) {
			error(err);
			throw new RemindersSchedulerError('No se pudo disparar un recordatorio.');
		}
	}

	/**
	 * Envía el contenido del recordatorio en Discord
	 * @param {import('discord.js').GuildTextBasedChannel} channel El canal destino del envío
	 * @param {import('discord.js').User} user El usuario a mencionar con el recordatorio
	 * @param {string} reminderContent El contenido del recordatorio
	 */
	async #sendReminder(channel, user, reminderContent) {
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
};

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

/**@type {RemindersScheduler}*/
let scheduler;

/**
 * Inicializa el programador de recordatorios con el cliente indicado
 * @param {import('discord.js').Client} client 
 */
function initRemindersScheduler(client) {
	debug('Attempting to initialize the scheduler.');
	scheduler = new RemindersScheduler(client);
}

/**
 * Obtiene el programador de recordatorios que fue previamente inicializado
 * @returns {RemindersScheduler}
 * @throws {RemindersSchedulerNotInitializedError} Si no se ha llamado la función {@link initRemindersScheduler}
 */
function getRemindersScheduler() {
	debug('Attempting to get the initialized scheduler.');

	if(!scheduler)
		throw new RemindersSchedulerNotInitializedError();

	return scheduler;
}

class RemindersSchedulerNotInitializedError extends Error {
	constructor() {
		super('No se inicializó el programador de recordatorios. Usa initRemindersScheduler() primero.');
		this.name = 'RemindersSchedulerNotInitializedError';
	}
}

class RemindersSchedulerError extends Error {
	/**@param {string} [message]*/
	constructor(message = undefined) {
		super(message);
		this.name = 'RemindersSchedulerError';
	}
}

module.exports = {
	initRemindersScheduler,
	getRemindersScheduler,
};
