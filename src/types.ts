/**
 * Core types for education-mcp tools.
 */

// ── Rate Limiting ──────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  freeMonthlyLimit: number;
  proMonthlyLimit: number; // -1 = unlimited
  proPriceUsd: number;
}

export const RATE_LIMITS: RateLimitConfig = {
  freeMonthlyLimit: 30,
  proMonthlyLimit: -1,
  proPriceUsd: 9.99,
};

// ── Quiz ───────────────────────────────────────────────────────────────────────

export type QuestionType = "multiple_choice" | "true_false" | "fill_in_blank";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type AudienceLevel = "beginner" | "intermediate" | "expert";
export type AgeGroup = "elementary" | "middle_school" | "high_school" | "college" | "adult";

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];          // for multiple_choice
  correct_answer: string;
  explanation: string;
  difficulty: DifficultyLevel;
}

export interface QuizResult {
  topic: string;
  difficulty: DifficultyLevel;
  question_count: number;
  questions: QuizQuestion[];
  metadata: {
    generated_at: string;
    subject_area: string;
    estimated_duration_minutes: number;
  };
}

export interface GenerateQuizInput {
  topic: string;
  question_count?: number;       // default 5
  question_types?: QuestionType[]; // default all three
  difficulty?: DifficultyLevel;   // default medium
  subject?: string;               // auto-detected if omitted
  age_group?: AgeGroup;
}

// ── Lesson Plan ────────────────────────────────────────────────────────────────

export interface LessonObjective {
  description: string;
  bloom_level: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
}

export interface LessonActivity {
  name: string;
  duration_minutes: number;
  description: string;
  materials?: string[];
  teacher_notes?: string;
}

export interface AssessmentItem {
  type: "formative" | "summative";
  description: string;
  criteria?: string[];
}

export interface LessonPlanResult {
  title: string;
  subject: string;
  grade_level: string;
  duration_minutes: number;
  objectives: LessonObjective[];
  standards?: string[];
  materials: string[];
  warm_up: LessonActivity;
  activities: LessonActivity[];
  closure: LessonActivity;
  assessment: AssessmentItem[];
  differentiation: {
    struggling: string;
    advanced: string;
    ell: string;
  };
  homework?: string;
  metadata: {
    generated_at: string;
  };
}

export interface GenerateLessonPlanInput {
  topic: string;
  subject: string;
  grade_level: string;
  duration_minutes?: number;    // default 45
  objectives_count?: number;    // default 3
  include_standards?: boolean;  // default true
  include_homework?: boolean;   // default false
}

// ── Flashcards ─────────────────────────────────────────────────────────────────

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  hint?: string;
  tags: string[];
  difficulty: DifficultyLevel;
  /** Spaced repetition metadata */
  sr: {
    interval_days: number;
    ease_factor: number;
    repetitions: number;
  };
}

export interface FlashcardDeckResult {
  title: string;
  topic: string;
  card_count: number;
  cards: Flashcard[];
  study_tips: string[];
  metadata: {
    generated_at: string;
    estimated_study_minutes: number;
    review_schedule: string[];
  };
}

export interface GenerateFlashcardsInput {
  topic: string;
  card_count?: number;          // default 10
  difficulty?: DifficultyLevel;
  include_hints?: boolean;      // default true
  tags?: string[];
}

// ── Explain Concept ────────────────────────────────────────────────────────────

export interface ConceptExplanation {
  concept: string;
  level: AudienceLevel;
  age_group: AgeGroup;
  explanation: string;
  analogy?: string;
  key_points: string[];
  common_misconceptions: string[];
  prerequisites: string[];
  related_concepts: string[];
  examples: string[];
  further_reading?: string[];
  metadata: {
    generated_at: string;
    word_count: number;
  };
}

export interface ExplainConceptInput {
  concept: string;
  level?: AudienceLevel;        // default beginner
  age_group?: AgeGroup;         // default high_school
  include_analogy?: boolean;    // default true
  include_examples?: boolean;   // default true
  max_length?: number;          // max words, default 500
}

// ── Generate Exercise ──────────────────────────────────────────────────────────

export type ExerciseSubject = "math" | "physics" | "chemistry" | "biology" | "computer_science";

export interface ExerciseStep {
  step_number: number;
  description: string;
  formula?: string;
  result?: string;
}

export interface Exercise {
  id: number;
  problem: string;
  subject: ExerciseSubject;
  difficulty: DifficultyLevel;
  solution: {
    steps: ExerciseStep[];
    final_answer: string;
  };
  hints: string[];
  common_mistakes: string[];
}

export interface ExerciseSetResult {
  topic: string;
  subject: ExerciseSubject;
  exercise_count: number;
  exercises: Exercise[];
  metadata: {
    generated_at: string;
    estimated_completion_minutes: number;
    skills_practiced: string[];
  };
}

export interface GenerateExerciseInput {
  topic: string;
  subject: ExerciseSubject;
  exercise_count?: number;      // default 3
  difficulty?: DifficultyLevel;
  include_hints?: boolean;      // default true
  show_steps?: boolean;         // default true
}

// ── Grade Rubric ───────────────────────────────────────────────────────────────

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
}

export interface RubricCriterion {
  name: string;
  weight: number;               // percentage, all criteria sum to 100
  description: string;
  levels: RubricLevel[];
}

export interface GradeRubricResult {
  assignment_title: string;
  assignment_type: string;
  total_points: number;
  criteria: RubricCriterion[];
  grading_notes: string[];
  metadata: {
    generated_at: string;
    scale: string;
  };
}

export interface GradeRubricInput {
  assignment_title: string;
  assignment_type: string;      // essay, presentation, project, lab_report, code
  criteria_count?: number;      // default 4
  total_points?: number;        // default 100
  scale_levels?: number;        // default 4 (e.g., 4-point scale)
  subject?: string;
}
