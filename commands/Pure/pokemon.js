const pasta = 'Ustedes sabían que en términos de reproducción entre hombres humanos y Pokémon hembras, Vaporeon es el Pokémon mas compatible para los Humanos?\n' + 
	'No solo porque están en el Grupo Huevo Campo, que está principalmente conformado por Mamíferos, Vaporeon tiene en promedio una medida de 91.44 Cm. de altura y un peso de 28,98 Kg., esto significa que son suficientemente grandes para soportar penes humanos, y con sus impresionantes Estadísticas Base de PS y acceso a Armadura Ácida, puedes ser duro con ella. Debido a su biología mayoritariamente compuesta de agua, no hay dudas de que una Vaporeon excitada sería increíblemente húmeda, tan húmeda que podrías fácilmente tener sexo con una por horas sin lastimarte o sentir dolor.\n' +
	'Ellas también pueden aprender los movimientos "Atracción", "Ojitos Tiernos", "Seducción", "Encanto" y "Látigo", además de no tener pelaje para esconder pezones, así que sería increíblemente fácil conseguirte una con humor. Con sus habilidades "Absorbe Agua" e "Hidratación", pueden recuperarse fácilmente de la fatiga con suficiente agua.\n' +
	'Ningún otro Pokémon llega a estar cerca de este nivel de compatibilidad. Además, como curiosidad, si te empeñas suficiente al acabar, puedes llegar a hacer a tu Vaporeon Blanca.\n' +
	'Vaporeon está literalmente hecha para el pene humano. Asombrosas Estadísticas de Defensa+Alta cantidad de PS+Armadura Ácida significa que puede recibir verga todo el día, de todas las formas y tamaños, y aún así venir por mas.';

module.exports = {
	name: 'pokemon',
	aliases: [
		'vaporeon'
	],
	desc: 'Comando de compatibilidad Pokemon',
	flags: [
		'meme',
		'chaos',
	],

	async execute({ channel }, _) {
		await channel.send({ content: pasta });
	},

	async interact(interaction, _) {
		await interaction.reply({ content: pasta });
	},
};