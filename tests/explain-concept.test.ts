import { describe, it, expect } from "vitest";
import { explainConcept } from "../src/tools/explain-concept.js";

describe("explainConcept", () => {
  it("generates a beginner explanation by default", () => {
    const result = explainConcept({ concept: "gravity" });
    expect(result.level).toBe("beginner");
    expect(result.explanation).toBeTruthy();
  });

  it("generates intermediate explanation", () => {
    const result = explainConcept({ concept: "gravity", level: "intermediate" });
    expect(result.level).toBe("intermediate");
  });

  it("generates expert explanation", () => {
    const result = explainConcept({ concept: "gravity", level: "expert" });
    expect(result.level).toBe("expert");
  });

  it("defaults to high_school age group", () => {
    const result = explainConcept({ concept: "test" });
    expect(result.age_group).toBe("high_school");
  });

  it("uses elementary language for elementary age group", () => {
    const result = explainConcept({ concept: "gravity", level: "beginner", age_group: "elementary" });
    expect(result.explanation).toBeTruthy();
    expect(result.age_group).toBe("elementary");
  });

  it("includes analogy by default", () => {
    const result = explainConcept({ concept: "test" });
    expect(result.analogy).toBeTruthy();
  });

  it("excludes analogy when asked", () => {
    const result = explainConcept({ concept: "test", include_analogy: false });
    expect(result.analogy).toBeUndefined();
  });

  it("includes examples by default", () => {
    const result = explainConcept({ concept: "test" });
    expect(result.examples.length).toBeGreaterThan(0);
  });

  it("excludes examples when asked", () => {
    const result = explainConcept({ concept: "test", include_examples: false });
    expect(result.examples).toHaveLength(0);
  });

  it("has key points", () => {
    const result = explainConcept({ concept: "test" });
    expect(result.key_points.length).toBeGreaterThanOrEqual(3);
  });

  it("has common misconceptions", () => {
    const result = explainConcept({ concept: "test" });
    expect(result.common_misconceptions.length).toBeGreaterThan(0);
  });

  it("has prerequisites", () => {
    const result = explainConcept({ concept: "test" });
    expect(result.prerequisites.length).toBeGreaterThan(0);
  });

  it("has related concepts", () => {
    const result = explainConcept({ concept: "test" });
    expect(result.related_concepts.length).toBeGreaterThan(0);
  });

  it("has metadata with word count", () => {
    const result = explainConcept({ concept: "test" });
    expect(result.metadata.word_count).toBeGreaterThan(0);
    expect(result.metadata.generated_at).toBeTruthy();
  });

  it("respects max_length", () => {
    const result = explainConcept({ concept: "test", max_length: 50 });
    const wc = result.explanation.split(/\s+/).filter(Boolean).length;
    expect(wc).toBeLessThanOrEqual(55); // some tolerance for "..."
  });

  it("throws on empty concept", () => {
    expect(() => explainConcept({ concept: "" })).toThrow();
  });
});
