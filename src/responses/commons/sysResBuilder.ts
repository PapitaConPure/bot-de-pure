import type {
	AnySelectMenuInteraction,
	ButtonInteraction,
	ModalMessageModalSubmitInteraction,
} from 'discord.js';
import type { AnyCommandInteraction } from 'types/commands';
import type { CommandPermissions } from '@/commands/commons';

interface InteractionResponseOptions {
	permissions?: CommandPermissions;
}

export type SystemResponseHandler<
	TInteraction extends AnyCommandInteraction<'cached'> = AnyCommandInteraction<'cached'>,
> = ((interaction: TInteraction, ...args: string[]) => Promise<void>) &
	InteractionResponseOptions;

/**Represents an automated guild or user system.*/
export class SystemResponses<TResponseName extends string = never> {
	readonly name: string;
	#responses: Map<TResponseName, SystemResponseHandler<AnyCommandInteraction<'cached'>>>;

	constructor(name: string) {
		this.name = name;
		this.#responses = new Map();
	}

	#configureResponse(
		responseFn: InteractionResponseOptions,
		options: InteractionResponseOptions,
	): void {
		responseFn.permissions = options.permissions;
	}

	/**
	 * @param responseName El nombre de registro de la respuesta de interacción de componente.
	 * @param responseFn La respuesta a la interacción de componente.
	 */
	setButtonResponse<TName extends string>(
		responseName: TName,
		responseFn: SystemResponseHandler<ButtonInteraction<'cached'>>,
		options: InteractionResponseOptions = {},
	) {
		this.#configureResponse(responseFn, options);
		this.#responses.set(
			responseName as unknown as TResponseName,
			responseFn as SystemResponseHandler<AnyCommandInteraction<'cached'>>,
		);
		return this as SystemResponses<TResponseName | TName>;
	}

	/**
	 * @param responseName El nombre de registro de la respuesta de interacción de componente.
	 * @param responseFn La respuesta a la interacción de componente.
	 */
	setSelectMenuResponse<TName extends string>(
		responseName: string,
		responseFn: SystemResponseHandler<AnySelectMenuInteraction<'cached'>>,
		options: InteractionResponseOptions = {},
	) {
		this.#configureResponse(responseFn, options);
		this.#responses.set(
			responseName as unknown as TResponseName,
			responseFn as SystemResponseHandler<AnyCommandInteraction<'cached'>>,
		);
		return this as SystemResponses<TResponseName | TName>;
	}

	/**
	 * @param responseName El nombre de registro de la respuesta de interacción de componente.
	 * @param responseFn La respuesta a la interacción de componente.
	 */
	setModalResponse<TName extends string>(
		responseName: TName,
		responseFn: SystemResponseHandler<ModalMessageModalSubmitInteraction<'cached'>>,
		options: InteractionResponseOptions = {},
	) {
		this.#configureResponse(responseFn, options);
		this.#responses.set(
			responseName as unknown as TResponseName,
			responseFn as SystemResponseHandler<AnyCommandInteraction<'cached'>>,
		);
		return this as SystemResponses<TResponseName | TName>;
	}

	getResponseFn(
		responseId: TResponseName,
	): SystemResponseHandler<AnyCommandInteraction<'cached'>> | undefined {
		return this.#responses.get(responseId);
	}

	get customIdGetter(): (fnName: TResponseName, ...args: unknown[]) => string {
		return (fnName: TResponseName, ...args: unknown[]) =>
			`!${this.name}_${fnName}${args?.length ? `_${args.join('_')}` : ''}`;
	}
}
