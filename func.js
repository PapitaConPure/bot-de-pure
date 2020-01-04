const Discord = require('discord.js'); //Integrar discord.js
var global = require('./config.json'); //Variables globales

module.exports = {
    //#region Lista
    getMentionPlayerID: function(stringcmp = ``, start = -1, end = -1) {
        console.log('Intentando encontrar un jugador por mención.');
        var st = (start !== -1)?start:0; //Inicio de recorrido de lista [por defecto: inicio de lista]
        var ed = (end !== -1)?end:global.cntjugadores; //Fin de recorrido de lista [por defecto: fin de lista]
        var idretorno = -1; //ID de jugador en lista a devolver [si no está jugando: -1]
        if(stringcmp.startsWith('<@') && stringcmp.endsWith('>')) {
            stringcmp = stringcmp.slice(2, -1);
            if(stringcmp.startsWith('!')) stringcmp = stringcmp.slice(1);
        }

        //Recorrer lista en busca del jugador mencionado
        for(i = st; i < ed; i++)
            if(stringcmp === `${global.jugadores[i]}`) {
                idretorno = i;
                console.log(`Jugador encontrado; retornando ${idretorno}.`);
                break;
            }

        return idretorno; //Devolver ID del jugador en la lista
    },

    getNumberPlayerID: function(playernumber = -1) {
        console.log('Intentando encontrar un jugador por número de lista.');
        var idretorno = -1; //ID de jugador en lista a devolver [si no está jugando: -1]

        playernumber = parseInt(playernumber);
        if(playernumber >= 1 && playernumber <= global.cntjugadores) {
            idretorno = playernumber - 1;
            console.log(`Jugador encontrado; retornando ${idretorno}.`);
        }

        return idretorno; //Devolver ID del jugador en la lista
    },

    removeFromList: function(idj) {
        console.log('Intentando remover a un jugador de la lista de jugadores.');
        if(global.empezado && global.cntjugadores <= 2) {
            console.log('Juego abortado por falta de jugadores.');
            global.chi.send(':fallen_leaf: Ya no hay suficientes personas en el evento. Abortando...');
            module.exports.reiniciarTodo();
            return;
        }
        if(global.empezado) {
            global.eliminado.jugadores[global.eliminado.cntjugadores] = global.jugadores[idj];
            global.eliminado.nombres[global.eliminado.cntjugadores] = global.nombres[idj];
            global.eliminado.numeros[global.eliminado.cntjugadores] = -global.numeros[idj];
            global.eliminado.puntos[global.eliminado.cntjugadores] = global.puntos[idj];
            global.eliminado.cntjugadores++;
        }
        global.jugadores[global.cntjugadores] = global.jugadores[idj];
        global.nombres[global.cntjugadores] = global.nombres[idj];
        global.puntos[global.cntjugadores] = global.puntos[idj];
        for(var i = idj; i < global.cntjugadores; i++) {
            global.jugadores[i] = global.jugadores[i + 1] ;
            global.nombres[i] = global.nombres[i + 1];
            global.puntos[i] = global.puntos[i + 1];
        }
        if(global.empezado) {
            console.log('Verificando si el dibujante sigue en juego.');
            if(global.ndibujante === idj) {
                if(global.dibujado) global.cntimagenes--;
                setTimeout(module.exports.nextPlayer, 1500);
            }
            if(global.ndibujante === idj || global.ndibujante > idj) global.ndibujante--;
        }
        global.cntjugadores--;
        console.log('Jugador removido.');
    },

    announceNextPlayer: function() {
        console.log(`Nuevo dibujante: ${global.nombres[global.ndibujante]} (${global.jugadores[global.ndibujante]})`);
        //Enviar mensaje notificando próximo jugador y brindando ayuda extra
        global.chi.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
            `:art: *Le toca dibujar a <@${global.jugadores[global.ndibujante]}> (jugador ${global.numeros[global.ndibujante]}).* :art:\n` +
            `_Para enviar el nombre de tu danmaku, ingresa \`${global.p_drmk}draw ||<danmaku>||\`. **No olvides las \\|\\|barras verticales\\|\\|**._\n` +
            `_Para enviar el dibujo de tu danmaku, ingresa \`${global.p_drmk}draw <dibujo de danmaku>\`. **El dibujo se envía adjunto al comando**._\n` +
            `_Para consultar la lista de usuarios envía \`${global.p_drmk}lista\`_\n` +
            `_Para consultar todos los comandos ingresa \`${global.p_drmk}ayuda\`_\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
    },

    nextPlayer: function(amt = 1) {
        for(i = 0; i < amt; i++) {
            console.log('Cambiando de dibujante.');
            console.log(`Dibujante a reemplazar: ${global.nombres[global.ndibujante]} (${global.jugadores[global.ndibujante]})`);
            //Recorrer lista en bucle
            if(global.ndibujante < (global.cntjugadores - 1)) global.ndibujante++;
            else global.ndibujante = 0;
        }
        if(global.ndibujante === 0 && global.tjuego === 0) module.exports.mostrarResultados(); //Mostrar resultados finales del evento en caso de terminar la ronda y estar en terminación
        else module.exports.announceNextPlayer(); //De lo contrario, notificar al próximo jugador
        global.seleccionado = false;
        global.dibujado = false;
        global.recompensado = -1;
        setTimeout(module.exports.enableSkip, 2000);
    },

    enableSkip: function() {
        console.log('Salteado de dibujante rehabilitado.');
        global.goingnext = false;
    },
    //#endregion

    //#region Temporizadores
    restarSegundoEmpezar: function() {
        //Temporizador al comenzar drawmaku
        if(global.empezando) {
            global.trest--;
            if((global.trest % 10) === 0) console.log(global.trest);
            if(global.trest === 0) {
                if(global.cntjugadores > 1) {
                    console.log('Cantidad de jugadores valedera; Drawmaku iniciado.');
                    let notification = '';
                    if(global.notroles !== 'na') notification = `:bell: <@&${global.notroles}> :bell:\n`;
                    global.empezado = true;
                    global.cntimagenes = 0;
                    global.chi.send(
                        notification +
                        '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                        ':fireworks: ***__¡¡¡EL DRAWMAKU HA COMENZADO!!!__*** :art:\n' +
                        ':popcorn: _¡Prepárense para otra jornada creativa! ¡Asegúrense de poner buena música y decir que todo es una spellcard de Okuu!_ :musical_note:\n\n' +
                        '`' + global.desc + '`\n' +
                        '¡Esta es la ' + global.edi + 'ª edición de Drawmaku! Y la temática esta vez es... ¡' + global.tem + '!\n' +
                        '> ' + global.desctem + '\n' +
                        '**__¡Tienen 2 horas para divertirse!__**\n' +
                        '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' +
                        ':arrow_down_small: **INICIO INICIO INICIO INICIO INICIO INICIO** :arrow_down_small:'
                    );
                    setTimeout(module.exports.announceNextPlayer, 1500);
                } else {
                    console.log('Cantidad de jugadores insuficiente; Drawmaku cancelado.');
                    global.empezando = false;
                    global.chi.send(':fallen_leaf: No han entrado suficientes personas al evento. Cancelando...');
                }
            }
            else if(global.trest < 5) global.chi.send(`:mega: ***¡${global.trest}!...*** :mega:`);
            else if(global.trest === 5) global.chi.send(`:watch: **5 segundos...** :watch:`);
            else if(global.trest < 60) {
                if((global.trest % 10) === 0) global.chi.send(`:watch: *Quedan ${global.trest} segundos para inscribirse...* :watch:`);
            }
            else if(global.trest <= (60 * 10)) {
                if((global.trest % 60 === 0)) global.chi.send(`:watch: *Quedan ${parseInt(global.trest / 60)} minuto(s) para inscribirse...* :watch:`);
            }
            else if((global.trest % (60 * 30) === 0)) global.chi.send(`:watch: *Quedan ${parseInt(global.trest / 60)} minuto(s) para inscribirse...* :watch:`);
            if(global.trest > 0) setTimeout(module.exports.restarSegundoEmpezar, 1000);
            else setTimeout(module.exports.restarSegundoEvento, 1000);
        }
    },

    restarSegundoEvento: function() {
        //Temporizador al comenzar drawmaku
        if(global.empezado) {
            global.tjuego--;
            if((global.tjuego % 30) === 0) console.log(global.tjuego);
            if(global.tjuego === 0) {
                console.log('El juego terminará al final de la ronda actual.');
                let notification = '';
                if(global.notroles !== 'na') notification = `:bell: <@&${global.notroles}> :bell:\n`;
                global.chi.send(
                    notification +
                    '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                    ':mega: ***AVISO*** :mega:\n' +
                    '_Esta edición de Drawmaku está por terminar..._\n\n' +
                    `¡Jugadores! Al final de esta ronda se dará por terminada la ${global.edi}ª edición de Drawmaku.\n` +
                    `¡Hagan su último esfuerzo!\n` +
                    '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
                );
            } else if(global.tjuego < 60) {
                if((global.tjuego % 20) === 0) global.chi.send(`:alarm_clock: *Quedan ${global.tjuego} segundos de Drawmaku...* :alarm_clock:`);
            } else if(global.tjuego < (60 * 60)) {
                if((global.tjuego % (60 * 20)) === 0) global.chi.send(`:alarm_clock: *Quedan ${parseInt(global.tjuego / 60)} minutos de Drawmaku...* :alarm_clock:`);
            } else if(global.tjuego === (60 * 60)) global.chi.send(`:alarm_clock: *Queda 1 hora de Drawmaku...* :alarm_clock:`);
            if(global.tjuego > 0) setTimeout(module.exports.restarSegundoEvento, 1000);
        }
    },
    //#endregion

    //#region Comprobadores
    notStartedAndSameChannel: function(msgch, preinicio = false) {
        console.log('Verificando si el comando de evento fue ejecutado en lugar y tiempo correctos.');
        var confirm = true;
        var str = '';
        preinicio = (preinicio && global.empezando);
        if(preinicio) str = ' ni por jugar';
        if(!global.empezado && !preinicio) {
            console.log('Comando de evento desaprobado; fase Drawmaku inválida.');
            msgch.send(`:warning: No se está jugando${str} Drawmaku en este momento.`);
            confirm = false;
        } else if(msgch !== global.chi) {
            console.log('Comando de evento desaprobado; los canales no coinciden.');
            msgch.send(`:warning: Drawmaku fue iniciado en ${global.chi}. Ingresa tus comandos de juego ahí.`);
            confirm = false;
        } else console.log('Comando de evento aprobado.');
        
        return (!confirm);
    },

    notModerator: function(author) {
        var ismod = false;
        
        for(var i = 0; i < global.modroles.length; i++)
            if(author.roles.has(global.modroles[i])) {
                ismod = true;
                break;
            }

        return (!ismod);
    },
    //#endregion

    //#region Otros
    mostrarResultados: function() {
        console.log('Ordenando resultados de mayor a menor puntaje.');
        //Añadir jugadores eliminados
        for(let i = 0; i < global.eliminado.cntjugadores; i++) {
            global.jugadores[global.cntjugadores] = global.eliminado.jugadores[i];
            global.nombres[global.cntjugadores] = global.eliminado.nombres[i];
            global.numeros[global.cntjugadores] = global.eliminado.numeros[i];
            global.puntos[global.cntjugadores] = global.eliminado.puntos[i];
            global.cntjugadores++;
        }
        //Ordenamiento burbuja
        for(let i = 1; i < global.cntjugadores; i++)
            for(let j = 0; j < (global.cntjugadores - i); j++)
                if(global.puntos[j] < global.puntos[j + 1]) {
                    var tmp = global.jugadores[j];
                    global.jugadores[j] = global.jugadores[j + 1];
                    global.jugadores[j + 1] = tmp;
                    tmp = global.nombres[j];
                    global.nombres[j] = global.nombres[j + 1];
                    global.nombres[j + 1] = tmp;
                    tmp = global.numeros[j];
                    global.numeros[j] = global.numeros[j + 1];
                    global.numeros[j + 1] = tmp;
                    tmp = global.puntos[j];
                    global.puntos[j] = global.puntos[j + 1];
                    global.puntos[j + 1] = tmp;
                }
        
        console.log('Mostrando resultados.');
        let str = '';
        for(let i = 0; i < global.cntjugadores; i++)
            str += `[Posición ${i + 1} / jugador ${global.numeros[i]}] ${global.nombres[i]}: ${global.puntos[i]} punto(s).\n`;
        global.chi.send(
            ':arrow_up_small: **FINAL FINAL FINAL FINAL FINAL FINAL** :arrow_up_small:\n' +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' +
            ':coffee: ***__¡¡¡EL DRAWMAKU HA TERMINADO!!!__*** :tea:\n' +
            ':beers: _¡Las chicas necesitan descansar!_ :zzz:\n\n' +
            '**RESULTADOS**\n' +
            '```\n' +
            str + '\n' +
            '```\n' +
            '¡Muchas gracias por participar! ¡Nos vemos el viernes que viene!\n' +
            'Si tienes alguna idea para que mejore como bot (o persona), déjala en sugerencias. ¡Nos vemos!\n' +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
        module.exports.reiniciarTodo();
    },

    reiniciarTodo: function() {
        console.log('Terminando evento.');
        global.empezando = false;
        global.empezado = false;
        global.terminando = false;
        global.trest = 0;
        global.tjuego = 7200;
        global.chi = '<#sincanal>';
        for(var i = 0; i < global.cntjugadores; i++) {
            global.jugadores[i] = 0;
            global.nombres[i] = '';
            global.numeros[i] = 0;
            global.puntos[i] = 0;
        }
        global.ndibujante = 0;
        global.seleccionado = false;
        global.dibujado = false;
        global.recompensado = -1;
        global.cntjugadores = 0;
        console.log('Evento terminado.');
    },
    //#endregion
};