const Discord = require('discord.js');
const global = require('./config.json'); //Variables globales
const presence = require('./presence.json'); //Datos de presencia
const Canvas = require('canvas'); 

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

    askForRole: function(miembro, canal, rep) {
        console.log('Comprobando miembro nuevo en Hourai Doll para petición de rol de color');
        if(!miembro.deleted) {
            console.log('El miembro sigue en el servidor');
            const dc = module.exports.dollCount(miembro);

            //Comprobación constante para ver si el miembro ya tiene roles de colores
            if(dc > 2) {
                console.log(`El miembro ha recibido sus roles básicos.`);
                canal.send(`Weno **${miembro.user.username}**, ya teni tu rol, q esti bien po <:Junky:651290323557023753>`);

                //Finalizar
                setTimeout(module.exports.finalizarHourai, 1000, miembro, canal);
            } else {
                if(rep > 0) {
                    setTimeout(module.exports.askForRole, 1000 * 60 / 4, miembro, canal, rep - 1);
                    return;
                }
                
                if(dc === 1) {
                    console.log('El miembro está retenido.');
                    global.houraiwarn++;
                    if(global.houraiwarn <= 6) {
                        if(global.houraiwarn <= 3)
                            canal.send(`Oigan cabros, creo que a este qliao (<@${miembro.user.id}>) lo mató Hourai <:mayuwu:654489124413374474> (${global.houraiwarn}/3 llamados)`);
                        setTimeout(module.exports.askForRole, 1000, miembro , canal, 5 * 4);
                        console.log(`Volviendo a esperar confirmación de miembro (${global.houraiwarn}/6)...`);
                    }
                } else {
                    console.log('El miembro no ha recibido roles básicos.');
                    canal.send(
                        `Oe <@${miembro.user.id}> conchetumare vai a elegir un rol o te empalo altoke? <:mayuwu:654489124413374474>\n` +
                        `https://imgur.com/D5Z8Itb`
                    ).then(sent => module.exports.askColor(sent, miembro));
                    setTimeout(module.exports.forceRole, 1000, miembro, canal, 4 * 4);
                    console.log(`Esperando comprobación final de miembro en unos minutos...`);
                }
            }
        } else {
            console.log(`El miembro se fue del servidor. Abortando.`);
            canal.send(`Se murió el wn de <@${miembro.user.id}> po <:mayuwu:654489124413374474>`);
        }
    },

    forceRole: function(miembro, canal, rep) {
        console.log('Comprobando miembro nuevo en Hourai Doll para forzado de rol de color');
        if(!miembro.deleted) {
            console.log('El miembro sigue en el servidor');
            const dc = module.exports.dollCount(miembro);
            
            if(dc > 2) {
                console.log('El miembro ya tiene los roles básicos.');
                canal.send(`Al fin qliao ya teni tu rol. Q esti bien **${miembro.user.username}**, po <:uwu:681935702308552730>`);

                //Finalizar
                setTimeout(module.exports.finalizarHourai, 1000, miembro, canal);
            } else {
                if(rep > 0) {
                    setTimeout(module.exports.forceRole, 1000 * 60 / 4, miembro, canal, rep - 1);
                    return;
                }

                if(dc === 2) {
                    console.log('El miembro requiere roles básicos. Forzando roles...');
                    const colores = [
                        '671851233870479375', //France Doll
                        '671852132328275979', //Holland Doll
                        '671851228954755102', //Tibetan Doll
                        '671851235267182625', //Kyoto Doll
                        '671851236538187790', //London Doll
                        '671851234541699092', //Russian Doll
                        '671851228308963348' //Orléans Doll
                    ];
                    canal.send(
                        `<@${miembro.user.id}>, cagaste altiro watón fome <:mukyuugh:725583038913708034>\n` +
                        `Toma un rol random po <:mayuwu:654489124413374474> <:venAqui2:668644951353065500>\n` +
                        'https://imgur.com/pXumeJT'
                    );
                    miembro.roles.add(colores[Math.floor(Math.random() * 7)]);
                    console.log('Roles forzados.');

                    //Finalizar
                    setTimeout(module.exports.finalizarHourai, 1000, miembro, canal);
                } else {
                    console.log('El miembro ya no tiene ningún rol básico.');
                    canal.send(`Espérate qué weá pasó con **${miembro.user.username}** <:reibu:686220828773318663>\nOh bueno, ya me aburrí... chao.`);
                }
            }
        } else {
            canal.send(`Se fue cagando el <@${miembro.user.id}> csm <:mayuwu:654489124413374474>`);
        }
    },

    askCandy: function(miembro, canal) {
        if(canal.guild.id !== global.serverid.hourai) {
            canal.send('<:milky:778180421304188939>');
            return;
        }

        let candyemote = '778180421304188939';
        let candyrole = '683084373717024869';
        console.log('Preguntando por caramelos.');
        canal.send(
            `Weno **${miembro.user.username}**, si querí __caramelos__, reacciona con <:milky:778180421304188939> a esto po <:yumou:708158159180660748>\n` +
            '> *__Caramelos:__ están cargados con magia. Leyendas dicen que permiten ver canales donde abunda la lujuria...*'
        ).then(sent => {
            sent.react(candyemote)
            .then(() => {
                const filter = (rc, user) => !user.bot && rc.emoji.id === candyemote && miembro.user.id === user.id;
                const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
                collector.on('collect', () => {
                    if(miembro.roles.cache.some(role => role.id === candyrole)) {
                        canal.send('Oe tranqui po, que ya tení tus caramelos <:kageuwu:742506313258369056>');
                        collector.stop();
                    } else {
                        miembro.roles.add(candyrole);
                        canal.send('Caramelos entregados <:miyoi:674823039086624808>:pinching_hand: :candy:');
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
        for(const [creact, crole] of Object.entries(colrol))
            await rmessage.react(creact);
        await rmessage.react('🎦');
        const filter = (rc, user) => !user.bot && colrol.hasOwnProperty(rc.emoji.id) && orimem.user.id === user.id;
        const collector = rmessage.createReactionCollector(filter, { max: 1, time: 5 * 60 * 1000 });
        
        collector.on('collect', (reaction, user) => {
            const reacted = reaction.emoji.id;
            rmessage.channel.guild.members.fetch(user.id).then(member => {
                const hadroles = member.roles.cache.filter(role => Object.values(colrol).some(colorid => colorid === role.id));
                if(hadroles.array().length) {
                    member.roles.remove(hadroles)
                        .then(mem => mem.roles.add(colrol[reacted]));
                    rmessage.channel.send('Colores intercambiados <:monowo:757624423300726865>');
                } else {
                    rmessage.channel.send('Colores otorgados <:miyoi:674823039086624808> :thumbsup:');
                    member.roles.add(colrol[reacted]);
                }
            });
        });
    },

    pingear: function(cnt, mention, msgch) {
        const frase = [
            `Oe po ${mention} <:junkNo:697321858407727224>`,
            `Wacho, cachai ${mention} <:yumou:708158159180660748>`,
            `Oe ${mention} qliao <:miyoi:674823039086624808>`,
            `Responde po ${mention} <:mayuwu:654489124413374474>`,
            `¿Vai a responder ${mention}? <:haniwaSmile:659872119995498507>`,
            `${mention}, respondé altoke <:HYPERGARDENER:757163180211306516>`,
            `Dale ${mention} ctm <:reibu:686220828773318663>`,
            `Wena po ${mention} como andai <:meguSmile:694324892073721887>`,
            `Pero qué andai haciendo po ${mention} rectm <:spookedSyura:688883921697374208>`
        ];

        msgch.send(frase[Math.floor(Math.random() * 8)]);

        if(cnt > 1) {
            setTimeout(module.exports.pingear, 1000, cnt - 1, mention, msgch);
        }
    },

    modifyAct: function(clientowo, pasuwus) { //Cambio de estado constante; créditos a Imagine Breaker y Sassafras
        //Actualización de actividad
        try {
            console.log(`Iniciando cambio de presencia ${pasuwus}...`);
            clientowo.user.setActivity(
                presence.status[module.exports.randInt(0, presence.status.length)],
                { type: 'STREAMING', url: `https://www.youtube.com/watch?v=${presence.stream[module.exports.randInt(0, presence.stream.length)]}` }
            );
            console.log('Cambio de presencia finalizado.');
            
            //Programar próxima actualización de actividad
            const stepwait = module.exports.randInt(30, 70);
            setTimeout(module.exports.modifyAct, 1000 * 60 * stepwait, clientowo, pasuwus + 1);
            console.log(`Esperando ciclo ${pasuwus + 1} en ${stepwait} minutos...`);
        } catch(err) {
            console.log('Ocurrió un error al intentar realizar un cambio de presencia.');
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
        fs.writeFile("config.json", JSON.stringify(global, null, 4), err => {
            if(err) console.error(err);
        });

        //setTimeout(module.exports.saveState, (10 * 1000));
    },*/
    //#endregion

    //#region Anuncios
    finalizarHourai: async function(miembro, canal) {
        //Mensaje de fin de bienvenida
        canal.send(
            `Una última cosita <@${miembro.user.id}>, recuerda revisar el canal <#671817759268536320> en algún momento <:Junkoborga:751938096550903850>\n` +
            'Y estate tranqui, que ya no vas a recibir tantos pings <:starnap:727764482801008693>'
        );

        //Otorgar rol con 50% de probabilidad
        if(Math.random() < 0.5)
            miembro.roles.add('727952950395273247');
    },

    dibujarBienvenida: async function(miembro) {
        //Dar bienvenida a un miembro nuevo de un servidor
        const servidor = miembro.guild; //Servidor
        const canal = servidor.channels.cache.get(servidor.systemChannelID); //Canal de mensajes de sistema

        //#region Comprobación de miembro y servidor
        if(typeof canal === 'undefined') {
            console.log('El servidor no tiene canal de mensajes de sistema.');
            servidor.owner.user.send(
                '¡Hola, soy Bot de Puré!\n' +
                `¡Un nuevo miembro, **<@${miembro.id}> (${miembro.id})**, ha entrado a tu servidor **${servidor.name}**!\n\n` +
                '*Si deseas que envíe una bienvenida a los miembros nuevos en lugar de enviarte un mensaje privado, selecciona un canal de mensajes de sistema en tu servidor.*\n' +
                '*__Nota:__ Bot de Puré no opera con mensajes privados.*'
            );
            return;
        }

        console.log(`Un usuario ha entrado a ${servidor.name}...`);
        if(!servidor.me.permissionsIn(canal).has(['SEND_MESSAGES', 'VIEW_CHANNEL'])) {
            console.log('No se puede enviar un mensaje de bienvenida en este canal.');
            return;
        }
        canal.startTyping();
        //#endregion
        
        //#region Creación de imagen
        const canvas = Canvas.createCanvas(1275, 825);
        const ctx = canvas.getContext('2d');

        const fondo = await Canvas.loadImage('./fondo.png');
        ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
        //#endregion

        //#region Texto
        //#region Propiedades de texto
        ctx.textBaseline = 'bottom';
        ctx.shadowOffsetX = shadowOffsetY = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'black';
        ctx.fillStyle = '#ffffff';
        //#endregion

        //#region Nombre del usuario
        let Texto = `${miembro.displayName}`;
        let fontSize = 72;
        while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 80);
        //#endregion
        
        //#region Texto inferior
        if(servidor.id === '611732083995443210') Texto = 'Animal Realm!';
        else Texto = `${servidor.name}!`;
        fontSize = 120;
        while(ctx.measureText(Texto).width > (canvas.width - 150)) fontSize -= 2;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - 15);
        Texto = '¡Bienvenid@ a';
        ctx.font = `bold 48px sans-serif`;
        ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - fontSize - 30);
        //#endregion
        //#endregion
        
        //#region Foto de Perfil
        //#region Sombra
        const ycenter = (80 + (canvas.height - 10/*fontSize*/ - 48 - 30)) / 2;
        ctx.shadowOffsetX = shadowOffsetY = 8;
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#36393f';
        ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
        ctx.fill();
        //#endregion

        //#region Imagen circular
        ctx.beginPath();
        ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        const avatar = await Canvas.loadImage(miembro.user.displayAvatarURL({ format: 'png', dynamic: false, size: 1024 }));
        ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
        //#endregion
        //#endregion
        
        const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');

        //#region Imagen y Mensaje extra
        const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size;
        canal.send({files: [imagen]}).then(sent => {
            if(servidor.id === global.serverid.hourai) {
                canal.send(
                    `Wena po <@${miembro.user.id}> conchetumare, como estai.\n` +
                    'Elige un rol de color reaccionando con estos emotes cuando un ":cinema:" aparezca <:mayuwu:654489124413374474>\n' +
                    '<:FrenchDoll:819772377814532116><:OrleansDoll:819772377642041345><:HollandDoll:819772377624870973><:RussianDoll:819772377894354944><:LondonDoll:819772377856606228><:TibetanDoll:819772377482526741><:KyotoDoll:819772377440583691>\n' +
                    'Nota: si no lo haces, lo haré por ti, por aweonao <:junkNo:697321858407727224>\n' +
                    '<@&654472238510112799>, vengan a saludar po maricones <:venAqui:668644938346659851><:miyoi:674823039086624808><:venAqui2:668644951353065500>\n' +
                    `*Por cierto, ahora hay **${peoplecnt}** wnes en el server* <:meguSmile:694324892073721887>\n` +
                    'https://imgur.com/D5Z8Itb'
                ).then(sent => module.exports.askColor(sent, miembro));
                setTimeout(module.exports.askForRole, 1000, miembro, canal, 5 * 4);
                console.log('Esperando evento personalizado de Hourai Doll en unos minutos...');
            } else if(servidor.id === global.serverid.ar) {
                canal.send(
                    `Welcome to the server **${miembro.displayName}**! / ¡Bienvenido/a al server **${miembro.displayName}**!\n\n` +
                    `**EN:** To fully enjoy the server, don't forget to get 1 of the 5 main roles in the following channel~\n` +
                    '**ES:** Para disfrutar totalmente del servidor, no olvides escoger 1 de los 5 roles principales en el siguiente canal~\n\n' +
                    '→ <#611753608601403393> ←\n\n' +
                    `*Ahora hay **${peoplecnt}** usuarios en el server.*`
                );
            } else { //Otros servidores
                canal.send(
                    `¡Bienvenido al servidor **${miembro.displayName}**!\n` +
                    `*Ahora hay **${peoplecnt}** usuarios en el server.*`
                );
            }
        });
        //#endregion
        console.log('Bienvenida finalizada.');
        canal.stopTyping(true);
    },

    dibujarDespedida: async function(miembro) {
        //Dar despedida a ex-miembros de un servidor
        const servidor = miembro.guild;
        const canal = servidor.channels.cache.get(servidor.systemChannelID);

        //#region Comprobación de miembro y servidor
        if(typeof canal === 'undefined') {
            console.log('El servidor no tiene canal de mensajes de sistema.');
            return;
        }

        if(servidor.id === global.serverid.hourai) {
            const inadvertidos = [
                '225701598272290827', //Orphen
                '190681032935211008', //Sheep
                '632011537413963777', //Hikari
                //'212311832281612289', //Chise
                //'537080207580987402', //Aerza
                '263163573843263509' //Recycle
            ];

            if(inadvertidos.includes(miembro.id)) {
                servidor.owner.user.send(
                    '¡Hola, soy Bot de Puré!\n' +
                    `El miembro **<@${miembro.id}> (${miembro.id})** ha salido de tu servidor **${servidor.name}**...\n` +
                    `¡Shhh! Si bien tienes un canal de mensajes de sistema establecido, este miembro se encuentra en una lista negra de despedidas.\n\n` +
                    '*Si piensas que el usuario no debería estar en dicha lista negra, comunícate con mi creador~*\n' +
                    '*__Nota:__ Bot de Puré no opera con mensajes privados.*'
                );
                console.log('Se ha inadvertido el usuario.');
                return;
            }

            /*servidor.owner.user.send(
                '¡Hola, soy Bot de Puré!\n' +
                `El miembro **<@${miembro.id}> (${miembro.id})** ha salido de tu servidor **${servidor.name}**...\n` +
                '*__Nota:__ Bot de Puré no opera con mensajes privados.*'
            );
            
            return;*/
        }

        console.log(`Un usuario ha salido de ${servidor.name}...`);
        if(!servidor.me.permissionsIn(canal).has(['SEND_MESSAGES', 'VIEW_CHANNEL'])) {
            console.log('No se puede enviar un mensaje de despedida en este canal.');
            return;
        }
        canal.startTyping();
        //#endregion
        
        //#region Creación de imagen
        const canvas = Canvas.createCanvas(1500, 900);
        const ctx = canvas.getContext('2d');

        const fondo = await Canvas.loadImage('./fondo2.png');
        ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
        //#endregion

        //#region Texto
        //#region Propiedades de Texto
        ctx.textBaseline = 'bottom';
        ctx.shadowOffsetX = shadowOffsetY = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'black';
        ctx.fillStyle = '#ffffff';
        //#endregion

        //#region Nombre del usuario
        let Texto = `Adiós, ${miembro.displayName}`;
        let fontSize = 72;
        while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - 40);
        //#endregion
        //#endregion

        //#region Foto de Perfil
        //#region Sombra
        const ycenter = 40 + 150;
        ctx.shadowOffsetX = shadowOffsetY = 8;
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#36393f';
        ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
        ctx.fill();
        //#endregion

        //#region Dibujar foto de perfil
        ctx.beginPath();
        ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        const avatar = await Canvas.loadImage(miembro.user.displayAvatarURL({ format: 'png', dynamic: false, size: 1024 }));
        ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
        //#endregion
        //#endregion

        const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');

        //#region Imagen y Mensaje extra
        const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size;
        canal.send({files: [imagen]}).then(sent => {
            if(servidor.id === '654471968200065034') { //Hourai Doll
                canal.send(
                    'Nooooo po csm, perdimo otro weón \<:meguDerp:708064265092726834>' +
                    `*Ahora quedan **${peoplecnt}** aweonaos en el server.*`
                );
            } else { //Otros servidores
                canal.send(
                    `*Ahora hay **${peoplecnt}** usuarios en el server.*`
                );
            }
        });
        //#endregion
        console.log('Despedida finalizada.');
        canal.stopTyping();
    },

    dibujarMillion: async function(msg) {
        console.log('Evento "Uno en un Millón" desencadenado...')
        const canal = msg.channel; //Canal de mensajes de sistema
    
        //#region Creación de imagen
        const canvas = Canvas.createCanvas(1500, 750);
        const ctx = canvas.getContext('2d');
    
        const fondo = await Canvas.loadImage('./fondo3.png');
        ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
        //#endregion
    
        //#region Texto
        //#region Propiedades de texto
        ctx.textBaseline = 'bottom';
        ctx.shadowOffsetX = shadowOffsetY = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'black';
        ctx.fillStyle = '#ffffff';
        //#endregion
    
        //#region Nombre del usuario
        let Texto = `${msg.author.username}`;
        let fontSize = 72;
        while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 80);
        //#endregion
        
        //#region Texto inferior
        Texto = 'Uno en Un Millón';
        fontSize = 120;
        while(ctx.measureText(Texto).width > (canvas.width - 150)) fontSize -= 2;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - 15);
        Texto = '¡Felicidades! Tu mensaje es el destacado de';
        ctx.font = `bold 48px sans-serif`;
        ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - fontSize - 30);
        //#endregion
        //#endregion
    
        //#region Foto de Perfil
        //#region Sombra
        const ycenter = (80 + (canvas.height - fontSize - 48 - 30)) / 2;
        ctx.shadowOffsetX = shadowOffsetY = 8;
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#36393f';
        ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
        ctx.fill();
        //#endregion
    
        //#region Imagen circular
        ctx.beginPath();
        ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        const avatar = await Canvas.loadImage(msg.author.avatarURL({ format: 'png', dynamic: false, size: 1024 }));
        ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
        //#endregion
        //#endregion
    
        const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'felicidades.png');
    
        //#region Imagen y Mensaje extra
        canal.send('', imagen).then(sent => {
            if(msg.channel.guild.id === '654471968200065034') { //Hourai Doll
                canal.send(
                    `*Wao, <@${msg.author.id}>, tu mensaje fue seleccionado de entre un millón de otros mensajes. No ganaste nada, pero felicidades <:meguSmile:694324892073721887>*\n` +
                    '*Bueno, de hecho, te ganaste esta imagen personalizada para presumir a los demás tu __suerte de uno en un millón__ <:merry:670116052788838420>*\n' +
                    '```\n' +
                    `${msg.content}` +
                    '```\n'
                );
            } else { //Animal Realm
                canal.send(
                    `***ES:** ¡WOAH, FELICIDADES <@${msg.author.id}>! ¡Este mensaje fue nominado como uno en un millón!*\n` +
                    '*Realmente no ganaste nada. Pero hey, ¡ahora tienes esta imagen personalizada para presumir tu __suerte de uno en un millón__!*\n\n' +
                    `***EN:** WOAH, CONGRATZ <@${msg.author.id}>! This message has been nominated as one in a million!*\n` +
                    `*You really didn't win anything. But hey, now you have this customized image to show off your __one in a million luck__!*\n\n` +
                    '```\n' +
                    `${msg.content}` +
                    '```\n'
                );
            }
        });
        //#endregion
    
        console.log('Evento "Uno en un Millón" finalizado.');
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
            guild.members.cache.map(member => {
                let nickmatch = -1;

                nickmatch = member.user.username.toLowerCase().indexOf(temp);
                if(nickmatch === -1 && member.nickname !== null && member.nickname !== undefined) {
                    nickmatch = member.nickname.toLowerCase().indexOf(temp);
                    if(nickmatch !== -1) nickmatch += 32;
                }
                
                //console.log(`${member.user.username}: ${nickmatch} vs. ${minimum}`)
                if(minimum === -1 || (nickmatch !== -1 && nickmatch < minimum)) {
                    data = member.user;
                    minimum = nickmatch;
                }
            });

            //Buscar por nombre de usuario en resto de guilds
            if(minimum === -1)
                client.guilds.cache.filter(cguild => cguild.id !== guild.id).map(cguild => {
                    cguild.members.cache.map(member => {
                        let usermatch = -1;

                        usermatch = member.user.username.toLowerCase().indexOf(temp);
                        if(minimum === -1 || (usermatch !== -1 && usermatch < minimum)) {
                            data = member.user;
                            minimum = usermatch;
                        }
                    });
                })
            
            //console.log(data.id);
            
            if(minimum !== -1)
                data = data.id;
            else
                data = undefined;
        }

        //Retornar ID de objeto User
        return data;
    },

    randInt: function(min, max) {
        let range = max - min;
        return min + Math.floor((global.seed + range * Math.random()) % range);
    }
    //#endregion
};