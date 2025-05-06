/**
 * @template T
 * @typedef {{[K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>}[keyof T]} RequireAtLeastOne
 */

/**
 * @template T
 * @typedef {T[keyof T]} ValuesOf
 */

/**
 * @template T
 * @typedef {{[K in keyof T]: T[K]} & {}} Flatten
 */

/**
 * @typedef {import('discord.js').JSONEncodable<import('discord.js').APIMessageTopLevelComponent>
 *           | import('discord.js').TopLevelComponentData
 *           | import('discord.js').ActionRowData<import('discord.js').MessageActionRowComponentData | import('discord.js').MessageActionRowComponentBuilder>
 *           | import('discord.js').APIMessageTopLevelComponent} MessageComponentDataResolvable
 */

module.exports = {};
