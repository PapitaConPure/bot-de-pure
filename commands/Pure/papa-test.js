const { MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, GuildMember } = require('discord.js'); //Integrar discord.js
const { fetchMember } = require('../../func.js');
const { formatPixivPostsMessage } = require('../../systems/purepix.js');
const { CommandMetaFlagsManager, CommandManager, CommandOptionsManager } = require('../Commons/commands');
//const global = require('../../localdata/config.json'); //Variables globales
// const { dibujarDespedida } = require('../../func.js');
//const uwu = require('./uwu.js');
//const Canvas = require('canvas'); 

const options = new CommandOptionsManager()
    .addParam('miembro', 'MEMBER', 'para especificar el miembro a comprobar', { optional: true });

const flags = new CommandMetaFlagsManager().add('PAPA');
const command = new CommandManager('papa-test', flags)
    .setLongDescription('Comando de pruebas 😳👉👈')
    .setExecution(async (request, args, isSlash = false, rawArgs) => {
        //uwu.execute(message, args);
        //func.dibujarBienvenida(message.member);
        //func.dibujarDespedida(message.member);
        //func.dibujarMillion(message);
        
        //dibujarDespedida(message.member);


        // console.log({
        //     request: request,
        //     args: args,
        //     isSlash: isSlash,
        //     rawArgs: rawArgs,
        // });
        // return request.reply({ content: `**request** ${request}\n**args** ${args}\n**isSlash** ${isSlash}\n**rawArgs** ${rawArgs}`})

        /**@type {GuildMember}*/
        const member = options.in(request).fetchParam(args, 'miembro');
        request.reply({ content: `**¿Se encuentra rol de booster?** ${member.roles.cache.find(role => role.tags.premiumSubscriberRole) ? 'SI' : 'NO'}` });
    });

module.exports = command;