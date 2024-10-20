const { InteractionResponse, Message, CommandInteraction } = require('discord.js');
const { CommandTags, CommandManager } = require('../Commons/commands');
const { improveNumber, sleep } = require('../../func');

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('ping', flags)
	.setLongDescription('Muestra el tiempo de respuesta del Bot y la API')
	.setExecution(async (request, _, isSlash) => {
		const sent = /**@type {Message<true>}*/(await request.reply({
			content: 
				'Pong~♪\n' +
				`**Latencia de la API** ${request.client.ws.ping}ms\n` +
				`**Tiempo de respuesta** _comprobando..._`,
		}));

		const wsPing = request.client.ws.ping;

		let start, end;
		start = Date.now();
		await editSent(sent, request, isSlash, {
			content: 
				'Pong~♪\n' +
				`**Latencia de la API** ${wsPing}ms\n` +
				`**Tiempo de respuesta** _enviando..._`,
		});
		end = Date.now();

		const max = 4;
		let amount = end - start;
		let count;
		for(count = 1; count < max; count++) {
			start = Date.now();
			await editSent(sent, request, isSlash, {
				content:
					'Pong~♪\n' +
					`**Latencia de la API** ${wsPing}ms\n` +
					`**Tiempo de respuesta** ${improveNumber(amount / count)}ms... (${count}/${max})`,
			});
			end = Date.now();

			amount += end - start;

			await sleep(3000);
		}

		return editSent(sent, request, isSlash, {
			content:
				'Pong~♪\n' +
				`**Latencia de la API** ${wsPing}ms\n` +
				`**Tiempo de respuesta** ${improveNumber(amount / count)}ms`,
		});
	});

/**
 * @param {Message<true> | InteractionResponse<false>} sent 
 * @param {import('../Commons/typings').ComplexCommandRequest} request
 * @param {Boolean | undefined} isSlash
 * @param {string | import('discord.js').MessagePayloadOption | import('discord.js').MessageEditOptions | import('discord.js').InteractionEditReplyOptions} editOptions
 */
function editSent(sent, request, isSlash, editOptions) {
	if(isSlash) {
		const interaction = /**@type {CommandInteraction<'cached'>}*/(request);
		return interaction.editReply(editOptions);
	} else {
		const message = /**@type {Message<true>}*/(sent);
		return message.edit(/**@type {import('discord.js').MessageEditOptions}*/(editOptions));
	}
}

module.exports = command;
