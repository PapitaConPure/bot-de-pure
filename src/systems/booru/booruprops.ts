export type Engine = 'gelbooru' | 'danbooru' | 'derpibooru' | 'yandere' | 'kcom' | 'knet';

export type RestrictionsMap = Map<boolean, string>;

export type TagMap = Map<string, string>;

const basetags = '-guro -furry -vore -comic -4koma';

const nsfwRating: RestrictionsMap = new Map();
nsfwRating
	.set(true, '-rating:general -rating:sensitive')
	.set(false, '-rating:explicit -rating:questionable');

const nsfwTags: RestrictionsMap = new Map();
nsfwTags
	.set(true, '-lolicon -loli -shotacon -shota -bestiality')
	.set(false, '-breast_grab -revealing_clothes -no_bra -no_panties');

const tmGeneral: TagMap = new Map()
	//General
	.set('gif', 'animated')
	.set('boobs', 'large_breasts')
	.set('breasts', 'large_breasts')
	.set('big_breasts', 'large_breasts')
	.set('big_boobs', 'large_breasts')
	.set('large_boobs', 'large_breasts')
	//Series y tal
	.set('genshin', 'genshin_impact')
	.set('cote', 'youkoso_jitsuryoku_shijou_shugi_no_kyoushitsu_e')
	.set('classroom_of_the_elite', 'youkoso_jitsuryoku_shijou_shugi_no_kyoushitsu_e')
	//Personajes
	.set('senko', 'senko_(sewayaki_kitsune_nosenko-san)')
	.set('shiro', 'shiro_(sewayaki_kitsune_nosenko-san)');

const tmTouhou: TagMap = new Map()
	//Main characters
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
	//UDoALG
	.set('son', 'son_biten')
	.set('biten', 'son_biten')
	.set('enoko', 'mitsugashira_enoko')
	.set('mitsugashira', 'mitsugashira_enoko')
	.set('chiyari', 'tenkajin_chiyari')
	.set('hisami', 'yomotsu_hisami')
	.set('zanmu', 'nippaku_zanmu')
	.set('nippaku', 'nippaku_zanmu')
	//FW
	.set('ubame', 'chirizuka_ubame')
	.set('chirizuka', 'chirizuka_ubame')
	.set('chimi', 'houjuu_chimi')
	.set('nareko', 'michigami_nareko')
	.set('yuiman', 'yuiman_asama')
	.set('ariya', 'iwanaga_ariya')
	.set('iwanaga', 'iwanaga_ariya')
	.set('nina', 'watari_nina')
	//Fighters
	.set('suika', 'ibuki_suika')
	.set('iku', 'nagae_iku')
	.set('tenshi', 'hinanawi_tenshi')
	.set('kokoro', 'hata_no_kokoro')
	.set('usami', 'usami_sumireko')
	.set('sumireko', 'usami_sumireko')
	.set('joon', "yorigami_jo'on")
	.set("jo'on", "yorigami_jo'on")
	.set('shion', 'yorigami_shion')
	.set('toutetsu', 'toutetsu_yuuma')
	.set('yuuma', 'toutetsu_yuuma')
	//Other
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
	.set('tokiko', 'tokiko_(touhou)');

