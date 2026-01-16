import { WordSet, TestResult, GradeLevel } from "@/types";

interface UserProfile {
  birthYear?: number;
  level?: number;
}

/**
 * Calculates the estimated Norwegian school grade based on birth year.
 * Children start 1st grade the year they turn 6.
 */
export function estimateStudentGrade(birthYear: number): number {
  const currentYear = new Date().getFullYear();
  // In Norway, you start 1st grade the year you turn 6.
  // Example: Born 2018. In 2024 (turns 6) -> Grade 1.
  // Grade = CurrentYear - BirthYear - 5
  const ageTurningThisYear = currentYear - birthYear;
  const grade = ageTurningThisYear - 5;

  // Clamp to reasonable bounds (0 = pre-school, 13 = high school end)
  return Math.max(0, grade);
}

/**
 * Maps numeric grade to GradeLevel string enum
 */
function getGradeLevelCategory(grade: number): GradeLevel | undefined {
  if (grade <= 2) return "1-2";
  if (grade <= 4) return "3-4";
  if (grade <= 7) return "5-7";
  return undefined; // Older or younger
}

/**
 * Ranks word sets based on user profile and history.
 * Higher score = more recommended.
 */
export function rankWordSets(
  wordSets: WordSet[],
  userProfile: UserProfile,
  userResults: TestResult[],
): WordSet[] {
  const scoredSets = wordSets.map((set) => {
    let score = 100; // Base score

    // 1. Grade Level Match (High Weight)
    if (userProfile.birthYear && set.targetGrade) {
      const estimatedGrade = estimateStudentGrade(userProfile.birthYear);
      const userGradeCategory = getGradeLevelCategory(estimatedGrade);

      if (userGradeCategory === set.targetGrade) {
        score += 50; // Perfect match
      } else {
        // Penalty for mismatch
        // Simple proximity check:
        // "1-2" (avg 1.5), "3-4" (avg 3.5), "5-7" (avg 6)
        const targetAvg =
          set.targetGrade === "1-2" ? 1.5 : set.targetGrade === "3-4" ? 3.5 : 6;
        const diff = Math.abs(estimatedGrade - targetAvg);

        if (diff <= 2) {
          score += 20; // Close enough
        } else {
          score -= 30; // Too far (too hard or too easy)
        }
      }
    }

    // 2. Mastery / History (High Weight)
    // Find best result for this word set
    const setResults = userResults.filter((r) => r.wordSetId === set.id);
    const bestScore =
      setResults.length > 0 ? Math.max(...setResults.map((r) => r.score)) : -1;

    if (bestScore >= 90) {
      score -= 1000; // Already mastered - hide from suggestions
    } else if (bestScore >= 0) {
      score += 30; // Played but not mastered - encourage retry
    } else {
      score += 10; // Never played - encourage discovery
    }

    // 3. Difficulty Adaptation (Medium Weight)
    const level = userProfile.level || 1;
    if (set.difficulty) {
      if (level <= 3) {
        // Beginner user
        if (set.difficulty === "beginner") score += 20;
        if (set.difficulty === "advanced") score -= 20;
      } else if (level >= 7) {
        // Advanced user
        if (set.difficulty === "advanced") score += 20;
        if (set.difficulty === "beginner") score -= 10;
      }
    }

    return { set, score };
  });

  // Sort by score descending
  scoredSets.sort((a, b) => b.score - a.score);

  // Return just the WordSets
  return scoredSets.map((item) => item.set);
}
