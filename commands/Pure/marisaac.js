const { randRange } = require("../../func");
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const emot = [
    '\'o\'', '\'O\'', '\'u\'', '\'U\'', '^O^', 'o.o', 'O.O', 'QUQ', '\'.\'', '¬u¬', '¬U¬', 'o\'o', 'o.o\'\'', 'o-o', 'O.o', 'x.x', 'ouo', 'OUO', 'OuO', 'Ouo', '>:C',
    '>:c', 'OwO', 'UwU', '`o´', '`O´', '`U´', '`u´', ':3c', '^O^/', ':oc', 'x\'d', 'x\'D', 'X\'D', ';u;', '°o°', '°O°', '°u°', '°U°', 'OnO', '>U<', '>u<', '>O<', '>o<',
    '\\^O^/', '\\`u´/', '\\´u`/', '\'n\'', '^w^', '^W^', 'ouO', '>:3c', '\'o\'/', '\'u\'/', '\'O\'/', '\'U\'/', '>w<', '>W<', '°w°', '°W°'
];

const flags = new CommandMetaFlagsManager().add('MEME');
const command = new CommandManager('marisaac', flags)
    .setAliases('mari')
    .setDescription('Comando de caritas de Marisaac')
    .setExecution(async request => {
        request.reply({ content: `**${emot[randRange(0, emot.length)]}**` });
    });

module.exports = command;