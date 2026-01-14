export const test = {
  // Test modes (unified) - child-friendly names
  "modes.letterTiles": "Build It",
  "modes.letterTiles.desc": "Arrange scrambled letters",
  "modes.wordBank": "Pick Words",
  "modes.wordBank.desc": "Tap words to build sentences",
  "modes.keyboard": "Type It",
  "modes.keyboard.desc": "Type the full spelling",
  "modes.missingLetters": "Fill the Gap",
  "modes.missingLetters.desc": "Complete the blanks",
  "modes.flashcard": "Quick Look",
  "modes.flashcard.desc": "See, countdown, self-check",
  "modes.lookCoverWrite": "Memory Spell",
  "modes.lookCoverWrite.desc": "Memorize then type",
  "modes.translation": "Switch Languages",
  "modes.translation.desc": "Type in other language",

  // Mode selector
  "modeSelector.title": "Choose how to practice",
  "modeSelector.recommended": "Recommended",
  "modeSelector.unavailable": "Not available",
  "modeSelector.unavailable.noTranslations": "Add translations first",
  "modeSelector.unavailable.singleWordOnly": "Single words only",
  "modeSelector.unavailable.sentenceOnly": "Sentences only",

  // Flashcard mode specific
  "flashcard.show": "Look at the word...",
  "flashcard.countdown": "Can you spell it?",
  "flashcard.reveal": "Did you know it?",
  "flashcard.yes": "Yes",
  "flashcard.no": "No",
  "flashcard.verify": "Type to verify",
  "flashcard.verifyPlaceholder": "Type the word to confirm...",

  // Look-Cover-Write mode specific
  "lookCoverWrite.look": "Study the word...",
  "lookCoverWrite.cover": "Can you remember it?",
  "lookCoverWrite.ready": "Ready!",
  "lookCoverWrite.write": "Type the word",
  "lookCoverWrite.check": "Let's check!",
  "lookCoverWrite.yourAnswer": "Your answer",
  "lookCoverWrite.correct": "Correct",

  // Missing letters mode specific
  "missingLetters.instruction": "Fill in the missing letters",
  "missingLetters.letterMissing": "letter missing",
  "missingLetters.lettersMissing": "letters missing",
  "missingLetters.letterInput": "Letter input",

  // Test progress and navigation
  "test.progress": "Word",
  "test.complete": "Test Complete",
  "test.score": "Score",
  "test.correct": "Correct",
  "test.xpEarned": "XP Earned",
  "test.totalXp": "Total XP",
  "test.progressToNext": "Progress to next level",
  "test.xpToGo": "XP to go",
  "test.reviewResults": "Review Results",
  "test.yourAnswer": "Your answer",
  "test.restart": "Restart Test",
  "test.tryAgain": "Again!",
  "test.backToWordSets": "Back to Word Sets",
  "test.cancel": "Cancel",
  "test.exitConfirm": "Exit Test?",
  "test.exitConfirmMessage":
    "You have {{correct}} out of {{total}} correct so far. If you exit now, you will lose your progress.",
  "test.exitConfirmButton": "Yes, Exit",
  "test.continueTest": "No, Continue",

  // Test interface
  "test.listenToWordMobile": "Tap to hear",
  "test.listenToWord": "Click to hear the word",
  "test.incorrect": "Not quite...",
  "test.typeWordHere": "Type the word here...",
  "test.attemptsRemaining": "attempts remaining",
  "test.playAgain": "Play Again",
  "test.nextMobile": "Next",
  "test.finishMobile": "Finish",
  "test.nextWord": "Next Word",
  "test.finishTest": "Finish Test",
  "test.backMobile": "Back",
  "test.correctSoFar": "Correct so far",

  // Context/definition
  "test.context": "Context:",

  // Translation mode
  "test.translateWord": "Translate",
  "test.typeTranslationHere": "Type the translation here...",
  "test.translateToTarget": "Translate to",
  "test.translateToSource": "Translate to",

  // Graduated success messages (with {score} interpolation)
  "test.results.excellent":
    "Amazing! {score}% correct! You're a spelling star!",
  "test.results.great":
    "Great job! {score}% — you're really getting the hang of this!",
  "test.results.good": "Good effort! {score}% — practice makes perfect!",
  "test.results.keepGoing":
    "Keep going! {score}% — every word you learn is progress!",
  "test.results.testComplete": "Test Complete!",
  "test.results.ofCorrect": "{correct} of {total} correct",
  "test.results.firstTry": "1st try",
  "test.results.secondTry": "2nd try",
  "test.results.thirdPlusTries": "3+ tries",
  "test.results.failed": "Failed",

  // Spelling feedback
  "test.feedback.correct": "Nailed it!",
  "test.feedback.wrong": "Not quite",
  "test.feedback.missing": "Missing",
  "test.feedback.almostThere": "So close!",
  "test.feedback.correctAnswer": "The answer was",

  // Spelling hints (Norwegian Bokmål patterns - still relevant for learning Norwegian)
  "test.hint.doubleConsonant": "Check if there should be a double consonant",
  "test.hint.silentH": "Remember the silent h at the beginning?",
  "test.hint.silentD": "The d at the end is silent, but must be written",
  "test.hint.silentG": "The g is silent in -ig/-lig endings",
  "test.hint.silentV": "The v is silent before l",
  "test.hint.silentT": "The t is often silent in -et endings",
  "test.hint.kjSkjSj": "Listen carefully - is it kj, skj or sj?",
  "test.hint.gjHjJ": "Listen carefully - is it gj, hj or j?",
  "test.hint.palatalization":
    "K and sk are pronounced differently before i and y",
  "test.hint.vowelAeE": "Check the vowel - æ or e?",
  "test.hint.diphthong": "Check the diphthong - ei or ai?",
  "test.hint.retroflex": "Rs is pronounced as one sound",
  "test.hint.velarNg": "Ng is one sound - not double g",
  "test.hint.compound": "This is a compound word - write it as one word",
  "test.hint.transposition": "Two letters are swapped",
  "test.hint.missingLetter": "A letter is missing",
  "test.hint.extraLetter": "There is an extra letter",
  "test.hint.keyboardTypo": "Check for typing errors",
  "test.hint.almostCorrect": "Almost correct! Check carefully",

  // Challenge modes (progressive input)
  "challenge.letterTiles": "Letter Tiles",
  "challenge.wordBank": "Word Bank",
  "challenge.keyboard": "Keyboard",
  "challenge.answerArea": "Answer area - tap letters to remove",
  "challenge.availableLetters": "Available letters - tap to place",
  "challenge.removeLetter": "Remove letter",
  "challenge.emptySlot": "Empty slot",
  "challenge.placeLetter": "Place letter",
  "challenge.clear": "Clear",
  "challenge.clearAll": "Clear all letters",
  "challenge.check": "Check",
  "challenge.currentAnswer": "Current answer",
  "challenge.noLettersPlaced": "No letters placed yet",
  "challenge.sentenceArea": "Sentence area - tap words to remove",
  "challenge.availableWords": "Available words - tap to add",
  "challenge.removeWord": "Remove word",
  "challenge.addWord": "Add word",
  "challenge.currentSentence": "Current sentence",
  "challenge.noWordsSelected": "No words selected yet",
  "challenge.masteryProgress": "Mastery Progress",
  "challenge.practiceAgain": "Practice Again",
  "challenge.modeUnlocked": "Mode unlocked!",
  "challenge.tryWordBank": "Try Word Bank now",
  "challenge.tryKeyboard": "Try Keyboard now",

  // Mastery input method selector
  "mastery.letterTiles": "Letter Tiles",
  "mastery.letterTiles.desc": "Tap letters to spell the word",
  "mastery.wordBank": "Word Bank",
  "mastery.wordBank.desc": "Select words to build the sentence",
  "mastery.keyboard": "Keyboard",
  "mastery.keyboard.desc": "Type your answer",
  "mastery.selectMethod": "Select input method",
  "mastery.recommended": "Recommended",
  "mastery.replayMode": "Replay mode",

  // Sentence feedback
  "test.sentence.perfect": "Perfect! Every word is correct!",
  "test.sentence.almostPerfect": "Almost perfect! Just a few small errors.",
  "test.sentence.goodProgress": "Good progress! Keep practicing.",
  "test.sentence.keepTrying": "Keep trying! You got some words right.",
  "test.sentence.tryAgain": "Try again! Listen carefully to each word.",
  "test.sentence.wordsCorrect": "words correct",
  "test.sentence.extraWords": "Extra words:",
  "test.correctAnswer": "Correct answer:",

  // Sentence difficulty levels
  "sentence.difficulty.beginner": "Simple",
  "sentence.difficulty.intermediate": "Medium",
  "sentence.difficulty.advanced": "Advanced",
};
