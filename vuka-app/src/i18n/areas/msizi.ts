/**
 * msizi: what Msizi says about its own voice, in all five languages. Keys
 * start with "msizi.x." (locales/en.ts already has "msizi.*" keys). The
 * language name arrives as {language} in its own spelling ("isiZulu"), so the
 * Nguni and Sesotho lines name it after a colon rather than bolting a noun
 * prefix onto it. Not written by first-language speakers.
 */
export const msizi = {
  en: {
    'msizi.x.noVoiceOut': 'Your phone has no {language} voice, so I answer in writing.',
    'msizi.x.noSpeechLang': "I couldn't make out any {language}. Your phone may not understand spoken {language} yet — you can type instead, and I understand it in writing.",
  },
  zu: {
    'msizi.x.noVoiceOut': 'Ifoni yakho ayinalo izwi lolimi: {language}. Ngakho ngiphendula ngokubhala.',
    'msizi.x.noSpeechLang': 'Angizwanga lutho olimini: {language}. Kungenzeka ifoni yakho ingakakwazi ukuzwa lolu limi uma lukhulunywa — ungabhala esikhundleni salokho, ngiyaluzwa uma lubhaliwe ({language}).',
  },
  xh: {
    'msizi.x.noVoiceOut': 'Ifowuni yakho ayinalo ilizwi lolwimi: {language}. Ngoko ndiphendula ngokubhala.',
    'msizi.x.noSpeechLang': 'Andivanga nto kulwimi: {language}. Ifowuni yakho isenokungakwazi ukuva olu lwimi xa luthethwa okwangoku — ungabhala endaweni yoko, ndiyaluqonda xa lubhaliwe ({language}).',
  },
  st: {
    'msizi.x.noVoiceOut': 'Fono ya hao ha e na lentswe la puo: {language}. Kahoo ke araba ka ho ngola.',
    'msizi.x.noSpeechLang': 'Ha ke a utlwa letho ka puo: {language}. Mohlomong fono ya hao ha e so utlwisise puo ena ha e buuwa — o ka ngola ho e na le moo, ke e utlwisisa ha e ngotswe ({language}).',
  },
  af: {
    'msizi.x.noVoiceOut': 'Jou foon het geen {language}-stem nie, so ek antwoord skriftelik.',
    'msizi.x.noSpeechLang': 'Ek kon geen {language} uitmaak nie. Jou foon verstaan dalk nog nie gesproke {language} nie — jy kan eerder tik; ek verstaan dit geskryf.',
  },
};
