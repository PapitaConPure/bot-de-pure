///While it's true that a 'types/' directory already exists, there's plans to move this Translator thing to its own package and I don't want to complicate that even more.

import type { ValuesOf } from 'types';
import type Locales from './locales';
import type translations from './translations';

export type LocaleKey = ValuesOf<typeof Locales>;

export type StaticTranslationRecord = Record<LocaleKey, string>;
export type JustInTimeTranslationRecord = Record<LocaleKey, () => string>;
export type TranslationRecord = StaticTranslationRecord | JustInTimeTranslationRecord;

export type TranslationKey = keyof typeof translations;
