/**
 * @typedef {'gelbooru'|'danbooru'|'derpibooru'|'yandere'|'kcom'|'knet'} Engine
 * @typedef {Map<Boolean, String>} RestrictionsMap
 * @typedef {Map<String, String>} TagMap
 */

const basetags = '-guro -furry -vore -comic -4koma';

/**@type {RestrictionsMap}*/
const nsfwRating = new Map();
nsfwRating
    .set(true, '-rating:general -rating:sensitive')
    .set(false, '-rating:explicit -rating:questionable');

/**@type {RestrictionsMap}*/
const nsfwTags = new Map();
nsfwTags
    .set(true, '-lolicon -loli -shotacon -shota -bestiality')
    .set(false, '-breast_grab -revealing_clothes -no_bra -no_panties');

/**@type {TagMap}*/
const tmGeneral = new Map()
    //General
    .set('gif',             'animated')
    .set('boobs',           'large_breasts')
    .set('breasts',         'large_breasts')
    .set('big_breasts',     'large_breasts')
    .set('big_boobs',       'large_breasts')
    .set('large_boobs',     'large_breasts')
    //Series y tal
    .set('genshin',                'genshin_impact')
    .set('cote',                   'youkoso_jitsuryoku_shijou_shugi_no_kyoushitsu_e')
    .set('classroom_of_the_elite', 'youkoso_jitsuryoku_shijou_shugi_no_kyoushitsu_e')
    //Personajes
    .set('senko',           'senko_(sewayaki_kitsune_nosenko-san)')
    .set('shiro',           'shiro_(sewayaki_kitsune_nosenko-san)');

