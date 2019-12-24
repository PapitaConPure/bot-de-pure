//TRABAJAR CON DISCORD.JS Y HACER USO DE SISTEMAS DE ARCHIVOS
const fs = require('fs'); //Integrar operaciones sistema de archivos de consola
const Discord = require('discord.js'); //Integrar discord.js
const { Client, RichEmbed } = require('discord.js'); //Ni idea, la verdad, pero aquí está
const { //Constantes globales
    p_drmk, //prefijo drawmaku
    p_pure, //prefijo puré
    token, //"llave" del bot
} = require('./config.json');
var global = require('./config.json'); //Variables globales
var func = require('./func.js'); //Funciones globales
const client = new Discord.Client(); //Cliente de bot
//Establecer comandos
client.ComandosDrawmaku = new Discord.Collection(); //Comandos de Drawmaku
var commandFiles = fs.readdirSync('./commands/Drawmaku').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
for(const file of commandFiles) {
	const command = require(`./commands/Drawmaku/${file}`);
	client.ComandosDrawmaku.set(command.name, command);
}

client.ComandosPure = new Discord.Collection(); //Comandos de Pure
commandFiles = fs.readdirSync('./commands/Pure').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
for(const file of commandFiles) {
    command = require(`./commands/Pure/${file}`);
	client.ComandosPure.set(command.name, command);
}

client.once('ready', () => {
	console.log('Bot conectado y funcionando.');
    client.user.setActivity("UwU 24/7", "WATCHING");
});

client.on('message', async message => { //En caso de recibir un mensaje
    if(global.cansay === 0) { if(message.author.bot) return; } 
    console.log(`${message.author.username}:  "${message.content}"`);
    var pdetect;
    if(message.content.startsWith(p_drmk)) pdetect = p_drmk;
    else if(message.content.startsWith(p_pure)) pdetect = p_pure;
    else return; //Salir si no se encuentra el comando

    const args = message.content.slice(p_drmk.length).split(/ +/); //Argumentos ingresados
    const nombrecomando = args.shift().toLowerCase(); //Comando ingresado

    var comando;
    if(pdetect === p_drmk)
        comando = client.ComandosDrawmaku.get(nombrecomando) || client.ComandosDrawmaku.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
	else if(pdetect === p_pure)
        comando = client.ComandosPure.get(nombrecomando) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
    
    if (!comando) {
        message.channel.send(':x: Disculpá, soy estúpido. Tal vez escribiste mal el comando y no te entiendo.');
        return;
    }

    try {
        comando.execute(message, args);
    } catch(error) {
        console.log('Ha ocurrido un error al ingresar un comando.');
        console.error(error);
        message.channel.send(
            ':radioactive: :regional_indicator_w: :regional_indicator_a: :regional_indicator_r: :regional_indicator_n: :regional_indicator_i: :regional_indicator_n: :regional_indicator_g: :radioactive: \n' +
            'Ha ocurrido un error inesperado, porfavor reportar a Papita inmediatamente.\n' +
            ':radioactive: :regional_indicator_w: :regional_indicator_a: :regional_indicator_r: :regional_indicator_n: :regional_indicator_i: :regional_indicator_n: :regional_indicator_g: :radioactive:'
        );
    }

    //Empezar cuenta regresiva luego de mod-empezar
    if(global.trest > 0 && !global.empezando) {
        console.log('Ejecutando cuenta regresiva...');
        global.empezando = true;
        setTimeout(func.restarSegundoEmpezar, 1000);
    }

    if(global.cansay > 0) global.cansay--;
});

client.login(token);