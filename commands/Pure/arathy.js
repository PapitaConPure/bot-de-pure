//const Discord = require('discord.js'); //Integrar discord.js
//const global = require('../../localdata/config.json'); //Variables globales
const { fetchFlag } = require("../../func");
const { CommandOptionsManager } = require("../Commons/cmdOpts");

const options = new CommandOptionsManager()
    .addFlag('s', 'sueño', 'para explorar el diario de los sueños');

module.exports = {
    name: 'arathy',
    aliases: [
        'arati', 'arathy\'s', 'arath'
    ],
    desc: 'Comando de mierda de Arathy',
    flags: [
          'meme'
    ],
    options,
    
    async execute({ channel }, args) {
        const dream = fetchFlag(args, { short: [ 's' ], long: [ 'sueño' ], callback: true, fallback: false });

        if(dream) {
            channel.send({ content: 'Refiérase a `p!bern` para más información.' });
        } else
            channel.send({
                content:
                    'Y siguiendo a lo del anterior caso, sí, sería moralmente bueno si a todos les gusta comer caca porque entonces nadie piensa que comer caca es malo, pero la caca llega a transmitir enfermedades, al igual que varias cosas que pueden ser transmitidas por malas influencias, tales como el gusto de, no sé, dañarse a sí mismo, maltratar animales, si a uno le gusta matar gatos, ¿vas a decir que está bien porque es lo que le gusta?\n' +
                    'No, no, no quiero empezar a hacer juicios éticos, y es más, dije que la caca de manera científica le hace daño a tu cuerpo, por lo que es malo a pesar de que pienses que es bueno.\n' +
                    'Es por eso que no es moral comer caca.\n' +
                    'Creo que comer caca se queda corto como un ejemplo, ya que lo puedes reemplazar con toda acción que vemos como mala, ejemplos: Maltrato animal, piromanía, cleptomanía, dolor, y un gran etcétera, si no hay gustos superiores o inferiores, ¿entonces todo gusto sería clasificado como un igual a pesar de que pueda ser dañino para nosotros y los demás?\n'
            });
    },
};