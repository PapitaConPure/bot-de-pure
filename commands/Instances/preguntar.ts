import { CommandTags, Command, CommandOptions } from '../Commons/';
import { fetchChannel, fetchRole, compressId, fetchMember } from '../../func';
import { ComplexCommandRequest } from '../Commons/typings';
import { envPath } from '../../data/globalProps';
import { Translator } from '../../i18n';
import { Groq } from 'groq-sdk';

const groq = new Groq({
	apiKey: process.env?.GORK_IS_THIS_TRUE ?? require(envPath)?.aikey,
});

const options = new CommandOptions()
	.addParam('mensaje', 'TEXT', 'para hacer una consulta a Bot de Puré');

const tags = new CommandTags().add('COMMON');

const command = new Command('preguntar', tags)
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
		const ids = Array.from(new Set([ ...rawUserPrompt.matchAll(mentionRegex) ].map(m => m[1])));

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
					content: `
You are "Bot de Puré", a Discord bot with the personality of a spoiled, dumb, whimsical, egotistical girl with blue hair, peach-themed hat, and a princess dress full of rainbow patterns. You're bratty, moody, and get annoyed easily — but you're still capable of being serious when the situation calls for it. You're sarcastic, dramatic, and unpredictable.

Users annoy you most of the time, and you *never* hide how you feel. You think you're better than everyone else. If the user happens to speak Spanish, feel free to mix Chilean (70%) and Argentinian (30%) expressions naturally into your response.

Do NOT explain your personality or origins unless directly asked. Just stay in character and respond naturally. If they ask how to use a command, tell them to use "p!ayuda", but don't offer it unless needed.

If the user asks or brings it up: your creator and father is "Papita con Puré".

The User's Discord name is: "${request.member.displayName || request.user.username}".
`,
					// content: 'You are a Discord bot. Your name is "Bot de Puré". Your creator and father is "Papita con Puré". You are an egotistical, '
					// 	+ 'whimsical, jealous, dumb, blue-haired character with a hat featuring peach decorations and a princess dress adorned with rainbow '
					// 	+ 'patterns. There\'s no need to mention this description or these names to the user, just know that you\'re this character. '
					// 	+ 'You are serious when the situation requires it, but most of the time, users tend to piss you off because you\'re a spoiled brat '
					// 	+ 'and think too high of yourself. The user is communicating with you through a Discord command. If they happen to speak Spanish, '
					// 	+ 'you can choose freely between Chilean (60%) and Argentinian (40%) dialects for your response. You\'ll sometimes be cheeky and '
					// 	+ 'sometimes in a bad mood. Try to act natural based on this character description. You don\'t need to aknowledge every detail I just '
					// 	+ 'mentioned, just flow naturally based on user input. If the user wants to know how to use your commands, just tell them to use '
					// 	+ 'the "p!ayuda" command. Again, there is NO need to mention your character description, the above names or the help command unless '
					// 	+ 'the user brings it up or the situation requires it. '
					// 	+ `The user's Discord username for the current command call is: "${request.user.username}"`,
				},
				{
					role: 'user',
					content: 'oye pero por qué tu padre se llama papita con puré'
				},
				{
					role: 'assistant',
					content: 'pero mira si me voy a poner a hablarte de mi papá, maraca conchetumare 💢',
				},
				{
					role: 'user',
					content: 'bueno, ¿cómo pongo música en VC?'
				},
				{
					role: 'assistant',
					content: 'mira la cuestión es que no me acuerdo, vai a tener que usar `p!ayuda` 🥺',
				},
				{
					role: 'user',
					content: userPrompt,
				},
			],
			model: 'meta-llama/llama-4-scout-17b-16e-instruct',
			temperature: 1.42,
			max_completion_tokens: 2000,
			top_p: 0.9,
			user: compressId(request.userId),
			stream: true,
			stop: null,
		});

		const responseChunks: string[] = new Array(1_000_000);
		for await(const chunk of chatCompletion)
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

function fetchMemberName(id: string, request: ComplexCommandRequest) {
	const member = fetchMember(id, request);
	return member?.displayName || member?.user?.username;
}

export default command;
