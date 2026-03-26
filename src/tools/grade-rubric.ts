/**
 * grade_rubric — Create grading rubrics for assignments.
 *
 * Generates structured rubrics with criteria, weights, levels, and descriptors.
 */

import type {
  GradeRubricInput,
  GradeRubricResult,
  RubricCriterion,
  RubricLevel,
} from "../types.js";
import {
  timestamp,
  clamp,
  requireNonEmpty,
  rubricLabels,
} from "../utils/helpers.js";

// ── Criterion Templates per Assignment Type ────────────────────────────────────

interface CriterionTemplate {
  name: string;
  weight: number;
  description: string;
  levelDescriptions: (levels: string[]) => string[];
}

const ESSAY_CRITERIA: CriterionTemplate[] = [
  {
    name: "Thesis & Argument",
    weight: 30,
    description: "Clarity, strength, and originality of the thesis statement and supporting arguments.",
    levelDescriptions: (labels) => [
      "No clear thesis. Arguments are absent or incoherent.",
      "Thesis is vague or simplistic. Arguments lack sufficient support.",
      "Clear thesis with well-supported arguments. Some original thinking evident.",
      "Exceptional thesis with compelling, nuanced arguments. Demonstrates sophisticated critical thinking.",
    ],
  },
  {
    name: "Evidence & Analysis",
    weight: 25,
    description: "Quality and relevance of evidence; depth of analysis connecting evidence to claims.",
    levelDescriptions: (labels) => [
      "Little to no evidence provided. No analysis present.",
      "Some evidence included but analysis is superficial or disconnected.",
      "Relevant evidence with clear analysis linking evidence to claims.",
      "Exceptional use of diverse, credible evidence with insightful analysis.",
    ],
  },
  {
    name: "Organization & Structure",
    weight: 20,
    description: "Logical flow, paragraph structure, transitions, and overall coherence.",
    levelDescriptions: (labels) => [
      "No discernible organization. Ideas are scattered and confusing.",
      "Basic structure present but transitions are weak. Some paragraphs lack focus.",
      "Well-organized with clear paragraphs and effective transitions.",
      "Masterful organization that enhances the argument. Seamless transitions throughout.",
    ],
  },
  {
    name: "Writing Mechanics",
    weight: 15,
    description: "Grammar, spelling, punctuation, sentence variety, and academic voice.",
    levelDescriptions: (labels) => [
      "Frequent errors that significantly impede comprehension.",
      "Several errors present but meaning is generally clear.",
      "Few minor errors. Writing is clear and uses appropriate academic voice.",
      "Virtually error-free. Sophisticated sentence variety and masterful command of language.",
    ],
  },
  {
    name: "Citations & Formatting",
    weight: 10,
    description: "Proper use of citation format, bibliography, and document formatting.",
    levelDescriptions: (labels) => [
      "No citations or grossly incorrect formatting.",
      "Inconsistent citations with formatting errors.",
      "Correct citations with minor formatting issues.",
      "Perfect citation format and professional document presentation.",
    ],
  },
];

const PRESENTATION_CRITERIA: CriterionTemplate[] = [
  {
    name: "Content Knowledge",
    weight: 30,
    description: "Depth of understanding, accuracy of information, and completeness of coverage.",
    levelDescriptions: () => [
      "Inaccurate or missing content. Shows minimal understanding.",
      "Basic content covered with some gaps. Understanding is surface-level.",
      "Accurate, thorough content demonstrating solid understanding.",
      "Exceptional depth showing expert-level mastery and original insights.",
    ],
  },
  {
    name: "Delivery & Communication",
    weight: 25,
    description: "Speaking clarity, eye contact, confidence, pacing, and audience engagement.",
    levelDescriptions: () => [
      "Reads directly from notes. Inaudible or unclear. No audience engagement.",
      "Mostly reads from slides. Limited eye contact. Uneven pacing.",
      "Speaks clearly with good eye contact. Engages audience. Appropriate pacing.",
      "Commanding delivery. Natural, conversational style. Captivates the audience.",
    ],
  },
  {
    name: "Visual Aids & Design",
    weight: 20,
    description: "Quality of slides/visuals, design consistency, and effective use of media.",
    levelDescriptions: () => [
      "No visuals or visuals detract from presentation. Walls of text.",
      "Basic visuals with some design issues. Text-heavy slides.",
      "Clean, professional design. Visuals enhance understanding.",
      "Outstanding design. Creative, purposeful visuals that elevate the presentation.",
    ],
  },
  {
    name: "Q&A & Critical Thinking",
    weight: 15,
    description: "Ability to answer questions, handle challenges, and demonstrate deeper thinking.",
    levelDescriptions: () => [
      "Unable to answer questions. Cannot elaborate beyond slides.",
      "Answers basic questions but struggles with follow-ups.",
      "Handles questions confidently. Shows understanding beyond the prepared content.",
      "Expertly addresses all questions. Provides nuanced, insightful responses.",
    ],
  },
  {
    name: "Time Management",
    weight: 10,
    description: "Adherence to time limits and appropriate allocation of time across sections.",
    levelDescriptions: () => [
      "Significantly over or under time. No sense of pacing.",
      "Somewhat over/under time. Some sections rushed or dragged.",
      "Within time limits. Sections appropriately balanced.",
      "Perfect timing with smooth transitions and well-paced sections.",
    ],
  },
];

