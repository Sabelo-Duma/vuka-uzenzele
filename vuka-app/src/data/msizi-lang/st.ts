/**
 * Msizi in Sesotho: every written answer, the live answers' headings and
 * phrasings, and the sentences live answers are built from.
 *
 * Keyed by the English ids in data/msizi.ts; anything missing falls back to
 * English. Not written by a first-language speaker — a first-language
 * speaker's correction wins. Keep every {placeholder} exactly.
 */
import type { MsiziLang } from './types';

export const msiziSt: MsiziLang = {
  entries: {
    'what-is-vuka': {
      title: 'Vuka Uzenzele ke eng',
      asks: ['Vuka ke eng?', 'App ena e etsa eng?', 'Ntlhalosetse app ena'],
      keywords: ['mabapi', 'morero', 'vuka', 'uzenzele', 'app'],
      body:
        'Vuka Uzenzele e hokahanya bacha ba Afrika Borwa le mosebetsi — ho qala ka mesebetsi e menyane ya sebakeng sa heno, ho ya ho mesebetsi ya semmuso.\n'
        + 'Mohopolo o bonolo. Ha o hloke CV ho qala. O etsa mosebetsi, mohiri a o fa tekanyetso, mme tekanyetso eo e fetoha rekoto ya hao. Ha o entse mosebetsi o motle o lekaneng o nyolohela ho The Ladder, e o bulelang mesebetsi e lefang hantle le ya semmuso.\n'
        + 'Ho e sebedisa ke mahala, ho basebeletsi le ho bahiri.\n'
        + 'Ho hloka mosebetsi ha bacha Afrika Borwa ke {youthUnemployment} ho ba dilemo tse 15 ho isa ho 24. App ena e teng ho fa batho monyetla wa ho kena ha ho se motho ya ba fang monyetla wa pele.',
    },
    'is-it-free': {
      title: 'Ho bitsa bokae',
      asks: ['Na Vuka ke mahala?', 'E bitsa bokae?', 'Na ke tlameha ho lefa ho e sebedisa?'],
      keywords: ['mahala', 'theko', 'tefello', 'ho lefa', 'fee'],
      body:
        'Vuka ke mahala. Ha ho tefello ya ho ngodisa, ha ho tefello ya kgwedi le kgwedi, mme ha o lefe letho ho etsa kopo ya mosebetsi kapa ho kenya mosebetsi.\n'
        + 'Vuka ha e nke karolo ya seo o se fumanang. Tefo ya mosebetsi e sireletswa ke mohiri pele mosebetsi o qala mme e lokollelwa sepacheng sa hao ha o netefatswa — ka mokgwa wa teko hajwale, kahoo ha ho tjhelete ya nnete e tsamayang ka Vuka.\n'
        + 'Haeba motho a ka o kopa ho lefa tefello hore o fumane mosebetsi ho Vuka, ke bomenemene. E tlalehe.',
    },
    'who-is-msizi': {
      title: 'Msizi ke mang',
      asks: ['O mang?', 'O ka etsang?', 'Na o roboto?', 'Ke mang ya o entseng?'],
      keywords: ['msizi', 'mothusi', 'roboto', 'bot', 'ai', 'wena'],
      body:
        'Ke nna Msizi — “umsizi” e bolela mothusi. Ke araba dipotso tsa kamoo Vuka e sebetsang kateng.\n'
        + 'Ha ke bohlale ba maiketsetso, mme ha ke hakanye. Ke dikarabo tse ngotsweng mme tsa hlahlojwa kgahlanong le kamoo app ena e sebetsang kateng ka nnete, kahoo ha nka o bolella ho hong, ke nnete ka Vuka. Ha ke sa tsebe ho hong, ke tla bua jwalo ho ena le ho iqapela.\n'
        + 'Nka o balla rekoto ya hao — score ya hao, boemo ba hao, mesebetsi ya hao, dikopo tsa hao — hobane seo se se se le mohaleng wa hao. Nke ke ka o etsetsa dikopo tsa mosebetsi, ka hira motho, kapa ka ama dintlha tsa hao tsa banka. Tseo di dula e le qeto ya hao, kamehla.\n'
        + 'O ka nngolla kapa wa tobetsa maekrofounu wa bua.',
    },
    'msizi-languages': {
      title: 'Ho bua le Msizi ka puo ya hao',
      asks: ['Na o bua Sesotho?', 'O bua dipuo dife?', 'Nka bua le wena ka puo ya ka?'],
      keywords: ['puo', 'dipuo', 'sesotho', 'isizulu', 'isixhosa', 'afrikaans', 'senyesemane', 'bua'],
      body:
        'O ka mpotsa dipotso ka isiZulu, isiXhosa, Sesotho, Afrikaans kapa Senyesemane, mme ke tla utlwisisa mantswe a tlwaelehileng ho tsona kaofela.\n'
        + 'Ke araba ka puo eo app e beilweng ho yona. Dikarabo tsa ka di fetoletswe ka hloko, empa ha di so hlahlojwe ke motho ya buang puo eo e le ya habo, kahoo haeba ho hong ho balehala hampe, ka kopo re bolelle skrineng sa Puo.\n'
        + 'Ho bua ka lentswe ho itshetlehile ka puo ya hao le mohala wa hao. Ka Senyesemane le Afrikaans nka o mamela mehaleng e mengata. Mantswe a isiZulu, isiXhosa le Sesotho boholo ha a so be teng mehaleng, kahoo ka dipuo tseo nka nna ka kgona ho araba ka mongolo feela. Haeba mohala wa hao o sa kgone puo ya hao, ke tla o bolella skrineng ho ena le ho se etse letho ke kgutsitse.',
    },
    'how-to-start': {
      title: 'Ho qala',
      asks: ['Ke qala jwang?', 'Ke ngodisa jwang?', 'Ke bula akhaonto jwang?'],
      keywords: ['qala', 'ngodisa', 'register', 'akhaonto', 'kena'],
      body:
        'Kgetha hore na o batla mosebetsi kapa o batla ho hira, ebe o ngodisa ka nomoro ya hao ya mohala.\n'
        + '• Re romela khoutu ya nako e le nngwe ka SMS ho hlahloba hore nomoro ke ya hao ka nnete.\n'
        + '• O kgetha phasewete mme o kenya dintlha tse seng kae — sebaka sa hao, dilemo tsa hao, mefuta ya mosebetsi eo o ka e etsang.\n'
        + '• Ke hona feela. O ka qala ho etsa dikopo tsa mesebetsi hanghang, ntle le CV le ntle le boiphihlelo.\n'
        + 'Mosebetsi wa hao wa pele ke wona o qalang rekoto ya hao. Kamora moo, rekoto e o buella.',
    },
    'worker-or-employer': {
      title: 'Akhaonto ya mosebeletsi kapa ya mohiri',
      asks: ['Phapang ke efe pakeng tsa akhaonto ya mosebeletsi le ya mohiri?', 'Ke kgethe akhaonto efe?', 'Worker kapa employer, ke kgethe efe?'],
      keywords: ['mosebeletsi', 'mohiri', 'mofuta wa akhaonto', 'phapang', 'kgetha'],
      body:
        'Akhaonto ya mosebeletsi ke ya ho fumana mosebetsi. O sheba mesebetsi, o etsa kopo, o etsa mosebetsi, mme o haha rekoto e o bulelang mesebetsi e betere.\n'
        + 'Akhaonto ya mohiri ke ya ho hira. O kenya mosebetsi, o bona hore na ke mang ya etsang kopo, o kgetha motho, mme o netefatsa mosebetsi ha o phethilwe.\n'
        + 'Nomoro e le nngwe ya mohala ke akhaonto e le nngwe, kahoo kgetha e tsamaellanang le seo o tlileng ho se etsa mona. Haeba o hloka tse pedi, sebedisa nomoro e nngwe bakeng sa ya bobedi.',
    },
    'minimum-age': {
      title: 'O tlameha ho ba le dilemo tse kae',
      asks: ['Ke tlameha ho ba le dilemo tse kae?', 'Nka sebetsa ho Vuka ha ke le dilemo tse 16?', 'Dilemo tse tlase ke tse kae?'],
      keywords: ['dilemo', 'monyane', 'ka tlase ho 18', 'minimum age'],
      body:
        'O tlameha ho ba le dilemo tse 18 kapa ho feta ho sebedisa Vuka.\n'
        + 'Molao wa Afrika Borwa o dumella batho ho tloha dilemong tse 15 ho etsa mesebetsi e itseng, kahoo ona ke moedi wa rona, eseng wa naha. Lebaka ke POPIA: mang kapa mang ya ka tlase ho dilemo tse 18 ke ngwana ka molao, mme dintlha tsa botho tsa ngwana di ke ke tsa sebetswa ntle le tumello ya motswadi kapa mohlokomedi. Vuka ha e so be le tsela ya ho fumana le ho netefatsa tumello eo, kahoo ho ena le ho bokella ID, sebaka le dintlha tsa banka tsa motho e monyane ntle le yona, ha re amohele akhaonto ho hang.\n'
        + 'Haeba o tla ba le dilemo tse 18 haufinyane, ngodisa ka nako eo. Ha ho letho le lahlehang ka ho ema.',
    },
    'otp-problems': {
      title: 'Ha khoutu ya SMS e sa fihle',
      asks: ['Ha ke a fumana OTP ya ka', 'Khoutu ya SMS ha e fihle', 'Ha ke kgone ho netefatsa nomoro ya ka'],
      keywords: ['otp', 'sms', 'khoutu', 'ha e fihle', 'molaetsa'],
      body:
        'Khoutu e romelwa ka SMS mme hangata e fihla ka hara motsotso.\n'
        + '• Hlahloba nomoro eo o e ngotseng, ho kenyeletswa 0 e qalang.\n'
        + '• Etsa bonnete ba hore o na le netweke. Khoutu e ke ke ya fihla ha mohala o se na netweke.\n'
        + '• Ema motsotso o feletseng pele o kopa e nngwe — ho kopa tse ngata ka ho latellana ho ka o thibela nakwana.\n'
        + 'Haeba e sa ntse e sa fihle, ke bothata ba rona, eseng ba hao, mme app e tla bua jwalo ho ena le ho o siya o sa tsebe.',
    },
    'forgot-password': {
      title: 'Phasewete e lebetsweng',
      asks: ['Ke lebetse phasewete ya ka', 'Ke fetola phasewete ya ka jwang?', 'Ha ke kgone ho kena'],
      keywords: ['phasewete', 'lebetse', 'reset', 'kena', 'login'],
      body:
        'Skrineng sa ho kena, kgetha ho seta phasewete ya hao botjha. Re romela khoutu nomorong ya hao ya mohala, mme ha o e kentse o ka beha phasewete e ntjha.\n'
        + 'Ho seta botjha ho sebetsa feela ka nomoro eo akhaonto e entsweng ka yona — ke sona se thibelang motho e mong ho o fetolela phasewete.',
    },
    'change-language': {
      title: 'Ho fetola puo',
      asks: ['Ke fetola puo jwang?', 'Nka sebedisa app ena ka Sesotho?', 'Change language jwang?'],
      keywords: ['fetola puo', 'puo', 'sesotho', 'isizulu', 'afrikaans', 'senyesemane'],
      body:
        'Eya ho Nna, ebe Puo. Vuka e fumaneha ka Senyesemane, isiZulu, isiXhosa, Sesotho le Afrikaans, mme kgetho ya hao e a hopolwa le ha o se inthaneteng.\n'
        + 'Tseba hore app e fetolelwa skrine ka skrine, kahoo diskrine tse ding di sa ntse di le ka Senyesemane. Skrine sa Puo se o bolella ka nnete hore na ho fihlilwe hokae.\n'
        + 'Maqephe a molao a dula a le ka Senyesemane ka boomo — lentswe la molao le fetoletsweng hampe le thetsa batho, mme seo se hobe ho feta ho o kopa ho le bala ka Senyesemane.\n'
        + 'Haeba phetolelo e o balehela hampe, ho na le lebokose skrineng seo ho re bolella. Motho o a di bala.',
    },
    'install-app': {
      title: 'Ho kenya Vuka mohaleng wa hao',
      asks: ['Ke kenya app jwang?', 'Nka e beha skrineng sa lehae?', 'Na ho na le app eo nka e daonloutang?'],
      keywords: ['kenya app', 'install', 'download', 'skrine sa lehae', 'play store'],
      body:
        'Vuka e kenngwa ka kotloloho ho tswa sebading — ha ho letho leo o tlamehang ho le daonlouta lebenkeleng la di-app, ke hore ha ho daonloutu e kgolo mme ha ho data e senyehang ka dintjhafatso.\n'
        + 'Batla konopo ya ho kenya ka hara app, kapa o sebedise menyu ya sebadi sa hao mme o kgethe Add to home screen.\n'
        + 'Ha e se e kentswe e bulwa jwaloka app efe kapa efe, e sebetsa le ha netweke e fokola, mme e bontsha diskrine tsa hao tse bolokilweng le ha o se inthaneteng.',
    },
    'works-offline': {
      title: 'Ho sebedisa Vuka ntle le data',
      asks: ['Na e sebetsa ntle le inthanete?', 'Nka sebedisa Vuka ntle le data?', 'Ho etsahalang ha netweke e ka tsamaya?'],
      keywords: ['ntle le inthanete', 'offline', 'data', 'netweke', 'inthanete', 'kgokahano'],
      body:
        'Karolo e itseng, mme ka boomo. Vuka e ahetswe mohala o se nang data sebakeng se nang le letshwao le le leng feela la netweke.\n'
        + '• App ka boyona e bulega ntle le netweke, ka puo eo o e kgethileng.\n'
        + '• Diskrine tseo o seng o di bone di dula di balehang.\n'
        + '• Melaetsa eo o e romelang o se inthaneteng e a ema mme e tsamaya ha netweke e kgutla, ho ena le hore e lahlehe.\n'
        + 'Se hlokang kgokahano: mesebetsi e metjha, ho etsa kopo, le eng kapa eng e tlamehang ho fihla ho motho e mong.',
    },
    'find-work': {
      title: 'Ho fumana mosebetsi',
      asks: ['Ke fumana mosebetsi jwang?', 'Mesebetsi e hokae?', 'Ke etsa kopo ya mosebetsi jwang?', 'Ke hloka mosebetsi'],
      keywords: ['fumana mosebetsi', 'mesebetsi', 'batla', 'etsa kopo', 'jobs'],
      body:
        'Tobetsa Fumana mosebetsi. O tla bona mesebetsi e haufi le wena, e haufi ka ho fetisisa e le pele.\n'
        + '• Kgetha mofuta wa mosebetsi ka mola wa mefuta o ka hodimo.\n'
        + '• Mosebetsi o mong le o mong o bontsha tefo ka hora, hore o nka nako e kae, o hole hakae, le hore na ke mang ya o fanang.\n'
        + '• Bula o le mong ho bala dintlha, ebe o etsa kopo. Ho etsa kopo ke ho tobetsa hanngwe mme ha ho bitse letho.\n'
        + 'O ka etsa dikopo tse ngata kamoo o ratang. Mohiri o bona rekoto ya hao — tekanyetso ya hao, mesebetsi eo o e entseng, boemo ba hao — mme o kgetha ho batho ba entseng kopo.',
    },
    'job-types': {
      title: 'Mefuta ya mosebetsi ho Vuka',
      asks: ['Ho na le mefuta efe ya mesebetsi?', 'Nka etsa mosebetsi ofe?', 'Ho na le dikarolo dife tsa mesebetsi?'],
      keywords: ['mefuta', 'dikarolo', 'ho hlwekisa', 'serapa', 'ho ruta'],
      body:
        'Mesebetsi e menyane — e kgutshwane, ya sebakeng sa heno, e lefuwang ka hora. Hona jwale ke ena:\n'
        + '{categories}\n'
        + 'Mesebetsi ya semmuso — mosebetsi wa nnete wa dishifti le wa boemo ba ho qala, jwaloka mothusi wa peterole, mosebetsi wa polokelo ya thepa, mokhasi, ofisiri ya tshireletso, moemedi wa setsi sa mehala le mothusi wa lebenkele.\n'
        + 'Mesebetsi ya semmuso ya fumanwa ka ho e sebeletsa, eseng ka ho e sheba feela. E nngwe le e nngwe e hloka boemo, mme o fihla boemong ka ho etsa mesebetsi e menyane hantle. Ke yona sepheo sa lere: mesebetsi e menyane ke tsela ya ho fihla ho e meholo ntle le CV.',
    },
    'no-matric-needed': {
      title: 'Hore na o hloka metriki kapa boiphihlelo',
      asks: ['Na ke hloka metriki?', 'Na ke hloka boiphihlelo?', 'Na ke hloka CV ho qala?'],
      keywords: ['metriki', 'matric', 'grade 12', 'thuto', 'setifikeiti', 'boiphihlelo', 'sekolo'],
      body:
        'Tjhe. Ha o hloke metriki, CV, boiphihlelo kapa motho ya o tshehetsang ho qala ho Vuka. Ke yona ntlha ya yona.\n'
        + 'Mesebetsi e menyane e bulehetse bohle. O etsa mosebetsi, mohiri a o fa tekanyetso, mme tekanyetso eo ke boiphihlelo — e fetoha rekoto e o fumanelang mosebetsi o latelang.\n'
        + 'Mesebetsi ya semmuso e laolwa ke boemo ba hao, eseng ke thuto ya hao. Boemo bo fumanwa ka mosebetsi o phethilweng, kahoo motho ya tlohetseng sekolo kapele mme a sebetsa hantle o fihla mesebetsing ya mokhasi le ya setsi sa mehala ka tsela e tshwanang le ya motho e mong le e mong. Mesebetsi e meng e bolela ditlhoko tsa yona, mme mosebetsi oo o a o bolella.\n'
        + 'Haeba o na le metriki kapa setifikeiti, se kenye profaeleng ya hao — se ka thusa feela. Ha se ntho e emang pakeng tsa hao le mosebetsi wa pele.',
    },
    'after-i-apply': {
      title: 'Se etsahalang kamora hore o etse kopo',
      asks: ['Ho etsahalang kamora hore ke etse kopo?', 'Ke tseba jwang hore ke fumane mosebetsi?', 'Hobaneng ho se motho ya arabileng?'],
      keywords: ['kopo', 'ho ema', 'karabo', 'hirilwe', 'ha ho motho'],
      body:
        'Mohiri o bona bohle ba entseng kopo, hammoho le rekoto ya motho e mong le e mong, mme o a kgetha. Haeba a o kgetha, o a hirwa mme o fumana tsebiso.\n'
        + 'O ka bona tsohle tseo o di etseditseng kopo skrineng sa hao sa Lehae.\n'
        + 'Ho se utlwe letho ho a tlwaeleha mme ha se kahlolo ka wena — mosebetsi o hlokang motho a le mong o ka ba o bile le bakopi ba mashome a mabedi. Tswela pele ho etsa dikopo. Ntho e kgolo ka ho fetisisa e fetolang monyetla wa hao ke ho ba le mesebetsi e seng mekae e phethilweng le tekanyetso e ntle, ke ka hoo wa pele o leng bohlokwa ho feta e meng.',
    },
    'distance': {
      title: 'Mosebetsi o hole hakae',
      asks: ['Mosebetsi ona o hole hakae?', 'Vuka e tseba jwang moo ke leng teng?', 'Hobaneng e bontsha bohole bo fosahetseng?'],
      keywords: ['bohole', 'hole', 'sebaka', 'gps', 'location', 'km', 'leeto'],
      body:
        'Haeba o dumella Vuka ho sebedisa sebaka sa hao, bohole bo lekanngwa ho tloha moo o leng teng ka nnete, mme lenane le hlophiswa ka e haufi ka ho fetisisa pele.\n'
        + 'Haeba o sa dumelle, mosebetsi o mong le o mong o ntse o bontsha lebitso la sebaka sa ona, mme app e tshwaya seo e le kakanyo ho ena le ho iketsa eka e se lekantse.\n'
        + 'Sebaka sa hao se sebediswa mohaleng wa hao ho hlopha le ho lekanya. Bohole bo bohlokwa mona ho feta kamoo bo shebahalang: leeto ke tjeo e kgolo ka ho fetisisa ya ho batla mosebetsi Afrika Borwa, kahoo mosebetsi o hole ka ditekesi tse pedi o ka bitsa ho feta kamoo o lefang ho o fihlela.',
    },
    'invitations': {
      title: 'Memo ya mosebetsi',
      asks: ['Memo ke eng?', 'Mohiri o nkemere — ho bolelang?', 'Ke fumane invitation, ke eng?'],
      keywords: ['memo', 'mema', 'memilwe', 'invite', 'invitation'],
      body:
        'Mohiri ya boneng rekoto ya hao a ka o mema ka kotloloho mosebetsing o itseng, ho ena le ho ema hore o o fumane.\n'
        + 'Memo hase ho hirwa hajwale — ke ho kopuwa ho etsa kopo. O ka amohela kapa wa hana, mme ho hana ha ho o bitse letho ebile ha ho tshwarwe kgahlanong le rekoto ya hao.\n'
        + 'Memo di ba ngata haholo ha o se o le Ya tshepahalang kapa ho feta, hobane ke nako eo bahiri ba qalang ho sheba basebeletsi ho ena le ho kenya mosebetsi feela ba eme.',
    },
    'change-my-mind': {
      title: 'Ho fetola kgopolo ka mosebetsi',
      asks: ['Nka hlakola mosebetsi?', 'Ke hula kopo ya ka jwang?', 'Ha ke sa kgona ho ya mosebetsing'],
      keywords: ['hlakola', 'hula kopo', 'fetola kgopolo', 'cancel', 'ha ke sa kgona'],
      body:
        'Ha ho konopo ya ho hula kopo ka hara app hajwale, kahoo kopo eo o e rometseng e dula e romeletswe.\n'
        + 'Haeba o se o sa kgone ho etsa mosebetsi, romela mohiri molaetsa ho Dipuisano mme o mo bolelle hang ha o tseba. Ke hona feela — ho mo bolella kapele ha ho o bitse letho, mme ke seo motho ya tshepahalang a se etsang.\n'
        + 'Se senyang rekoto ke ho kgutsa: ho hirwa ebe o sa fihle, ntle le molaetsa. Mohiri a ka fana ka tekanyetso bakeng sa seo, mme ke yona ntho e le nngwe e thata haholo ho e lokisa.\n'
        + 'Ho etsa kopo ebe o sa utlwe letho hase ntho e tshwanang mme ha ho na kotlo ho hang.',
    },
    'formal-jobs-locked': {
      title: 'Hobaneng mosebetsi wa semmuso o notletswe',
      asks: ['Hobaneng ke sa kgone ho etsa kopo ya mosebetsi ona?', 'Hobaneng mosebetsi ona o notletswe?', 'Ke bula mesebetsi ya semmuso jwang?'],
      keywords: ['notletswe', 'locked', 'semmuso', 'bula', 'boemo bo hlokahalang'],
      body:
        'Mosebetsi o mong le o mong wa semmuso o hloka boemo bo itseng bo tlase, mme o fihla boemong ka ho phetha mesebetsi e menyane ka ditekanyetso tse ntle.\n'
        + 'Hase rona re o thibelang. Ke se fapaneng: mohiri ya fanang ka mosebetsi wa nnete wa dishifti a ke ke a nka motho ya se nang nalane, kahoo boemo ke bopaki bo emelang CV le batho ba o tshehetsang bao o so ba be le bona. Ha Vuka e re o Ya tshepahalang, ho na le mesebetsi e meraro e phethilweng le tekanyetso ka mora seo.\n'
        + 'Mosebetsi o o bolella hore na o hloka boemo bofe. Rekoto ya ka e o bolella hore na o hole hakae le bona.',
    },
    'my-record': {
      title: 'Rekoto ya ka',
      asks: ['Rekoto ya ka ke eng?', 'Ho na le eng rekotong ya ka?', 'CV ya ka e hokae?'],
      keywords: ['rekoto', 'cv', 'nalane ya mosebetsi', 'bopaki', 'resume'],
      body:
        'Rekoto ya ka ke CV eo app e o ngollang yona, ho tswa mosebetsing oo o o entseng ka nnete.\n'
        + 'E na le mosebetsi o mong le o mong o phethilweng, hore e ne e le eng, e ne e le wa mang, o lefilwe bokae, le tekanyetso le maikutlo ao mohiri a a siileng. E boetse e na le Vuka Score ya hao, boemo ba hao le dibeche tsa hao.\n'
        + 'Ha o e ngole ebile o ke ke wa e fetola, ke ka hona mohiri a e dumelang. Mosebetsi o mong le o mong o ngotswe ka lebitso le nepahetseng la mosebetsi — mosebetsi wa ho fallisa o ngotswe e le Mothusi wa ho falla, eseng “thuso ya ho falla” — hobane ke seo motho ya hirang a se batlang.\n'
        + 'O ka e arolelana e le linki ya setjhaba, kahoo e sebetsa e le CV le kantle ho app.',
    },
    'vuka-score': {
      title: 'Vuka Score',
      asks: ['Vuka Score ke eng?', 'Score ya ka e balwa jwang?', 'Ke nyolla score ya ka jwang?'],
      keywords: ['score', 'dintlha', 'botumo', 'e balwa jwang', 'nyolla'],
      body:
        'Vuka Score ya hao ke nomoro e le nngwe ho tse 100 e akaretsang rekoto ya hao. E hahilwe ka dintho tse tharo:\n'
        + '• Karolelano ya dinaledi tsa hao, e leng karolo e kgolo ka ho fetisisa.\n'
        + '• Palo ya mesebetsi eo o e phethileng, ho balwa ho fihlela ho leshome le metso e mmedi.\n'
        + '• Rekoto e hlwekileng ya polokeho, ho se na ditemoso kgahlanong le wena.\n'
        + 'E dula e le lefela ho fihlela mosebetsi wa hao wa pele o phethilweng, hobane ha ho so be le letho leo e ka le lekanyang.\n'
        + 'Tsela ya ho e nyolla ke tsela e tlwaelehileng: fihla, etsa mosebetsi hantle, mme o be motho eo mohiri a batlang a kgutla. Ha ho tsela ya ho e reka kapa ho e phahamisa ka maiketsetso, mme ke lona feela lebaka leo e nang le bohlokwa ka lona.',
    },
    'the-ladder': {
      title: 'The Ladder',
      asks: ['The Ladder ke eng?', 'Maemo ke afe?', 'Ntlhalosetse maemo'],
      keywords: ['lere', 'ladder', 'maemo', 'boemo', 'tier', 'moqadi', 'setsebi'],
      body:
        'The Ladder ke tsela eo mesebetsi e menyane e fetohang mesebetsi ya nnete ka yona. Ho na le maemo a mane, mme e mong le e mong o a sebeletswa:\n'
        + '{tiers}\n'
        + 'O nyolla ka bowona hang ha o fihlela dipehelo tsohle tsa boemo bo latelang — mesebetsi e entsweng, karolelano ya tekanyetso, le ho se be le ditemoso tsa polokeho.\n'
        + 'Ha ho letho mona le ka rekwang mme ha ho letho le felang.',
    },
    'move-up-tier': {
      title: 'Ho nyolohela boemong bo latelang',
      asks: ['Ke nyolohela boemong bo latelang jwang?', 'Ke fihla level e latelang jwang?', 'Ke eng e nthibelang ho nyoloha?'],
      keywords: ['nyoloha', 'boemo bo latelang', 'tswela pele', 'ditlhoko', 'dipehelo'],
      body:
        'Dipehelo tse tharo, tseo kaofela di tlamehang ho ba nnete ka nako e le nngwe:\n'
        + '• Mesebetsi e phethilweng e lekaneng bakeng sa boemo boo.\n'
        + '• Karolelano ya tekanyetso e lekanang kapa e fetang eo boemo bo e hlokang.\n'
        + '• Ho se be le ditemoso tsa polokeho rekotong ya hao.\n'
        + 'Rekoto ya ka e bontsha hore na ke efe ho tse tharo eo o e fihletseng le eo o so e fihlele, kahoo o ka bona hantle hore na ke eng e o thibelang ho ena le ho hakanya.\n'
        + 'Mpotse “ke boemong bofe” mme ke tla o balla dinomoro tsa hao.',
    },
    'badges': {
      title: 'Dibeche',
      asks: ['Dibeche ke eng?', 'Ke fumana dibeche jwang?', 'Badges di sebetsa jwang?'],
      keywords: ['beche', 'dibeche', 'badge', 'kgau', 'katleho'],
      body:
        'Dibeche di tshwaya dintho tse itseng tseo o di entseng. Di dula rekotong ya hao moo mohiri a ka di bonang:\n'
        + '{badges}\n'
        + 'Di fumanwa ka bowona. Ha ho hlokahale hore o kope e nngwe.',
    },
    'ratings-average': {
      title: 'Kamoo tekanyetso ya hao e sebetsang',
      asks: ['Tekanyetso ya ka e sebetsa jwang?', 'Hobaneng karolelano ya ka e sa fetoha?', 'Ke mang ya mphang tekanyetso?'],
      keywords: ['tekanyetso', 'dinaledi', 'karolelano', 'maikutlo', 'rating'],
      body:
        'Ha o qetile mosebetsi mohiri o a o netefatsa mme o o fa tekanyetso ya naledi e le nngwe ho isa ho tse hlano, le maikutlo a makgutshwane. Tekanyetso eo e kena rekotong ya hao le karolelanong ya hao.\n'
        + 'Ho na le taba e le nngwe e makatsang batho, mme e o thusa. Haeba mohiri a sa ka a netefatsa, mosebetsi o ngolwa ho wena leha ho le jwalo kamora nako ya netefatso — empa o bolokwa ntle le tekanyetso ho hang, mme ha o kenngwe karolelanong ya hao. Kahoo mohiri ya kgutsang a ke ke a thusa kapa a senya tekanyetso ya hao. O ntse o fumana mosebetsi, tjhelete le ho ngolwa rekotong.',
    },
    'safety-flag': {
      title: 'Ditemoso tsa polokeho',
      asks: ['Temoso ya polokeho ke eng?', 'Temoso e nkama jwang?', 'Na temoso e ka tloswa?'],
      keywords: ['temoso', 'ditemoso', 'flag', 'temoso ya polokeho', 'tshwaya'],
      body:
        'Temoso ya polokeho e phahamiswa ha motho a tlaleha ngongoreho ya nnete ya polokeho ka mosebetsi — ke mosebeletsi ka mohiri, kapa ka tsela e fapaneng.\n'
        + 'Temoso rekotong ya hao e o thibela ho nyolohela boemong bo latelang, hobane boemo bo bong le bo bong ka hodimo ho Moqadi bo hloka rekoto e hlwekileng.\n'
        + 'Ditemoso di balwa ke motho, ha di etswe qeto ke app. Di teng ho boloka batho ba sireletsehile ha ba kena malapeng a batho bao ba sa ba tsebeng le ho boloka lere le na le bohlokwa — eseng e le kotlo bakeng sa mosebetsi o sa kang wa tsamaya hantle. Ho se dumellane ka mosebetsi hase temoso ya polokeho.',
    },
    'public-cv': {
      title: 'Ho arolelana rekoto ya hao',
      asks: ['Ke arolelana CV ya ka jwang?', 'Nka romela rekoto ya ka ho motho?', 'Na batho ba ka bona rekoto ya ka ntle le app?'],
      keywords: ['arolelana', 'linki', 'setjhaba', 'romela', 'whatsapp', 'share'],
      body:
        'Rekoto ya hao e ka arolelanwa e le linki. Mang kapa mang ya e bulang o bona nalane ya hao ya mosebetsi, tekanyetso le boemo ka mokgwa wa ho bala feela, ntle le ho hloka akhaonto ya Vuka.\n'
        + 'Ke kamoo o arabang “na o na le CV?” ha o se na yona. Romela linki ka WhatsApp.\n'
        + 'Mofuta wa setjhaba o bontsha mosebetsi wa hao le botumo ba hao. Ha o bontshe nomoro ya hao ya mohala, nomoro ya hao ya ID kapa dintlha tsa hao tsa banka.',
    },
    'how-payment-works': {
      title: 'Kamoo o lefuwang kateng',
      asks: ['Ke lefuwa jwang?', 'Na Vuka e tshwara tjhelete ya ka?', 'Ke tla fumana tjhelete ya ka neng?'],
      keywords: ['lefuwa', 'tefo', 'tjhelete', 'moputso', 'payment', 'sireleditswe', 'sepache', 'wallet'],
      body:
        'Tefo ya mosebetsi e sireletswa pele mosebetsi o qala. Mohiri o kenya tjhelete kaofela ha a kenya mosebetsi, kapa hamorao — empa kamehla pele a ka hira motho.\n'
        + '• Batla Tjhelete e sireleditswe mosebetsing. E bolela hore tefo e se e o emetse. Mosebetsi o bontshang Ho emetswe tjhelete o ntse o ka etsetswa kopo, empa ha ho motho ya ka hirwang ho ona ho fihlela mohiri a kenya tjhelete.\n'
        + '• Ho fihlela motho a hirwa, mohiri a ka nka tjhelete hape, mahala. Ho tloha motsotsong oo o hirwang, tjhelete e notletswe bakeng sa hao.\n'
        + '• Ha mohiri a netefatsa mosebetsi wa hao o phethilweng — kapa ka bowona, {autoReleaseHours} kamora hore o o tshwaye o phethilwe haeba a sa arabe — tefo e kena sepacheng sa hao sa Vuka ka tlasa Nna. O e ntshetsa akhaontong ya hao ya banka neng kapa neng ha o batla.\n'
        + 'Hona jwale sena se ka MOKGWA WA TEKO: sepache ke boikwetliso mme ha ho tjhelete ya nnete e tsamayang ka Vuka. Ho fihlela e bulwa, dumellanang le mohiri kamoo a tla o lefa kateng ka nnete, pele o qala.\n'
        + 'Haeba mohiri a sa o lefe, tlaleha. Ke sona seo tlaleho ya polokeho e leng teng bakeng sa sona.',
    },
    'funds-secured': {
      title: 'Tjhelete e sireleditswe e bolela eng',
      asks: ['Tjhelete e sireleditswe e bolela eng?', 'Ho emetswe tjhelete ho bolela eng?', 'Na mohiri a ka nka tjhelete hape?', 'Na tjhelete e teng ka nnete?'],
      keywords: ['tjhelete e sireleditswe', 'ho emetswe tjhelete', 'e lefilwe', 'nka hape', 'notletswe', 'escrow'],
      body:
        'Mosebetsi o mong le o mong o bontsha e nngwe ya matshwao a mararo, hore o tsebe ka tefo pele o etsa kopo:\n'
        + '• Tjhelete e sireleditswe — mohiri o se a kentse tefo kaofela. E o emetse.\n'
        + '• Ho emetswe tjhelete — ha e so. O ntse o ka etsa kopo, empa ha ho motho ya ka hirwang ho ona ho fihlela mohiri a kenya tjhelete.\n'
        + '• E lefilwe — mosebetsi o phethilwe mme tefo e ile ho mosebeletsi.\n'
        + 'Na mohiri a ka e nka hape? Feela pele motho a hirwa. Ho tloha motsotsong oo o hirwang, tjhelete e notletswe bakeng sa hao, mme e kena sepacheng sa hao ha mosebetsi o netefatswa — kapa ka bowona, {autoReleaseHours} kamora hore o o tshwaye o phethilwe, haeba mohiri a sa arabe.\n'
        + 'Sena se ka mokgwa wa teko hajwale, kahoo ha ho tjhelete ya nnete e tsamayang ka Vuka.',
    },
    'wallet-withdraw': {
      title: 'Sepache sa hao, le ho ntsha tjhelete',
      asks: ['Ke ntsha tjhelete ya ka jwang?', 'Sepache sa ka se hokae?', 'Ho ntsha tjhelete ho nka nako e kae?'],
      keywords: ['sepache', 'wallet', 'ntsha tjhelete', 'withdraw', 'balance', 'fetisetsa'],
      body:
        'Sepache sa hao se ka tlasa Nna, ebe Sepache sa ka. Se bontsha seo o ka se ntshang hona jwale, le se sireleditsweng mesebetsing eo o sa ntseng o e etsa.\n'
        + '• Tefo e kena sepacheng ha mohiri a netefatsa mosebetsi wa hao.\n'
        + '• Ntshetsa e romela tjhelete yohle akhaontong ya banka eo o e bolokileng ka tlasa Lefuwa. Kenya dintlha tsa hao tsa banka moo pele.\n'
        + 'Hobane ditefo di ka mokgwa wa teko, ha ho tjhelete e romelwang ka nnete hajwale, kahoo ha ho nako ya ho ema eo nka o bolellang ka yona. Ha ditefo tsa nnete di bulwa, nako eo ho ntsha ho e nkang e tla bontshwa pele o netefatsa.\n'
        + 'Mpotse “ho na le bokae sepacheng sa ka” mme ke tla o balla balance ya hao.',
    },
    'test-mode': {
      title: 'Mokgwa wa teko o bolela eng',
      asks: ['Mokgwa wa teko ke eng?', 'Na ena ke tjhelete ya nnete?', 'Hobaneng e re test mode?'],
      keywords: ['mokgwa wa teko', 'test mode', 'teko', 'boikwetliso', 'tjhelete ya nnete', 'ha se nnete'],
      body:
        'Vuka e bontsha tsela yohle eo ditefo di tla sebetsa ka yona — tefo e sireletswa pele ho mosebetsi, e lokollelwa sepacheng sa mosebeletsi ha o netefatswa, ebe e ntshetswa bankeng. Hona jwale seo ke boikwetliso: ha ho tjhelete ya nnete e tsamayang ka Vuka.\n'
        + 'Ho fihlela ditefo di bulwa, dumellanang le motho e mong kamoo tefo e tla etswa kateng ka nnete, pele mosebetsi o qala. Tse ding tsohle — rekoto ya hao, ditekanyetso, maemo le dibeche — ke tsa nnete mme di a bala.\n'
        + 'Ha ditefo tsa nnete di qala, app e tla bua jwalo ka ho hlaka, mme mokgwa wa teko o tla nyamela diskrineng tsena.',
    },
    'employer-fund-job': {
      title: 'Ho sireletsa tefo ya mosebetsi',
      asks: ['Ke kenya tjhelete ya mosebetsi jwang?', 'Hobaneng ke sa kgone ho hira motho?', 'Ke kgutlisa tjhelete ya ka jwang?', 'Nka hlakola kamora ho hira?', 'Ke lefa mosebeletsi jwang?', 'Ho etsahalang ka tjhelete ha ke hlakola mosebetsi?'],
      keywords: ['sireletsa tefo', 'kenya tjhelete', 'kgutlisa tjhelete', 'ha ke kgone ho hira', 'lefa mosebeletsi', 'fund', 'refund'],
      body:
        'Tefo ya mosebetsi e sireletswa pele motho a qala. Tshwaya Sireletsa tefo hona jwale ha o kenya mosebetsi, kapa o bule mosebetsi hamorao mme o tobetse Sireletsa tefo.\n'
        + '• Ha ho motho ya ka hirwang ho fihlela tefo e sireleditswe. Ke ka hona konopo ya Hira e reng Sireletsa tefo ho hira.\n'
        + '• Pele o hira, o ka nka tjhelete hape ntle le tefello. Ho hula mosebetsi oo ho seng motho ya hirilweng ho ona le hona ho e kgutlisa.\n'
        + '• Ho tloha motsotsong oo o hirang motho, tjhelete e notletswe bakeng sa hae. E kena sepacheng sa mosebeletsi ha o netefatsa mosebetsi — kapa ka bowona, {autoReleaseHours} kamora hore a o tshwaye o phethilwe, haeba o sa arabe.\n'
        + 'Mosebetsi oo motho a hirilweng ho ona o ke ke wa hlakolwa ka hara app. Romela mosebeletsi molaetsa ho rarolla taba, mme o tlalehe ka tlasa Nna haeba ho na le se sa lokang.\n'
        + 'Ditefo di ka mokgwa wa teko hajwale, kahoo ha ho tjhelete ya nnete e tsamayang ka Vuka.',
    },
    'get-more-work': {
      title: 'Ho fumana mesebetsi e mengata',
      asks: ['Ke fumana mesebetsi e mengata jwang?', 'Hobaneng ke sa fumane mesebetsi?', 'Ke hirwa kapele jwang?'],
      keywords: ['mesebetsi e mengata', 'ha ke fumane', 'hirwa', 'menyetla', 'ha ho ya nthirang'],
      body:
        'Bahiri ba kgetha ho ya ka rekoto eo ba e bonang, kahoo dintho tse o nyollang lenaneng ke dintho tseo o di laolang:\n'
        + '• Tlatsa profaele ya hao le ditsebo tseo o nang le tsona ka nnete, hore o hlahe bakeng sa mosebetsi o nepahetseng.\n'
        + '• Netefatsa ID ya hao ka tlasa Nna. Ha a na le batho ba babedi, mohiri o nka ya netefaditsweng.\n'
        + '• Bulela Mesebetsi e metjha haufi le nna, ka tlasa Nna ebe Ditsebiso, hore o utlwe ka mosebetsi hang ha o kenngwa mme o etse kopo kapele.\n'
        + '• Kgetha mesebetsi e bontshang Tjhelete e sireleditswe, le e haufi le wena — o fihla ka nako, mme tefo e o emetse.\n'
        + '• Etsa mosebetsi o mong le o mong hantle mme o o tshwaye o phethilwe. Mosebetsi o mong le o mong o netefaditsweng le tekanyetso e ntle di nyolla Vuka Score ya hao le boemo ba hao.',
    },
    'banking-details': {
      title: 'Dintlha tsa hao tsa banka',
      asks: ['Hobaneng Vuka e batla dintlha tsa ka tsa banka?', 'Na dintlha tsa ka tsa banka di bolokehile?', 'Ke kenya akhaonto ya ka ya banka jwang?'],
      keywords: ['banka', 'dintlha tsa banka', 'nomoro ya akhaonto', 'branch code', 'capitec', 'fnb', 'absa'],
      body:
        'O ka boloka dintlha tsa hao tsa banka ka tlasa Nna, hore o be le tsona di loketse ho di fa mohiri ntle le ho batla karete.\n'
        + 'Di patilwe ka khoutu ho seva mme ha di kgutliselwe ho app. Le wena o bona feela sesupo se patilweng — banka ya hao, mofuta wa akhaonto, le dinomoro tse nne tsa ho qetela. Ha ho letho la lekunutu le bolokwang mohaleng wa hao.\n'
        + 'Ke moo sepache sa hao se romelang tefo ya hao ha o e ntsha. Ditefo di ka mokgwa wa teko hajwale, kahoo ha ho tjhelete ya nnete e romelwang ho tsona.\n'
        + 'Ha ho motho wa Vuka ya tla o letsetsa kapa a o romela molaetsa a kopa nomoro ya hao ya akhaonto, PIN ya hao kapa OTP. Mang kapa mang ya etsang jwalo hase wa Vuka.',
    },
    'fair-pay': {
      title: 'Mitha ya Tefo e nepahetseng le moputso o tlase',
      asks: ['Mitha ya tefo e nepahetseng ke eng?', 'Moputso o tlase wa molao ke bokae?', 'Na mosebetsi ona o ntefa ho lekaneng?'],
      keywords: ['tefo e nepahetseng', 'moputso o tlase', 'minimum wage', 'ka hora', 'molao', 'tlase haholo'],
      body:
        'Moputso o tlase wa naha Afrika Borwa ke {minWage} ka hora. O behwa ke mmuso mme o phatlalatswa hape selemo se seng le se seng, ho qala ka la 1 Hlakubele.\n'
        + 'Mosebetsi o mong le o mong ho Vuka o bontsha mitha ya Tefo e nepahetseng e bapisang tefo ya ona le palo eo, hore o tsebe kapele hore na seo o se fuwang se molaong ebile se nepahetse pele o sebedisa tjhelete ya tekesi ho ya moo.\n'
        + 'Mosebetsi o lefang ka tlase ho moputso o tlase ha o molaong. O dumelletswe ho hana, mme o dumelletswe ho o tlaleha.\n'
        + 'Hape nahana ka leeto. Tefo e shebahalang e lokile e ka ba mpe ho feta ho dula hae ha o se o lefile ditekesi tse pedi.',
    },
    'total-earned': {
      title: 'Seo palo ya kakaretso e se balang',
      asks: ['Palo ya kakaretso eo ke e fumaneng e kenyeletsa eng?', 'Kakaretso ya meputso ya ka e balwa jwang?', 'Total earned e bala eng?'],
      keywords: ['kakaretso', 'e kenyeletsa', 'e balwa jwang', 'total earned'],
      body:
        'Rekoto ya ka e kopanya tsohle ho tswa mosebetsing o mong le o mong o phethilweng mme e di bontsha e le kakaretso ya seo o se fumaneng.\n'
        + 'E bala mosebetsi o netefaditsweng, ho kenyeletswa mesebetsi e ngotsweng ho wena ka bowona ha mohiri a sa ka a netefatsa. Ha e bale mesebetsi eo o e etseditseng kopo feela kapa eo o sa ntseng o e etsa.\n'
        + 'Mpotse “ke fumane tjhelete e kae” mme ke tla o balla palo ya hao.',
    },
    'mark-job-done': {
      title: 'Ho tshwaya mosebetsi o phethilwe',
      asks: ['Ke tshwaya mosebetsi o phethilwe jwang?', 'Ke qetile mosebetsi — jwale ho etsahalang?', 'Ke mark job as done jwang?'],
      keywords: ['phethilwe', 'qetile', 'tshwaya', 'fa mohiri tekanyetso', 'done'],
      body:
        'Bula mosebetsi skrineng sa hao sa Lehae mme o o tshwaye o phethilwe. O tla kopuwa ho fa mohiri tekanyetso ya dinaledi ho tse hlano pele o ka etsa jwalo — ke karolo ena e bolokang bahiri ba tshepahala, mme ke ka hona basebeletsi ba bang ba ka bona hore na ke mang ya lokileng ho mo sebeletsa.\n'
        + 'Haeba ho na le se neng se sa bolokeha mosebetsing, ho na le lebokose la ho phahamisa temoso ya polokeho ka nako e tshwanang. Motho o a di bala.\n'
        + 'Ebe mohiri o kopuwa ho netefatsa. Ha a se a netefaditse, mosebetsi o kena rekotong ya hao le tekanyetso le maikutlo a hae, mme tefo e neng e sireleditswe bakeng sa ona e kena sepacheng sa hao, ka mokgwa wa teko hajwale.',
    },
    'confirm-work': {
      title: 'Ho emela mohiri hore a netefatse',
      asks: ['Mohiri ha a so netefatse mosebetsi wa ka', 'Netefatso e nka nako e kae?', 'Ho thweng haeba a sa netefatse ho hang?'],
      keywords: ['netefatsa', 'netefatso', 'ho ema', 'ha a so netefatse', 'confirm'],
      body:
        'Kamora hore o tshwaye mosebetsi o phethilwe, mohiri o na le {autoReleaseHours} ho o netefatsa.\n'
        + 'Haeba a sa etse jwalo, mosebetsi o ngolwa ho wena leha ho le jwalo hang ha nako eo e fetile. O fumana ho ngolwa rekotong, tjhelete, tswelopele ya boemo — mme tefo e sireleditsweng e kena sepacheng sa hao. O bolokwa ntle le tekanyetso, kahoo ho kgutsa ha hae ho ke ke ha theola karolelano ya hao — kapa ha e nyolla.\n'
        + 'Sena se teng hobane mohiri ya neng a mpa a emisa ho araba o ne a kgona ho emisa tswelopele ya mosebeletsi ka ho sa feleng, bakeng sa mosebetsi o entsweng ka nnete. Jwale ha a sa kgona.',
    },
    'post-a-job': {
      title: 'Ho kenya mosebetsi',
      asks: ['Ke kenya mosebetsi jwang?', 'Ke hira motho jwang?', 'Ke bapatsa mosebetsi jwang?'],
      keywords: ['kenya mosebetsi', 'bapatsa', 'hira', 'post', 'ke hloka motho'],
      body:
        'Tobetsa Kenya. O hlalosa mosebetsi, moo o leng teng, dihora tse kae, le hore o lefa bokae ka hora.\n'
        + '• Mitha ya Tefo e nepahetseng e o bontsha kamoo tefo ya hao e bapisang le moputso o tlase wa naha wa {minWage} ka hora ha o ntse o ngola. Ho lefa ka tlase ho ona ha ho molaong.\n'
        + '• Sireletsa tefo ha o kenya mosebetsi, kapa hamorao. O ka e nka hape mahala ho fihlela o hira; o ke ke wa hira motho ho fihlela e sireleditswe. Basebeletsi ba bona Tjhelete e sireleditswe mosebetsing wa hao, mme ke sona se etsang hore batho ba lokileng ba etse kopo.\n'
        + '• Mosebetsi wa hao o hlaha hanghang ho basebeletsi ba haufi le wena.\n'
        + '• O bona bohle ba etsang kopo, le rekoto ya bona — tekanyetso, mesebetsi e phethilweng, boemo le dibeche.\n'
        + 'Ho kenya mosebetsi ke mahala, mme Vuka ha e nke khomishene.',
    },
    'choose-worker': {
      title: 'Ho kgetha motho eo o tla mo hira',
      asks: ['Ke kgetha mosebeletsi jwang?', 'Ke tseba jwang hore ke mang ya tshepahalang?', 'Maemo a bolela eng ha ke hira?'],
      keywords: ['kgetha', 'bakopi', 'tshepahalang', 'tshepo', 'ditsebo', 'talent'],
      body:
        'Mokopi e mong le e mong o na le rekoto e hahilweng ka mosebetsi oo a o entseng ka nnete ho Vuka — karolelano ya tekanyetso ya hae, palo ya mesebetsi eo a e phethileng, boemo ba hae, le hore na ID ya hae e netefaditswe.\n'
        + 'Boemo ke tsela e potlakileng ka ho fetisisa ya ho bala. Ya tshepahalang e bolela bonyane mesebetsi e meraro e phethilweng ka karolelano e ntle ntle le ditemoso tsa polokeho. Setsebi le Ya ka sehloohong di bolela ho feta hoo haholo.\n'
        + 'O ka boela wa sheba Ditsebo ka kotloloho mme wa mema motho mosebetsing ho ena le ho emela dikopo.\n'
        + 'Ho bohlokwa ho tseba: basebeletsi le bona ba o fa tekanyetso, mme tekanyetso eo e bontshwa mesebetsing ya hao. Ho netefatsa mosebetsi kapele le ho lefa seo o se bapaditseng ke hona ho etsang hore batho ba lokileng ba tswele pele ho etsa kopo ho wena.',
    },
    'employer-confirm': {
      title: 'Ho netefatsa mosebetsi o phethilweng',
      asks: ['Ke netefatsa jwang hore mosebetsi o phethilwe?', 'Hobaneng ke tlameha ho netefatsa?', 'Ho etsahalang haeba ke sa netefatse?'],
      keywords: ['netefatsa', 'amohela', 'fa mosebeletsi tekanyetso', 'phethilwe', 'confirm'],
      body:
        'Ha mosebeletsi a tshwaya mosebetsi o phethilwe o fumana tsebiso. E bule, netefatsa mosebetsi, mme o mo fe tekanyetso ho tse hlano le maikutlo a makgutshwane.\n'
        + 'Ka kopo etsa jwalo kapele. Ho wena ke ho tobetsa hanngwe; ho yena ke ho ngolwa rekotong ho mo bulelang boemo bo latelang le mofuta o latelang wa mosebetsi.\n'
        + 'Haeba o sa netefatse ka hara {autoReleaseHours}, mosebetsi o ngolwa ho mosebeletsi ka bowona, ntle le tekanyetso. Maikutlo a hao ke wona a lahlehang, mme maikutlo ao ke ntho ya bohlokwa ka ho fetisisa eo o ka e fang motho ya ntseng a haha nalane ya hae ya pele ya mosebetsi.\n'
        + 'Ho netefatsa ho boetse ho lokollela tefo eo o e sireleditseng sepacheng sa Vuka sa mosebeletsi. Ho tloha motsotsong oo o mo hirileng e ne e notletswe bakeng sa hae. Ditefo di ka mokgwa wa teko hajwale — ha ho tjhelete ya nnete e tsamayang.',
    },
    'employer-cost': {
      title: 'Seo mohiri a se lefang',
      asks: ['Ho kenya mosebetsi ho bitsa bokae?', 'Na Vuka e nka khomishene?', 'Mohiri o lefa bokae ho Vuka?'],
      keywords: ['khomishene', 'tefello', 'theko', 'mahala', 'mohiri'],
      body:
        'Ho kenya mosebetsi ke mahala mme ho hira ke mahala. Seo o se lefang ke tefo ka boyona, e sireletswang pele o hira, mme o ka e nka hape mahala ho fihlela o hira.\n'
        + 'Ditefo di ka mokgwa wa teko hajwale, kahoo ha ho tjhelete ya nnete e tsamayang ka Vuka mme ha ho letho le lefiswang. Tefello efe kapa efe, ha ditefo di se di bulwa, e tla bontshwa pele o lefa.',
    },
    'is-it-safe': {
      title: 'Ho dula o bolokehile',
      asks: ['Na Vuka e bolokehile?', 'Ke dula ke bolokehile jwang?', 'Na ho bolokehile ho ya ntlong ya motho eo ke sa mo tsebeng?', 'Ha ke ikutlwe ke bolokehile'],
      keywords: ['polokeho', 'bolokehile', 'kotsi', 'bomenemene', 'motho eo ke sa mo tsebeng', 'safe'],
      body:
        'Vuka e o fa tlhahisoleseding eo o ka ahlolang ka yona, empa ke wena ya tsamayang ho ya atereseng, kahoo mehato e bohlale ya polokeho e ntse e sebetsa:\n'
        + '• Hlahloba hore na ID ya mohiri e netefaditswe, mme o shebe tekanyetso ya hae ho tswa ho basebeletsi ba bang.\n'
        + '• Boloka puisano ka hara app. Ke rekoto, mme e ka balwa ke motho haeba ho na le se sa tsamayang hantle.\n'
        + '• Bolella motho moo o yang teng le hore o lebeletse ho kgutla neng.\n'
        + '• Dumellanang ka tefo pele o tsamaya.\n'
        + '• O se ke wa lefa motho ho fumana mosebetsi, mme o se ke wa romela ID ya hao kapa dintlha tsa banka ho motho ya di kopang puisanong.\n'
        + 'Haeba ho hong ho sa utlwahale hantle, tsamaya. O ka tlaleha motho, wa mo thiba, mme wa phahamisa temoso ya polokeho mosebetsing.',
    },
    'scam-warning': {
      title: 'Ha motho a o kopa tjhelete kapa ditokomane',
      asks: ['Motho o nkopa tjhelete hore ke fumane mosebetsi', 'Mohiri o kopile nomoro ya ka ya ID puisanong', 'Na sena ke bomenemene?', 'Is this a scam?'],
      keywords: ['bomenemene', 'scam', 'mashodu', 'o kopa tjhelete', 'tefello ya ngodiso', 'deposit', 'pin', 'otp', 'ho belaella'],
      body:
        'Ema, mme o ba tlalehe. Ena ke mekgwa e lokelang ho tsejwa ka hlooho, hobane e nngwe le e nngwe ya yona ke motho ya lekang ho utswetsa motho ya batlang mosebetsi:\n'
        + '• Ho o kopa ho lefa eng kapa eng — tefello ya ngodiso, dipositi, tjeo ya “thupelo”, tjhelete ya leeto esale pele. Vuka ke mahala mme ha ho mohiri wa nnete ya o lefisang hore o sebetse.\n'
        + '• Ho kopa nomoro ya hao ya ID, setshwantsho sa ID ya hao, kapa dintlha tsa hao tsa banka puisanong. Mohiri wa nnete ha a hloke letho la tsona ho o fa mosebetsi wa letsatsi. Vuka e kopa ID ya hao ka hara app feela, bakeng sa netefatso, mme ha ho mohla e e kopang ka molaetsa.\n'
        + '• Ho kopa OTP kapa PIN. Ha ho motho wa nnete ya tla di kopa. Eseng Vuka, eseng banka ya hao, eseng mohiri.\n'
        + '• Ho o qobella ho isa puisano nomorong e nngwe le ho lefa moo.\n'
        + 'Boloka puisano ka hara app hore ho be le rekoto, ba thibe, mme o ba tlalehe ho Setsi sa polokeho. Motho o bala tlaleho e nngwe le e nngwe.\n'
        + 'Ha o a etsa phoso ka ho kopuwa. Ho tlaleha ho sireletsa motho ya latelang.',
    },
    'report-someone': {
      title: 'Ho tlaleha motho',
      asks: ['Ke tlaleha motho jwang?', 'Motho ha a ka a ntefa', 'Ke tlaleha bomenemene jwang?', 'Mohiri o ne a hloka mekgwa ho nna'],
      keywords: ['tlaleha', 'tlaleho', 'ha a ntefa', 'tlhekefetso', 'hloka mekgwa', 'setsi sa polokeho', 'utswitswe', 'tshositswe', 'otlilwe', 'report'],
      body:
        'Sebedisa Setsi sa polokeho ka tlasa Nna, kapa o phahamise temoso ha o tshwaya mosebetsi o phethilwe.\n'
        + 'Re bolelle se etsahetseng ka mantswe a hao. Ditlaleho di ya lenaneng le balwang ke motho — ha di sebetswe ke motjhini.\n'
        + 'Tlaleha mang kapa mang ya sa o lefeng seo le se dumellaneng, ya o kopang tjhelete ho fumana mosebetsi, ya kopang ID ya hao kapa dintlha tsa banka puisanong, kapa ya itshwarang ka tsela e etsang hore o se bolokehe.\n'
        + 'Ho tlaleha ha ho behe rekoto ya hao kotsing.',
    },
    'block-someone': {
      title: 'Ho thiba motho',
      asks: ['Ke thiba motho jwang?', 'Nka thibela motho ho nthomela melaetsa?', 'Ke block motho jwang?'],
      keywords: ['thiba', 'block', 'emisa melaetsa', 'hlokomoloha'],
      body:
        'Bula puisano le motho eo mme o mo thibe. A ke ke a hlola a o romela melaetsa, mme o ke ke wa bona melaetsa e tswang ho yena.\n'
        + 'Ho thiba ho fapane le ho tlaleha. Ho thiba ho emisa kgokahano; ho tlaleha ho re bolella hore ho na le ntho eo motho a lokelang ho e sheba. Haeba motho a entse phoso, etsa ka bobedi.',
    },
    'id-verification': {
      title: 'Netefatso ya ID',
      asks: ['Ke netefatsa ID ya ka jwang?', 'Letshwao la netefatso le bolela eng?', 'Hobaneng ke lokela ho netefatsa boitsebiso ba ka?'],
      keywords: ['id', 'boitsebiso', 'netefatsa', 'letshwao', 'sa id', 'tokomane'],
      body:
        'O ka romela nomoro ya hao ya ID ya Afrika Borwa hore e netefatswe. Ha motho a se a e hlahlobile, letshwao la netefatso le hlaha profaeleng ya hao mme o fumana beche ya ID e Netefaditswe.\n'
        + 'Ha ho qobellwe, mme o ka sebedisa Vuka ntle le yona. Ho bohlokwa ho e etsa: mohiri ya kgethang pakeng tsa bakopi ba babedi o tla nka ya netefaditsweng, mme mosebeletsi ya nahanang hore na a ye atereseng o tla ikutlwa a fapane haholo ka mohiri ya netefaditsweng.\n'
        + 'Nomoro ya hao ya ID e patilwe ka khoutu mme ha e bontshwe basebedisi ba bang. Seo ba se bonang ke letshwao la netefatso, eseng nomoro.',
    },
    'what-data': {
      title: 'Seo Vuka e se tsebang ka wena',
      asks: ['Le boloka data efe ka nna?', 'Ke mang ya ka bonang dintlha tsa ka?', 'Na data ya ka ke lekunutu?'],
      keywords: ['data', 'lekunutu', 'popia', 'dintlha tsa botho', 'privacy', 'ke mang ya bonang'],
      body:
        'Vuka e boloka seo e se hlokang ho sebetsa: lebitso la hao le nomoro ya mohala, profaele ya hao, nalane ya hao ya mosebetsi le ditekanyetso, melaetsa ya hao, mme — haeba o kgethile ho di kenya — nomoro ya hao ya ID le dintlha tsa banka, ka bobedi di patilwe ka khoutu.\n'
        + 'Basebedisi ba bang ba bona lebitso la hao, sebaka sa hao, rekoto ya hao le dibeche tsa hao. Ha ba bone nomoro ya hao ya mohala, nomoro ya hao ya ID kapa dintlha tsa hao tsa banka.\n'
        + 'Diseva di ho {hosting}.\n'
        + 'O na le ditokelo ka tlasa POPIA tsa ho bona se bolokilweng ka wena, ho se lokisa, le hore se hlakolwe. Tsebiso ya Lekunutu ka tlasa Nna e hlalosa kamoo o ka kopang kateng, le hore o kope ho mang.',
    },
    'delete-account': {
      title: 'Ho hlakola akhaonto ya hao',
      asks: ['Ke hlakola akhaonto ya ka jwang?', 'Nka tlosa dintlha tsa ka?', 'Ke delete account jwang?'],
      keywords: ['hlakola', 'tlosa', 'kwala akhaonto', 'delete', 'tsamaya'],
      body:
        'O ka kopa hore akhaonto ya hao le dintlha tsa hao tsa botho di hlakolwe. Tsebiso ya Lekunutu ka tlasa Nna e na le dintlha tsa ho ikopanya bakeng sa kopo eo, e leng tokelo eo o nang le yona ka tlasa POPIA, eseng mohau.\n'
        + 'Ho bohlokwa ho nahana pele: ho hlakola ho tlosa rekoto ya hao ya mosebetsi, e leng botumo boo o bo hahileng le ntho e o bulelang mesebetsi ya semmuso. E ke ke ya hahwa botjha ho tloha lefeela. Haeba o mpa o batla ho phomola nakwana, o ka mpa wa emisa — ha ho letho le felang.',
    },
    'chats': {
      title: 'Ho romela melaetsa',
      asks: ['Ke romela motho molaetsa jwang?', 'Dipuisano tsa ka di hokae?', 'Nka romela molaetsa wa lentswe?'],
      keywords: ['dipuisano', 'molaetsa', 'melaetsa', 'molaetsa wa lentswe', 'setshwantsho', 'chat'],
      body:
        'Dipuisano di ka hara app, pakeng tsa hao le batho bao o sebetsang le bona.\n'
        + '• O ka romela mongolo, melaetsa ya lentswe le ditshwantsho.\n'
        + '• Molaetsa wa lentswe hangata o bonolo ho feta ho ngola — haholo ka puo ya hao, kapa ha o hlalosa moo o leng teng.\n'
        + '• Melaetsa e ngotsweng ho se na netweke e romelwa ha netweke e kgutla.\n'
        + 'Boloka dipuisano tsa mosebetsi ka hara app ho ena le ho fetela nomorong e nngwe. Ke rekoto, mme haeba ho na le se sa tsamayang hantle ke yona eo motho ya shebang tlaleho a ka e balang ka nnete.',
    },
    'notifications': {
      title: 'Ditsebiso',
      asks: ['Ke fumana ditsebiso tsa mesebetsi jwang?', 'Ke bulela ditsebiso jwang?', 'Ke emisa ditsebiso jwang?', 'Hobaneng ke sa fumane ditsebiso?'],
      keywords: ['ditsebiso', 'tsebiso', 'tshepe', 'alerts', 'notifications', 'kgutso', 'dihora tsa kgutso'],
      body:
        'Tobetsa tshepe e ka hodimo skrineng ho bona ditaba tsohle tsa mesebetsi ya hao, tefo ya hao le akhaonto ya hao.\n'
        + 'Ho kgetha se fihlang mohaleng wa hao, bula Nna, ebe Ditsebiso. Di bulele mohala ona, ebe o kgetha mefuta eo o e batlang: melaetsa, mesebetsi e metjha haufi le wena, ditaba tsa mosebetsi, ditefo le ditsebiso tsa akhaonto.\n'
        + 'O ka pata mabitso le melaetsa skrineng sa ho notlela, mme o behe dihora tsa kgutso hore ho se be letho le llang bosiu. Eng kapa eng eo o e tjhesang e ntse e o emetse ka tlasa tshepe.\n'
        + 'Haeba o ile wa hana tumello pele, dumella ditsebiso tsa Vuka hape ho disetting tsa mohala wa hao kapa tsa sebadi. App e ke ke ya kopa lekgetlo la bobedi.',
    },
  },
  live: {
    'my-score': {
      title: 'Vuka Score ya hao',
      asks: ['Vuka Score ya ka ke bokae?', 'Ke tsamaya jwang?', 'Score ya ka e hokae hona jwale?'],
      keywords: ['score ya ka', 'dintlha tsa ka', 'ke tsamaya jwang'],
    },
    'my-tier': {
      title: 'Boemo ba hao',
      asks: ['Ke boemong bofe?', 'Boemo ba ka ke bofe?', 'Ke hole hakae le boemo bo latelang?', 'My tier ke efe?'],
      keywords: ['boemo ba ka', 'tier ya ka', 'boemo bo latelang', 'ke hole hakae'],
    },
    'my-jobs': {
      title: 'Mesebetsi eo o e phethileng',
      asks: ['Ke phethile mesebetsi e mekae?', 'Ke entse mesebetsi e mekae?', 'Mesebetsi ya ka e phethilweng ke e mekae?'],
      keywords: ['mesebetsi ya ka', 'e mekae', 'ke phethile'],
    },
    'my-earnings': {
      title: 'Seo o se fumaneng',
      asks: ['Ke fumane tjhelete e kae?', 'Ke se ke fumane bokae kaofela?', 'How much ke e fumane?'],
      keywords: ['tjhelete ya ka', 'ke fumane', 'kaofela'],
    },
    'my-badges': {
      title: 'Dibeche tsa hao',
      asks: ['Ke na le dibeche dife?', 'Ke fumane dibeche dife?', 'Dibeche tsa ka ke dife?'],
      keywords: ['dibeche tsa ka', 'beche ya ka'],
    },
    'my-wallet': {
      title: 'Sepache sa hao',
      asks: ['Ho na le bokae sepacheng sa ka?', 'Balance ya ka ke bokae?', 'Nka ntsha bokae?', 'Ho na le bokae ho wallet ya ka?'],
      keywords: ['sepache sa ka', 'wallet ya ka', 'balance ya ka', 'nka ntsha'],
    },
    'my-applications': {
      title: 'Mesebetsi eo o e etseditseng kopo',
      asks: ['Ke entse dikopo tse kae?', 'Ke entse kopo ya eng?', 'Dikopo tsa ka di kae?'],
      keywords: ['dikopo tsa ka', 'kopo ya ka', 'ke entse kopo'],
    },
    'my-verification': {
      title: 'Hore na ID ya hao e netefaditswe',
      asks: ['Na ke netefaditswe?', 'Na ID ya ka e netefaditswe?', 'Am I verified?'],
      keywords: ['ke netefaditswe', 'id ya ka'],
    },
    'jobs-near-me': {
      title: 'Mosebetsi o haufi le wena',
      asks: ['Ho na le mosebetsi ofe haufi le nna?', 'Na ho na le mesebetsi hona jwale?', 'Ho na le mesebetsi e mekae haufi?'],
      keywords: ['haufi le nna', 'hona jwale', 'mesebetsi e teng'],
    },
    'my-messages': {
      title: 'Melaetsa ya hao e sa balwang',
      asks: ['Na ke na le melaetsa?', 'Ho na le melaetsa e sa balwang?', 'Any messages ho nna?'],
      keywords: ['melaetsa ya ka', 'e sa balwang', 'melaetsa e metjha'],
    },
  },
  text: {
    noRecord: 'Ha o so phethe mosebetsi, kahoo ha ho letho rekotong ya hao leo nka le balang. Mosebetsi wa hao wa pele o phethilweng o e qala — kamora moo e itlatsa ka boyona.',

    'fill.tierFirst': 'boemo boo bohle ba qalang ho bona',
    'fill.tierReqs': 'mesebetsi e {jobs} e phethilweng, dinaledi tse {rating} kapa ho feta, ho se na ditemoso tsa polokeho',
    'fill.tierLine': '• {icon} {name} — {entry}. E bula: {unlocks}',
    'fill.categoryLine': '• {list}.',
    'fill.badgeLine': '• {icon} {label} — {desc}.',
    'fill.hours_one': 'hora e le {count}',
    'fill.hours_other': 'dihora tse {count}',
    'fill.days_one': 'letsatsi le le {count}',
    'fill.days_other': 'matsatsi a {count}',
    'fill.listSep': ', ',

    'score.value': 'Vuka Score ya hao ke {rep} ho tse 100.',
    'score.built': 'E hahilwe ka {jobs}, karolelano ya dinaledi tse {avg}, le {safety}.',
    'score.jobs_one': 'mosebetsi o le {count} o phethilweng',
    'score.jobs_other': 'mesebetsi e {count} e phethilweng',
    'score.clean': 'rekoto e hlwekileng ya polokeho',
    'score.flags_one': 'temoso e le {count} ya polokeho',
    'score.flags_other': 'ditemoso tse {count} tsa polokeho',
    'score.flagHolding': 'Temoso ke yona e e theolang, mme e boetse e thiba boemo ba hao bo latelang.',
    'score.strong': 'Ke rekoto e matla. Bahiri ba shebang basebeletsi ba tla o bona hodimo lenaneng.',

    'tier.youAre': 'O {icon} {name} — {tagline}.',
    'tier.unlocks': 'Seo se bula: {unlocks}',
    'tier.top': 'Ke hodimo ho The Ladder. Ha ho letho ka hodimo ho moo.',
    'tier.next': 'Bo latelang ke {icon} {name}.',
    'tier.needJobs_one': 'mosebetsi o mong o le {count} o phethilweng',
    'tier.needJobs_other': 'mesebetsi e meng e {count} e phethilweng',
    'tier.needRating': 'karolelano ya dinaledi tse {rating} kapa ho feta — ya hao ke {avg}',
    'tier.needClean': 'rekoto e hlwekileng — temoso ya polokeho e a o thiba',
    'tier.allMet': 'O fihlela dipehelo tsohle tsa bona.',
    'tier.stillNeed': 'O sa ntse o hloka {list}.',
    'tier.and': ', le ',

    'jobs.done_one': 'O phethile mosebetsi o le {count} ho Vuka, ho {kinds}, ka karolelano ya dinaledi tse {avg}.',
    'jobs.done_other': 'O phethile mesebetsi e {count} ho Vuka, ho {kinds}, ka karolelano ya dinaledi tse {avg}.',
    'jobs.kinds_one': 'mofuta o le {count} wa mosebetsi',
    'jobs.kinds_other': 'mefuta e {count} ya mosebetsi',

    'earn.total_one': 'O fumane {amount} ho tswa mosebetsing o le {count} o phethilweng, ho baltswe ka tefo eo mosebetsi o mong le o mong o neng o e bontsha. Se leng sepacheng sa hao hona jwale ke palo e nngwe — mpotse “ho na le bokae sepacheng sa ka”.',
    'earn.total_other': 'O fumane {amount} ho tswa mesebetsing e {count} e phethilweng, ho baltswe ka tefo eo mosebetsi o mong le o mong o neng o e bontsha. Se leng sepacheng sa hao hona jwale ke palo e nngwe — mpotse “ho na le bokae sepacheng sa ka”.',

    'badges.none': 'Ha o so fumane beche. Ya pele, Mosebetsi wa Pele, e fihla hang ha mosebetsi wa hao wa pele o netefatswa.',
    'badges.earned': 'O fumane dibeche tse {earned} ho tse {total}: {list}.',
    'badges.item': '{icon} {label}',
    'badges.missing': 'Tse sa tlang: {list}.',
    'badges.missingItem': '{label}, {desc}',
    'badges.missingSep': '; ',

    'wallet.loading': 'Sepache sa hao se sa ntse se laisa. Mpotse hape kapelenyana, kapa o bule Nna, ebe Sepache sa ka.',
    'wallet.error': 'Ha ke a kgona ho bala sepache sa hao hona jwale. Bula Nna, ebe Sepache sa ka, ho se bona.',
    'wallet.balance': 'O na le {amount} sepacheng sa hao, e loketse ho ntshetswa bankeng ya hao.',
    'wallet.empty': 'Sepache sa hao ha se na letho hona jwale.',
    'wallet.pending': '{amount} e nngwe e sireleditswe mesebetsing eo o e etsang. E tla fihla ha o mong le o mong o netefatswa.',
    'wallet.howLands': 'Tefo e kena mona ha mohiri a netefatsa mosebetsi oo o o entseng.',
    'wallet.test': 'Ditefo di ka mokgwa wa teko hajwale, kahoo ha ho tjhelete ya nnete e tsamaileng.',

    'apps.none': 'Ha o so etse kopo ya letho. Fumana mosebetsi e bontsha mesebetsi e haufi le wena, mme ho etsa kopo ke ho tobetsa hanngwe.',
    'apps.some_one': 'O entse kopo ya mosebetsi o le {count}. Bahiri ba bona bohle ba entseng kopo mme ba kgetha ho bona, kahoo ho se utlwe letho ka o mong ho a tlwaeleha — tswela pele ho etsa dikopo.',
    'apps.some_other': 'O entse dikopo tsa mesebetsi e {count}. Bahiri ba bona bohle ba entseng kopo mme ba kgetha ho bona, kahoo ho se utlwe letho ka o mong ho a tlwaeleha — tswela pele ho etsa dikopo.',

    'verified.yes': 'E — boitsebiso ba hao bo netefaditswe, mme letshwao la netefatso le bonahala profaeleng ya hao. Ke e nngwe ya dintho tsa pele tseo lehlakore le leng le di shebang.',
    'verified.no': 'Tjhe, ha e so. O ka romela nomoro ya hao ya ID ya Afrika Borwa ka tlasa Nna hore o netefatswe. Ha ho qobellwe, empa mohiri ya kgethang pakeng tsa batho ba babedi o tla nka ya netefaditsweng.',

    'near.none': 'Ha ho letho lenaneng la hao hona jwale. Mesebetsi e metjha e kenngwa letsatsi lohle — bulela Mesebetsi e metjha haufi le nna ka tlasa Nna, ebe Ditsebiso, mme mohala wa hao o tla o bolella, ho ena le hore o dule o sheba.',
    'near.some_one': 'Ho na le mosebetsi o le {count} lenaneng la hao hona jwale, o haufi ka ho fetisisa o le pele. Bula Fumana mosebetsi ho o bona.',
    'near.some_other': 'Ho na le mesebetsi e {count} lenaneng la hao hona jwale, e haufi ka ho fetisisa e le pele. Bula Fumana mosebetsi ho e bona.',

    'messages.none': 'Ha o na melaetsa e sa balwang. Eng kapa eng e ntjha e tswang ho mohiri e tla hlaha ho Dipuisano, mme mohala wa hao o ka o bolella ha Melaetsa e butswe ka tlasa Nna, ebe Ditsebiso.',
    'messages.some_one': 'O na le molaetsa o le {count} o sa balwang o emetseng ho Dipuisano.',
    'messages.some_other': 'O na le melaetsa e {count} e sa balwang e emetseng ho Dipuisano.',
  },
};
