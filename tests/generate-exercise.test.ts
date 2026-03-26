import { describe, it, expect } from "vitest";
import { generateExercise } from "../src/tools/generate-exercise.js";

describe("generateExercise", () => {
  it("generates 3 math exercises by default", () => {
    const result = generateExercise({ topic: "algebra", subject: "math" });
    expect(result.exercise_count).toBe(3);
    expect(result.exercises).toHaveLength(3);
  });

  it("respects custom count", () => {
    const result = generateExercise({ topic: "test", subject: "math", exercise_count: 5 });
    expect(result.exercise_count).toBe(5);
  });

  it("generates physics exercises", () => {
    const result = generateExercise({ topic: "kinematics", subject: "physics" });
    expect(result.subject).toBe("physics");
    expect(result.exercises[0].subject).toBe("physics");
  });

  it("generates chemistry exercises", () => {
    const result = generateExercise({ topic: "balancing equations", subject: "chemistry" });
    expect(result.subject).toBe("chemistry");
  });

  it("generates biology exercises", () => {
    const result = generateExercise({ topic: "DNA", subject: "biology" });
    expect(result.subject).toBe("biology");
  });

  it("generates CS exercises", () => {
    const result = generateExercise({ topic: "binary", subject: "computer_science" });
    expect(result.subject).toBe("computer_science");
  });

  it("exercises have step-by-step solutions by default", () => {
    const result = generateExercise({ topic: "test", subject: "math" });
    for (const ex of result.exercises) {
      expect(ex.solution.steps.length).toBeGreaterThan(0);
      expect(ex.solution.final_answer).toBeTruthy();
    }
  });

  it("hides steps when show_steps is false", () => {
    const result = generateExercise({ topic: "test", subject: "math", show_steps: false });
    for (const ex of result.exercises) {
      expect(ex.solution.steps).toHaveLength(0);
      expect(ex.solution.final_answer).toBeTruthy();
    }
  });

  it("includes hints by default", () => {
    const result = generateExercise({ topic: "test", subject: "math" });
    expect(result.exercises[0].hints.length).toBeGreaterThan(0);
  });

  it("excludes hints when asked", () => {
    const result = generateExercise({ topic: "test", subject: "math", include_hints: false });
    expect(result.exercises[0].hints).toHaveLength(0);
  });

  it("has common mistakes", () => {
    const result = generateExercise({ topic: "test", subject: "math" });
    expect(result.exercises[0].common_mistakes.length).toBeGreaterThan(0);
  });

  it("has metadata with skills practiced", () => {
    const result = generateExercise({ topic: "test", subject: "math" });
    expect(result.metadata.skills_practiced.length).toBeGreaterThan(0);
    expect(result.metadata.estimated_completion_minutes).toBeGreaterThan(0);
  });

  it("exercises have sequential IDs", () => {
    const result = generateExercise({ topic: "test", subject: "physics", exercise_count: 5 });
    expect(result.exercises.map((e) => e.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it("easy exercises have lower time estimate", () => {
    const easy = generateExercise({ topic: "test", subject: "math", difficulty: "easy", exercise_count: 5 });
    const hard = generateExercise({ topic: "test", subject: "math", difficulty: "hard", exercise_count: 5 });
    expect(easy.metadata.estimated_completion_minutes).toBeLessThan(hard.metadata.estimated_completion_minutes);
  });

  it("throws on empty topic", () => {
    expect(() => generateExercise({ topic: "", subject: "math" })).toThrow();
  });
});
