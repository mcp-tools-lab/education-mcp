/**
 * explain_concept — Explain a concept at different audience levels and age groups.
 *
 * Generates structured explanations with analogies, examples, prerequisites,
 * and common misconceptions.
 */

import type {
  ExplainConceptInput,
  ConceptExplanation,
  AudienceLevel,
  AgeGroup,
} from "../types.js";
import {
  timestamp,
  clamp,
  requireNonEmpty,
  ageGroupLabel,
  wordCount,
} from "../utils/helpers.js";

// ── Explanation Templates by Level ─────────────────────────────────────────────

function beginnerExplanation(concept: string, ageGroup: AgeGroup): string {
  const ageLabel = ageGroupLabel(ageGroup);
  if (ageGroup === "elementary") {
    return `${concept} is something really interesting that you can learn about! Think of it like a puzzle — once you understand the pieces, you can see the whole picture. ${concept} helps us understand the world around us by showing us how things work. Scientists, teachers, and many other people use what they know about ${concept} every day. The coolest thing is that anyone can learn about it, and the more you learn, the more fun it becomes!`;
  }
  if (ageGroup === "middle_school") {
    return `${concept} is a topic that connects to many things you already know. At its core, it's about understanding patterns and relationships. When you study ${concept}, you learn to think more carefully and ask better questions. Many of the technologies and systems you use every day are built on ideas from ${concept}. Learning it now gives you a strong foundation for more advanced topics later.`;
  }
  return `${concept} is a fundamental topic that forms the basis for deeper understanding in its field. At the beginner level, the most important thing is grasping the core idea: what ${concept} is, why it matters, and how it connects to things you already know. Don't worry about mastering all the details right away — focus on building a solid mental model that you can refine over time. ${concept} has practical applications in everyday life and professional settings alike.`;
}

function intermediateExplanation(concept: string, ageGroup: AgeGroup): string {
  return `${concept} involves several interconnected principles that build on foundational knowledge. At this level, you should be comfortable with the basic definitions and ready to explore how different aspects of ${concept} relate to each other. Key to intermediate understanding is recognizing patterns, applying concepts to new situations, and beginning to analyze rather than just describe. Practitioners of ${concept} at this level can solve standard problems and are developing the skills to tackle non-routine challenges. The transition from intermediate to advanced requires moving from "knowing what" to "knowing why and how."`;
}

function expertExplanation(concept: string, ageGroup: AgeGroup): string {
  return `${concept}, at an expert level, requires deep understanding of its theoretical underpinnings, historical development, and current frontiers. Expert practitioners can critically evaluate competing models, synthesize information from multiple sub-domains, and contribute original insights. The nuances of ${concept} become apparent at this level: edge cases, limitations of standard approaches, and the interplay between theory and empirical evidence. Advanced study involves engaging with primary literature, understanding methodological debates, and recognizing how ${concept} intersects with adjacent fields. Mastery is demonstrated not just by knowledge but by the ability to teach, critique, and extend the field.`;
}

function generateAnalogy(concept: string, level: AudienceLevel, ageGroup: AgeGroup): string {
  if (ageGroup === "elementary") {
    return `Think of ${concept} like building with LEGO blocks. Each small piece is a simple idea, but when you put them together following the instructions, you can build something amazing. And just like LEGO, once you know the basic pieces, you can start creating your own designs!`;
  }
  if (level === "beginner") {
    return `Learning ${concept} is like learning to cook. At first, you follow recipes exactly (the basics). As you get more comfortable, you start understanding why certain ingredients work together, and eventually you can create your own dishes. ${concept} works the same way — master the fundamentals, then get creative.`;
  }
  if (level === "intermediate") {
    return `${concept} can be compared to learning a musical instrument. You've moved past scales and basic songs (beginner stage) and are now learning to play complex pieces. You understand rhythm, harmony, and technique, but mastery requires continued practice and exposure to diverse styles. The intermediate stage is where theory and practice start to merge.`;
  }
  return `At the expert level, ${concept} is akin to chess grandmaster-level play. A novice sees individual pieces; an expert sees patterns, anticipates consequences many moves ahead, and draws on deep theoretical knowledge while adapting to novel situations in real time. The expert doesn't just know the rules — they understand the principles behind the principles.`;
}

