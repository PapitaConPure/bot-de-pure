const Discord = require('discord.js');
const global = require('../../config.json'); //Variables globales
const uses = require('../../sguses.json'); //Variables globales
const func = require('../../func.js');
const Canvas = require('canvas');

module.exports = {
	name: 'anarquia',
	aliases: [
		'anarquía', 'a'
	],
	desc: 'Para interactuar con la __Tabla de Puré__\n' +
		'**Tabla de Puré**: tablero de 16x16 celdas de emotes ingresados por usuarios. Se reinicia cuando me reinicio\n\n' +
		'Puedes ingresar un `<emote>` en una `<posición(x,y)>` o, al no ingresar nada, ver la tabla\n' +
		'La `<posicion(x,y)>` se cuenta desde 1x,1y, y el `<emote>` designado debe ser de un server del que yo forme parte~\n\n' +
		'De forma aleatoria, puedes ir desbloqueando habilidades para rellenar líneas completas en `--horizontal` o `--vertical`. La probabilidad inicial es 1% en conjunto, y aumenta +1% por cada __nivel__\n' +
		`**Nivel**: nivel de usuario en \`${global.p_pure}anarquia\`. +1 por cada *30 usos*\n\n` +
		'Incluso si usas una habilidad de línea, debes ingresar ambos ejes (`x,y`) en orden\n' +
		`Usa \`${global.p_pure}anarquia p\` para ver tu perfil anárquico`,
	flags: [
		'common'
	],
	options: [
	  '`<posición(x,y)?>` _(número [2])_ para especificar una celda a modificar',
	  '`<emote?>` _(emote)_ para especificar un emote a agregar',
	  '`-h` o `--horizontal` para usar la habilidad de línea horizontal',
	  '`-v` o `--vertical` para usar la habilidad de línea vertical'
	],
	callx: '<posición(x,y)?> <emote?>',

	execute(message, args) {
		if(!args.length) { //Ver tabla
			const d = async () => {
				//Acción de comando
				const canvas = Canvas.createCanvas(864, 960);
				const ctx = canvas.getContext('2d');

				//#region Encabezado
				ctx.textBaseline = 'top';
				ctx.fillStyle = '#ffffff';
				ctx.strokeStyle = '#bd0924';
				ctx.lineWidth = 9;
				ctx.font = `bold 116px "headline"`;
				const Texto = 'Tabla de Puré';
				const xcenter = (canvas.width / 2) - (ctx.measureText(Texto).width / 2);
				ctx.strokeText(Texto, xcenter, 4);
				ctx.fillText(Texto, xcenter, 4);
				//#endregion

				let loademotes = {};
				const mapearEmotes = async () =>
					Promise.all(global.puretable.map(arr => 
						Promise.all(arr.slice(0).sort().filter((item, i, a) => (i > 0)?(item !== a[i - 1]):true).map(async item => {
							if(!loademotes.hasOwnProperty(item))
								loademotes[item] = await Canvas.loadImage(message.client.emojis.cache.get(item).url);
						}))
					)
				);

				mapearEmotes().then(() => {
					//Dibujar emotes en imagen
					const size = 48;
					const tx = canvas.width / 2 - size * global.puretable.length / 2;
					const ty = ctx.measureText('M').emHeightDescent + 12;
					global.puretable.map((arr, y) => {
						arr.map((item, x) => 
							ctx.drawImage(loademotes[item], tx + x * size, ty + y * size, size, size)
						);
					});
					
					const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'anarquia.png');
					message.channel.send({ files: [imagen] });
				});
			};
			d();
		} else if(args[0] === 'p') { //Revisar perfil
			const aid = (args.length > 1)?func.resolverIDUsuario(args[1], message.channel.guild, message.client):message.author.id;
			if(aid !== undefined) {
				const user = message.client.users.cache.get(aid);
				const embed = new Discord.MessageEmbed()
					.setColor('#bd0924')
					.setAuthor(user.username, user.avatarURL({ format: 'png', dynamic: true, size: 512 }));
				if(uses.anarquia[aid] !== undefined)
					embed.setTitle('Perfil anárquico')
						.addField('Inventario', `↔️ x ${uses.anarquia[aid].h}\n↕ x ${uses.anarquia[aid].v}`, true)
						.addField('Rango', `Nivel ${Math.floor(uses.anarquia[aid].exp / 30) + 1} (exp: ${uses.anarquia[aid].exp})`, true);
				else
					embed.setTitle('Perfil inexistente')
						.addField(
							'No tienes un perfil anárquico todavía', `Usa \`${global.p_pure}anarquia <posición(x,y)> <emote>\` para colocar un emote en la tabla de puré y crearte un perfil anárquico automáticamente\n` +
							`Si tienes más dudas, usa \`${global.p_pure}ayuda anarquia\``
						);
				message.channel.send(embed);
			} else message.channel.send(`:warning: Usuario **${args[1]}** no encontrado`);
		} else { //Ingresar emotes a tabla
			const aid = message.author.id;
			//Tiempo de enfriamiento por usuario
			if(uses.anarquia[aid] !== undefined) {
				if((Date.now() - uses.anarquia[aid].last) / 1000 < 3) {
					message.react('⌛');
					return;
				} else
					uses.anarquia[aid].last = Date.now();
			} else
				uses.anarquia[aid] = {
					last: Date.now(),
					h: '1',
					v: '1',
					exp: '0'
				};
			
			let h = false,
				v = false,
				e = {};
			args.map((arg, i) => {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'horizontal': h = (uses.anarquia[aid].h > 0); break;
					case 'vertical': v = (uses.anarquia[aid].v > 0); break;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 'h': h = (uses.anarquia[aid].h > 0); break;
						case 'v': v = (uses.anarquia[aid].v > 0); break;
						}
				else if(Object.keys(e).length < 4)
					if((arg.startsWith('<:') || arg.startsWith('<a:')) && arg.endsWith('>')) {
						arg = arg.slice(arg.indexOf(':') + 1, -1);
						arg = arg.slice(arg.indexOf(':') + 1);
						if(message.client.emojis.cache.get(arg) !== undefined)
							e.id = arg;
						else
							e.id = 'unresolved';
					} else if(e.x === undefined && !isNaN(arg) && !isNaN(args[i + 1])) {
						e.x = arg - 1;
						e.y = args[i + 1] - 1;
					}
			});
			
			if(Object.keys(e).length !== 3)
				message.channel.send(`:warning: Entrada inválida\nUsa \`${global.p_pure}ayuda anarquia\` para más información`);
			else if(e.id === 'unresolved')
				message.react('⚠️');
			else {
				//Insertar emote en x,y
				const stx = e.x, sty = e.y;
				e.x = Math.max(0, Math.min(e.x, global.puretable[0].length - 1));
				e.y = Math.max(0, Math.min(e.y, global.puretable.length - 1));

				const modifyAndNotify = async () => {
					if(!h && !v) global.puretable[e.y][e.x] = e.id;
					else {
						if(h) { for(let i = 0; i < global.puretable[0].length; i++) global.puretable[e.y][i] = e.id; uses.anarquia[aid].h--; }
						if(v) { for(let i = 0; i < global.puretable.length; i++)    global.puretable[i][e.x] = e.id; uses.anarquia[aid].v--; }
						await message.react('⚡');
					}

					const r = Math.random();
					console.log(`${r} < ${(1 + Math.floor(uses.anarquia[aid].exp / 30)) / 100}`);
					if(r < (1 + Math.floor(uses.anarquia[aid].exp / 30)) / 100)
						if(Math.random() < 0.5) {
							uses.anarquia[aid].h++;
							await message.react('↔️');
						} else {
							uses.anarquia[aid].v++;
							await message.react('↕️');
						}
					uses.anarquia[aid].exp++;
					if((uses.anarquia[aid].exp % 30) == 0)
						message.channel.send(`¡**${message.author.username}** subió a nivel **${Math.floor(uses.anarquia[aid].exp / 30) + 1}**!`);

					if(stx !== e.x || sty !== e.y) message.react('☑️');
					else message.react('✅');
				}

				modifyAndNotify();
				uses.anarquia[aid].last = Date.now();
			}
		}
	}
};