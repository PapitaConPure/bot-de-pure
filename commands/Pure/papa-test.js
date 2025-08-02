/* eslint-disable no-unused-vars */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, GuildMember, MessageFlags, TextDisplayBuilder } = require('discord.js'); //Integrar discord.js
const { fetchMember, isBoosting, fetchChannel, fetchRole } = require('../../func.js');
const { formatPixivPostsMessage } = require('../../systems/agents/purepix.js');
const { CommandTags, CommandManager, CommandOptions } = require('../Commons/commands');
const { searchCommand, getWikiPageComponentsV2 } = require('../../wiki.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { serverid, tenshiColor, peopleid } = require('../../localdata/config.json'); //Variables globales
// const { dibujarDespedida } = require('../../func.js');
//const Canvas = require('canvas');

const options = new CommandOptions()
    .addParam('texto', 'TEXT', 'Parámetro de Texto', { optional: true })
    .addParam('número', 'NUMBER', 'Parámetro de Número', { optional: true })
    .addParam('usuario', 'USER', 'Parámetro de Usuario', { optional: true })
    .addParam('miembro', 'MEMBER', 'Parámetro de Miembro', { optional: true })
    .addParam('canal', 'CHANNEL', 'Parámetro de Canal', { optional: true })
    .addParam('mensaje', 'MESSAGE', 'Parámetro de Mensaje', { optional: true })
    .addParam('rol', 'ROLE', 'Parámetro de Rol', { optional: true });
const tags = new CommandTags().add('PAPA');
const command = new CommandManager('papa-test', tags)
    .setLongDescription('Comando de pruebas 😳👉👈')
    .setOptions(options)
    .setExecution(async (request, args) => {
        const search = args.getString('texto');
        const guildPrefix = p_pure(request.guildId).raw;
        const helpCommand = `${guildPrefix}${command.name}`;

        if(!search)
            return request.reply({ content: 'wah' });

		const foundCommand = searchCommand(request, search);

		if(!foundCommand) {
            const embed = new EmbedBuilder()
                .setColor(0xe44545)
                .setTitle('Sin resultados')
                .addFields({
                    name: 'No se ha encontrado ningún comando que puedas llamar con este nombre',
                    value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}ayuda <comando>\` para ver un comando en específico`,
                });
    
            return request.reply({
                embeds: [embed],
            });
		}

        const components = getWikiPageComponentsV2(foundCommand, request);

        return request.reply({
            flags: MessageFlags.IsComponentsV2,
            components
        });
    });

module.exports = command;