const PROJECT_CRITERIA: CriterionTemplate[] = [
  {
    name: "Project Goals & Planning",
    weight: 20,
    description: "Clarity of goals, feasibility of plan, and quality of project management.",
    levelDescriptions: () => [
      "No clear goals or plan. Project lacks direction.",
      "Basic goals stated but plan is incomplete or unrealistic.",
      "Clear, achievable goals with a well-structured plan and timeline.",
      "Exceptional planning with detailed milestones, contingencies, and resource management.",
    ],
  },
  {
    name: "Execution & Quality",
    weight: 30,
    description: "Quality of work produced, technical skill, and attention to detail.",
    levelDescriptions: () => [
      "Project is incomplete or shows minimal effort.",
      "Project is complete but quality is inconsistent.",
      "High-quality work demonstrating strong skills and attention to detail.",
      "Outstanding execution exceeding expectations. Professional-grade quality.",
    ],
  },
  {
    name: "Creativity & Innovation",
    weight: 20,
    description: "Originality of approach, creative problem-solving, and innovative thinking.",
    levelDescriptions: () => [
      "No original thinking. Follows template without adaptation.",
      "Some creative elements but largely conventional approach.",
      "Creative approach with original ideas and innovative solutions.",
      "Highly innovative. Pushes boundaries and demonstrates exceptional creativity.",
    ],
  },
  {
    name: "Documentation & Reflection",
    weight: 15,
    description: "Quality of documentation, process reflection, and lessons learned.",
    levelDescriptions: () => [
      "No documentation. No reflection on process.",
      "Minimal documentation. Superficial reflection.",
      "Thorough documentation with meaningful reflection on the process.",
      "Exceptional documentation. Deep, insightful reflection with clear lessons learned.",
    ],
  },
  {
    name: "Collaboration (if applicable)",
    weight: 15,
    description: "Teamwork, communication, equitable contribution, and conflict resolution.",
    levelDescriptions: () => [
      "Did not contribute meaningfully. Communication absent.",
      "Contributed but unevenly. Communication was inconsistent.",
      "Active, equitable contributor. Good communication and teamwork.",
      "Exceptional team player. Elevated the group's work through leadership and collaboration.",
    ],
  },
];

const LAB_REPORT_CRITERIA: CriterionTemplate[] = [
  {
    name: "Hypothesis & Purpose",
    weight: 15,
    description: "Clarity of hypothesis, connection to theory, and statement of purpose.",
    levelDescriptions: () => [
      "No hypothesis or purpose stated.",
      "Vague hypothesis that is not clearly testable.",
      "Clear, testable hypothesis connected to relevant theory.",
      "Sophisticated hypothesis with strong theoretical grounding and clear predictions.",
    ],
  },
  {
    name: "Methodology",
    weight: 25,
    description: "Completeness of procedure, appropriateness of methods, and reproducibility.",
    levelDescriptions: () => [
      "Procedure is missing or incomprehensible.",
      "Procedure present but has gaps. Would be difficult to reproduce.",
      "Clear, complete procedure. Another student could reproduce the experiment.",
      "Detailed, rigorous methodology with controls, variables, and safety considerations.",
    ],
  },
  {
    name: "Data & Results",
    weight: 25,
    description: "Accuracy of data collection, appropriate presentation (tables/graphs), and calculations.",
    levelDescriptions: () => [
      "No data collected or data is clearly inaccurate.",
      "Data collected but presentation is disorganized. Errors in calculations.",
      "Accurate data with clear tables/graphs. Correct calculations.",
      "Thorough data collection with professional visualization. Statistical analysis included.",
    ],
  },
  {
    name: "Analysis & Conclusion",
    weight: 25,
    description: "Depth of analysis, connection to hypothesis, discussion of errors and limitations.",
    levelDescriptions: () => [
      "No analysis. Conclusion is absent or unrelated to data.",
      "Basic analysis but conclusion is not well-supported by data.",
      "Solid analysis connecting results to hypothesis. Discusses sources of error.",
      "Insightful analysis with thorough error discussion. Suggests improvements and future experiments.",
    ],
  },
  {
    name: "Formatting & References",
    weight: 10,
    description: "Adherence to lab report format, proper citations, and professional presentation.",
    levelDescriptions: () => [
      "Format is incorrect. No references.",
      "Partial adherence to format. Incomplete references.",
      "Correct format with proper references.",
      "Professional presentation. Thorough, correctly formatted references.",
    ],
  },
];

