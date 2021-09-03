const xuwu = [
	'<:mayuwu:654489124413374474>',
	'<:Staruwu:825224815865626645>',
	'<:payasowo:828755669049278476>',
	'<:monowo:757624423300726865>',
	'<:mayuwu:654489124413374474>',
	'<:mayunu:749727348030570728>',
	'<:kyokuwu:810999921343594516>',
	'<:keikuwu:725572179101614161>',
	'<:kageuwu:742506313258369056>',
	'<:dormidowo:822701183340773417>',
	'<:comodowo:824759668437811224>',
	'<a:holareko:827304944620142593>',
	'<a:sumiadios:827294808837062766>'
];

module.exports = {
	name: 'imagine',
	aliases: [
        'tryhard', 'tryhardeo'
    ],
    desc: 'Comando de x-uwus de Imagine Breaker',
    flags: [
        'meme'
    ],
	
	async execute({ channel }, _) {
		channel.send({ content: xuwu[Math.floor(Math.random() * xuwu.length)] });
    },
	
	async interact(interaction) {
		interaction.reply({ content: xuwu[Math.floor(Math.random() * xuwu.length)] });
    }
};