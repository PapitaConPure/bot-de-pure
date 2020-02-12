const Discord = require('discord.js'); //Integrar discord.js
const Canvas = require('canvas');
let global = require('../../config.json'); //Variables globales

async function dibujarBienvenida(msg) {
    const canvas = Canvas.createCanvas(1200, 750);
    const ctx = canvas.getContext('2d');

    //#region Fondo
    const fondo = await Canvas.loadImage('./fondo.png');
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
    //#endregion

    //#region Nombre del usuario
    ctx.shadowOffsetX = shadowOffsetY = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'black';
    ctx.fillStyle = '#ffffff';
    { //Nombre del usuario
        const Texto = msg.member.displayName;
        let fontSize = 72;
        while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
        ctx.font = `${fontSize}px Arial Black`;
        ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 125 - fontSize / 2);
    }
    { //Texto inferior
        ctx.font = `32px sans-serif`;
        ctx.fillText('¡Bienvenido a', (canvas.width / 2) - (ctx.measureText('¡Bienvenido a').width / 2), 125 - 32 / 2);
        const Texto = `${msg.channel.guild.name}!`;
        let fontSize = 120;
        while(ctx.measureText(Texto).width > (canvas.width - 150)) fontSize -= 2;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 125 - fontSize / 2);
    }
    //#endregion

    //#region Dibujar sombra de foto de perfil
    ctx.shadowOffsetX = shadowOffsetY = 8;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#36393f';
    ctx.arc(canvas.width / 2, 300, 150, 0, Math.PI * 2, true);
    ctx.fill();
    //#endregion

    //Dibujar foto de perfil
	ctx.beginPath();
	ctx.arc(canvas.width / 2, 300, 150, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();
    const avatar = await Canvas.loadImage(msg.member.user.displayAvatarURL/*member.user.displayAvatarURL*/);
	ctx.drawImage(avatar, canvas.width / 2 - 150, 150, 300, 300);

    const imagen = new Discord.Attachment(canvas.toBuffer(), 'bienvenida.png');
    msg.channel.send('Llegó un weón.', imagen);
    if(msg.channel.guild.id === '654471968200065034')
        msg.channel.send(
            'Wena po conchetumare, recuerda revisar el canal <#671817759268536320> o te funamos <:HaniwaSmile:659872119995498507>\n' +
            'También si quieres un rol de color revisa <#671831878902349824> y pídele el que te guste a alguno de los enfermos que trabajan aquí <:Mayuwu:654489124413374474>\n' +
            'WENO YA PO CONCHESUMARE. <@&TODAVÍA NO654472238510112799>, vengan a saludar maricones <:marx:675439504982671370>'
        );
}

module.exports = {
	name: 'prueba',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            dibujarBienvenida(message);
        } else message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
    },
};