/**@type {TagMap}*/
const tmTouhou = new Map()
    //Protas
    .set('reimu',           'hakurei_reimu')
    .set('marisa',          'kirisame_marisa')
    //EoSD
    .set('meiling',         'hong_meiling')
    .set('patchouli',       'patchouli_knowledge')
    .set('sakuya',          'izayoi_sakuya')
    .set('remilia',         'remilia_scarlet')
    .set('flandre',         'flandre_scarlet')
    //PCB
    .set('letty',           'letty_whiterock')
    .set('alice',           'alice_margatroid')
    .set('shanghai',        'shanghai_doll')
    .set('hourai',          'hourai_doll')
    .set('lily',            'lily_white')
    .set('lyrica',          'lyrica_prismriver')
    .set('lunasa',          'lunasa_prismriver')
    .set('merlin',          'merlin_prismriver')
    .set('youmu',           'konpaku_youmu')
    .set('yuyuko',          'saigyouji_yuyuko')
    .set('ran',             'yakumo_ran')
    .set('yukari',          'yakumo_yukari')
    //IN
    .set('wriggle',         'wriggle_nightbug')
    .set('mystia',          'mystia_lorelei')
    .set('keine',           'kamishirasawa_keine')
    .set('tewi',            'inaba_tewi')
    .set('reisen',          'reisen_udongein_inaba')
    .set('eirin',           'yagokoro_eirin')
    .set('kaguya',          'houraisan_kaguya')
    .set('mokou',           'fujiwara_no_mokou')
    //PoFV
    .set('aya',             'shameimaru_aya')
    .set('medicine',        'medicine_melancholy')
    .set('yuuka',           'kazami_yuuka')
    .set('komachi',         'onozuka_komachi')
    .set('eiki',            'shiki_eiki')
    //MoF
    .set('shizuha',         'aki_shizuha')
    .set('minoriko',        'aki_minoriko')
    .set('hina',            'kagiyama_hina')
    .set('nitori',          'kawashiro_nitori')
    .set('momiji',          'inubashiri_momiji')
    .set('sanae',           'kochiya_sanae')
    .set('kanako',          'yasaka_kanako')
    .set('suwako',          'moriya_suwako')
    //SA
    .set('yamame',          'kurodani_yamame')
    .set('parsee',          'mizuhashi_parsee')
    .set('yuugi',           'hoshiguma_yuugi')
    .set('satori',          'komeiji_satori')
    .set('rin',             'kaenbyou_rin')
    .set('orin',            'kaenbyou_rin')
    .set('utsuho',          'reiuji_utsuho')
    .set('okuu',            'reiuji_utsuho')
    .set('koishi',          'komeiji_koishi')
    //UFO
    .set('kogasa',          'tatara_kogasa')
    .set('ichirin',         'kumoi_ichirin')
    .set('murasa',          'murasa_minamitsu')
    .set('shou',            'toramaru_shou')
    .set('byakuren',        'hijiri_byakuren')
    .set('nue',             'houjuu_nue')
    .set('nuee',            'houjuu_nue')
    //TD
    .set('kyouko',          'kasodani_kyouko')
    .set('yoshika',         'miyako_yoshika')
    .set('seiga',           'kaku_seiga')
    .set('tojiko',          'soga_no_tojiko')
    .set('futo',            'mononobe_no_futo')
    .set('miko',            'toyosatomimi_no_miko')
    .set('mamizou',         'futatsuiwa_mamizou')
    //DDC
    .set('kagerou',         'imaizumi_kagerou')
    .set('benben',          'tsukumo_benben')
    .set('yatsuhashi',      'tsukumo_yatsuhashi')
    .set('seija',           'kijin_seija')
    .set('sukuna',          'sukuna_shinmyoumaru')
    .set('shinmyoumaru',    'sukuna_shinmyoumaru')
    .set('raiko',           'horikawa_raiko')
    //LoLK
    .set('seiran',          'seiran*')
    .set('ringo',           'ringo*')
    .set('doremy',          'doremy_sweet')
    .set('sagume',          'kishin_sagume')
    .set('junko',           'junko_(touhou)')
    .set('hecatia',         'hecatia_lapislazuli')
    //HSiFS
    .set('eternity',        'eternity_larva')
    .set('nemuno',          'sakata_nemuno')
    .set('aun',             'komano_aun')
    .set('aunn',            'komano_aun')
    .set('komano',          'komano_aun')
    .set('narumi',          'yatadera_narumi')
    .set('satono',          'nishida_satono')
    .set('mai',             'teireida_mai')
    .set('okina',           'matara_okina')
    //WBaWC
    .set('eika',            'ebisu_eika')
    .set('urumi',           'ushizaki_urumi')
    .set('kutaka',          'niwatari_kutaka')
    .set('yachie',          'kicchou_yachie')
    .set('mayumi',          'joutouguu_mayumi')
    .set('keiki',           'haniyasushin_keiki')
    .set('saki',            'kurokoma_saki')
    //UM
    .set('mike',            'goutokuji mike')
    .set('yamashiro',       'yamashiro_takane')
    .set('takane',          'yamashiro_takane')
    .set('komakusa',        'komakusa_sannyo')
    .set('sannyo',          'komakusa_sannyo')
    .set('misumaru',        'tamatsukuri_misumaru')
    .set('tsukasa',         'kudamaki_tsukasa')
    .set('iizunamaru',      'iizunamaru_megumu')
    .set('megumu',          'iizunamaru_megumu')
    .set('tenkyuu',         'tenkyuu_chimata')
    .set('chimata',         'tenkyuu_chimata')
    .set('momoyo',          'himemushi_momoyo')
    //Fighters
    .set('suika',           'ibuki_suika')
    .set('iku',             'nagae_iku')
    .set('tenshi',          'hinanawi_tenshi')
    .set('kokoro',          'hata_no_kokoro')
    .set('usami',           'usami_sumireko')
    .set('sumireko',        'usami_sumireko')
    .set('joon',            'yorigami_jo\'on')
    .set('jo\'on',          'yorigami_jo\'on')
    .set('shion',           'yorigami_shion')
    .set('toutetsu',        'toutetsu_yuuma')
    .set('yuuma',           'toutetsu_yuuma')
    //Otros
    .set('rinnosuke',       'morichika_rinnosuke')
    .set('toyohime',        'watatsuki_no_toyohime')
    .set('yorihime',        'watatsuki_no_yorihime')
    .set('hatate',          'himekaidou_hatate')
    .set('luna',            'luna_child')
    .set('star',            'star_sapphire')
    .set('sunny',           'sunny_milk')
    .set('kosuzu',          'motoori_kosuzu')
    .set('maribel',         'maribel_hearn')
    .set('merry',           'maribel_hearn')
    .set('renko',           'usami_renko')
    .set('akyuu',           'hieda_no_akyuu')
    .set('kasen',           'ibaraki_kasen')
    .set('miyoi',           'okunoda_miyoi')
    .set('tokiko',          'tokiko_(touhou)');

