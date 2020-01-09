//TRABAJAR CON DISCORD.JS Y HACER USO DE SISTEMAS DE ARCHIVOS
const fs = require('fs'); //Integrar operaciones sistema de archivos de consola
const Discord = require('discord.js'); //Integrar discord.js
const Parse = require('parse/node');
const { Client, RichEmbed } = require('discord.js'); //Ni idea, la verdad, pero aquí está
const { //Constantes globales
    p_drmk, //prefijo drawmaku
    p_pure, //prefijo puré
} = require('./config.json');
const token = 'NjUxMjUwNjY5MzkwNTI4NTYx.XeXWSg.SFwfEZuCVNIVz8BS-AqFsntG6KY'; //La llave del bot
var global = require('./config.json'); //Variables globales
var func = require('./func.js'); //Funciones globales
const client = new Discord.Client(); //Cliente de bot
const Sequelize = require('sequelize');
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

//Información de conexión
const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost', //https://github.com/PapitaConPure/bot-de-pure.git o https://bot-de-pure.herokuapp.com/
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const Global = sequelize.define('Global', {
    name: Sequelize.STRING,
	description: Sequelize.TEXT,
	/*username: Sequelize.STRING,
	usage_count: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},*/
});

client.once('ready', () => {
    Global.sync();
    /*async function conchetumare() {
        const tag = await Global.findAll({attributes: ['name']});
        const tagString = tag.map(t => t.name).join(', ') || 'No tags set.';
        console.log(`List of tags: ${tagString}`);
    }
    conchetumare();*/
});

client.on('ready', () => {
	console.log('Bot conectado y funcionando.');
    client.user.setActivity("UwU 24/7", { type: 'STREAMING', url: 'https://www.youtube.com/watch?v=h_3ULXom6so' });
    //func.saveState();//func.reloadState();
});

client.on('message', message => { //En caso de recibir un mensaje
    if(global.cansay === 0) { if(message.author.bot) return; } 
    console.log(`[${message.guild.name}→#${message.channel.name}] ${message.author.username}: "${message.content}"`);

    if(message.content.toLowerCase().startsWith(`${p_pure}papa-reiniciar`)) {
        if (message.author.id === '423129757954211880') {
            message.channel.send(':arrows_counterclockwise: apagando...\n_Nota: puedes comprobar si el bot se reinició viendo el log del proceso._')
            .then(sent => {
                console.log('Apagando.');
                process.exit();
            }).catch(error => {
                console.error(error);
            });
        } else message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
        return;
    }
    
    let pdetect;
    if(message.content.toLowerCase().startsWith(p_drmk)) pdetect = p_drmk;
    else if(message.content.toLowerCase().startsWith(p_pure)) pdetect = p_pure;
    else return; //Salir si no se encuentra el comando

    const args = message.content.slice(p_drmk.length).split(/ +/); //Argumentos ingresados
    const nombrecomando = args.shift().toLowerCase(); //Comando ingresado

    let comando;
    if(pdetect === p_drmk)
        comando = client.ComandosDrawmaku.get(nombrecomando) || client.ComandosDrawmaku.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
	else if(pdetect === p_pure)
        comando = client.ComandosPure.get(nombrecomando) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
    
    if (!comando) {
        message.channel.send(':x: Disculpa, soy estúpido. Tal vez escribiste mal el comando y no te entiendo.');
        return;
    }

    async function asd() {
        try {
            const tag = await Tags.create({
                name: args[0],
                description: args[1]
            });
            console.log(`The new tag is ${tag.name} and its description is ${tag.description}`);
        } catch (error) {
            if(error.name === 'SequelizeUniqueConstraintError') {
                console.log('That tag already exists.');
            }
            console.error(error);
            console.log('Something went wrong with adding a tag.');
        }
    }
    asd();

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