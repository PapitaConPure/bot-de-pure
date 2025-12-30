const { improveNumber, compressId, sleep } = require('../../func');
const { CommandTags, CommandManager, CommandOptions } = require('../Commons/commands');
const UserConfigs = require('../../localdata/models/userconfigs.js');
const { EmbedBuilder } = require("discord.js");
const { Translator } = require("../../internationalization");
const globalConfigs = require('../../localdata/config.json');
const { auditError } = require('../../systems/others/auditor');

const transferLocks = new Set();

const options = new CommandOptions()
    .addParam('monto', 'NUMBER', 'para especificar el monto a pagar en PRC')
    .addParam('usuario', 'USER', 'para especificar el usuario al cual transferir PRC');

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('transferir', flags)
    .setAliases('transfer', 'tf')
    .setDescription('Permite transferir PRC a otro usuario')
    .setOptions(options)
    .setExecution(async (request, args) => {
        const [ translator ] = await Promise.all([
            Translator.from(request.userId),
            request.deferReply({ ephemeral: true }),
        ]);

        if(args.isMessageSolver(args.args))
            swapIfNeeded(args.args);

        const amount = args.getNumber('monto');
        const target = await args.getUser('usuario');

        if(!amount || isNaN(amount))
            return request.editReply({ content: translator.getText('transferAmountExpected') });

        if(!target)
            return request.editReply({ content: translator.getText('transferTargetExpected') });

        if(target.bot)
            return request.editReply({ content: translator.getText('transferHumanExpected') });

        if(request.userId === target.id)
            return request.editReply({ content: translator.getText('transferOtherExpected') });

        if(amount < 1)
            return request.editReply({ content: translator.getText('transferAmountTooLow') });
        
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
                return request.editReply({ content: translator.getText('transferInsufficient') });
    
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
                        value: `<:prc:1097208828946301123>  ${improveNumber(amount, { shorten: true })}`,
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
                request.editReply(receipt).catch(_ => _),
                request.user.send(receipt).catch(_ => _),
                target.send(receipt).catch(_ => _),
                globalConfigs.logch?.send(receipt).catch(console.error),
            ]);
        } catch(error) {
            console.error(error);
            auditError(error, {
                request,
                brief: 'Ocurrió un error durante una transacción',
                details: `${request.isInteraction ? '/' : 'p!'}${command.name} ${amount} ${userId}`,
                ping: true,
            });
            return request.editReply({ content: translator.getText('transferError') });
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
