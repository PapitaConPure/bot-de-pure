const Discord = require('discord.js'); //Discord.js
const global = require('./localdata/config.json'); //Variables globales
const presence = require('./localdata/presence.json'); //Datos de presencia
const uses = require('./localdata/sguses.json'); //Funciones globales
const images = require('./localdata/images.json'); //Imágenes globales
const Canvas = require('canvas'); //Node Canvas
const chalk = require('chalk'); //Consola con formato bonito
const concol = {
    orange: chalk.rgb(255, 140, 70),
    purple: chalk.rgb(158, 114,214)
};

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
            global.chi.send({ content: ':fallen_leaf: Ya no hay suficientes personas en el evento. Abortando...' });
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
        global.chi.send({
            content: 
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                `:art: *Le toca dibujar a <@${global.jugadores[global.ndibujante]}> (jugador ${global.numeros[global.ndibujante]}).* :art:\n` +
                `_Para enviar el nombre de tu danmaku, ingresa \`${global.p_drmk.raw}draw ||<danmaku>||\`. **No olvides las \\|\\|barras verticales\\|\\|**._\n` +
                `_Para enviar el dibujo de tu danmaku, ingresa \`${global.p_drmk.raw}draw <dibujo de danmaku>\`. **El dibujo se envía adjunto al comando**._\n` +
                `_Para consultar la lista de usuarios envía \`${global.p_drmk.raw}lista\`_\n` +
                `_Para consultar todos los comandos ingresa \`${global.p_drmk.raw}ayuda\`_\n` +
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        });
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

    paginate: function(array, itemsOptions = { pagemax: 10, format: item => `\`${item.name.padEnd(24)}\`${item}` }) {
        const { pagemax, format } = itemsOptions;
		const pages = array
            .map((_, i) => (i % pagemax === 0)?array.slice(i, i + pagemax):null) //Paginar
            .filter(item => item) //Filtrar nulls
            .map(page => page.map(format).join('\n')); //Dar formato y unir
        return pages;
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
                    global.chi.send({
                        content:
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
                    });
                    setTimeout(module.exports.announceNextPlayer, 1500);
                } else {
                    console.log('Cantidad de jugadores insuficiente; Drawmaku cancelado.');
                    global.empezando = false;
                    global.chi.send({ content: ':fallen_leaf: No han entrado suficientes personas al evento. Cancelando...' });
                }
            }
            else if(global.trest < 5) global.chi.send({ content: `:mega: ***¡${global.trest}!...*** :mega:` });
            else if(global.trest === 5) global.chi.send({ content: `:watch: **5 segundos...** :watch:` });
            else if(global.trest < 60) {
                if((global.trest % 10) === 0) global.chi.send({ content: `:watch: *Quedan ${global.trest} segundos para inscribirse...* :watch:` });
            }
            else if(global.trest <= (60 * 10)) {
                if((global.trest % 60 === 0)) global.chi.send({ content: `:watch: *Quedan ${parseInt(global.trest / 60)} minuto(s) para inscribirse...* :watch:` });
            }
            else if((global.trest % (60 * 30) === 0)) global.chi.send({ content: `:watch: *Quedan ${parseInt(global.trest / 60)} minuto(s) para inscribirse...* :watch:` });
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
                global.chi.send({
                    content:
                        notification +
                        '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                        ':mega: ***AVISO*** :mega:\n' +
                        '_Esta edición de Drawmaku está por terminar..._\n\n' +
                        `¡Jugadores! Al final de esta ronda se dará por terminada la ${global.edi}ª edición de Drawmaku.\n` +
                        `¡Hagan su último esfuerzo!\n` +
                        '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
                });
            } else if(global.tjuego < 60) {
                if((global.tjuego % 20) === 0) global.chi.send({ content: `:alarm_clock: *Quedan ${global.tjuego} segundos de Drawmaku...* :alarm_clock:` });
            } else if(global.tjuego < (60 * 60)) {
                if((global.tjuego % (60 * 20)) === 0) global.chi.send({ content: `:alarm_clock: *Quedan ${parseInt(global.tjuego / 60)} minutos de Drawmaku...* :alarm_clock:` });
            } else if(global.tjuego === (60 * 60)) global.chi.send({ content: `:alarm_clock: *Queda 1 hora de Drawmaku...* :alarm_clock:` });
            if(global.tjuego > 0) setTimeout(module.exports.restarSegundoEvento, 1000);
        }
    },

    askForRole: function(miembro, canal, rep) {
        const reps = 4;
        console.log(chalk.cyan('Comprobando miembro nuevo en Hourai Doll para petición de rol de color...'));
        if(!miembro.deleted) {
            console.log(concol.orange('El miembro sigue en el servidor'));
            const dc = module.exports.dollCount(miembro);

            //Comprobación constante para ver si el miembro ya tiene roles de colores
            if(dc > 2) {
                console.log(chalk.green(`El miembro ha recibido sus roles básicos.`));
                canal.send({ content: `Weno **${miembro.user.username}**, ya teni tu rol, q esti bien po <:Junky:651290323557023753>` });

                //Finalizar
                setTimeout(module.exports.finalizarHourai, 1000, miembro, canal);
            } else {
                if(rep > 0) {
                    setTimeout(module.exports.askForRole, 1000 * 60 / reps, miembro, canal, rep - 1);
                    return;
                }
                
                if(dc === 1) {
                    console.log(chalk.magenta('El miembro está retenido.'));
                    global.hourai.warn++;
                    if(global.hourai.warn <= 6) {
                        if(global.hourai.warn <= 3)
                            canal.send({ content: `Oigan cabros, creo que a este qliao (<@${miembro.user.id}>) lo mató Hourai <:mayuwu:654489124413374474> (${global.hourai.warn}/3 llamados)` });
                        setTimeout(module.exports.askForRole, 1000, miembro , canal, reps);
                        console.log(chalk.cyan(`Volviendo a esperar confirmación de miembro (${global.hourai.warn}/6)...`));
                    }
                } else {
                    console.log(chalk.yellow('El miembro no ha recibido roles básicos.'));
                    canal.send({
                        content: `Oe <@${miembro.user.id}> conchetumare vai a elegir un rol o te empalo altoke? <:mayuwu:654489124413374474>`,
                        files: [global.hourai.images.colors]
                    }).then(sent => module.exports.askColor(sent, miembro));
                    setTimeout(module.exports.forceRole, 1000, miembro, canal, 2 * reps);
                    console.log(chalk.magentaBright(`Esperando comprobación final de miembro en unos minutos...`));
                }
            }
        } else {
            console.log(chalk.red(`El miembro se fue del servidor. Abortando.`));
            canal.send({ content: `Se murió el wn de <@${miembro.user.id}> po <:mayuwu:654489124413374474>` });
        }
    },

    forceRole: function(miembro, canal, rep) {
        const reps = 4;
        console.log(chalk.cyan('Comprobando miembro nuevo en Hourai Doll para forzado de rol de color'));
        if(!miembro.deleted) {
            console.log(concol.orange('El miembro sigue en el servidor'));
            const dc = module.exports.dollCount(miembro);
            
            if(dc > 2) {
                console.log(chalk.green('El miembro ya tiene los roles básicos.'));
                canal.send({ content: `Al fin qliao ya teni tu rol. Q esti bien **${miembro.user.username}**, po <:uwu:681935702308552730>` });

                //Finalizar
                setTimeout(module.exports.finalizarHourai, 1000, miembro, canal);
            } else {
                if(rep > 0) {
                    setTimeout(module.exports.forceRole, 1000 * 60 / reps, miembro, canal, rep - 1);
                    return;
                }

                if(dc === 2) {
                    console.log(chalk.magentaBright('El miembro requiere roles básicos. Forzando roles...'));
                    const colores = [
                        '671851233870479375', //France Doll
                        '671852132328275979', //Holland Doll
                        '671851228954755102', //Tibetan Doll
                        '671851235267182625', //Kyoto Doll
                        '671851236538187790', //London Doll
                        '671851234541699092', //Russian Doll
                        '671851228308963348' //Orléans Doll
                    ];
                    canal.send({
                        content:
                            `**${miembro.user.username}**, cagaste altiro watón fome <:mukyuugh:725583038913708034>\n` +
                            `Toma un rol random po <:mayuwu:654489124413374474> <:venAqui2:668644951353065500>`,
                        files: [global.hourai.images.forcecolors]
                    });
                    miembro.roles.add(colores[Math.floor(Math.random() * 7)]);
                    console.log(chalk.greenBright('Roles forzados.'));

                    //Finalizar
                    setTimeout(module.exports.finalizarHourai, 1000, miembro, canal);
                } else {
                    console.log(chalk.red('El miembro ya no tiene ningún rol básico.'));
                    canal.send({ content: `Espérate qué weá pasó con **${miembro.user.username}** <:reibu:686220828773318663>\nOh bueno, ya me aburrí... chao.` });
                }
            }
        } else {
            canal.send({ content: `Se fue cagando el <@${miembro.user.id}> csm <:mayuwu:654489124413374474>` });
        }
    },

    askCandy: function(miembro, canal) {
        if(canal.guild.id !== global.serverid.hourai) {
            canal.send({ content: '<:milky:778180421304188939>' });
            return;
        }

        let candyemote = '778180421304188939';
        let candyrole = '683084373717024869';
        console.log('Preguntando por caramelos.');
        canal.send({
            content:
                `Weno **${miembro.user.username}**, si querí __caramelos__, reacciona con <:milky:778180421304188939> a esto po <:yumou:708158159180660748>\n` +
                '> *__Caramelos:__ están cargados con magia. Leyendas dicen que permiten ver canales donde abunda la lujuria...*'
        }).then(sent => {
            sent.react(candyemote)
            .then(() => {
                const filter = (rc, user) => !user.bot && rc.emoji.id === candyemote && miembro.user.id === user.id;
                const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
                collector.on('collect', () => {
                    if(miembro.roles.cache.some(role => role.id === candyrole)) {
                        canal.send({ content: 'Oe tranqui po, que ya tení tus caramelos <:kageuwu:742506313258369056>' });
                        collector.stop();
                    } else {
                        miembro.roles.add(candyrole);
                        canal.send({ content: 'Caramelos entregados <:miyoi:674823039086624808>:pinching_hand: :candy:' });
                    }
                });
            });
        });
    },

    askColor: async function(rmessage, orimem) {
        let colrol = {
            '819772377814532116': '671851233870479375', //French
            '819772377642041345': '671851228308963348', //Orléans
            '819772377624870973': '671852132328275979', //Holland
            '819772377894354944': '671851234541699092', //Russian
            '819772377856606228': '671851236538187790', //London
            '819772377482526741': '671851228954755102', //Tibetan
            '819772377440583691': '671851235267182625'  //Kyoto
        };
        console.log('Se solicitaron colores.');
        Promise.all(Object.keys(colrol).map(k => rmessage.react(k)));
        const filter = (rc, user) => !user.bot && colrol.hasOwnProperty(rc.emoji.id) && orimem.user.id === user.id;
        const collector = rmessage.createReactionCollector({ filter: filter, max: 2, time: 5 * 60 * 1000 });
        
        collector.on('collect', (reaction, user) => {
            const reacted = reaction.emoji.id;
            rmessage.channel.guild.members.fetch(user.id).then(member => {
                const hadroles = member.roles.cache.find(role => Object.values(colrol).some(colorid => colorid === role.id));
                if(hadroles !== undefined) {
                    member.roles.remove(hadroles)
                    .then(mem => mem.roles.add(colrol[reacted]));
                    rmessage.channel.send({ content: 'Colores intercambiados <:monowo:757624423300726865>' });
                } else {
                    rmessage.channel.send({ content: 'Colores otorgados <:miyoi:674823039086624808> :thumbsup:' });
                    member.roles.add(colrol[reacted]);
                }
            });
        });
    },

    pingear: function(cnt, mention, msgch, msgauth) {
        const frase = [
            `Oe po ${mention} <:junkNo:697321858407727224>`,
            `Wacho, cachai ${mention} <:yumou:708158159180660748>`,
            `Oe ${mention} qliao <:miyoi:674823039086624808>`,
            `Responde po ${mention} <:mayuwu:654489124413374474>`,
            `¿Vai a responder ${mention}? <:haniwaSmile:659872119995498507>`,
            `${mention}, respondé altoke <:hypergardener:796931141851938827>`,
            `Dale ${mention} ctm <:reibu:686220828773318663>`,
            `Wena po ${mention} como andai <:meguSmile:694324892073721887>`,
            `Pero qué andai haciendo po ${mention} rectm <:spookedSyura:725577379665281094>`,
            `NoOoOoOo re TUuUrBiOoOoOo, veni ${mention} <:junkWTF:796930821260836864>`
        ];

        msgch.send({ content: frase[Math.floor(Math.random() * frase.length)] });

        if(cnt > 1)
            setTimeout(module.exports.pingear, 1000, cnt - 1, mention, msgch, msgauth);
        else 
            uses.pinguear[msgauth] = false;
    },

    modifyAct: async function(clientowo, pasuwus) { //Cambio de estado constante; créditos a Imagine Breaker y Sassafras
        //Actualización de actividad
        try {
            console.log(concol.orange.underline(`Iniciando cambio de presencia ${pasuwus}...`));
            await clientowo.user.setActivity(
                presence.status[module.exports.randRange(0, presence.status.length)],
                { type: 'STREAMING', url: `https://www.youtube.com/watch?v=${presence.stream[module.exports.randRange(0, presence.stream.length)]}` }
            );
            console.log(chalk.greenBright.bold('Cambio de presencia finalizado.'));
            
            //Programar próxima actualización de actividad
            const stepwait = module.exports.randRange(30, 70);
            setTimeout(module.exports.modifyAct, 1000 * 60 * stepwait, clientowo, pasuwus + 1);
            console.log(chalk.cyan`Esperando ciclo ${pasuwus + 1} en ${stepwait} minutos...`);
        } catch(err) {
            console.log(chalk.redBright.bold('Ocurrió un error al intentar realizar un cambio de presencia.'));
            console.error(err);
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
            msgch.send({ content: `:warning: No se está jugando${str} Drawmaku en este momento.` });
            confirm = false;
        } else if(msgch !== global.chi) {
            console.log('Comando de evento desaprobado; los canales no coinciden.');
            msgch.send({ content: `:warning: Drawmaku fue iniciado en ${global.chi}. Ingresa tus comandos de juego ahí.` });
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

    dollCount: function(member) {
        let fp = 0; //Falsos positivos a restar
        member.roles.cache.map(role => {
            if(role.id === '699304214253404292' || role.id === '813194804161806436')
                fp++;
        });
        return (member.roles.cache.size - fp);
    },
    //#endregion

    //#region Sistema
    reloadState: function() {
        /**/
        
        setTimeout(module.exports.saveState, (20 * 1000));
    },

    /*saveState: function() {
        fs.writeFile("localdata/config.json", JSON.stringify(global, null, 4), err => {
            if(err) console.error(err);
        });

        //setTimeout(module.exports.saveState, (10 * 1000));
    },*/
    //#endregion

    //#region Anuncios
    finalizarHourai: function(miembro, canal) {
        //Mensaje de fin de bienvenida
        canal.send({
            content:
                `Una última cosita <@${miembro.user.id}>, recuerda revisar el canal <#671817759268536320> en algún momento <:Junkoborga:751938096550903850>\n` +
                `También, si te interesa, puedes revisar los mensajes pinneados de este canal <:emperowo:834981904323313745>\n` +
                'Y estate tranqui, que ya no vas a recibir tantos pings <:starnap:727764482801008693>'
        });

        //Otorgar rol con 50% de probabilidad
        const gr = canal.guild.roles.cache;
        if(Math.random() < 0.5)
            miembro.roles.add(gr.find(r => r.name === 'Rol con 50% de probabilidades de tenerlo'));
    },

    dibujarAvatar: async function(context2d, user, xcenter, ycenter, radius, options = { circleStrokeColor: '#000000', circleStrokeFactor: 0.02 }) {
        //Fondo
        context2d.fillStyle = '#36393f';
        context2d.arc(xcenter, ycenter, radius, 0, Math.PI * 2, true);
        context2d.fill();

        //Foto de perfil
        context2d.strokeStyle = options.strokeColor;
        context2d.lineWidth = radius * 0.33 * options.strokeFactor;
        context2d.arc(xcenter, ycenter, radius + context2d.lineWidth, 0, Math.PI * 2, true);
        context2d.stroke();
        context2d.save();
        context2d.beginPath();
        context2d.arc(xcenter, ycenter, radius, 0, Math.PI * 2, true);
        context2d.closePath();
        context2d.clip();
        const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'png', dynamic: false, size: 1024 }));
        context2d.drawImage(avatar, xcenter - radius, ycenter - radius, radius * 2, radius * 2);
        context2d.restore();
    },

    dibujarBienvenida: async function(miembro) {
        //Dar bienvenida a un miembro nuevo de un servidor
        const servidor = miembro.guild; //Servidor
        const canal = servidor.channels.cache.get(servidor.systemChannelId); //Canal de mensajes de sistema
        console.log(canal);
        //#region Comprobación de miembro y servidor
        if(canal === undefined) {
            console.log(chalk.blue('El servidor no tiene canal de mensajes de sistema.'));
            servidor.fetchOwner().then(ow => ow.user.send({
                content:
                    '¡Hola, soy Bot de Puré!\n' +
                    `¡Un nuevo miembro, **<@${miembro.id}> (${miembro.id})**, ha entrado a tu servidor **${servidor.name}**!\n\n` +
                    '*Si deseas que envíe una bienvenida a los miembros nuevos en lugar de enviarte un mensaje privado, selecciona un canal de mensajes de sistema en tu servidor.*\n' +
                    '*__Nota:__ Bot de Puré no opera con mensajes privados.*'
            }));
            return;
        }

        console.log(concol.purple`Un usuario ha entrado a ${servidor.name}...`);
        if(!servidor.me.permissionsIn(canal).has(['SEND_MESSAGES', 'VIEW_CHANNEL'])) {
            console.log(chalk.red('No se puede enviar un mensaje de bienvenida en este canal.'));
            return;
        }
        canal.sendTyping();
        //#endregion
        
        //#region Creación de imagen
        const canvas = Canvas.createCanvas(1275, 825);
        const ctx = canvas.getContext('2d');

        const fondo = await Canvas.loadImage((servidor.id === global.serverid.hourai)?global.hourai.images.welcome:images.announcements.welcome);
        ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
        //#endregion

        //#region Texto
        //#region Propiedades de texto
        const strokeFactor = 0.09;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        //#endregion

        //#region Nombre del usuario
        ctx.textBaseline = 'top';
		ctx.textAlign = 'center';
        const xcenter = canvas.width / 2;
        let Texto = `${miembro.displayName}`;
        let fontSize = 100;
        ctx.font = `bold ${fontSize}px "headline"`;
        console.log(fontSize);
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, xcenter, 15);
        ctx.fillText(Texto, xcenter, 15);
        //#endregion
        
        //#region Texto inferior
        ctx.textBaseline = 'bottom';
        if(servidor.id === global.serverid.ar) Texto = 'Animal Realm!';
        else Texto = `${servidor.name}!`;
        fontSize = 100;
        ctx.font = `bold ${fontSize}px "headline"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, xcenter, canvas.height - 15);
        ctx.fillText(Texto, xcenter, canvas.height - 15);
        Texto = '¡Bienvenid@ a';
        ctx.lineWidth = Math.ceil(56 * strokeFactor);
        ctx.font = `bold 56px "headline"`;
        ctx.strokeText(Texto, xcenter, canvas.height - fontSize - 20);
        ctx.fillText(Texto, xcenter, canvas.height - fontSize - 20);
        //#endregion
        //#endregion
        
        await module.exports.dibujarAvatar(ctx, miembro.user, canvas.width / 2, (canvas.height - 56) / 2, 200, { circleStrokeFactor: strokeFactor });
        
        const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');

        //#region Imagen y Mensaje extra
        const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size;
        canal.send({files: [imagen]}).then(sent => {
            if(servidor.id === global.serverid.hourai) {
                canal.send({
                    content:
                        `Wena po <@${miembro.user.id}> conchetumare, como estai.\n` +
                        'Como tradición, elige un color reaccionando a alguna de estas cartas <:mayuwu:654489124413374474>\n' +
                        '<:FrenchDoll:819772377814532116><:OrleansDoll:819772377642041345><:HollandDoll:819772377624870973><:RussianDoll:819772377894354944><:LondonDoll:819772377856606228><:TibetanDoll:819772377482526741><:KyotoDoll:819772377440583691>\n' +
                        'Nota: si no lo haces, lo haré por ti, por aweonao <:junkNo:697321858407727224>\n' +
                        '<@&654472238510112799>, vengan a saludar po maricones <:venAqui:668644938346659851><:miyoi:674823039086624808><:venAqui2:668644951353065500>\n' +
                        `*Por cierto, ahora hay **${peoplecnt}** wnes en el server* <:meguSmile:694324892073721887>\n`,
                    files: [global.hourai.images.colors]
                }).then(sent => module.exports.askColor(sent, miembro));
                setTimeout(module.exports.askForRole, 1000, miembro, canal, 3 * 4);
                console.log('Esperando evento personalizado de Hourai Doll en unos minutos...');
            } else if(servidor.id === global.serverid.ar) {
                canal.send({
                    content:
                        `Welcome to the server **${miembro.displayName}**! / ¡Bienvenido/a al server **${miembro.displayName}**!\n\n` +
                        `**EN:** To fully enjoy the server, don't forget to get 1 of the 5 main roles in the following channel~\n` +
                        '**ES:** Para disfrutar totalmente del servidor, no olvides escoger 1 de los 5 roles principales en el siguiente canal~\n\n' +
                        '→ <#611753608601403393> ←\n\n' +
                        `*Ahora hay **${peoplecnt}** usuarios en el server.*`
                });
            } else { //Otros servidores
                canal.send({
                    content:
                        `¡Bienvenido al servidor **${miembro.displayName}**!\n` +
                        `*Ahora hay **${peoplecnt}** usuarios en el server.*`
                });
            }
        });
        //#endregion
        console.log('Bienvenida finalizada.');
    },

    dibujarDespedida: async function(miembro) {
        //Dar despedida a ex-miembros de un servidor
        const servidor = miembro.guild;
        const canal = servidor.channels.cache.get(servidor.systemChannelId);

        //#region Comprobación de miembro y servidor
        if(!canal) {
            console.log('El servidor no tiene canal de mensajes de sistema.');
            return;
        }

        console.log(`Un usuario ha salido de ${servidor.name}...`);
        if(!servidor.me.permissionsIn(canal).has(['SEND_MESSAGES', 'VIEW_CHANNEL'])) {
            console.log('No se puede enviar un mensaje de despedida en este canal.');
            return;
        }
        canal.sendTyping();
        //#endregion
        
        //#region Creación de imagen
        const canvas = Canvas.createCanvas(1500, 900);
        const ctx = canvas.getContext('2d');

        const fondo = await Canvas.loadImage(images.announcements.farewell);
        ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
        //#endregion

        //#region Texto
        //#region Propiedades de Texto
        const strokeFactor = 0.09;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        //#endregion

        //#region Nombre del usuario
        ctx.textBaseline = 'bottom';
		ctx.textAlign = 'center';
        const xcenter = canvas.width / 2;
        let Texto = `Adiós, ${miembro.displayName}`;
        let fontSize = 90;
        ctx.font = `bold ${fontSize}px "headline"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, xcenter, canvas.height - 40);
        ctx.fillText(Texto, xcenter, canvas.height - 40);
        //#endregion
        //#endregion

        await module.exports.dibujarAvatar(ctx, miembro.user, canvas.width / 2, 80 + 200, 200, { circleStrokeFactor: strokeFactor });

        const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'despedida.png');

        //#region Imagen y Mensaje extra
        const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size;
        canal.send({ files: [imagen] }).then(() => {
            if(servidor.id === '654471968200065034') { //Hourai Doll
                canal.send({
                    content: 
                        'Nooooo po csm, perdimo otro weón \<:meguDerp:708064265092726834>' +
                        `*Ahora quedan **${peoplecnt}** aweonaos en el server.*`
                });
            } else { //Otros servidores
                canal.send({ content: `*Ahora hay **${peoplecnt}** usuarios en el server.*`});
            }
        });
        //#endregion
        console.log('Despedida finalizada.');
    },
    //#endregion

    //#region Fetch
    fetchUserID: function(data, guild, client) {
        const uc = client.users.cache;
        //Descifrar posible mención
        if(data.startsWith('<@') && data.endsWith('>')) {
            data = data.slice(2, -1);
            if(data.startsWith('!')) data = data.slice(1);
        }
        
        //Intentar encontrar por ID
        if(!isNaN(data) && uc.find(u => u.id === data)) return data;

        //Intentar encontrar por tag
        const taggeduser = uc.find(u => u.tag === data);
        if(taggeduser) return taggeduser.id;
        
        //Intentar encontrar por nombre de usuario
        data = data.toLowerCase();
        let users = uc.filter(u => u.username.toLowerCase().indexOf(data) !== -1);
        if(users.size) {
            users = users
                .sort()
                .reduce((a, b) => (a.username.toLowerCase().indexOf(data) <= b.username.toLowerCase().indexOf(data) && a.username.length <= b.username.length)?a:b);
            return users.id;
        }

        //Intentar encontrar por nombre en guild actual
        let members = guild.members.cache.filter(m => m.nickname && m.nickname.toLowerCase().indexOf(data) !== -1);
        if(members.size) {
            members = members
                .sort()
                .reduce((a, b) => (a.nickname.toLowerCase().indexOf(data) <= b.nickname.toLowerCase().indexOf(data) && a.nickname.length <= b.nickname.length)?a:b);
            return members.user.id;
        }

        //Búsqueda sin resultados
        return undefined;
    },

    fetchArrows: function(emojiscache) {
        return [emojiscache.get('681963688361590897'), emojiscache.get('681963688411922460')];
    },

    fetchFlag: function(args, flag = { property: false, short: [], long: [], callback: (x, i) => undefined, fallback: (x) => undefined }) {
        let target; //Retorno. Devuelve una variante de callback si se ingresa la flag buscada de forma válida, o una variante de fallback si no

        //Recorrer parámetros e intentar procesar flags
        args.forEach((arg, i) => {
            if(flag.property && i === (args.length - 1)) return;
            arg = arg.toLowerCase();
            if(flag.long !== undefined && flag.long.length && arg.startsWith('--')) {
                if(flag.long.includes(arg.slice(2))) {
                    if(flag.property) target = flag.callback(args, i + 1); //Debe ser una función si es una flag de propiedad
                    else target = (typeof flag.callback === 'function')?flag.callback():flag.callback; //De lo contrario, puede ser una función o un valor
                    args.splice(i, flag.property?2:1);
                }
            } else if(flag.short !== undefined && flag.short.length && arg.startsWith('-')) {
                for(c of arg.slice(1))
                    if(flag.short.includes(c)) {
                        if(flag.property) target = flag.callback(args, i + 1);
                        else target = (typeof flag.callback === 'function')?flag.callback():flag.callback;
                        args.splice(i, flag.property?2:1);
                    }
            }
		});

        return target?target:(typeof flag.fallback === 'function'?flag.fallback():flag.fallback);
    },
    
    fetchSentence: function(args, i) {
        if(i >= args.length) //Título inválido
            return undefined;
        else if(args[i].startsWith('"')) { //Título largo
            let l = i;
            let tt;
    
            while(l < args.length && !args[l].endsWith('"'))
                l++;
            tt = args.slice(i, l + 1).join(' ').slice(1);
            args.splice(i, l - i);
            if(tt.length > 1) return (tt.endsWith('"'))?tt.slice(0, -1):tt;
            else return undefined;
        } else //Título corto
            return args[i];
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
        global.chi.send({
            content: 
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
        });
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

    randRange: function(minInclusive, maxExclusive, round = true) {
        const range = maxExclusive - minInclusive;
        const rnum = (global.seed + range * Math.random()) % range;
        return minInclusive + (round?Math.floor(rnum):rnum);
    }
    //#endregion
};