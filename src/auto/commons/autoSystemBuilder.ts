import type {
	AnySelectMenuInteraction,
	ButtonInteraction,
	ModalSubmitInteraction,
} from 'discord.js';
import type { AnyCommandInteraction } from 'types/commands';
import type { CommandPermissions } from '@/commands/commons';

interface InteractionResponseOptions {
	permissions?: CommandPermissions;
}

export type SystemResponseHandler<
	TInteraction extends AnyCommandInteraction<'cached'> = AnyCommandInteraction<'cached'>,
> = ((interaction: TInteraction) => Promise<unknown>) & InteractionResponseOptions;

/**Represents an automated guild or user system.*/
export class AutoSystem {
	readonly name: string;
	#responses: Map<string, SystemResponseHandler<AnyCommandInteraction<'cached'>>>;

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

	/** @param responseFn Una función no-anónima que responderá a la interacción de componente.*/
	setButtonResponse(
		responseFn: SystemResponseHandler<ButtonInteraction<'cached'>>,
		options: InteractionResponseOptions = {},
	) {
		this.#configureResponse(responseFn, options);
		this.#responses.set(
			responseFn.name,
			responseFn as SystemResponseHandler<AnyCommandInteraction<'cached'>>,
		);
		return this;
	}

	/** @param responseFn Una función no-anónima que responderá a la interacción de componente.*/
	setSelectMenuResponse(
		responseFn: SystemResponseHandler<AnySelectMenuInteraction<'cached'>>,
		options: InteractionResponseOptions = {},
	) {
		this.#configureResponse(responseFn, options);
		this.#responses.set(
			responseFn.name,
			responseFn as SystemResponseHandler<AnyCommandInteraction<'cached'>>,
		);
		return this;
	}

	/** @param responseFn Una función no-anónima que responderá a la interacción de componente.*/
	setModalResponse(
		responseFn: SystemResponseHandler<ModalSubmitInteraction<'cached'>>,
		options: InteractionResponseOptions = {},
	) {
		this.#configureResponse(responseFn, options);
		this.#responses.set(
			responseFn.name,
			responseFn as SystemResponseHandler<AnyCommandInteraction<'cached'>>,
		);
		return this;
	}

	getResponseFn(
		responseId: string,
	): SystemResponseHandler<AnyCommandInteraction<'cached'>> | undefined {
		return this.#responses.get(responseId);
	}
}
