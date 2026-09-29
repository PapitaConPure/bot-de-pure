import { fetchGuildCache, type GuildCacheResolvable } from '@/utils/guildcache';
import { fetchUserCache, type UserCacheResolvable } from '@/utils/usercache';
import type { ConditionString } from './commons';
import { defaultLocale } from './locales';
import translations from './translations';
import type { LocaleKey, StaticTranslationRecord, TranslationKey } from './types';

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
	getText(id: TranslationKey, ...values: unknown[]) {
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
	static async fromUser(user: UserCacheResolvable): Promise<Translator> {
		const userCache = await fetchUserCache(user);
		return new Translator(userCache.language ?? defaultLocale);
	}

	static async fromGuild(guild: GuildCacheResolvable): Promise<Translator> {
		const guildCache = await fetchGuildCache(guild);
		return new Translator(guildCache.locale ?? defaultLocale);
	}

	/**@description Instancia un {@link Translator} en base al idioma del usuario indicado*/
	static async from(
		data: Exclude<UserCacheResolvable & GuildCacheResolvable, string>,
	): Promise<readonly [Translator, Translator]> {
		if (typeof data === 'string')
			throw TypeError("Can't use the same string data to resolve both a user and a guild.");
		return Promise.all([Translator.fromUser(data), Translator.fromGuild(data)]);
	}

	/**
	 * @description Muestra un texto localizado según la configuración del usuario
	 * @param id id de texto a mostrar en forma localizada
	 * @param locale lenguaje al cual localizar el texto
	 * @param values variables a insertar en el texto seleccionado como reemplazos de campos designados
	 */
	static getText(id: TranslationKey, locale: LocaleKey, ...values: unknown[]) {
		const localeSet = translations[id];
		if (!localeSet)
			throw ReferenceError(
				`Se esperaba una id de texto localizado válido. Se recibió: ${id}`,
			);
		const translationTemplate = localeSet[locale];
		if (translationTemplate == null)
			throw RangeError(
				`Se esperaba una clave de localización válida. Se recibió: ${id} :: ${locale}`,
			);

		const actualTranslationTemplate =
			typeof translationTemplate === 'function' ? translationTemplate() : translationTemplate;

		//Ejemplo: 1{...}<?{'por defecto'}
		const subLocaleRegex =
			/(\d+){\.\.\.}(?:<!{((?:[!=<>]{1,2}):[^|]+)\|'((?:(?!'}).)*)'})?(?:<\?{'((?:(?!'}).)*)'})?/g;
		const translation = actualTranslationTemplate.replace(
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
	 * @description Obtains a static translation record. If the translation associated to the key is dynamic, it gets compiled and then returned as static.
	 * @param key The translation key to find.
	 */
	static getStaticTranslation(key: TranslationKey): StaticTranslationRecord {
		const translation = translations[key];

		if (!translation)
			throw ReferenceError(`Se esperaba una id de traducción válida. Se recibió: ${key}`);

		if (typeof translation[defaultLocale] !== 'function') return translation;

		//Compile translation paths
		return Object.fromEntries(
			Object.entries(translation).map(([key, fn]) => [key, fn()]),
		) as StaticTranslationRecord;
	}
}
