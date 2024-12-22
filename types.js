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

module.exports = {};