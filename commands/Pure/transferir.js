import { auditError } from '../../systems/others/auditor';

const { improveNumber, compressId, sleep } = require('../../func');
const { CommandTags, CommandManager, CommandOptions, CommandOptionSolver } = require('../Commons/commands');
const UserConfigs = require('../../localdata/models/userconfigs.js');
const { EmbedBuilder } = require("discord.js");
const { Translator } = require("../../internationalization");
const globalConfigs = require('../../localdata/config.json');

const transferLocks = new Set();

const options = new CommandOptions()
    .addParam('monto', 'NUMBER', 'para especificar el monto a pagar en PRC')
    .addParam('usuario', 'MEMBER', 'para especificar el usuario al cual transferir PRC');
const flags = new CommandTags().add('COMMON');
const command = new CommandManager('transferir', flags)
    .setAliases('transfer', 'tf')
    .setDescription('Permite transferir PRC a otro usuario')
    .setOptions(options)
    .setExperimentalExecution(async (request, args) => {
        const translator = await Translator.from(request.userId);

        if(args.isMessageSolver())
            swapIfNeeded(/**@type {CommandOptionSolver<string[]>}*/(args).args);

        const amount = args.getNumber('monto');
        const target = args.getUser('usuario');

        if(!amount || isNaN(amount))
            return request.reply({ content: translator.getText('transferAmountExpected'), ephemeral: true });

        if(!target)
            return request.reply({ content: translator.getText('transferTargetExpected'), ephemeral: true });

        if(target.bot)
            return request.reply({ content: translator.getText('transferHumanExpected'), ephemeral: true });

        if(request.userId === target.id)
            return request.reply({ content: translator.getText('transferOtherExpected'), ephemeral: true });

        if(amount < 1)
            return request.reply({ content: translator.getText('transferAmountTooLow'), ephemeral: true });

        await request.deferReply();
        
        const { userId } = request;
        const { id: targetId } = target;

        while(transferLocks.has(userId) || transferLocks.has(targetId))
            await sleep(50);

        try {
            transferLocks.add(userId);
            transferLocks.add(targetId);
    
            const userQuery   = { userId: userId };
            const targetQuery = { userId: targetId };
            const [ userConfigs, targetConfigs ] = await Promise.all([
                (async() => (await UserConfigs.findOne(userQuery)) || new UserConfigs(userQuery))(),
                (async() => (await UserConfigs.findOne(targetQuery)) || new UserConfigs(targetQuery))(),
            ]);
    
            if(amount > userConfigs.prc)
                return request.reply({ content: translator.getText('transferInsufficient') });
    
            userConfigs.prc -= amount;
            targetConfigs.prc += amount;
            const transactionCode = makeTransactionCode(request);
    
            const embed = new EmbedBuilder()
                .setColor(globalConfigs.tenshiColor)
                .setAuthor({ name: translator.getText('transferAuthorName'), iconURL: request.guild.iconURL({ size: 256 }) })
                .setTitle(translator.getText('transferTitle'))
                .addFields(
                    {
                        name: translator.getText('transferFromName'),
                        value: `${request.user.tag}\nID \`${request.userId}\``,
                        inline: true,
                    },
                    {
                        name: translator.getText('transferForName'),
                        value: `${target.tag}\nID \`${target.id}\``,
                        inline: true,
                    },
                    {
                        name: translator.getText('transferAmountName'),
                        value: `<:prc:1097208828946301123>  ${improveNumber(amount, true)}`,
                        inline: true,
                    },
                    {
                        name: translator.getText('transferCodeName'),
                        value: `\`\`\`\n${transactionCode}\n\`\`\``,
                    },
                );
    
            await Promise.all([
                targetConfigs.save(),
                userConfigs.save(),
            ]);

            const receipt = { embeds: [embed] };
            return Promise.all([
                request.reply(receipt),
                request.user.send(receipt),
                target.send(receipt),
                globalConfigs.logch?.send(receipt),
            ]);
        } catch(error) {
            console.error(error);
            auditError(error, {
                request,
                brief: 'Ocurrió un error durante una transacción',
                details: `${request.isInteraction ? '/' : 'p!'}${command.name} ${amount} ${userId}`,
                ping: true,
            });
            return request.reply({ content: translator.getText('transferError'), ephemeral: true });
        } finally {
            transferLocks.delete(userId);
            transferLocks.delete(targetId);
        }
    });

/**@param {Array<string>} args*/
function swapIfNeeded(args) {
    if(!Array.isArray(args)) return;

    const amount = +args[0];

    if(!isNaN(amount)) return;
    
    const t = args[0];
    args[0] = args[1];
    args[1] = t;
}

/**@param {import('../Commons/typings').ComplexCommandRequest} request*/
function makeTransactionCode(request) {
    const requestId = request.id;
    const channelId = request.channel.id;

    const compRequestId = compressId(requestId);
    const compChannelId = compressId(channelId);

    const requestIdMidpoint = Math.floor(requestId.length / 2);
    const channelIdMidpoint = Math.floor(channelId.length / 2);
    const halfRequestId = requestId.slice(0, requestIdMidpoint);
    const halfChannelId = channelId.slice(channelIdMidpoint);

    const piHashedIds = Math.floor(+`${halfRequestId}${halfChannelId}` / Math.PI);
    const compMergedIds = compressId(`${piHashedIds}`);

    return `[${compRequestId}]${compChannelId}{${compMergedIds}}`;
}

module.exports = command;
