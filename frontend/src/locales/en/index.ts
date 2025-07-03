import { auth } from "./auth";
import { family } from "./family";
import { wordsets } from "./wordsets";
import { common } from "./common";
import { profile } from "./profile";
import { results } from "./results";
import { test } from "./test";

export const en = {
  ...auth,
  ...family,
  ...wordsets,
  ...common,
  ...profile,
  ...results,
  ...test,

  // Home page
  "home.welcome": "Welcome to Diktator!",
  "home.subtitle":
    "A fun and interactive spelling practice app designed especially for children",
  "home.api.checking": "Checking API...",
  "home.api.connected": "API Connected",
  "home.api.disconnected": "API Disconnected",
  "home.wordsets.title": "Word Sets",
  "home.wordsets.desc":
    "Create and manage custom word sets, then take spelling tests to track your progress!",
  "home.wordsets.button": "Explore Word Sets",
  "home.practice.title": "Start Practicing",
  "home.practice.desc":
    "Practice spelling with our interactive word games and improve your skills!",
  "home.practice.button": "Begin Practice",
  "home.about.title": "Learn More",
  "home.about.desc":
    "Discover how Diktator can help children develop better spelling skills.",
  "home.about.button": "About Us",

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

  "home.benefits.title": "Perfect for Everyone",
  "home.benefits.subtitle":
    "Whether you're a parent, teacher, or student, Diktator adapts to your needs",
  "home.benefits.parents.title": "For Parents",
  "home.benefits.parents.1": "Track your child's spelling progress",
  "home.benefits.parents.2": "Create custom word lists",
  "home.benefits.parents.3": "Safe, ad-free environment",
  "home.benefits.teachers.title": "For Teachers",
  "home.benefits.teachers.1": "Manage multiple student accounts",
  "home.benefits.teachers.2": "Curriculum-aligned word sets",
  "home.benefits.teachers.3": "Detailed progress reports",
  "home.benefits.students.title": "For Students",
  "home.benefits.students.1": "Fun, game-like experience",
  "home.benefits.students.2": "Immediate feedback",
  "home.benefits.students.3": "Self-paced learning",

  "home.pwa.title": "Install as App",
  "home.pwa.subtitle":
    "Add to your home screen for quick access and offline practice",
  "home.pwa.feature1.title": "Home Screen Access",
  "home.pwa.feature1.desc": "Launch from your home screen",
  "home.pwa.feature2.title": "Offline Mode",
  "home.pwa.feature2.desc": "Practice without internet connection",
  "home.pwa.feature3.title": "App Interface",
  "home.pwa.feature3.desc": "Full-screen app experience",
  "home.pwa.footer":
    "Available on iOS, Android, and desktop • No app store required",

  "home.start.title": "Start Learning",
  "home.start.desc":
    "Practice spelling with audio pronunciation and progress tracking",
  "home.start.feature1": "Audio pronunciation for every word",
  "home.start.feature2": "Instant feedback and scoring",
  "home.start.feature3": "Progress tracking and analytics",
  "home.start.button": "Get Started",

  "home.about.tech1": "Modern PWA technology",
  "home.about.tech2": "Norwegian & English support",
  "home.about.tech3": "Family-friendly design",

  "home.cta.title": "Start Practicing Spelling",
  "home.cta.subtitle": "Create word sets and practice with audio pronunciation",
  "home.cta.button": "Get Started",
  "home.cta.continue": "Continue Learning",
  "home.cta.footer": "No downloads required • Works on all devices",

  // Existing features
  "home.features.auth": "Firebase Authentication",
  "home.features.database": "Firestore Database",
  "home.features.i18n": "Multilingual Support (EN/NO)",
  "home.features.wordsets": "Custom Word Sets & Tests",
  "home.features.profiles": "User Profiles & Statistics",
  "home.features.tts": "Speech Synthesis (TTS)",
  "home.features.tts.desc": "Professional text-to-speech pronunciation",
  "home.features.results": "Test Results Tracking",
  "home.features.results.desc": "Progress tracking and detailed results",
  "home.features.profiles.desc": "Family accounts with individual tracking",
  "home.features.i18n.desc": "Norwegian and English language support",
  "home.features.emulators": "Firebase Emulators",
  "home.nextPhase.title": "Ready for Phase 2:",
  "home.nextPhase.desc":
    "Custom word sets, family sharing, and advanced analytics",
  "home.nextPhase.command": "Start development",
  "home.phaseComplete.title": "Fully Featured!",
  "home.phaseComplete.desc":
    "All core features are ready for an optimal spelling practice experience",
  "home.phaseComplete.features":
    "✨ Audio feedback, visual animations, progress tracking, and responsive design",

  // Development progress section
  "home.progress.title": "Development Progress",
  "home.progress.subtitle":
    "Track our journey building the ultimate spelling practice app",

  // Phase 0
  "home.progress.phase0.title": "Foundation",
  "home.progress.phase0.subtitle": "Core Infrastructure",
  "home.progress.phase0.point1": "Next.js + TypeScript setup",
  "home.progress.phase0.point2": "Google Cloud deployment",
  "home.progress.phase0.point3": "CI/CD pipeline established",

  // Phase 1
  "home.progress.phase1.title": "Authentication",
  "home.progress.phase1.subtitle": "User Management",
  "home.progress.phase1.point1": "Firebase Authentication",
  "home.progress.phase1.point2": "Protected routes & security",
  "home.progress.phase1.point3": "User profiles & families",

  // Phase 2
  "home.progress.phase2.title": "Core Features",
  "home.progress.phase2.subtitle": "Spelling Practice",
  "home.progress.phase2.point1": "Word set management",
  "home.progress.phase2.point2": "Text-to-Speech integration",
  "home.progress.phase2.point3": "Interactive spelling tests",

  // Phase 3
  "home.progress.phase3.title": "Advanced",
  "home.progress.phase3.subtitle": "Polish & Analytics",
  "home.progress.phase3.point1": "Progress analytics",
  "home.progress.phase3.point2": "Gamification system",
  "home.progress.phase3.point3": "Performance optimization",

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

  // Practice page
  "practice.title": "Spelling Practice",
  "practice.subtitle": "Choose a word set to practice your spelling skills",
  "practice.noWordSets": "No word sets available",
  "practice.createFirst": "Create your first word set to start practicing",
  "practice.createWordSet": "Create Word Set",
  "practice.start": "Start Practice",
  "practice.clickToHear": "Click to hear the word",
  "practice.playAgain": "Click to hear again",
  "practice.typeHere": "Type the word here...",
  "practice.checkAnswer": "Check Answer",
  "practice.correct": "Correct!",
  "practice.incorrect": "Not quite right",
  "practice.correctSpelling": "Correct spelling",
  "practice.yourAnswer": "Your answer",
  "practice.nextWordSoon": "Moving to next word...",
  "practice.practiceComplete": "Practice complete!",
  "practice.correctSoFar": "Correct so far",
  "practice.attempt": "Attempt",
  "practice.attemptsLeft": "attempts left",
  "practice.tryAgain": "Try Again",
  "practice.maxAttemptsReached": "Max attempts reached",
  "practice.configuration.title": "Test Configuration",
  "practice.configuration.maxAttempts": "Max attempts per word",
  "practice.configuration.showCorrectAnswer":
    "Show correct answer after failure",
  "practice.configuration.autoAdvance": "Auto-advance after correct answer",

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