const tmVirtualYoutuber: TagMap = new Map()
	//Agencies and groups
	.set('holo', 'hololive')
	.set('holoen', 'hololive_english')
	.set('hololive_en', 'hololive_english')
	.set('holoid', 'hololive_indonesia')
	.set('hololive_id', 'hololive_indonesia')
	.set('hologamers', 'hololive_gamers')
	.set('hololive_gamers', 'hololive_gamers')
	.set('niji', 'nijisanji')
	.set('nijien', 'nijisanji_en')
	.set('niji_en', 'nijisanji_en')
	.set('nijikr', 'nijisanji_kr')
	.set('niji_kr', 'nijisanji_kr')
	.set('vshojo', 'nijisanji_kr')
	//hololive Gen 0
	.set('sora', 'tokino_sora')
	.set('miko', 'sakura_miko')
	.set('suisei', 'hoshimachi_suisei')
	.set('roboco', 'roboco-san')
	.set('azki', 'azki_(hololive)')
	//hololive Gen 1
	.set('matsuri', 'natsuiro_matsuri')
	.set('haato', 'akai_haato')
	.set('haachama', 'akai_haato')
	.set('mel', 'yozora_mel')
	.set('fubuki', 'shirakami_fubuki')
	.set('aki', 'aki_rosenthal')
	.set('akirose', 'aki_rosenthal')
	//hololive Gen 2
	.set('aqua', 'minato_aqua')
	.set('shion', 'murasaki_shion')
	.set('nakiri', 'nakiri_ayame')
	.set('ayame', 'nakiri_ayame')
	.set('subaru', 'oozora_subaru')
	.set('choco', 'yuzuki_choco')
	//Hololive Gamers
	.set('korone', 'inugami_korone')
	.set('mio', 'ookami_mio')
	.set('okayu', 'nekomata_okayu')
	//hololive Gen 3
	.set('marine', 'houshou_marine')
	.set('pekora', 'usada_pekora')
	.set('rushia', 'uruha_rushia')
	.set('noel', 'shirogane_noel')
	.set('flare', 'shiranui_flare')
	//hololive Gen 4
	.set('coco', 'kiryu_coco')
	.set('kanata', 'amane_kanata')
	.set('luna', 'himemori_luna')
	.set('towa', 'tokoyami_towa')
	.set('watame', 'tsunomaki_watame')
	//hololive Gen 5
	.set('aloe', 'mano_aloe')
	.set('polka', 'omaru_polka')
	.set('lamy', 'yukihana_lamy')
	.set('botan', 'shishiro_botan')
	.set('nene', 'momosuzu_nene')
	.set('nenechi', 'momosuzu_nene')
	//holoX
	.set('laplus', 'la+_darknesss')
	.set('la+', 'la+_darknesss')
	.set('darkness', 'la+_darknesss')
	.set('lui', 'takane_lui')
	.set('koyori', 'hakui_koyori')
	.set('chloe', 'sakamata_chloe')
	.set('iroha', 'kazama_iroha')
	//HoloEN Myth
	.set('mori', 'mori_calliope')
	.set('calli', 'mori_calliope')
	.set('calliope', 'mori_calliope')
	.set('ame', 'watson_amelia')
	.set('amelia', 'watson_amelia')
	.set('gura', 'gawr_gura')
	.set('kiara', 'takanashi_kiara')
	.set('ina', "ninomae_ina'nis")
	//HoloEN Council
	.set('sana', 'tsukumo_sana')
	.set('fauna', 'ceres_fauna')
	.set('kronii', 'ouro_kronii')
	.set('mumei', 'nanashi_mumei')
	.set('bae', 'hakos_baelz')
	.set('hakos', 'hakos_baelz')
	.set('baelz', 'hakos_baelz')
	//HoloEN Project: HOPE
	.set('irys', 'irys_(hololive)')
	//HoloEN Advent
	.set('shiori', 'shiori_novella')
	.set('novella', 'shiori_novella')
	.set('shiorin', 'shiori_novella')
	.set('bijou', 'koseki_bijou')
	.set('koseki', 'koseki_bijou')
	.set('biboo', 'koseki_bijou')
	.set('nerissa', 'nerissa_ravencroft')
	.set('ravencroft', 'nerissa_ravencroft')
	.set('rissa', 'nerissa_ravencroft')
	.set('fuwawa', 'fuwawa_abyssgard')
	.set('mococo', 'mococo_abyssgard')
	.set('mocochan', 'mococo_abyssgard')
	.set('mogojan', 'mococo_abyssgard')
	.set('fuwamoco', 'fuwawa_abyssgard mococo_abyssgard')
	//HoloEN Justice
	.set('elizabeth', 'elizabeth_rose_bloodflame')
	.set('liz', 'elizabeth_rose_bloodflame')
	.set('gigi', 'gigi_murin')
	.set('cecilia', 'cecilia_immergreen')
	.set('immergreen', 'cecilia_immergreen')
	.set('raora', 'raora_panthera')
	//HoloID Gen 1
	.set('risu', 'ayunda_risu')
	.set('moona', 'moona_hoshinova')
	.set('iofi', 'airani_iofifteen')
	//HoloID Gen 2
	.set('ollie', 'kureiji_ollie')
	.set('anya', 'anya_melfissa')
	.set('melfissa', 'anya_melfissa')
	.set('reine', 'pavolia_reine')
	//HoloID Gen 3
	.set('zeta', 'vestia_zeta')
	.set('vestia', 'vestia_zeta')
	.set('kaela', 'kaela_kovalskia')
	.set('kovalskia', 'kaela_kovalskia')
	.set('kobo', 'kobo_kanaeru')
	.set('kanaeru', 'kobo_kanaeru')
	//Holostars JP Gen 1
	.set('miyabi', 'hanasaki_miyabi')
	.set('izuru', 'kanade_izuru')
	.set('aruran', 'arurandeisu')
	.set('rikka', 'rikka_(holostars)')
	//Holostars JP Gen 2
	.set('astel', 'astel_leda')
	.set('temma', 'kishido_temma')
	.set('roberu', 'yukoku_roberu')
	//Holostars JP Gen 3
	.set('shien', 'kageyama_shien')
	.set('oga', 'aragami_oga')
	//Holostars JP UPROAR!!
	.set('fuma', 'yatogami_fuma')
	.set('yatogami', 'yatogami_fuma')
	.set('uyu', 'utsugi_uyu')
	.set('utsugi', 'utsugi_uyu')
	.set('rio', 'minase_rio')
	.set('minase', 'minase_rio')
	.set('gamma', 'hizaki_gamma')
	.set('hizaki', 'hizaki_gamma')
	//Holostars EN TEMPUS
	.set('regis', 'regis_altare')
	.set('altare', 'regis_altare')
	.set('axel', 'axel_syrios')
	.set('syrios', 'axel_syrios')
	.set('magni', 'magni_dezmond')
	.set('dezmond', 'magni_dezmond')
	.set('vesper', 'noir_vesper')
	//Holostars EN TEMPUS Vanguard
	.set('bettel', 'gavis_bettel')
	.set('gavis', 'gavis_bettel')
	.set('flayon', 'machina_x_flayon')
	.set('hakka', 'banzoin_hakka')
	.set('banzoin', 'banzoin_hakka')
	.set('shinri', 'josuiji_shinri')
	.set('josuiji', 'josuiji_shinri')
	//Holostars EN ARMIS
	.set('jurard', 'jurard_t_rexford')
	.set('crimzon', 'crimzon_ruze')
	.set('ruze', 'crimzon_ruze')
	//Hololive DEV_IS ReGLOSS
	.set('kanade', 'otonose_kanade')
	.set('otonose', 'otonose_kanade')
	.set('monday', 'otonose_kanade')
	.set('getsuyoubi', 'otonose_kanade')
	.set('monday-chan', 'otonose_kanade')
	.set('ririka', 'ichijou_ririka')
	.set('ichijou', 'ichijou_ririka')
	.set('raden', 'juufuutei_raden')
	.set('juufuutei', 'juufuutei_raden')
	.set('hajime', 'todoroki_hajime')
	.set('todoroki', 'todoroki_hajime')
	.set('bancho', 'todoroki_hajime')
	.set('banchou', 'todoroki_hajime')
	.set('ao', 'hiodoshi_ao')
	.set('hiodoshi', 'hiodoshi_ao')
	//Hololive DEV_IS FLOW GLOW
	.set('riona', 'isaki_riona')
	.set('isaki', 'isaki_riona')
	.set('niko', 'koganei_niko')
	.set('koganei', 'koganei_niko')
	.set('su', 'mizumiya_su')
	.set('mizumiya', 'mizumiya_su')
	.set('chihaya', 'rindo_chihaya')
	.set('rindo', 'rindo_chihaya')
	.set('vivi', 'kikirara_vivi')
	.set('kikirara', 'kikirara_vivi')
	//Hololive Management
	.set('a-chan', 'a-chan_(hololive)')
	.set('a_chan', 'a-chan_(hololive)')
	.set('shinove', 'daidou_shinove')
	//VOMS
	.set('pikamee', 'amano_pikamee')
	.set('tomoshika', 'hikasa_tomoshika')
	.set('monoe', 'jitomi_monoe')
	//VShojo
	.set('nyanners', 'nyatasha_nyanners')
	.set('melody', 'projektmelody')
	.set('vei', 'vei_(vtuber)')
	.set('veibae', 'vei_(vtuber)')
	.set('apricot', 'bsapricot_(vtuber)')
	.set('froot', 'bsapricot_(vtuber)')
	.set('zentreya', 'zentreya_(vtuber)')
	.set('hime', 'hime_hajime')
	//Indies
	.set('sakuna', 'yuuki_sakuna')
	.set('sakumodeus', 'sakumodeus_beyond_lucifer')
	.set('mea', 'kagura_mea')
	.set('kizuna', 'kizuna_ai')
	.set('tamaki', 'inuyama_tamaki')
	.set('kana', 'kamiko_kana');

