import { ActionRowBuilder, SelectMenuComponentOptionData, StringSelectMenuBuilder } from 'discord.js';

export const saki = {
	config: {
		welcome: true,
		welcomePing: true,
	},
	infr: {
		channels: {
			'1107845079927894026': '♠— Pseudo Paradise —♠',
			'1107831056532525108': '♠— Forest of Dolls —♠',
			'1107831056532525106': '🤖┊botposting',
			'1107837229348442122': '🔎┊traducciones',
			'1107831056129851475': '🤖┊autómatas',
			'813189609911353385': 'gachahell',
			'813195795318177802': 'trata-de-waifus',
			'1107837472869720084': '🥛┊tetaposting',
		},
		users: {},
	},
	warn: 0,
	images: {
		welcome: 'https://i.imgur.com/inyqr67.png',
		colors: 'https://i.imgur.com/7t7m3PS.png',
		forcecolors: 'https://i.imgur.com/eHbSCHK.png',
	},
	colorsList: [
		{ emoteId: '819772377814532116', roleId: '1107840228066086952', roleName: 'French Doll',  roleDesc: 'Rojo'     },
		{ emoteId: '819772377624870973', roleId: '1107843021510291496', roleName: 'Holland Doll', roleDesc: 'Azul'     },
		{ emoteId: '819772377482526741', roleId: '1107842992858996888', roleName: 'Tibetan Doll', roleDesc: 'Verde'    },
		{ emoteId: '819772377440583691', roleId: '1107843075323203735', roleName: 'Kyoto Doll',   roleDesc: 'Púrpura'  },
		{ emoteId: '819772377856606228', roleId: '1107843093870428222', roleName: 'London Doll',  roleDesc: 'Naranja'  },
		{ emoteId: '819772377894354944', roleId: '1107843120751710218', roleName: 'Russian Doll', roleDesc: 'Amarillo' },
		{ emoteId: '819772377642041345', roleId: '1107843142608240720', roleName: 'Orléans Doll', roleDesc: 'Celeste'  },
	],
	titaniaRoleId: '1107844381630799973',
	candyRoleId: '1107831054791876692',
	hangedRoleId: '1108101434152591380',
	crucifiedRoleId: '1108101561932066836',
	announcementChannelId: '1107831056129851478',
	crazyBackupChannelId: '1107837659247812669',
	replies: {
		ignore: {
			prefix: [
				'--',
				'es-',
				'es_',
				'elixir ',
				'muñeca ',
				'chica ',
			],
			suffix: [
				'_doll',
				'doll',
				' doll',
				'fm',
				' fm',
				' victim',
				' elixir',
				' ningyou',
				'san',
				' poll',
				' girl',
			]
		},
		taunt: [
			'*¿Pero y a ti quién te invitó? <:mayuwu:1107843515385389128>*',
			'Oe qliao creo que se te cayó la tula <:pepe:1107843554526646303>',
			'Hourai puto <:knoipuais:1108537934363250780>',
			'***No hablen de esa weá <:aruStare:1107843505008689263>***',
			'Cierra el osiko tonto qliao <:yumou:1108316649553141770>',
			'¿Pero por qué no me xupai el pico mejor, así altiro? Aweonao <:junkNo:1107847991580164106>',
			'Pero no digai tantas weás po <:koipwaise:1107848000283349063>',
			'Puta que son pesaos con el Hourai <:notlikethis:1107843508779372576>',
			'**CSM NO HABLEN DE HOURAI** <:keikiPout:1107843492610318389>',
		],
		compare: [
			'***__Recuerden:__ soy objetivamente mejor que Hourai <:haniwaSmile:1107847987201318944>***',
			'**Bot > Puré > Papita > Hourai <:reibu:1107876018171162705>**',
			'Pero la reputa, dejen de compararme con esa weá <:meguDerp:1107848004775465032>',
			'*__Recuerden niñas:__ Hourai come tula 24/7 <:haniwaSmile:1107847987201318944>*',
			'Ah, te hacei el gracioso conchetumare? <:sagustare:796931141838831646>',
			'Disculpa cuál es tu problema? <:pistola:720736152348262500>',
			'Yo soy basada y Hourai es cringe <:chad:1108315385314418718>',
		],
		reply: [
			'Cállate puta <:haniwaSmile:1107847987201318944>',
			'Tu madre, por si acaso <:haniwaSmile:1107847987201318944>',
			'*Pero no seas puto <:haniwaSmile:1107847987201318944>*',
			'Qué decí? <:orinqtp:1107843510532575303>',
			'Ahhh, el culiao bravo eh? Vení que te rajo <:zunwtf:1107848235999043625>',
		],
	},
};

const roleList = (() => {
	const menuOptions: SelectMenuComponentOptionData[] = [];
	
	saki.colorsList.forEach(color => menuOptions.push({
		value: color.roleId,
		label: color.roleName,
		emoji: {
			name: color.roleName.slice(0, 3),
			id: color.emoteId,
		},
	}));
	
	return new StringSelectMenuBuilder()
		.setCustomId('colores_addColor')
		.setPlaceholder('Escoge un color...')
		.addOptions(menuOptions);
})();

export const colorsRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleList);
