module.exports = {
    setTags() {
        const tagmap = new Map();
        tagmap.set('gif', 'animated');
        tagmap.set('breasts', 'large_breasts');
        tagmap.set('big_breasts', 'large_breasts');
        tagmap.set('reimu', 'hakurei_reimu');
        tagmap.set('marisa', 'kirisame_marisa');
        tagmap.set('meiling', 'hong_meiling');
        tagmap.set('patchouli', 'patchouli_knowledge');
        tagmap.set('sakuya', 'izayoi_sakuya');
        tagmap.set('remilia', 'remilia_scarlet');
        tagmap.set('flandre', 'flandre_scarlet');
        tagmap.set('letty', 'letty_whiterock');
        tagmap.set('alice', 'alice_margatroid');
        tagmap.set('shanghai', 'shanghai_doll');
        tagmap.set('hourai', 'hourai_doll');
        tagmap.set('lily', 'lily_white');
        tagmap.set('lyrica', 'lyrica_prismriver');
        tagmap.set('lunasa', 'lunasa_prismriver');
        tagmap.set('merlin', 'merlin_prismriver');
        tagmap.set('youmu', 'konpaku_youmu');
        tagmap.set('yuyuko', 'saigyouji_yuyuko');
        tagmap.set('ran', 'yakumo_ran');
        tagmap.set('yukari', 'yakumo_yukari');
        tagmap.set('wriggle', 'wriggle_nightbug');
        tagmap.set('mystia', 'mystia_lorelei');
        tagmap.set('keine', 'kamishirasawa_keine');
        tagmap.set('tewi', 'inaba_tewi');
        tagmap.set('reisen', 'reisen_udongein_inaba');
        tagmap.set('eirin', 'yagokoro_eirin');
        tagmap.set('kaguya', 'houraisan_kaguya');
        tagmap.set('mokou', 'fujiwara_no_mokou');
        tagmap.set('aya', 'shameimaru_aya');
        tagmap.set('medicine', 'medicine_melancholy');
        tagmap.set('yuuka', 'kazami_yuuka');
        tagmap.set('komachi', 'onozuka_komachi');
        tagmap.set('eiki', 'shiki_eiki');
        tagmap.set('shizuha', 'aki_shizuha');
        tagmap.set('minoriko', 'aki_minoriko');
        tagmap.set('hina', 'kagiyama_hina');
        tagmap.set('nitori', 'kawashiro_nitori');
        tagmap.set('momiji', 'inubashiri_momiji');
        tagmap.set('sanae', 'kochiya_sanae');
        tagmap.set('kanako', 'yasaka_kanako');
        tagmap.set('suwako', 'moriya_suwako');
        tagmap.set('yamame', 'kurodani_yamame');
        tagmap.set('parsee', 'mizuhashi_parsee');
        tagmap.set('yuugi', 'hoshiguma_yuugi');
        tagmap.set('satori', 'komeiji_satori');
        tagmap.set('rin', 'kaenbyou_rin');
        tagmap.set('orin', 'kaenbyou_rin');
        tagmap.set('utsuho', 'reiuji_utsuho');
        tagmap.set('okuu', 'reiuji_utsuho');
        tagmap.set('koishi', 'komeiji_koishi');
        tagmap.set('kogasa', 'tatara_kogasa');
        tagmap.set('ichirin', 'kumoi_ichirin');
        tagmap.set('murasa', 'murasa_minamitsu');
        tagmap.set('shou', 'toramaru_shou');
        tagmap.set('byakuren', 'hijiri_byakuren');
        tagmap.set('nue', 'houjuu_nue');
        tagmap.set('nuee', 'houjuu_nue');
        tagmap.set('kyouko', 'kasodani_kyouko');
        tagmap.set('yoshika', 'miyako_yoshika');
        tagmap.set('seiga', 'kaku_seiga');
        tagmap.set('tojiko', 'soga_no_tojiko');
        tagmap.set('futo', 'mononobe_no_futo');
        tagmap.set('miko', 'toyosatomimi_no_miko');
        tagmap.set('mamizou', 'futatsuiwa_mamizou');
        tagmap.set('kagerou', 'imaizumi_kagerou');
        tagmap.set('benben', 'tsukumo_benben');
        tagmap.set('yatsuhashi', 'tsukumo_yatsuhashi');
        tagmap.set('seija', 'kijin_seija');
        tagmap.set('sukuna', 'sukuna_shinmyoumaru');
        tagmap.set('shinmyoumaru', 'sukuna_shinmyoumaru');
        tagmap.set('raiko', 'horikawa_raiko');
        tagmap.set('seiran', 'seiran*');
        tagmap.set('ringo', 'ringo*');
        tagmap.set('doremy', 'doremy_sweet');
        tagmap.set('sagume', 'kishin_sagume');
        tagmap.set('junko', 'junko');
        tagmap.set('hecatia', 'hecatia_lapislazuli');
        tagmap.set('eternity', 'eternity_larva');
        tagmap.set('nemuno', 'sakata_nemuno');
        tagmap.set('aun', 'komano_aun');
        tagmap.set('aunn', 'komano_aun');
        tagmap.set('komano', 'komano_aun');
        tagmap.set('narumi', 'yatadera_narumi');
        tagmap.set('satono', 'nishida_satono');
        tagmap.set('mai', 'teireida_mai');
        tagmap.set('okina', 'matara_okina');
        tagmap.set('eika', 'ebisu_eika');
        tagmap.set('urumi', 'ushizaki_urumi');
        tagmap.set('kutaka', 'niwatari_kutaka');
        tagmap.set('yachie', 'kicchou_yachie');
        tagmap.set('mayumi', 'joutouguu_mayumi');
        tagmap.set('keiki', 'haniyasushin_keiki');
        tagmap.set('saki', 'kurokoma_saki');
        tagmap.set('suika', 'ibuki_suika');
        tagmap.set('iku', 'nagae_iku');
        tagmap.set('tenshi', 'hinanawi_tenshi');
        tagmap.set('kokoro', 'hata_no_kokoro');
        tagmap.set('usami', 'usami_sumireko');
        tagmap.set('sumireko', 'usami_sumireko');
        tagmap.set('joon', 'yorigami_jo\'on');
        tagmap.set('jo\'on', 'yorigami_jo\'on');
        tagmap.set('shion', 'yorigami_shion');
        tagmap.set('rinnosuke', 'morichika_rinnosuke');
        tagmap.set('toyohime', 'watatsuki_no_toyohime');
        tagmap.set('yorihime', 'watatsuki_no_yorihime');
        tagmap.set('hatate', 'himekaidou_hatate');
        tagmap.set('luna', 'luna_child');
        tagmap.set('star', 'star_sapphire');
        tagmap.set('sunny', 'sunny_milk');
        tagmap.set('kosuzu', 'motoori_kosuzu');
        tagmap.set('maribel', 'maribel_hearn');
        tagmap.set('merry', 'maribel_hearn');
        tagmap.set('renko', 'usami_renko');
        tagmap.set('akyuu', 'hieda_no_akyuu');
        tagmap.set('kasen', 'ibaraki_kasen');
        tagmap.set('miyoi', 'okunoda_miyoi');
        tagmap.set('tokiko', 'tokiko_(touhou)');
        return tagmap;
    }
}