const CODE_CRITERIA: CriterionTemplate[] = [
  {
    name: "Correctness & Functionality",
    weight: 35,
    description: "Does the code work correctly? Does it handle edge cases? Does it produce correct output?",
    levelDescriptions: () => [
      "Code does not run or produces incorrect results.",
      "Code runs but has bugs. Handles only basic cases.",
      "Code works correctly for all specified requirements including edge cases.",
      "Flawless functionality. Handles edge cases, invalid input, and boundary conditions gracefully.",
    ],
  },
  {
    name: "Code Quality & Style",
    weight: 25,
    description: "Readability, naming conventions, formatting, comments, and adherence to style guide.",
    levelDescriptions: () => [
      "Unreadable code. No comments. Poor naming conventions.",
      "Some structure but inconsistent style. Minimal comments.",
      "Clean, readable code with meaningful names and appropriate comments.",
      "Exemplary code quality. Self-documenting with concise, helpful comments where needed.",
    ],
  },
  {
    name: "Design & Architecture",
    weight: 20,
    description: "Code organization, modularity, use of functions/classes, and design patterns.",
    levelDescriptions: () => [
      "Monolithic code with no structure. No functions or classes.",
      "Some attempt at structure but code is still largely monolithic.",
      "Well-structured with appropriate use of functions, classes, and modules.",
      "Excellent architecture. Clean separation of concerns, appropriate design patterns, and extensibility.",
    ],
  },
  {
    name: "Testing",
    weight: 10,
    description: "Presence and quality of tests, coverage of edge cases, and test documentation.",
    levelDescriptions: () => [
      "No tests provided.",
      "Minimal testing. Only tests happy path.",
      "Good test coverage including edge cases.",
      "Comprehensive test suite with unit, integration, and edge case tests. Clear test documentation.",
    ],
  },
  {
    name: "Documentation",
    weight: 10,
    description: "README, usage instructions, API documentation, and setup guide.",
    levelDescriptions: () => [
      "No documentation.",
      "Minimal documentation. Missing key information.",
      "Clear README with setup instructions and usage examples.",
      "Comprehensive documentation including API docs, examples, architecture overview, and contribution guide.",
    ],
  },
];

const ASSIGNMENT_TEMPLATES: Record<string, CriterionTemplate[]> = {
  essay: ESSAY_CRITERIA,
  presentation: PRESENTATION_CRITERIA,
  project: PROJECT_CRITERIA,
  lab_report: LAB_REPORT_CRITERIA,
  code: CODE_CRITERIA,
};

// ── Main ───────────────────────────────────────────────────────────────────────

export function gradeRubric(input: GradeRubricInput): GradeRubricResult {
  const assignmentTitle = requireNonEmpty(input.assignment_title, "assignment_title");
  const assignmentType = requireNonEmpty(input.assignment_type, "assignment_type").toLowerCase();
  const criteriaCount = clamp(input.criteria_count ?? 4, 2, 10);
  const totalPoints = clamp(input.total_points ?? 100, 10, 1000);
  const scaleLevels = clamp(input.scale_levels ?? 4, 3, 6);

  const templates = ASSIGNMENT_TEMPLATES[assignmentType];
  if (!templates) {
    const valid = Object.keys(ASSIGNMENT_TEMPLATES).join(", ");
    throw new Error(`Unknown assignment type: "${assignmentType}". Valid types: ${valid}`);
  }

  const labels = rubricLabels(scaleLevels);
  const selectedTemplates = templates.slice(0, criteriaCount);

  // Normalize weights to sum to 100
  const totalWeight = selectedTemplates.reduce((sum, t) => sum + t.weight, 0);

  const criteria: RubricCriterion[] = selectedTemplates.map((tpl) => {
    const normalizedWeight = Math.round((tpl.weight / totalWeight) * 100);
    const descriptions = tpl.levelDescriptions(labels);

    const levels: RubricLevel[] = labels.map((label, idx) => ({
      score: Math.round((totalPoints * normalizedWeight / 100) * ((idx + 1) / scaleLevels)),
      label,
      description: descriptions[idx] ?? `Meets ${label.toLowerCase()} level expectations.`,
    }));

    return {
      name: tpl.name,
      weight: normalizedWeight,
      description: tpl.description,
      levels,
    };
  });

  // Adjust weights to sum to exactly 100
  const currentSum = criteria.reduce((s, c) => s + c.weight, 0);
  if (currentSum !== 100 && criteria.length > 0) {
    criteria[0].weight += 100 - currentSum;
  }

  const gradingNotes = [
    `Total points: ${totalPoints}. Each criterion is weighted as shown.`,
    `Use this rubric as a guide — provide specific feedback alongside scores.`,
    `When a student falls between two levels, use the lower level's score as a base and add points for demonstrated strengths.`,
    `Consider effort and improvement when providing qualitative feedback, even if the rubric is criterion-based.`,
    `Share this rubric with students before the assignment so they understand expectations.`,
  ];

  return {
    assignment_title: assignmentTitle,
    assignment_type: assignmentType,
    total_points: totalPoints,
    criteria,
    grading_notes: gradingNotes,
    metadata: {
      generated_at: timestamp(),
      scale: `${scaleLevels}-point scale (${labels.join(", ")})`,
    },
  };
}
