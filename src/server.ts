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
  searchPapers,
  getAuthorProfile,
  getCitationStats,
  formatCitation,
} from "./tools/index.js";
import { RATE_LIMITS } from "./types.js";

// Re-export zod from the SDK for schema definitions
// The MCP SDK bundles zod, so we use it from there.

export function createServer(): McpServer {
  const server = new McpServer({
    name: "education-mcp",
    version: "1.1.0",
    description:
      "AI-powered education tools for teachers and students. Generate quizzes, lesson plans, flashcards, concept explanations, exercises, and grading rubrics. " +
      "Search 250M+ academic papers, look up researchers, and get citation stats via OpenAlex.",
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

  // ── search_papers (OpenAlex API) ────────────────────────────────────────────

  server.tool(
    "search_papers",
    "Search 250M+ academic papers via OpenAlex (free, no auth). Returns title, authors, " +
      "year, journal, citation count, DOI, abstract snippet, topics, and open access URL. " +
      "Supports filtering by year range, domain, minimum citations, publication type, and " +
      "sorting by relevance, citation count, or date. Great for literature reviews and research.",
    {
      query: z.string().min(1).describe("Search query — topic, keywords, or phrase (e.g., 'machine learning in education', 'CRISPR gene editing')"),
      per_page: z.number().int().min(1).max(25).optional().describe("Results to return (default: 5, max: 25)"),
      year_from: z.number().int().optional().describe("Filter: earliest publication year (e.g., 2020)"),
      year_to: z.number().int().optional().describe("Filter: latest publication year (e.g., 2024)"),
      open_access_only: z.boolean().optional().describe("Only return open access papers with full text available (default: false)"),
      domain: z.string().optional().describe("Academic domain to focus on (e.g., 'medicine', 'computer science', 'biology', 'psychology'). Improves relevance for interdisciplinary queries."),
      min_citations: z.number().int().min(0).optional().describe("Minimum citation count — use to filter for high-impact papers (e.g., 50 = papers cited at least 50 times)"),
      sort_by: z.enum(["relevance", "citations", "date"]).optional().describe("Sort order: 'relevance' (default, best text match), 'citations' (most cited first — best for finding seminal works), 'date' (newest first)"),
      type: z.enum(["article", "review", "preprint", "book-chapter"]).optional().describe("Publication type filter: 'article' (peer-reviewed), 'review' (systematic reviews/meta-analyses), 'preprint', 'book-chapter'"),
    },
    async (args) => {
      try {
        const text = await searchPapers(args);
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── get_author_profile (OpenAlex API) ──────────────────────────────────────

  server.tool(
    "get_author_profile",
    "Look up a researcher by name via OpenAlex. Returns institution, h-index, " +
      "citation count, works count, and top research topics. Useful for finding " +
      "experts or checking a researcher's impact.",
    {
      name: z.string().min(1).describe("Researcher name to search (e.g., 'Yann LeCun', 'Marie Curie')"),
      per_page: z.number().int().min(1).max(10).optional().describe("Number of results (default: 3, max: 10)"),
    },
    async (args) => {
      try {
        const text = await getAuthorProfile(args);
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── get_citation_stats (OpenAlex API) ──────────────────────────────────────

  server.tool(
    "get_citation_stats",
    "Get citation metrics for a specific paper by DOI via OpenAlex. Returns citation " +
      "count, referenced works, open access status, concepts, and yearly citation trend.",
    {
      doi: z.string().min(1).describe("Paper DOI (e.g., '10.1038/s41586-021-03819-2' or 'https://doi.org/10.1038/s41586-021-03819-2')"),
    },
    async (args) => {
      try {
        const text = await getCitationStats(args);
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── format_citation ───────────────────────────────────────────────────────

  server.tool(
    "format_citation",
    "Format an academic citation in APA 7th, MLA 9th, Chicago 17th (author-date), or Vancouver style. " +
      "Supports journal articles, books, book chapters, websites, conference papers, theses, and preprints. " +
      "Pair with search_papers to find a source via OpenAlex and then format it instantly.",
    {
      style: z
        .enum(["apa", "mla", "chicago", "vancouver"])
        .describe("Citation style: 'apa' (APA 7th), 'mla' (MLA 9th), 'chicago' (Chicago 17th author-date), 'vancouver' (medical/health sciences)"),
      sourceType: z
        .enum(["journal", "book", "chapter", "website", "conference", "thesis", "preprint"])
        .describe("Type of source to cite"),
      authors: z
        .array(
          z.object({
            lastName: z.string().describe("Author's last name"),
            firstName: z.string().optional().describe("Author's first name or given name"),
            initials: z.string().optional().describe("Pre-computed initials (e.g. 'A. B.' — used in Vancouver style)"),
          })
        )
        .describe("List of authors in order"),
      title: z.string().describe("Title of the article, book, chapter, or web page"),
      year: z
        .union([z.number().int(), z.string()])
        .optional()
        .describe("Publication year (e.g. 2024). Leave empty if unknown."),
      journal: z.string().optional().describe("Journal or periodical name (for journal articles and preprints)"),
      volume: z.string().optional().describe("Volume number"),
      issue: z.string().optional().describe("Issue number"),
      pages: z.string().optional().describe("Page range (e.g. '123-145' or '12–34')"),
      doi: z.string().optional().describe("DOI without the https://doi.org/ prefix (e.g. '10.1234/abc')"),
      publisher: z.string().optional().describe("Publisher name (for books and chapters)"),
      publisherCity: z.string().optional().describe("Publisher city (Chicago style)"),
      bookTitle: z.string().optional().describe("Book title (for chapters within a book)"),
      editors: z
        .array(
          z.object({
            lastName: z.string(),
            firstName: z.string().optional(),
          })
        )
        .optional()
        .describe("Book editors (for chapters)"),
      websiteName: z.string().optional().describe("Website or platform name"),
      url: z.string().optional().describe("Full URL"),
      accessDate: z.string().optional().describe("Date the source was accessed (ISO 8601: 'YYYY-MM-DD') — required for websites"),
      conferenceName: z.string().optional().describe("Conference name (for conference papers)"),
      edition: z.string().optional().describe("Edition (e.g. '3rd' or '2nd revised')"),
      institution: z.string().optional().describe("Institution name (for theses)"),
      thesisType: z.string().optional().describe("Thesis type (e.g. 'PhD dissertation', \"Master's thesis\")"),
    },
    async (args) => {
      try {
        const result = formatCitation(args as any);
        const lines = [
          `## ${result.style} Citation — ${result.sourceType}`,
          "",
          `### Reference list entry`,
          result.citation,
          "",
          `### In-text citation`,
          result.inTextCitation,
        ];
        if (result.notes.length > 0) {
          lines.push("", "### Notes");
          for (const note of result.notes) {
            lines.push(`- ${note}`);
          }
        }
        return { content: [{ type: "text" as const, text: lines.join("\n") }] };
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
