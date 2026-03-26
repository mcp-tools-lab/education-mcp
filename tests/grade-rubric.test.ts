import { describe, it, expect } from "vitest";
import { gradeRubric } from "../src/tools/grade-rubric.js";

describe("gradeRubric", () => {
  it("generates an essay rubric", () => {
    const result = gradeRubric({ assignment_title: "Research Paper", assignment_type: "essay" });
    expect(result.assignment_title).toBe("Research Paper");
    expect(result.assignment_type).toBe("essay");
  });

  it("generates a presentation rubric", () => {
    const result = gradeRubric({ assignment_title: "Final Presentation", assignment_type: "presentation" });
    expect(result.criteria.length).toBeGreaterThanOrEqual(2);
  });

  it("generates a project rubric", () => {
    const result = gradeRubric({ assignment_title: "Science Fair", assignment_type: "project" });
    expect(result.criteria.length).toBeGreaterThanOrEqual(2);
  });

  it("generates a lab report rubric", () => {
    const result = gradeRubric({ assignment_title: "Lab 3", assignment_type: "lab_report" });
    expect(result.criteria.length).toBeGreaterThanOrEqual(2);
  });

  it("generates a code rubric", () => {
    const result = gradeRubric({ assignment_title: "Homework 5", assignment_type: "code" });
    expect(result.criteria.length).toBeGreaterThanOrEqual(2);
  });

  it("defaults to 4 criteria", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay" });
    expect(result.criteria).toHaveLength(4);
  });

  it("respects custom criteria count", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay", criteria_count: 3 });
    expect(result.criteria).toHaveLength(3);
  });

  it("defaults to 100 total points", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay" });
    expect(result.total_points).toBe(100);
  });

  it("respects custom total points", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay", total_points: 50 });
    expect(result.total_points).toBe(50);
  });

  it("criteria weights sum to 100", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay", criteria_count: 5 });
    const sum = result.criteria.reduce((s, c) => s + c.weight, 0);
    expect(sum).toBe(100);
  });

  it("defaults to 4-point scale", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay" });
    expect(result.criteria[0].levels).toHaveLength(4);
  });

  it("respects custom scale levels", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay", scale_levels: 5 });
    expect(result.criteria[0].levels).toHaveLength(5);
  });

  it("levels have scores, labels, and descriptions", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay" });
    for (const criterion of result.criteria) {
      for (const level of criterion.levels) {
        expect(level.score).toBeGreaterThanOrEqual(0);
        expect(level.label).toBeTruthy();
        expect(level.description).toBeTruthy();
      }
    }
  });

  it("level scores increase with each level", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay" });
    for (const criterion of result.criteria) {
      for (let i = 1; i < criterion.levels.length; i++) {
        expect(criterion.levels[i].score).toBeGreaterThanOrEqual(criterion.levels[i - 1].score);
      }
    }
  });

  it("has grading notes", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay" });
    expect(result.grading_notes.length).toBeGreaterThan(0);
  });

  it("has metadata with scale description", () => {
    const result = gradeRubric({ assignment_title: "Test", assignment_type: "essay" });
    expect(result.metadata.scale).toContain("4-point");
    expect(result.metadata.generated_at).toBeTruthy();
  });

  it("throws on unknown assignment type", () => {
    expect(() => gradeRubric({ assignment_title: "Test", assignment_type: "dance" })).toThrow("Unknown assignment type");
  });

  it("throws on empty title", () => {
    expect(() => gradeRubric({ assignment_title: "", assignment_type: "essay" })).toThrow();
  });
});
