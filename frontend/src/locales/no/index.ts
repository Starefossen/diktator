import { auth } from "./auth";
import { family } from "./family";
import { wordsets } from "./wordsets";
import { common } from "./common";
import { profile } from "./profile";
import { results } from "./results";
import { test } from "./test";
import { aria } from "./aria";

export const no = {
  ...auth,
  ...family,
  ...wordsets,
  ...common,
  ...profile,
  ...results,
  ...test,
  ...aria,

  // Home page
  "home.welcome": "Velkommen til Diktator!",
  "home.subtitle":
    "En morsom og interaktiv stavepraksis-app designet spesielt for barn",
  "home.wordsets.title": "Ordsett",
  "home.wordsets.desc":
    "Opprett og administrer tilpassede ordsett, og ta staveprøver for å følge fremgangen din!",
  "home.wordsets.button": "Utforsk ordsett",
  "home.about.title": "Lær mer",
  "home.about.desc":
    "Oppdag hvordan Diktator kan hjelpe barn med å utvikle bedre staveferdigheter.",
  "home.about.button": "Om oss",

  // Home features section
  "home.features.title": "Klar for øving!",
  "home.features.subtitle":
    "Avansert stavingsøving med lydtilbakemelding og profesjonell brukeropplevelse.",

  // New section translations
  "home.demo.title": "Slik fungerer det",
  "home.demo.subtitle": "Enkle steg for å øve på staving",
  "home.demo.step1.title": "Opprett ordsett",
  "home.demo.step1.desc": "Legg til ord for øving på norsk eller engelsk",
  "home.demo.step2.title": "Lytt og skriv",
  "home.demo.step2.desc": "Hør uttale og øv på staving",
  "home.demo.step3.title": "Følg fremgang",
  "home.demo.step3.desc": "Se resultater og forbedring over tid",
  "home.demo.cta.title": "Klar til å prøve?",
  "home.demo.cta.desc": "Opprett ditt første ordsett for å begynne å øve",
  "home.demo.cta.button": "Kom i gang",

  "home.benefits.title": "Perfekt for familier",
  "home.benefits.subtitle": "Designet for foreldre og barn som lærer sammen",
  "home.benefits.parents.title": "For foreldre",
  "home.benefits.parents.1": "Følg barnets stavefremgang",
  "home.benefits.parents.2": "Opprett tilpassede ordlister",
  "home.benefits.parents.3": "Trygt, reklamefritt miljø",
  "home.benefits.children.title": "For barn",
  "home.benefits.children.1": "Morsom, spillaktig opplevelse",
  "home.benefits.children.2": "Lyduttale for hvert ord",
  "home.benefits.children.3": "Umiddelbar tilbakemelding på svar",
  "home.benefits.family.title": "For familien",
  "home.benefits.family.1": "Del ordsett på tvers av kontoer",
  "home.benefits.family.2": "Flere barneprofiler støttes",
  "home.benefits.family.3": "Selvpasert læring for hvert barn",

  "home.pwa.title": "Installer som app",
  "home.pwa.subtitle":
    "Legg til på hjemskjermen for rask tilgang og frakoblet øving",
  "home.pwa.feature1.title": "Hjemskjermtilgang",
  "home.pwa.feature1.desc": "Start fra hjemskjermen din",
  "home.pwa.feature2.title": "Frakoblet modus",
  "home.pwa.feature2.desc": "Øv uten internettforbindelse",
  "home.pwa.feature3.title": "App-grensesnitt",
  "home.pwa.feature3.desc": "Fullskjerm app-opplevelse",
  "home.pwa.footer":
    "Tilgjengelig på iOS, Android og desktop • Ingen appbutikk nødvendig",

  "home.start.title": "Start læring",
  "home.start.desc": "Øv på staving med lyduttale og fremgangssporing",
  "home.start.feature1": "Lyduttale for hvert ord",
  "home.start.feature2": "Umiddelbar tilbakemelding og poenggiving",
  "home.start.feature3": "Fremgangssporing og analyse",
  "home.start.button": "Kom i gang",

  "home.about.tech1": "Moderne PWA-teknologi",
  "home.about.tech2": "Norsk og engelsk støtte",
  "home.about.tech3": "Familievennlig design",

  "home.cta.title": "Start stavingsøving",
  "home.cta.subtitle": "Opprett ordsett og øv med lyduttale",
  "home.cta.button": "Kom i gang",
  "home.cta.continue": "Fortsett læring",
  "home.cta.footer": "Ingen nedlastinger nødvendig • Fungerer på alle enheter",

  // Footer
  "footer.tagline": "Gjør staving morsomt for barn",

  // Existing features
  "home.features.i18n": "Flerspråklig støtte (EN/NO)",
  "home.features.profiles": "Brukerprofiler og statistikk",
  "home.features.tts": "Talesyntese (TTS)",
  "home.features.tts.desc": "Profesjonell tekst-til-tale uttale",
  "home.features.results": "Testresultater sporing",
  "home.features.results.desc": "Fremgangssporing og detaljerte resultater",
  "home.features.profiles.desc": "Familiekontoer med individuell sporing",
  "home.features.i18n.desc": "Norsk og engelsk språkstøtte",

  // About page
  "about.title": "Om Diktator",
  "about.what.title": "Hva er Diktator?",
  "about.what.desc":
    "Diktator er en morsom og interaktiv stavepraksis-applikasjon designet spesielt for barn. Vårt mål er å gjøre ståvelæring hyggelig og engasjerende gjennom moderne webteknologi.",
  "about.features.title": "Funksjoner",
  "about.feature.1": "Interaktiv stavepraksis med umiddelbar tilbakemelding",
  "about.feature.2": "Lyduttalelse for hvert ord",
  "about.feature.3": "Poengsporing for å overvåke fremgang",
  "about.feature.4": "Moderne, responsivt design som fungerer på alle enheter",
  "about.feature.5": "Single Page Application for smidig navigering",
  "about.feature.6": "Lydtilbakemelding med suksess-toner og feil-lyder",
  "about.feature.7": "Profesjonelle spinner-animasjoner under lydavspilling",
  "about.feature.8":
    "Layout-stabilitet uten forstyrrende grensesnitt-endringer",
  "about.feature.9": "Automatisk ord-repetisjon for feil svar",
  "about.feature.10": "Enhetlige input/tilbakemelding-containere for ren UX",
  "about.tech.title": "Teknologistakk",
  "about.tech.frontend": "Frontend",
  "about.tech.backend": "Backend",
  "about.development.title": "Utvikling",
  "about.development.desc":
    "Denne applikasjonen er bygget med moderne utviklingspraksis inkludert Infrastructure as Code (Terraform), automatiserte CI/CD-pipelines (GitHub Actions), og strømlinjeformet lokal utvikling med mise for oppgavehåndtering.",

  // Profile page
  "profile.title": "Min profil",
  "profile.loading": "Laster profil...",
  "profile.correct": "Riktig",
  "profile.stats.testsCompleted": "Tester fullført",
  "profile.stats.averageScore": "Gjennomsnitt",
  "profile.stats.totalWords": "Totalt ord",
  "profile.stats.correctWords": "Riktige ord",
  "profile.recentResults": "Nylige resultater",
  "profile.noResults": "Ingen testresultater ennå",
  "profile.noResults.subtitle":
    "Fullfør noen stavetester for å se fremgangen din her",

  // Test page
  "test.title": "Stavetest",
  "test.loading": "Laster test...",
  "test.notFound": "Ordsett ikke funnet",
  "test.wordNotFound": "Ordsett ikke funnet",
  "test.progress": "Fremgang",
  "test.of": "av",
  "test.listen": "Lytt",
  "test.listenToWord": "Klikk for å høre ordet",
  "test.typeAnswer": "Skriv ditt svar...",
  "test.typeWordHere": "Skriv ordet her...",
  "test.submit": "Send inn",
  "test.correct": "Riktig!",
  "test.incorrect": "Feil",
  "test.showCorrect": "Riktig svar:",
  "test.yourAnswer": "Ditt svar var",
  "test.nextWord": "Neste ord",
  "test.tryAgain": "Prøv igjen",
  "test.playAgain": "Spill igjen",
  "test.attemptsRemaining": "forsøk gjenstår",
  "test.finalAttempt": "Siste forsøk",
  "test.complete": "Test fullført!",
  "test.score": "Din poengsum",
  "test.timeSpent": "Tid brukt",
  "test.correctAnswers": "Riktige svar",
  "test.correctSoFar": "Riktige så langt",
  "test.backToWordSets": "Tilbake til ordsett",
  "test.retakeTest": "Ta testen på nytt",
  "test.restart": "Start på nytt",
  "test.finishTest": "Fullfør test",
  "test.reviewResults": "Se resultater",
  "test.listenToWordMobile": "Trykk for å høre",
  "test.nextMobile": "Neste",
  "test.finishMobile": "Ferdig",
  "test.backMobile": "Tilbake",
  "test.attempts": "forsøk",
  "test.scoreBreakdown": "Poengoversikt",
  "test.firstAttempt": "1. forsøk",
  "test.secondAttempt": "2. forsøk",
  "test.thirdAttempt": "3+ forsøk",
  "test.failed": "Feil",
  "test.perfectScore": "Perfekt! Alle ord riktig på første forsøk!",

  // Results page
  "results.title": "Testresultater",
  "results.subtitle": "Se din stavetesthistorie og fremgang",
  "results.loading": "Laster resultater...",
  "results.noResults": "Ingen testresultater ennå",
  "results.noResults.subtitle":
    "Fullfør noen stavetester for å se resultatene dine her",
  "results.startFirst": "Ingen testresultater ennå",
  "results.startFirstTest": "Start din første test",
  "results.score": "Poengsum",
  "results.words": "Ord",
  "results.time": "Tid",
  "results.date": "Dato",
  "results.word": "ord",
  "results.incorrect": "Feil ord",
  "results.correct": "Riktig",
  "results.avg": "Snitt",
  "results.wordsToPractice": "Ord å øve på",
  "results.recentTests": "Nylige tester",
  "results.spellingChampion": "Stavemester!",
  "results.averageAbove90": "Din gjennomsnittsscore er over 90%",
  "results.dedicatedLearner": "Dedikert elev!",
  "results.completedTests": "Du har fullført",
  "results.tests": "tester",
  "results.stats.totalTests": "Totale tester",
  "results.stats.averageScore": "Gjennomsnitt",
  "results.stats.bestScore": "Best poengsum",
  "results.stats.timeSpent": "Tid brukt",

  // Common translations
  "common.loading": "Laster...",
  "common.of": "av",
};
