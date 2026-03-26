/**
 * generate_flashcards — Spaced repetition flashcard decks from a topic.
 *
 * Cards include front/back, optional hints, difficulty-tagged SR metadata,
 * and a study schedule following the Leitner system.
 */

import type {
  GenerateFlashcardsInput,
  FlashcardDeckResult,
  Flashcard,
  DifficultyLevel,
} from "../types.js";
import {
  timestamp,
  clamp,
  requireNonEmpty,
  initialSR,
  reviewSchedule,
  detectSubject,
} from "../utils/helpers.js";

// ── Card Templates ─────────────────────────────────────────────────────────────

interface CardTemplate {
  front: (topic: string) => string;
  back: (topic: string) => string;
  hint?: (topic: string) => string;
  difficulty: DifficultyLevel;
}

const CARD_TEMPLATES: CardTemplate[] = [
  {
    front: (t) => `What is ${t}?`,
    back: (t) => `${t} is a subject area involving the systematic study and application of its core principles, methods, and practices.`,
    hint: (t) => `Think about the fundamental definition of ${t} as a field of study.`,
    difficulty: "easy",
  },
  {
    front: (t) => `What are the key components of ${t}?`,
    back: (t) => `The key components of ${t} include: foundational concepts, methodologies, practical applications, and the relationships between its sub-areas.`,
    hint: (t) => `Consider what building blocks make up ${t}.`,
    difficulty: "easy",
  },
  {
    front: (t) => `Why is ${t} important?`,
    back: (t) => `${t} is important because it provides frameworks for understanding, problem-solving tools, and contributes to both academic knowledge and practical real-world applications.`,
    hint: (t) => `Think about both academic and real-world value.`,
    difficulty: "easy",
  },
  {
    front: (t) => `What are common misconceptions about ${t}?`,
    back: (t) => `Common misconceptions include: it requires only memorization (it also requires critical thinking), it has no real-world applications (it has many), and that there is only one correct approach (multiple valid methods exist).`,
    hint: (t) => `What do beginners often get wrong about ${t}?`,
    difficulty: "medium",
  },
  {
    front: (t) => `How does ${t} connect to other subjects?`,
    back: (t) => `${t} connects to other subjects through shared methodologies, overlapping concepts, and interdisciplinary applications. Understanding these connections deepens comprehension of all related fields.`,
    hint: (t) => `Think about what other subjects share ideas with ${t}.`,
    difficulty: "medium",
  },
  {
    front: (t) => `What skills does studying ${t} develop?`,
    back: (t) => `Studying ${t} develops: analytical thinking, problem-solving, attention to detail, communication of complex ideas, and the ability to evaluate evidence and draw conclusions.`,
    hint: (t) => `Consider both subject-specific and transferable skills.`,
    difficulty: "medium",
  },
  {
    front: (t) => `Describe a real-world application of ${t}.`,
    back: (t) => `${t} is applied in professional settings to solve practical problems, inform decision-making, and drive innovation. Practitioners use ${t} knowledge daily in fields like research, industry, education, and public policy.`,
    hint: (t) => `Think about how professionals use ${t} in their daily work.`,
    difficulty: "medium",
  },
  {
    front: (t) => `What are the main research methods used in ${t}?`,
    back: (t) => `Research in ${t} employs methods including: observation and data collection, hypothesis testing, experimentation, modeling and simulation, and peer review of findings.`,
    hint: (t) => `How do experts in ${t} discover new knowledge?`,
    difficulty: "hard",
  },
  {
    front: (t) => `How has the understanding of ${t} evolved over time?`,
    back: (t) => `Understanding of ${t} has evolved from foundational observations to sophisticated theories and applications. Key developments include the formalization of core principles, integration of technology, and expanding interdisciplinary connections.`,
    hint: (t) => `Trace the historical development of ${t} from early ideas to modern practice.`,
    difficulty: "hard",
  },
  {
    front: (t) => `What are current challenges or open questions in ${t}?`,
    back: (t) => `Current challenges in ${t} include: applying traditional methods to new contexts, integrating emerging technologies, addressing equity and accessibility, and resolving ongoing debates about best practices.`,
    hint: (t) => `What problems in ${t} still need solving?`,
    difficulty: "hard",
  },
  {
    front: (t) => `Compare and contrast two major approaches within ${t}.`,
    back: (t) => `Two major approaches in ${t} are the theoretical (abstract, principle-based) and the empirical (evidence-based, experimental). Theoretical approaches provide frameworks for understanding, while empirical approaches test and validate those frameworks through observation and data.`,
    hint: (t) => `Think about theory vs. practice in ${t}.`,
    difficulty: "hard",
  },
  {
    front: (t) => `What ethical considerations are relevant to ${t}?`,
    back: (t) => `Ethical considerations in ${t} include: responsible use of knowledge, equity in access and participation, honest reporting of findings, respect for different perspectives, and consideration of societal impact.`,
    hint: (t) => `How should practitioners of ${t} behave responsibly?`,
    difficulty: "hard",
  },
];

// ── Generator ──────────────────────────────────────────────────────────────────

export function generateFlashcards(input: GenerateFlashcardsInput): FlashcardDeckResult {
  const topic = requireNonEmpty(input.topic, "topic");
  const cardCount = clamp(input.card_count ?? 10, 1, 100);
  const difficulty = input.difficulty ?? "medium";
  const includeHints = input.include_hints ?? true;
  const tags = input.tags ?? [detectSubject(topic).toLowerCase()];

  // Filter templates by difficulty preference (include easier ones too)
  const difficultyOrder: DifficultyLevel[] = ["easy", "medium", "hard"];
  const maxDiffIdx = difficultyOrder.indexOf(difficulty);
  const eligibleTemplates = CARD_TEMPLATES.filter(
    (t) => difficultyOrder.indexOf(t.difficulty) <= maxDiffIdx + 1
  );

  // Generate cards by cycling through templates
  const cards: Flashcard[] = [];
  for (let i = 0; i < cardCount; i++) {
    const tpl = eligibleTemplates[i % eligibleTemplates.length];
    const card: Flashcard = {
      id: i + 1,
      front: tpl.front(topic),
      back: tpl.back(topic),
      tags: [...tags, tpl.difficulty],
      difficulty: tpl.difficulty,
      sr: initialSR(tpl.difficulty),
    };
    if (includeHints && tpl.hint) {
      card.hint = tpl.hint(topic);
    }
    cards.push(card);
  }

  const studyTips = [
    "Study new cards in short sessions (15-20 minutes max) to maintain focus.",
    "Review cards you got wrong again at the end of each session.",
    "Space out your study sessions — daily short reviews beat weekly cramming.",
    "Say the answer out loud before flipping the card to strengthen recall.",
    "Create your own connections between cards to build a mental map.",
    "Shuffle the deck regularly so you don't just memorize the order.",
  ];

  return {
    title: `${topic} Flashcard Deck`,
    topic,
    card_count: cards.length,
    cards,
    study_tips: studyTips.slice(0, Math.min(6, Math.max(3, Math.ceil(cardCount / 3)))),
    metadata: {
      generated_at: timestamp(),
      estimated_study_minutes: Math.ceil(cardCount * 1.5),
      review_schedule: reviewSchedule(cardCount),
    },
  };
}
