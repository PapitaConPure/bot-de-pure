const Discord = require('discord.js'); //Integrar discord.js
var global = require('../config.json'); //Variables globales

module.exports = {
	name: 'papa-variables',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            var str = '```js\n';
            str += '//Variables de sistema\n';
            str += 'tiempo = ' + ((typeof global.tiempo !== 'undefined')?`${global.tiempo}`:'indefinido') + ';\n';
            str += 'edi = ' + ((typeof global.edi !== 'undefined')?`${global.edi}`:'indefinido') + ';\n';
            str += 'tem = \'' + ((typeof global.tem !== 'undefined')?`${global.tem}`:'indefinido') + '\';\n';
            str += 'desc = \'' + ((typeof global.desc !== 'undefined')?`${global.desc}`:'indefinido') + '\';\n';
            str += 'desctem = \'' + ((typeof global.desctem !== 'undefined')?`${global.desctem}`:'indefinido') + '\';\n';
            str += 'empezando = ' + ((typeof global.empezando !== 'undefined')?`${global.empezando}`:'indefinido') + ';\n';
            str += 'empezado = ' + ((typeof global.empezado !== 'undefined')?`${global.empezado}`:'indefinido') + ';\n';
            str += 'terminando = ' + ((typeof global.terminando !== 'undefined')?`${global.terminando}`:'indefinido') + ';\n';
            str += 'chi = \'' + ((typeof global.chi !== 'undefined')?`${global.chi}`:'indefinido') + '\';\n';
            str += 'modroles = [' + ((typeof global.modroles !== 'undefined')?`${global.modroles}`:'indefinido') + '];\n\n';
            str += '//Variables de partida\n';
            str += 'cntjugadores = ' + ((typeof global.cntjugadores !== 'undefined')?`${global.cntjugadores}`:'indefinido') + ';\n';
            str += 'jugadores = [' + ((typeof global.jugadores !== 'undefined')?`${global.jugadores}`:'indefinido') + '];\n';
            str += 'nombres = [\'' + ((typeof global.nombres !== 'undefined')?`${global.nombres}`:'indefinido') + '\'];\n';
            str += 'numeros = [' + ((typeof global.numeros !== 'undefined')?`${global.numeros}`:'indefinido') + '];\n';
            str += 'puntos = [' + ((typeof global.puntos !== 'undefined')?`${global.puntos}`:'indefinido') + '];\n';
            str += 'danmaku = \'' + ((typeof global.danmaku !== 'undefined')?`${global.danmaku}`:'indefinido') + '\';\n';
            str += 'ndibujante = ' + ((typeof global.ndibujante !== 'undefined')?`${global.ndibujante}`:'indefinido') + ';\n';
            str += 'seleccionado = ' + ((typeof global.seleccionado !== 'undefined')?`${global.seleccionado}`:'indefinido') + ';\n';
            str += 'dibujado = ' + ((typeof global.dibujado !== 'undefined')?`${global.dibujado}`:'indefinido') + ';\n';
            str += 'recompensado = ' + ((typeof global.recompensado !== 'undefined')?`${global.recompensado}`:'indefinido') + ';\n\n';
            str += '//Temporizadores\n';
            str += 'trest = ' + ((typeof global.trest !== 'undefined')?`${global.trest}`:'indefinido') + ';\n';
            str += 'tjuego = ' + ((typeof global.tjuego !== 'undefined')?`${global.tjuego}`:'indefinido') + ';\n';
            str += '```';
            message.channel.send(str);
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Pure puede usar este comando.');
            return;
        }
    },
};