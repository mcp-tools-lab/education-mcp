/**
 * Shared helper functions for education-mcp tools.
 */

import type { DifficultyLevel, AudienceLevel, AgeGroup, QuestionType } from "../types.js";

/** Get current ISO timestamp. */
export function timestamp(): string {
  return new Date().toISOString();
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Shuffle an array in-place (Fisher-Yates). Returns same array. */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pick N random elements from an array (non-destructive). */
export function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  shuffle(copy);
  return copy.slice(0, n);
}

/** Estimate reading/completion time in minutes. */
export function estimateMinutes(wordCount: number, wordsPerMinute = 200): number {
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/** Map difficulty to a numeric multiplier (for time estimates, complexity, etc.). */
export function difficultyMultiplier(d: DifficultyLevel): number {
  switch (d) {
    case "easy": return 0.7;
    case "medium": return 1.0;
    case "hard": return 1.4;
  }
}

/** Map audience level to approximate vocabulary grade. */
export function audienceGrade(level: AudienceLevel): number {
  switch (level) {
    case "beginner": return 6;
    case "intermediate": return 10;
    case "expert": return 16;
  }
}

/** Map age group to an approximate age range string. */
export function ageGroupLabel(ag: AgeGroup): string {
  switch (ag) {
    case "elementary": return "ages 6-10";
    case "middle_school": return "ages 11-13";
    case "high_school": return "ages 14-17";
    case "college": return "ages 18-22";
    case "adult": return "ages 23+";
  }
}

/** Validate that a string is non-empty after trimming. */
export function requireNonEmpty(value: string | undefined, fieldName: string): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required and cannot be empty.`);
  }
  return trimmed;
}

/** Parse and validate question types. */
export function parseQuestionTypes(types?: QuestionType[]): QuestionType[] {
  const all: QuestionType[] = ["multiple_choice", "true_false", "fill_in_blank"];
  if (!types || types.length === 0) return all;
  for (const t of types) {
    if (!all.includes(t)) {
      throw new Error(`Invalid question type: "${t}". Must be one of: ${all.join(", ")}`);
    }
  }
  return types;
}

/** Detect likely subject area from a topic string. */
export function detectSubject(topic: string): string {
  const lower = topic.toLowerCase();
  const patterns: [RegExp, string][] = [
    [/\b(math|algebra|geometry|calculus|trigonometry|statistics|arithmetic|equation|quadratic|fraction|decimal|percent)\b/, "Mathematics"],
    [/\b(physics|force|motion|energy|wave|electricity|magnet|gravity|newton|quantum)\b/, "Physics"],
    [/\b(chemistry|element|molecule|atom|reaction|acid|base|compound|periodic)\b/, "Chemistry"],
    [/\b(biology|cell|dna|evolution|ecosystem|organism|photosynthesis|genetics|anatomy)\b/, "Biology"],
    [/\b(history|war|revolution|civilization|empire|ancient|medieval|colonial)\b/, "History"],
    [/\b(english|grammar|literature|writing|poetry|essay|reading|novel|shakespeare)\b/, "English Language Arts"],
    [/\b(geography|continent|ocean|climate|map|country|capital|mountain|river)\b/, "Geography"],
    [/\b(computer|programming|algorithm|code|software|data|network|cyber|sorting|binary|recursive)\b/, "Computer Science"],
    [/\b(art|music|painting|sculpture|composer|instrument|drawing)\b/, "Arts"],
    [/\b(economics|market|supply|demand|gdp|inflation|trade)\b/, "Economics"],
    [/\b(psychology|behavior|cognitive|mental|brain|memory|learning)\b/, "Psychology"],
    [/\b(spanish|french|german|latin|mandarin|language|vocabulary|conjugat)\b/, "World Languages"],
  ];
  for (const [regex, subject] of patterns) {
    if (regex.test(lower)) return subject;
  }
  return "General Studies";
}

/** Generate Bloom's taxonomy level based on question type / difficulty. */
export function bloomLevel(difficulty: DifficultyLevel): "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create" {
  switch (difficulty) {
    case "easy": return "remember";
    case "medium": return "apply";
    case "hard": return "analyze";
  }
}

/** Spaced repetition initial values based on difficulty. */
export function initialSR(difficulty: DifficultyLevel) {
  const ease = difficulty === "easy" ? 2.8 : difficulty === "medium" ? 2.5 : 2.2;
  return { interval_days: 1, ease_factor: ease, repetitions: 0 };
}

/** Generate a spaced repetition review schedule (Leitner-style intervals). */
export function reviewSchedule(cardCount: number): string[] {
  const baseIntervals = [1, 3, 7, 14, 30, 60, 90];
  return baseIntervals
    .slice(0, Math.min(7, Math.max(3, Math.ceil(cardCount / 3))))
    .map((d) => `Review after ${d} day${d > 1 ? "s" : ""}`);
}

/** Count words in a string. */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Standard 4-point rubric labels. */
export function rubricLabels(scaleLevels: number): string[] {
  if (scaleLevels === 3) return ["Beginning", "Developing", "Proficient"];
  if (scaleLevels === 4) return ["Beginning", "Developing", "Proficient", "Exemplary"];
  if (scaleLevels === 5) return ["Failing", "Beginning", "Developing", "Proficient", "Exemplary"];
  // Generic for other scales
  return Array.from({ length: scaleLevels }, (_, i) => `Level ${i + 1}`);
}
