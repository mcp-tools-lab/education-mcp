# education-mcp

AI-powered education tools for teachers and students via the [Model Context Protocol](https://modelcontextprotocol.io).

Generate quizzes, lesson plans, flashcards, concept explanations, exercises, and grading rubrics — all from your AI assistant.

## Tools

| Tool | Description |
|---|---|
| `generate_quiz` | Multiple choice, true/false, and fill-in-blank quizzes from any topic |
| `generate_lesson_plan` | Structured lesson plans with Bloom's taxonomy objectives, timed activities, assessment, and differentiation |
| `generate_flashcards` | Spaced repetition flashcard decks with hints, tags, and Leitner review schedules |
| `explain_concept` | Age-appropriate explanations at beginner/intermediate/expert levels with analogies and examples |
| `generate_exercise` | Math, physics, chemistry, biology, and CS exercises with step-by-step solutions |
| `grade_rubric` | Grading rubrics for essays, presentations, projects, lab reports, and code assignments |

## Quick Start

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "education": {
      "command": "npx",
      "args": ["-y", "education-mcp"]
    }
  }
}
```

### With any MCP client

```bash
npx education-mcp
```

## Examples

### Generate a Quiz

```
generate_quiz({
  topic: "photosynthesis",
  question_count: 10,
  question_types: ["multiple_choice", "true_false"],
  difficulty: "medium"
})
```

### Create a Lesson Plan

```
generate_lesson_plan({
  topic: "fractions",
  subject: "Mathematics",
  grade_level: "5th grade",
  duration_minutes: 45,
  include_homework: true
})
```

### Make Flashcards

```
generate_flashcards({
  topic: "Spanish irregular verbs",
  card_count: 20,
  difficulty: "medium",
  include_hints: true
})
```

### Explain a Concept

```
explain_concept({
  concept: "gravity",
  level: "beginner",
  age_group: "elementary",
  include_analogy: true
})
```

### Generate Exercises

```
generate_exercise({
  topic: "kinematics",
  subject: "physics",
  exercise_count: 5,
  difficulty: "hard",
  show_steps: true
})
```

### Create a Grading Rubric

```
grade_rubric({
  assignment_title: "Research Paper on Climate Change",
  assignment_type: "essay",
  total_points: 100,
  scale_levels: 4
})
```

## Pricing

| | Free | Pro ($9.99/month) |
|---|---|---|
| Calls per month | 30 | Unlimited |
| All 6 tools | Yes | Yes |
| Custom templates | No | Yes |
| Priority generation | No | Yes |

## Development

```bash
npm install
npm run build
npm test
```

### Run tests

```bash
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

## Disclaimer

This tool generates educational content for reference purposes. Teachers should review all generated content before classroom use. This is not a substitute for professional curriculum development.

## License

MIT - SceneView Tools

See [TERMS.md](TERMS.md) and [PRIVACY.md](PRIVACY.md) for full legal details.
