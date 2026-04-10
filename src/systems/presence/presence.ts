import { readFileSync } from 'node:fs';
import chalk from 'chalk';
import { ActivityType } from 'discord.js';
import { randRange } from '@/func';
import { getQueueItem } from '@/models/queues';
import { resolveFrom } from '@/utils/runtimeFs';

const txtToArray = (path: string) =>
	readFileSync(resolveFrom(import.meta.url, path), { encoding: 'utf-8' })
		.split('\n')
		.map((t) => {
			//Compatibilidad
			if (t.endsWith('\r')) return t.slice(0, -1);
			return t;
		})
		.filter((t) => t.length);
const presence = {
	status: txtToArray('./status.txt'),
	stream: txtToArray('./stream.txt'),
};

const PRESENCE_TICK_INTERVAL_RANGE = [20, 35] as const;

const specialDates: Record<`${number}-${number}`, (today: Date) => string> = {
	'01-01': () => '¡Feliz año nuevo! 🎉',
	'02-14': () => '¡Feliz día de San Valentín!',
	'04-01': () => (Math.random() < 0.5 ? '127.0.0.1' : '255.255.255.0'),
	'04-22': () => '¡Feliz día, Tierra!',
	'06-02': () => '¡Feliz cumpleaños a mi creador!',
	'07-30': () => '¡Feliz día de la amistad!',
	'09-13': () => '¡Feliz día del programador!',
	'10-04': () => '¡Feliz día de Tenshi! 🍑',
	'10-05': () => '¿Feliz día de Tenshi?',
	'10-31': () => 'Bú 👻 oOoOo 👻',
	'12-03': (today) => `¡Hoy cumplo ${today.getUTCFullYear() - 2019} años!`,
	'12-25': () => '¡Feliz navidad!',
};

/**
 * @description
 * Cambia la frase que muestra el usuario de Bot de Puré y reprograma dicha acción en un intervalo de tiempo predeterminado.
 *
 * @copyright
 * Créditos a Imagine Breaker#6299 y Sassafras.
 */
export async function modifyPresence(client: import('discord.js').Client, steps: number = 0) {
	try {
		const now = new Date(Date.now());
		const dayKey = `${now.getUTCDate()}`.padStart(2, '0');
		const monthKey = `${now.getUTCMonth() + 1}`.padStart(2, '0');
		const specialDateKey = `${monthKey}-${dayKey}`;

		const status =
			specialDates[specialDateKey]?.(now)
			?? presence.status[
				await getQueueItem({
					queueId: 'presenceStatus',
					length: presence.status.length,
					sort: 'RANDOM',
				})
			];

		client.user.setActivity({
			type: ActivityType.Custom,
			name: 'customstatus',
			state: `🥔 ${status}`,
		});
	} catch (err) {
		console.log(
			chalk.redBright.bold('Ocurrió un error al intentar realizar un cambio de presencia.'),
		);
		console.error(err);
	}

	//Programar próxima actualización de actividad
	const [minInterval, maxInterval] = PRESENCE_TICK_INTERVAL_RANGE;
	const stepTime = randRange(minInterval, maxInterval);
	setTimeout(modifyPresence, 60e3 * stepTime, client, steps + 1);
}
