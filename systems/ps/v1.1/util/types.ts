export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

export type ValuesOf<T> = T[keyof T];

export type Flatten<T> = {
    [K in keyof T]: T[K];
} & {};
