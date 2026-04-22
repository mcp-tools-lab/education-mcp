import { describe, it, expect } from "vitest";
import { formatCitation } from "../src/tools/format-citation.js";

const ARTICLE_AUTHORS = [
  { lastName: "Smith", firstName: "John" },
  { lastName: "Doe", firstName: "Jane" },
];

const BASE_JOURNAL = {
  style: "apa" as const,
  sourceType: "journal" as const,
  authors: ARTICLE_AUTHORS,
  title: "Deep learning for climate modelling",
  year: 2023,
  journal: "Nature Climate Change",
  volume: "13",
  issue: "4",
  pages: "321-334",
  doi: "10.1038/s41558-023-01234-5",
};

describe("formatCitation — APA", () => {
  it("formats a journal article correctly", () => {
    const result = formatCitation(BASE_JOURNAL);
    expect(result.citation).toContain("Smith");
    expect(result.citation).toContain("2023");
    expect(result.citation).toContain("Deep learning");
    expect(result.citation).toContain("Nature Climate Change");
    expect(result.citation).toContain("doi.org");
  });

  it("in-text citation uses (LastName, year) format", () => {
    const result = formatCitation(BASE_JOURNAL);
    expect(result.inTextCitation).toContain("Smith");
    expect(result.inTextCitation).toContain("2023");
    expect(result.inTextCitation).toContain("(");
  });

  it("formats a book reference", () => {
    const result = formatCitation({
      style: "apa",
      sourceType: "book",
      authors: [{ lastName: "Brown", firstName: "Alice" }],
      title: "Introduction to Machine Learning",
      year: 2021,
      publisher: "MIT Press",
      publisherCity: "Cambridge, MA",
      edition: "3rd",
    });
    expect(result.citation).toContain("Brown");
    expect(result.citation).toContain("Introduction to Machine Learning");
    expect(result.citation).toContain("MIT Press");
    expect(result.citation).toContain("3rd");
  });

  it("formats a book chapter with editors", () => {
    const result = formatCitation({
      style: "apa",
      sourceType: "chapter",
      authors: [{ lastName: "Garcia", firstName: "Maria" }],
      title: "Neural Networks",
      year: 2022,
      bookTitle: "Handbook of AI",
      editors: [{ lastName: "Johnson", firstName: "Robert" }],
      pages: "45-78",
      publisher: "Springer",
    });
    expect(result.citation).toContain("Garcia");
    expect(result.citation).toContain("Handbook of AI");
    expect(result.citation).toContain("Johnson");
    expect(result.citation).toContain("Ed.");
    expect(result.citation).toContain("pp. 45-78");
  });

  it("formats a website reference", () => {
    const result = formatCitation({
      style: "apa",
      sourceType: "website",
      authors: [{ lastName: "WHO" }],
      title: "Global health statistics 2024",
      year: 2024,
      websiteName: "World Health Organization",
      url: "https://www.who.int/data",
      accessDate: "2024-03-15",
    });
    expect(result.citation).toContain("WHO");
    expect(result.citation).toContain("Global health statistics");
    expect(result.citation).toContain("Retrieved");
  });

  it("handles single author with & correctly", () => {
    const result = formatCitation({ ...BASE_JOURNAL, authors: [{ lastName: "Solo", firstName: "Han" }] });
    expect(result.citation).not.toContain("&");
  });

  it("uses et al. for many authors in-text", () => {
    const result = formatCitation({
      ...BASE_JOURNAL,
      authors: [
        { lastName: "Alpha", firstName: "A" },
        { lastName: "Beta", firstName: "B" },
        { lastName: "Gamma", firstName: "C" },
      ],
    });
    expect(result.inTextCitation).toContain("et al.");
  });

  it("uses n.d. when year is missing", () => {
    const result = formatCitation({ ...BASE_JOURNAL, year: undefined });
    expect(result.citation).toContain("n.d.");
    expect(result.notes.some((n) => n.includes("n.d."))).toBe(true);
  });

  it("adds note when no authors provided", () => {
    const result = formatCitation({ ...BASE_JOURNAL, authors: [] });
    expect(result.notes.some((n) => n.includes("Anonymous"))).toBe(true);
  });

  it("formats thesis correctly", () => {
    const result = formatCitation({
      style: "apa",
      sourceType: "thesis",
      authors: [{ lastName: "Lee", firstName: "Sarah" }],
      title: "Reinforcement learning for robotics",
      year: 2023,
      thesisType: "PhD dissertation",
      institution: "MIT",
      doi: "10.1234/thesis123",
    });
    expect(result.citation).toContain("PhD dissertation");
    expect(result.citation).toContain("MIT");
    expect(result.citation).toContain("doi.org");
  });
});

