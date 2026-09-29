import type {
	AnySelectMenuInteraction,
	ButtonInteraction,
	CacheType,
	ModalMessageModalSubmitInteraction,
} from 'discord.js';
import type { AnyCommandInteraction } from 'types/commands';
import type { CommandPermissions } from '@/commands/commons';

interface InteractionResponseOptions {
	permissions?: CommandPermissions;
}

export type SystemResponseHandler<
	TInteraction extends AnyCommandInteraction = AnyCommandInteraction,
> = ((interaction: TInteraction, ...args: string[]) => Promise<void>) & InteractionResponseOptions;

export type AnySystemResponseHandler<TCache extends CacheType = CacheType> =
	| SystemResponseHandler<ButtonInteraction<TCache>>
	| SystemResponseHandler<AnySelectMenuInteraction<TCache>>
	| SystemResponseHandler<ModalMessageModalSubmitInteraction<TCache>>;

/**Represents an automated guild or user system.*/
export class SystemResponses<TResponseName extends string = never> {
	readonly name: string;
	#guildResponses: Map<TResponseName, AnySystemResponseHandler<'cached'>>;
	#globalResponses: Map<TResponseName, AnySystemResponseHandler>;

	constructor(name: string) {
		this.name = name;
		this.#guildResponses = new Map();
		this.#globalResponses = new Map();
	}

	/**
	 * @param responseName The name of the response.
	 * @param responseFn The component interaction response to execute.
	 */
	setButtonResponse<TName extends string>(
		responseName: TName,
		responseFn: SystemResponseHandler<ButtonInteraction<'cached'>>,
		options: InteractionResponseOptions = {},
	) {
		return this.#registerGuildResponse(responseName, responseFn, options);
	}

	/**
	 * @param responseName The name of the global response.
	 * @param responseFn The global component interaction response to execute.
	 */
	setGlobalButtonResponse<TName extends string>(
		responseName: TName,
		responseFn: SystemResponseHandler<ButtonInteraction>,
		options: InteractionResponseOptions = {},
	) {
		return this.#registerGlobalResponse(responseName, responseFn, options);
	}

	/**
	 * @param responseName The name of the response.
	 * @param responseFn The component interaction response to execute.
	 */
	setSelectMenuResponse<TName extends string>(
		responseName: TName,
		responseFn: SystemResponseHandler<AnySelectMenuInteraction<'cached'>>,
		options: InteractionResponseOptions = {},
	) {
		return this.#registerGuildResponse(responseName, responseFn, options);
	}

	/**
	 * @param responseName The name of the global response.
	 * @param responseFn The global component interaction response to execute.
	 */
	setGlobalSelectMenuResponse<TName extends string>(
		responseName: TName,
		responseFn: SystemResponseHandler<AnySelectMenuInteraction>,
		options: InteractionResponseOptions = {},
	) {
		return this.#registerGlobalResponse(responseName, responseFn, options);
	}

	/**
	 * @param responseName The name of the response.
	 * @param responseFn The component interaction response to execute.
	 */
	setModalResponse<TName extends string>(
		responseName: TName,
		responseFn: SystemResponseHandler<ModalMessageModalSubmitInteraction<'cached'>>,
		options: InteractionResponseOptions = {},
	) {
		return this.#registerGuildResponse(responseName, responseFn, options);
	}

	/**
	 * @param responseName The name of the global response.
	 * @param responseFn The global component interaction response to execute.
	 */
	setGlobalModalResponse<TName extends string>(
		responseName: TName,
		responseFn: SystemResponseHandler<ModalMessageModalSubmitInteraction>,
		options: InteractionResponseOptions = {},
	) {
		return this.#registerGlobalResponse(responseName, responseFn, options);
	}

	#registerGuildResponse<TName extends string>(
		responseName: TName,
		responseFn: AnySystemResponseHandler<'cached'>,
		options: InteractionResponseOptions,
	) {
		this.#configureResponse(responseFn, options);
		this.#guildResponses.set(responseName as unknown as TResponseName, responseFn);
		return this as SystemResponses<TResponseName | TName>;
	}

	#registerGlobalResponse<TName extends string>(
		responseName: TName,
		responseFn: AnySystemResponseHandler,
		options: InteractionResponseOptions,
	) {
		this.#configureResponse(responseFn, options);
		this.#globalResponses.set(responseName as unknown as TResponseName, responseFn);
		return this as SystemResponses<TResponseName | TName>;
	}

	#configureResponse(
		responseFn: InteractionResponseOptions,
		options: InteractionResponseOptions,
	): void {
		responseFn.permissions = options.permissions;
	}

	getResponseFn(
		responseId: TResponseName,
	): SystemResponseHandler<AnyCommandInteraction<'cached'>> | undefined {
		return this.#guildResponses.get(responseId) as SystemResponseHandler<
			AnyCommandInteraction<'cached'>
		>;
	}

	getGlobalResponseFn(
		responseId: TResponseName,
	): SystemResponseHandler<AnyCommandInteraction> | undefined {
		return this.#globalResponses.get(
			responseId,
		) as SystemResponseHandler<AnyCommandInteraction>;
	}

	get customIdGetter(): (fnName: TResponseName, ...args: unknown[]) => string {
		return (fnName: TResponseName, ...args: unknown[]) =>
			`!${this.name}_${fnName}${args?.length ? `_${args.join('_')}` : ''}`;
	}
}
