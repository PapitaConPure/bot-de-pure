const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, GuildMember } = require('discord.js'); //Integrar discord.js
const { fetchMember, isBoosting, fetchChannel, fetchRole } = require('../../func.js');
const { formatPixivPostsMessage } = require('../../systems/purepix.js');
const { CommandTags, CommandManager, CommandOptions } = require('../Commons/commands');
//const global = require('../../localdata/config.json'); //Variables globales
// const { dibujarDespedida } = require('../../func.js');
//const uwu = require('./uwu.js');
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
    .setExperimental(true)
    .setExperimentalExecution(async (request, args) => {
        //uwu.execute(message, args);
        //func.dibujarBienvenida(message.member);
        //func.dibujarDespedida(message.member);
        //func.dibujarMillion(message);
        
        //dibujarDespedida(message.member);

        args.ensureRequistified();

        await request.deferReply({});

        const texto = await args.getString('texto', true);
        const usuario = await args.getUser('usuario', true);
        const miembro = await args.getMember('miembro', true);
        const canal = await args.getChannel('canal', true);
        const mensaje = await args.getMessage('mensaje', true);
        const rol = await args.getRole('rol', true);
        const número = await args.getNumber('número');

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