import { describe, it, expect } from "vitest";
import {
  timestamp,
  clamp,
  shuffle,
  pickRandom,
  estimateMinutes,
  difficultyMultiplier,
  audienceGrade,
  ageGroupLabel,
  requireNonEmpty,
  parseQuestionTypes,
  detectSubject,
  bloomLevel,
  initialSR,
  reviewSchedule,
  wordCount,
  rubricLabels,
} from "../src/utils/helpers.js";

describe("timestamp", () => {
  it("returns a valid ISO timestamp", () => {
    const ts = timestamp();
    expect(new Date(ts).toISOString()).toBe(ts);
  });
});

describe("clamp", () => {
  it("clamps below min", () => expect(clamp(-5, 0, 10)).toBe(0));
  it("clamps above max", () => expect(clamp(15, 0, 10)).toBe(10));
  it("passes through in range", () => expect(clamp(5, 0, 10)).toBe(5));
  it("handles equal min and max", () => expect(clamp(5, 3, 3)).toBe(3));
});

describe("shuffle", () => {
  it("returns the same array reference", () => {
    const arr = [1, 2, 3];
    expect(shuffle(arr)).toBe(arr);
  });
  it("preserves all elements", () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr);
    expect(arr.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("pickRandom", () => {
  it("picks the correct number of elements", () => {
    expect(pickRandom([1, 2, 3, 4, 5], 3)).toHaveLength(3);
  });
  it("does not modify the original array", () => {
    const arr = [1, 2, 3];
    pickRandom(arr, 2);
    expect(arr).toEqual([1, 2, 3]);
  });
  it("handles n > array length", () => {
    expect(pickRandom([1, 2], 5)).toHaveLength(2);
  });
});

describe("estimateMinutes", () => {
  it("estimates 1 min for short text", () => expect(estimateMinutes(50)).toBe(1));
  it("estimates 3 min for 500 words", () => expect(estimateMinutes(500)).toBe(3));
  it("uses custom WPM", () => expect(estimateMinutes(100, 100)).toBe(1));
});

describe("difficultyMultiplier", () => {
  it("easy < medium < hard", () => {
    expect(difficultyMultiplier("easy")).toBeLessThan(difficultyMultiplier("medium"));
    expect(difficultyMultiplier("medium")).toBeLessThan(difficultyMultiplier("hard"));
  });
});

describe("audienceGrade", () => {
  it("beginner = 6", () => expect(audienceGrade("beginner")).toBe(6));
  it("expert = 16", () => expect(audienceGrade("expert")).toBe(16));
});

describe("ageGroupLabel", () => {
  it("returns age ranges", () => {
    expect(ageGroupLabel("elementary")).toContain("6-10");
    expect(ageGroupLabel("college")).toContain("18-22");
  });
});

describe("requireNonEmpty", () => {
  it("returns trimmed value", () => expect(requireNonEmpty("  hello  ", "field")).toBe("hello"));
  it("throws on empty string", () => expect(() => requireNonEmpty("", "field")).toThrow("field"));
  it("throws on undefined", () => expect(() => requireNonEmpty(undefined, "field")).toThrow());
  it("throws on whitespace only", () => expect(() => requireNonEmpty("   ", "name")).toThrow());
});

describe("parseQuestionTypes", () => {
  it("returns all types when undefined", () => {
    expect(parseQuestionTypes(undefined)).toHaveLength(3);
  });
  it("returns all types when empty", () => {
    expect(parseQuestionTypes([])).toHaveLength(3);
  });
  it("passes through valid types", () => {
    expect(parseQuestionTypes(["multiple_choice"])).toEqual(["multiple_choice"]);
  });
  it("throws on invalid type", () => {
    expect(() => parseQuestionTypes(["invalid" as any])).toThrow("Invalid question type");
  });
});

describe("detectSubject", () => {
  it("detects math", () => expect(detectSubject("quadratic equations")).toBe("Mathematics"));
  it("detects physics", () => expect(detectSubject("Newton's laws of motion")).toBe("Physics"));
  it("detects chemistry", () => expect(detectSubject("periodic table of elements")).toBe("Chemistry"));
  it("detects biology", () => expect(detectSubject("DNA replication")).toBe("Biology"));
  it("detects history", () => expect(detectSubject("American Revolution")).toBe("History"));
  it("detects CS", () => expect(detectSubject("sorting algorithms")).toBe("Computer Science"));
  it("returns General Studies for unknown", () => expect(detectSubject("random stuff")).toBe("General Studies"));
});

describe("bloomLevel", () => {
  it("easy -> remember", () => expect(bloomLevel("easy")).toBe("remember"));
  it("medium -> apply", () => expect(bloomLevel("medium")).toBe("apply"));
  it("hard -> analyze", () => expect(bloomLevel("hard")).toBe("analyze"));
});

describe("initialSR", () => {
  it("starts at interval 1 day", () => expect(initialSR("medium").interval_days).toBe(1));
  it("easy has higher ease factor", () => {
    expect(initialSR("easy").ease_factor).toBeGreaterThan(initialSR("hard").ease_factor);
  });
  it("starts at 0 repetitions", () => expect(initialSR("medium").repetitions).toBe(0));
});

describe("reviewSchedule", () => {
  it("returns at least 3 items", () => expect(reviewSchedule(5).length).toBeGreaterThanOrEqual(3));
  it("starts with 1 day", () => expect(reviewSchedule(10)[0]).toContain("1 day"));
});

describe("wordCount", () => {
  it("counts words", () => expect(wordCount("hello world")).toBe(2));
  it("handles extra spaces", () => expect(wordCount("  a  b  c  ")).toBe(3));
  it("handles empty", () => expect(wordCount("")).toBe(0));
});

describe("rubricLabels", () => {
  it("returns 4 labels for 4-point scale", () => {
    const labels = rubricLabels(4);
    expect(labels).toHaveLength(4);
    expect(labels[0]).toBe("Beginning");
    expect(labels[3]).toBe("Exemplary");
  });
  it("returns 3 labels for 3-point scale", () => {
    expect(rubricLabels(3)).toHaveLength(3);
  });
  it("returns generic labels for unusual scale", () => {
    expect(rubricLabels(7)).toHaveLength(7);
    expect(rubricLabels(7)[0]).toContain("Level");
  });
});
