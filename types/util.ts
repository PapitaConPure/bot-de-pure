export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

export type ValuesOf<T> = T[keyof T];

export type Flatten<T> = {
    [K in keyof T]: T[K];
} & {};

export type MessageComponentDataResolvable = import('discord.js').JSONEncodable<import('discord.js').APIMessageTopLevelComponent> |
    import('discord.js').TopLevelComponentData |
    import('discord.js').ActionRowData<import('discord.js').MessageActionRowComponentData | import('discord.js').MessageActionRowComponentBuilder> |
    import('discord.js').APIMessageTopLevelComponent;
