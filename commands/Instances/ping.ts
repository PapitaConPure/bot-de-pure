import { CommandTags, Command } from '../Commons';
import { improveNumber, sleep } from '../../func';
import { InteractionEditReplyOptions, InteractionResponse, Message, MessageEditOptions, MessagePayload } from 'discord.js';
import { ComplexCommandRequest } from '../Commons/typings';

const tags = new CommandTags().add('COMMON');

const command = new Command('ping', tags)
	.setLongDescription('Muestra el tiempo de respuesta del Bot y la API')
	.setExecution(async request => {
		const sent = (await request.reply({
			content: 
				'Pong~♪\n' +
				`**Latencia de la API** ${request.client.ws.ping}ms\n` +
				`**Tiempo de respuesta** _comprobando..._`,
		})) as Message<true>;

		const wsPing = request.client.ws.ping;

		let start: number, end: number;
		start = Date.now();
		await editSent(sent, request, {
			content: 
				'Pong~♪\n' +
				`**Latencia de la API** ${wsPing}ms\n` +
				`**Tiempo de respuesta** _enviando..._`,
		});
		end = Date.now();

		const max = 4;
		let amount = end - start;
		let count: number;
		for(count = 1; count < max; count++) {
			start = Date.now();
			await editSent(sent, request, {
				content:
					'Pong~♪\n' +
					`**Latencia de la API** ${wsPing}ms\n` +
					`**Tiempo de respuesta** ${improveNumber(amount / count)}ms... (${count}/${max})`,
			});
			end = Date.now();

			amount += end - start;

			await sleep(3000);
		}

		return editSent(sent, request, {
			content:
				'Pong~♪\n' +
				`**Latencia de la API** ${wsPing}ms\n` +
				`**Tiempo de respuesta** ${improveNumber(amount / count)}ms`,
		});
	});

function editSent(
	sent: Message<true> | InteractionResponse<false>,
	request: ComplexCommandRequest,
	editOptions: string | MessagePayload | MessageEditOptions | InteractionEditReplyOptions
) {
	if(request.isInteraction) {
		const interaction = /**@type {CommandInteraction<'cached'>}*/(request);
		return interaction.editReply(editOptions);
	} else {
		const message = /**@type {Message<true>}*/(sent);
		return message.edit(/**@type {MessageEditOptions}*/(editOptions));
	}
}

export default command;
