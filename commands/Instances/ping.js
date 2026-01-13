const { CommandTags, Command } = require('../Commons/');
const { improveNumber, sleep } = require('../../func');

const flags = new CommandTags().add('COMMON');
const command = new Command('ping', flags)
	.setLongDescription('Muestra el tiempo de respuesta del Bot y la API')
	.setExecution(async request => {
		const sent = /**@type {import('discord.js').Message<true>}*/(await request.reply({
			content: 
				'Pong~♪\n' +
				`**Latencia de la API** ${request.client.ws.ping}ms\n` +
				`**Tiempo de respuesta** _comprobando..._`,
		}));

		const wsPing = request.client.ws.ping;

		let start, end;
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
		let count;
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

/**
 * @param {import('discord.js').Message<true> | import('discord.js').InteractionResponse<false>} sent 
 * @param {import('../Commons/typings').ComplexCommandRequest} request
 * @param {string | import('discord.js').MessagePayload | import('discord.js').MessageEditOptions | import('discord.js').InteractionEditReplyOptions} editOptions
 */
function editSent(sent, request, editOptions) {
	if(request.isInteraction) {
		const interaction = /**@type {import('discord.js').CommandInteraction<'cached'>}*/(request);
		return interaction.editReply(editOptions);
	} else {
		const message = /**@type {import('discord.js').Message<true>}*/(sent);
		return message.edit(/**@type {import('discord.js').MessageEditOptions}*/(editOptions));
	}
}

module.exports = command;
