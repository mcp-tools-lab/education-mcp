/**
 * MCP Server for education-mcp.
 *
 * Registers all 6 education tools and exposes them via the Model Context Protocol.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  generateQuiz,
  generateLessonPlan,
  generateFlashcards,
  explainConcept,
  generateExercise,
  gradeRubric,
} from "./tools/index.js";
import { RATE_LIMITS } from "./types.js";

// Re-export zod from the SDK for schema definitions
// The MCP SDK bundles zod, so we use it from there.

export function createServer(): McpServer {
  const server = new McpServer({
    name: "education-mcp",
    version: "1.0.0",
    description:
      "AI-powered education tools for teachers and students. Generate quizzes, lesson plans, flashcards, concept explanations, exercises, and grading rubrics.",
  });

  // ── generate_quiz ──────────────────────────────────────────────────────────

  server.tool(
    "generate_quiz",
    "Create a quiz from a topic with multiple choice, true/false, and fill-in-blank questions. Perfect for formative assessment, test prep, and homework.",
    {
      topic: z.string().min(1).describe("The topic to generate questions about (e.g., 'photosynthesis', 'World War II', 'quadratic equations')"),
      question_count: z.number().int().min(1).max(50).optional().describe("Number of questions (default: 5, max: 50)"),
      question_types: z
        .array(z.enum(["multiple_choice", "true_false", "fill_in_blank"]))
        .optional()
        .describe("Types of questions to include (default: all three)"),
      difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("Difficulty level (default: medium)"),
      subject: z.string().optional().describe("Subject area (auto-detected if omitted)"),
      age_group: z
        .enum(["elementary", "middle_school", "high_school", "college", "adult"])
        .optional()
        .describe("Target age group (default: inferred from difficulty)"),
    },
    async (args) => {
      try {
        const result = generateQuiz(args);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── generate_lesson_plan ───────────────────────────────────────────────────

  server.tool(
    "generate_lesson_plan",
    "Create a structured lesson plan with learning objectives (Bloom's taxonomy), timed activities, assessment strategies, and differentiation. Follows the Madeline Hunter model.",
    {
      topic: z.string().min(1).describe("Lesson topic (e.g., 'fractions', 'the water cycle')"),
      subject: z.string().min(1).describe("Subject area (e.g., 'Mathematics', 'Science')"),
      grade_level: z.string().min(1).describe("Grade level (e.g., '5th grade', 'AP Biology')"),
      duration_minutes: z.number().int().min(15).max(180).optional().describe("Lesson duration in minutes (default: 45)"),
      objectives_count: z.number().int().min(1).max(6).optional().describe("Number of learning objectives (default: 3)"),
      include_standards: z.boolean().optional().describe("Include standards alignment (default: true)"),
      include_homework: z.boolean().optional().describe("Include homework assignment (default: false)"),
    },
    async (args) => {
      try {
        const result = generateLessonPlan(args);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── generate_flashcards ────────────────────────────────────────────────────

  server.tool(
    "generate_flashcards",
    "Create a spaced repetition flashcard deck from a topic. Cards include front/back, optional hints, difficulty tags, and a review schedule based on the Leitner system.",
    {
      topic: z.string().min(1).describe("Topic for the flashcard deck (e.g., 'Spanish vocabulary', 'cell biology')"),
      card_count: z.number().int().min(1).max(100).optional().describe("Number of flashcards (default: 10, max: 100)"),
      difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("Maximum difficulty level (default: medium)"),
      include_hints: z.boolean().optional().describe("Include study hints on cards (default: true)"),
      tags: z.array(z.string()).optional().describe("Custom tags for organizing cards"),
    },
    async (args) => {
      try {
        const result = generateFlashcards(args);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── explain_concept ────────────────────────────────────────────────────────

  server.tool(
    "explain_concept",
    "Explain a concept at different levels (beginner/intermediate/expert) and for different age groups. Includes analogies, examples, prerequisites, and common misconceptions.",
    {
      concept: z.string().min(1).describe("The concept to explain (e.g., 'gravity', 'photosynthesis', 'machine learning')"),
      level: z.enum(["beginner", "intermediate", "expert"]).optional().describe("Explanation depth (default: beginner)"),
      age_group: z
        .enum(["elementary", "middle_school", "high_school", "college", "adult"])
        .optional()
        .describe("Target age group for vocabulary and examples (default: high_school)"),
      include_analogy: z.boolean().optional().describe("Include a relatable analogy (default: true)"),
      include_examples: z.boolean().optional().describe("Include practical examples (default: true)"),
      max_length: z.number().int().min(50).max(2000).optional().describe("Maximum word count (default: 500)"),
    },
    async (args) => {
      try {
        const result = explainConcept(args);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── generate_exercise ──────────────────────────────────────────────────────

  server.tool(
    "generate_exercise",
    "Generate math, physics, chemistry, biology, or computer science exercises with step-by-step solutions, hints, and common mistakes. Great for homework and practice sets.",
    {
      topic: z.string().min(1).describe("Exercise topic (e.g., 'linear equations', 'kinematics', 'DNA replication')"),
      subject: z
        .enum(["math", "physics", "chemistry", "biology", "computer_science"])
        .describe("Subject area for the exercises"),
      exercise_count: z.number().int().min(1).max(20).optional().describe("Number of exercises (default: 3, max: 20)"),
      difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("Difficulty level (default: medium)"),
      include_hints: z.boolean().optional().describe("Include hints for each exercise (default: true)"),
      show_steps: z.boolean().optional().describe("Show step-by-step solutions (default: true)"),
    },
    async (args) => {
      try {
        const result = generateExercise(args);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── grade_rubric ───────────────────────────────────────────────────────────

  server.tool(
    "grade_rubric",
    "Create a detailed grading rubric for an assignment. Supports essays, presentations, projects, lab reports, and code assignments. Rubrics include weighted criteria with level descriptors.",
    {
      assignment_title: z.string().min(1).describe("Title of the assignment (e.g., 'Research Paper on Climate Change')"),
      assignment_type: z
        .enum(["essay", "presentation", "project", "lab_report", "code"])
        .describe("Type of assignment"),
      criteria_count: z.number().int().min(2).max(10).optional().describe("Number of grading criteria (default: 4)"),
      total_points: z.number().int().min(10).max(1000).optional().describe("Total points possible (default: 100)"),
      scale_levels: z.number().int().min(3).max(6).optional().describe("Number of performance levels (default: 4, e.g., Beginning/Developing/Proficient/Exemplary)"),
      subject: z.string().optional().describe("Subject area for context-specific criteria"),
    },
    async (args) => {
      try {
        const result = gradeRubric(args);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── Pricing resource ───────────────────────────────────────────────────────

  server.resource(
    "pricing",
    "education://pricing",
    async () => ({
      contents: [
        {
          uri: "education://pricing",
          mimeType: "application/json",
          text: JSON.stringify({
            free_tier: {
              calls_per_month: RATE_LIMITS.freeMonthlyLimit,
              features: "All 6 tools with standard output",
            },
            pro_tier: {
              price_usd: RATE_LIMITS.proPriceUsd,
              period: "month",
              calls_per_month: "unlimited",
              features: "All 6 tools, priority generation, extended output, custom templates",
            },
          }),
        },
      ],
    })
  );

  return server;
}
