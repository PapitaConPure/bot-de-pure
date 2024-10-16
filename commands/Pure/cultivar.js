const { randRange, improveNumber } = require("../../func");
const { CommandTags, CommandManager } = require('../Commons/commands');
const UserConfigs = require('../../localdata/models/userconfigs.js');
const { tenshiColor } = require('../../localdata/config.json');
const { EmbedBuilder } = require("discord.js");
const { Translator } = require("../../internationalization");

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('cultivar', flags)
    .setAliases('cultivate', 'cv', 'c')
    .setBriefDescription('Permite cultivar entre 37 y 43 PRC diario')
    .setDescription(
        'Permite cultivar <:prc:1097208828946301123> 37~43',
        'Solo se puede hacer una vez por día',
    )
    .setExperimentalExecution(async request => {
        const userQuery = { userId: request.userId };
        const userConfigs = (await UserConfigs.findOne(userQuery)) || new UserConfigs(userQuery);
        const translator = await Translator.from(request.userId);

        const now = Date.now();
        const diffMs = now - userConfigs.lastCultivate;
        const dayMs = 24 * 3600e3

        if(diffMs < dayMs)
            return request.reply({ content: translator.getText('cultivarUnauthorized', Math.round((now + dayMs - diffMs) / 1000)) });

        userConfigs.lastCultivate = now;

        const reward = 40 + randRange(-3, 3, false);
        userConfigs.prc += reward;

        const embed = new EmbedBuilder()
            .setColor(tenshiColor)
            .setAuthor({ name: request.member.displayName, iconURL: request.member.displayAvatarURL({ size: 256 }) })
            .setTitle(translator.getText('cultivarTitle'))
            .setDescription(translator.getText('cultivarDescription', improveNumber(userConfigs.prc, true)));

        await userConfigs.save();
        return request.reply({ embeds: [embed] });
    });

module.exports = command;