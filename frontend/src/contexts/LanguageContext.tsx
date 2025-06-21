"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "no";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const translations = {
  en: {
    "spelling.practice": "Spelling Practice",
    score: "Score",
    "new.word": "New Word",
    "start.practice": "Start Practice",
    "spell.this.word": "Spell this word:",
    listen: "Listen",
    "type.word.here": "Type the word here...",
    "check.spelling": "Check Spelling",
    correct: "Correct! 🎉",
    "not.quite": "Not quite! The correct spelling is:",
    "nav.home": "Home",
    "nav.practice": "Practice",
    "nav.about": "About",
    "nav.prfoile": "Profile",
    "home.welcome": "Welcome to Diktator! 🎯",
    "home.subtitle":
      "A fun and interactive spelling practice app designed especially for children",
    "home.api.checking": "Checking API...",
    "home.api.connected": "API Connected",
    "home.api.disconnected": "API Disconnected",
    "home.practice.title": "Start Practicing",
    "home.practice.desc":
      "Practice spelling with our interactive word games and improve your skills!",
    "home.practice.button": "Begin Practice",
    "home.about.title": "Learn More",
    "home.about.desc":
      "Discover how Diktator can help children develop better spelling skills.",
    "home.about.button": "About Us",
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
    "about.tech.title": "Technology Stack",
    "about.tech.frontend": "Frontend",
    "about.tech.backend": "Backend",
    "about.development.title": "Development",
    "about.development.desc":
      "This application is built with modern development practices including Infrastructure as Code (Terraform), automated CI/CD pipelines (GitHub Actions), and streamlined local development using mise for task management.",
    "auth.signin.title": "Sign In",
    "auth.signin.subtitle":
      "Welcome back! Sign in to continue your spelling journey.",
    "auth.signin.button": "Sign In",
    "auth.signin.switchToSignup": "Don't have an account? Sign up",
    "auth.signup.title": "Create Account",
    "auth.signup.subtitle": "Join Diktator and start your spelling adventure!",
    "auth.signup.button": "Create Account",
    "auth.signup.switchToSignin": "Already have an account? Sign in",
    "auth.email": "Email Address",
    "auth.email.placeholder": "Enter your email",
    "auth.password": "Password",
    "auth.password.placeholder": "Enter your password",
    "auth.displayName": "Display Name",
    "auth.displayName.placeholder": "Enter your name",
    "auth.role": "Account Type",
    "auth.role.child": "Student",
    "auth.role.parent": "Parent/Teacher",
    "auth.logout": "Logout",
    "profile.title": "My Profile",
    "profile.stats.testsCompleted": "Tests Completed",
    "profile.stats.averageScore": "Average Score",
    "profile.stats.totalWords": "Total Words",
    "profile.stats.correctWords": "Correct Words",
    "profile.recentResults": "Recent Results",
    "profile.noResults": "No test results yet. Start practicing!",
    "profile.correct": "correct",
  },
  no: {
    "spelling.practice": "Stavepraksis",
    score: "Poeng",
    "new.word": "Nytt ord",
    "start.practice": "Start øving",
    "spell.this.word": "Stav dette ordet:",
    listen: "Lytt",
    "type.word.here": "Skriv ordet her...",
    "check.spelling": "Sjekk staving",
    correct: "Riktig! 🎉",
    "not.quite": "Ikke helt! Riktig staving er:",
    "nav.home": "Hjem",
    "nav.practice": "Øving",
    "nav.about": "Om",
    "nav.profile": "Profil",
    "home.welcome": "Velkommen til Diktator! 🎯",
    "home.subtitle":
      "En morsom og interaktiv stavepraksis-app designet spesielt for barn",
    "home.api.checking": "Sjekker API...",
    "home.api.connected": "API tilkoblet",
    "home.api.disconnected": "API frakoblet",
    "home.practice.title": "Start å øve",
    "home.practice.desc":
      "Øv på staving med våre interaktive ordspill og forbedre ferdighetene dine!",
    "home.practice.button": "Begynn øving",
    "home.about.title": "Lær mer",
    "home.about.desc":
      "Oppdag hvordan Diktator kan hjelpe barn med å utvikle bedre staveferdigheter.",
    "home.about.button": "Om oss",
    "about.title": "Om Diktator",
    "about.what.title": "Hva er Diktator?",
    "about.what.desc":
      "Diktator er en morsom og interaktiv stavepraksis-applikasjon designet spesielt for barn. Vårt mål er å gjøre ståvelæring hyggelig og engasjerende gjennom moderne webteknologi.",
    "about.features.title": "Funksjoner",
    "about.feature.1": "Interaktiv stavepraksis med umiddelbar tilbakemelding",
    "about.feature.2": "Lyduttalelse for hvert ord",
    "about.feature.3": "Poengsporing for å overvåke fremgang",
    "about.feature.4":
      "Moderne, responsivt design som fungerer på alle enheter",
    "about.feature.5": "Single Page Application for smidig navigering",
    "about.tech.title": "Teknologistakk",
    "about.tech.frontend": "Frontend",
    "about.tech.backend": "Backend",
    "about.development.title": "Utvikling",
    "about.development.desc":
      "Denne applikasjonen er bygget med moderne utviklingspraksis inkludert Infrastructure as Code (Terraform), automatiserte CI/CD-pipelines (GitHub Actions), og strømlinjeformet lokal utvikling med mise for oppgavehåndtering.",
    "auth.signin.title": "Logg inn",
    "auth.signin.subtitle":
      "Velkommen tilbake! Logg inn for å fortsette din stavereise.",
    "auth.signin.button": "Logg inn",
    "auth.signin.switchToSignup": "Har du ikke en konto? Registrer deg",
    "auth.signup.title": "Opprett konto",
    "auth.signup.subtitle": "Bli med i Diktator og start ditt staveeventyr!",
    "auth.signup.button": "Opprett konto",
    "auth.signup.switchToSignin": "Har du allerede en konto? Logg inn",
    "auth.email": "E-postadresse",
    "auth.email.placeholder": "Skriv inn din e-post",
    "auth.password": "Passord",
    "auth.password.placeholder": "Skriv inn ditt passord",
    "auth.displayName": "Visningsnavn",
    "auth.displayName.placeholder": "Skriv inn ditt navn",
    "auth.role": "Kontotype",
    "auth.role.child": "Elev",
    "auth.role.parent": "Forelder/Lærer",
    "auth.logout": "Logg ut",
    "profile.title": "Min profil",
    "profile.stats.testsCompleted": "Tester fullført",
    "profile.stats.averageScore": "Gjennomsnittlig poengsum",
    "profile.stats.totalWords": "Totalt ord",
    "profile.stats.correctWords": "Riktige ord",
    "profile.recentResults": "Nylige resultater",
    "profile.noResults": "Ingen testresultater ennå. Start å øve!",
    "profile.correct": "riktig",
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>("no");

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
