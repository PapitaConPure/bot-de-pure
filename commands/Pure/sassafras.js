const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'sassafras',
	aliases: [
        'sassa', 'drossafras', 'dross'
    ],
    desc: '',
    flags: [
        'meme'
    ],
	
	execute(message, args) {
		let forcesassamodo = false;
		if(args.length)
			if(args[0] === 'forzar-sassamodo')
				forcesassamodo = true;
		if(message.channel.id === '611756424787394610' || message.guild.id === '651244470691561473' || forcesassamodo)
			message.channel.send(
				'***Una cagada asquerosa, repelente, abyecta, vomitiva, mugrosa, maldita, diarreosa, estercolera, inmunda, malnacida, pudenda, apestosa, maloliente, cabrona, ' +
				'maricona, huevona, pendeja, tarada, cancerígena, jodida, culeada, gilipollesca, pelotuda, encamada, malnacida, retardada, atrasada, inútil, móngola, incestuosa, ' +
				'burda, estúpida, insulsa, putrefacta, traicionera, indigna, chupapollas, soplahuevos, esnifacojones, hueleculo, coprofágica, masca-morrones, infecta, cerda, ' +
				'nauseabunda, cochambrosa, cochina, verdulera, infame, ruin, rastrera, degradada, descerebrada, zopenca, zafia, puta, engreída, esquizofrénica, granulenta, infeliz, ' +
				'profana, calamitosa, deficiente, cretina, lela, ramera, fulana, calientaguevos, ridícula, petarda, pasmarote, fistro, desidiosa, puta, reputa, soputa, recontraputa, ' +
				'hija de puta, hija de un millón de putas, escupepitos, caradepedo, necrofílica, alientoamojón, lambe-bukaka, revuelcaleche, coñoesumadre y de su abuela, conchuda, ' +
				'culoroto, nalgas reventadas, tragasable, succionaditos, esfinterpartido, ojetedesilachado, sorbemocos, capulla, pelmaza, zoquete, masturbadora crónica, espuria, ' +
				'chupa-tampones, regluda, coprófaga, gerontofílica, turra, ojete, atorrante, tierrúa, pajúa, amamaguevos, onanista caradeconcha y MALA.***\n' +
				'https://www.youtube.com/watch?v=-FWnpxCRVIo'
			);
		else
			message.channel.send(
				'***Mi libro, Luna de Plutón, ya está disponible en todas las librerías de Argentina, Chile, Uruguay, Paraguay, Bolivia, y Guatemala. Léelo, sé que te va a encantar.***\n' +
				'https://www.youtube.com/watch?v=pdTuXR4TOLY'
			);
    },
};