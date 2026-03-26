/**
 * generate_lesson_plan — Structured lesson plans with objectives, activities, and assessment.
 *
 * Follows the Madeline Hunter lesson plan model with Bloom's taxonomy alignment.
 */

import type {
  GenerateLessonPlanInput,
  LessonPlanResult,
  LessonObjective,
  LessonActivity,
  AssessmentItem,
} from "../types.js";
import {
  timestamp,
  clamp,
  requireNonEmpty,
  bloomLevel,
} from "../utils/helpers.js";

// ── Generators ─────────────────────────────────────────────────────────────────

function generateObjectives(topic: string, subject: string, count: number): LessonObjective[] {
  const templates: { desc: (t: string, s: string) => string; bloom: LessonObjective["bloom_level"] }[] = [
    { desc: (t, s) => `Students will be able to define and identify key terms related to ${t} in ${s}.`, bloom: "remember" },
    { desc: (t, s) => `Students will be able to explain the main concepts of ${t} in their own words.`, bloom: "understand" },
    { desc: (t, s) => `Students will be able to apply ${t} principles to solve new problems.`, bloom: "apply" },
    { desc: (t, s) => `Students will be able to analyze relationships between different aspects of ${t}.`, bloom: "analyze" },
    { desc: (t, s) => `Students will be able to evaluate different approaches to ${t} and justify their reasoning.`, bloom: "evaluate" },
    { desc: (t, s) => `Students will be able to create an original work demonstrating understanding of ${t}.`, bloom: "create" },
  ];

  return templates.slice(0, clamp(count, 1, 6)).map((tpl) => ({
    description: tpl.desc(topic, subject),
    bloom_level: tpl.bloom,
  }));
}

function generateStandards(subject: string, gradeLevel: string): string[] {
  // Common Core / NGSS style standard codes (illustrative)
  const standards: Record<string, string[]> = {
    Mathematics: [
      `CCSS.MATH.CONTENT.${gradeLevel.toUpperCase()}.1 — Apply concepts and procedures`,
      `CCSS.MATH.PRACTICE.MP1 — Make sense of problems and persevere in solving them`,
    ],
    "English Language Arts": [
      `CCSS.ELA-LITERACY.${gradeLevel.toUpperCase()}.1 — Read closely and cite textual evidence`,
      `CCSS.ELA-LITERACY.W.${gradeLevel.toUpperCase()}.2 — Write informative/explanatory texts`,
    ],
    default: [
      `Standard 1: Demonstrate understanding of core concepts in the subject area`,
      `Standard 2: Apply critical thinking and problem-solving skills`,
    ],
  };
  return standards[subject] ?? standards["default"];
}

function generateActivities(topic: string, totalMinutes: number): {
  warmUp: LessonActivity;
  main: LessonActivity[];
  closure: LessonActivity;
} {
  // Time allocation: warm-up 10%, main 70%, closure 10%, buffer 10%
  const warmUpMin = Math.max(3, Math.round(totalMinutes * 0.1));
  const closureMin = Math.max(3, Math.round(totalMinutes * 0.1));
  const mainMin = totalMinutes - warmUpMin - closureMin;

  const warmUp: LessonActivity = {
    name: "Activation & Hook",
    duration_minutes: warmUpMin,
    description: `Begin with a thought-provoking question about ${topic} to activate prior knowledge. Allow students to discuss briefly with a partner before sharing with the class.`,
    materials: ["Whiteboard", "Markers"],
    teacher_notes: "Listen for misconceptions during pair discussions — address these during the main lesson.",
  };

  const activity1Min = Math.round(mainMin * 0.4);
  const activity2Min = Math.round(mainMin * 0.35);
  const activity3Min = mainMin - activity1Min - activity2Min;

  const main: LessonActivity[] = [
    {
      name: "Direct Instruction",
      duration_minutes: activity1Min,
      description: `Present the core concepts of ${topic} using visual aids and real-world examples. Check for understanding with targeted questions throughout.`,
      materials: ["Presentation slides", "Handout with key vocabulary"],
      teacher_notes: "Pause every 5 minutes for a quick comprehension check. Use cold-calling to ensure all students engage.",
    },
    {
      name: "Guided Practice",
      duration_minutes: activity2Min,
      description: `Students work through structured problems related to ${topic} in small groups. Teacher circulates to provide feedback and scaffolding.`,
      materials: ["Practice worksheet", "Manipulatives (if applicable)"],
      teacher_notes: "Group struggling students together for targeted support. Provide extension problems for advanced groups.",
    },
    {
      name: "Independent Practice",
      duration_minutes: activity3Min,
      description: `Students independently apply what they've learned about ${topic}. This serves as a formative assessment opportunity.`,
      materials: ["Independent practice sheet"],
      teacher_notes: "Collect work for formative assessment data. Note which students need reteaching.",
    },
  ];

  const closure: LessonActivity = {
    name: "Closure & Reflection",
    duration_minutes: closureMin,
    description: `Students complete an exit ticket summarizing what they learned about ${topic}. Conduct a brief whole-class review of key takeaways.`,
    materials: ["Exit ticket template"],
    teacher_notes: "Review exit tickets before the next class to inform planning. Address any widespread gaps immediately.",
  };

  return { warmUp, main, closure };
}