const tmMegumin: TagMap = new Map()
	.set('kazuma', 'satou_kazuma')
	.set('aqua', 'aqua_(konosuba)')
	.set('darkness', 'darkness_(konosuba)')
	.set('lalatina', 'darkness_(konosuba)')
	.set('eris', 'eris_(konosuba)')
	.set('chris', 'chris_(konosuba)')
	.set('yunyun', 'yunyun_(konosuba)')
	.set('iris', 'iris_(konosuba)')
	.set('cecily', 'cecily_(konosuba)')
	.set('dust', 'dust_(konosuba)')
	.set('rin', 'lean_(konosuba)')
	.set('lean', 'lean_(konosuba)')
	.set('ria', 'leah_(konosuba)')
	.set('rya', 'leah_(konosuba)')
	.set('lia', 'leah_(konosuba)')
	.set('lya', 'leah_(konosuba)')
	.set('berdia', 'verdia')
	.set('veldia', 'verdia')
	.set('beldia', 'verdia')
	.set('wiz', 'wiz_(konosuba)')
	.set('vanir', 'hans_(konosuba)')
	.set('hans', 'hans_(konosuba)')
	.set('sylvia', 'sylvia_(kono_subarashii_sekai_ni_shukufuku_wo!)')
	.set('serena', 'serena_(konosuba)')
	.set('seresdina', 'seresdina_(konosuba)')
	.set('luna', 'luna_(konosuba)')
	.set('arue', 'arue_(konosuba)')
	.set('dodonko', 'dodonko_(konosuba)')
	.set('funicular', 'funifura') //sorry this is funny
	.set('nerimaki', 'nerimaki')
	.set('rain', 'rain_(konosuba)')
	.set('claire', 'claire_(konosuba)')
	.set('mitsurugi', 'mitsurugi_kyouya')
	.set('cielo', 'cello_(konosuba)')
	.set('erika', 'erika_(konosuba)')
	.set('melissa', 'melissa_(konosuba)')
	.set('miia', 'miia_(konosuba)')
	.set('mia', 'miia_(konosuba)')
	.set('amy', 'amy_(konosuba)');