/**@type {TagMap}*/
const tmVirtualYoutuber = new Map()
    //Agencias y grupos
    .set('holo',            'hololive')
    .set('holoen',          'hololive_english')
    .set('hololive_en',     'hololive_english')
    .set('holoid',          'hololive_indonesia')
    .set('hololive_id',     'hololive_indonesia')
    .set('hologamers',      'hololive_gamers')
    .set('hololive_gamers', 'hololive_gamers')
    .set('niji',            'nijisanji')
    .set('nijien',          'nijisanji_en')
    .set('niji_en',         'nijisanji_en')
    .set('nijikr',          'nijisanji_kr')
    .set('niji_kr',         'nijisanji_kr')
    .set('vshojo',          'nijisanji_kr')
    //Hololive Gen 0
    .set('sora',            'tokino_sora')
    .set('miko',            'sakura_miko')
    .set('suisei',          'hoshimachi_suisei')
    .set('roboco',          'roboco-san')
    .set('azki',            'azki_(hololive)')
    //Hololive Gen 1
    .set('matsuri',         'natsuiro_matsuri')
    .set('haato',           'akai_haato')
    .set('haachama',        'akai_haato')
    .set('mel',             'yozora_mel')
    .set('fubuki',          'shirakami_fubuki')
    .set('aki',             'aki_rosenthal')
    .set('akirose',         'aki_rosenthal')
    //Hololive Gen 2
    .set('aqua',            'minato_aqua')
    .set('shion',           'murasaki_shion')
    .set('nakiri',          'nakiri_ayame')
    .set('ayame',           'nakiri_ayame')
    .set('subaru',          'oozora_subaru')
    .set('choco',           'yuzuki_choco')
    //Hololive Gamers
    .set('korone',          'inugami_korone')
    .set('mio',             'ookami_mio')
    .set('okayu',           'nekomata_okayu')
    //Hololive Gen 3
    .set('marine',          'houshou_marine')
    .set('pekora',          'usada_pekora')
    .set('rushia',          'uruha_rushia')
    .set('noel',            'shirogane_noel')
    .set('flare',           'shiranui_flare')
    //Hololive Gen 4
    .set('coco',            'kiryu_coco')
    .set('kanata',          'amane_kanata')
    .set('luna',            'himemori_luna')
    .set('towa',            'tokoyami_towa')
    .set('watame',          'tsunomaki_watame')
    //Hololive Gen 5
    .set('aloe',            'mano_aloe')
    .set('polka',           'omaru_polka')
    .set('lamy',            'yukihana_lamy')
    .set('botan',           'shishiro_botan')
    .set('nene',            'momosuzu_nene')
    .set('nenechi',         'momosuzu_nene')
    //Hololive EN Myth
    .set('calli',           'mori_calliope')
    .set('calliope',        'mori_calliope')
    .set('amelia',          'watson_amelia')
    .set('gura',            'gawr_gura')
    .set('kiara',           'takanashi_kiara')
    .set('ina',             'ninomae_ina\'nis')
    //Hololive EN Council
    .set('sana',            'tsukumo_sana')
    .set('fauna',           'ceres_fauna')
    .set('kronii',          'ouro_kronii')
    .set('mumei',           'nanashi_mumei')
    .set('bae',             'hakos_baelz')
    .set('baelz',           'hakos_baelz')
    //HoloID Gen 1
    .set('risu',            'ayunda_risu')
    .set('moona',           'moona_hoshinova')
    .set('iofi',            'airani_iofifteen')
    //HoloID Gen 2
    .set('ollie',           'kureiji_ollie')
    .set('melfissa',        'anya_melfissa')
    .set('reine',           'pavolia_reine')
    //Holostars Gen 1
    .set('miyabi',          'hanasaki_miyabi')
    .set('izuru',           'kanade_izuru')
    .set('aruran',          'arurandeisu')
    .set('rikka',           'rikka_(holostars)')
    //Holostars Gen 2
    .set('astel',           'astel_leda')
    .set('temma',           'kishido_temma')
    .set('roberu',          'yukoku_roberu')
    //Holostars Gen 3
    .set('shien',           'kageyama_shien')
    .set('oga',             'aragami_oga')
    //Hololive Management
    .set('a-chan',          'a-chan_(hololive)')
    .set('a_chan',          'a-chan_(hololive)')
    .set('shinove',         'daidou_shinove')
    //VOMS
    .set('pikamee',         'amano_pikamee')
    .set('tomoshika',       'hikasa_tomoshika')
    .set('monoe',           'jitomi_monoe')
    //VShojo
    .set('nyanners',        'nyatasha_nyanners')
    .set('melody',          'projektmelody')
    .set('vei',             'vei_(vtuber)')
    .set('veibae',          'vei_(vtuber)')
    .set('apricot',         'bsapricot_(vtuber)')
    .set('froot',           'bsapricot_(vtuber)')
    .set('zentreya',        'zentreya_(vtuber)')
    .set('hime',            'hime_hajime')
    //Independientes
    .set('kizuna',          'kizuna_ai')
    .set('tamaki',          'inuyama_tamaki')
    .set('kana',            'kamiko_kana');

