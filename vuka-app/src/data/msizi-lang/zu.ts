/**
 * Msizi in isiZulu: every written answer, the live answers' headings and
 * phrasings, and the sentences live answers are built from.
 *
 * Keyed by the English ids in data/msizi.ts; anything missing falls back to
 * English. Not written by a first-language speaker — a first-language
 * speaker's correction wins. Keep every {placeholder} exactly.
 *
 * Screen and button names are the ones the app shows in isiZulu: Mina (Me),
 * Thola umsebenzi (Find work), Irekhodi lami (My Record), Izingxoxo (Chats),
 * Faka (Post), Amakhono (Talent), Izaziso (Notifications), Ulimi (Language),
 * Isikhungo sokuphepha (Safety centre), Isikhwama sami (My wallet),
 * Thola inkokhelo (Get paid), Imali ivikelwe (Funds secured),
 * Kulindwe imali (Awaiting funds), Kukhokhiwe (Paid out),
 * Imisebenzi emisha eseduze (New gigs near me).
 */
import type { MsiziLang } from './types';

export const msiziZu: MsiziLang = {
  entries: {
    /* ---------------- What this is ---------------- */
    'what-is-vuka': {
      title: 'Iyini i-Vuka Uzenzele',
      asks: ['Iyini i-Vuka?', 'Le app yenzani?', 'Ngichazele ngale app', 'What is Vuka ngesiZulu?'],
      keywords: ['mayelana', 'inhloso', 'vuka', 'uzenzele', 'app'],
      body:
        'I-Vuka Uzenzele ixhumanisa intsha yaseNingizimu Afrika nomsebenzi — iqala ngemisebenzi emincane yesikhashana yasendaweni, bese ikhula iye emisebenzini esemthethweni.\n'
        + 'Umqondo ulula. Awudingi i-CV ukuze uqale. Wenza umsebenzi, umqashi akulinganise, bese leso silinganiso siba irekhodi lakho. Uma usenze umsebenzi omuhle owanele, ukhuphuka ku-Ladder, evula imisebenzi ekhokha kangcono nesemthethweni kakhulu.\n'
        + 'Ukuyisebenzisa kumahhala, kubasebenzi nakubaqashi.\n'
        + 'ENingizimu Afrika, ukuntuleka kwemisebenzi entsheni eneminyaka eyi-15 kuya kwengama-24 kungu-{youthUnemployment}. Le app ikhona ukuze inikeze abantu indlela yokungena lapho kungekho muntu obanika ithuba lokuqala.',
    },
    'is-it-free': {
      title: 'Kubiza malini',
      asks: ['Ingabe i-Vuka imahhala?', 'Ibiza malini le app?', 'Kufanele ngikhokhe ukuze ngiyisebenzise?', 'Is it free?'],
      keywords: ['mahhala', 'imahhala', 'kumahhala', 'ibiza', 'intengo', 'imali yokubhalisa', 'inkokhelo yanyanga zonke'],
      body:
        'I-Vuka imahhala. Ayikho imali yokubhalisa, ayikho imali yanyanga zonke, futhi awukhokhi lutho ukuze ufake isicelo somsebenzi noma ufake umsebenzi.\n'
        + 'I-Vuka ayithathi ingxenye yalokho okuholayo. Inkokhelo yomsebenzi ivikelwa umqashi ngaphambi kokuba umsebenzi uqale, bese ingena esikhwameni sakho uma umsebenzi uqinisekisiwe — okwamanje lokhu kusesemodini yokuhlola, ngakho ayikho imali yangempela ehamba nge-Vuka okwamanje.\n'
        + 'Uma noma ubani ekucela ukuthi ukhokhe imali ukuze uthole umsebenzi ku-Vuka, lokho kungumkhonyovu. Kubike.',
    },
    'who-is-msizi': {
      title: 'Ungubani uMsizi',
      asks: ['Ungubani wena?', 'Ungenzani wena?', 'Uyirobhothi?', 'Ubani okwenzile?', 'Ubani owakha uMsizi?'],
      keywords: ['msizi', 'umsizi', 'irobhothi', 'robhothi', 'bot', 'ai', 'wena'],
      body:
        'NginguMsizi — "umsizi" usho umuntu osizayo. Ngiphendula imibuzo mayelana nendlela i-Vuka esebenza ngayo.\n'
        + 'Angiyona i-AI futhi angiqageli. Ngiyiqoqo lezimpendulo ezibhaliwe nezihlolwe ngokuthi le app isebenza kanjani ngempela, ngakho uma ngikutshela okuthile, kuyiqiniso nge-Vuka. Uma kukhona engingakwazi, ngizokusho kunokuba ngiqambe amanga.\n'
        + 'Ngingakufundela irekhodi lakho — amaphuzu akho, izinga lakho, imisebenzi yakho, izicelo zakho — ngoba lokho sekuvele kusefonini yakho. Angikwazi ukukufakela izicelo zemisebenzi, ukuqasha umuntu, noma ukuthinta imininingwane yakho yasebhange. Lokho kuhlala kuyisinqumo sakho, njalo.\n'
        + 'Ungangibhalela noma uthephe imakrofoni ukhulume nami.',
    },
    'msizi-languages': {
      title: 'Ukukhuluma noMsizi ngolimi lwakho',
      asks: ['Uyakwazi ukukhuluma isiZulu?', 'Ukhuluma ziphi izilimi?', 'Ngingakhuluma nawe ngolimi lwami?', 'Uyasazi isiZulu?'],
      keywords: ['ulimi', 'izilimi', 'isizulu', 'isixhosa', 'sesotho', 'afrikaans', 'isingisi', 'ukhuluma', 'humusha'],
      body:
        'Ungangibuza imibuzo ngesiZulu, ngesiXhosa, ngeSesotho, nge-Afrikaans noma ngesiNgisi, futhi ngizoyizwa imisho evamile kuzo zonke.\n'
        + 'Ngiphendula ngolimi i-app esethwe kulo. Izimpendulo zami zihunyushwe ngokucophelela, kodwa azikahlolwa umuntu okhuluma lolu limi njengolimi lwakhe lokuqala, ngakho uma okuthile kungazwakali kahle, sicela usitshele esikrinini sokuthi Ulimi.\n'
        + 'Ukukhuluma ngezwi kuncike olimini lwakho nasefonini yakho. NgesiNgisi nange-Afrikaans ngiyakwazi ukukulalela kumafoni amaningi. Amazwi esiZulu, esiXhosa neSesotho ikakhulukazi awakabikho kumafoni, ngakho kulezo zilimi kungenzeka ngikwazi ukuphendula ngokubhala kuphela. Uma eyakho ingakwazi ulimi lwakho, ngizokutshela esikrinini kunokuthi ngithule nje ngingenzi lutho.',
    },

    /* ---------------- Getting started ---------------- */
    'how-to-start': {
      title: 'Ukuqala',
      asks: ['Ngiqala kanjani?', 'Ngibhalisa kanjani?', 'Ngivula kanjani i-akhawunti?', 'How do I sign up ku-Vuka?'],
      keywords: ['qala', 'bhalisa', 'ukubhalisa', 'joyina', 'akhawunti', 'omusha'],
      body:
        'Khetha ukuthi ufuna umsebenzi noma ufuna ukuqasha, bese ubhalisa ngenombolo yakho yeselula.\n'
        + '• Sikuthumelela ikhodi yesikhathi esisodwa nge-SMS ukuze sihlole ukuthi inombolo ngempela ngeyakho.\n'
        + '• Ukhetha iphasiwedi bese wengeza imininingwane embalwa — indawo yakho, iminyaka yakho, izinhlobo zomsebenzi ongawenza.\n'
        + '• Yilokho kuphela. Ungaqala ukufaka izicelo zemisebenzi yesikhashana ngokushesha, ngaphandle kwe-CV nangaphandle komlando womsebenzi.\n'
        + 'Umsebenzi wakho wokuqala yiwona oqalisa irekhodi lakho. Ngemva kwalokho, irekhodi likukhulumela.',
    },
    'worker-or-employer': {
      title: 'I-akhawunti yesisebenzi noma i-akhawunti yomqashi',
      asks: ['Uyini umehluko phakathi kwe-akhawunti yesisebenzi neyomqashi?', 'Ngikhethe iyiphi i-akhawunti?', 'Ngibe yisisebenzi noma umqashi?'],
      keywords: ['isisebenzi', 'umqashi', 'uhlobo lwe-akhawunti', 'umehluko', 'khetha'],
      body:
        'I-akhawunti yesisebenzi eyokuthola umsebenzi. Ubuka imisebenzi yesikhashana, ufaka isicelo, wenza umsebenzi, bese wakha irekhodi elivula imisebenzi engcono.\n'
        + 'I-akhawunti yomqashi eyokuqasha. Ufaka umsebenzi, ubona ukuthi ubani ofake isicelo, ukhetha umuntu, bese uqinisekisa umsebenzi uma usuqediwe.\n'
        + 'Inombolo eyodwa yeselula yi-akhawunti eyodwa, ngakho khetha leyo ehambisana nalokho okuzokwenza lapha. Uma uzidinga zombili, sebenzisa enye inombolo kweyesibili.',
    },
    'minimum-age': {
      title: 'Kufanele ube neminyaka emingaki',
      asks: ['Kufanele ngibe neminyaka emingaki?', 'Ngingasebenza ku-Vuka uma ngineminyaka eyi-16?', 'Iminyaka ephansi ingakanani?'],
      keywords: ['iminyaka', 'mdala', 'omncane', 'ngaphansi kweminyaka eyi-18', 'umfundi', 'ingane'],
      body:
        'Kufanele ube neminyaka eyi-18 noma ngaphezulu ukuze usebenzise i-Vuka.\n'
        + 'Umthetho waseNingizimu Afrika uyabavumela abantu kusukela eminyakeni eyi-15 ukuthi benze umsebenzi othile, ngakho lo ngumkhawulo wethu, hhayi owezwe. Isizathu yi-POPIA: noma ubani ongaphansi kweminyaka eyi-18 ngokomthetho uyingane, futhi imininingwane yomuntu siqu yengane ayinakuphathwa ngaphandle kwemvume yomzali noma yomgcini. I-Vuka ayikabi nayo indlela yokuthola nokuqinisekisa leyo mvume, ngakho kunokuba siqoqe umazisi wosemusha, indawo yakhe nemininingwane yakhe yasebhange ngaphandle kwayo, asiyivuli nhlobo i-akhawunti.\n'
        + 'Uma usuzogcwalisa iminyaka eyi-18 maduze, bhalisa ngaleso sikhathi. Akukho okulahlekayo ngokulinda.',
    },
    'otp-problems': {
      title: 'Uma ikhodi ye-SMS ingafiki',
      asks: ['Angiyitholanga i-OTP yami', 'Ikhodi ye-SMS ayifiki', 'Angikwazi ukuqinisekisa inombolo yami', 'OTP ayingeni'],
      keywords: ['otp', 'sms', 'ikhodi', 'qinisekisa', 'ayifikanga', 'umlayezo'],
      body:
        'Ikhodi ithunyelwa nge-SMS futhi ivamise ukufika kungakapheli umzuzu.\n'
        + '• Hlola inombolo oyibhalile, kuhlanganise no-0 wokuqala.\n'
        + '• Qiniseka ukuthi unalo uphawu lwenethiwekhi. Ikhodi ayikwazi ukufika uma ifoni ingenayo inethiwekhi.\n'
        + '• Linda umzuzu ophelele ngaphambi kokucela enye — ukucela eziningi ngokulandelana kungakuvimba isikhashana.\n'
        + 'Uma ingakafiki nokho, inkinga isohlangothini lwethu, hhayi olwakho, futhi i-app izokusho lokho kunokuba ikushiye uqagela.',
    },
    'forgot-password': {
      title: 'Ukukhohlwa iphasiwedi',
      asks: ['Ngikhohlwe iphasiwedi yami', 'Ngiyishintsha kanjani iphasiwedi engiyikhohliwe?', 'Angikwazi ukungena', 'Forgot password'],
      keywords: ['iphasiwedi', 'ngikhohlwe', 'khohlwe', 'setha kabusha', 'ngena', 'angikwazi ukungena'],
      body:
        'Esikrinini sokungena, khetha ukusetha kabusha iphasiwedi yakho. Sithumela ikhodi enombolweni yakho yeselula, futhi uma usuyifakile ungasetha iphasiwedi entsha.\n'
        + 'Ukusetha kabusha kusebenza kuphela enombolweni i-akhawunti eyavulwa ngayo — yilokho okuvimbela omunye umuntu ukuthi akusethele kabusha iphasiwedi yakho.',
    },
    'change-language': {
      title: 'Ukushintsha ulimi',
      asks: ['Ngilushintsha kanjani ulimi?', 'Ngingayisebenzisa le app ngesiZulu?', 'Ngifuna ukushintsha ulimi lwe-app', 'Change language'],
      keywords: ['ulimi', 'shintsha', 'isizulu', 'isixhosa', 'sesotho', 'afrikaans', 'isingisi', 'shintshela'],
      body:
        'Vula Mina, bese uvula Ulimi. I-Vuka itholakala ngesiNgisi, ngesiZulu, ngesiXhosa, ngeSesotho nange-Afrikaans, futhi okukhethile kuyakhunjulwa noma ungekho ku-inthanethi.\n'
        + 'Qaphela ukuthi i-app ihunyushwa isikrini nesikrini, ngakho ezinye izikrini zisesesiNgisini. Isikrini sokuthi Ulimi sikutshela ngokwethembeka ukuthi sekufike kuphi.\n'
        + 'Amakhasi asemthethweni ahlala esesiNgisini ngenhloso — igama elisemthethweni elihunyushwe kabi liyabadukisa abantu, futhi lokho kubi kakhulu kunokukucela ukuthi uwafunde ngesiNgisi.\n'
        + 'Uma inguqulo ingazwakali kahle kuwe, kukhona ibhokisi kuleso sikrini lokusitshela. Umuntu uyakufunda lokho.',
    },
    'install-app': {
      title: 'Ukufaka i-Vuka efonini yakho',
      asks: ['Ngiyifaka kanjani i-app?', 'Ngingayengeza esikrinini sasekhaya?', 'Ikhona i-app engiyilandayo?', 'How do I install ku-phone yami?'],
      keywords: ['faka', 'landa', 'isikrini sasekhaya', 'app store', 'play store', 'install'],
      body:
        'I-Vuka ifakwa ngqo isuka esipheqululini — akukho okufanele ukulande esitolo sama-app, okusho ukuthi akukho kulanda okukhulu futhi awuchithi idatha ezibuyekezweni.\n'
        + 'Bheka inkinobho yokufaka ku-app, noma usebenzise imenyu yesiphequluli sakho bese ukhetha okuthi Engeza esikrinini sasekhaya.\n'
        + 'Uma isifakiwe ivuleka njenganoma iyiphi enye i-app, isebenza noma uphawu lubuthakathaka, futhi ikhombisa izikrini zakho ezigciniwe noma ungekho ku-inthanethi.',
    },
    'works-offline': {
      title: 'Ukusebenzisa i-Vuka ngaphandle kwedatha',
      asks: ['Iyasebenza ngaphandle kwe-inthanethi?', 'Ngingayisebenzisa i-Vuka ngaphandle kwedatha?', 'Kwenzekani uma uphawu lulahleka?', 'Ayikho idatha efonini'],
      keywords: ['inthanethi', 'idatha', 'uphawu', 'uxhumano', 'inethiwekhi', 'offline', 'ngaphandle kwedatha'],
      body:
        'Ingxenye, futhi lokho kwenziwe ngamabomu. I-Vuka yakhelwe ifoni enephakethe ledatha elingenalutho endaweni enophawu olulodwa nje.\n'
        + '• I-app ngokwayo iyavuleka ngaphandle kophawu, ngolimi olukhethile.\n'
        + '• Izikrini osuzibonile zihlala zifundeka.\n'
        + '• Imiyalezo oyithumela ungekho ku-inthanethi iyalinda bese ihamba uma uphawu lubuya, kunokuba ilahleke.\n'
        + 'Okudinga uxhumano yilokhu: imisebenzi emisha, ukufaka isicelo, nanoma yini okufanele ifike komunye umuntu.',
    },

    /* ---------------- Finding work ---------------- */
    'find-work': {
      title: 'Ukuthola umsebenzi',
      asks: ['Ngiwuthola kanjani umsebenzi?', 'Ikuphi imisebenzi?', 'Ngifaka kanjani isicelo somsebenzi?', 'Ngidinga umsebenzi', 'Ngifuna i-job'],
      keywords: ['thola', 'umsebenzi', 'imisebenzi', 'job', 'gig', 'sesha', 'faka isicelo', 'isicelo'],
      body:
        'Thepha okuthi Thola umsebenzi. Uzobona imisebenzi yesikhashana eseduze kwakho, eseduze kakhulu iqala.\n'
        + '• Hlunga ngohlobo lomsebenzi usebenzisa umugqa wezigaba phezulu.\n'
        + '• Umsebenzi ngamunye ukhombisa inkokhelo ngehora, ukuthi uthatha isikhathi esingakanani, ukuthi ukude kangakanani, nokuthi ubani owunikezayo.\n'
        + '• Vula owodwa ufunde imininingwane, bese ufaka isicelo. Ukufaka isicelo kuwukuthepha kanye futhi akukhokhelwa.\n'
        + 'Ungafaka izicelo eziningi ngendlela othanda ngayo. Umqashi ubona irekhodi lakho — isilinganiso sakho, imisebenzi osuyenzile, izinga lakho — bese ekhetha kulabo abafake izicelo.',
    },
    'job-types': {
      title: 'Izinhlobo zomsebenzi ku-Vuka',
      asks: ['Zikhona ziphi izinhlobo zemisebenzi?', 'Yimuphi umsebenzi engingawenza?', 'Kukhona ziphi izigaba?', 'What kind of jobs zikhona?'],
      keywords: ['izigaba', 'izinhlobo', 'uhlobo', 'ukuhlanza', 'ingadi', 'ukufundisa'],
      body:
        'Imisebenzi yesikhashana — emifushane, yasendaweni, ekhokhelwa ngehora. Okwamanje yile:\n'
        + '{categories}\n'
        + 'Imisebenzi esemthethweni — umsebenzi wamashifu nowezinga lokuqala, njengomsizi egaraji likaphethiloli, umsebenzi wendawo yokugcina izimpahla, ukhasha, unogada, umsebenzi wesikhungo sezingcingo nomsizi esitolo.\n'
        + 'Imisebenzi esemthethweni iyasebenzelwa, ayibukwa nje. Ngamunye udinga izinga elithile, futhi ufinyelela ezingeni ngokwenza kahle imisebenzi yesikhashana. Yilokho kanye okuyinhloso ye-Ladder: imisebenzi emincane iyindlela yokufika emisebenzini emikhulu ngaphandle kwe-CV.',
    },
    'no-matric-needed': {
      title: 'Ingabe udinga imatikuletsheni noma isipiliyoni',
      asks: ['Ngiyayidinga imatikuletsheni?', 'Ngiyasidinga isipiliyoni?', 'Ngiyayidinga i-CV ukuze ngiqale?', 'Angina-matric, ngingasebenza?'],
      keywords: ['imatikuletsheni', 'matric', 'ibanga le-12', 'iziqu', 'imfundo', 'isitifiketi', 'isipiliyoni', 'isikole', 'idiploma'],
      body:
        'Cha. Awuyidingi imatikuletsheni, i-CV, isipiliyoni, noma umuntu okuncomayo ukuze uqale ku-Vuka. Yilokho kanye okuyinhloso yayo.\n'
        + 'Imisebenzi yesikhashana ivulekele wonke umuntu. Wenza umsebenzi, umqashi akulinganise, futhi leso silinganiso siyisipiliyoni — siba irekhodi elikutholela umsebenzi olandelayo.\n'
        + 'Imisebenzi esemthethweni ivulwa yizinga lakho, hhayi imfundo yakho. Izinga litholakala ngomsebenzi oqediwe, ngakho umuntu owayeka isikole kusenesikhathi futhi osebenza kahle ufinyelela emisebenzini yokuba ukhasha nowesikhungo sezingcingo ngendlela efanayo naye wonke umuntu. Eminye imisebenzi ethile iyazisho izidingo zayo, futhi umsebenzi uzokutshela.\n'
        + 'Uma unayo imatikuletsheni noma isitifiketi, kwengeze kuphrofayela yakho — kungasiza kuphela. Akusoze kwaba yinto ekuvimbayo phakathi kwakho nomsebenzi wakho wokuqala wesikhashana.',
    },
    'after-i-apply': {
      title: 'Kwenzekani ngemva kokufaka isicelo',
      asks: ['Kwenzekani ngemva kokufaka isicelo?', 'Ngizokwazi kanjani ukuthi ngiwutholile umsebenzi?', 'Kungani kungekho ophendulile?', 'Ngifake isicelo, manje?'],
      keywords: ['ngifakile', 'isicelo', 'ukulinda', 'impendulo', 'phendula', 'uqashiwe', 'isimo', 'akekho'],
      body:
        'Umqashi ubona bonke abafake izicelo, kanye nerekhodi lomuntu ngamunye, bese ekhetha. Uma ekhetha wena, uqashiwe futhi uthola isaziso.\n'
        + 'Ungabona konke osufake izicelo kukho esikrinini sakho sokuthi Ikhaya.\n'
        + 'Ukungezwa lutho kujwayelekile futhi akusona isahlulelo ngawe — umsebenzi odinga umuntu oyedwa kungenzeka ube nabafakizicelo abangamashumi amabili. Qhubeka ufaka izicelo. Into enkulu kunazo zonke eshintsha amathuba akho ukuba nemisebenzi embalwa eqediwe nesilinganiso esihle, yingakho owokuqala ubaluleke kakhulu kunayo yonke eminye.',
    },
    'distance': {
      title: 'Umsebenzi ukude kangakanani',
      asks: ['Lo msebenzi ukude kangakanani?', 'I-Vuka iyazi kanjani ukuthi ngikuphi?', 'Kungani ikhombisa ibanga elingalungile?', 'Kukude yini?'],
      keywords: ['ibanga', 'kude', 'indawo', 'gps', 'eduze', 'km', 'ukuhamba', 'ikuphi'],
      body:
        'Uma uvumela i-Vuka ukuthi isebenzise indawo yakho, amabanga alinganiswa kusukela lapho ukhona ngempela, futhi uhlu luhlelwa kusukela koseduze kakhulu.\n'
        + 'Uma ungavumeli, umsebenzi ngamunye usakhombisa igama lendawo yawo, futhi i-app ikhombisa ukuthi lokho kuwukulinganisa nje kunokuba yenze sengathi iyilinganisile.\n'
        + 'Indawo yakho isetshenziswa efonini yakho ukuhlela nokulinganisa. Ibanga libaluleke lapha ukwedlula indlela olubukeka ngayo: ukuhamba kuyizindleko ezinkulu kunazo zonke zokufuna umsebenzi eNingizimu Afrika, ngakho umsebenzi okude ngamatekisi amabili ungabiza kakhulu ukuwufinyelela kunalokho owukhokhayo.',
    },
    'invitations': {
      title: 'Izimemo zemisebenzi',
      asks: ['Siyini isimemo somsebenzi?', 'Umqashi ungimemile — kusho ukuthini lokho?', 'Ngithole i-invite, kusho ukuthini?'],
      keywords: ['isimemo', 'izimemo', 'mema', 'umenyiwe', 'invite'],
      body:
        'Umqashi osebonile irekhodi lakho angakumema ngqo emsebenzini othile, kunokulinda ukuthi uwuthole wena.\n'
        + 'Isimemo akusikho ukuqashwa okwamanje — ucelwa ukuthi ufake isicelo. Ungamukela noma wenqabe, futhi ukwenqaba akukulahlekiseli lutho futhi akubalwa kabi erekhodini lakho.\n'
        + 'Izimemo ziba ziningi kakhulu uma usungu-Owethenjwayo noma ngaphezulu, ngoba yilapho abaqashi beqala khona ukubuka amakhono kunokuba bafake umsebenzi bese belinda nje.',
    },
    'change-my-mind': {
      title: 'Ukushintsha umqondo ngomsebenzi',
      asks: ['Ngingawukhansela umsebenzi?', 'Ngisihoxisa kanjani isicelo sami?', 'Angisakwazi ukuya emsebenzini', 'Ngifuna ukucancel'],
      keywords: ['khansela', 'hoxisa', 'ukuhoxisa', 'shintsha umqondo', 'angisakwazi', 'angeke ngiye', 'yeka umsebenzi'],
      body:
        'Ayikho inkinobho yokuhoxisa isicelo ku-app okwamanje, ngakho isicelo osisithumelile sihlala sithunyelwe.\n'
        + 'Uma ungasakwazi ukwenza umsebenzi, thumela umqashi umyalezo kokuthi Izingxoxo umtshele ngokushesha nje uma wazi. Yilokho kuphela — ukumtshela kusenesikhathi akukulahlekiseli lutho, futhi yilokho okwenziwa umuntu othembekile.\n'
        + 'Okulimaza irekhodi ukuthula: ukuqashwa bese ungafiki, ungathumelanga nomyalezo. Umqashi angakulinganisa ngalokho, futhi yiyona nto eyodwa okunzima ngempela ukululama kuyo.\n'
        + 'Ukufaka isicelo bese ungezwa lutho akufani nalokho futhi akunasijeziso nhlobo.',
    },
    'formal-jobs-locked': {
      title: 'Kungani umsebenzi osemthethweni ukhiyiwe',
      asks: ['Kungani ngingakwazi ukufaka isicelo salo msebenzi?', 'Kungani lo msebenzi ukhiyiwe?', 'Ngiyivula kanjani imisebenzi esemthethweni?', 'Job ilocked, kungani?'],
      keywords: ['ukhiyiwe', 'khiyiwe', 'angikwazi ukufaka isicelo', 'izinga elidingekayo', 'esemthethweni', 'vula', 'kuvinjiwe'],
      body:
        'Umsebenzi ngamunye osemthethweni udinga izinga elithile eliphansi, futhi ufinyelela ezingeni ngokuqeda imisebenzi yesikhashana ngezilinganiso ezinhle.\n'
        + 'Lokhu akusikho ukukuvalela ngaphandle. Kungokuphambene nalokho: umqashi onikeza umsebenzi wangempela wamashifu ngeke athathe umuntu ongenamlando, ngakho izinga liwubufakazi obuthatha indawo ye-CV nabantu abakuncomayo ongakabi nabo. Uma i-Vuka ithi ungu-Owethenjwayo, lokho kusho imisebenzi emithathu eqediwe nesilinganiso ngemuva kwakho.\n'
        + 'Umsebenzi ukutshela ukuthi udinga liphi izinga. Irekhodi lakho likutshela ukuthi ukude kangakanani nalo.',
    },

    /* ---------------- Record, score and ladder ---------------- */
    'my-record': {
      title: 'Irekhodi lami',
      asks: ['Liyini Irekhodi lami?', 'Yini esererekhodini lami?', 'Ikuphi i-CV yami?', 'My record yini?'],
      keywords: ['irekhodi', 'cv', 'iphrofayela', 'umlando', 'umlando womsebenzi', 'abakuncomayo', 'ubufakazi bomsebenzi'],
      body:
        'Irekhodi lami yi-CV i-app ekubhalela yona, isuka emsebenzini osuwenzile ngempela.\n'
        + 'Liqukethe wonke umsebenzi oqediwe, ukuthi wawuyini, wawungowabani, ukuthi wakhokhelwa malini, kanye nesilinganiso nombono umqashi awushiyile. Liphethe ne-Vuka Score yakho, izinga lakho namabheji akho.\n'
        + 'Awulibhali futhi awukwazi ukulihlela, yingakho kanye umqashi elikholwa. Umsebenzi ngamunye ubhalwa ngaphansi kwegama elifanele lomsebenzi — umsebenzi wokuthutha ubhalwa njengoMsizi wokuthutha, hhayi nje "usizo lokuthutha" — ngoba yilokho umuntu oqashayo akufunayo.\n'
        + 'Ungabelana ngalo njengesixhumanisi somphakathi, ngakho lisebenza njenge-CV nangaphandle kwe-app.',
    },
    'vuka-score': {
      title: 'I-Vuka Score',
      asks: ['Iyini i-Vuka Score?', 'Amaphuzu ami abalwa kanjani?', 'Ngiwakhuphula kanjani amaphuzu ami?', 'Vuka Score isebenza kanjani?'],
      keywords: ['amaphuzu', 'score', 'idumela', 'isilinganiso', 'kubalwa', 'iphesenti'],
      body:
        'I-Vuka Score yakho iyinombolo eyodwa kweyi-100 efingqa irekhodi lakho. Yakhiwe ngezinto ezintathu:\n'
        + '• Isilinganiso sakho esimaphakathi sezinkanyezi, okuyingxenye enkulu kunazo zonke.\n'
        + '• Ukuthi usuqede imisebenzi emingaki, kubalwa kuze kufike kweyi-12.\n'
        + '• Irekhodi lokuphepha elihlanzekile, elingenaso isexwayiso ngawe.\n'
        + 'Ihlala iku-zero kuze kube umsebenzi wakho wokuqala oqediwe, ngoba akukho okungakalinganiswa okwamanje.\n'
        + 'Indlela yokuyikhuphula yileyo evamile: fika, wenze umsebenzi kahle, futhi ube umuntu umqashi afuna ukumbuyisa. Ayikho indlela yokuyithenga noma yokuyiphakamisa ngobuqili, futhi yilokho kuphela okuyenza ibaluleke.',
    },
    'the-ladder': {
      title: 'I-Ladder',
      asks: ['Iyini i-Ladder?', 'Ayini amazinga?', 'Ngichazele ngamazinga', 'The Ladder isebenza kanjani?'],
      keywords: ['ladder', 'isitebhisi', 'izinga', 'amazinga', 'umqali', 'owethenjwayo', 'uchwepheshe', 'ophambili', 'indondo'],
      body:
        'I-Ladder yindlela imisebenzi emincane eguquka ngayo ibe imisebenzi yangempela. Kunamazinga amane, futhi ngalinye liyasebenzelwa:\n'
        + '{tiers}\n'
        + 'Ukhuphuka ngokuzenzakalelayo ngokushesha nje uma uhlangabezana nayo yonke imibandela yezinga elilandelayo — imisebenzi eyenziwe, isilinganiso esimaphakathi, futhi kungabikho zexwayiso zokuphepha.\n'
        + 'Akukho lutho lapha olungathengwa futhi akukho oluphelelwa yisikhathi.',
    },
    'move-up-tier': {
      title: 'Ukukhuphukela ezingeni elilandelayo',
      asks: ['Ngikhuphuka kanjani ezingeni elilandelayo?', 'Ngifika kanjani ku-level elandelayo?', 'Yini engivimbayo ukuthi ngikhuphuke?'],
      keywords: ['khuphuka', 'izinga elilandelayo', 'ukuphakanyiswa', 'inqubekela phambili', 'ngibambekile', 'izidingo'],
      body:
        'Imibandela emithathu, futhi yonke kufanele ibe yiqiniso ngasikhathi sinye:\n'
        + '• Imisebenzi eqediwe eyanele yalelo zinga.\n'
        + '• Isilinganiso esimaphakathi esilingana noma esingaphezu kwalokho okucelwa yizinga.\n'
        + '• Kungabikho zexwayiso zokuphepha erekhodini lakho.\n'
        + 'Irekhodi lakho likhombisa ukuthi yimiphi kulokhu okuthathu osuyifezile neyiphi ongakayifezi, ngakho ungabona kahle ukuthi yini ekuvimbayo kunokuba uqagele.\n'
        + 'Ngibuze ukuthi "ngisezingeni liphi" futhi ngizokufundela izinombolo zakho.',
    },
    'badges': {
      title: 'Amabheji',
      asks: ['Ayini amabheji?', 'Ngiwathola kanjani amabheji?', 'Ama-badge asebenza kanjani?'],
      keywords: ['ibheji', 'amabheji', 'badge', 'umklomelo', 'impumelelo', 'indondo'],
      body:
        'Amabheji akhombisa izinto ezithile osuzenzile. Ahlala erekhodini lakho lapho umqashi engawabona khona:\n'
        + '{badges}\n'
        + 'Atholakala ngokuzenzakalelayo. Awudingi neze ukulicela.',
    },
    'ratings-average': {
      title: 'Isilinganiso sakho sisebenza kanjani',
      asks: ['Isilinganiso sami sisebenza kanjani?', 'Kungani isilinganiso sami esimaphakathi singashintshanga?', 'Ubani ongilinganisayo?', 'Ama-stars ami asebenza kanjani?'],
      keywords: ['isilinganiso', 'izinkanyezi', 'stars', 'esimaphakathi', 'umbono', 'ukulinganiswa'],
      body:
        'Uma uqeda umsebenzi, umqashi uyawuqinisekisa bese ekulinganisa kusukela enkanyezini eyodwa kuya kwezinhlanu, nombono omfushane. Leso silinganiso singena erekhodini lakho nasesilinganisweni sakho esimaphakathi.\n'
        + 'Kukhona isimo esisodwa esimangaza abantu, futhi sikuzuzisa wena. Uma umqashi engakaze aqinisekise, umsebenzi ubalelwa wena noma kunjalo ngemva kwesikhathi sokuqinisekisa — kodwa ugcinwa ungenaso nhlobo isilinganiso, futhi ushiywa ngaphandle ngokuphelele esilinganisweni sakho esimaphakathi. Ngakho umqashi othulayo akakwazi ukusisiza noma ukusilimaza isilinganiso sakho. Usawuthola umsebenzi, imali oyiholile nokubhalwa erekhodini.',
    },
    'safety-flag': {
      title: 'Izexwayiso zokuphepha',
      asks: ['Siyini isexwayiso sokuphepha?', 'Isexwayiso singithinta kanjani?', 'Isexwayiso singasuswa?', 'Safety flag yini?'],
      keywords: ['isexwayiso', 'izexwayiso', 'isexwayiso sokuphepha', 'flag', 'uphawu', 'kuvinjiwe'],
      body:
        'Isexwayiso sokuphepha siyaphakanyiswa uma othile ebika ukukhathazeka kwangempela ngokuphepha emsebenzini — isisebenzi sibika ngomqashi, noma umqashi ebika ngesisebenzi.\n'
        + 'Isexwayiso erekhodini lakho sikuvimba ukuthi ukhuphukele ezingeni elilandelayo, ngoba wonke amazinga angaphezu koMqali adinga irekhodi elihlanzekile.\n'
        + 'Izexwayiso zifundwa ngumuntu, azinqunywa yi-app. Zikhona ukuze abantu baphephe uma bengena emizini yabantu abangabazi nokuze i-Ladder ihlale ibalulekile — hhayi njengesijeziso somsebenzi ongahambanga kahle. Ukungavumelani ngomsebenzi akusona isexwayiso sokuphepha.',
    },
    'public-cv': {
      title: 'Ukwabelana ngerekhodi lakho',
      asks: ['Ngabelana kanjani nge-CV yami?', 'Ngingalithumela irekhodi lami komunye umuntu?', 'Abantu bangalibona irekhodi lami ngaphandle kwe-app?', 'Ngingayithumela i-CV yami ku-WhatsApp?'],
      keywords: ['yabelana', 'isixhumanisi', 'link', 'somphakathi', 'thumela', 'whatsapp', 'ngaphandle', 'khombisa umqashi'],
      body:
        'Irekhodi lakho lingabelwana ngalo njengesixhumanisi. Noma ubani olivulayo ubona inguqulo yokufunda kuphela yomlando wakho womsebenzi, isilinganiso sakho nezinga lakho, ngaphandle kokudinga i-akhawunti ye-Vuka.\n'
        + 'Yile ndlela ophendula ngayo uma ubuzwa ukuthi "unayo i-CV?" kodwa ungenayo. Thumela isixhumanisi ku-WhatsApp.\n'
        + 'Inguqulo yomphakathi ikhombisa umsebenzi wakho nedumela lakho. Ayikhombisi inombolo yakho yeselula, inombolo yakho yomazisi noma imininingwane yakho yasebhange.',
    },

    /* ---------------- Money ---------------- */
    'how-payment-works': {
      title: 'Ukhokhelwa kanjani',
      asks: ['Ngikhokhelwa kanjani?', 'Ingabe i-Vuka iyayigcina imali yami?', 'Ngizoyithola nini imali yami?', 'Imali ngiyithola kanjani?'],
      keywords: ['khokhelwa', 'inkokhelo', 'imali', 'iholo', 'ukheshi', 'eft', 'umholo', 'hola', 'ivikelwe', 'isikhwama'],
      body:
        'Inkokhelo yomsebenzi ivikelwa ngaphambi kokuba umsebenzi uqale. Umqashi ufaka imali ephelele lapho efaka umsebenzi, noma kamuva — kodwa njalo ngaphambi kokuba akwazi ukuqasha noma ubani.\n'
        + '• Bheka okuthi Imali ivikelwe emsebenzini. Kusho ukuthi inkokhelo isivele ikulindile. Umsebenzi okhombisa okuthi Kulindwe imali usengafakelwa isicelo, kodwa akekho ongaqashwa kuwo kuze kube umqashi usefake imali.\n'
        + '• Kuze kube kuqashwe othile, umqashi angayibuyisa imali mahhala. Kusukela ngesikhathi uqashwa, imali ivalelwe wena.\n'
        + '• Uma umqashi eqinisekisa umsebenzi wakho oqediwe — noma ngokuzenzakalelayo, uma sekudlule {autoReleaseHours} ukhombise ukuthi uqedile futhi engakaze aphendule — inkokhelo ingena esikhwameni sakho se-Vuka ngaphansi kokuthi Mina. Uyikhiphela ku-akhawunti yakho yasebhange noma nini uma uthanda.\n'
        + 'Okwamanje lokhu kuseMODINI YOKUHLOLA: isikhwama siwukuzilolonga futhi ayikho imali yangempela ehamba nge-Vuka okwamanje. Kuze kube kuvulwa, vumelana nomqashi ukuthi uzokukhokhela kanjani ngempela, ngaphambi kokuthi uqale.\n'
        + 'Uma umqashi engakukhokheli, kubike. Yilokho kanye umbiko wokuphepha owenzelwe khona.',
    },
    'funds-secured': {
      title: 'Kusho ukuthini okuthi Imali ivikelwe',
      asks: ['Kusho ukuthini okuthi Imali ivikelwe?', 'Kusho ukuthini okuthi Kulindwe imali?', 'Umqashi angayibuyisa imali?', 'Imali ikhona ngempela?'],
      keywords: ['imali ivikelwe', 'kulindwe imali', 'ivikelwe', 'buyisa', 'buyisa imali', 'ivaliwe', 'kukhokhiwe', 'funds secured'],
      body:
        'Wonke umsebenzi wesikhashana ukhombisa elilodwa kulawa malebula amathathu, ukuze wazi ngenkokhelo ngaphambi kokuba ufake isicelo:\n'
        + '• Imali ivikelwe — umqashi usefake inkokhelo ephelele. Ikulindile.\n'
        + '• Kulindwe imali — okwamanje akukenzeki. Usengafaka isicelo, kodwa akekho ongaqashwa kuwo kuze kube umqashi usefake imali.\n'
        + '• Kukhokhiwe — umsebenzi uqediwe futhi inkokhelo iye kusisebenzi.\n'
        + 'Umqashi angayibuyisa? Kuphela ngaphambi kokuba kuqashwe umuntu. Kusukela ngesikhathi uqashwa, imali ivalelwe wena, futhi ingena esikhwameni sakho uma umsebenzi uqinisekisiwe — noma ngokuzenzakalelayo, uma sekudlule {autoReleaseHours} ukhombise ukuthi uqedile, uma umqashi engakaze aphendule.\n'
        + 'Lokhu kusesemodini yokuhlola okwamanje, ngakho ayikho imali yangempela ehamba nge-Vuka okwamanje.',
    },
    'wallet-withdraw': {
      title: 'Isikhwama sakho, nokukhipha imali',
      asks: ['Ngiyikhipha kanjani imali yami?', 'Sikuphi isikhwama sami?', 'Ukukhipha imali kuthatha isikhathi esingakanani?', 'Ngiyi-withdraw kanjani imali?'],
      keywords: ['isikhwama', 'khipha', 'ukukhipha', 'withdraw', 'ibhalansi', 'dlulisela', 'wallet'],
      body:
        'Isikhwama sakho singaphansi kokuthi Mina, bese kuba Isikhwama sami. Sikhombisa lokho ongakukhipha manje, nalokho okuvikelwe emisebenzini osayenza.\n'
        + '• Inkokhelo ingena esikhwameni uma umqashi eqinisekisa umsebenzi wakho.\n'
        + '• Ukukhipha kuthumela yonke ibhalansi ku-akhawunti yasebhange oyilondoloze ngaphansi kokuthi Thola inkokhelo. Qala ngokwengeza imininingwane yakho yasebhange lapho.\n'
        + 'Ngoba izinkokhelo zisesemodini yokuhlola, ayikho imali ethunyelwayo ngempela okwamanje, ngakho asikho isikhathi sokulinda engingakutshela ngaso. Uma izinkokhelo zangempela sezivuliwe, isikhathi ukukhipha okuthatha sona sizokhonjiswa ngaphambi kokuba ukuqinisekise.\n'
        + 'Ngibuze ukuthi "kungakanani esikhwameni sami" futhi ngizokufundela ibhalansi yakho.',
    },
    'test-mode': {
      title: 'Kusho ukuthini imodi yokuhlola',
      asks: ['Iyini imodi yokuhlola?', 'Ingabe le mali ingeyangempela?', 'Kungani kubhalwe ukuthi imodi yokuhlola?', 'Test mode yini?'],
      keywords: ['imodi yokuhlola', 'ukuhlola', 'ukuzilolonga', 'imali yangempela', 'imali mbumbulu', 'akusiyo yangempela', 'test mode'],
      body:
        'I-Vuka ikhombisa yonke indlela inkokhelo ezosebenza ngayo — inkokhelo ivikelwa ngaphambi komsebenzi, ingena esikhwameni sesisebenzi uma umsebenzi uqinisekisiwe, bese ikhishelwa ebhange. Okwamanje lokho kuwukuzilolonga: ayikho imali yangempela ehamba nge-Vuka okwamanje.\n'
        + 'Kuze kube izinkokhelo zivuliwe, vumelana nomunye umuntu ukuthi inkokhelo izokwenziwa kanjani ngempela, ngaphambi kokuba umsebenzi uqale. Konke okunye — irekhodi lakho, izilinganiso, amazinga namabheji — kungokwangempela futhi kuyabalwa.\n'
        + 'Uma izinkokhelo zangempela seziqala, i-app izokusho lokho ngokucacile, futhi imodi yokuhlola izonyamalala kulezi zikrini.',
    },
    'employer-fund-job': {
      title: 'Ukuvikela inkokhelo yomsebenzi',
      asks: ['Ngiwufakela kanjani imali umsebenzi?', 'Kungani ngingakwazi ukuqasha muntu?', 'Ngiyibuyisa kanjani imali yami?', 'Ngingakhansela ngemva kokuqasha?', 'Ngisikhokhela kanjani isisebenzi?', 'Kwenzekani emalini uma ngisusa umsebenzi?'],
      keywords: ['vikela', 'vikela inkokhelo', 'imali', 'angikwazi ukuqasha', 'buyisa imali', 'imbuyiselo', 'khansela', 'khokhela isisebenzi', 'kulindwe imali'],
      body:
        'Inkokhelo yomsebenzi ivikelwa ngaphambi kokuba kuqale muntu. Khetha okuthi Vikela inkokhelo manje lapho ufaka umsebenzi, noma uvule umsebenzi kamuva bese uthepha okuthi Vikela inkokhelo.\n'
        + '• Akekho ongaqashwa kuze kube inkokhelo ivikelwe. Yingakho inkinobho yokuqasha ithi Vikela inkokhelo ukuze uqashe.\n'
        + '• Ngaphambi kokuba uqashe, ungayibuyisa imali ngaphandle kwemali ekhokhwayo. Ukuhoxisa umsebenzi okungaqashwanga muntu kuwo nakho kuyayibuyisa.\n'
        + '• Kusukela ngesikhathi uqasha othile, imali ivalelwe yena. Ingena esikhwameni sesisebenzi uma uqinisekisa umsebenzi — noma ngokuzenzakalelayo, uma sekudlule {autoReleaseHours} sikhombise ukuthi siqedile, uma ungaphendulanga.\n'
        + 'Umsebenzi osuqashelwe umuntu awukwazi ukukhanselwa ku-app. Thumela isisebenzi umyalezo nixazulule, futhi ukubike ngaphansi kokuthi Mina uma kukhona okungalungile.\n'
        + 'Izinkokhelo zisesemodini yokuhlola okwamanje, ngakho ayikho imali yangempela ehamba nge-Vuka okwamanje.',
    },
    'get-more-work': {
      title: 'Ukuthola imisebenzi eminingi',
      asks: ['Ngiyithola kanjani eminye imisebenzi eminingi?', 'Kungani ngingatholi misebenzi?', 'Ngiqashwa kanjani ngokushesha?', 'Akekho ongiqashayo'],
      keywords: ['imisebenzi eminingi', 'angitholi', 'ayikho imisebenzi', 'qashwa', 'amathuba', 'akekho ongiqashayo', 'angisebenzi'],
      body:
        'Abaqashi bakhetha ngerekhodi abalibonayo, ngakho izinto ezikukhuphula ohlwini yizinto ongazilawula:\n'
        + '• Gcwalisa iphrofayela yakho namakhono onawo ngempela, ukuze uvele emsebenzini ofanele.\n'
        + '• Qinisekisa umazisi wakho ngaphansi kokuthi Mina. Uma kunabantu ababili, umqashi uthatha oqinisekisiwe.\n'
        + '• Vula okuthi Imisebenzi emisha eseduze, ngaphansi kokuthi Mina bese kuba Izaziso, ukuze uzwe ngomsebenzi ngokushesha nje uma ufakwa futhi ukwazi ukufaka isicelo kusenesikhathi.\n'
        + '• Khetha imisebenzi ekhombisa okuthi Imali ivikelwe, neseduze kwakho — ufika ngesikhathi, futhi inkokhelo iyakulinda.\n'
        + '• Yenza umsebenzi ngamunye kahle bese ukhombisa ukuthi uqedile. Wonke umsebenzi oqinisekisiwe nesilinganiso esihle kukhuphula i-Vuka Score yakho nezinga lakho.',
    },
    'banking-details': {
      title: 'Imininingwane yakho yasebhange',
      asks: ['Kungani i-Vuka ifuna imininingwane yami yasebhange?', 'Ingabe imininingwane yami yasebhange iphephile?', 'Ngiyengeza kanjani i-akhawunti yami yasebhange?', 'Bank details zami ziphephile?'],
      keywords: ['ibhange', 'imininingwane yasebhange', 'inombolo ye-akhawunti', 'ikhodi yegatsha', 'capitec', 'fnb', 'absa'],
      body:
        'Ungalondoloza imininingwane yakho yasebhange ngaphansi kokuthi Mina, ukuze ube nayo ilungile ukuyinika umqashi ungadingi ukusesha ikhadi.\n'
        + 'Ifihlwe ngekhodi kuseva futhi ayisoze ithunyelwe emuva ku-app. Ngisho nawe ubona kuphela isifinyezo esifihliwe — ibhange lakho, uhlobo lwe-akhawunti, nezinombolo ezine zokugcina. Akukho okubucayi okugcinwa efonini yakho.\n'
        + 'Yilapho isikhwama sakho sithumela khona inkokhelo yakho uma uyikhipha. Izinkokhelo zisesemodini yokuhlola okwamanje, ngakho ayikho imali yangempela ethunyelwa kuyo okwamanje.\n'
        + 'Akekho umuntu wase-Vuka oyoke akushayele noma akuthumelele umyalezo ecela inombolo yakho ye-akhawunti, i-PIN yakho noma i-OTP. Noma ubani owenza lokho akaveli ku-Vuka.',
    },
    'fair-pay': {
      title: 'Ukuhlolwa kwenkokhelo enhle neholo eliphansi',
      asks: ['Iyini imitha yenkokhelo enhle?', 'Liyini iholo eliphansi elisemthethweni?', 'Lo msebenzi ungikhokhela ngokwanele?', 'Minimum wage ingakanani?'],
      keywords: ['inkokhelo enhle', 'iholo eliphansi', 'minimum wage', 'ukhokhelwa kancane', 'ngehora', 'okusemthethweni', 'kuphansi kakhulu'],
      body:
        'Iholo eliphansi likazwelonke eNingizimu Afrika lingu-{minWage} ngehora. Libekwa nguhulumeni futhi limenyezelwa kabusha kuGazethi minyaka yonke, liqala ukusebenza mhla lu-1 kuNdasa.\n'
        + 'Wonke umsebenzi wesikhashana ku-Vuka ukhombisa ukuhlolwa kwenkokhelo enhle okuqhathanisa inkokhelo yawo naleyo nombolo, ukuze ubone ngokushesha ukuthi lokho okunikezwayo kusemthethweni futhi kulungile ngaphambi kokuthi uchithe imali yetekisi uya khona.\n'
        + 'Umsebenzi okhokha ngaphansi kweholo eliphansi awukho emthethweni. Uvumelekile ukuthi uthi cha, futhi uvumelekile ukuwubika.\n'
        + 'Futhi cabanga ngokuhamba. Inkokhelo ebukeka ilungile ingaba mbi kunokuhlala ekhaya uma usukhokhele amatekisi amabili.',
    },
    'total-earned': {
      title: 'Yini ebalwa kokuthi okuholile konke',
      asks: ['Yini efakiwe kokuthi okuholile konke?', 'Okuholile konke kubalwa kanjani?', 'Imali yonke eholiwe ibalwa kanjani?'],
      keywords: ['okuholile', 'imali eholiwe', 'konke', 'isamba', 'iholo', 'kubalwa'],
      body:
        'Irekhodi lakho lihlanganisa konke okuvela kuwo wonke umsebenzi oqediwe bese likukhombisa njengakho konke okuholile.\n'
        + 'Libala umsebenzi oqinisekisiwe, kuhlanganise nemisebenzi ebalelwe wena ngokuzenzakalelayo lapho umqashi engakaze aqinisekise. Alibali imisebenzi osufake izicelo kuyo noma osayenza.\n'
        + 'Ngibuze ukuthi "sengihole malini" futhi ngizokufundela inombolo yakho.',
    },

    /* ---------------- Doing the work ---------------- */
    'mark-job-done': {
      title: 'Ukukhombisa ukuthi umsebenzi uqediwe',
      asks: ['Ngikhombisa kanjani ukuthi umsebenzi uqediwe?', 'Ngiqedile umsebenzi — manje kwenzekani?', 'Ngiyiqedile i-job, manje?'],
      keywords: ['uqediwe', 'ngiqedile', 'qeda', 'ukuqeda', 'linganisa umqashi', 'isilinganiso somqashi', 'ngiqedile umsebenzi'],
      body:
        'Vula umsebenzi esikrinini sakho sokuthi Ikhaya bese ukhombisa ukuthi uqediwe. Uzocelwa ukuthi ulinganise umqashi ngezinkanyezi kwezinhlanu ngaphambi kokuthi ukwazi — le yingxenye egcina abaqashi bethembekile, futhi yingakho ezinye izisebenzi zikwazi ukubona ukuthi ubani omuhle ukumsebenzela.\n'
        + 'Uma kukhona okwakungaphephile emsebenzini, kukhona ibhokisi lokuphakamisa isexwayiso sokuphepha ngasikhathi sinye. Umuntu uyakufunda lokho.\n'
        + 'Umqashi ube esecelwa ukuthi aqinisekise. Uma esenzile lokho, umsebenzi ungena erekhodini lakho nesilinganiso nombono wakhe, futhi inkokhelo ebivikelwe yawo ingena esikhwameni sakho — okwamanje kusesemodini yokuhlola.',
    },
    'confirm-work': {
      title: 'Ukulinda umqashi aqinisekise',
      asks: ['Umqashi akakawuqinisekisi umsebenzi wami', 'Ukuqinisekisa kuthatha isikhathi esingakanani?', 'Kwenzekani uma engakaze aqinisekise?', 'Umqashi akaconfirmi'],
      keywords: ['qinisekisa', 'ukuqinisekisa', 'ukulinda', 'kulindiwe', 'akakaqinisekisi', 'ngokuzenzakalelayo', 'kubambekile'],
      body:
        'Ngemva kokuthi ukhombise ukuthi umsebenzi uqediwe, umqashi unikezwa {autoReleaseHours} ukuze awuqinisekise.\n'
        + 'Uma engakaze akwenze, umsebenzi ubalelwa wena noma kunjalo uma leso sikhathi sesiphelile. Uthola ukubhalwa erekhodini, imali oyiholile, inqubekela phambili yezinga — futhi inkokhelo evikelwe ingena esikhwameni sakho. Ugcinwa ungenaso isilinganiso, ngakho ukuthula kwakhe akukwazi ukwehlisa isilinganiso sakho esimaphakathi — noma ukusikhuphula.\n'
        + 'Lokhu kukhona ngoba umqashi oyeka nje ukuphendula wayejwayele ukumisa inqubekela phambili yesisebenzi unomphela, ngomsebenzi owenziwe ngempela. Manje akasakwazi.',
    },

    /* ---------------- Employers ---------------- */
    'post-a-job': {
      title: 'Ukufaka umsebenzi',
      asks: ['Ngiwufaka kanjani umsebenzi?', 'Ngimqasha kanjani umuntu?', 'Ngiwukhangisa kanjani umsebenzi?', 'Ngidinga umuntu wokusebenza'],
      keywords: ['faka umsebenzi', 'khangisa', 'qasha', 'ukuqasha', 'dala umsebenzi', 'ngidinga umuntu'],
      body:
        'Thepha okuthi Faka. Uchaza umsebenzi, ukuthi ukuphi, amahora amangaki, nokuthi ukhokha malini ngehora.\n'
        + '• Ukuhlolwa kwenkokhelo enhle kukukhombisa ukuthi inkokhelo yakho iqhathaniswa kanjani neholo eliphansi likazwelonke elingu-{minWage} ngehora ngesikhathi usabhala. Ukukhokha ngaphansi kwalo akukho emthethweni.\n'
        + '• Vikela inkokhelo lapho ufaka umsebenzi, noma kamuva. Ungayibuyisa mahhala kuze kube uyaqasha; awukwazi ukuqasha muntu kuze kube ivikelwe. Izisebenzi zibona okuthi Imali ivikelwe emsebenzini wakho, futhi yilokho okwenza abantu abahle bafake izicelo.\n'
        + '• Umsebenzi wakho uvela ngokushesha kuzisebenzi eziseduze kwakho.\n'
        + '• Ubona wonke umuntu ofaka isicelo, nerekhodi lakhe — isilinganiso, imisebenzi eqediwe, izinga namabheji.\n'
        + 'Ukufaka umsebenzi kumahhala, futhi i-Vuka ayithathi khomishini.',
    },
    'choose-worker': {
      title: 'Ukukhetha ozomqasha',
      asks: ['Ngisikhetha kanjani isisebenzi?', 'Ngazi kanjani ukuthi ubani othembekile?', 'Amazinga asho ukuthini uma ngiqasha?', 'Ngikhetha bani kubafakizicelo?'],
      keywords: ['khetha', 'abafakizicelo', 'othembekile', 'ukwethemba', 'ozoqashwa', 'amakhono'],
      body:
        'Wonke umfakisicelo uphethe irekhodi elakhiwe ngomsebenzi asewenzile ngempela ku-Vuka — isilinganiso sakhe esimaphakathi, ukuthi useqede imisebenzi emingaki, izinga lakhe, nokuthi umazisi wakhe uqinisekisiwe yini.\n'
        + 'Izinga liyindlela esheshayo yokufunda. Owethenjwayo kusho okungenani imisebenzi emithathu eqediwe ngesilinganiso esihle esimaphakathi futhi kungekho zexwayiso zokuphepha. Uchwepheshe no-Ophambili kusho okuningi kakhulu.\n'
        + 'Ungaphinda ubuke okuthi Amakhono ngqo bese umema umuntu emsebenzini kunokulinda izicelo.\n'
        + 'Kuhle ukwazi: izisebenzi nazo ziyakulinganisa, futhi leso silinganiso sikhonjiswa emisebenzini oyifakile. Ukuqinisekisa umsebenzi ngokushesha nokukhokha lokho okukhangisile yikho okwenza abantu abahle baqhubeke befaka izicelo kuwe.',
    },
    'employer-confirm': {
      title: 'Ukuqinisekisa umsebenzi oqediwe',
      asks: ['Ngiqinisekisa kanjani ukuthi umsebenzi uqediwe?', 'Kungani kufanele ngiqinisekise?', 'Kwenzekani uma ngingaqinisekisi?', 'Ngiyi-confirma kanjani i-job?'],
      keywords: ['qinisekisa', 'vuma', 'ukuqinisekisa', 'linganisa isisebenzi', 'uqediwe', 'kuphelile'],
      body:
        'Uma isisebenzi sikhombisa ukuthi umsebenzi uqediwe, uthola isaziso. Sivule, uqinisekise umsebenzi, bese usilinganisa ngezinkanyezi kwezinhlanu nombono omfushane.\n'
        + 'Sicela ukwenze ngokushesha. Kuwe kuwukuthepha nje; kuso yikho okubhalwa erekhodini laso okuvula izinga elilandelayo nohlobo olulandelayo lomsebenzi.\n'
        + 'Uma ungaqinisekisi kungakadluli {autoReleaseHours}, umsebenzi ubalelwa isisebenzi ngokuzenzakalelayo, ungenaso isilinganiso. Umbono wakho yingxenye elahlekayo, futhi lowo mbono yinto ebaluleke kakhulu ongayinika umuntu owakha umlando wakhe wokuqala womsebenzi.\n'
        + 'Ukuqinisekisa kuphinde kukhiphe inkokhelo oyivikele iye esikhwameni se-Vuka sesisebenzi. Kusukela ngesikhathi usiqasha, yayivalelwe sona. Izinkokhelo zisesemodini yokuhlola okwamanje — ayikho imali yangempela ehambayo okwamanje.',
    },
    'employer-cost': {
      title: 'Kubiza malini kumqashi',
      asks: ['Kubiza malini ukufaka umsebenzi?', 'Ingabe i-Vuka ithatha ikhomishini?', 'Ngikhokha malini njengomqashi?'],
      keywords: ['ibiza', 'imali ekhokhwayo', 'ikhomishini', 'khomishini', 'mahhala', 'intengo', 'umqashi'],
      body:
        'Ukufaka umsebenzi kumahhala futhi ukuqasha kumahhala. Okukhokhayo yinkokhelo uqobo, evikelwa ngaphambi kokuba uqashe, futhi ungayibuyisa mahhala kuze kube uyaqasha.\n'
        + 'Izinkokhelo zisesemodini yokuhlola okwamanje, ngakho ayikho imali yangempela ehamba nge-Vuka okwamanje futhi akukho okukhokhiswayo. Noma iyiphi imali ekhokhwayo, uma izinkokhelo sezivuliwe, izokhonjiswa ngaphambi kokuba ukhokhe.',
    },

    /* ---------------- Safety, trust and privacy ---------------- */
    'is-it-safe': {
      title: 'Ukuhlala uphephile',
      asks: ['Ingabe i-Vuka iphephile?', 'Ngihlala kanjani ngiphephile?', 'Kuphephile ukuya endlini yomuntu engimazi?', 'Angizizwa ngiphephile'],
      keywords: ['phephile', 'ukuphepha', 'ingozi', 'umkhonyovu', 'ongamazi', 'vikela', 'qaphela'],
      body:
        'I-Vuka ikunika ulwazi lokwahlulela ngalo, kodwa nguwe ohamba uya ekhelini, ngakho izexwayiso ezinengqondo zisasebenza:\n'
        + '• Hlola ukuthi umazisi womqashi uqinisekisiwe yini, bese ubheka isilinganiso sakhe esivela kwezinye izisebenzi.\n'
        + '• Gcina ingxoxo ku-app. Iyirekhodi, futhi ingafundwa ngumuntu uma kukhona okungahambi kahle.\n'
        + '• Tshela othile ukuthi uyaphi nokuthi ulindele ukubuya nini.\n'
        + '• Vumelanani ngenkokhelo ngaphambi kokuthi uhambe.\n'
        + '• Ungalokothi ukhokhele muntu ukuze uthole umsebenzi, futhi ungalokothi uthumele umazisi wakho noma imininingwane yasebhange kumuntu oyicelayo engxoxweni.\n'
        + 'Uma kukhona okungahambi kahle, hamba. Ungabika umuntu, umvimbe, futhi uphakamise isexwayiso sokuphepha emsebenzini.',
    },
    'scam-warning': {
      title: 'Uma othile ekucela imali noma amaphepha',
      asks: ['Othile ungicela imali ukuze ngithole umsebenzi', 'Umqashi ucele inombolo yami yomazisi engxoxweni', 'Ingabe lona ngumkhonyovu?', 'Is this a scam?'],
      keywords: ['umkhonyovu', 'inkohliso', 'ukukhwabanisa', 'ucela imali', 'ucele umazisi', 'thumela umazisi', 'imali yokubhalisa', 'idiphozi', 'pin', 'otp', 'kuyasolisa', 'mbumbulu', 'ngikhohlisiwe'],
      body:
        'Ima, bese umbika. Lawa amaphethini okufanele uwazi ngekhanda, ngoba wonke umuntu oyenzayo uzama ukuthatha kumuntu ofuna umsebenzi:\n'
        + '• Ukukucela ukuthi ukhokhe noma yini — imali yokubhalisa, idiphozi, imali "yokuqeqeshwa", imali yokugibela kusengaphambili. I-Vuka imahhala futhi awukho umqashi wangempela okukhokhisa ukuze usebenze.\n'
        + '• Ukucela inombolo yakho yomazisi, isithombe somazisi wakho, noma imininingwane yakho yasebhange engxoxweni. Umqashi wangempela akadingi lutho kulokho ukuze akunike usuku lomsebenzi. I-Vuka icela umazisi wakho kuphela ngaphakathi ku-app, ukuze kuqinisekiswe, futhi ayisoze yawucela ngomyalezo.\n'
        + '• Ukucela i-OTP noma i-PIN. Akekho umuntu osemthethweni oyoke akucele lezi. Hhayi i-Vuka, hhayi ibhange lakho, hhayi umqashi.\n'
        + '• Ukukuphoqa ukuthi niyise ingxoxo kwenye inombolo bese ukhokhela lapho.\n'
        + 'Gcina ingxoxo ku-app ukuze kube nerekhodi, umvimbe, bese umbike kokuthi Isikhungo sokuphepha. Umuntu ufunda wonke umbiko.\n'
        + 'Awenzanga lutho olubi ngokucelwa. Ukukubika kuvikela umuntu olandelayo.',
    },
    'report-someone': {
      title: 'Ukubika umuntu',
      asks: ['Ngimbika kanjani umuntu?', 'Othile akangikhokhelanga', 'Ngiwubika kanjani umkhonyovu?', 'Umqashi ubenenhlamba kimi'],
      keywords: ['bika', 'umbiko', 'isikhalazo', 'ukuhlukunyezwa', 'akangikhokhelanga', 'akuphephile', 'inhlamba', 'akananhlonipho', 'wamemeza', 'wangithuka', 'isikhungo sokuphepha', 'bangiphuca', 'ngishayiwe', 'ngisongelwe', 'ngihlaselwe', 'webile', 'ngilimele', 'ngigetshengiwe'],
      body:
        'Sebenzisa okuthi Isikhungo sokuphepha ngaphansi kokuthi Mina, noma uphakamise isexwayiso lapho ukhombisa ukuthi umsebenzi uqediwe.\n'
        + 'Sitshele okwenzekile ngamazwi akho. Imibiko iya emugqeni ofundwa ngumuntu — ayiphathwa ngumshini.\n'
        + 'Bika noma ubani ongakukhokheli lokho okwakuvunyelwene ngakho, okucela imali ukuze uthole umsebenzi, ocela umazisi wakho noma imininingwane yasebhange engxoxweni, noma oziphatha ngendlela ekwenza ungaphephi.\n'
        + 'Ukubika akulibeki engcupheni irekhodi lakho.',
    },
    'block-someone': {
      title: 'Ukuvimba umuntu',
      asks: ['Ngimvimba kanjani umuntu?', 'Ngingamvimba umuntu ukuthi angangithumeleli imiyalezo?', 'Ngifuna ukublocka umuntu'],
      keywords: ['vimba', 'uvinjiwe', 'misa imiyalezo', 'ziba', 'thulisa', 'block'],
      body:
        'Vula ingxoxo nalowo muntu bese umvimba. Akasakwazi ukukuthumelela imiyalezo, futhi ngeke uyibone imiyalezo evela kuye.\n'
        + 'Ukuvimba kwehlukile ekubikeni. Ukuvimba kumisa ukuxhumana; ukubika kusitshela ukuthi kukhona umuntu okufanele akubheke. Uma othile enze okuthile okungalungile, kwenze kokubili.',
    },
    'id-verification': {
      title: 'Ukuqinisekiswa komazisi',
      asks: ['Ngiwuqinisekisa kanjani umazisi wami?', 'Luthini uphawu lokuqinisekisiwe?', 'Kungani kufanele ngiqinisekise ubunikazi bami?', 'Ngiyi-verify kanjani i-ID yami?'],
      keywords: ['umazisi', 'ubunikazi', 'qinisekisa', 'uqinisekisiwe', 'uphawu', 'luhlaza', 'sa id', 'incwadi kamazisi'],
      body:
        'Ungathumela inombolo yakho yomazisi waseNingizimu Afrika ukuze iqinisekiswe. Uma umuntu eseyihlolile, uphawu lokuqinisekisiwe luvela kuphrofayela yakho futhi uthola ibheji elithi Umazisi Uqinisekisiwe.\n'
        + 'Akuphoqelekile, futhi ungayisebenzisa i-Vuka ngaphandle kwakho. Kufanelekile ukukwenza: umqashi okhetha phakathi kwabafakizicelo ababili uzothatha oqinisekisiwe, futhi isisebenzi esinquma ukuthi sizohamba siye ekhelini sizozizwa ngendlela ehluke kakhulu ngomqashi oqinisekisiwe.\n'
        + 'Inombolo yakho yomazisi ifihlwe ngekhodi futhi ayikhonjiswa kwabanye abasebenzisi. Abakubonayo wuphawu lokuqinisekisiwe, hhayi inombolo.',
    },
    'what-data': {
      title: 'Lokho i-Vuka ekwaziyo ngawe',
      asks: ['Iyiphi idatha eniyigcinayo ngami?', 'Ubani ongabona imininingwane yami?', 'Ingabe idatha yami iyimfihlo?', 'Privacy yami ivikelekile?'],
      keywords: ['idatha', 'ubumfihlo', 'popia', 'imininingwane yomuntu siqu', 'gcina', 'ubani obonayo', 'iyimfihlo'],
      body:
        'I-Vuka igcina lokho ekudingayo ukuze isebenze: igama lakho nenombolo yakho yeselula, iphrofayela yakho, umlando wakho womsebenzi nezilinganiso, imiyalezo yakho, futhi — uma ukhethe ukuzengeza — inombolo yakho yomazisi nemininingwane yakho yasebhange, kokubili kufihlwe ngekhodi.\n'
        + 'Abanye abasebenzisi babona igama lakho, indawo yakho, irekhodi lakho namabheji akho. Ababoni inombolo yakho yeselula, inombolo yakho yomazisi noma imininingwane yakho yasebhange.\n'
        + 'Amaseva atholakala e-{hosting}.\n'
        + 'Unamalungelo ngaphansi kwe-POPIA okubona lokho okugcinwe ngawe, okukulungisa, nokuthi kususwe. Isaziso sobumfihlo ngaphansi kokuthi Mina sichaza ukuthi ungacela kanjani, nokuthi ucela kubani.',
    },
    'delete-account': {
      title: 'Ukususa i-akhawunti yakho',
      asks: ['Ngiyisusa kanjani i-akhawunti yami?', 'Ngingayisusa imininingwane yami?', 'Ngifuna ukuvala i-akhawunti yami'],
      keywords: ['susa', 'vala i-akhawunti', 'cisha', 'yeka', 'phuma', 'delete'],
      body:
        'Ungacela ukuthi i-akhawunti yakho nemininingwane yakho yomuntu siqu kususwe. Isaziso sobumfihlo ngaphansi kokuthi Mina sinemininingwane yokuxhumana yalesi sicelo, okuyilungelo onalo ngaphansi kwe-POPIA, hhayi umusa.\n'
        + 'Kuhle ukucabanga kuqala: ukususa kususa irekhodi lakho lomsebenzi, okuyidumela olakhile nento evula imisebenzi esemthethweni. Alikwazi ukwakhiwa kabusha kusukela kuze. Uma ufuna nje ukuma isikhashana, ungavele ume — akukho okuphelelwa yisikhathi.',
    },

    /* ---------------- Chats ---------------- */
    'chats': {
      title: 'Ukuthumela imiyalezo',
      asks: ['Ngimthumelela kanjani umuntu umyalezo?', 'Zikuphi izingxoxo zami?', 'Ngingathumela umyalezo wezwi?', 'Ngingathumela i-voice note?'],
      keywords: ['ingxoxo', 'izingxoxo', 'umyalezo', 'imiyalezo', 'khuluma', 'umyalezo wezwi', 'voice note', 'isithombe', 'thumela', 'phendula', 'whatsapp'],
      body:
        'Izingxoxo zingaphakathi ku-app, phakathi kwakho nabantu osebenza nabo.\n'
        + '• Ungathumela umbhalo, imiyalezo yezwi nezithombe.\n'
        + '• Umyalezo wezwi uvame ukuba lula kunokubhala — ikakhulukazi ngolimi lwakho, noma uma uchaza ukuthi ukuphi.\n'
        + '• Imiyalezo ebhalwe kungekho uphawu ithunyelwa uma uphawu lubuya.\n'
        + 'Gcina izingxoxo zomsebenzi ku-app kunokuya kwenye inombolo. Kuyirekhodi, futhi uma kukhona okungahambi kahle yilokho umuntu obheka umbiko angakufunda ngempela.',
    },
    'notifications': {
      title: 'Izaziso',
      asks: ['Ngizithola kanjani izaziso zemisebenzi?', 'Ngizivula kanjani izaziso?', 'Ngizimisa kanjani izaziso?', 'Kungani ngingatholi izaziso?', 'Ama-notifications?'],
      keywords: ['isaziso', 'izaziso', 'notification', 'yazisa', 'sms', 'insimbi', 'thulisa', 'amahora okuthula', 'ukukhala'],
      body:
        'Thepha insimbi phezulu esikrinini ukuze ubone zonke izindaba ezintsha ngemisebenzi yakho, inkokhelo yakho ne-akhawunti yakho.\n'
        + 'Ukuze ukhethe okufika efonini yakho, vula Mina, bese uvula Izaziso. Zivule kule foni, bese ukhetha izinhlobo ozifunayo: imiyalezo, imisebenzi emisha eseduze kwakho, izindaba zomsebenzi, izinkokhelo nezaziso ze-akhawunti.\n'
        + 'Ungafihla amagama nemiyalezo esikrinini sokukhiya, futhi usethe amahora okuthula ukuze kungakhali lutho ebusuku. Noma yini oyicishayo isalinda ngaphansi kwensimbi.\n'
        + 'Uma wenqabe imvume ngaphambilini, phinde uvumele izaziso ze-Vuka kuzilungiselelo zefoni yakho noma zesiphequluli. I-app ayikwazi ukubuza okwesibili.',
    },
  },

  live: {
    'my-score': {
      title: 'I-Vuka Score yakho',
      asks: ['Ingakanani i-Vuka Score yami?', 'Ngiqhuba kanjani?', 'Amaphuzu ami angakanani manje?', 'My score ingakanani?'],
      keywords: ['amaphuzu ami', 'score yami', 'ngiqhuba kanjani', 'idumela lami'],
    },
    'my-tier': {
      title: 'Izinga lakho',
      asks: ['Ngisezingeni liphi?', 'Izinga lami lithini?', 'Ngikude kangakanani nezinga elilandelayo?', 'Ngiku-level ethini?'],
      keywords: ['izinga lami', 'ngisezingeni', 'ngikude kangakanani', 'level yami'],
    },
    'my-jobs': {
      title: 'Imisebenzi osuyiqedile',
      asks: ['Sengiqede imisebenzi emingaki?', 'Ngenze imisebenzi emingaki?', 'Ama-jobs engiwenzile mangaki?'],
      keywords: ['imisebenzi yami', 'sengiqede', 'emingaki', 'imisebenzi eqediwe'],
    },
    'my-earnings': {
      title: 'Osekuholile',
      asks: ['Sengihole malini?', 'Imali yonke engiyiholile ingakanani?', 'Ngenze malini ku-Vuka?'],
      keywords: ['sengihole', 'imali engiyiholile', 'imali yami', 'malini'],
    },
    'my-badges': {
      title: 'Amabheji akho',
      asks: ['Nginamabheji maphi?', 'Yimaphi amabheji engiwatholile?', 'Ama-badge ami?'],
      keywords: ['amabheji ami', 'nginamabheji', 'engiwatholile'],
    },
    'my-wallet': {
      title: 'Isikhwama sakho',
      asks: ['Kungakanani esikhwameni sami?', 'Ibhalansi yami ingakanani?', 'Ngingakhipha malini?', 'Wallet yami inamalini?'],
      keywords: ['esikhwameni sami', 'isikhwama sami', 'ibhalansi yami', 'ngingakhipha'],
    },
    'my-applications': {
      title: 'Imisebenzi osufake izicelo kuyo',
      asks: ['Sengifake izicelo ezingaki?', 'Ngifake izicelo kuphi?', 'Ama-applications ami mangaki?'],
      keywords: ['izicelo zami', 'sengifake', 'ezingaki'],
    },
    'my-verification': {
      title: 'Ukuthi umazisi wakho uqinisekisiwe yini',
      asks: ['Ngiqinisekisiwe yini?', 'Umazisi wami uqinisekisiwe?', 'Ngi-verified yini?'],
      keywords: ['ngiqinisekisiwe', 'umazisi wami', 'verified'],
    },
    'jobs-near-me': {
      title: 'Umsebenzi oseduze kwakho',
      asks: ['Yimuphi umsebenzi oseduze kwami?', 'Ikhona imisebenzi manje?', 'Mangaki ama-gig aseduze?'],
      keywords: ['eduze kwami', 'oseduze', 'ikhona imisebenzi', 'manje'],
    },
    'my-messages': {
      title: 'Imiyalezo yakho engafundiwe',
      asks: ['Nginayo imiyalezo?', 'Ikhona imiyalezo engafundiwe?', 'Any messages kimi?'],
      keywords: ['imiyalezo yami', 'engafundiwe', 'imiyalezo emisha', 'nginayo imiyalezo'],
    },
  },

  text: {
    noRecord: 'Awukaqedi umsebenzi okwamanje, ngakho akukho lutho erekhodini lakho engingalufunda. Umsebenzi wakho wokuqala oqediwe uyaliqalisa — ngemva kwalokho lizigcwalisa lodwa.',

    'fill.tierFirst': 'izinga wonke umuntu aqala kulo',
    'fill.tierReqs': 'imisebenzi eqediwe engu-{jobs}, izinkanyezi ezingu-{rating} noma ngaphezulu, futhi kungabikho zexwayiso zokuphepha',
    'fill.tierLine': '• {icon} {name} — {entry}. Livula: {unlocks}',
    'fill.categoryLine': '• {list}.',
    'fill.badgeLine': '• {icon} {label} — {desc}.',
    'fill.hours_one': 'ihora elingu-{count}',
    'fill.hours_other': 'amahora angu-{count}',
    'fill.days_one': 'usuku olungu-{count}',
    'fill.days_other': 'izinsuku ezingu-{count}',
    'fill.listSep': ', ',

    'score.value': 'I-Vuka Score yakho ingu-{rep} kweyi-100.',
    'score.built': 'Yakhiwe ngalokhu: {jobs}, isilinganiso esimaphakathi sezinkanyezi ezingu-{avg}, futhi {safety}.',
    'score.jobs_one': 'umsebenzi oqediwe ongu-{count}',
    'score.jobs_other': 'imisebenzi eqediwe engu-{count}',
    'score.clean': 'irekhodi lakho lokuphepha lihlanzekile',
    'score.flags_one': 'unesexwayiso sokuphepha esingu-{count}',
    'score.flags_other': 'unezexwayiso zokuphepha ezingu-{count}',
    'score.flagHolding': 'Isexwayiso yisona esiyibambe emuva, futhi sivimba nezinga lakho elilandelayo.',
    'score.strong': 'Lelo yirekhodi eliqinile. Abaqashi ababuka amakhono bazokubona phezulu ohlwini.',

    'tier.youAre': 'Izinga lakho ngu-{icon} {name} — {tagline}.',
    'tier.unlocks': 'Lokho kuvula: {unlocks}',
    'tier.top': 'Leli yizinga eliphezulu le-Ladder. Akukho okungaphezu kwalo.',
    'tier.next': 'Elilandelayo ngu-{icon} {name}.',
    'tier.needJobs_one': 'omunye umsebenzi oqediwe ongu-{count}',
    'tier.needJobs_other': 'eminye imisebenzi eqediwe engu-{count}',
    'tier.needRating': 'isilinganiso esimaphakathi sezinkanyezi ezingu-{rating} noma ngaphezulu — esakho singu-{avg}',
    'tier.needClean': 'irekhodi elihlanzekile — isexwayiso sokuphepha siyalivimba',
    'tier.allMet': 'Uyahlangabezana nayo yonke imibandela yalo.',
    'tier.stillNeed': 'Usadinga {list}.',
    'tier.and': ', futhi udinga ',

    'jobs.done_one': 'Usuqede umsebenzi ongu-{count} ku-Vuka, ohlanganisa {kinds}, ngesilinganiso esimaphakathi sezinkanyezi ezingu-{avg}.',
    'jobs.done_other': 'Usuqede imisebenzi engu-{count} ku-Vuka, ehlanganisa {kinds}, ngesilinganiso esimaphakathi sezinkanyezi ezingu-{avg}.',
    'jobs.kinds_one': 'uhlobo lomsebenzi olungu-{count}',
    'jobs.kinds_other': 'izinhlobo zomsebenzi ezingu-{count}',

    'earn.total_one': 'Usuhole {amount} emsebenzini oqediwe ongu-{count}, kubalwa ngenkokhelo ebibhalwe kulowo msebenzi. Okusesikhwameni sakho manje kuyinombolo ehlukile — ngibuze ukuthi "kungakanani esikhwameni sami".',
    'earn.total_other': 'Usuhole {amount} emisebenzini eqediwe engu-{count}, kubalwa ngenkokhelo ebibhalwe emsebenzini ngamunye. Okusesikhwameni sakho manje kuyinombolo ehlukile — ngibuze ukuthi "kungakanani esikhwameni sami".',

    'badges.none': 'Awukalitholi ibheji okwamanje. Elokuqala, elithi Umsebenzi Wokuqala, lifika ngokushesha nje uma umsebenzi wakho wokuqala wesikhashana uqinisekisiwe.',
    'badges.earned': 'Usuthole amabheji angu-{earned} kuwo wonke angu-{total}: {list}.',
    'badges.item': '{icon} {label}',
    'badges.missing': 'Asazofika: {list}.',
    'badges.missingItem': '{label}, okusho ukuthi {desc}',
    'badges.missingSep': '; ',

    'wallet.loading': 'Isikhwama sakho sisalayisha. Ngibuze futhi emzuzwini, noma uvule Mina, bese uvula Isikhwama sami.',
    'wallet.error': 'Angikwazanga ukufunda isikhwama sakho manje. Vula Mina, bese uvula Isikhwama sami, ukuze usibone.',
    'wallet.balance': 'Esikhwameni sakho kune-{amount}, esesilungele ukukhishelwa ebhange lakho.',
    'wallet.empty': 'Isikhwama sakho asinalutho okwamanje.',
    'wallet.pending': 'Enye imali engu-{amount} ivikelwe emisebenzini osayenza. Izofika uma umsebenzi ngamunye uqinisekisiwe.',
    'wallet.howLands': 'Inkokhelo ingena lapha uma umqashi eqinisekisa umsebenzi owenzile.',
    'wallet.test': 'Izinkokhelo zisesemodini yokuhlola okwamanje, ngakho ayikho imali yangempela esihambile.',

    'apps.none': 'Awukafaki isicelo nasinye okwamanje. Okuthi Thola umsebenzi kukhombisa imisebenzi yesikhashana eseduze kwakho, futhi ukufaka isicelo kuwukuthepha kanye nje.',
    'apps.some_one': 'Usufake isicelo emsebenzini wesikhashana ongu-{count}. Abaqashi babona bonke abafake izicelo bese bekhetha kubo, ngakho kujwayelekile ukungezwa lutho ngomunye — qhubeka ufaka izicelo.',
    'apps.some_other': 'Usufake izicelo emisebenzini yesikhashana engu-{count}. Abaqashi babona bonke abafake izicelo bese bekhetha kubo, ngakho kujwayelekile ukungezwa lutho ngomunye — qhubeka ufaka izicelo.',

    'verified.yes': 'Yebo — ubunikazi bakho buqinisekisiwe, futhi uphawu lokuqinisekisiwe luyabonakala kuphrofayela yakho. Lokho kungenye yezinto zokuqala olunye uhlangothi oluzibhekayo.',
    'verified.no': 'Hhayi okwamanje. Ungathumela inombolo yakho yomazisi waseNingizimu Afrika ngaphansi kokuthi Mina ukuze uqinisekiswe. Akuphoqelekile, kodwa umqashi okhetha phakathi kwabantu ababili uzothatha oqinisekisiwe.',

    'near.none': 'Akukho lutho ohlwini lwakho okwamanje. Imisebenzi emisha ifakwa usuku lonke — vula okuthi Imisebenzi emisha eseduze ngaphansi kokuthi Mina, bese kuba Izaziso, futhi ifoni yakho izokwazisa kunokuthi uhlale uhlola wena.',
    'near.some_one': 'Kunomsebenzi wesikhashana ongu-{count} ohlwini lwakho manje, ohlelwe kusukela koseduze kakhulu. Vula Thola umsebenzi ukuze uwubone.',
    'near.some_other': 'Kunemisebenzi yesikhashana engu-{count} ohlwini lwakho manje, ehlelwe kusukela koseduze kakhulu. Vula Thola umsebenzi ukuze uyibone.',

    'messages.none': 'Awunayo imiyalezo engafundiwe. Noma yini entsha evela kumqashi izovela kokuthi Izingxoxo, futhi ifoni yakho ingakwazisa uma okuthi Imiyalezo kuvuliwe ngaphansi kokuthi Mina, bese kuba Izaziso.',
    'messages.some_one': 'Unomyalezo ongafundiwe ongu-{count} olindile kokuthi Izingxoxo.',
    'messages.some_other': 'Unemiyalezo engafundiwe engu-{count} elindile kokuthi Izingxoxo.',
  },
};