export const tagMaps = {
	general: tmGeneral,
	touhou: tmTouhou,
	virtual_youtuber: tmVirtualYoutuber,
	megumin: tmMegumin,
};
export type TagMapKey = keyof typeof tagMaps;

function normalizeTag(tag: string, tagMap: TagMap) {
	tag = tag.toLowerCase();
	return tagMaps.general.get(tag) || tagMap?.get(tag) || tag;
}

/**
 * Devuelve tags base para un determinado canal y motor
 * @param engine
 * @param nsfw
 * @returns Tags base junto a tags específicas al canal y motor, separadas por espacios
 */
export function getBaseTags(engine: Engine, nsfw: boolean) {
	if (['danbooru', 'derpibooru', 'yandere', 'kcom', 'knet'].includes(engine))
		return `rating:${nsfwRating.get(nsfw)}`;
	return [basetags, nsfwRating.get(nsfw), nsfwTags.get(nsfw)].join(' ');
}

/**
 * Devuelve tags de búsqueda, reemplazando palabras vagas comunes de un cierto comando por tags reales para un determinado motor
 * @param words Las palabras a ser usadas como tags
 * @param engine El motor utilizado para la búsqueda
 * @param tagMapId La ID del Map en el cuál buscar las palabras vagas comunes; depende del comando
 * @returns Tags de búsqueda normalizadas para el comando y engine utilizados
 */
export function getSearchTags(
	words: Array<string>,
	engine: 'gelbooru' | 'danbooru',
	tagMapId: TagMapKey,
) {
	if (engine === 'danbooru') return '';
	const tagMap = tagMaps[tagMapId];
	return words.map((word) => normalizeTag(word, tagMap)).join(' ');
}
