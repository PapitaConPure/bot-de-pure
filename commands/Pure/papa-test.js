/* eslint-disable no-unused-vars */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, GuildMember } = require('discord.js'); //Integrar discord.js
const { fetchMember, isBoosting, fetchChannel, fetchRole } = require('../../func.js');
const { formatPixivPostsMessage } = require('../../systems/agents/purepix.js');
const { CommandTags, CommandManager, CommandOptions } = require('../Commons/commands');
//const global = require('../../localdata/config.json'); //Variables globales
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
        //func.dibujarBienvenida(message.member);
        //func.dibujarDespedida(message.member);
        //func.dibujarMillion(message);
        
        //dibujarDespedida(message.member);

        args.ensureRequistified();

        await request.deferReply({});

        const texto   = args.getString('texto');
        const número  = args.getNumber('número');
        const usuario = args.getUser('usuario');
        const miembro = args.getMember('miembro');
        const canal   = args.getChannel('canal');
        const mensaje = await args.getMessage('mensaje');
        const rol     = args.getRole('rol');

        console.log({
            texto,
            número,
            usuario,
            miembro,
            canal,
            mensaje,
            rol,
        });

        return request.editReply({
            content: [
                `**Texto** ${texto}`,
                `**Número** ${número}`,
                `**Usuario** ${usuario}`,
                `**Miembro** ${miembro}`,
                `**Canal** ${canal}`,
                `**Mensaje** ${mensaje}`,
                `**Rol** ${rol}`,
            ].join('\n'),
        });
    });

module.exports = command;
