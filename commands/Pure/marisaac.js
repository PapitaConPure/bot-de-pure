const { randRange } = require("../../func");

const emot = [
    '\'o\'', '\'O\'', '\'u\'', '\'U\'', '^O^', 'o.o', 'O.O', 'QUQ', '\'.\'', '¬u¬', '¬U¬', 'o\'o', 'o.o\'\'', 'o-o', 'O.o', 'x.x', 'ouo', 'OUO', 'OuO', 'Ouo', '>:C',
    '>:c', 'OwO', 'UwU', '`o´', '`O´', '`U´', '`u´', ':3c', '^O^/', ':oc', 'x\'d', 'x\'D', 'X\'D', ';u;', '°o°', '°O°', '°u°', '°U°', 'OnO', '>U<', '>u<', '>O<', '>o<',
    '\\^O^/', '\\`u´/', '\\´u`/', '\'n\'', '^w^', '^W^', 'ouO', '>:3c', '\'o\'/', '\'u\'/', '\'O\'/', '\'U\'/', '>w<', '>W<', '°w°', '°W°'
];

module.exports = {
    name: 'marisaac',
    aliases: [
        'mari'
    ],
    desc: 'Comando de caritas de Marisaac',
    flags: [
        'meme'
    ],
  
    async execute({ channel }, _) {
        channel.send({ content: `**${emot[randRange(0, emot.length)]}**` });
    },
  
    async interact(interaction, _) {
        interaction.reply({ content: `**${emot[randRange(0, emot.length)]}**` });
    }
};