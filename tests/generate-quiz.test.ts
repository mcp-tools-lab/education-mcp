import { describe, it, expect } from "vitest";
import { generateQuiz } from "../src/tools/generate-quiz.js";

describe("generateQuiz", () => {
  it("generates default 5 questions", () => {
    const result = generateQuiz({ topic: "photosynthesis" });
    expect(result.question_count).toBe(5);
    expect(result.questions).toHaveLength(5);
  });

  it("respects custom question count", () => {
    const result = generateQuiz({ topic: "algebra", question_count: 10 });
    expect(result.question_count).toBe(10);
  });

  it("clamps question count to max 50", () => {
    const result = generateQuiz({ topic: "test", question_count: 100 });
    expect(result.question_count).toBe(50);
  });

  it("clamps question count to min 1", () => {
    const result = generateQuiz({ topic: "test", question_count: 0 });
    expect(result.question_count).toBe(1);
  });

  it("sets topic correctly", () => {
    const result = generateQuiz({ topic: "World War II" });
    expect(result.topic).toBe("World War II");
  });

  it("uses default medium difficulty", () => {
    const result = generateQuiz({ topic: "math" });
    expect(result.difficulty).toBe("medium");
  });

  it("respects custom difficulty", () => {
    const result = generateQuiz({ topic: "physics", difficulty: "hard" });
    expect(result.difficulty).toBe("hard");
  });

  it("auto-detects subject", () => {
    const result = generateQuiz({ topic: "quadratic equations" });
    expect(result.metadata.subject_area).toBe("Mathematics");
  });

  it("uses custom subject when provided", () => {
    const result = generateQuiz({ topic: "test", subject: "Art History" });
    expect(result.metadata.subject_area).toBe("Art History");
  });

  it("generates only multiple choice when specified", () => {
    const result = generateQuiz({
      topic: "history",
      question_count: 5,
      question_types: ["multiple_choice"],
    });
    expect(result.questions.every((q) => q.type === "multiple_choice")).toBe(true);
  });

  it("generates only true/false when specified", () => {
    const result = generateQuiz({
      topic: "biology",
      question_count: 5,
      question_types: ["true_false"],
    });
    expect(result.questions.every((q) => q.type === "true_false")).toBe(true);
  });

  it("generates only fill-in-blank when specified", () => {
    const result = generateQuiz({
      topic: "chemistry",
      question_count: 5,
      question_types: ["fill_in_blank"],
    });
    expect(result.questions.every((q) => q.type === "fill_in_blank")).toBe(true);
  });

  it("assigns sequential IDs after shuffle", () => {
    const result = generateQuiz({ topic: "test", question_count: 10 });
    const ids = result.questions.map((q) => q.id);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("every question has an explanation", () => {
    const result = generateQuiz({ topic: "science", question_count: 10 });
    for (const q of result.questions) {
      expect(q.explanation).toBeTruthy();
      expect(q.explanation.length).toBeGreaterThan(10);
    }
  });

  it("multiple choice questions have options", () => {
    const result = generateQuiz({
      topic: "test",
      question_count: 3,
      question_types: ["multiple_choice"],
    });
    for (const q of result.questions) {
      expect(q.options).toBeDefined();
      expect(q.options!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("has metadata with timestamp and estimated duration", () => {
    const result = generateQuiz({ topic: "test" });
    expect(result.metadata.generated_at).toBeTruthy();
    expect(result.metadata.estimated_duration_minutes).toBeGreaterThan(0);
  });

  it("throws on empty topic", () => {
    expect(() => generateQuiz({ topic: "" })).toThrow();
  });

  it("throws on whitespace-only topic", () => {
    expect(() => generateQuiz({ topic: "   " })).toThrow();
  });
});
