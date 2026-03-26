import { describe, it, expect } from "vitest";
import { generateLessonPlan } from "../src/tools/generate-lesson-plan.js";

describe("generateLessonPlan", () => {
  const base = { topic: "fractions", subject: "Mathematics", grade_level: "5th grade" };

  it("generates a lesson plan with correct title", () => {
    const result = generateLessonPlan(base);
    expect(result.title).toContain("fractions");
    expect(result.subject).toBe("Mathematics");
  });

  it("defaults to 45 minutes", () => {
    const result = generateLessonPlan(base);
    expect(result.duration_minutes).toBe(45);
  });

  it("respects custom duration", () => {
    const result = generateLessonPlan({ ...base, duration_minutes: 90 });
    expect(result.duration_minutes).toBe(90);
  });

  it("clamps duration min 15", () => {
    const result = generateLessonPlan({ ...base, duration_minutes: 5 });
    expect(result.duration_minutes).toBe(15);
  });

  it("generates 3 objectives by default", () => {
    const result = generateLessonPlan(base);
    expect(result.objectives).toHaveLength(3);
  });

  it("objectives have Bloom's levels", () => {
    const result = generateLessonPlan(base);
    const blooms = result.objectives.map((o) => o.bloom_level);
    expect(blooms.every((b) => ["remember", "understand", "apply", "analyze", "evaluate", "create"].includes(b))).toBe(true);
  });

  it("has warm-up, activities, and closure", () => {
    const result = generateLessonPlan(base);
    expect(result.warm_up).toBeDefined();
    expect(result.warm_up.name).toBeTruthy();
    expect(result.activities.length).toBeGreaterThanOrEqual(1);
    expect(result.closure).toBeDefined();
  });

  it("activity durations roughly sum to total", () => {
    const result = generateLessonPlan({ ...base, duration_minutes: 60 });
    const total = result.warm_up.duration_minutes
      + result.activities.reduce((s, a) => s + a.duration_minutes, 0)
      + result.closure.duration_minutes;
    expect(total).toBe(60);
  });

  it("includes standards by default", () => {
    const result = generateLessonPlan(base);
    expect(result.standards).toBeDefined();
    expect(result.standards!.length).toBeGreaterThan(0);
  });

  it("excludes standards when asked", () => {
    const result = generateLessonPlan({ ...base, include_standards: false });
    expect(result.standards).toBeUndefined();
  });

  it("excludes homework by default", () => {
    const result = generateLessonPlan(base);
    expect(result.homework).toBeUndefined();
  });

  it("includes homework when asked", () => {
    const result = generateLessonPlan({ ...base, include_homework: true });
    expect(result.homework).toBeTruthy();
  });

  it("has differentiation for all three groups", () => {
    const result = generateLessonPlan(base);
    expect(result.differentiation.struggling).toBeTruthy();
    expect(result.differentiation.advanced).toBeTruthy();
    expect(result.differentiation.ell).toBeTruthy();
  });

  it("has assessment items", () => {
    const result = generateLessonPlan(base);
    expect(result.assessment.length).toBeGreaterThanOrEqual(2);
    expect(result.assessment.some((a) => a.type === "formative")).toBe(true);
    expect(result.assessment.some((a) => a.type === "summative")).toBe(true);
  });

  it("has materials list", () => {
    const result = generateLessonPlan(base);
    expect(result.materials.length).toBeGreaterThan(0);
  });

  it("throws on empty topic", () => {
    expect(() => generateLessonPlan({ ...base, topic: "" })).toThrow();
  });

  it("throws on empty subject", () => {
    expect(() => generateLessonPlan({ ...base, subject: "" })).toThrow();
  });
});
