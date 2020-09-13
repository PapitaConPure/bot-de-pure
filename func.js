const Discord = require('discord.js'); //Integrar discord.js
const global = require('./config.json'); //Variables globales
//const fs = require('fs');
//const MongoClient = require('mongodb').MongoClient;

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

    askForRole: function(miembro, canal) {
        console.log('Comprobando miembro nuevo en Hourai Doll para petición de rol de color');
        if(!miembro.deleted) {
            console.log('El miembro sigue en el servidor');
            if(miembro.roles.cache.size === 1) {
                console.log('El miembro está retenido.');
                global.houraiwarn++;
                if(global.houraiwarn <= 6) {
                    if(global.houraiwarn <= 3)
                        canal.send(`Oigan cabros, creo que a este qliao (<@${miembro.user.id}>) lo mató Hourai <:mayuwu:654489124413374474> (${global.houraiwarn}/3 llamados)`);
                    setTimeout(module.exports.askForRole, 1000 * 60 * 5, miembro , canal);
                    console.log(`Volviendo a esperar confirmación de miembro (${global.houraiwarn}/6)...`);
                }
            } else if(miembro.roles.cache.size === 2) {
                console.log('El miembro no ha recibido roles básicos.');
                canal.send(
                    `Oe <@${miembro.user.id}> conchetumare vai a elegir un rol o te empalo altoke? <:mayuwu:654489124413374474>\n` +
                    `https://imgur.com/D5Z8Itb`
                );
                setTimeout(module.exports.forceRole, 1000 * 60 * 4, miembro, canal);
                console.log(`Esperando comprobación final de miembro en unos minutos...`);
            } else {
                console.log(`El miembro ha recibido sus roles básicos.`);
                canal.send('Weno, ya teni tu rol, q esti bien po <:Junky:651290323557023753>');
            }
        } else {
            console.log(`El miembro se fue del servidor. Abortando.`);
            canal.send(`Se murió el wn de <@${miembro.user.id}> po <:mayuwu:654489124413374474>`);
        }
    },

    forceRole: function(miembro, canal) {
        console.log('Comprobando miembro nuevo en Hourai Doll para forzado de rol de color');
        if(!miembro.deleted) {
            console.log('El miembro sigue en el servidor');
            if(miembro.roles.cache.size === 2) {
                console.log('El miembro requiere roles básicos. Forzando roles...');
                canal.send(`<@${miembro.user.id}> cagaste altiro watón fome <:mukyuugh:725583038913708034>`);
                const colores = [
                    '671851233870479375', //France Doll
                    '671852132328275979', //Holland Doll
                    '671851228954755102', //Tibetan Doll
                    '671851235267182625', //Kyoto Doll
                    '671851236538187790', //London Doll
                    '671851234541699092', //Russian Doll
                    '671851228308963348', //Orléans Doll
                ];
                miembro.roles.add(colores[Math.floor(Math.random() * 7)]);
                console.log('Roles forzados.');
            } else if(miembro.roles.cache.size > 2) {
                console.log('El miembro ya tiene los roles básicos.');
                canal.send('Al fin qliao ya teni tu rol. Q esti bien po, tonce <:uwu:681935702308552730>');
            } else {
                console.log('El miembro ya no tiene ningún rol básico.');
                canal.send('Espérate qué weá pasó con el nuevo <:reibu:686220828773318663>\nOh bueno, ya me aburrí... chao.');
            }
        } else {
            canal.send(`Se murió el wn de <@${miembro.user.id}> po <:mayuwu:654489124413374474>`);
        }
    },

    pingear: function(cnt, mention, msgch) {
        const frase = [
            `Oe po ${mention} <:junkNo:697321858407727224>`,
            `Wacho, cachai ${mention} <:yumou:708158159180660748>`,
            `Oe ${mention} qliao <:miyoi:674823039086624808>`,
            `Responde po ${mention} <:mayuwu:654489124413374474>`,
            `¿Vai a responder ${mention}? <:haniwaSmile:659872119995498507>`,
            `${mention}, respondé altoke <:hypergardener:720759009866547342>`,
            `Dale ${mention} ctm <:reibu:686220828773318663>`,
            `Wena po ${mention} como andai <:meguSmile:694324892073721887>`,
            `Pero qué andai haciendo po ${mention} rectm <:spookedSyura:688883921697374208>`
        ];

        msgch.send(frase[Math.floor(Math.random() * 8)]);

        if(cnt > 1) {
            setTimeout(module.exports.pingear, 1000, cnt - 1, mention, msgch);
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

    //#region Sistema
    reloadState: function() {
        /**/
        
        setTimeout(module.exports.saveState, (20 * 1000));
    },

    /*saveState: function() {
        fs.writeFile("config.json", JSON.stringify(global, null, 4), err => {
            if(err) console.error(err);
        });

        //setTimeout(module.exports.saveState, (10 * 1000));
    },*/
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

    resolverIDUsuario: function(data, guild, client) {
        //Intentar descifrar ID por mención
        if(data.startsWith('<@') && data.endsWith('>')) {
            data = data.slice(2, -1);
            if(data.startsWith('!')) data = data.slice(1);
        }

        //Buscador por nombre, en caso de que la información de búsqueda no sea una ID ni una mención
        if(isNaN(data)) {
            //Para comprobaciones posteriores
            const temp = data.toLowerCase();
            let minimum = -1;

            //Buscar por apodo o nombre de usuario dentro de guild actual
            data = guild.members.cache.filter(member => {
                let nickmatch;

                if(member.nickname !== null && member.nickname !== undefined)
                    nickmatch = member.nickname.toLowerCase().indexOf(temp);
                if(nickmatch === -1)
                    nickmatch = member.user.username.toLowerCase().indexOf(temp);
                
                if(minimum === -1 || nickmatch < minimum)
                    minimum = nickmatch;
                else
                    nickmatch = -1;
                
                console.log(`${member.user.username} (${member.user.id}): ${nickmatch}`);
                
                return (nickmatch !== -1);
            }).first();
            
            //Buscar por nombre de usuario en resto de guilds
            minimum = -1;
            if(data === undefined)
                client.guilds.cache.filter(cguild => cguild.id !== guild.id).map(cguild => {
                    let fetchednick = cguild.members.cache.filter(member => {
                        let usermatch;

                        usermatch = member.user.username.toLowerCase().indexOf(temp);

                        if(minimum === -1 || usermatch < minimum)
                            minimum = usermatch;
                        else
                            usermatch = -1;
                        
                        return (nickmatch !== -1);
                    }).first();

                    if(fetchednick !== undefined) data = fetchednick;
                });
            
            //Convertir miembro a usuario
            if(data !== undefined)
                data = data.user.id;
        }

        //Retornar objeto User
        return data;
    }
    //#endregion
};