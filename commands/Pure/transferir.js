const { improveNumber, swap, fetchUser, compressId } = require("../../func");
const { CommandTags, CommandManager, CommandOptions } = require('../Commons/commands');
const UserConfigs = require('../../localdata/models/userconfigs.js');
const { tenshiColor } = require('../../localdata/config.json');
const { EmbedBuilder, User } = require("discord.js");
const { Translator } = require("../../internationalization");
const globalConfigs = require('../../localdata/config.json');

function swapIfNeeded(args) {
    let amount = +args[0];

    if(!isNaN(amount))
        return;
    
    const [a, b] = swap(args[0], args[1]);
    args[0] = a;
    args[1] = b;
}

const options = new CommandOptions()
    .addParam('monto', 'NUMBER', 'para especificar el monto a pagar en PRC')
    .addParam('usuario', 'MEMBER', 'para especificar el usuario al cual transferir PRC');
const flags = new CommandTags().add('COMMON');
const command = new CommandManager('transferir', flags)
    .setAliases('transfer', 'tf')
    .setDescription('Permite transferir PRC a otro usuario')
    .setOptions(options)
    .setExecution(async (request, args, isSlash) => {
        const translator = await Translator.from(request.userId);

        if(!isSlash) {
            if(args.length < 2)
                return request.reply({ content: translator.getText('transferInputExpected') });
            swapIfNeeded(args);
        }

        /**@type {Number}*/
        let amount = isSlash ? args.getNumber('monto') : +args[0];
        /**@type {User}*/
        let target = isSlash ? args.getUser('usuario') : fetchUser(args[1], request);

        if(!isSlash && (isNaN(amount) || !target))
            return request.reply({ content: translator.getText('transferInputExpected') });

        if(target.bot)
            return request.reply({ content: translator.getText('transferHumanExpected') });

        if(request.userId === target.id)
            return request.reply({ content: translator.getText('transferOtherExpected') });

        if(amount <= 0)
            return request.reply({ content: translator.getText('invalidInput') });

        const userQuery = { userId: request.userId };
        const targetQuery = { userId: target.id };
        const [ userConfigs, targetConfigs ] = await Promise.all([
            (async() => (await UserConfigs.findOne(userQuery)) || new UserConfigs(userQuery))(),
            (async() => (await UserConfigs.findOne(targetQuery)) || new UserConfigs(targetQuery))(),
        ]);

        if(amount > userConfigs.prc)
            return request.reply({ content: translator.getText('transferInsufficient') });

        userConfigs.prc -= amount;
        targetConfigs.prc += amount;

        const requestId = request.id;
        const channelId = request.channel.id;
        const compRequestId = compressId(requestId);
        const compChannelId = compressId(channelId);
        const halfRequestId = requestId.slice(0, Math.floor(requestId.length / 2));
        const halfChannelId = channelId.slice(Math.floor(channelId.length / 2));
        const piHashedIds = Math.floor(+`${halfRequestId}${halfChannelId}` / Math.PI);
        const compMergedIds = compressId(`${piHashedIds}`);

        const embed = new EmbedBuilder()
            .setColor(tenshiColor)
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
                    value: `\`\`\`\n[${compRequestId}]${compChannelId}{${compMergedIds}}\n\`\`\``,
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
    });

module.exports = command;