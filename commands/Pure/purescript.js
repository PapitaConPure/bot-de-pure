const { CommandMetaFlagsManager } = require("../Commons/cmdFlags");
const { CommandManager } = require("../Commons/cmdBuilder");
const { executeTuber } = require("../../systems/purescript");
const { CommandOptionsManager } = require("../Commons/cmdOpts");

/**
 * 
 * @param {Boolean | undefined} isSlash 
 * @param {import("../Commons/typings").CommandOptions} args 
 * @param {String} rawArgs 
 */
function getScriptString(isSlash, args, rawArgs) {
	if(isSlash)
		return args.getString('script');
	
	let script = rawArgs
		.replace(/^```[A-Za-z0-9]*/, '')
		.replace(/```$/, '');
	return script;
}

const options = new CommandOptionsManager()
	.addParam('script', 'TEXT', 'para designar código PuréScript a ejecutar');
const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('purescript', flags)
	.setAliases('puréscript', 'ps')
	.setBriefDescription('Interpreta y ejecuta código PuréScript')
	.setLongDescription('Interpreta y ejecuta el código PuréScript ingresado')
	.setOptions(options)
	.setExecution(async function (request, args, isSlash, rawArgs) {
		/**@type {String}*/
		const script = getScriptString(isSlash, args, rawArgs);
		if(!script?.length)
			return request.reply({ content: `⚠️️ Este Tubérculo requiere ingresar PuréScript\n${helpString}` });

		/**@type {import("../../systems/purescript").Tubercle}*/
		const tuber = {
			author: request.userId,
			script,
		};
		
		try {
			console.log('Ejecutando PuréScript:',tuber);
			if(isSlash) await request.deferReply();
			await executeTuber(request, tuber, { isSlash });
			console.log('PuréScript ejecutado:', tuber);
		} catch(error) {
			console.log('Ocurrió un error al ejecutar código PuréScript');
			console.error(error);
			const errorContent = { content: '❌ Hay un problema con el código que intentaste ejecutar' };
			return request.deferred
				? request.editReply(errorContent)
				: request.reply(errorContent);
		}
	});

module.exports = command;