import { auth } from "./auth";
import { family } from "./family";
import { wordsets } from "./wordsets";
import { common } from "./common";
import { profile } from "./profile";
import { results } from "./results";
import { test } from "./test";
import { aria } from "./aria";

export const en = {
  ...auth,
  ...family,
  ...wordsets,
  ...common,
  ...profile,
  ...results,
  ...test,
  ...aria,

  // Home page
  "home.welcome": "Welcome to Diktator!",
  "home.subtitle":
    "A fun and interactive spelling practice app designed especially for children",

  // Home features section
  "home.features.title": "Ready to Practice!",
  "home.features.subtitle":
    "Advanced spelling practice with audio feedback and professional user experience.",

  // New section translations
  "home.demo.title": "How It Works",
  "home.demo.subtitle": "Simple steps to practice spelling",
  "home.demo.step1.title": "Create Word Sets",
  "home.demo.step1.desc": "Add words for practice in Norwegian or English",
  "home.demo.step2.title": "Listen & Type",
  "home.demo.step2.desc": "Hear pronunciation and practice spelling",
  "home.demo.step3.title": "Track Progress",
  "home.demo.step3.desc": "View results and improvement over time",
  "home.demo.cta.title": "Ready to try?",
  "home.demo.cta.desc": "Create your first word set to begin practicing",
  "home.demo.cta.button": "Get Started",

  "home.benefits.title": "Perfect for Families",
  "home.benefits.subtitle":
    "Designed for parents and children learning together",
  "home.benefits.parents.title": "For Parents",
  "home.benefits.parents.1": "Track your child's spelling progress",
  "home.benefits.parents.2": "Create custom word lists",
  "home.benefits.parents.3": "Safe, ad-free environment",
  "home.benefits.children.title": "For Children",
  "home.benefits.children.1": "Fun, game-like experience",
  "home.benefits.children.2": "Audio pronunciation for every word",
  "home.benefits.children.3": "Immediate feedback on answers",
  "home.benefits.family.title": "For the Family",
  "home.benefits.family.1": "Share word sets across accounts",
  "home.benefits.family.2": "Multiple child profiles supported",
  "home.benefits.family.3": "Self-paced learning for each child",

  "home.pwa.title": "Install as App",
  "home.pwa.subtitle":
    "Add to your home screen for quick access and offline practice",
  "home.pwa.feature1.title": "Home Screen Access",
  "home.pwa.feature2.title": "Offline Mode",
  "home.pwa.feature3.title": "App Interface",
  "home.pwa.footer":
    "Available on iOS, Android, and desktop • No app store required",

  "home.cta.title": "Start Practicing Spelling",
  "home.cta.subtitle": "Create word sets and practice with audio pronunciation",
  "home.cta.button": "Get Started",
  "home.cta.continue": "Continue Learning",
  "home.cta.footer": "No downloads required • Works on all devices",

  // Footer
  "footer.tagline": "Making spelling practice fun for kids",

  // Existing features
  "home.features.i18n": "Multilingual Support (EN/NO)",
  "home.features.profiles": "User Profiles & Statistics",
  "home.features.tts": "Speech Synthesis (TTS)",
  "home.features.tts.desc": "Professional text-to-speech pronunciation",
  "home.features.results": "Test Results Tracking",
  "home.features.results.desc": "Progress tracking and detailed results",
  "home.features.profiles.desc": "Family accounts with individual tracking",
  "home.features.i18n.desc": "Norwegian and English language support",

  // About page
  "about.title": "About Diktator",
  "about.what.title": "What is Diktator?",
  "about.what.desc":
    "Diktator is a fun and interactive spelling practice application designed specifically for children. Our goal is to make learning spelling enjoyable and engaging through modern web technology.",
  "about.features.title": "Features",
  "about.feature.1": "Interactive spelling practice with immediate feedback",
  "about.feature.2": "Audio pronunciation for each word",
  "about.feature.3": "Score tracking to monitor progress",
  "about.feature.4": "Modern, responsive design that works on all devices",
  "about.feature.5": "Single Page Application for smooth navigation",
  "about.feature.6": "Audio feedback with success tones and error sounds",
  "about.feature.7": "Professional spinner animations during audio playback",
  "about.feature.8": "Layout stability with no jarring interface shifts",
  "about.feature.9": "Automatic word replay for incorrect answers",
  "about.feature.10": "Unified input/feedback containers for clean UX",
  "about.tech.title": "Technology Stack",
  "about.tech.frontend": "Frontend",
  "about.tech.backend": "Backend",
  "about.development.title": "Development",
  "about.development.desc":
    "This application is built with modern development practices including Infrastructure as Code (Terraform), automated CI/CD pipelines (GitHub Actions), and streamlined local development using mise for task management.",

  // Profile page
  "profile.title": "My Profile",
  "profile.loading": "Loading profile...",
  "profile.correct": "Correct",
  "profile.stats.testsCompleted": "Tests Completed",
  "profile.stats.averageScore": "Average Score",
  "profile.stats.totalWords": "Total Words",
  "profile.stats.correctWords": "Correct Words",
  "profile.recentResults": "Recent Results",
  "profile.noResults": "No test results yet",
  "profile.noResults.subtitle":
    "Complete some spelling tests to see your progress here",

  // Test page
  "test.title": "Spelling Test",
  "test.loading": "Loading test...",
  "test.notFound": "Word set not found",
  "test.wordNotFound": "Word set not found",
  "test.progress": "Progress",
  "test.of": "of",
  "test.listen": "Listen",
  "test.listenToWord": "Click to hear the word",
  "test.typeAnswer": "Type your answer...",
  "test.typeWordHere": "Type the word here...",
  "test.submit": "Submit",
  "test.correct": "Correct!",
  "test.incorrect": "Incorrect",
  "test.showCorrect": "Correct answer:",
  "test.yourAnswer": "Your answer was",
  "test.nextWord": "Next Word",
  "test.tryAgain": "Try Again",
  "test.playAgain": "Play Again",
  "test.attemptsRemaining": "attempts remaining",
  "test.finalAttempt": "Final attempt",
  "test.complete": "Test Complete!",
  "test.score": "Your Score",
  "test.timeSpent": "Time Spent",
  "test.correctAnswers": "Correct Answers",
  "test.correctSoFar": "Correct so far",
  "test.backToWordSets": "Back to Word Sets",
  "test.retakeTest": "Retake Test",
  "test.restart": "Restart Test",
  "test.finishTest": "Finish Test",
  "test.reviewResults": "Review Results",
  "test.listenToWordMobile": "Tap to listen",
  "test.nextMobile": "Next",
  "test.finishMobile": "Finish",
  "test.backMobile": "Back",
  "test.attempts": "attempts",
  "test.scoreBreakdown": "Score Breakdown",
  "test.firstAttempt": "1st try",
  "test.secondAttempt": "2nd try",
  "test.thirdAttempt": "3+ tries",
  "test.failed": "Failed",
  "test.perfectScore": "Perfect! All words correct on first try!",

  // Results page
  "results.title": "Test Results",
  "results.subtitle": "View your spelling test history and progress",
  "results.loading": "Loading results...",
  "results.noResults": "No test results yet",
  "results.noResults.subtitle":
    "Complete some spelling tests to see your results here",
  "results.startFirst": "No test results yet",
  "results.startFirstTest": "Start your first test",
  "results.score": "Score",
  "results.words": "Words",
  "results.time": "Time",
  "results.date": "Date",
  "results.word": "word",
  "results.incorrect": "Incorrect words",
  "results.correct": "Correct",
  "results.avg": "Avg",
  "results.wordsToPractice": "Words to practice",
  "results.recentTests": "Recent Tests",
  "results.spellingChampion": "Spelling Champion!",
  "results.averageAbove90": "Your average score is above 90%",
  "results.dedicatedLearner": "Dedicated Learner!",
  "results.completedTests": "You've completed",
  "results.tests": "tests",
  "results.stats.totalTests": "Total Tests",
  "results.stats.averageScore": "Average Score",
  "results.stats.bestScore": "Best Score",
  "results.stats.timeSpent": "Time Spent",

  // Common translations
  "common.loading": "Loading...",
  "common.of": "of",
};
