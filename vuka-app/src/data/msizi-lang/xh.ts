/**
 * Msizi in isiXhosa: every written answer, the live answers' headings and
 * phrasings, and the sentences live answers are built from.
 *
 * Keyed by the English ids in data/msizi.ts; anything missing falls back to
 * English. Not written by a first-language speaker — a first-language
 * speaker's correction wins. Keep every {placeholder} exactly.
 */
import type { MsiziLang } from './types';

export const msiziXh: MsiziLang = {
  entries: {
    'what-is-vuka': {
      title: 'Yintoni iVuka Uzenzele',
      asks: ['Yintoni iVuka?', 'Le app yenza ntoni?', 'Ndichazele le app', 'I-Vuka yi-app enjani?'],
      keywords: ['malunga', 'injongo', 'uzenzele', 'app'],
      body:
        'IVuka Uzenzele idibanisa ulutsha lwaseMzantsi Afrika nomsebenzi — iqala ngemisebenzi emincinci yexeshana ekufutshane, ikhule ibe yimisebenzi esesikweni.\n'
        + 'Umbono ulula. Akufuneki ube ne-CV ukuze uqale. Wenza umsebenzi, umqeshi akulinganise, kwaye olo linganiso lube lirekhodi lakho. Xa usenza umsebenzi omhle owaneleyo unyuka kwi-The Ladder, evula imisebenzi ehlawula ngcono nesesikweni ngakumbi.\n'
        + 'Ayihlawulelwa, kubasebenzi nakubaqeshi.\n'
        + 'Ukungabikho kwemisebenzi kulutsha loMzantsi Afrika kwi-{youthUnemployment} kwabaneminyaka eyi-15 ukuya kwengama-24. Le app ikhona ukunika abantu indlela yokungena xa kungekho mntu ubanika ithuba lokuqala.',
    },
    'is-it-free': {
      title: 'Ixabiso layo',
      asks: ['Ingaba iVuka isimahla?', 'Ixabisa malini le app?', 'Kufuneka ndihlawule ukuyisebenzisa?', 'Ingaba i-Vuka i-free?'],
      keywords: ['simahla', 'ixabiso', 'imali yokubhalisa', 'free'],
      body:
        'IVuka isimahla. Akukho mali yokubhalisa, akukho mali yenyanga, kwaye akuhlawulwa ukufaka isicelo somsebenzi okanye ukufaka umsebenzi.\n'
        + 'IVuka ayithathi nesabelo kwimali oyifumanayo. Intlawulo yomsebenzi ikhuselwa ngumqeshi ngaphambi kokuba umsebenzi uqale, ize ikhutshelwe esipajini sakho xa uqinisekisiwe — okwangoku kwimowudi yovavanyo, ngoko akukho mali yokwenene ihamba ngeVuka okwangoku.\n'
        + 'Ukuba umntu ukhe akucele ukuba uhlawule imali ukuze ufumane umsebenzi kwiVuka, obo bubuqhetseba. Mxele.',
    },
    'who-is-msizi': {
      title: 'Ngubani uMsizi',
      asks: ['Ungubani?', 'Ungenza ntoni?', 'Uyirobhothi?', 'Wenziwa ngubani?', 'Ngubani owakha uMsizi?'],
      keywords: ['msizi', 'umncedisi', 'irobhothi', 'bot'],
      body:
        'NdinguMsizi — "umsizi" lithetha umncedisi. Ndiphendula imibuzo malunga nendlela iVuka esebenza ngayo.\n'
        + 'Andinguye ubukrelekrele bokwenziwa kwaye andiqikeleli. Ndiyiqoqo leempendulo ezibhaliweyo nezihlolwe ngokuchasene nendlela le app eziphatha ngayo ngokwenene, ngoko xa ndikuxelela into, iyinyani ngeVuka. Ukuba andiyazi into, ndiya kutsho kunokuba ndiyiqambe.\n'
        + 'Ndingakufundela irekhodi lakho — amanqaku akho, inqanaba lakho, imisebenzi yakho, izicelo zakho — kuba sele likwifowuni yakho. Andikwazi ukukufakela izicelo zemisebenzi, ukuqesha nabani na, okanye ukuchukumisa iinkcukacha zakho zebhanki. Ezo zihlala ziyisigqibo sakho, rhoqo.\n'
        + 'Ungandibhalela okanye ucofe imayikrofoni uthethe.',
    },
    'msizi-languages': {
      title: 'Ukuthetha noMsizi ngolwimi lwakho',
      asks: ['Uyasithetha isiXhosa?', 'Zeziphi iilwimi ozithethayo?', 'Ndingathetha nawe ngolwimi lwam?', 'Uyakwazi i-English nesiXhosa?'],
      keywords: ['ulwimi', 'iilwimi', 'isixhosa', 'isizulu', 'thetha', 'guqulela'],
      body:
        'Ungandibuza imibuzo ngesiZulu, ngesiXhosa, ngesiSotho, ngesiBhulu okanye ngesiNgesi, kwaye ndiya kuwaqonda amagama aqhelekileyo kuzo zonke.\n'
        + 'Ndiphendula ngolwimi i-app esetelwe kulo. Iimpendulo zam ziguqulelwe ngenyameko, kodwa azikahlolwa sisithethi solwimi lweenkobe, ngoko ukuba kukho into efundeka ingalunganga, nceda usixelele kwisikrini esithi Ulwimi.\n'
        + 'Ukuthetha ngokuvakalayo kuxhomekeke kulwimi lwakho nakwifowuni yakho. NgesiNgesi nangesiBhulu ndingakumamela kwiifowuni ezininzi. Amazwi esiZulu, esiXhosa nesiSotho uninzi lwawo alukabikho kwiifowuni, ngoko kwezo lwimi ndingakwazi ukuphendula ngokubhala kuphela. Ukuba eyakho ayikwazi ulwimi lwakho, ndiya kukuxelela kwisikrini endaweni yokuthula ndingenzi nto.',
    },
    'how-to-start': {
      title: 'Ukuqalisa',
      asks: ['Ndiqala njani?', 'Ndibhalisa njani?', 'Ndivula njani iakhawunti?', 'Ndenza njani i-sign up?'],
      keywords: ['qala', 'bhalisa', 'joyina', 'iakhawunti', 'register'],
      body:
        'Khetha ukuba ufuna umsebenzi okanye ufuna ukuqesha, uze ubhalise ngenombolo yakho yefowuni.\n'
        + '• Sithumela ikhowudi yexesha elinye nge-SMS ukujonga ukuba inombolo yeyakho ngokwenene.\n'
        + '• Ukhetha igama lokugqitha uze wongeze iinkcukacha ezimbalwa — indawo yakho, iminyaka yakho, iintlobo zomsebenzi onokuwenza.\n'
        + '• Kuphelele apho. Ungaqala ukufaka izicelo zemisebenzi kwangoko, ngaphandle kwe-CV nangaphandle kwamava omsebenzi.\n'
        + 'Umsebenzi wakho wokuqala nguwo oqalisa irekhodi lakho. Emva koko, irekhodi likuthethela.',
    },
    'worker-or-employer': {
      title: 'Iakhawunti yomsebenzi okanye iakhawunti yomqeshi',
      asks: ['Wahluko luni phakathi kweakhawunti yomsebenzi neyomqeshi?', 'Ndikhethe eyiphi iakhawunti?', 'Ndingumsebenzi okanye ndingumqeshi kule app?'],
      keywords: ['umqeshi', 'uhlobo lweakhawunti', 'umahluko', 'khetha'],
      body:
        'Iakhawunti yomsebenzi yeyokufumana umsebenzi. Ujonga imisebenzi, ufaka isicelo, wenza umsebenzi, kwaye wakha irekhodi elivula imisebenzi engcono.\n'
        + 'Iakhawunti yomqeshi yeyokuqesha. Ufaka umsebenzi, ubona abafaka izicelo, ukhetha umntu, uze uqinisekise umsebenzi xa ugqityiwe.\n'
        + 'Inombolo enye yefowuni yiakhawunti enye, ngoko khetha leyo ihambelana nento oze kuyenza apha. Ukuba ufuna zombini, sebenzisa enye inombolo kweyesibini.',
    },
    'minimum-age': {
      title: 'Iminyaka ekufuneka ube nayo',
      asks: ['Kufuneka ndibe neminyaka emingaphi?', 'Ndingasebenza kwiVuka ukuba ndineminyaka eli-16?', 'Iminyaka ephantsi efunekayo ngeyiphi?', 'Ndisemncinci, ndingajoyina?'],
      keywords: ['iminyaka', 'mncinci', 'ngaphantsi kwe-18', 'umntwana', 'age'],
      body:
        'Kufuneka ube neminyaka eli-18 nangaphezulu ukuze usebenzise iVuka.\n'
        + 'Umthetho woMzantsi Afrika uyabavumela abantu abaneminyaka eli-15 ukuba benze imisebenzi ethile, ngoko lo ngumda wethu hayi owelizwe. Isizathu yi-POPIA: nabani na ongaphantsi kweminyaka eli-18 ngokomthetho ngumntwana, kwaye iinkcukacha zobuqu zomntwana azinakuphathwa ngaphandle kwemvume yomgcini wakhe. IVuka ayinayo indlela yokufumana nokuqinisekisa loo mvume okwangoku, ngoko endaweni yokuqokelela isazisi, indawo neenkcukacha zebhanki zomntu omncinci ngaphandle kwayo, asiyithathi kwaphela iakhawunti.\n'
        + 'Ukuba uza kuba neminyaka eli-18 kungekudala, bhalisa ngelo xesha. Akukho nto ilahlekayo ngokulinda.',
    },
    'otp-problems': {
      title: 'Xa ikhowudi ye-SMS ingafiki',
      asks: ['Andiyifumananga i-OTP yam', 'Ikhowudi ye-SMS ayifiki', 'Andikwazi ukuqinisekisa inombolo yam', 'I-OTP ayize'],
      keywords: ['otp', 'sms', 'ikhowudi', 'ayifiki', 'umyalezo obhaliweyo'],
      body:
        'Ikhowudi ithunyelwa nge-SMS kwaye idla ngokufika kungaphelanga umzuzu.\n'
        + '• Jonga inombolo oyibhalileyo, kuquka u-0 ekuqaleni.\n'
        + '• Qiniseka ukuba unomqondiso. Ikhowudi ayinakufika ukuba ifowuni ayinanethiwekhi.\n'
        + '• Linda umzuzu opheleleyo ngaphambi kokucela enye — ukucela ezininzi ngokulandelelana kungakubeka ngasemva komda wezicelo.\n'
        + 'Ukuba isengafiki, yingxaki yethu hayi eyakho, kwaye i-app iya kutsho endaweni yokukushiya uqashisela.',
    },
    'forgot-password': {
      title: 'Igama lokugqitha elilityelweyo',
      asks: ['Ndilibele igama lam lokugqitha', 'Ndilitshintsha njani igama lokugqitha?', 'Andikwazi ukungena', 'Ndilibele i-password yam'],
      keywords: ['igama lokugqitha', 'password', 'libele', 'ngena', 'login'],
      body:
        'Kwisikrini sokungena, khetha ukusetha kwakhona igama lakho lokugqitha. Sithumela ikhowudi kwinombolo yakho yefowuni, kwaye xa uyifakile ungaseta igama lokugqitha elitsha.\n'
        + 'Oku kusebenza kuphela kwinombolo iakhawunti eyavulwa ngayo — yiloo nto emisa omnye umntu ekutshintsheleni igama lakho lokugqitha.',
    },
    'change-language': {
      title: 'Ukutshintsha ulwimi',
      asks: ['Ndilutshintsha njani ulwimi?', 'Ndingayisebenzisa le app ngesiXhosa?', 'Ndifuna i-app ibe sesiXhosa'],
      keywords: ['ulwimi', 'tshintsha', 'isixhosa', 'language'],
      body:
        'Yiya ku-Mna, emva koko Ulwimi. IVuka ifumaneka ngesiNgesi, ngesiZulu, ngesiXhosa, ngesiSotho nangesiBhulu, kwaye ukhetho lwakho luyakhunjulwa naxa ungekho kwi-intanethi.\n'
        + 'Qaphela ukuba le app iguqulelwa isikrini ngesikrini, ngoko ezinye izikrini zisesesiNgesini. Isikrini esithi Ulwimi sikuxelela ngokunyanisekileyo ukuba sele kufikwe phi.\n'
        + 'Amaphepha omthetho ahlala esesiNgesini ngabom — igama lomthetho eliguqulelwe kakubi liyabalahlekisa abantu, kwaye oko kubi ngaphezu kokukucela ukuba ulifunde ngesiNgesi.\n'
        + 'Ukuba inguqulelo ifundeka ingalunganga kuwe, kukho ibhokisi kweso sikrini ukuze usixelele. Ezo zifundwa ngumntu.',
    },
    'install-app': {
      title: 'Ukufaka iVuka kwifowuni yakho',
      asks: ['Ndiyifaka njani le app?', 'Ndingayongeza kwisikrini sasekhaya?', 'Ikhona i-app yokukhuphela?', 'Ndiyi-install njani i-app?'],
      keywords: ['faka', 'install', 'khuphela', 'isikrini sasekhaya', 'play store'],
      body:
        'IVuka ifakeka ngqo ukusuka kwisikhangeli — akukho nto yokukhuphela kwivenkile yee-app, oko kuthetha ukuba akukho kukhuphela kukhulu kwaye akuchithwa datha kuhlaziyo.\n'
        + 'Khangela iqhosha lokufaka kwi-app, okanye usebenzise imenyu yesikhangeli sakho uze ukhethe Yongeza kwisikrini sasekhaya.\n'
        + 'Xa ifakiwe ivuleka njengayo nayiphi na enye i-app, isebenza nomqondiso obuthathaka, kwaye ibonisa izikrini zakho ezigciniweyo naxa ungekho kwi-intanethi.',
    },
    'works-offline': {
      title: 'Ukusebenzisa iVuka ngaphandle kwedatha',
      asks: ['Iyasebenza ngaphandle kwe-intanethi?', 'Ndingayisebenzisa iVuka ndingenadatha?', 'Kwenzeka ntoni ukuba umqondiso uyaphela?', 'Iyasebenza offline?'],
      keywords: ['idatha', 'umqondiso', 'offline', 'intanethi', 'inethiwekhi'],
      body:
        'Ngokuyinxenye, kwaye ngabom. IVuka yakhelwe ifowuni enebhanile yedatha engenanto kwindawo enomgca omnye womqondiso.\n'
        + '• I-app ngokwayo ivuleka ngaphandle komqondiso, ngolwimi olukhethileyo.\n'
        + '• Izikrini osele uzibonile zihlala zifundeka.\n'
        + '• Imiyalezo oyithumela ungekho kwi-intanethi iyalinda ize ihambe xa umqondiso ubuya, endaweni yokulahleka.\n'
        + 'Into efuna uqhagamshelo: uluhlu lwemisebenzi emitsha, ukufaka isicelo, nantoni na ekufuneka ifike komnye umntu.',
    },
    'find-work': {
      title: 'Ukufumana umsebenzi',
      asks: ['Ndiwufumana njani umsebenzi?', 'Iphi imisebenzi?', 'Ndingawufumana njani umsebenzi?', 'Ndifaka njani isicelo somsebenzi?', 'Ndifuna umsebenzi', 'Ndifuna i-job'],
      keywords: ['fumana', 'umsebenzi', 'imisebenzi', 'khangela', 'isicelo', 'job'],
      body:
        'Cofa Fumana umsebenzi. Uza kubona imisebenzi ekufutshane nawe, kuqala okona kukufutshane.\n'
        + '• Hluza ngohlobo lomsebenzi usebenzisa umqolo wamacandelo phezulu.\n'
        + '• Umsebenzi ngamnye obhaliweyo ubonisa intlawulo ngeyure, ubude bawo, umgama wawo, nokuba ngubani owunikayo.\n'
        + '• Vula omnye ufunde iinkcukacha, uze ufake isicelo. Ukufaka isicelo kukucofa kanye kwaye akubizi nto.\n'
        + 'Ungafaka izicelo ezininzi kangangoko uthanda. Umqeshi ubona irekhodi lakho — ulinganiso lwakho, imisebenzi oyenzileyo, inqanaba lakho — aze akhethe kubantu abafake izicelo.',
    },
    'job-types': {
      title: 'Iintlobo zomsebenzi kwiVuka',
      asks: ['Zeziphi iintlobo zemisebenzi ekhoyo?', 'Ndingawenza muphi umsebenzi?', 'Zeziphi iicategories ezikhoyo?'],
      keywords: ['iintlobo', 'amacandelo', 'ukucoca', 'igadi', 'ukufundisa', 'categories'],
      body:
        'Imisebenzi yexeshana — emifutshane, ekufutshane, ehlawulwa ngeyure. Okwangoku zezi:\n'
        + '{categories}\n'
        + 'Imisebenzi esesikweni — ingqesho efanelekileyo yeeshifti neyenqanaba lokuqala, njengomncedisi wepetroli, umsebenzi wendawo yokugcina iimpahla, ikhashiya, igosa lokhuseleko, i-arhente yeziko leefowuni nomncedisi wevenkile.\n'
        + 'Imisebenzi esesikweni iyasebenzelwa, ayikhangelwa nje. Ngamnye ufuna inqanaba, kwaye ufikelela kwinqanaba ngokwenza imisebenzi yexeshana kakuhle. Yiyo leyo injongo yeleli: imisebenzi emincinci yindlela yokufikelela kwemikhulu ngaphandle kwe-CV.',
    },
    'no-matric-needed': {
      title: 'Ingaba ufuna imatriki okanye amava',
      asks: ['Ndiyayidinga imatriki?', 'Ndiyawadinga amava?', 'Ndifuna i-CV ukuze ndiqale?', 'Andinayo imatriki, ndingasebenza?'],
      keywords: ['imatriki', 'ibanga le-12', 'isiqinisekiso', 'imfundo', 'amava', 'isikolo', 'matric'],
      body:
        'Hayi. Akuyidingi imatriki, i-CV, amava, okanye umntu okuncomayo ukuze uqale kwiVuka. Yiyo leyo injongo yayo.\n'
        + 'Imisebenzi yexeshana ivulelekile kuwo wonke umntu. Wenza umsebenzi, umqeshi akulinganise, kwaye olo linganiso ngamava — luba lirekhodi elikufumanela olandelayo.\n'
        + 'Imisebenzi esesikweni ivulwa linqanaba lakho, hayi imfundo yakho. Inqanaba lifunyanwa ngomsebenzi ogqityiweyo, ngoko umntu oyeke isikolo kwangoko nosebenza kakuhle ufikelela kwimisebenzi yekhashiya neyeziko leefowuni ngendlela efanayo nomnye umntu. Eminye imisebenzi ethile iyazichaza iimfuno zayo, kwaye isaziso somsebenzi siyakuxelela.\n'
        + 'Ukuba unayo imatriki okanye isiqinisekiso, yongeze kwiprofayile yakho — ingakunceda nje. Ayisoze ibe yinto ekuvimbayo kumsebenzi wakho wokuqala wexeshana.',
    },
    'after-i-apply': {
      title: 'Kwenzeka ntoni emva kokuba ufake isicelo',
      asks: ['Kwenzeka ntoni emva kokuba ndifake isicelo?', 'Ndazi njani ukuba ndiwufumene umsebenzi?', 'Kutheni kungekho mntu uphendulileyo?'],
      keywords: ['isicelo', 'ndifake', 'ndilindile', 'impendulo', 'uqeshiwe', 'akukho mntu'],
      body:
        'Umqeshi ubona bonke abafake izicelo, kunye nerekhodi lomntu ngamnye, aze akhethe. Ukuba ukhethe wena, uqeshiwe kwaye ufumana isaziso.\n'
        + 'Ungabona yonke into ofake isicelo sayo kwisikrini sakho esithi Ikhaya.\n'
        + 'Ukungaphendulwa kuqhelekile kwaye ayisosigwebo ngawe — umsebenzi ofuna umntu omnye usenokuba ube nabafaki-zicelo abangamashumi amabini. Qhubeka ufaka izicelo. Eyona nto inkulu etshintsha amathuba akho kukuba nemisebenzi embalwa egqityiweyo nolinganiso oluhle emva kwakho, yiyo loo nto owokuqala ubaluleke ngaphezu kwabanye.',
    },
    'distance': {
      title: 'Umgama womsebenzi',
      asks: ['Ukude kangakanani lo msebenzi?', 'IVuka iyazi njani indawo endikuyo?', 'Kutheni ibonisa umgama ongalunganga?'],
      keywords: ['umgama', 'kude', 'indawo', 'gps', 'kufutshane', 'km', 'ukuhamba'],
      body:
        'Ukuba uvumela iVuka isebenzise indawo yakho, imigama ilinganiswa ukusuka apho ukhoyo ngokwenene, kwaye uluhlu luhlelwa kuqala okona kukufutshane.\n'
        + 'Ukuba awuvumi, umsebenzi ngamnye usabonisa igama lendawo yawo, kwaye i-app iphawula oko njengoqikelelo endaweni yokwenza ngathi iyilinganisile.\n'
        + 'Indawo yakho isetyenziswa kwifowuni yakho ukuhlela nokulinganisa. Umgama ubalulekile apha ngaphezu kokuba ubonakala: ukuhamba yeyona ndleko inkulu yokukhangela umsebenzi eMzantsi Afrika, ngoko umsebenzi okude ngeeteksi ezimbini ungabiza ngaphezu koko uwuhlawulayo ukuya kuwo.',
    },
    'invitations': {
      title: 'Izimemo zomsebenzi',
      asks: ['Siyintoni isimemo?', 'Umqeshi undimemile — kuthetha ukuthini oko?', 'Ndifumene i-invite, yintoni?'],
      keywords: ['isimemo', 'izimemo', 'memile', 'mema', 'invite'],
      body:
        'Umqeshi obone irekhodi lakho angakumema ngqo kumsebenzi othile, endaweni yokulinda ukuba uwufumane.\n'
        + 'Isimemo asikokuqeshwa okwangoku — kukucelwa ukuba ufake isicelo. Ungamkela okanye wale, kwaye ukwala akukubizi nto kwaye akubalwa ngokuchasene nerekhodi lakho.\n'
        + 'Izimemo ziba ninzi kakhulu xa sele ukwinqanaba Othembekileyo nangaphezulu, kuba lelo xesha abaqeshi baqala ukujonga izakhono endaweni yokufaka umsebenzi nje balinde.',
    },
    'change-my-mind': {
      title: 'Ukutshintsha ingqondo ngomsebenzi',
      asks: ['Ndingawurhoxisa umsebenzi?', 'Ndisirhoxisa njani isicelo sam?', 'Andisakwazi ukuya emsebenzini', 'Ndifuna uku-cancel i-job'],
      keywords: ['rhoxisa', 'tshintsha ingqondo', 'andisakwazi', 'cancel', 'yeka'],
      body:
        'Akukabikho qhosha lokurhoxisa isicelo kwi-app okwangoku, ngoko isicelo osithumeleyo sihlala sithunyelwe.\n'
        + 'Ukuba awusakwazi ukwenza umsebenzi, thumela umyalezo kumqeshi ku-Iincoko umxelele kwangoko xa usazi. Yiloo nto kuphela — ukubaxelela kwangoko akukubizi nto, kwaye yinto eyenziwa ngumntu othembekileyo.\n'
        + 'Into eyonakalisa irekhodi kukuthula: ukuqeshwa uze ungafiki, ungathumeli myalezo. Umqeshi angakulinganisa ngako oko, kwaye yinto enye enzima ngokwenene ukuyilungisa.\n'
        + 'Ukufaka isicelo ungaphinde uve nto akufani nako oko kwaye akunasohlwayo kwaphela.',
    },
    'formal-jobs-locked': {
      title: 'Kutheni umsebenzi osesikweni utshixiwe',
      asks: ['Kutheni ndingakwazi ukufaka isicelo salo msebenzi?', 'Kutheni lo msebenzi utshixiwe?', 'Ndiyivula njani imisebenzi esesikweni?'],
      keywords: ['utshixiwe', 'tshixiwe', 'esesikweni', 'vula', 'locked'],
      body:
        'Umsebenzi ngamnye osesikweni ufuna inqanaba elithile ubuncinane, kwaye ufikelela kwinqanaba ngokugqiba imisebenzi yexeshana ngolinganiso oluhle.\n'
        + 'Asikukuvimbi. Kunjalo ngokuchaseneyo: umqeshi onika umsebenzi wokwenene weshifti akayi kuthatha umntu ongenambali, ngoko inqanaba bubungqina obume endaweni ye-CV nabantu abakuncomayo ongekabinabo. Xa iVuka isithi ukwinqanaba Othembekileyo, oko kuthetha imisebenzi emithathu egqityiweyo nolinganiso emva kwayo.\n'
        + 'Isaziso somsebenzi sikuxelela ukuba lifuna liphi inqanaba. Irekhodi lam likuxelela ukuba ukude kangakanani nalo.',
    },
    'my-record': {
      title: 'Irekhodi lam',
      asks: ['Yintoni Irekhodi lam?', 'Kukho ntoni kwirekhodi lam?', 'Iphi i-CV yam?'],
      keywords: ['irekhodi', 'cv', 'imbali yomsebenzi', 'ubungqina bomsebenzi', 'record'],
      body:
        'Irekhodi lam yi-CV ebhalwa yi-app endaweni yakho, ngomsebenzi owenzileyo ngokwenene.\n'
        + 'Liqulathe wonke umsebenzi ogqityiweyo, ukuba yayiyintoni, yayingokabani, uhlawulwe malini, kunye nolinganiso nophononongo olushiywe ngumqeshi. Liphinda liphathe i-Vuka Score yakho, inqanaba lakho neebheji zakho.\n'
        + 'Awuze ulibhale kwaye awukwazi ukulihlela, yiyo kanye loo nto umqeshi elikholelwayo. Umsebenzi ngamnye ubhalwe phantsi kwegama elifanelekileyo lomsebenzi — umsebenzi wokuthutha ufundeka njengoMncedisi wokuthutha, hayi "uncedo lokufudusa" — kuba yiloo nto umntu oqeshayo ayikhangelayo.\n'
        + 'Ungabelana ngalo njengekhonkco loluntu, ngoko lisebenza njenge-CV nangaphandle kwe-app.',
    },
    'vuka-score': {
      title: 'I-Vuka Score',
      asks: ['Yintoni i-Vuka Score?', 'Amanqaku am abalwa njani?', 'Ndingawanyusa njani amanqaku am?'],
      keywords: ['amanqaku', 'score', 'ibalwa', 'nyusa', 'idumela'],
      body:
        'I-Vuka Score yakho linani elinye kwali-100 elishwankathela irekhodi lakho. Lakhiwe zizinto ezintathu:\n'
        + '• Umndilili weenkwenkwezi zakho, eyona nxalenye inkulu yalo.\n'
        + '• Ubuninzi bemisebenzi oyigqibileyo, ubalwa ukuya kutsho kwishumi elinesibini.\n'
        + '• Irekhodi lokhuseleko elicocekileyo, elingenazo izilumkiso ngawe.\n'
        + 'Lihlala liziro de kube ngumsebenzi wakho wokuqala ogqityiweyo, kuba akukabikho nto yokulinganisa.\n'
        + 'Indlela yokulinyusa yeyesiqhelo: fika, wenze umsebenzi kakuhle, ube ngumntu umqeshi afuna ukuphinda amqeshe. Akukho ndlela yokulithenga okanye yokulinyusa ngobuqhophololo, kwaye yiyo loo nto kuphela linexabiso.',
    },
    'the-ladder': {
      title: 'The Ladder, ileli yamanqanaba',
      asks: ['Yintoni i-The Ladder?', 'Yintoni amanqanaba?', 'Ndichazele amanqanaba', 'Ileli isebenza njani?'],
      keywords: ['ileli', 'inqanaba', 'amanqanaba', 'oqalayo', 'othembekileyo', 'ingcali', 'ophambili', 'tier'],
      body:
        'The Ladder yindlela imisebenzi emincinci eguquka ngayo ibe yeyokwenene. Mane amanqanaba, kwaye ngalinye liyasebenzelwa:\n'
        + '{tiers}\n'
        + 'Unyuka ngokuzenzekelayo ngoko nangoko xa uyanelisa yonke imiqathango yenqanaba elilandelayo — imisebenzi eyenziweyo, umndilili wolinganiso, kwaye akukho zilumkiso zokhuseleko.\n'
        + 'Akukho nto apha inokuthengwa kwaye akukho nto iphelelwa lixesha.',
    },
    'move-up-tier': {
      title: 'Ukunyuka inqanaba',
      asks: ['Ndinyuka njani inqanaba?', 'Ndifika njani kwinqanaba elilandelayo?', 'Yintoni endithintela ukuba ndinyuke?'],
      keywords: ['nyuka', 'elilandelayo', 'inkqubela', 'ndibambekile', 'imiqathango'],
      body:
        'Imiqathango emithathu, ekufuneka yonke iyinyani ngaxeshanye:\n'
        + '• Imisebenzi egqityiweyo eyaneleyo kwelo nqanaba.\n'
        + '• Umndilili wolinganiso olingana okanye ongaphezulu koko kufunwa linqanaba.\n'
        + '• Akukho zilumkiso zokhuseleko kwirekhodi lakho.\n'
        + 'Irekhodi lam libonisa ukuba yeyiphi kule mithathu oyanelisileyo neyiphi ongekayanelisi, ngoko ungabona kanye into ekuvimbayo endaweni yokuqashisela.\n'
        + 'Ndibuze uthi "ndikweliphi inqanaba" ndiya kukufundela amanani akho.',
    },
    'badges': {
      title: 'Iibheji',
      asks: ['Ziintoni iibheji?', 'Ndizifumana njani iibheji?', 'Iibheji zisebenza njani?'],
      keywords: ['ibheji', 'iibheji', 'ibhaso', 'impumelelo', 'badge'],
      body:
        'Iibheji ziphawula izinto ezithile ozenzileyo. Zihlala kwirekhodi lakho apho umqeshi anokuzibona khona:\n'
        + '{badges}\n'
        + 'Zifunyanwa ngokuzenzekelayo. Akunyanzelekanga ukuba uyibange.',
    },
    'ratings-average': {
      title: 'Indlela ulinganiso lwakho olusebenza ngayo',
      asks: ['Ulinganiso lwam lusebenza njani?', 'Kutheni umndilili wam ungatshintshanga?', 'Ngubani ondilinganisayo?', 'Ii-stars zam zisebenza njani?'],
      keywords: ['ulinganiso', 'iinkwenkwezi', 'umndilili', 'uphononongo', 'rating', 'stars'],
      body:
        'Xa ugqiba umsebenzi umqeshi uyawuqinisekisa aze akulinganise ukusuka kwinkwenkwezi enye ukuya kwezintlanu, ngophononongo olufutshane. Olo linganiso luya kwirekhodi lakho nakumndilili wakho.\n'
        + 'Kukho imeko enye eyothusayo abantu, kwaye ikuncedo kuwe. Ukuba umqeshi akaze awuqinisekise, umsebenzi ubalelwa kuwe noko emva kwexesha lokuqinisekisa — kodwa ugcinwa ungenalo nolinganiso kwaphela, kwaye ushiywa ngaphandle komndilili wakho ngokupheleleyo. Ngoko umqeshi othulayo akanakunceda okanye onakalise ulinganiso lwakho. Usawufumana umsebenzi, imali nokubhalwa kwirekhodi.',
    },
    'safety-flag': {
      title: 'Izilumkiso zokhuseleko',
      asks: ['Yintoni isilumkiso sokhuseleko?', 'Isilumkiso sindichaphazela njani?', 'Isilumkiso singasuswa?', 'Yintoni i-safety flag?'],
      keywords: ['isilumkiso', 'izilumkiso', 'flag', 'isilumkiso sokhuseleko'],
      body:
        'Isilumkiso sokhuseleko siyaphakanyiswa xa umntu exela inkxalabo yokwenene yokhuseleko ngomsebenzi — ngumsebenzi ngomqeshi, okanye ngenye indlela.\n'
        + 'Isilumkiso kwirekhodi lakho sikumisa ukuba unyuke inqanaba, kuba onke amanqanaba angaphezu kwe-Oqalayo afuna irekhodi elicocekileyo.\n'
        + 'Izilumkiso zifundwa ngumntu, azigqitywa yi-app. Zikhona ukugcina abantu bekhuselekile xa bengena emakhayeni abantu abangabaziyo nokugcina ileli inexabiso — hayi njengesohlwayo somsebenzi ongahambanga kakuhle. Ukungavumelani ngomsebenzi asisosilumkiso sokhuseleko.',
    },
    'public-cv': {
      title: 'Ukwabelana ngerekhodi lakho',
      asks: ['Ndabelana njani nge-CV yam?', 'Ndingalithumela irekhodi lam komnye umntu?', 'Abantu bangalibona irekhodi lam ngaphandle kwe-app?'],
      keywords: ['yabelana', 'ikhonkco', 'thumela', 'whatsapp', 'ngaphandle', 'bonisa umqeshi'],
      body:
        'Irekhodi lakho lingabelwana ngalo njengekhonkco. Nabani na olivulayo ubona inguqulelo efundwayo kuphela yembali yakho yomsebenzi, ulinganiso nenqanaba, engayidingi iakhawunti yeVuka.\n'
        + 'Le yindlela yokuphendula "unayo i-CV?" xa ungenayo. Thumela ikhonkco kuWhatsApp.\n'
        + 'Inguqulelo yoluntu ibonisa umsebenzi wakho nedumela lakho. Ayiyibonisi inombolo yakho yefowuni, inombolo yesazisi sakho okanye iinkcukacha zakho zebhanki.',
    },
    'how-payment-works': {
      title: 'Indlela ohlawulwa ngayo',
      asks: ['Ndihlawulwa njani?', 'Ingaba iVuka iyayigcina imali yam?', 'Ndiyifumana nini imali yam?', 'Ndiba-paid njani?'],
      keywords: ['hlawulwa', 'intlawulo', 'imali', 'umvuzo', 'ikhuselwe', 'isipaji', 'escrow'],
      body:
        'Intlawulo yomsebenzi ikhuselwa ngaphambi kokuba umsebenzi uqale. Umqeshi ufaka imali yonke xa efaka umsebenzi, okanye emva koko — kodwa rhoqo ngaphambi kokuba aqeshe nabani na.\n'
        + '• Khangela Imali ikhuselekile kumsebenzi. Kuthetha ukuba intlawulo sele ikulindile. Umsebenzi obonisa Kulindwe imali usenokufakelwa isicelo, kodwa akukho mntu unokuqeshwa kuwo de umqeshi afake imali.\n'
        + '• De kuqeshwe umntu, umqeshi angayibuyisa imali, simahla. Ukusukela umzuzu oqeshwe ngawo, imali itshixelwe wena.\n'
        + '• Xa umqeshi eqinisekisa umsebenzi wakho ogqityiweyo — okanye ngokuzenzekelayo, xa kudlule {autoReleaseHours} uphawule ukuba ugqityiwe, ukuba akaze aphendule — intlawulo ingena kwisipaji sakho seVuka phantsi kuka-Mna. Uyikhuphela kwiakhawunti yakho yebhanki nanini na uthanda.\n'
        + 'Okwangoku oku kukwimowudi yovavanyo: isipaji siluziqheliso kwaye akukho mali yokwenene ihamba ngeVuka okwangoku. De ivulwe, vumelana nomqeshi ngendlela aya kukuhlawula ngayo ngokwenene, ngaphambi kokuba uqale.\n'
        + 'Ukuba umqeshi akakuhlawuli, mxele. Yiyo kanye loo nto ingxelo yokhuseleko ekhoyo.',
    },
    'funds-secured': {
      title: 'Kuthetha ukuthini Imali ikhuselekile',
      asks: ['Kuthetha ukuthini Imali ikhuselekile?', 'Kuthetha ukuthini Kulindwe imali?', 'Umqeshi angayibuyisa imali?', 'Ingaba imali ikhona ngokwenene?'],
      keywords: ['imali ikhuselekile', 'kulindwe imali', 'ihlawulwe', 'buyisa', 'itshixiwe', 'escrow'],
      body:
        'Wonke umsebenzi wexeshana ubonisa enye yeelebheli ezintathu, ukuze wazi ngentlawulo ngaphambi kokufaka isicelo:\n'
        + '• Imali ikhuselekile — umqeshi sele efake intlawulo yonke. Ikulindile.\n'
        + '• Kulindwe imali — hayi okwangoku. Usenokufaka isicelo, kodwa akukho mntu unokuqeshwa kuwo de umqeshi afake imali.\n'
        + '• Ihlawulwe — umsebenzi ugqityiwe kwaye intlawulo iye kumsebenzi.\n'
        + 'Umqeshi angayibuyisa? Kuphela ngaphambi kokuba kuqeshwe mntu. Ukusukela umzuzu oqeshwe ngawo, imali itshixelwe wena, kwaye ingena kwisipaji sakho xa umsebenzi uqinisekisiwe — okanye ngokuzenzekelayo, xa kudlule {autoReleaseHours} uphawule ukuba ugqityiwe, ukuba umqeshi akaze aphendule.\n'
        + 'Oku kukwimowudi yovavanyo okwangoku, ngoko akukho mali yokwenene ihamba ngeVuka okwangoku.',
    },
    'wallet-withdraw': {
      title: 'Isipaji sakho, nokukhupha imali',
      asks: ['Ndiyikhupha njani imali yam?', 'Siphi isipaji sam?', 'Kuthatha ixesha elingakanani ukukhupha imali?', 'Ndenza njani i-withdraw?'],
      keywords: ['isipaji', 'khupha', 'khuphela', 'withdraw', 'wallet', 'dlulisela'],
      body:
        'Isipaji sakho siphantsi kuka-Mna, emva koko Isipaji sam. Sibonisa imali onokuyikhupha ngoku, nale ikhuselweyo kwimisebenzi osayenzayo.\n'
        + '• Intlawulo ingena esipajini xa umqeshi eqinisekisa umsebenzi wakho.\n'
        + '• Ukukhupha kuthumela imali yonke eseleyo kwiakhawunti yebhanki oyigcine phantsi kuka-Hlawulwa. Qala ngokongeza iinkcukacha zakho zebhanki apho.\n'
        + 'Ngenxa yokuba iintlawulo zikwimowudi yovavanyo, akukho mali ithunyelwayo ngokwenene okwangoku, ngoko akukho xesha lokulinda endinokukuxelela ngalo. Xa iintlawulo zokwenene zivuliwe, ixesha elithathwa kukukhupha liya kuboniswa ngaphambi kokuba uqinisekise.\n'
        + 'Ndibuze uthi "kungakanani esipajini sam" ndiya kukufundela imali eseleyo.',
    },
    'test-mode': {
      title: 'Kuthetha ukuthini imowudi yovavanyo',
      asks: ['Yintoni imowudi yovavanyo?', 'Ingaba le yimali yokwenene?', 'Kutheni kusithiwa imowudi yovavanyo?', 'Yintoni i-test mode?'],
      keywords: ['imowudi yovavanyo', 'uvavanyo', 'uziqheliso', 'imali yokwenene', 'test mode'],
      body:
        'IVuka ibonisa yonke indlela intlawulo eya kusebenza ngayo — intlawulo ikhuselwa ngaphambi komsebenzi, ikhutshelwe esipajini somsebenzi xa uqinisekisiwe, ize ikhutshelwe ebhankini. Okwangoku oko kuluziqheliso: akukho mali yokwenene ihamba ngeVuka okwangoku.\n'
        + 'De iintlawulo zivulwe, vumelana nomnye umntu ngendlela intlawulo eya kwenziwa ngayo ngokwenene, ngaphambi kokuba umsebenzi uqale. Yonke enye into — irekhodi lakho, ulinganiso, amanqanaba neebheji — yeyokwenene kwaye iyabalwa.\n'
        + 'Xa iintlawulo zokwenene ziqala, i-app iya kutsho ngokucacileyo, kwaye imowudi yovavanyo iya kunyamalala kwezi zikrini.',
    },
    'employer-fund-job': {
      title: 'Ukukhusela intlawulo yomsebenzi',
      asks: ['Ndiwufakela njani imali umsebenzi?', 'Kutheni ndingakwazi ukuqesha mntu?', 'Ndiyibuyisa njani imali yam?', 'Ndingarhoxisa emva kokuqesha?', 'Ndimhlawula njani umsebenzi?', 'Kwenzeka ntoni kwimali ukuba ndiyacima umsebenzi?'],
      keywords: ['khusela intlawulo', 'andikwazi ukuqesha', 'buyisa imali', 'rhoxisa', 'hlawula umsebenzi', 'kulindwe imali', 'fund'],
      body:
        'Intlawulo yomsebenzi ikhuselwa ngaphambi kokuba kuqale mntu. Phawula Khusela intlawulo ngoku xa ufaka umsebenzi, okanye uvule umsebenzi kamva ucofe Khusela intlawulo.\n'
        + '• Akukho mntu unokuqeshwa de intlawulo ikhuselwe. Yiyo loo nto iqhosha elithi Qesha kulo msebenzi lisithi Khusela intlawulo ukuze uqeshe.\n'
        + '• Ngaphambi kokuba uqeshe, ungayibuyisa imali ngaphandle kwentlawulo. Ukurhoxisa umsebenzi ongaqeshwanga mntu nako kuyibuyisa.\n'
        + '• Ukusukela umzuzu oqesha ngawo umntu, imali itshixelwe yena. Ingena esipajini somsebenzi xa uqinisekisa umsebenzi — okanye ngokuzenzekelayo, xa kudlule {autoReleaseHours} ephawule ukuba ugqityiwe, ukuba akuphenduli.\n'
        + 'Umsebenzi oqeshelwe umntu awunakurhoxiswa kwi-app. Thumela umyalezo kumsebenzi nisombulule, uze uxele phantsi kuka-Mna ukuba kukho into engalunganga.\n'
        + 'Iintlawulo zikwimowudi yovavanyo okwangoku, ngoko akukho mali yokwenene ihamba ngeVuka okwangoku.',
    },
    'get-more-work': {
      title: 'Ukufumana imisebenzi emininzi',
      asks: ['Ndingayifumana njani imisebenzi emininzi?', 'Kutheni ndingafumani misebenzi?', 'Ndingaqeshwa njani ngokukhawuleza?'],
      keywords: ['imisebenzi emininzi', 'andifumani', 'qeshwa', 'amathuba', 'akukho mntu undiqeshayo', 'andiphangeli'],
      body:
        'Abaqeshi bakhetha ngerekhodi abanokulibona, ngoko izinto ezikunyusela phezulu kuluhlu zizinto ozilawulayo:\n'
        + '• Gcwalisa iprofayile yakho nezakhono onazo ngokwenene, ukuze uvele kumsebenzi ofanelekileyo.\n'
        + '• Qinisekisa isazisi sakho phantsi kuka-Mna. Xa enabantu ababini, umqeshi uthatha oqinisekisiweyo.\n'
        + '• Vula Imisebenzi emitsha ekufutshane, phantsi kuka-Mna emva koko Izaziso, ukuze uve ngomsebenzi ngoko nangoko xa ufakwa ukwazi ukufaka isicelo kwangoko.\n'
        + '• Khetha imisebenzi ebonisa Imali ikhuselekile, nekufutshane nawe — ufika ngexesha, kwaye intlawulo ikulindile.\n'
        + '• Yenza umsebenzi ngamnye kakuhle uze uphawule ukuba ugqityiwe. Wonke umsebenzi oqinisekisiweyo nolinganiso oluhle lunyusa i-Vuka Score yakho nenqanaba lakho.',
    },
    'banking-details': {
      title: 'Iinkcukacha zakho zebhanki',
      asks: ['Kutheni iVuka ifuna iinkcukacha zam zebhanki?', 'Ingaba iinkcukacha zam zebhanki zikhuselekile?', 'Ndiyongeza njani iakhawunti yam yebhanki?'],
      keywords: ['ibhanki', 'inombolo yeakhawunti', 'ikhowudi yesebe', 'capitec', 'fnb', 'absa', 'bank'],
      body:
        'Ungagcina iinkcukacha zakho zebhanki phantsi kuka-Mna, ukuze uzilungiselele ukuzinika umqeshi ngaphandle kokukhangela ikhadi.\n'
        + 'Zifihlwe ngekhowudi kwiseva kwaye azize zithunyelwe kwakhona kwi-app. Nawe ubona kuphela isikhumbuzo esifihliweyo — ibhanki yakho, uhlobo lweakhawunti, namanani amane okugqibela. Akukho nto ibuthathaka egcinwe kwifowuni yakho.\n'
        + 'Kulapho isipaji sakho sithumela khona intlawulo yakho xa uyikhupha. Iintlawulo zikwimowudi yovavanyo okwangoku, ngoko akukho mali yokwenene ithunyelwa kuzo okwangoku.\n'
        + 'Akukho mntu waseVuka oya kuze akufowunele okanye akuthumelele umyalezo ecela inombolo yakho yeakhawunti, i-PIN yakho okanye i-OTP. Nabani na owenza oko akaveli kwiVuka.',
    },
    'fair-pay': {
      title: 'Uhlolo lwentlawulo elungileyo nomvuzo osezantsi',
      asks: ['Yintoni uhlolo lwentlawulo elungileyo?', 'Yintoni umvuzo osezantsi?', 'Ingaba lo msebenzi undihlawula ngokwaneleyo?', 'Yintoni i-minimum wage?'],
      keywords: ['umvuzo osezantsi', 'intlawulo elungileyo', 'ngeyure', 'ngokomthetho', 'iphantsi kakhulu', 'minimum wage'],
      body:
        'Umvuzo osezantsi welizwe eMzantsi Afrika yi-{minWage} ngeyure. Umiswa ngurhulumente kwaye upapashwa kwakhona kwiGazethi minyaka le, uqala ngomhla woku-1 kuMatshi.\n'
        + 'Wonke umsebenzi wexeshana kwiVuka ubonisa Uhlolo lwentlawulo elungileyo oluthelekisa isixa sawo nelo nani, ukuze ubone ngokukhawuleza ukuba oko unikwa kona kusemthethweni kwaye kulungile ngaphambi kokuba uchithe imali yeteksi usiya apho.\n'
        + 'Umsebenzi ohlawula ngaphantsi komvuzo osezantsi awukho semthethweni. Uvumelekile ukuthi hayi, kwaye uvumelekile ukuwuxela.\n'
        + 'Kwakhona linganisa uhambo. Isixa esibonakala silungile singaba sibi ngaphezu kokuhlala ekhaya xa sele uhlawule iiteksi ezimbini.',
    },
    'total-earned': {
      title: 'Oko kubalwa linani lemali iyonke oyifumeneyo',
      asks: ['Imali iyonke efunyenweyo iquka ntoni?', 'Isixa sam siyonke sibalwa njani?', 'I-total earned ibalwa njani?'],
      keywords: ['iyonke', 'efunyenweyo', 'ibalwa', 'total', 'iquka'],
      body:
        'Irekhodi lam lidibanisa yonke into evela kuwo wonke umsebenzi ogqityiweyo, liyibonise njengemali yakho iyonke oyifumeneyo.\n'
        + 'Libala umsebenzi oqinisekisiweyo, kuquka imisebenzi ebalelwe kuwe ngokuzenzekelayo xa umqeshi engazange awuqinisekise. Alibali imisebenzi ofake isicelo sayo okanye osaxakekile ngayo.\n'
        + 'Ndibuze uthi "ndifumene malini" ndiya kukufundela eyakho imali.',
    },
    'mark-job-done': {
      title: 'Ukuphawula umsebenzi ugqityiwe',
      asks: ['Ndiwuphawula njani umsebenzi njengogqityiweyo?', 'Ndiwugqibile umsebenzi — ndenze ntoni ngoku?', 'Ndenza njani i-mark done?'],
      keywords: ['gqityiwe', 'ndigqibile', 'phawula', 'linganisa umqeshi', 'done'],
      body:
        'Vula umsebenzi kwisikrini sakho esithi Ikhaya uze uwuphawule ugqityiwe. Uya kucelwa ukuba ulinganise umqeshi ngeenkwenkwezi ezintlanu ngaphambi kokuba ukwazi — le yinxalenye egcina abaqeshi bethembekile, kwaye yiyo loo nto abanye abasebenzi bebona ukuba ngubani olungileyo ukumsebenzela.\n'
        + 'Ukuba kukho into engakhuselekanga ngomsebenzi, kukho ibhokisi yokuphakamisa isilumkiso sokhuseleko ngaxeshanye. Ezo zifundwa ngumntu.\n'
        + 'Emva koko umqeshi uyacelwa ukuba aqinisekise. Xa eqinisekisile, umsebenzi ungena kwirekhodi lakho nolinganiso lwakhe nophononongo, kwaye intlawulo ebikhuselwe wona ingena esipajini sakho, kwimowudi yovavanyo okwangoku.',
    },
    'confirm-work': {
      title: 'Ukulinda umqeshi aqinisekise',
      asks: ['Umqeshi akakawuqinisekisi umsebenzi wam', 'Ukuqinisekisa kuthatha ixesha elingakanani?', 'Kuthekani ukuba akaze aqinisekise?'],
      keywords: ['qinisekisa', 'ukuqinisekisa', 'ndilindile', 'akakaqinisekisi', 'confirm'],
      body:
        'Emva kokuba uphawule umsebenzi ugqityiwe, umqeshi unazo {autoReleaseHours} zokuwuqinisekisa.\n'
        + 'Ukuba akaze akwenze, umsebenzi ubalelwa kuwe noko xa elo xesha lidlulile. Ufumana ukubhalwa kwirekhodi, imali, inkqubela yenqanaba — kwaye intlawulo ekhuselweyo ingena esipajini sakho. Ugcinwa ungenalo ulinganiso, ngoko ukuthula kwakhe akunakuwuhlisa umndilili wakho — okanye uwunyuse.\n'
        + 'Oku kukhona kuba umqeshi othi nje ayeke ukuphendula wayekhe ayirhoxise inkqubela yomsebenzi ngonaphakade, ngomsebenzi owenziwe ngokwenene. Ngoku akanakukwenza oko.',
    },
    'post-a-job': {
      title: 'Ukufaka umsebenzi',
      asks: ['Ndiwufaka njani umsebenzi?', 'Ndiqesha njani umntu?', 'Ndiwubhengeza njani umsebenzi?', 'Ndenza njani i-post ye-job?'],
      keywords: ['faka umsebenzi', 'bhengeza', 'qesha', 'ndifuna umntu', 'post'],
      body:
        'Cofa Faka. Uchaza umsebenzi, apho ukhoyo, iiyure ezingaphi, nokuba uhlawula malini ngeyure.\n'
        + '• Uhlolo lwentlawulo elungileyo lukubonisa ukuba isixa sakho sithelekiswa njani nomvuzo osezantsi welizwe oyi-{minWage} ngeyure njengoko ubhala. Ukuhlawula ngaphantsi kwawo akukho semthethweni.\n'
        + '• Khusela intlawulo xa ufaka umsebenzi, okanye kamva. Ungayibuyisa simahla de uqeshe; awukwazi ukuqesha mntu de ikhuselwe. Abasebenzi babona Imali ikhuselekile kumsebenzi wakho, yiyo loo nto abantu abalungileyo befaka izicelo.\n'
        + '• Umsebenzi wakho uvela kwangoko kubasebenzi abakufutshane nawe.\n'
        + '• Ubona bonke abafaka izicelo, kunye nerekhodi labo — ulinganiso, imisebenzi egqityiweyo, inqanaba neebheji.\n'
        + 'Ukufaka umsebenzi simahla, kwaye iVuka ayithathi khomishini.',
    },
    'choose-worker': {
      title: 'Ukukhetha oza kumqesha',
      asks: ['Ndimkhetha njani umsebenzi?', 'Ndazi njani ukuba ngubani othembekileyo?', 'Athetha ukuthini amanqanaba xa ndiqesha?'],
      keywords: ['khetha', 'abafaki-zicelo', 'othembekileyo', 'thembeka', 'izakhono', 'oza kumqesha'],
      body:
        'Wonke umfaki-sicelo uphethe irekhodi elakhiwe ngomsebenzi awenzileyo ngokwenene kwiVuka — umndilili wolinganiso lwakhe, imisebenzi emingaphi ayigqibileyo, inqanaba lakhe, nokuba isazisi sakhe siqinisekisiwe na.\n'
        + 'Inqanaba yeyona nto ifundeka ngokukhawuleza. Othembekileyo kuthetha ubuncinane imisebenzi emithathu egqityiweyo ngomndilili olungileyo ngaphandle kwezilumkiso zokhuseleko. Ingcali nOphambili bathetha okungakumbi kakhulu.\n'
        + 'Ungakhangela nangqo ku-Izakhono uze umeme umntu kumsebenzi endaweni yokulinda izicelo.\n'
        + 'Kuhle ukwazi: abasebenzi bayakulinganisa nawe, kwaye olo linganiso luboniswa kwimisebenzi oyifakileyo. Ukuqinisekisa umsebenzi ngokukhawuleza nokuhlawula oko ukubhengezileyo kuko okugcina abantu abalungileyo befaka izicelo kuwe.',
    },
    'employer-confirm': {
      title: 'Ukuqinisekisa umsebenzi ogqityiweyo',
      asks: ['Ndiqinisekisa njani ukuba umsebenzi ugqityiwe?', 'Kutheni kufuneka ndiqinisekise?', 'Kwenzeka ntoni ukuba andiqinisekisi?'],
      keywords: ['qinisekisa', 'vuma', 'linganisa umsebenzi', 'gqityiwe', 'confirm'],
      body:
        'Xa umsebenzi ephawula umsebenzi ugqityiwe ufumana isaziso. Sivule, uqinisekise umsebenzi, uze umlinganise ngeenkwenkwezi ezintlanu ngophononongo olufutshane.\n'
        + 'Nceda ukwenze ngokukhawuleza. Kuwe kukucofa kanye; kuye kukubhalwa kwirekhodi lakhe okuvula inqanaba elilandelayo nohlobo olulandelayo lomsebenzi.\n'
        + 'Ukuba kudlule {autoReleaseHours} ungaqinisekisanga, umsebenzi ubalelwa umsebenzi ngokuzenzekelayo, ngaphandle kolinganiso. Uphononongo lwakho yinxalenye elahlekayo, kwaye olo phononongo yeyona nto ixabisekileyo onokuyinika umntu owakha imbali yakhe yokuqala yomsebenzi.\n'
        + 'Ukuqinisekisa kukwakhulula intlawulo oyikhuselileyo iye esipajini seVuka somsebenzi. Ukusukela umzuzu omqeshe ngawo ibitshixelwe yena. Iintlawulo zikwimowudi yovavanyo okwangoku — akukho mali yokwenene ihambayo okwangoku.',
    },
    'employer-cost': {
      title: 'Oko kubiza umqeshi',
      asks: ['Kubiza malini ukufaka umsebenzi?', 'Ingaba iVuka iyathatha ikhomishini?', 'Ndihlawula malini njengomqeshi?'],
      keywords: ['ikhomishini', 'ixabiso', 'umrhumo', 'simahla', 'umqeshi'],
      body:
        'Ukufaka umsebenzi simahla kwaye ukuqesha simahla. Oko ukuhlawulayo yintlawulo ngokwayo, ekhuselwa ngaphambi kokuba uqeshe, kwaye ungayibuyisa simahla de uqeshe.\n'
        + 'Iintlawulo zikwimowudi yovavanyo okwangoku, ngoko akukho mali yokwenene ihamba ngeVuka okwangoku kwaye akukho nto ihlawuliswayo. Nawuphi na umrhumo, xa iintlawulo sele zivuliwe, uya kuboniswa ngaphambi kokuba uhlawule.',
    },
    'is-it-safe': {
      title: 'Ukuhlala ukhuselekile',
      asks: ['Ingaba iVuka ikhuselekile?', 'Ndihlala njani ndikhuselekile?', 'Kukhuselekile ukuya kwindlu yomntu endingamaziyo?', 'Andiziva ndikhuselekile'],
      keywords: ['khuseleko', 'khuselekile', 'ingozi', 'umntu ongamaziyo', 'lumka', 'safe'],
      body:
        'IVuka ikunika ulwazi lokugweba ngalo, kodwa nguwe ohambela kwidilesi, ngoko amanyathelo okulumka aqhelekileyo asasebenza:\n'
        + '• Jonga ukuba isazisi somqeshi siqinisekisiwe na, uze ujonge ulinganiso lwakhe oluvela kwabanye abasebenzi.\n'
        + '• Gcina incoko kwi-app. Yirekhodi, kwaye ingafundwa ngumntu ukuba kukho into engahambanga kakuhle.\n'
        + '• Xelela umntu apho uya khona nokuba ulindele ukubuya nini.\n'
        + '• Vumelanani ngentlawulo ngaphambi kokuba uhambe.\n'
        + '• Ungaze uhlawule mntu ukuze ufumane umsebenzi, kwaye ungaze uthumele isazisi sakho okanye iinkcukacha zebhanki kumntu ozicelayo encokweni.\n'
        + 'Ukuba kukho into engekho kakuhle, hamba. Ungamxela umntu, umvale, uze uphakamise isilumkiso sokhuseleko kumsebenzi.',
    },
    'scam-warning': {
      title: 'Xa umntu ekucela imali okanye amaxwebhu',
      asks: [
        'Kukho umntu ondicela imali ukuze ndifumane umsebenzi',
        'Umqeshi ucele inombolo yesazisi sam encokweni',
        'Ingaba obu bubuqhetseba?',
        'Ingaba le yi-scam?',
      ],
      keywords: [
        'ubuqhetseba', 'iqhetseba', 'scam', 'ucela imali', 'ucele isazisi', 'thumela isazisi',
        'imali yokubhalisa', 'idiphozithi', 'kwangaphambili', 'pin', 'otp', 'ekrokrisayo', 'fake',
      ],
      body:
        'Yima, uze umxele. Ezi zezinto ekufanele uzazi ngentloko, kuba nganye kuzo ngumntu ozama ukuthatha kumntu okhangela umsebenzi:\n'
        + '• Ukukucela ukuba uhlawule nantoni na — imali yokubhalisa, idiphozithi, imali "yoqeqesho", imali yokuhamba kwangaphambili. IVuka isimahla kwaye akukho mqeshi wokwenene okuhlawulisayo ukuze usebenze.\n'
        + '• Ukucela inombolo yesazisi sakho, ifoto yesazisi sakho, okanye iinkcukacha zakho zebhanki encokweni. Umqeshi wokwenene akafuni nanye kwezo zinto ukuze akunike usuku lomsebenzi. IVuka icela isazisi sakho ngaphakathi kwi-app kuphela, ukuze uqinisekiswe, kwaye ayizange icele ngomyalezo.\n'
        + '• Ukucela i-OTP okanye i-PIN. Akukho mntu usemthethweni oya kuze azicele ezi. Hayi iVuka, hayi ibhanki yakho, hayi umqeshi.\n'
        + '• Ukukunyanzela ukuba uyise incoko kwenye inombolo uze uhlawule khona.\n'
        + 'Gcina incoko kwi-app ukuze kubekho irekhodi, mvale, uze umxele ukusuka kwi-Iziko lokhuseleko. Umntu ufunda yonke ingxelo.\n'
        + 'Awenzanga nto iphosakeleyo ngokucelwa. Ukuxela kukhusela umntu olandelayo.',
    },
    'report-someone': {
      title: 'Ukuxela umntu',
      asks: ['Ndimxela njani umntu?', 'Kukho umntu ongandihlawulanga', 'Ndibuxela njani ubuqhetseba?', 'Umqeshi ebendingcikiva'],
      keywords: ['xela', 'ingxelo', 'isikhalazo', 'akandihlawulanga', 'ukuxhatshazwa', 'krwada', 'ndibiwe', 'ndihlaselwe', 'ndisongelwe', 'iziko lokhuseleko'],
      body:
        'Sebenzisa i-Iziko lokhuseleko phantsi kuka-Mna, okanye uphakamise isilumkiso xa uphawula umsebenzi ugqityiwe.\n'
        + 'Sixelele okwenzekileyo ngamazwi akho. Iingxelo ziya kuluhlu olufundwa ngumntu — aziphathwa ngumatshini.\n'
        + 'Xela nabani na ongakuhlawuli oko bekuvunyelwene ngako, okucela imali ukuze ufumane umsebenzi, ocela isazisi sakho okanye iinkcukacha zebhanki encokweni, okanye oziphatha ngendlela ekwenza ungakhuseleki.\n'
        + 'Ukuxela akulibeki emngciphekweni irekhodi lakho.',
    },
    'block-someone': {
      title: 'Ukuvala umntu',
      asks: ['Ndimvala njani umntu?', 'Ndingamnqanda umntu ukuba andithumelele imiyalezo?', 'Ndenza njani i-block?'],
      keywords: ['vala', 'block', 'nqanda imiyalezo', 'ungamhoyi'],
      body:
        'Vula incoko naloo mntu uze umvale. Akasakwazi ukukuthumelela imiyalezo, kwaye awuyi kubona miyalezo evela kuye.\n'
        + 'Ukuvala kwahlukile ekuxeleni. Ukuvala kumisa unxibelelwano; ukuxela kusixelela ukuba kukho into ekufuneka ijongwe ngumntu. Ukuba umntu wenze into engalunganga, yenza zombini.',
    },
    'id-verification': {
      title: 'Ukuqinisekiswa kwesazisi',
      asks: ['Ndisiqinisekisa njani isazisi sam?', 'Luthetha ukuthini uphawu lokuqinisekiswa?', 'Kutheni kufuneka ndiqinisekise ubuni bam?'],
      keywords: ['isazisi', 'ubuni', 'qinisekisa', 'uphawu', 'sa id', 'id'],
      body:
        'Ungafaka inombolo yesazisi sakho saseMzantsi Afrika ukuze uqinisekiswe. Xa umntu esihlolile, uphawu lokuqinisekiswa luvela kwiprofayile yakho kwaye ufumana ibheji ethi Isazisi Siqinisekisiwe.\n'
        + 'Akunyanzelekanga, kwaye ungayisebenzisa iVuka ngaphandle kwako. Kufanelekile ukukwenza: umqeshi okhetha phakathi kwabafaki-zicelo ababini uya kuthatha oqinisekisiweyo, kwaye umsebenzi ogqiba ukuba angahamba na aye kwidilesi uya kuziva ngendlela eyahluke kakhulu ngomqeshi oqinisekisiweyo.\n'
        + 'Inombolo yesazisi sakho ifihlwe ngekhowudi kwaye ayiboniswa kwabanye abasebenzisi. Abakubonayo luphawu lokuqinisekiswa, hayi inombolo.',
    },
    'what-data': {
      title: 'Oko iVuka ikwaziyo ngawe',
      asks: ['Ngawaphi amanqaku enindigcinela wona?', 'Ngubani onokubona iinkcukacha zam?', 'Ingaba idatha yam iyimfihlo?'],
      keywords: ['idatha', 'ubumfihlo', 'popia', 'iinkcukacha zobuqu', 'ngubani obonayo', 'privacy'],
      body:
        'IVuka igcina oko ikufunayo ukuze isebenze: igama lakho nenombolo yefowuni, iprofayile yakho, imbali yomsebenzi wakho nolinganiso, imiyalezo yakho, kwaye — ukuba ukhethe ukuzongeza — inombolo yesazisi sakho neenkcukacha zebhanki, zombini zifihlwe ngekhowudi.\n'
        + 'Abanye abasebenzisi babona igama lakho, indawo yakho, irekhodi lakho neebheji zakho. Abayiboni inombolo yakho yefowuni, inombolo yesazisi sakho okanye iinkcukacha zakho zebhanki.\n'
        + 'Iiseva zise-{hosting}.\n'
        + 'Unamalungelo phantsi kwe-POPIA okubona oko kugcinwe ngawe, ukukulungisa, nokuba kucinywe. Isaziso sabucala esiphantsi kuka-Mna sichaza indlela yokucela, nokuba ucela kubani.',
    },
    'delete-account': {
      title: 'Ukucima iakhawunti yakho',
      asks: ['Ndiyicima njani iakhawunti yam?', 'Ndingazisusa iinkcukacha zam?', 'Ndifuna ukuyivala iakhawunti yam'],
      keywords: ['cima', 'susa', 'vala iakhawunti', 'yeka', 'hamba'],
      body:
        'Ungacela ukuba iakhawunti yakho neenkcukacha zakho zobuqu zicinywe. Isaziso sabucala esiphantsi kuka-Mna sinoqhagamshelo lwesicelo eso, elilungelo onalo phantsi kwe-POPIA hayi isibabalo.\n'
        + 'Kufanelekile ukucinga kuqala: ukucima kususa irekhodi lakho lomsebenzi, eliludumo olwakhileyo nento evula imisebenzi esesikweni. Alinakwakhiwa kwakhona ukusuka kwanto. Ukuba ufuna nje ukuyeka okwexeshana, ungayeka nje — akukho nto iphelelwa lixesha.',
    },
    'chats': {
      title: 'Ukuthumela imiyalezo',
      asks: ['Ndimthumelela njani umntu umyalezo?', 'Ziphi iincoko zam?', 'Ndingathumela umyalezo welizwi?', 'Ndingathumela i-voice note?'],
      keywords: ['incoko', 'iincoko', 'umyalezo', 'umyalezo welizwi', 'ifoto', 'chat', 'voice note'],
      body:
        'Iincoko zikwi-app, phakathi kwakho nabantu osebenza nabo.\n'
        + '• Ungathumela umbhalo, imiyalezo yelizwi neefoto.\n'
        + '• Umyalezo welizwi uhlala ulula kunokubhala — ngakumbi ngolwimi lwakho, okanye xa uchaza apho ukhoyo.\n'
        + '• Imiyalezo ebhalwe kungekho mqondiso ithunyelwa xa umqondiso ubuya.\n'
        + 'Gcina iincoko zomsebenzi kwi-app endaweni yokuya kwenye inombolo. Yirekhodi, kwaye ukuba kukho into engahambanga kakuhle yiyo umntu ophonononga ingxelo anokuyifunda ngokwenene.',
    },
    'notifications': {
      title: 'Izaziso',
      asks: ['Ndizifumana njani izaziso zemisebenzi?', 'Ndizivula njani izaziso?', 'Ndizimisa njani izaziso?', 'Kutheni ndingafumani zaziso?'],
      keywords: ['izaziso', 'isaziso', 'intsimbi', 'iiyure zokuthula', 'notifications', 'alerts'],
      body:
        'Cofa intsimbi phezulu kwisikrini ukuze ubone lonke uhlaziyo ngemisebenzi yakho, intlawulo yakho neakhawunti yakho.\n'
        + 'Ukukhetha oko kufika kwifowuni yakho, vula Mna, emva koko Izaziso. Zivule kule fowuni, uze ukhethe iintlobo ozifunayo: Imiyalezo, Imisebenzi emitsha ekufutshane, Iindaba zomsebenzi, Iintlawulo nezaziso zeakhawunti.\n'
        + 'Ungawafihla amagama nemiyalezo kwisikrini esitshixiweyo, uze umise Iiyure zokuthula ukuze kungabikho nto ikhalayo ebusuku. Nantoni na oyicimileyo isalindile phantsi kwentsimbi.\n'
        + 'Ukuba wayala imvume ngaphambili, phinda uvumele izaziso zeVuka kuseto lwefowuni okanye lwesikhangeli sakho. I-app ayinakucela okwesibini.',
    },
  },
  live: {
    'my-score': {
      title: 'I-Vuka Score yakho',
      asks: ['Ndinamanqaku amangaphi?', 'Ndenza njani?', 'I-Vuka Score yam ingakanani ngoku?', 'Yintoni i-score yam?'],
      keywords: ['amanqaku am', 'score yam', 'ndenza njani'],
    },
    'my-tier': {
      title: 'Inqanaba lakho',
      asks: ['Ndikweliphi inqanaba?', 'Ndiphi kwileli?', 'Ndikude kangakanani nenqanaba elilandelayo?', 'Yintoni i-tier yam?'],
      keywords: ['inqanaba lam', 'tier yam', 'ileli yam'],
    },
    'my-jobs': {
      title: 'Imisebenzi oyigqibileyo',
      asks: ['Ndigqibe imisebenzi emingaphi?', 'Ndenze imisebenzi emingaphi?', 'Mingaphi ii-jobs endizenzileyo?'],
      keywords: ['imisebenzi yam', 'emingaphi', 'egqityiweyo'],
    },
    'my-earnings': {
      title: 'Oko ukufumeneyo',
      asks: ['Ndifumene malini?', 'Iyonke imali endiyifumeneyo ingakanani?', 'Ndenze malini kwi-Vuka?'],
      keywords: ['imali yam', 'ndifumene', 'malini'],
    },
    'my-badges': {
      title: 'Iibheji zakho',
      asks: ['Ndineebheji ezingaphi?', 'Zeziphi iibheji endizifumeneyo?', 'Iibheji zam zithini?'],
      keywords: ['iibheji zam', 'ibheji', 'ezingaphi'],
    },
    'my-wallet': {
      title: 'Isipaji sakho',
      asks: ['Kungakanani esipajini sam?', 'Imali eseleyo yam ingakanani?', 'Ndingakhupha malini?', 'Yintoni i-balance yam?'],
      keywords: ['isipaji sam', 'esipajini', 'balance', 'ndingakhupha'],
    },
    'my-applications': {
      title: 'Imisebenzi ofake izicelo zayo',
      asks: ['Ndifake izicelo ezingaphi?', 'Ndifake izicelo zantoni?', 'Mingaphi imisebenzi endiyifakele isicelo?'],
      keywords: ['izicelo zam', 'ndifake', 'ezingaphi'],
    },
    'my-verification': {
      title: 'Ingaba isazisi sakho siqinisekisiwe',
      asks: ['Ingaba ndiqinisekisiwe?', 'Isazisi sam siqinisekisiwe?', 'Ndi-verified na?'],
      keywords: ['ndiqinisekisiwe', 'isazisi sam'],
    },
    'jobs-near-me': {
      title: 'Umsebenzi okufutshane nawe',
      asks: ['Ngowuphi umsebenzi okufutshane nam?', 'Ingaba ikhona imisebenzi ngoku?', 'Mingaphi imisebenzi ekhoyo?'],
      keywords: ['kufutshane nam', 'ngoku', 'ekhoyo'],
    },
    'my-messages': {
      title: 'Imiyalezo yakho engafundwanga',
      asks: ['Ingaba ndinayo imiyalezo?', 'Ikhona imiyalezo engafundwanga?', 'Ukhona undibhalele?'],
      keywords: ['imiyalezo yam', 'engafundwanga', 'emitsha'],
    },
  },
  text: {
    noRecord: 'Awukagqibi msebenzi okwangoku, ngoko akukho nto kwirekhodi lakho endinokuyifunda. Umsebenzi wakho wokuqala ogqityiweyo uyaliqalisa — emva koko lizaliswa ngokwalo.',

    'fill.tierFirst': 'inqanaba wonke umntu aqala kulo',
    'fill.tierReqs': 'imisebenzi egqityiweyo e-{jobs}, iinkwenkwezi ezi-{rating} nangaphezulu, akukho zilumkiso zokhuseleko',
    'fill.tierLine': '• {icon} {name} — {entry}. Livula: {unlocks}',
    'fill.categoryLine': '• {list}.',
    'fill.badgeLine': '• {icon} {label} — {desc}.',
    'fill.hours_one': 'iyure e-{count}',
    'fill.hours_other': 'iiyure ezi-{count}',
    'fill.days_one': 'usuku olu-{count}',
    'fill.days_other': 'iintsuku ezi-{count}',
    'fill.listSep': ', ',

    'score.value': 'I-Vuka Score yakho ngu-{rep} kwali-100.',
    'score.built': 'Yakhiwe zizinto ezintathu — {jobs}; umndilili weenkwenkwezi ezi-{avg}; kunye noku: {safety}.',
    'score.jobs_one': 'umsebenzi o-{count} ogqityiweyo',
    'score.jobs_other': 'imisebenzi e-{count} egqityiweyo',
    'score.clean': 'irekhodi lokhuseleko elicocekileyo',
    'score.flags_one': 'isilumkiso sokhuseleko esi-{count}',
    'score.flags_other': 'izilumkiso zokhuseleko ezi-{count}',
    'score.flagHolding': 'Isilumkiso sesona sikubambe umva, kwaye sivimba nenqanaba lakho elilandelayo.',
    'score.strong': 'Eli lirekhodi elomeleleyo. Abaqeshi abakhangela abantu kwi-Izakhono baya kukubona phezulu.',

    'tier.youAre': 'Ukwinqanaba {icon} {name} — {tagline}.',
    'tier.unlocks': 'Eli nqanaba livula: {unlocks}',
    'tier.top': 'Eli linqanaba eliphezulu kwi-The Ladder. Akukho nto ingaphezulu kwalo.',
    'tier.next': 'Inqanaba elilandelayo ngu-{icon} {name}.',
    'tier.needJobs_one': 'umsebenzi o-{count} ongaphezulu ogqityiweyo',
    'tier.needJobs_other': 'imisebenzi e-{count} engaphezulu egqityiweyo',
    'tier.needRating': 'umndilili weenkwenkwezi ezi-{rating} nangaphezulu — owakho ngu-{avg}',
    'tier.needClean': 'irekhodi elicocekileyo — isilumkiso sokhuseleko siyakuvimba',
    'tier.allMet': 'Uyayanelisa yonke imiqathango yalo.',
    'tier.stillNeed': 'Usafuna oku: {list}.',
    'tier.and': ', kwaye ',

    'jobs.done_one': 'Ugqibe umsebenzi o-{count} kwi-Vuka, kwezi ntlobo: {kinds}, ngomndilili weenkwenkwezi ezi-{avg}.',
    'jobs.done_other': 'Ugqibe imisebenzi e-{count} kwi-Vuka, kwezi ntlobo: {kinds}, ngomndilili weenkwenkwezi ezi-{avg}.',
    'jobs.kinds_one': 'uhlobo olu-{count} lomsebenzi',
    'jobs.kinds_other': 'iintlobo ezi-{count} zomsebenzi',

    'earn.total_one': 'Ufumene {amount} kumsebenzi o-{count} ogqityiweyo, kubalwa ngentlawulo ebibhalwe kumsebenzi ngamnye. Imali esesipajini sakho ngoku linani elahlukileyo — ndibuze uthi "kungakanani esipajini sam".',
    'earn.total_other': 'Ufumene {amount} kwimisebenzi e-{count} egqityiweyo, kubalwa ngentlawulo ebibhalwe kumsebenzi ngamnye. Imali esesipajini sakho ngoku linani elahlukileyo — ndibuze uthi "kungakanani esipajini sam".',

    'badges.none': 'Awukafumani bheji okwangoku. Eyokuqala, Umsebenzi Wokuqala, ifika ngoko nangoko xa umsebenzi wakho wokuqala uqinisekisiwe.',
    'badges.earned': 'Ufumene iibheji ezi-{earned} kwezi-{total}: {list}.',
    'badges.item': '{icon} {label}',
    'badges.missing': 'Ezisezayo: {list}.',
    'badges.missingItem': '{label} — {desc}',
    'badges.missingSep': '; ',

    'wallet.loading': 'Isipaji sakho sisalayisha. Ndibuze kwakhona kungekudala, okanye uvule Mna, emva koko Isipaji sam.',
    'wallet.error': 'Andikwazanga ukufunda isipaji sakho ngoku. Vula Mna, emva koko Isipaji sam, ukuze usibone.',
    'wallet.balance': 'Une-{amount} esipajini sakho, ilungele ukukhutshelwa kwibhanki yakho.',
    'wallet.empty': 'Isipaji sakho asinanto ngoku.',
    'wallet.pending': 'Enye i-{amount} ikhuselwe kwimisebenzi oyenzayo. Ifika xa ngamnye uqinisekisiwe.',
    'wallet.howLands': 'Intlawulo ifika apha xa umqeshi eqinisekisa umsebenzi owenzileyo.',
    'wallet.test': 'Iintlawulo zikwimowudi yovavanyo okwangoku, ngoko akukho mali yokwenene ihambileyo.',

    'apps.none': 'Awukafaki sicelo nasinye okwangoku. Fumana umsebenzi ikubonisa imisebenzi ekufutshane nawe, kwaye ukufaka isicelo kukucofa kanye.',
    'apps.some_one': 'Ufake isicelo somsebenzi o-{count}. Abaqeshi babona bonke abafake izicelo baze bakhethe kubo, ngoko ukungaphendulwa ngomnye kuqhelekile — qhubeka ufaka izicelo.',
    'apps.some_other': 'Ufake izicelo zemisebenzi e-{count}. Abaqeshi babona bonke abafake izicelo baze bakhethe kubo, ngoko ukungaphendulwa ngomnye kuqhelekile — qhubeka ufaka izicelo.',

    'verified.yes': 'Ewe — isazisi sakho siqinisekisiwe, kwaye uphawu lokuqinisekiswa luyabonakala kwiprofayile yakho. Yenye yezinto zokuqala ezijongwa lelinye icala.',
    'verified.no': 'Hayi okwangoku. Ungafaka inombolo yesazisi sakho saseMzantsi Afrika phantsi kuka-Mna ukuze uqinisekiswe. Akunyanzelekanga, kodwa umqeshi okhetha phakathi kwabantu ababini uya kuthatha oqinisekisiweyo.',

    'near.none': 'Akukho nto kuluhlu lwakho lwemisebenzi ngoku. Imisebenzi emitsha ifakwa imini yonke — vula Imisebenzi emitsha ekufutshane phantsi kuka-Mna, emva koko Izaziso, ifowuni yakho iya kukuxelela endaweni yokuba uhlale ujonga.',
    'near.some_one': 'Kukho umsebenzi o-{count} kuluhlu lwakho ngoku, kuqala okona kukufutshane. Vula Fumana umsebenzi ukuze uwubone.',
    'near.some_other': 'Kukho imisebenzi e-{count} kuluhlu lwakho ngoku, kuqala okona kukufutshane. Vula Fumana umsebenzi ukuze uyibone.',

    'messages.none': 'Awunamiyalezo ingafundwanga. Nantoni na entsha evela kumqeshi iya kuvela ku-Iincoko, kwaye ifowuni yakho ingakuxelela ukuba i-Imiyalezo ivuliwe phantsi kuka-Mna, emva koko Izaziso.',
    'messages.some_one': 'Unomyalezo o-{count} ongafundwanga olindileyo ku-Iincoko.',
    'messages.some_other': 'Unemiyalezo e-{count} engafundwanga elindileyo ku-Iincoko.',
  },
};
