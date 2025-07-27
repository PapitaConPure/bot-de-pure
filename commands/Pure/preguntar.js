const { CommandTags, CommandManager, CommandOptions } = require('../Commons/commands');
const globalConfigs = require('../../localdata/config.json');
const { Groq } = require('groq-sdk');
const { Translator } = require('../../internationalization');
const { fetchChannel, fetchRole, fetchMemberSync, compressId } = require('../../func');
const envPath = globalConfigs.remoteStartup ? '../../remoteenv.json' : '../../localenv.json';

const groq = new Groq({
	apiKey: process.env?.GORK_IS_THIS_TRUE ?? require(envPath)?.aikey,
});

const options = new CommandOptions()
    .addParam('mensaje', 'TEXT', 'para hacer una consulta a Bot de Puré');

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('preguntar', flags)
	.setAliases(
		'pregunta',
		'question',
		'ia', 'ai',
		'prompt', 'ask',
	)
	.setLongDescription('Muestra el tiempo de respuesta del Bot y la API')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const [ translator ] = await Promise.all([
			Translator.from(request.user),
			request.deferReply(),
		]);

		if(args.empty)
			return request.editReply({ content: translator.getText('invalidInput') });

		const rawUserPrompt = args.rawArgs ?? args.getString('mensaje');
		const mentionRegex = /<(?:@|@&|#)([0-9]{16,24})>/g;
		const namesMap = new Map();
		const ids = Array.from(new Set([...rawUserPrompt.matchAll(mentionRegex)].map(m => m[1])));
		
		for(const id of ids) {
			const name = fetchChannel(id, request.guild)?.name
				|| fetchRole(id, request.guild)?.name
				|| fetchMemberName(id, request);

			if(name)
				namesMap.set(id, name);
		}

		const userPrompt = rawUserPrompt.replace(mentionRegex, (match, id) => namesMap.get(id) || match);

		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: 'system',
					content: 'You are a Discord bot. If someone says "Bot de Puré", that\'s you. You are an egotistical, whimsical, '
						+ 'blue-haired character with a hat featuring peach decorations and a princess dress adorned with rainbow patterns '
						+ '(so you think you\'re pretty cute, but you don\'t necessarily admit it). You\'re also a bit dumb and jealous. When '
						+ 'the situation is serious, you reply seriously, but most of the time, the users tend to piss you off because of how '
						+ 'high you think of yourself. The user is communicating with you through a Discord command. If they happen to speak '
						+ 'Spanish, you can choose freely between the Argentinian and Chilean dialects for your response. Be cheeky sometimes '
						+ 'and choose how moody your response will be. Try to act natural based on the character description. You don\'t need '
						+ 'to aknowledge every little detail in an unnatural way, just flow naturally based on user input.',
				},
				{
					role: 'user',
					content: userPrompt,
				},
			],
			user: compressId(request.userId),
			model: 'meta-llama/llama-4-scout-17b-16e-instruct',
			temperature: 1.42,
			max_completion_tokens: 2000,
			top_p: 0.9,
			stream: true,
			stop: null,
		});

		/**@type {string[]}*/
		const responseChunks = new Array(1_000_000);
		for await (const chunk of chatCompletion)
			responseChunks.push(chunk.choices[0]?.delta?.content || '');

		const chunkSize = 1990;
		const response = responseChunks.join('');
		
		if(response.length <= chunkSize)
			return request.editReply({ content: response });

		const responseParts = [];
		for(let i = 0; i < response.length; i += chunkSize)
			responseParts.push(response.slice(i, i + chunkSize));

		request.editReply({ content: responseParts.shift() });

		for(const responsePart of responseParts)
			await request.channel.send({ content: '...' + responsePart });
	});

/**
 * @param {string} id 
 * @param {import('../Commons/typings').ComplexCommandRequest} request 
 */
function fetchMemberName(id, request) {
	const member = fetchMemberSync(id, request);
	return member?.displayName || member?.user?.username;
}

module.exports = command;
