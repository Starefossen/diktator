import confetti from "canvas-confetti";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function celebratePerfectScore(): void {
  if (prefersReducedMotion()) return;

  const duration = 2000;
  const end = Date.now() + duration;

  const colors = ["#FBBF24", "#4ADE80", "#38BDF8", "#FB923C"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export function celebrateExcellentScore(): void {
  if (prefersReducedMotion()) return;

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#FBBF24", "#4ADE80", "#38BDF8"],
  });
}

export function subtleCelebration(): void {
  if (prefersReducedMotion()) return;

  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: ["#4ADE80", "#38BDF8"],
    scalar: 0.8,
  });
}
