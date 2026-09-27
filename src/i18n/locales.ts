/**
 * @description
 * Localization languages that should be available.
 *
 * All locales listed here must be supported by the bot.
 */
const Locales = {
	Spanish: 'es',
	English: 'en',
	Japanese: 'ja',
} as const;

export default Locales;

/**@description Default language to use when the guild or user's preferred locale is unknown.*/
export const defaultLocale = Locales.Spanish;
