#!/usr/bin/env node

/**
 * education-mcp — AI-powered education tools via MCP.
 *
 * Tools: generate_quiz, generate_lesson_plan, generate_flashcards,
 *        explain_concept, generate_exercise, grade_rubric
 *
 * Author: SceneView Tools
 * License: MIT
 *
 * DISCLAIMER: This tool generates educational content for reference purposes.
 * Teachers should review all generated content before use in classrooms.
 * This is not a substitute for professional curriculum development.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("education-mcp server started on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