describe("formatCitation — MLA", () => {
  it("formats a journal article in MLA format", () => {
    const result = formatCitation({ ...BASE_JOURNAL, style: "mla" });
    expect(result.citation).toContain("Smith");
    expect(result.citation).toContain('"Deep learning for climate modelling."');
    expect(result.citation).toContain("Nature Climate Change");
  });

  it("in-text citation uses (LastName page) format", () => {
    const result = formatCitation({ ...BASE_JOURNAL, style: "mla" });
    expect(result.inTextCitation).toContain("Smith");
    expect(result.inTextCitation).toContain("page");
  });

  it("uses et al. for 4+ authors", () => {
    const result = formatCitation({
      ...BASE_JOURNAL,
      style: "mla",
      authors: [
        { lastName: "A", firstName: "A" },
        { lastName: "B", firstName: "B" },
        { lastName: "C", firstName: "C" },
        { lastName: "D", firstName: "D" },
      ],
    });
    expect(result.citation).toContain("et al.");
  });

  it("formats author Last, First for first author", () => {
    const result = formatCitation({
      ...BASE_JOURNAL,
      style: "mla",
      authors: [{ lastName: "Smith", firstName: "John" }],
    });
    expect(result.citation).toMatch(/Smith, John/);
  });
});

describe("formatCitation — Chicago", () => {
  it("formats a journal article in Chicago format", () => {
    const result = formatCitation({ ...BASE_JOURNAL, style: "chicago" });
    expect(result.citation).toContain("Smith");
    expect(result.citation).toContain("Deep learning");
    expect(result.citation).toContain("Nature Climate Change");
  });

  it("in-text citation uses (LastName, year) format", () => {
    const result = formatCitation({ ...BASE_JOURNAL, style: "chicago" });
    expect(result.inTextCitation).toContain("Smith");
    expect(result.inTextCitation).toContain("2023");
  });

  it("formats a book with publisher city", () => {
    const result = formatCitation({
      style: "chicago",
      sourceType: "book",
      authors: [{ lastName: "Brown", firstName: "Alice" }],
      title: "Modern Statistics",
      year: 2020,
      publisher: "Harvard University Press",
      publisherCity: "Cambridge, MA",
    });
    expect(result.citation).toContain("Cambridge, MA");
    expect(result.citation).toContain("Harvard University Press");
  });
});

describe("formatCitation — Vancouver", () => {
  it("formats a journal article in Vancouver style", () => {
    const result = formatCitation({ ...BASE_JOURNAL, style: "vancouver" });
    expect(result.citation).toContain("Smith J");
    expect(result.citation).toContain("Deep learning");
  });

  it("in-text citation uses [number] format", () => {
    const result = formatCitation({ ...BASE_JOURNAL, style: "vancouver" });
    expect(result.inTextCitation).toMatch(/\[\d+\]/);
  });

  it("truncates authors to 6 + et al.", () => {
    const manyAuthors = Array.from({ length: 8 }, (_, i) => ({
      lastName: `Author${i}`,
      firstName: `First${i}`,
    }));
    const result = formatCitation({ ...BASE_JOURNAL, style: "vancouver", authors: manyAuthors });
    expect(result.citation).toContain("et al.");
  });

  it("includes all authors when 6 or fewer", () => {
    const sixAuthors = Array.from({ length: 6 }, (_, i) => ({
      lastName: `Author${i}`,
      firstName: `F${i}`,
    }));
    const result = formatCitation({ ...BASE_JOURNAL, style: "vancouver", authors: sixAuthors });
    expect(result.citation).not.toContain("et al.");
  });
});

describe("formatCitation — output structure", () => {
  it("always returns style, sourceType, citation, inTextCitation, notes", () => {
    const result = formatCitation(BASE_JOURNAL);
    expect(result.style).toBe("APA");
    expect(result.sourceType).toBe("journal");
    expect(typeof result.citation).toBe("string");
    expect(typeof result.inTextCitation).toBe("string");
    expect(Array.isArray(result.notes)).toBe(true);
  });

  it("throws for unsupported style", () => {
    expect(() =>
      formatCitation({ ...BASE_JOURNAL, style: "harvard" as any })
    ).toThrow("Unsupported citation style");
  });

  it("suggests adding DOI for journal articles without one", () => {
    const result = formatCitation({ ...BASE_JOURNAL, doi: undefined });
    expect(result.notes.some((n) => n.includes("DOI"))).toBe(true);
  });

  it("notes that DOI is preferred over URL", () => {
    const result = formatCitation(BASE_JOURNAL);
    expect(result.notes.some((n) => n.includes("DOI"))).toBe(true);
  });
});
