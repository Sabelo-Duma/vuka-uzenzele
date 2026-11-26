/**
 * Msizi in Afrikaans: every written answer, the live answers' headings and
 * phrasings, and the sentences live answers are built from.
 *
 * Keyed by the English ids in data/msizi.ts; anything missing falls back to
 * English. Not written by a first-language speaker — a first-language
 * speaker's correction wins. Keep every {placeholder} exactly.
 */
import type { MsiziLang } from './types';

export const msiziAf: MsiziLang = {
  entries: {
    'what-is-vuka': {
      title: 'Wat Vuka Uzenzele is',
      asks: ['Wat is Vuka?', 'Wat doen hierdie app?', 'Verduidelik die app vir my', 'Wat is die app about?'],
      keywords: ['oor', 'doel', 'vuka', 'uzenzele', 'app', 'platform'],
      body:
        'Vuka Uzenzele verbind jong Suid-Afrikaners met werk — dit begin met klein plaaslike werkies en bou op na formele werk.\n'
        + 'Die idee is eenvoudig. Jy het nie ’n CV nodig om te begin nie. Jy doen ’n werk, die werkgewer gradeer jou, en daardie gradering word jou rekord. Genoeg goeie werk en jy klim op The Ladder, wat beter betaalde en meer formele werk ontsluit.\n'
        + 'Dit is gratis om te gebruik, vir werkers en vir werkgewers.\n'
        + 'Jeugwerkloosheid in Suid-Afrika is {youthUnemployment} vir ouderdomme 15 tot 24. Hierdie app bestaan om mense ’n manier in te gee wanneer niemand hulle ’n eerste kans wil gee nie.',
    },
    'is-it-free': {
      title: 'Wat dit kos',
      asks: ['Is Vuka gratis?', 'Hoeveel kos dit?', 'Moet ek betaal om die app te gebruik?', 'Vat Vuka ’n deel van my betaling?', 'Is dit free?'],
      keywords: ['gratis', 'kos', 'prys', 'fooi', 'heffing', 'intekening', 'deel', 'kommissie', 'free', 'fee'],
      body:
        'Vuka is gratis vir werkers. Daar is geen registrasiefooi, geen maandelikse fooi, en geen koste om vir werk aansoek te doen nie. Jy kry die volle betaling vir elke werk — Vuka vat niks daarvan nie.\n'
        + 'Om ’n werk te plaas is ook gratis. Wanneer ’n werk klaar is, betaal die werkgewer die werker se betaling plus ’n Vuka-fooi van {feePercent} bo-op. Daardie fooi is hoe Vuka aan die gang bly.\n'
        + 'As iemand jou ooit vra om ’n fooi te betaal om ’n werk op Vuka te kry, is dit ’n swendelary. Rapporteer dit.',
    },
    'who-is-msizi': {
      title: 'Wie Msizi is',
      asks: ['Wie is jy?', 'Wat kan jy doen?', 'Is jy ’n robot?', 'Wie het jou gemaak?', 'Wie het Msizi gebou?'],
      keywords: ['msizi', 'assistent', 'helper', 'bot', 'robot', 'jy'],
      body:
        'Ek is Msizi — “umsizi” beteken helper. Ek beantwoord vrae oor hoe Vuka werk.\n'
        + 'Die meeste van my antwoorde is geskryf en nagegaan teen hoe hierdie app regtig werk. Wanneer ’n vraag nie daardeur gedek word nie, gebruik ek KI om uit daardie selfde nagegaande antwoorde te antwoord, en ek merk daardie antwoorde sodat jy dit kan sien. As ek iets nie weet nie, sal ek dit sê eerder as om iets op te maak.\n'
        + 'Ek kan jou eie rekord vir jou voorlees — jou telling, jou vlak, jou werke, jou aansoeke — want dit is reeds op jou foon. Ek kan nie vir jou aansoek doen nie, niemand aanstel nie, en nie aan jou bankbesonderhede raak nie. Dit bly altyd jou besluit.\n'
        + 'Jy kan vir my tik of die mikrofoon tik en praat.',
    },
    'msizi-languages': {
      title: 'Met Msizi in jou taal praat',
      asks: ['Kan jy isiZulu praat?', 'Watter tale praat jy?', 'Kan ek in my eie taal met jou praat?', 'Praat jy Afrikaans?'],
      keywords: ['taal', 'tale', 'isizulu', 'isixhosa', 'sesotho', 'afrikaans', 'engels', 'praat', 'vertaal'],
      body:
        'Jy kan my vrae in isiZulu, isiXhosa, Sesotho, Afrikaans of Engels vra, en ek sal algemene woorde in almal verstaan.\n'
        + 'Ek antwoord in die taal waarop die app gestel is. My antwoorde is met sorg vertaal, maar nog nie deur ’n moedertaalspreker nagegaan nie, so as iets verkeerd lees, sê asseblief vir ons op die Taal-skerm.\n'
        + 'Hardop praat hang af van jou taal en jou foon. In Engels en Afrikaans kan ek op die meeste fone na jou luister. Stemme vir isiZulu, isiXhosa en Sesotho bestaan meestal nog nie op fone nie, so in daardie tale kan ek dalk net skriftelik antwoord. As joune nie jou taal kan hanteer nie, sal ek jou op die skerm sê eerder as om stilletjies niks te doen nie.',
    },
    'how-to-start': {
      title: 'Om te begin',
      asks: ['Hoe begin ek?', 'Hoe registreer ek?', 'Hoe skep ek ’n rekening?', 'Hoe sign ek up?'],
      keywords: ['begin', 'registreer', 'aansluit', 'rekening', 'nuut'],
      body:
        'Kies of jy werk soek of iemand wil huur, en registreer dan met jou foonnommer.\n'
        + '• Ons stuur ’n eenmalige kode per SMS om te kyk dat die nommer regtig joune is.\n'
        + '• Jy kies ’n wagwoord en voeg ’n paar besonderhede by — jou area, jou ouderdom, die soort werk wat jy kan doen.\n'
        + '• Dis al. Jy kan dadelik vir werkies aansoek doen, sonder ’n CV en sonder werkgeskiedenis.\n'
        + 'Jou eerste werk is die een wat jou rekord begin. Daarna praat die rekord vir jou.',
    },
    'worker-or-employer': {
      title: 'Werkerrekening of werkgewerrekening',
      asks: ['Wat is die verskil tussen ’n werker- en ’n werkgewerrekening?', 'Watter rekening moet ek kies?', 'Werker of werkgewer?'],
      keywords: ['werker', 'werkgewer', 'rekeningtipe', 'rol', 'verskil', 'kies'],
      body:
        '’n Werkerrekening is om werk te kry. Jy blaai deur werkies, doen aansoek, doen die werk, en bou ’n rekord wat beter werk ontsluit.\n'
        + '’n Werkgewerrekening is om te huur. Jy plaas ’n werk, sien wie aansoek doen, kies iemand, en bevestig die werk wanneer dit klaar is.\n'
        + 'Een foonnommer is een rekening, so kies die een wat pas by wat jy hier kom doen. As jy albei nodig het, gebruik ’n ander nommer vir die tweede.',
    },
    'minimum-age': {
      title: 'Hoe oud jy moet wees',
      asks: ['Hoe oud moet ek wees?', 'Kan ek op Vuka werk as ek 16 is?', 'Wat is die minimum ouderdom?', 'Ouderdom?'],
      keywords: ['ouderdom', 'oud', 'jonk', 'minimum ouderdom', 'tiener', 'onder 18', 'skoolverlater'],
      body:
        'Jy moet 18 of ouer wees om Vuka te gebruik.\n'
        + 'Suid-Afrikaanse wetgewing laat wel mense van 15 af toe om sekere werk te doen, so dit is ons grens eerder as die land s’n. Die rede is POPIA: enigiemand onder 18 is wetlik ’n kind, en ’n kind se persoonlike inligting mag nie sonder ’n voog se toestemming hanteer word nie. Vuka het nog nie ’n manier om daardie toestemming te kry en te verifieer nie, so eerder as om ’n jong persoon se ID, ligging en bankbesonderhede daarsonder in te samel, neem ons glad nie die rekening nie.\n'
        + 'As jy binnekort 18 word, registreer dan. Niks gaan verlore deur te wag nie.',
    },
    'otp-problems': {
      title: 'As die SMS-kode nie aankom nie',
      asks: ['Ek het nie my OTP gekry nie', 'Die SMS-kode kom nie', 'Ek kan nie my nommer verifieer nie', 'Geen OTP nie'],
      keywords: ['otp', 'sms', 'kode', 'verifieer', 'nie ontvang', 'teksboodskap'],
      body:
        'Die kode word per SMS gestuur en kom gewoonlik binne ’n minuut aan.\n'
        + '• Kyk na die nommer wat jy getik het, ook die 0 voor.\n'
        + '• Maak seker jy het sein. Die kode kan nie aankom as die foon geen netwerk het nie.\n'
        + '• Wag ’n volle minuut voordat jy vir ’n nuwe een vra — as jy verskeie kort na mekaar aanvra, kan jy vir ’n ruk geblokkeer word.\n'
        + 'As dit steeds nie aankom nie, is dit ’n probleem aan ons kant eerder as joune, en die app sal dit sê eerder as om jou te laat raai.',
    },
    'forgot-password': {
      title: 'Wagwoord vergeet',
      asks: ['Ek het my wagwoord vergeet', 'Hoe stel ek my wagwoord terug?', 'Ek kan nie aanmeld nie', 'Password vergeet'],
      keywords: ['wagwoord', 'vergeet', 'terugstel', 'aanmeld', 'uitgesluit'],
      body:
        'Kies op die aanmeldskerm om jou wagwoord terug te stel. Ons stuur ’n kode na jou foonnommer, en sodra jy dit invoer, kan jy ’n nuwe wagwoord kies.\n'
        + 'Die terugstel werk net op die nommer waarmee die rekening geskep is — dit is wat keer dat iemand anders jou wagwoord vir jou terugstel.',
    },
    'change-language': {
      title: 'Die taal verander',
      asks: ['Hoe verander ek die taal?', 'Kan ek die app in isiZulu gebruik?', 'Verander taal', 'Hoe change ek die language?'],
      keywords: ['taal', 'verander', 'isizulu', 'isixhosa', 'sesotho', 'afrikaans', 'engels', 'oorskakel'],
      body:
        'Gaan na Ek, dan Taal. Vuka is beskikbaar in Engels, isiZulu, isiXhosa, Sesotho en Afrikaans, en jou keuse word onthou selfs wanneer jy vanlyn is.\n'
        + 'Weet net dat die app skerm vir skerm vertaal word, so sommige skerms is nog in Engels. Die Taal-skerm sê jou eerlik hoe ver dit is.\n'
        + 'Die regsbladsye bly met opset in Engels — ’n regsterm wat verkeerd vertaal is, mislei mense, en dit is erger as om jou te vra om dit in Engels te lees.\n'
        + 'As ’n vertaling vir jou verkeerd lees, is daar ’n blokkie op daardie skerm om ons te sê. ’n Mens lees dit.',
    },
    'install-app': {
      title: 'Vuka op jou foon installeer',
      asks: ['Hoe installeer ek die app?', 'Kan ek dit by my tuisskerm voeg?', 'Is daar ’n app om af te laai?', 'Install die app'],
      keywords: ['installeer', 'aflaai', 'tuisskerm', 'app store', 'play store'],
      body:
        'Vuka installeer reguit uit die blaaier — daar is niks om uit ’n app-winkel af te laai nie, wat beteken geen groot aflaai nie en geen data wat op opdaterings spandeer word nie.\n'
        + 'Soek die installeer-knoppie in die app, of gebruik jou blaaier se kieslys en kies Voeg by tuisskerm.\n'
        + 'Sodra dit geïnstalleer is, maak dit oop soos enige ander app, werk dit met swak sein, en wys dit jou gestoorde skerms selfs wanneer jy vanlyn is.',
    },
    'works-offline': {
      title: 'Vuka sonder data gebruik',
      asks: ['Werk dit vanlyn?', 'Kan ek Vuka sonder data gebruik?', 'Wat gebeur as ek sein verloor?', 'Werk dit offline?'],
      keywords: ['vanlyn', 'offline', 'data', 'sein', 'verbinding', 'internet', 'geen netwerk'],
      body:
        'Gedeeltelik, en dit is met opset so. Vuka is gebou vir ’n foon met ’n leë databundel op ’n plek met net een strepie sein.\n'
        + '• Die app self maak sonder sein oop, in die taal wat jy gekies het.\n'
        + '• Skerms wat jy reeds gesien het, bly leesbaar.\n'
        + '• Boodskappe wat jy vanlyn stuur, wag en gaan uit wanneer die sein terugkom, eerder as om verlore te gaan.\n'
        + 'Wat wel ’n verbinding nodig het: nuwe werklyste, aansoek doen, en enigiets wat die ander persoon moet bereik.',
    },
    'find-work': {
      title: 'Werk vind',
      asks: ['Hoe kry ek werk?', 'Waar is die werk?', 'Hoe kry ek ’n job?', 'Hoe doen ek aansoek vir ’n werk?', 'Ek soek werk'],
      keywords: ['vind', 'werk', 'werkie', 'werkies', 'soek', 'blaai', 'aansoek'],
      body:
        'Tik Vind werk. Jy sal werkies naby jou sien, die naaste eerste.\n'
        + '• Filter volgens die soort werk met die kategorie-ry bo-aan.\n'
        + '• Elke lys wys die betaling per uur, hoe lank dit is, hoe ver dit is, en wie dit aanbied.\n'
        + '• Maak een oop om die besonderhede te lees, en doen dan aansoek. Aansoek doen is een tik en kos niks.\n'
        + 'Jy kan vir soveel aansoek doen as wat jy wil. Die werkgewer sien jou rekord — jou gradering, jou werke gedoen, jou vlak — en kies uit die mense wat aansoek gedoen het.',
    },
    'job-types': {
      title: 'Die soorte werk op Vuka',
      asks: ['Watter soort werk is daar?', 'Watter werk kan ek doen?', 'Watter kategorieë is daar?', 'Soorte jobs?'],
      keywords: ['kategorieë', 'soorte', 'tipes', 'skoonmaak', 'tuinwerk', 'onderrig'],
      body:
        'Werkies — kort, plaaslik, per uur betaal. Op die oomblik is dit:\n'
        + '{categories}\n'
        + 'Formele werk — regte skofwerk en intreevlakwerk, soos petroljoggie, pakhuiswerk, kassier, sekuriteitsbeampte, inbelsentrum-agent en kleinhandelassistent.\n'
        + 'Formele werk word verdien, nie net deurgeblaai nie. Elkeen het ’n vlak nodig, en jy bereik ’n vlak deur werkies goed te doen. Dit is die hele punt van die leer: die klein werkies is hoe jy by die grotes uitkom sonder ’n CV.',
    },
    'no-matric-needed': {
      title: 'Of jy matriek of ondervinding nodig het',
      asks: ['Het ek matriek nodig?', 'Het ek ondervinding nodig?', 'Het ek ’n CV nodig om te begin?', 'Geen matric nie, kan ek nog werk?'],
      keywords: ['matriek', 'matric', 'graad 12', 'kwalifikasie', 'opleiding', 'sertifikaat', 'ondervinding', 'skool', 'diploma'],
      body:
        'Nee. Jy het nie matriek, ’n CV, ondervinding of ’n verwysing nodig om op Vuka te begin nie. Dit is die punt daarvan.\n'
        + 'Werkies is oop vir almal. Jy doen ’n werk, die werkgewer gradeer jou, en daardie gradering is die ondervinding — dit word die rekord wat vir jou die volgende een kry.\n'
        + 'Formele werk word deur jou vlak bepaal, nie deur jou skoolopleiding nie. ’n Vlak word uit voltooide werk verdien, so iemand wat vroeg die skool verlaat het en goed werk, bereik kassier- en inbelsentrumposte op dieselfde manier as enigiemand anders. Sommige lyste noem wel hul eie vereistes, en die lys sê jou.\n'
        + 'As jy wel matriek of ’n sertifikaat het, voeg dit by jou profiel — dit kan net help. Dit is nooit die ding wat tussen jou en ’n eerste werkie staan nie.',
    },
    'after-i-apply': {
      title: 'Wat gebeur nadat jy aansoek gedoen het',
      asks: ['Wat gebeur nadat ek aansoek gedoen het?', 'Hoe weet ek of ek die werk gekry het?', 'Hoekom het niemand geantwoord nie?', 'Niemand reply nie'],
      keywords: ['aansoek gedoen', 'aansoek', 'wag', 'antwoord', 'reaksie', 'aangestel', 'status', 'niemand'],
      body:
        'Die werkgewer sien almal wat aansoek gedoen het, saam met elke persoon se rekord, en kies. As hulle jou kies, is jy aangestel en kry jy ’n kennisgewing.\n'
        + 'Jy kan alles waarvoor jy aansoek gedoen het op jou Tuis-skerm sien.\n'
        + 'Om nie terug te hoor nie is normaal en dit is nie ’n oordeel oor jou nie — ’n werkie wat een persoon nodig het, het dalk twintig aansoekers gehad. Hou aan aansoek doen. Die grootste ding wat jou kanse verander, is ’n paar voltooide werke en ’n goeie gradering agter jou, en daarom tel die eerste een meer as die res.',
    },
    'distance': {
      title: 'Hoe ver ’n werk is',
      asks: ['Hoe ver is hierdie werk?', 'Hoe weet Vuka waar ek is?', 'Hoekom wys dit die verkeerde afstand?', 'Hoe far is die job?'],
      keywords: ['afstand', 'ver', 'ligging', 'gps', 'naby', 'km', 'reis'],
      body:
        'As jy Vuka jou ligging laat gebruik, word afstande gemeet van waar jy regtig is, en die lys word met die naaste eerste gesorteer.\n'
        + 'As jy nie doen nie, wys elke lys steeds sy eie area, en die app merk dit as ’n skatting eerder as om voor te gee dat dit gemeet is.\n'
        + 'Jou posisie word op jou foon gebruik om te sorteer en te meet. Afstand tel hier meer as wat dit lyk: vervoer is die grootste koste van werk soek in Suid-Afrika, so ’n werk twee taxi’s ver kan meer kos om by te kom as wat dit betaal.',
    },
    'invitations': {
      title: 'Uitnodigings vir werk',
      asks: ['Wat is ’n uitnodiging?', '’n Werkgewer het my genooi — wat beteken dit?', 'Ek het ’n invite gekry'],
      keywords: ['uitnodiging', 'genooi', 'nooi', 'invite', 'aangebied'],
      body:
        '’n Werkgewer wat jou rekord gesien het, kan jou direk na ’n spesifieke werk nooi, eerder as om te wag dat jy dit vind.\n'
        + '’n Uitnodiging is nog nie ’n aanstelling nie — jy word gevra om aansoek te doen. Jy kan aanvaar of weier, en weier kos jou niks en word nie teen jou rekord gehou nie.\n'
        + 'Uitnodigings word baie meer algemeen sodra jy Vertroud of hoër is, want dit is die punt waar werkgewers deur talent begin blaai eerder as om net te plaas en te wag.',
    },
    'change-my-mind': {
      title: 'Van plan verander oor ’n werk',
      asks: ['Kan ek ’n werk kanselleer?', 'Hoe trek ek my aansoek terug?', 'Ek kan nie meer na die werk toe gaan nie', 'Kan ek cancel?'],
      keywords: ['kanselleer', 'terugtrek', 'onttrek aansoek', 'van plan verander', 'uittrek', 'nie meer'],
      body:
        'Daar is nog nie ’n knoppie in die app om ’n aansoek terug te trek nie, so ’n aansoek wat jy gestuur het, bly gestuur.\n'
        + 'As jy nie meer ’n werk kan doen nie, stuur die werkgewer ’n boodskap in Gesprekke en sê vir hulle sodra jy weet. Dis al — om hulle vroeg te sê kos jou niks, en dit is wat ’n betroubare mens doen.\n'
        + 'Wat wel ’n rekord skade doen, is stilte: om aangestel te word en dan nie op te daag nie, sonder ’n boodskap. Die werkgewer kan dit gradeer, en dit is die een ding waarvan dit regtig moeilik is om te herstel.\n'
        + 'Om vir iets aansoek te doen en nooit terug te hoor nie, is nie dieselfde ding nie en het glad geen straf nie.',
    },
    'formal-jobs-locked': {
      title: 'Hoekom ’n formele werk gesluit is',
      asks: ['Hoekom kan ek nie vir hierdie werk aansoek doen nie?', 'Hoekom is hierdie werk gesluit?', 'Hoe ontsluit ek formele werk?', 'Job is locked'],
      keywords: ['gesluit', 'kan nie aansoek doen', 'vlak nodig', 'formeel', 'formele', 'ontsluit', 'geblokkeer'],
      body:
        'Formele werk het elk ’n minimum vlak nodig, en jy bereik ’n vlak deur werkies met goeie graderings te voltooi.\n'
        + 'Dit is nie ons wat jou uithou nie. Dit is die teenoorgestelde: ’n werkgewer wat ’n regte skofwerk aanbied, sal nie iemand sonder geskiedenis neem nie, so die vlak is die bewys wat die plek inneem van die CV en die verwysings wat jy nog nie het nie. As Vuka sê jy is Vertroud, is daar drie voltooide werke en ’n gradering agter.\n'
        + 'Die werklys sê jou watter vlak dit nodig het. Jou rekord sê jou hoe ver jy daarvan af is.',
    },
    'my-record': {
      title: 'My rekord',
      asks: ['Wat is My rekord?', 'Wat is op my rekord?', 'Waar is my CV?', 'My CV?'],
      keywords: ['rekord', 'cv', 'profiel', 'geskiedenis', 'werkgeskiedenis', 'verwysing', 'verwysings', 'bewys van werk'],
      body:
        'My rekord is die CV wat die app vir jou skryf, uit werk wat jy regtig gedoen het.\n'
        + 'Dit hou elke voltooide werk, wat dit was, vir wie dit was, wat jy betaal is, en die gradering en resensie wat die werkgewer gelos het. Dit dra ook jou Vuka Score, jou vlak en jou kentekens.\n'
        + 'Jy skryf dit nooit en jy kan dit nie wysig nie, en dis presies hoekom ’n werkgewer dit glo. Elke werk word onder ’n regte beroepstitel gelys — ’n trekwerk lees as Verhuisassistent, nie “help met trek” nie — want dit is waarna iemand wat huur, soek.\n'
        + 'Jy kan dit as ’n openbare skakel deel, so dit werk ook buite die app as ’n CV.',
    },
    'vuka-score': {
      title: 'Die Vuka Score',
      asks: ['Wat is die Vuka Score?', 'Hoe word my telling bereken?', 'Hoe verhoog ek my telling?', 'Hoe werk die score?'],
      keywords: ['telling', 'score', 'reputasie', 'punte', 'bereken', 'persentasie', 'verhoog'],
      body:
        'Jou Vuka Score is ’n enkele getal uit 100 wat jou rekord opsom. Dit word uit drie dinge gebou:\n'
        + '• Jou gemiddelde stergradering, wat die grootste deel daarvan is.\n'
        + '• Hoeveel werke jy voltooi het, getel tot by twaalf.\n'
        + '• ’n Skoon veiligheidsrekord, sonder vlae teen jou.\n'
        + 'Dit bly op nul tot jou eerste voltooide werk, want daar is nog niks om te meet nie.\n'
        + 'Die manier om dit te verhoog, is die gewone manier: daag op, doen die werk ordentlik, en wees iemand wat ’n werkgewer terug wil hê. Daar is geen manier om dit te koop of op te stoot nie, en dit is die enigste rede hoekom dit iets werd is.',
    },
    'the-ladder': {
      title: 'The Ladder',
      asks: ['Wat is The Ladder?', 'Wat is die vlakke?', 'Verduidelik die vlakke vir my', 'Hoe werk die tiers?'],
      keywords: ['ladder', 'leer', 'vlak', 'vlakke', 'tier', 'rang', 'beginner', 'vertroud', 'professioneel', 'elite'],
      body:
        'The Ladder is hoe klein werkies in regte werk verander. Daar is vier vlakke, en elkeen word verdien:\n'
        + '{tiers}\n'
        + 'Jy klim outomaties op sodra jy aan elke voorwaarde vir die volgende vlak voldoen — werke gedoen, gemiddelde gradering, en geen veiligheidsvlae nie.\n'
        + 'Niks hier kan gekoop word nie en niks verval nie.',
    },
    'move-up-tier': {
      title: '’n Vlak hoër klim',
      asks: ['Hoe klim ek ’n vlak op?', 'Hoe kom ek by die volgende vlak?', 'Wat keer my om op te klim?', 'Hoe level ek up?'],
      keywords: ['opklim', 'volgende vlak', 'bevordering', 'vordering', 'vas', 'vereistes'],
      body:
        'Drie voorwaardes, en almal moet terselfdertyd waar wees:\n'
        + '• Genoeg voltooide werke vir daardie vlak.\n'
        + '• ’n Gemiddelde gradering op of bo wat die vlak vra.\n'
        + '• Geen veiligheidsvlae op jou rekord nie.\n'
        + 'Jou rekord wys watter van die drie jy gehaal het en watter nie, so jy kan presies sien wat in die pad staan eerder as om te raai.\n'
        + 'Vra my “op watter vlak is ek” en ek sal jou eie getalle vir jou voorlees.',
    },
    'badges': {
      title: 'Kentekens',
      asks: ['Wat is kentekens?', 'Hoe verdien ek kentekens?', 'Wat is badges?'],
      keywords: ['kenteken', 'kentekens', 'badge', 'toekenning', 'prestasie'],
      body:
        'Kentekens merk spesifieke dinge wat jy gedoen het. Hulle sit op jou rekord waar ’n werkgewer hulle kan sien:\n'
        + '{badges}\n'
        + 'Hulle word outomaties verdien. Jy hoef nooit een te eis nie.',
    },
    'ratings-average': {
      title: 'Hoe jou gradering werk',
      asks: ['Hoe werk my gradering?', 'Hoekom het my gemiddeld nie verander nie?', 'Wie gradeer my?', 'Hoe werk die stars?'],
      keywords: ['gradering', 'sterre', 'gemiddeld', 'resensie', 'gegradeer', 'terugvoer'],
      body:
        'Wanneer jy ’n werk klaarmaak, bevestig die werkgewer dit en gradeer jou van een tot vyf sterre, met ’n kort resensie. Daardie gradering gaan op jou rekord en in jou gemiddeld.\n'
        + 'Een geval verras mense, en dit is in jou guns. As ’n werkgewer nooit daarby uitkom om te bevestig nie, word die werk in elk geval aan jou toegeken ná die bevestigingstydperk — maar dit word sonder enige gradering gestoor, en heeltemal uit jou gemiddeld gelaat. So ’n werkgewer wat stil raak, kan jou gradering nie help of seermaak nie. Jy kry steeds die werk, die verdienste en die inskrywing op jou rekord.',
    },
    'safety-flag': {
      title: 'Veiligheidsvlae',
      asks: ['Wat is ’n veiligheidsvlag?', 'Hoe raak ’n vlag my?', 'Kan ’n vlag verwyder word?', 'Ek het ’n flag gekry'],
      keywords: ['vlag', 'gevlag', 'veiligheidsvlag', 'waarskuwing', 'merk'],
      body:
        '’n Veiligheidsvlag word gelig wanneer iemand ’n egte veiligheidsbekommernis oor ’n werk rapporteer — deur die werker oor die werkgewer, of andersom.\n'
        + '’n Vlag op jou rekord keer dat jy ’n vlak opklim, want elke vlak bo Beginner vereis ’n skoon rekord.\n'
        + 'Vlae word deur ’n mens gelees, nie deur die app besluit nie. Hulle bestaan om mense veilig te hou wat by vreemdes se huise instap en om die leer iets werd te hou — nie as straf vir ’n werk wat sleg gegaan het nie. ’n Meningsverskil oor die werk is nie ’n veiligheidsvlag nie.',
    },
    'public-cv': {
      title: 'Jou rekord deel',
      asks: ['Hoe deel ek my CV?', 'Kan ek my rekord vir iemand stuur?', 'Kan mense my rekord sonder die app sien?', 'Stuur my CV op WhatsApp'],
      keywords: ['deel', 'skakel', 'openbaar', 'cv', 'stuur', 'whatsapp', 'buite', 'wys werkgewer'],
      body:
        'Jou rekord kan as ’n skakel gedeel word. Enigiemand wat dit oopmaak, sien ’n leesalleen-weergawe van jou werkgeskiedenis, gradering en vlak, sonder om ’n Vuka-rekening nodig te hê.\n'
        + 'Dit is hoe jy “het jy ’n CV?” beantwoord wanneer jy nie een het nie. Stuur die skakel op WhatsApp.\n'
        + 'Die openbare weergawe wys jou werk en jou reputasie. Dit wys nie jou foonnommer, jou ID-nommer of jou bankbesonderhede nie.',
    },
    'how-payment-works': {
      title: 'Hoe jy betaal word',
      asks: ['Hoe word ek betaal?', 'Hou Vuka my geld?', 'Wanneer kry ek my geld?', 'Hoe kry ek my pay?'],
      keywords: ['betaal', 'betaling', 'geld', 'loon', 'kontant', 'salaris', 'verdien', 'bank', 'kaart', 'card', 'paystack', 'eft', 'wallet'],
      body:
        'Jy word reguit in jou bankrekening betaal, deur Paystack, die betalingsmaatskappy wat Vuka gebruik. Die geld gaan nie deur Vuka se eie rekening nie.\n'
        + '• Voordat ’n werkgewer iemand kan aanstel, moet hulle ’n kaart byvoeg. Niks word dan vir die werk gedebiteer nie.\n'
        + '• Wanneer die werkgewer jou voltooide werk bevestig — of outomaties, {autoReleaseHours} nadat jy dit as klaar gemerk het as hulle nooit antwoord nie — word hul kaart gedebiteer en jou volle betaling na jou bankrekening gestuur.\n'
        + '• Voeg jou bankbesonderhede by onder Ek, dan Kry betaal. As hulle ontbreek wanneer ’n werk bevestig word, wag jou betaling en word dit gestuur sodra jy hulle byvoeg.\n'
        + 'Onder Ek, dan My betaling, kan jy sien wat betaal is en enigiets wat nog wag.\n'
        + 'As ’n betaling misluk of ’n werkgewer jou nie betaal nie, rapporteer dit. Dit is presies waarvoor die veiligheidsverslag is.\n'
        + '{testModeNote}',
    },
    'funds-secured': {
      title: 'Is die betaling gewaarborg?',
      asks: ['Is my betaling gewaarborg?', 'Wat as die werkgewer nie betaal nie?', 'Kan die werkgewer die geld terugvat?', 'Is die geld regtig daar?', 'Is my pay guaranteed?'],
      keywords: ['gewaarborg', 'waarborg', 'nie betaal', 'betaal nie', 'nooit betaal', 'terugvat', 'die geld terugvat', 'gedebiteer', 'geweier', 'misluk', 'omkeer', 'guaranteed', 'declined', 'escrow'],
      body:
        'Elke werkgewer moet ’n kaart byvoeg voordat hulle iemand kan aanstel, en die kaart word nagegaan wanneer hulle dit byvoeg. So is daar van die begin af ’n manier om jou te betaal.\n'
        + '• Die kaart word gedebiteer wanneer die werk bevestig word — of outomaties, {autoReleaseHours} nadat jy dit as klaar gemerk het, as die werkgewer nooit antwoord nie. Om stil te bly, keer dit nie.\n'
        + '• ’n Aanstelling kan nie in die app ongedaan gemaak word nie, so ’n werkgewer kan jou nie uit ’n werk kanselleer om te vermy om te betaal nie.\n'
        + 'Wat ’n kaart nie kan belowe nie, is dat die geld op die dag daar is. As die debitering misluk, word die werkgewer gevra om te betaal, en jy kan die betaling op die werk sien. As hulle steeds nie betaal nie, rapporteer dit.\n'
        + '{testModeNote}',
    },
    'wallet-withdraw': {
      title: 'Waarheen jou betaling gaan',
      asks: ['Hoe onttrek ek my geld?', 'Waar is my beursie?', 'Wanneer kom die geld in my bank?', 'Hoe cash ek out?'],
      keywords: ['onttrek', 'onttrekking', 'uithaal', 'balans', 'oordrag', 'uitbetaling', 'my betaling', 'in my bank', 'beursie', 'wallet', 'withdraw', 'cash out', 'payout'],
      body:
        'Daar is niks om te onttrek nie: jou betaling gaan reguit na jou bankrekening wanneer ’n werk bevestig word. Vuka het geen beursie om dit in te hou nie.\n'
        + '• Jou bankbesonderhede gaan onder Ek, dan Kry betaal. Voeg hulle by voor jou eerste werk, sodat niks hoef te wag nie.\n'
        + '• Ek, dan My betaling, lys elke werk, wat jy betaal is, en enigiets wat nog wag.\n'
        + 'Paystack stuur die betaling na jou bank volgens sy gewone uitbetalingskedule, en jou bank wys dit dan. As dit ná ’n paar werksdae nog nie aangekom het nie, rapporteer dit onder Ek.\n'
        + 'Vra my “hoeveel is al aan my betaal” en ek sal dit vir jou voorlees.\n'
        + '{testModeNote}',
    },
    'test-mode': {
      title: 'Wat toetsmodus beteken',
      asks: ['Wat is toetsmodus?', 'Is dit regte geld?', 'Hoekom sê dit toetsmodus?', 'Wat is test mode?'],
      keywords: ['toetsmodus', 'toets', 'oefen', 'regte geld', 'vals geld', 'nie eg', 'toetskaart', 'test mode', 'test card'],
      body:
        'Terwyl Vuka getoets word, loop betalings in Paystack se toetsmodus. Alles werk soos dit regtig sal werk — die kaart, die debitering wanneer ’n werk klaar is, die betaling na die werker se bank — maar net toetskaarte word aanvaar, en geen regte geld beweeg nie.\n'
        + 'Spreek dus vir nou met die ander persoon af hoe die betaling regtig gemaak sal word, voordat die werk begin. Alles anders — jou rekord, graderings, vlakke en kentekens — is eg en tel.\n'
        + 'Wanneer regte betalings begin, verdwyn toetsmodus van hierdie skerms.',
    },
    'employer-fund-job': {
      title: 'Vir ’n werk betaal',
      asks: ['Hoe betaal ek die werker?', 'Hoekom het ek ’n kaart nodig om aan te stel?', 'Wanneer word my kaart gedebiteer?', 'Kan ek kanselleer nadat ek aangestel het?', 'Hoekom kan ek niemand aanstel nie?', 'Wat gebeur met die geld as ek die werk uitvee?'],
      keywords: ['kaart', 'card', 'betaal die werker', 'gedebiteer', 'debiteer', 'kaart byvoeg', 'kan nie aanstel', 'terugbetaling', 'kanselleer', 'paystack', 'toetsdebitering', 'geld terug', 'befonds'],
      body:
        'Jy betaal per kaart, en net wanneer die werk klaar is.\n'
        + '• Voor jou eerste aanstelling voeg jy ’n kaart by op Paystack se veilige bladsy. Om te kyk of die kaart werk, debiteer Paystack {cardCheck} en betaal dit dadelik terug (jou bank kan ’n paar dae vat om die terugbetaling te wys). Die kaart word vir latere werke gehou.\n'
        + '• Niks word gedebiteer wanneer jy plaas of wanneer jy aanstel nie. Wanneer jy die voltooide werk bevestig — of outomaties, {autoReleaseHours} nadat die werker dit as klaar gemerk het, as jy nie antwoord nie — word jou kaart gedebiteer vir die betaling plus Vuka se fooi van {feePercent}, en die betaling gaan reguit na die werker se bank.\n'
        + '• As die werker nog nie bankbesonderhede bygevoeg het nie, wag die debitering totdat hulle dit doen.\n'
        + '• Om ’n werk te onttrek voordat iemand aangestel is, kos niks.\n'
        + '’n Werk waarvoor iemand aangestel is, kan nie in die app gekanselleer word nie. Stuur die werker ’n boodskap om dit uit te sorteer, en rapporteer dit onder Ek as iets verkeerd is.\n'
        + 'Vuka sien nooit jou volle kaartnommer nie; Paystack hou dit.\n'
        + '{testModeNote}',
    },
    'get-more-work': {
      title: 'Meer werk kry',
      asks: ['Hoe kry ek meer werk?', 'Hoekom kry ek nie werk nie?', 'Hoe word ek vinniger aangestel?', 'Niemand hire my nie'],
      keywords: ['meer werk', 'kry nie', 'geen werk', 'aangestel word', 'kanse', 'niemand huur', 'werkloos'],
      body:
        'Werkgewers kies uit die rekord wat hulle kan sien, so die dinge wat jou hoër op die lys skuif, is die dinge wat jy beheer:\n'
        + '• Vul jou profiel in en die vaardighede wat jy regtig het, sodat jy vir die regte werk opdaag.\n'
        + '• Verifieer jou ID onder Ek. Tussen twee mense neem ’n werkgewer die geverifieerde een.\n'
        + '• Skakel Nuwe werk naby my aan, onder Ek dan Kennisgewings, sodat jy van ’n werkie hoor sodra dit geplaas word en vroeg aansoek kan doen.\n'
        + '• Voeg jou bankbesonderhede by onder Ek, dan Kry betaal, sodat jy betaal kan word sodra ’n werk bevestig is.\n'
        + '• Verkies werk naby jou — jy kom betyds aan, en werkgewers merk dit op.\n'
        + '• Doen elke werk goed en merk dit as klaar. Elke bevestigde werk en goeie gradering lig jou Vuka Score en jou vlak.',
    },
    'banking-details': {
      title: 'Jou bankbesonderhede',
      asks: ['Hoekom wil Vuka my bankbesonderhede hê?', 'Is my bankbesonderhede veilig?', 'Hoe voeg ek my bankrekening by?', 'Bank details?'],
      keywords: ['bank', 'bankbesonderhede', 'rekeningnommer', 'takkode', 'uitbetaling', 'payout', 'capitec', 'fnb', 'absa'],
      body:
        'Jou bankbesonderhede is waarheen jou betaling gestuur word. Voeg hulle by onder Ek, dan Kry betaal. Wanneer ’n werk bevestig word, betaal Paystack, die betalingsmaatskappy wat Vuka gebruik, in hierdie rekening in — so jou rekeningnommer word daarvoor met Paystack gedeel, en vir niks anders nie.\n'
        + 'Hulle is op die bediener geïnkripteer en word nooit terug na die app gestuur nie. Selfs jy sien net ’n bedekte wenk — jou bank, die rekeningtipe, en die laaste vier syfers. Niks sensitiefs word op jou foon gestoor nie.\n'
        + 'Niemand van Vuka sal jou ooit bel of ’n boodskap stuur om jou rekeningnommer, jou PIN of ’n OTP te vra nie. Enigiemand wat dit doen, is nie van Vuka nie.',
    },
    'fair-pay': {
      title: 'Die Billike-betaling-meter en die minimumloon',
      asks: ['Wat is die billike-betaling-meter?', 'Wat is die minimumloon?', 'Betaal hierdie werk my genoeg?', 'Wat is minimum wage?'],
      keywords: ['billik', 'billike betaling', 'minimumloon', 'onderbetaal', 'tarief', 'per uur', 'wettig', 'te laag'],
      body:
        'Die nasionale minimumloon in Suid-Afrika is {minWage} per uur. Dit word deur die regering vasgestel en elke jaar opnuut in die staatskoerant afgekondig, van 1 Maart af.\n'
        + 'Elke werkie op Vuka wys ’n Billike-betaling-meter wat sy tarief met daardie bedrag vergelyk, sodat jy met een oogopslag kan sien of wat jy aangebied word wettig en billik is voordat jy taxigeld spandeer om daar te kom.\n'
        + '’n Werk wat onder die minimumloon betaal, is nie wettig nie. Jy mag nee sê, en jy mag dit rapporteer.\n'
        + 'Weeg ook die reis op. ’n Tarief wat reg lyk, kan erger wees as om by die huis te bly sodra twee taxi’s betaal is.',
    },
    'total-earned': {
      title: 'Wat die totale verdienste tel',
      asks: ['Wat sluit totaal verdien in?', 'Hoe word my totale verdienste uitgewerk?', 'Wat tel by total earned?'],
      keywords: ['totaal verdien', 'verdienste', 'totaal', 'inkomste', 'getel', 'uitgewerk'],
      body:
        'Jou rekord tel alles van elke voltooide werk bymekaar en wys dit as jou totaal verdien.\n'
        + 'Dit tel werk wat bevestig is, ook werke wat outomaties toegeken is toe ’n werkgewer nooit bevestig het nie. Dit tel nie werke waarvoor jy aansoek gedoen het of waarmee jy nog besig is nie.\n'
        + 'Vra my “hoeveel het ek al verdien” en ek sal jou eie bedrag vir jou voorlees.',
    },
    'mark-job-done': {
      title: '’n Werk as klaar merk',
      asks: ['Hoe merk ek ’n werk as klaar?', 'Ek het die werk klaargemaak — wat nou?', 'Job is done, wat nou?'],
      keywords: ['klaar', 'klaargemaak', 'voltooi', 'merk', 'gradeer werkgewer', 'gradeer die werkgewer', 'resensie werkgewer'],
      body:
        'Maak die werk van jou Tuis-skerm oop en merk dit as klaar. Jy sal gevra word om die werkgewer uit vyf sterre te gradeer voordat jy kan — dit is die deel wat werkgewers eerlik hou, en dis hoekom ander werkers kan sien vir wie dit goed is om te werk.\n'
        + 'As iets van die werk onveilig was, is daar ’n blokkie om terselfdertyd ’n veiligheidsvlag te lig. ’n Mens lees dit.\n'
        + 'Die werkgewer word dan gevra om te bevestig. Sodra hulle dit doen, kom die werk op jou rekord met hul gradering en resensie, en jou betaling daarvoor word na jou bankrekening gestuur.',
    },
    'confirm-work': {
      title: 'Wag vir ’n werkgewer om te bevestig',
      asks: ['Die werkgewer het nie my werk bevestig nie', 'Hoe lank vat bevestiging?', 'Wat as hulle nooit bevestig nie?', 'Employer confirm nie'],
      keywords: ['bevestig', 'bevestiging', 'wag', 'hangende', 'nooit bevestig', 'outomaties vrygestel', 'vas'],
      body:
        'Nadat jy ’n werk as klaar gemerk het, het die werkgewer {autoReleaseHours} om dit te bevestig.\n'
        + 'As hulle dit nooit doen nie, word die werk in elk geval aan jou toegeken sodra daardie tyd verby is. Jy kry die inskrywing op jou rekord, die verdienste, die vordering na jou vlak — en die werkgewer se kaart word gedebiteer, so jou betaling word na jou bank gestuur. Dit word sonder ’n gradering gestoor, so hul stilte kan jou gemiddeld nie aftrek nie — of optrek nie.\n'
        + 'Dit bestaan omdat ’n werkgewer wat net ophou antwoord vroeër ’n werker se vordering permanent kon kanselleer, vir werk wat regtig gedoen is. Nou kan hulle nie.',
    },
    'post-a-job': {
      title: '’n Werk plaas',
      asks: ['Hoe plaas ek ’n werk?', 'Hoe huur ek iemand?', 'Hoe adverteer ek werk?', 'Hoe post ek ’n job?'],
      keywords: ['plaas', 'adverteer', 'huur', 'werk plaas', 'skep werk', 'iemand nodig'],
      body:
        'Tik Plaas. Jy beskryf die werk, waar dit is, hoeveel ure, en wat jy per uur betaal.\n'
        + '• Die Billike-betaling-meter wys jou terwyl jy tik hoe jou tarief vergelyk met die nasionale minimumloon van {minWage} per uur. Om minder te betaal is nie wettig nie.\n'
        + '• Voor jou eerste aanstelling voeg jy ’n kaart by. Niks word gedebiteer totdat die werk klaar is en jy dit bevestig nie.\n'
        + '• Jou werk gaan dadelik regstreeks na werkers naby jou.\n'
        + '• Jy sien almal wat aansoek doen, met hul rekord — gradering, werke voltooi, vlak en kentekens.\n'
        + 'Plaas is gratis. Wanneer ’n werk klaar is, betaal jy die werker se betaling plus ’n Vuka-fooi van {feePercent}.',
    },
    'choose-worker': {
      title: 'Kies wie om aan te stel',
      asks: ['Hoe kies ek ’n werker?', 'Hoe weet ek wie betroubaar is?', 'Wat beteken die vlakke wanneer ek huur?', 'Watter worker moet ek kies?'],
      keywords: ['kies', 'uitkies', 'aansoekers', 'betroubaar', 'vertrou', 'wie om te huur', 'talent'],
      body:
        'Elke aansoeker dra ’n rekord wat gebou is uit werk wat hulle regtig op Vuka gedoen het — hul gemiddelde gradering, hoeveel werke hulle voltooi het, hul vlak, en of hul ID geverifieer is.\n'
        + 'Die vlak is die vinnigste lees. Vertroud beteken ten minste drie voltooide werke teen ’n goeie gemiddeld sonder veiligheidsvlae. Professioneel en Elite beteken heelwat meer.\n'
        + 'Jy kan ook direk deur Talent blaai en iemand na ’n werk nooi eerder as om vir aansoeke te wag.\n'
        + 'Goed om te weet: werkers gradeer jou ook, en daardie gradering wys op jou lyste. Om werk vinnig te bevestig en te betaal wat jy geadverteer het, is wat goeie mense laat aanhou aansoek doen by jou.',
    },
    'employer-confirm': {
      title: 'Voltooide werk bevestig',
      asks: ['Hoe bevestig ek dat ’n werk klaar is?', 'Hoekom moet ek bevestig?', 'Wat gebeur as ek nie bevestig nie?', 'Hoe confirm ek die werk?'],
      keywords: ['bevestig', 'goedkeur', 'afteken', 'gradeer werker', 'klaar', 'voltooi'],
      body:
        'Wanneer ’n werker ’n werk as klaar merk, kry jy ’n kennisgewing. Maak dit oop, bevestig die werk, en gradeer hulle uit vyf met ’n kort resensie.\n'
        + 'Doen dit asseblief vinnig. Vir jou is dit ’n tik; vir hulle is dit die inskrywing op hul rekord wat die volgende vlak en die volgende soort werk ontsluit.\n'
        + 'As jy nie binne {autoReleaseHours} bevestig nie, word die werk outomaties aan die werker toegeken, sonder ’n gradering. Jou resensie is die deel wat verlore gaan, en daardie resensie is die waardevolste ding wat jy kan gee aan iemand wat ’n eerste werkgeskiedenis bou.\n'
        + 'Om te bevestig, debiteer ook jou kaart: die betaling gaan reguit na die werker se bank, plus Vuka se fooi van {feePercent}.\n'
        + '{testModeNote}',
    },
    'employer-cost': {
      title: 'Wat dit ’n werkgewer kos',
      asks: ['Wat kos dit om ’n werk te plaas?', 'Vat Vuka kommissie?', 'Hoeveel is die Vuka-fooi?', 'Is daar ’n fee vir werkgewers?'],
      keywords: ['koste', 'fooi', 'kommissie', 'heffing', 'gratis', 'prys', 'werkgewer', 'persentasie', 'fee'],
      body:
        'Om ’n werk te plaas en om aan te stel is gratis. Wanneer ’n werk klaar is, word jou kaart gedebiteer vir die werker se betaling plus ’n Vuka-fooi van {feePercent} van die betaling. Die werker kry die volle betaling; die fooi is wat Vuka aan die gang hou.\n'
        + 'Die totaal wat jy sal betaal, word op die werk gewys voordat jy aanstel.\n'
        + '{testModeNote}',
    },
    'is-it-safe': {
      title: 'Veilig bly',
      asks: ['Is Vuka veilig?', 'Hoe bly ek veilig?', 'Is dit veilig om na ’n vreemde se huis te gaan?', 'Ek voel onveilig'],
      keywords: ['veilig', 'veiligheid', 'gevaar', 'risiko', 'vreemde', 'beskerm', 'versigtig', 'onveilig'],
      body:
        'Vuka gee jou inligting om mee te oordeel, maar jy is die een wat na ’n adres reis, so die gewone voorsorg geld steeds:\n'
        + '• Kyk of die werkgewer se ID geverifieer is, en kyk na hul gradering van ander werkers.\n'
        + '• Hou die gesprek in die app. Dit is ’n rekord, en ’n mens kan dit lees as iets verkeerd loop.\n'
        + '• Sê vir iemand waarheen jy gaan en wanneer jy verwag om terug te wees.\n'
        + '• Spreek die betaling af voordat jy reis.\n'
        + '• Moet nooit iemand betaal om ’n werk te kry nie, en moet nooit jou ID of bankbesonderhede stuur vir iemand wat dit in ’n gesprek vra nie.\n'
        + 'As enigiets verkeerd voel, loop. Jy kan ’n persoon rapporteer, hulle blokkeer, en ’n veiligheidsvlag op die werk lig.',
    },
    'scam-warning': {
      title: 'As iemand jou vir geld of dokumente vra',
      asks: ['Iemand vra my geld om ’n werk te kry', '’n Werkgewer het my ID-nommer in die gesprek gevra', 'Is dit ’n swendelary?', 'Is dit ’n scam?'],
      keywords: ['swendelary', 'swendelaar', 'bedrog', 'scam', 'vra geld', 'vra my id', 'registrasiefooi', 'deposito', 'vooruit', 'pin', 'otp', 'verdag', 'vals', 'gekul'],
      body:
        'Stop, en rapporteer hulle. Dit is die patrone wat die moeite werd is om uit jou kop te ken, want elkeen is iemand wat probeer vat van ’n mens wat werk soek:\n'
        + '• Om jou te vra om enigiets te betaal — ’n registrasiefooi, ’n deposito, ’n “opleidingskoste”, vervoergeld vooruit. Vuka is gratis en geen regte werkgewer vra jou geld om te werk nie.\n'
        + '• Om jou ID-nommer, ’n foto van jou ID, of jou bankbesonderhede in ’n gesprek te vra. ’n Regte werkgewer het niks daarvan nodig om jou ’n dag se werk te gee nie. Vuka vra jou ID net binne die app, vir verifikasie, en nooit deur ’n boodskap nie.\n'
        + '• Om vir ’n OTP of ’n PIN te vra. Niemand wettig sal jou ooit daarvoor vra nie. Nie Vuka nie, nie jou bank nie, nie ’n werkgewer nie.\n'
        + '• Om jou te druk om die gesprek na ’n ander nommer te skuif en daar te betaal.\n'
        + 'Hou die gesprek in die app sodat daar ’n rekord is, blokkeer hulle, en rapporteer hulle by die Veiligheidsentrum. ’n Mens lees elke verslag.\n'
        + 'Jy het niks verkeerd gedoen deur gevra te word nie. Om dit te rapporteer beskerm die volgende persoon.',
    },
    'report-someone': {
      title: 'Iemand rapporteer',
      asks: ['Hoe rapporteer ek iemand?', 'Iemand het my nie betaal nie', 'Hoe rapporteer ek ’n swendelary?', 'Die werkgewer was onbeskof met my'],
      keywords: ['rapporteer', 'klagte', 'misbruik', 'nie betaal', 'onveilig', 'teistering', 'onbeskof', 'geskree', 'beledig', 'veiligheidsentrum', 'beroof', 'aangerand', 'gedreig', 'gesteel', 'seergemaak'],
      body:
        'Gebruik die Veiligheidsentrum onder Ek, of lig ’n vlag wanneer jy ’n werk as klaar merk.\n'
        + 'Vertel ons in jou eie woorde wat gebeur het. Verslae gaan na ’n tou wat ’n mens lees — hulle word nie deur ’n masjien hanteer nie.\n'
        + 'Rapporteer enigiemand wat jou nie betaal wat afgespreek is nie, wat jou geld vra om ’n werk te kry, wat jou ID of bankbesonderhede in ’n gesprek vra, of wat op ’n manier optree wat jou onveilig maak.\n'
        + 'Om te rapporteer bring nie jou eie rekord in gevaar nie.',
    },
    'block-someone': {
      title: 'Iemand blokkeer',
      asks: ['Hoe blokkeer ek iemand?', 'Kan ek keer dat iemand my boodskappe stuur?', 'Block iemand'],
      keywords: ['blokkeer', 'geblokkeer', 'stop boodskappe', 'ignoreer', 'demp'],
      body:
        'Maak die gesprek met daardie persoon oop en blokkeer hulle. Hulle kan jou nie meer boodskappe stuur nie, en jy sal nie boodskappe van hulle sien nie.\n'
        + 'Blokkeer is apart van rapporteer. Blokkeer stop die kontak; rapporteer sê vir ons daar is iets waarna ’n mens moet kyk. As iemand iets verkeerd gedoen het, doen albei.',
    },
    'id-verification': {
      title: 'ID-verifikasie',
      asks: ['Hoe verifieer ek my ID?', 'Wat beteken die geverifieer-merk?', 'Hoekom moet ek my identiteit verifieer?', 'Hoe word ek verified?'],
      keywords: ['id', 'identiteit', 'verifieer', 'geverifieer', 'verifikasie', 'merk', 'sa id', 'dokument'],
      body:
        'Jy kan jou Suid-Afrikaanse ID-nommer indien om geverifieer te word. Sodra ’n mens dit nagegaan het, verskyn ’n geverifieer-merk op jou profiel en verdien jy die ID Geverifieer-kenteken.\n'
        + 'Dit is opsioneel, en jy kan Vuka daarsonder gebruik. Dit is die moeite werd: ’n werkgewer wat tussen twee aansoekers kies, sal die geverifieerde een neem, en ’n werker wat besluit of hy na ’n adres toe gaan loop, sal heel anders voel oor ’n geverifieerde werkgewer.\n'
        + 'Jou ID-nommer is geïnkripteer en word nie aan ander gebruikers gewys nie. Wat hulle sien, is die geverifieer-merk, nie die nommer nie.',
    },
    'what-data': {
      title: 'Wat Vuka van jou weet',
      asks: ['Watter data hou julle oor my?', 'Wie kan my inligting sien?', 'Is my data privaat?', 'Wat doen julle met my info?'],
      keywords: ['data', 'privaatheid', 'popia', 'persoonlike inligting', 'stoor', 'wie sien', 'inligting'],
      body:
        'Vuka hou wat dit nodig het om te werk: jou naam en foonnommer, jou profiel, jou werkgeskiedenis en graderings, jou boodskappe, en — as jy gekies het om dit by te voeg — jou ID-nommer en bankbesonderhede, albei geïnkripteer.\n'
        + 'Ander gebruikers sien jou naam, jou area, jou rekord en jou kentekens. Hulle sien nie jou foonnommer, jou ID-nommer of jou bankbesonderhede nie.\n'
        + 'Die bedieners is in {hosting}.\n'
        + 'Jy het regte onder POPIA om te sien wat oor jou gehou word, om dit reg te stel, en om dit te laat uitvee. Die privaatheidskennisgewing onder Ek verduidelik hoe om te vra, en vir wie.',
    },
    'delete-account': {
      title: 'Jou rekening skrap',
      asks: ['Hoe skrap ek my rekening?', 'Kan ek my inligting laat verwyder?', 'Delete my account'],
      keywords: ['skrap', 'uitvee', 'verwyder', 'rekening toemaak', 'ophou', 'weggaan'],
      body:
        'Jy kan vra dat jou rekening en jou persoonlike inligting uitgevee word. Die privaatheidskennisgewing onder Ek het die kontak vir daardie versoek, en dit is ’n reg wat jy onder POPIA het eerder as ’n guns.\n'
        + 'Iets om eers oor te dink: om te skrap verwyder jou werkrekord, wat die reputasie is wat jy gebou het en die ding wat formele werk ontsluit. Dit kan nie van niks af herbou word nie. As jy net vir ’n ruk wil ophou, kan jy net ophou — niks verval nie.',
    },
    'chats': {
      title: 'Boodskappe stuur',
      asks: ['Hoe stuur ek iemand ’n boodskap?', 'Waar is my gesprekke?', 'Kan ek ’n stemnota stuur?', 'Kan ek ’n voice note stuur?'],
      keywords: ['gesprek', 'gesprekke', 'boodskap', 'boodskappe', 'praat', 'stemnota', 'foto', 'stuur', 'antwoord', 'whatsapp'],
      body:
        'Gesprekke is in die app, tussen jou en die mense met wie jy werk.\n'
        + '• Jy kan teks, stemnotas en foto’s stuur.\n'
        + '• ’n Stemnota is dikwels makliker as tik — veral in jou eie taal, of wanneer jy beskryf waar jy is.\n'
        + '• Boodskappe wat sonder sein geskryf is, word gestuur wanneer die sein terugkom.\n'
        + 'Hou werkgesprekke in die app eerder as om na ’n ander nommer te skuif. Dit is ’n rekord, en as iets verkeerd loop, is dit wat ’n mens wat ’n verslag nagaan, regtig kan lees.',
    },
    'notifications': {
      title: 'Kennisgewings',
      asks: ['Hoe kry ek werkwaarskuwings?', 'Hoe skakel ek kennisgewings aan?', 'Hoe stop ek kennisgewings?', 'Hoekom kry ek nie alerts nie?'],
      keywords: ['waarskuwing', 'waarskuwings', 'kennisgewing', 'kennisgewings', 'klokkie', 'demp', 'stil ure', 'alerts', 'notifications'],
      body:
        'Tik die klokkie bo-aan die skerm om elke opdatering oor jou werk, jou betaling en jou rekening te sien.\n'
        + 'Om te kies wat jou foon bereik, maak Ek oop, dan Kennisgewings. Skakel dit aan vir hierdie foon, en kies dan die soorte wat jy wil hê: boodskappe, nuwe werk naby jou, werkopdaterings, betalings en rekeningkennisgewings.\n'
        + 'Jy kan name en boodskappe van die sluitskerm af versteek, en stil ure stel sodat niks snags zoem nie. Enigiets wat jy afskakel, wag steeds onder die klokkie.\n'
        + 'As jy vroeër toestemming geweier het, laat kennisgewings vir Vuka weer toe in jou foon of blaaier se instellings. Die app kan nie ’n tweede keer vra nie.',
    },
  },
  live: {
    'my-score': { title: 'Jou Vuka Score', asks: ['Wat is my telling?', 'Hoe doen ek?', 'Wat is my Vuka Score nou?', 'Wys my score'], keywords: ['my telling', 'my score', 'my punte', 'hoe doen ek'] },
    'my-tier': { title: 'Jou vlak', asks: ['Op watter vlak is ek?', 'Wat is my vlak?', 'Hoe ver is ek van die volgende vlak?', 'My tier?'], keywords: ['my vlak', 'volgende vlak', 'hoe ver', 'my tier'] },
    'my-jobs': { title: 'Werk wat jy voltooi het', asks: ['Hoeveel werke het ek al gedoen?', 'Hoeveel werke het ek voltooi?', 'Hoeveel jobs het ek gedoen?'], keywords: ['my werke', 'werke gedoen', 'hoeveel werke', 'voltooide werke'] },
    'my-earnings': { title: 'Wat jy verdien het', asks: ['Hoeveel het ek al verdien?', 'Wat is my totale verdienste?', 'Hoeveel geld het ek gemaak?'], keywords: ['my verdienste', 'verdien', 'hoeveel het ek', 'my geld'] },
    'my-badges': { title: 'Jou kentekens', asks: ['Watter kentekens het ek?', 'Watter kentekens het ek verdien?', 'My badges?'], keywords: ['my kentekens', 'kentekens verdien', 'watter kentekens'] },
    'my-wallet': { title: 'Jou betaling', asks: ['Hoeveel is al aan my betaal?', 'Hoeveel is in my beursie?', 'Wat is my balans?', 'Hoeveel kan ek onttrek?', 'Wat is in my wallet?'], keywords: ['aan my betaal', 'al betaal', 'my betaling', 'my beursie', 'my balans', 'in my beursie', 'kan ek onttrek'] },
    'my-applications': { title: 'Werk waarvoor jy aansoek gedoen het', asks: ['Vir hoeveel werke het ek aansoek gedoen?', 'Waarvoor het ek aansoek gedoen?', 'My aansoeke?'], keywords: ['my aansoeke', 'aansoek gedoen', 'hoeveel aansoeke'] },
    'my-verification': { title: 'Of jou ID geverifieer is', asks: ['Is ek geverifieer?', 'Is my ID geverifieer?', 'Is ek al verified?'], keywords: ['is ek geverifieer', 'my verifikasie', 'my id geverifieer'] },
    'jobs-near-me': { title: 'Werk naby jou', asks: ['Watter werk is naby my?', 'Is daar nou enige werk?', 'Hoeveel werke is daar?', 'Enige jobs naby?'], keywords: ['werk naby', 'naby my', 'enige werk', 'wat is beskikbaar'] },
    'my-messages': { title: 'Jou ongelese boodskappe', asks: ['Het ek enige boodskappe?', 'Enige ongelese boodskappe?', 'Het iemand my ge-message?'], keywords: ['my boodskappe', 'ongelees', 'nuwe boodskappe', 'iemand boodskap'] },
  },
  text: {
    noRecord: 'Jy het nog nie ’n werk voltooi nie, so daar is niks op jou rekord om voor te lees nie. Jou eerste voltooide werkie begin dit — daarna vul dit vanself in.',

    'fill.tierFirst': 'die vlak waarop almal begin',
    'fill.tierReqs': '{jobs} voltooide werke, {rating} sterre of beter, geen veiligheidsvlae nie',
    'fill.tierLine': '• {icon} {name} — {entry}. Ontsluit: {unlocks}',
    'fill.categoryLine': '• {list}.',
    'fill.badgeLine': '• {icon} {label} — {desc}.',
    'fill.hours_one': '{count} uur',
    'fill.hours_other': '{count} uur',
    'fill.days_one': '{count} dag',
    'fill.days_other': '{count} dae',
    'fill.listSep': ', ',
    'fill.testMode': 'Betalings is vir nou in toetsmodus: net toetskaarte werk, en geen regte geld beweeg nog nie.',
    'fill.feeUnknown': '’n klein persentasie',
    'fill.cardCheckUnknown': '’n klein bedrag',

    'score.value': 'Jou Vuka Score is {rep} uit 100.',
    'score.built': 'Dit is gebou uit {jobs}, ’n gemiddeld van {avg} sterre, en {safety}.',
    'score.jobs_one': '{count} voltooide werk',
    'score.jobs_other': '{count} voltooide werke',
    'score.clean': '’n skoon veiligheidsrekord',
    'score.flags_one': '{count} veiligheidsvlag',
    'score.flags_other': '{count} veiligheidsvlae',
    'score.flagHolding': 'Die vlag is wat dit terughou, en dit keer ook jou volgende vlak.',
    'score.strong': 'Dis ’n sterk rekord. Werkgewers wat na talent kyk, sal jou naby die bopunt sien.',

    'tier.youAre': 'Jy is {icon} {name} — {tagline}.',
    'tier.unlocks': 'Dit ontsluit: {unlocks}',
    'tier.top': 'Dit is die bopunt van The Ladder. Daar is niks hoër nie.',
    'tier.next': 'Volgende is {icon} {name}.',
    'tier.needJobs_one': 'nog {count} voltooide werk',
    'tier.needJobs_other': 'nog {count} voltooide werke',
    'tier.needRating': '’n gemiddeld van {rating} sterre of beter — joune is {avg}',
    'tier.needClean': '’n skoon rekord — ’n veiligheidsvlag keer dit',
    'tier.allMet': 'Jy voldoen aan elke voorwaarde daarvoor.',
    'tier.stillNeed': 'Jy het nog {list} nodig.',
    'tier.and': ', en ',

    'jobs.done_one': 'Jy het {count} werk op Vuka voltooi, oor {kinds}, teen ’n gemiddeld van {avg} sterre.',
    'jobs.done_other': 'Jy het {count} werke op Vuka voltooi, oor {kinds}, teen ’n gemiddeld van {avg} sterre.',
    'jobs.kinds_one': '{count} soort werk',
    'jobs.kinds_other': '{count} soorte werk',

    'earn.total_one': 'Jy het {amount} verdien uit {count} voltooide werk, getel uit die betaling wat elke werk gelys het. Wat reeds aan jou betaal is, is ’n aparte bedrag — vra my “hoeveel is al aan my betaal”.',
    'earn.total_other': 'Jy het {amount} verdien uit {count} voltooide werke, getel uit die betaling wat elke werk gelys het. Wat reeds aan jou betaal is, is ’n aparte bedrag — vra my “hoeveel is al aan my betaal”.',

    'badges.none': 'Jy het nog nie ’n kenteken verdien nie. Die eerste een, Eerste Werk, kom sodra jou eerste werkie bevestig is.',
    'badges.earned': 'Jy het {earned} van {total} kentekens verdien: {list}.',
    'badges.item': '{icon} {label}',
    'badges.missing': 'Kom nog: {list}.',
    'badges.missingItem': '{label}, {desc}',
    'badges.missingSep': '; ',

    'wallet.loading': 'Jou beursie laai nog. Vra my weer oor ’n oomblik, of maak Ek oop, dan My beursie.',
    'wallet.error': 'Ek kon nie nou jou beursie lees nie. Maak Ek oop, dan My beursie, om dit te sien.',
    'wallet.balance': 'Jy het {amount} in jou beursie, gereed om na jou bank te onttrek.',
    'wallet.empty': 'Jou beursie is nou leeg.',
    'wallet.pending': 'Nog {amount} is verseker op werk wat jy doen. Dit kom aan wanneer elkeen bevestig is.',
    'wallet.howLands': 'Betaling kom hier aan wanneer ’n werkgewer ’n werk bevestig wat jy gedoen het.',
    'wallet.test': 'Betalings is vir nou in toetsmodus, so geen regte geld het nog geskuif nie.',

    'pay.loading': 'Jou betalings laai nog. Vra my weer oor ’n oomblik, of maak Ek oop, dan My betaling.',
    'pay.error': 'Ek kon nie nou jou betalings lees nie. Maak Ek oop, dan My betaling, om hulle te sien.',
    'pay.paid': '{amount} is tot dusver vir jou werke in jou bankrekening betaal.',
    'pay.none': 'Niks is nog aan jou betaal nie.',
    'pay.waiting': 'Nog {amount} wag om betaal te word. Maak Ek oop, dan My betaling, om te sien hoekom.',
    'pay.howLands': 'Wanneer ’n werkgewer ’n werk bevestig wat jy gedoen het, gaan jou betaling reguit na jou bankrekening.',

    'apps.none': 'Jy het nog vir niks aansoek gedoen nie. Vind werk wys die werkies naby jou, en aansoek doen is een tik.',
    'apps.some_one': 'Jy het vir {count} werkie aansoek gedoen. Werkgewers sien almal wat aansoek gedoen het en kies uit hulle, so dis normaal as jy nie van een terughoor nie — hou aan aansoek doen.',
    'apps.some_other': 'Jy het vir {count} werkies aansoek gedoen. Werkgewers sien almal wat aansoek gedoen het en kies uit hulle, so dis normaal as jy nie van een terughoor nie — hou aan aansoek doen.',

    'verified.yes': 'Ja — jou identiteit is geverifieer, en die geverifieer-merk wys op jou profiel. Dis een van die eerste dinge waarna die ander kant kyk.',
    'verified.no': 'Nog nie. Jy kan jou Suid-Afrikaanse ID-nommer onder Ek indien om geverifieer te word. Dis opsioneel, maar ’n werkgewer wat tussen twee mense kies, sal die geverifieerde een neem.',

    'near.none': 'Daar is op die oomblik niks in jou lys nie. Nuwe werkies word deur die dag geplaas — skakel Nuwe werk naby my aan onder Ek, dan Kennisgewings, en jou foon sal jou laat weet sodat jy nie self hoef te kyk nie.',
    'near.some_one': 'Daar is nou {count} werkie in jou lys, die naaste eerste. Maak Vind werk oop om dit te sien.',
    'near.some_other': 'Daar is nou {count} werkies in jou lys, die naaste eerste. Maak Vind werk oop om hulle te sien.',

    'messages.none': 'Jy het geen ongelese boodskappe nie. Enigiets nuuts van ’n werkgewer sal in Gesprekke verskyn, en jou foon kan jou laat weet as Boodskappe aan is onder Ek, dan Kennisgewings.',
    'messages.some_one': 'Jy het {count} ongelese boodskap wat in Gesprekke wag.',
    'messages.some_other': 'Jy het {count} ongelese boodskappe wat in Gesprekke wag.',
  },
};
