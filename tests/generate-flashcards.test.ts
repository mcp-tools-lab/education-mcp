import { describe, it, expect } from "vitest";
import { generateFlashcards } from "../src/tools/generate-flashcards.js";

describe("generateFlashcards", () => {
  it("generates default 10 cards", () => {
    const result = generateFlashcards({ topic: "Spanish vocabulary" });
    expect(result.card_count).toBe(10);
    expect(result.cards).toHaveLength(10);
  });

  it("respects custom card count", () => {
    const result = generateFlashcards({ topic: "test", card_count: 5 });
    expect(result.card_count).toBe(5);
  });

  it("clamps card count", () => {
    expect(generateFlashcards({ topic: "test", card_count: 200 }).card_count).toBe(100);
    expect(generateFlashcards({ topic: "test", card_count: 0 }).card_count).toBe(1);
  });

  it("cards have front and back", () => {
    const result = generateFlashcards({ topic: "biology" });
    for (const card of result.cards) {
      expect(card.front).toBeTruthy();
      expect(card.back).toBeTruthy();
    }
  });

  it("includes hints by default", () => {
    const result = generateFlashcards({ topic: "test" });
    const withHints = result.cards.filter((c) => c.hint);
    expect(withHints.length).toBeGreaterThan(0);
  });

  it("excludes hints when asked", () => {
    const result = generateFlashcards({ topic: "test", include_hints: false });
    expect(result.cards.every((c) => !c.hint)).toBe(true);
  });

  it("cards have SR metadata", () => {
    const result = generateFlashcards({ topic: "test" });
    for (const card of result.cards) {
      expect(card.sr).toBeDefined();
      expect(card.sr.interval_days).toBe(1);
      expect(card.sr.ease_factor).toBeGreaterThan(0);
      expect(card.sr.repetitions).toBe(0);
    }
  });

  it("cards have tags", () => {
    const result = generateFlashcards({ topic: "test", tags: ["midterm"] });
    expect(result.cards[0].tags).toContain("midterm");
  });

  it("auto-detects tags from subject", () => {
    const result = generateFlashcards({ topic: "calculus" });
    expect(result.cards[0].tags.length).toBeGreaterThan(0);
  });

  it("has study tips", () => {
    const result = generateFlashcards({ topic: "test" });
    expect(result.study_tips.length).toBeGreaterThanOrEqual(3);
  });

  it("has review schedule", () => {
    const result = generateFlashcards({ topic: "test" });
    expect(result.metadata.review_schedule.length).toBeGreaterThanOrEqual(3);
    expect(result.metadata.review_schedule[0]).toContain("1 day");
  });

  it("has estimated study minutes", () => {
    const result = generateFlashcards({ topic: "test", card_count: 10 });
    expect(result.metadata.estimated_study_minutes).toBeGreaterThan(0);
  });

  it("throws on empty topic", () => {
    expect(() => generateFlashcards({ topic: "" })).toThrow();
  });
});