function generateKeyPoints(concept: string, level: AudienceLevel): string[] {
  const base = [
    `${concept} has both theoretical and practical dimensions.`,
    `Understanding ${concept} builds on prerequisite knowledge from related fields.`,
    `There are multiple valid approaches and perspectives within ${concept}.`,
  ];
  if (level === "beginner") {
    return [
      `${concept} is a foundational topic worth investing time in.`,
      ...base,
    ];
  }
  if (level === "intermediate") {
    return [
      ...base,
      `Pattern recognition is essential for advancing in ${concept}.`,
      `Applying ${concept} to real problems deepens understanding beyond textbook knowledge.`,
    ];
  }
  return [
    ...base,
    `Expert understanding of ${concept} requires engaging with primary sources and current research.`,
    `Critical evaluation of methods and assumptions distinguishes expert from intermediate practitioners.`,
    `${concept} intersects meaningfully with several adjacent fields.`,
  ];
}

function generateMisconceptions(concept: string): string[] {
  return [
    `"${concept} is just memorization" — In reality, deep understanding requires critical thinking and application.`,
    `"There's only one right way to approach ${concept}" — Multiple valid methods and perspectives exist.`,
    `"You either get ${concept} or you don't" — Like any subject, understanding develops with practice and effort.`,
    `"${concept} has no real-world relevance" — It has numerous practical applications across industries and daily life.`,
  ];
}

function generatePrerequisites(concept: string, level: AudienceLevel): string[] {
  if (level === "beginner") {
    return [
      "Basic reading comprehension",
      "Willingness to engage with new ideas",
      "Foundational knowledge typical for the grade level",
    ];
  }
  if (level === "intermediate") {
    return [
      `Solid understanding of ${concept} fundamentals`,
      "Comfort with the field's basic terminology",
      "Experience applying basic concepts to straightforward problems",
    ];
  }
  return [
    `Strong intermediate-level knowledge of ${concept}`,
    "Familiarity with research methods in the field",
    "Experience with analytical and evaluative thinking",
    "Exposure to primary literature or professional practice",
  ];
}

function generateRelated(concept: string): string[] {
  return [
    `Advanced topics within ${concept}`,
    `Historical development of ${concept}`,
    `${concept} in professional practice`,
    `Interdisciplinary connections with ${concept}`,
    `Current research frontiers in ${concept}`,
  ];
}

function generateExamples(concept: string, level: AudienceLevel): string[] {
  if (level === "beginner") {
    return [
      `A simple classroom demonstration illustrating ${concept} in action.`,
      `An everyday situation where ${concept} applies (e.g., cooking, sports, nature).`,
      `A short video or animation that visualizes the core idea of ${concept}.`,
    ];
  }
  if (level === "intermediate") {
    return [
      `A structured problem-solving exercise applying ${concept} to a real scenario.`,
      `A case study showing how professionals use ${concept} in their work.`,
      `A comparison of two different approaches to the same ${concept} challenge.`,
    ];
  }
  return [
    `A research paper that advanced the understanding of ${concept}.`,
    `A complex real-world problem that requires expert-level ${concept} knowledge.`,
    `A debate or open question in the field that experts in ${concept} are currently investigating.`,
  ];
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function explainConcept(input: ExplainConceptInput): ConceptExplanation {
  const concept = requireNonEmpty(input.concept, "concept");
  const level = input.level ?? "beginner";
  const ageGroup = input.age_group ?? "high_school";
  const includeAnalogy = input.include_analogy ?? true;
  const includeExamples = input.include_examples ?? true;
  const maxLength = clamp(input.max_length ?? 500, 50, 2000);

  let explanation: string;
  switch (level) {
    case "beginner":
      explanation = beginnerExplanation(concept, ageGroup);
      break;
    case "intermediate":
      explanation = intermediateExplanation(concept, ageGroup);
      break;
    case "expert":
      explanation = expertExplanation(concept, ageGroup);
      break;
  }

  // Truncate if over max length
  const words = explanation.split(/\s+/);
  if (words.length > maxLength) {
    explanation = words.slice(0, maxLength).join(" ") + "...";
  }

  const result: ConceptExplanation = {
    concept,
    level,
    age_group: ageGroup,
    explanation,
    key_points: generateKeyPoints(concept, level),
    common_misconceptions: generateMisconceptions(concept),
    prerequisites: generatePrerequisites(concept, level),
    related_concepts: generateRelated(concept),
    examples: includeExamples ? generateExamples(concept, level) : [],
    metadata: {
      generated_at: timestamp(),
      word_count: wordCount(explanation),
    },
  };

  if (includeAnalogy) {
    result.analogy = generateAnalogy(concept, level, ageGroup);
  }

  return result;
}
