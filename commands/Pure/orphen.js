module.exports = {
	name: 'orphen',
	aliases: [
        'nightford', 'cuidado'
    ],
    desc: 'Comando de grito a Orphen Nightford',
    flags: [
        'meme',
        'outdated'
    ],
	
	async execute({ channel }, _){
		await channel.send({ content: '***ORPHEN CUIDADO***' });
		await channel.send({ content: '***CUIDADO ORPHEEEEEN***' });
    },
	
	async interact(interaction, _) {
		await interaction.reply({ content: '***ORPHEN CUIDADO***' });
		await interaction.followUp({ content: '***CUIDADO ORPHEEEEEN***' });
    }
};