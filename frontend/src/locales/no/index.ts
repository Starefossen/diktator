import { auth } from "./auth";
import { family } from "./family";
import { wordsets } from "./wordsets";
import { common } from "./common";
import { profile } from "./profile";
import { results } from "./results";

export const no = {
  ...auth,
  ...family,
  ...wordsets,
  ...common,
  ...profile,
  ...results,

  // Home page
  "home.welcome": "Velkommen til Diktator!",
  "home.subtitle":
    "En morsom og interaktiv stavepraksis-app designet spesielt for barn",
  "home.api.checking": "Sjekker API...",
  "home.api.connected": "API tilkoblet",
  "home.api.disconnected": "API frakoblet",
  "home.wordsets.title": "Ordsett",
  "home.wordsets.desc":
    "Opprett og administrer tilpassede ordsett, og ta staveprøver for å følge fremgangen din!",
  "home.wordsets.button": "Utforsk ordsett",
  "home.practice.title": "Start å øve",
  "home.practice.desc":
    "Øv på staving med våre interaktive ordspill og forbedre ferdighetene dine!",
  "home.practice.button": "Begynn øving",
  "home.about.title": "Lær mer",
  "home.about.desc":
    "Oppdag hvordan Diktator kan hjelpe barn med å utvikle bedre staveferdigheter.",
  "home.about.button": "Om oss",

  // Home features section
  "home.features.title": "Klar for øving!",
  "home.features.subtitle":
    "Avansert stavingsøving med lydtilbakemelding og profesjonell brukeropplevelse.",
  "home.features.auth": "Firebase autentisering",
  "home.features.database": "Firestore database",
  "home.features.i18n": "Flerspråklig støtte (EN/NO)",
  "home.features.wordsets": "Tilpassede ordsett og tester",
  "home.features.profiles": "Brukerprofiler og statistikk",
  "home.features.tts": "Talesyntese (TTS)",
  "home.features.results": "Testresultater sporing",
  "home.features.emulators": "Firebase emulatorer",
  "home.nextPhase.title": "Klar for fase 2:",
  "home.nextPhase.desc":
    "Tilpassede ordsett, familiedeling og avansert analyse",
  "home.nextPhase.command": "Start utvikling",
  "home.phaseComplete.title": "Fullstendig utstyrt!",
  "home.phaseComplete.desc":
    "Alle kjernefunksjoner er klare for en optimal stavingsøvingsopplevelse",
  "home.phaseComplete.features":
    "✨ Lydtilbakemelding, visuelle animasjoner, fremdriftssporing og responsivt design",

  // Development progress section
  "home.progress.title": "Utviklingsfremdrift",
  "home.progress.subtitle":
    "Følg vår reise mot den ultimate stavingsøvingsappen",

  // Phase 0
  "home.progress.phase0.title": "Grunnlag",
  "home.progress.phase0.subtitle": "Grunnleggende infrastruktur",
  "home.progress.phase0.point1": "Next.js + TypeScript oppsett",
  "home.progress.phase0.point2": "Google Cloud distribusjon",
  "home.progress.phase0.point3": "CI/CD-pipeline etablert",

  // Phase 1
  "home.progress.phase1.title": "Autentisering",
  "home.progress.phase1.subtitle": "Brukerbehandling",
  "home.progress.phase1.point1": "Firebase autentisering",
  "home.progress.phase1.point2": "Beskyttede ruter og sikkerhet",
  "home.progress.phase1.point3": "Brukerprofiler og familier",

  // Phase 2
  "home.progress.phase2.title": "Kjernefunksjoner",
  "home.progress.phase2.subtitle": "Stavingsøving",
  "home.progress.phase2.point1": "Ordsettbehandling",
  "home.progress.phase2.point2": "Tekst-til-tale integrasjon",
  "home.progress.phase2.point3": "Interaktive stavingstester",

  // Phase 3
  "home.progress.phase3.title": "Avansert",
  "home.progress.phase3.subtitle": "Polering og analyse",
  "home.progress.phase3.point1": "Fremdriftsanalyse",
  "home.progress.phase3.point2": "Spillifiseringssystem",
  "home.progress.phase3.point3": "Ytelsesoptimalisering",

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

  // Practice page
  "practice.title": "Stavepraksis",
  "practice.subtitle": "Velg et ordsett for å øve på staveferdigheter",
  "practice.noWordSets": "Ingen ordsett tilgjengelig",
  "practice.createFirst": "Opprett ditt første ordsett for å begynne å øve",
  "practice.createWordSet": "Opprett ordsett",
  "practice.start": "Start øving",
  "practice.clickToHear": "Klikk for å høre ordet",
  "practice.playAgain": "Klikk for å høre igjen",
  "practice.typeHere": "Skriv ordet her...",
  "practice.checkAnswer": "Sjekk svar",
  "practice.correct": "Riktig!",
  "practice.incorrect": "Ikke helt riktig",
  "practice.correctSpelling": "Korrekt staving",
  "practice.yourAnswer": "Ditt svar",
  "practice.nextWordSoon": "Går til neste ord...",
  "practice.practiceComplete": "Øving fullført!",
  "practice.correctSoFar": "Riktige så langt",
  "practice.attempt": "Forsøk",
  "practice.attemptsLeft": "forsøk igjen",
  "practice.tryAgain": "Prøv igjen",
  "practice.maxAttemptsReached": "Maks forsøk nådd",
  "practice.configuration.title": "Test konfigurasjon",
  "practice.configuration.maxAttempts": "Maks forsøk per ord",
  "practice.configuration.showCorrectAnswer": "Vis riktig svar etter feil",
  "practice.configuration.autoAdvance": "Auto-fortsett etter riktig svar",

  // Profile page
  "profile.title": "Min profil",
  "profile.loading": "Laster profil...",
  "profile.correct": "Riktig",
  "profile.stats.testsCompleted": "Tester fullført",
  "profile.stats.averageScore": "Gjennomsnittlig poengsum",
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
  "results.stats.averageScore": "Gjennomsnittlig poengsum",
  "results.stats.bestScore": "Best poengsum",
  "results.stats.timeSpent": "Tid brukt",

  // Common translations
  "common.loading": "Laster...",
  "common.of": "av",
};
