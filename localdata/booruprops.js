const { sites } = require('booru');

module.exports = {
    engines: Object.values(sites).map(s => s.aliases[s.aliases.length - 1]),
	basetags: '-guro -furry -vore -webm -audio -comic -4koma',
	nsfwrating: {
		[true]: 'explicit',
		[false]: 'safe'
	},
	nsfwtags: {
		[true]: '-lolicon -loli -shotacon -shota -bestiality',
		[false]: '-breast_grab -revealing_clothes -no_bra -no_panties'
	},
    getBaseTags: (engine, nsfw) => {
        const { basetags, nsfwrating, nsfwtags } = module.exports;
        if(['danbooru', 'derpibooru', 'yandere', 'kcom', 'knet'].includes(engine)) return `rating:${nsfwrating[nsfw]}`;
        else return [basetags, `rating:${nsfwrating[nsfw]}`, nsfwtags[nsfw]].join(' ');
    },
    getSearchTags: (args, engine) => (engine !== 'danbooru')
        ?   args.map(arg => {
                arg = arg.toLowerCase();
                return module.exports.tagsMap.get(arg) || arg
            }).join(' ')
        : '',
    tagsMap: (() => new Map()
        //General
        .set('gif', 'animated')
        .set('breasts', 'large_breasts')
        .set('big_breasts', 'large_breasts')
        //Protas
        .set('reimu', 'hakurei_reimu')
        .set('marisa', 'kirisame_marisa')
        //EoSD
        .set('meiling', 'hong_meiling')
        .set('patchouli', 'patchouli_knowledge')
        .set('sakuya', 'izayoi_sakuya')
        .set('remilia', 'remilia_scarlet')
        .set('flandre', 'flandre_scarlet')
        //PCB
        .set('letty', 'letty_whiterock')
        .set('alice', 'alice_margatroid')
        .set('shanghai', 'shanghai_doll')
        .set('hourai', 'hourai_doll')
        .set('lily', 'lily_white')
        .set('lyrica', 'lyrica_prismriver')
        .set('lunasa', 'lunasa_prismriver')
        .set('merlin', 'merlin_prismriver')
        .set('youmu', 'konpaku_youmu')
        .set('yuyuko', 'saigyouji_yuyuko')
        .set('ran', 'yakumo_ran')
        .set('yukari', 'yakumo_yukari')
        //IN
        .set('wriggle', 'wriggle_nightbug')
        .set('mystia', 'mystia_lorelei')
        .set('keine', 'kamishirasawa_keine')
        .set('tewi', 'inaba_tewi')
        .set('reisen', 'reisen_udongein_inaba')
        .set('eirin', 'yagokoro_eirin')
        .set('kaguya', 'houraisan_kaguya')
        .set('mokou', 'fujiwara_no_mokou')
        //PoFV
        .set('aya', 'shameimaru_aya')
        .set('medicine', 'medicine_melancholy')
        .set('yuuka', 'kazami_yuuka')
        .set('komachi', 'onozuka_komachi')
        .set('eiki', 'shiki_eiki')
        //MoF
        .set('shizuha', 'aki_shizuha')
        .set('minoriko', 'aki_minoriko')
        .set('hina', 'kagiyama_hina')
        .set('nitori', 'kawashiro_nitori')
        .set('momiji', 'inubashiri_momiji')
        .set('sanae', 'kochiya_sanae')
        .set('kanako', 'yasaka_kanako')
        .set('suwako', 'moriya_suwako')
        //SA
        .set('yamame', 'kurodani_yamame')
        .set('parsee', 'mizuhashi_parsee')
        .set('yuugi', 'hoshiguma_yuugi')
        .set('satori', 'komeiji_satori')
        .set('rin', 'kaenbyou_rin')
        .set('orin', 'kaenbyou_rin')
        .set('utsuho', 'reiuji_utsuho')
        .set('okuu', 'reiuji_utsuho')
        .set('koishi', 'komeiji_koishi')
        //UFO
        .set('kogasa', 'tatara_kogasa')
        .set('ichirin', 'kumoi_ichirin')
        .set('murasa', 'murasa_minamitsu')
        .set('shou', 'toramaru_shou')
        .set('byakuren', 'hijiri_byakuren')
        .set('nue', 'houjuu_nue')
        .set('nuee', 'houjuu_nue')
        //TD
        .set('kyouko', 'kasodani_kyouko')
        .set('yoshika', 'miyako_yoshika')
        .set('seiga', 'kaku_seiga')
        .set('tojiko', 'soga_no_tojiko')
        .set('futo', 'mononobe_no_futo')
        .set('miko', 'toyosatomimi_no_miko')
        .set('mamizou', 'futatsuiwa_mamizou')
        //DDC
        .set('kagerou', 'imaizumi_kagerou')
        .set('benben', 'tsukumo_benben')
        .set('yatsuhashi', 'tsukumo_yatsuhashi')
        .set('seija', 'kijin_seija')
        .set('sukuna', 'sukuna_shinmyoumaru')
        .set('shinmyoumaru', 'sukuna_shinmyoumaru')
        .set('raiko', 'horikawa_raiko')
        //LoLK
        .set('seiran', 'seiran*')
        .set('ringo', 'ringo*')
        .set('doremy', 'doremy_sweet')
        .set('sagume', 'kishin_sagume')
        .set('junko', 'junko_(touhou)')
        .set('hecatia', 'hecatia_lapislazuli')
        //HSiFS
        .set('eternity', 'eternity_larva')
        .set('nemuno', 'sakata_nemuno')
        .set('aun', 'komano_aun')
        .set('aunn', 'komano_aun')
        .set('komano', 'komano_aun')
        .set('narumi', 'yatadera_narumi')
        .set('satono', 'nishida_satono')
        .set('mai', 'teireida_mai')
        .set('okina', 'matara_okina')
        //WBaWC
        .set('eika', 'ebisu_eika')
        .set('urumi', 'ushizaki_urumi')
        .set('kutaka', 'niwatari_kutaka')
        .set('yachie', 'kicchou_yachie')
        .set('mayumi', 'joutouguu_mayumi')
        .set('keiki', 'haniyasushin_keiki')
        .set('saki', 'kurokoma_saki')
        //UM
        .set('mike', 'goutokuji mike')
        .set('yamashiro', 'yamashiro_takane')
        .set('takane', 'yamashiro_takane')
        .set('komakusa', 'komakusa_sannyo')
        .set('sannyo', 'komakusa_sannyo')
        .set('misumaru', 'tamatsukuri_misumaru')
        .set('tsukasa', 'kudamaki_tsukasa')
        .set('iizunamaru', 'iizunamaru_megumu')
        .set('megumu', 'iizunamaru_megumu')
        .set('tenkyuu', 'tenkyuu_chimata')
        .set('chimata', 'tenkyuu_chimata')
        .set('momoyo', 'himemushi_momoyo')
        //Fighters
        .set('suika', 'ibuki_suika')
        .set('iku', 'nagae_iku')
        .set('tenshi', 'hinanawi_tenshi')
        .set('kokoro', 'hata_no_kokoro')
        .set('usami', 'usami_sumireko')
        .set('sumireko', 'usami_sumireko')
        .set('joon', 'yorigami_jo\'on')
        .set('jo\'on', 'yorigami_jo\'on')
        .set('shion', 'yorigami_shion')
        //Otros
        .set('rinnosuke', 'morichika_rinnosuke')
        .set('toyohime', 'watatsuki_no_toyohime')
        .set('yorihime', 'watatsuki_no_yorihime')
        .set('hatate', 'himekaidou_hatate')
        .set('luna', 'luna_child')
        .set('star', 'star_sapphire')
        .set('sunny', 'sunny_milk')
        .set('kosuzu', 'motoori_kosuzu')
        .set('maribel', 'maribel_hearn')
        .set('merry', 'maribel_hearn')
        .set('renko', 'usami_renko')
        .set('akyuu', 'hieda_no_akyuu')
        .set('kasen', 'ibaraki_kasen')
        .set('miyoi', 'okunoda_miyoi')
        .set('tokiko', 'tokiko_(touhou)')
    )()
}