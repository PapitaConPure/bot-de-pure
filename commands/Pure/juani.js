module.exports = {
	name: 'juani',
	aliases: [
        'wholesome', 'wani'
    ],
    desc: 'Comando bonito y hermoso de JuaniUru',
    flags: [
        'meme',
        'outdated'
    ],
	
	async execute({ channel }, _){
		channel.send({ content: '**Gwacyas~♪** <:uwu:681935702308552730>' });
    },
};