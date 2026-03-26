/**
 * generate_quiz — Create quizzes with multiple choice, true/false, and fill-in-blank questions.
 *
 * Uses template-based generation with topic-aware question banks.
 * Real AI integration can be layered on top; this provides deterministic, testable output.
 */

import type {
  GenerateQuizInput,
  QuizResult,
  QuizQuestion,
  QuestionType,
  DifficultyLevel,
} from "../types.js";
import {
  timestamp,
  clamp,
  shuffle,
  detectSubject,
  difficultyMultiplier,
  parseQuestionTypes,
  requireNonEmpty,
} from "../utils/helpers.js";

// ── Question Templates ─────────────────────────────────────────────────────────

interface QuestionTemplate {
  type: QuestionType;
  template: (topic: string, difficulty: DifficultyLevel) => Omit<QuizQuestion, "id">;
}

function mcQuestion(topic: string, difficulty: DifficultyLevel): Omit<QuizQuestion, "id"> {
  const complexityWord = difficulty === "easy" ? "basic" : difficulty === "hard" ? "advanced" : "key";
  return {
    type: "multiple_choice",
    question: `Which of the following best describes a ${complexityWord} concept in ${topic}?`,
    options: [
      `The fundamental principle underlying ${topic}`,
      `An unrelated concept from a different field`,
      `A common misconception about ${topic}`,
      `A historical but outdated view of ${topic}`,
    ],
    correct_answer: `The fundamental principle underlying ${topic}`,
    explanation: `This answer correctly identifies the core principle of ${topic}. Understanding fundamentals is essential before exploring ${complexityWord} aspects.`,
    difficulty,
  };
}

function mcDefinition(topic: string, difficulty: DifficultyLevel): Omit<QuizQuestion, "id"> {
  return {
    type: "multiple_choice",
    question: `What is the most accurate definition of ${topic}?`,
    options: [
      `A systematic study and application of ${topic} principles`,
      `A purely theoretical framework with no practical use`,
      `An outdated concept no longer relevant today`,
      `A simple memorization exercise`,
    ],
    correct_answer: `A systematic study and application of ${topic} principles`,
    explanation: `${topic} involves both theoretical understanding and practical application. The systematic approach distinguishes it from casual study.`,
    difficulty,
  };
}

function mcApplication(topic: string, difficulty: DifficultyLevel): Omit<QuizQuestion, "id"> {
  return {
    type: "multiple_choice",
    question: `In a real-world scenario involving ${topic}, which approach would be most effective?`,
    options: [
      `Apply the core principles of ${topic} systematically`,
      `Ignore established methods and improvise`,
      `Use only memorized facts without understanding`,
      `Avoid ${topic} entirely and find alternatives`,
    ],
    correct_answer: `Apply the core principles of ${topic} systematically`,
    explanation: `Systematic application of ${topic} principles leads to the most reliable outcomes. Understanding why methods work is more valuable than rote memorization.`,
    difficulty,
  };
}

function tfBasic(topic: string, difficulty: DifficultyLevel): Omit<QuizQuestion, "id"> {
  return {
    type: "true_false",
    question: `${topic} is a field that requires both theoretical knowledge and practical skills.`,
    options: ["True", "False"],
    correct_answer: "True",
    explanation: `Most areas of ${topic} require understanding theory and being able to apply it in practice. This dual requirement is what makes the subject both challenging and rewarding.`,
    difficulty,
  };
}

function tfMisconception(topic: string, difficulty: DifficultyLevel): Omit<QuizQuestion, "id"> {
  return {
    type: "true_false",
    question: `Understanding ${topic} requires no prerequisite knowledge from other subjects.`,
    options: ["True", "False"],
    correct_answer: "False",
    explanation: `${topic} builds on concepts from related fields. Interdisciplinary connections strengthen understanding and enable deeper analysis.`,
    difficulty,
  };
}

function tfAdvanced(topic: string, difficulty: DifficultyLevel): Omit<QuizQuestion, "id"> {
  return {
    type: "true_false",
    question: `Experts in ${topic} agree that there is only one correct approach to solving problems in this area.`,
    options: ["True", "False"],
    correct_answer: "False",
    explanation: `In ${topic}, multiple valid approaches often exist. Expert practitioners choose methods based on context, constraints, and goals rather than following a single rigid procedure.`,
    difficulty,
  };
}

function fibBasic(topic: string, difficulty: DifficultyLevel): Omit<QuizQuestion, "id"> {
  return {
    type: "fill_in_blank",
    question: `The study of ${topic} primarily focuses on understanding _______ and their relationships.`,
    correct_answer: "fundamental principles",
    explanation: `Fundamental principles form the foundation of ${topic}. Without understanding these core concepts, advanced study becomes significantly more difficult.`,
    difficulty,
  };
}

function fibTerminology(topic: string, difficulty: DifficultyLevel): Omit<QuizQuestion, "id"> {
  return {
    type: "fill_in_blank",
    question: `A person who specializes in ${topic} uses _______ to analyze and solve problems.`,
    correct_answer: "systematic methods",
    explanation: `Systematic methods are the hallmark of professional practice in ${topic}. These methods ensure consistency, reproducibility, and reliability of results.`,
    difficulty,
  };
}

function fibContext(topic: string, difficulty: DifficultyLevel): Omit<QuizQuestion, "id"> {
  return {
    type: "fill_in_blank",
    question: `When studying ${topic}, the ability to _______ concepts from one context to another is essential.`,
    correct_answer: "transfer",
    explanation: `Transfer of knowledge is a higher-order thinking skill in ${topic}. Students who can apply concepts across contexts demonstrate deep understanding.`,
    difficulty,
  };
}

const TEMPLATES: Record<QuestionType, ((topic: string, difficulty: DifficultyLevel) => Omit<QuizQuestion, "id">)[]> = {
  multiple_choice: [mcQuestion, mcDefinition, mcApplication],
  true_false: [tfBasic, tfMisconception, tfAdvanced],
  fill_in_blank: [fibBasic, fibTerminology, fibContext],
};

// ── Generator ──────────────────────────────────────────────────────────────────

export function generateQuiz(input: GenerateQuizInput): QuizResult {
  const topic = requireNonEmpty(input.topic, "topic");
  const questionCount = clamp(input.question_count ?? 5, 1, 50);
  const types = parseQuestionTypes(input.question_types);
  const difficulty = input.difficulty ?? "medium";
  const subject = input.subject ?? detectSubject(topic);

  // Build question pool
  const pool: ((t: string, d: DifficultyLevel) => Omit<QuizQuestion, "id">)[] = [];
  for (const type of types) {
    pool.push(...TEMPLATES[type]);
  }

  if (pool.length === 0) {
    throw new Error("No question templates available for the specified types.");
  }

  // Generate questions by cycling through templates
  const questions: QuizQuestion[] = [];
  for (let i = 0; i < questionCount; i++) {
    const templateFn = pool[i % pool.length];
    const q = templateFn(topic, difficulty);
    questions.push({ ...q, id: i + 1 });
  }

  // Shuffle to mix question types
  shuffle(questions).forEach((q, idx) => (q.id = idx + 1));

  const estimatedMinutes = Math.ceil(questionCount * 1.5 * difficultyMultiplier(difficulty));

  return {
    topic,
    difficulty,
    question_count: questions.length,
    questions,
    metadata: {
      generated_at: timestamp(),
      subject_area: subject,
      estimated_duration_minutes: estimatedMinutes,
    },
  };
}
