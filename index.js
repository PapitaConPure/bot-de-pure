//TRABAJAR CON DISCORD.JS Y HACER USO DE SISTEMAS DE ARCHIVOS
const fs = require('fs'); //Integrar operaciones sistema de archivos de consola
const Discord = require('discord.js'); //Integrar discord.js
const { //Constantes globales
    p_drmk, //prefijo drawmaku
    token, //"llave" del bot
} = require('./config.json');
var global = require('./config.json'); //Variables globales
var func = require('./func.js'); //Funciones globales
const client = new Discord.Client(); //Cliente de bot
client.commands = new Discord.Collection(); //Comandos de bot
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
//Establecer comandos
for(const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log('Bot conectado y funcionando.');
});

client.on('message', message => { //En caso de recibir un mensaje
    if(!global.cansay) if(message.author.bot) return;
    console.log(`${message.author.username}:  "${message.content}"`);
    if(!message.content.startsWith(p_drmk)) return; //Salir si no tiene el prefijo establecido o es un mensaje de un bot

    const args = message.content.slice(p_drmk.length).split(/ +/); //Argumentos ingresados
    const nombrecomando = args.shift().toLowerCase(); //Comando ingresado

    const comando = client.commands.get(nombrecomando) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando)); //Salir si no se encuentra el comando
	if (!comando) {
        message.channel.send(':x: Disculpá, soy estúpido. Tal vez escribiste mal el comando y no te entiendo.');
        return;
    }

    try {
        comando.execute(message, args);
    } catch (error) {
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

    if(global.cansay) global.cansay = false;
});

client.login(token);