/**@type {TagMap}*/
const tmMegumin = new Map()
    .set('kazuma',          'satou_kazuma')
    .set('aqua',            'aqua_(konosuba)')
    .set('darkness',        'darkness_(konosuba)')
    .set('chris',           'chris_(konosuba)')
    .set('wiz',             'wiz_(konosuba)')
    .set('yunyun',          'yunyun_(konosuba)')
    .set('iris',            'iris_(konosuba)')
    .set('cecily',          'cecily_(konosuba)')
    .set('arue',            'arue_(konosuba)')
    .set('mitsurugi',       'mitsurugi_kyouya')
    .set('dust',            'dust_(konosuba)')
    .set('rin',             'lean_(konosuba)')
    .set('lean',            'lean_(konosuba)')
    .set('lia',             'leah_(konosuba)')
    .set('cielo',           'cello_(konosuba)')
    .set('erika',           'erika_(konosuba)')
    .set('melissa',         'melissa_(konosuba)')
    .set('mia',             'miia_(konosuba)')
    .set('amy',             'amy_(konosuba)')
    .set('eris',            'eris_(konosuba)')
    .set('luna',            'luna_(konosuba)')
    .set('rain',            'rain_(konosuba)')
    .set('claire',          'claire_(konosuba)')
    .set('dodonko',         'dodonko_(konosuba)')
    .set('sylvia',          'sylvia_(kono_subarashii_sekai_ni_shukufuku_wo!)');

const tagMaps = {
    general:          tmGeneral,
    touhou:           tmTouhou,
    virtual_youtuber: tmVirtualYoutuber,
    megumin:          tmMegumin,
};

/**
 * @param {String} tag 
 * @param {TagMap} tagMap 
 */
function normalizeTag(tag, tagMap) {
    tag = tag.toLowerCase();
    return tagMaps.general.get(tag) || tagMap?.get(tag) || tag;
}

module.exports = {
    /**
     * Devuelve tags base para un determinado canal y motor
     * @param {Engine} engine 
     * @param {Boolean} nsfw 
     * @returns Tags base junto a tags específicas al canal y motor, separadas por espacios
     */
    getBaseTags: (engine, nsfw) => {
        if(['danbooru', 'derpibooru', 'yandere', 'kcom', 'knet'].includes(engine))
            return `rating:${nsfwRating.get(nsfw)}`;
        return [basetags, nsfwRating.get(nsfw), nsfwTags.get(nsfw)].join(' ');
    },
    /**
     * Devuelve tags de búsqueda, reemplazando palabras vagas comunes de un cierto comando por tags reales para un determinado motor
     * @param {Array<String>} words Las palabras a ser usadas como tags
     * @param {'gelbooru'|'danbooru'} engine El motor utilizado para la búsqueda
     * @param {keyof tagMaps} tagMapId La ID del Map en el cuál buscar las palabras vagas comunes; depende del comando
     * @returns Tags de búsqueda normalizadas para el comando y engine utilizados
     */
    getSearchTags: (words, engine, tagMapId) => {
        if(engine === 'danbooru') return '';
        const tagMap = tagMaps[tagMapId];
        return words.map(word => normalizeTag(word, tagMap)).join(' ');
    },
    tagMaps,
};