function generateAssessment(topic: string): AssessmentItem[] {
  return [
    {
      type: "formative",
      description: `Exit ticket: Students answer 2-3 questions demonstrating understanding of ${topic}.`,
      criteria: [
        "Correctly identifies key concepts",
        "Uses appropriate vocabulary",
        "Provides clear explanations",
      ],
    },
    {
      type: "formative",
      description: `Observation during guided practice: Monitor student discussions and problem-solving approaches.`,
      criteria: [
        "Active participation in group work",
        "Appropriate use of strategies taught",
        "Ability to explain reasoning to peers",
      ],
    },
    {
      type: "summative",
      description: `End-of-unit assessment on ${topic} covering all learning objectives.`,
      criteria: [
        "Mastery of key vocabulary and definitions",
        "Application of concepts to novel situations",
        "Analysis and evaluation of scenarios",
      ],
    },
  ];
}

function generateMaterials(topic: string): string[] {
  return [
    "Whiteboard and markers",
    `Presentation slides on ${topic}`,
    "Student handouts (vocabulary sheet + practice problems)",
    "Exit ticket templates",
    "Timer/clock for activity transitions",
    `Visual aids related to ${topic} (diagrams, charts, or models)`,
  ];
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function generateLessonPlan(input: GenerateLessonPlanInput): LessonPlanResult {
  const topic = requireNonEmpty(input.topic, "topic");
  const subject = requireNonEmpty(input.subject, "subject");
  const gradeLevel = requireNonEmpty(input.grade_level, "grade_level");
  const duration = clamp(input.duration_minutes ?? 45, 15, 180);
  const objectivesCount = clamp(input.objectives_count ?? 3, 1, 6);
  const includeStandards = input.include_standards ?? true;
  const includeHomework = input.include_homework ?? false;

  const objectives = generateObjectives(topic, subject, objectivesCount);
  const { warmUp, main, closure } = generateActivities(topic, duration);
  const assessment = generateAssessment(topic);
  const materials = generateMaterials(topic);

  const result: LessonPlanResult = {
    title: `${topic} — ${subject} Lesson`,
    subject,
    grade_level: gradeLevel,
    duration_minutes: duration,
    objectives,
    materials,
    warm_up: warmUp,
    activities: main,
    closure,
    assessment,
    differentiation: {
      struggling: `Provide graphic organizers and vocabulary word banks for ${topic}. Pair with a peer buddy. Reduce the number of independent practice problems and allow extra time.`,
      advanced: `Offer extension activities that require deeper analysis of ${topic}. Allow students to explore connections to related topics or create their own problems for peers.`,
      ell: `Pre-teach key vocabulary for ${topic} with visual supports. Provide bilingual glossaries where available. Use sentence frames for written and oral responses.`,
    },
    metadata: {
      generated_at: timestamp(),
    },
  };

  if (includeStandards) {
    result.standards = generateStandards(subject, gradeLevel);
  }

  if (includeHomework) {
    result.homework = `Review today's notes on ${topic}. Complete the homework practice sheet (problems 1-5). Write a one-paragraph reflection on what you found most challenging and why.`;
  }

  return result;
}
