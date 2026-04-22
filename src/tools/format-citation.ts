/**
 * Academic citation formatter.
 *
 * Formats a paper/book/website reference in APA 7th, MLA 9th, Chicago 17th,
 * or Vancouver style. Useful after using search_papers (OpenAlex) to find
 * sources — copy the metadata and get a ready-to-paste citation.
 */

export interface Author {
  firstName?: string;
  lastName: string;
  /** Institutional abbreviation (e.g. for Vancouver style) */
  initials?: string;
}

export type CitationStyle = "apa" | "mla" | "chicago" | "vancouver";
export type SourceType = "journal" | "book" | "chapter" | "website" | "conference" | "thesis" | "preprint";

export interface FormatCitationInput {
  style: CitationStyle;
  sourceType: SourceType;
  /** List of authors (order matters) */
  authors: Author[];
  title: string;
  /** Year of publication */
  year?: number | string;
  /** Journal name (for journal articles) */
  journal?: string;
  /** Volume number */
  volume?: string;
  /** Issue number */
  issue?: string;
  /** Page range (e.g. "123-145") */
  pages?: string;
  /** DOI without the https://doi.org/ prefix (e.g. "10.1234/example") */
  doi?: string;
  /** Publisher name (for books) */
  publisher?: string;
  /** Publisher city (for books/chapters — Chicago) */
  publisherCity?: string;
  /** Book title (for chapters) */
  bookTitle?: string;
  /** Book editors (for chapters) */
  editors?: Author[];
  /** Website name / platform */
  websiteName?: string;
  /** URL */
  url?: string;
  /** Date retrieved/accessed (ISO 8601, e.g. "2024-03-15") */
  accessDate?: string;
  /** Conference name */
  conferenceName?: string;
  /** Edition number (for books) */
  edition?: string;
  /** Thesis institution */
  institution?: string;
  /** Thesis type (e.g. "PhD dissertation", "Master's thesis") */
  thesisType?: string;
}

export interface FormatCitationResult {
  style: string;
  sourceType: string;
  citation: string;
  inTextCitation: string;
  notes: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((part) => part[0]?.toUpperCase() + ".")
    .join(" ");
}

function formatAuthorApa(author: Author, position: number, total: number): string {
  const last = author.lastName;
  const first = author.firstName ? initials(author.firstName) : "";
  return first ? `${last}, ${first}` : last;
}

function formatAuthorsApa(authors: Author[]): string {
  if (authors.length === 0) return "Anonymous";
  if (authors.length === 1) return formatAuthorApa(authors[0], 0, 1);
  if (authors.length <= 20) {
    const parts = authors.map((a, i) => formatAuthorApa(a, i, authors.length));
    const last = parts.pop()!;
    return parts.join(", ") + ", & " + last;
  }
  // > 20 authors: first 19, ellipsis, last author
  const first19 = authors.slice(0, 19).map((a, i) => formatAuthorApa(a, i, authors.length));
  const lastAuthor = formatAuthorApa(authors[authors.length - 1], authors.length - 1, authors.length);
  return first19.join(", ") + ", ... " + lastAuthor;
}

function formatAuthorMla(author: Author, position: number): string {
  if (position === 0) {
    const last = author.lastName;
    const first = author.firstName ?? "";
    return first ? `${last}, ${first}` : last;
  }
  const first = author.firstName ?? "";
  return first ? `${first} ${author.lastName}` : author.lastName;
}

function formatAuthorsMla(authors: Author[]): string {
  if (authors.length === 0) return "";
  if (authors.length === 1) return formatAuthorMla(authors[0], 0);
  if (authors.length === 2) return `${formatAuthorMla(authors[0], 0)}, and ${formatAuthorMla(authors[1], 1)}`;
  if (authors.length === 3)
    return `${formatAuthorMla(authors[0], 0)}, ${formatAuthorMla(authors[1], 1)}, and ${formatAuthorMla(authors[2], 2)}`;
  return `${formatAuthorMla(authors[0], 0)}, et al.`;
}

function formatAuthorsChicago(authors: Author[]): string {
  if (authors.length === 0) return "Anonymous";
  if (authors.length === 1) {
    const a = authors[0];
    const first = a.firstName ?? "";
    return first ? `${a.lastName}, ${first}` : a.lastName;
  }
  if (authors.length <= 3) {
    const [first, ...rest] = authors;
    const firstName = first.firstName ?? "";
    const firstFormatted = firstName ? `${first.lastName}, ${firstName}` : first.lastName;
    const restFormatted = rest.map((a) => {
      const fn = a.firstName ?? "";
      return fn ? `${fn} ${a.lastName}` : a.lastName;
    });
    return [firstFormatted, ...restFormatted].join(", ");
  }
  const a = authors[0];
  const first = a.firstName ?? "";
  return (first ? `${a.lastName}, ${first}` : a.lastName) + ", et al.";
}

function formatAuthorsVancouver(authors: Author[]): string {
  if (authors.length === 0) return "Anonymous";
  const limit = Math.min(authors.length, 6);
  const parts = authors.slice(0, limit).map((a) => {
    const inits = a.initials ?? (a.firstName ? initials(a.firstName) : "");
    return `${a.lastName} ${inits}`.trim();
  });
  const result = parts.join(", ");
  return authors.length > 6 ? result + ", et al." : result;
}

function doiUrl(doi?: string): string {
  return doi ? `https://doi.org/${doi}` : "";
}

function inTextApa(authors: Author[], year?: number | string): string {
  const y = year ?? "n.d.";
  if (authors.length === 0) return `(Anonymous, ${y})`;
  if (authors.length === 1) return `(${authors[0].lastName}, ${y})`;
  if (authors.length === 2) return `(${authors[0].lastName} & ${authors[1].lastName}, ${y})`;
  return `(${authors[0].lastName} et al., ${y})`;
}

function inTextMla(authors: Author[]): string {
  if (authors.length === 0) return '(Anonymous page)';
  if (authors.length === 1) return `(${authors[0].lastName} page)`;
  if (authors.length === 2) return `(${authors[0].lastName} and ${authors[1].lastName} page)`;
  return `(${authors[0].lastName} et al. page)`;
}

function inTextChicago(authors: Author[], year?: number | string): string {
  return inTextApa(authors, year); // Author-date format (Notes-Bibliography is footnote-based)
}

function inTextVancouver(refNumber: number): string {
  return `[${refNumber}]`;
}

// ---------------------------------------------------------------------------
// Formatters per style
// ---------------------------------------------------------------------------

function formatApa(input: FormatCitationInput): string {
  const { authors, title, year, journal, volume, issue, pages, doi, publisher, publisherCity, bookTitle, editors, websiteName, url, accessDate, conferenceName, edition, institution, thesisType, sourceType } = input;

  const authorsStr = formatAuthorsApa(authors);
  const yearStr = year ? `(${year})` : "(n.d.)";
  const doiStr = doi ? ` https://doi.org/${doi}` : url ? ` ${url}` : "";

  switch (sourceType) {
    case "journal":
    case "preprint": {
      const volIssue = volume && issue ? `${volume}(${issue})` : volume ?? issue ?? "";
      const pagesStr = pages ? `, ${pages}` : "";
      return `${authorsStr}. ${yearStr}. ${title}. *${journal ?? "Unknown Journal"}*, ${volIssue}${pagesStr}.${doiStr}`;
    }
    case "book": {
      const edStr = edition ? ` (${edition} ed.)` : "";
      const pubStr = publisher ? `${publisherCity ? publisherCity + ": " : ""}${publisher}.` : "";
      return `${authorsStr}. ${yearStr}. *${title}*${edStr}. ${pubStr}${doiStr}`;
    }
    case "chapter": {
      const editorsStr = editors && editors.length > 0
        ? `In ${editors.map((e) => `${e.firstName ? initials(e.firstName) + " " : ""}${e.lastName}`).join(", & ")} (Ed${editors.length > 1 ? "s" : ""}.), `
        : "";
      const pagesStr = pages ? ` (pp. ${pages})` : "";
      const pubStr = publisher ? `${publisherCity ? publisherCity + ": " : ""}${publisher}.` : "";
      return `${authorsStr}. ${yearStr}. ${title}. ${editorsStr}*${bookTitle ?? "Book Title"}*${pagesStr}. ${pubStr}${doiStr}`;
    }
    case "website": {
      const site = websiteName ? ` *${websiteName}*.` : "";
      const accessed = accessDate ? ` Retrieved ${new Date(accessDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} from` : "";
      return `${authorsStr}. ${yearStr}. ${title}.${site}${accessed}${url ?? ""}`;
    }
    case "conference": {
      const pagesStr = pages ? `, ${pages}` : "";
      return `${authorsStr}. ${yearStr}. ${title}. *${conferenceName ?? "Conference"}*${pagesStr}.${doiStr}`;
    }
    case "thesis": {
      const type = thesisType ?? "Doctoral dissertation";
      return `${authorsStr}. ${yearStr}. *${title}* [${type}, ${institution ?? "Institution"}].${doiStr}`;
    }
    default:
      return `${authorsStr}. ${yearStr}. ${title}.${doiStr}`;
  }
}

function formatMla(input: FormatCitationInput): string {
  const { authors, title, year, journal, volume, issue, pages, doi, publisher, bookTitle, editors, websiteName, url, accessDate, edition, institution, thesisType, sourceType } = input;

  const authorsStr = formatAuthorsMla(authors);
  const yearStr = year ? String(year) : "";
  const doiStr = doi ? `doi:${doi}` : url ?? "";

  switch (sourceType) {
    case "journal":
    case "preprint": {
      const volIssue = volume && issue ? `vol. ${volume}, no. ${issue}` : volume ? `vol. ${volume}` : "";
      const pagesStr = pages ? `, pp. ${pages}` : "";
      return `${authorsStr}. "${title}." *${journal ?? "Unknown Journal"}*, ${volIssue}${pagesStr}, ${yearStr}. ${doiStr}`;
    }
    case "book": {
      const edStr = edition ? `, ${edition} ed.` : "";
      return `${authorsStr}. *${title}*${edStr}. ${publisher ?? "Publisher"}, ${yearStr}.`;
    }
    case "chapter": {
      const editorsStr = editors && editors.length > 0
        ? `, edited by ${editors.map((e) => `${e.firstName ? e.firstName + " " : ""}${e.lastName}`).join(", ")}`
        : "";
      const pagesStr = pages ? `, pp. ${pages}` : "";
      return `${authorsStr}. "${title}." *${bookTitle ?? "Book Title"}*${editorsStr}${pagesStr}. ${publisher ?? "Publisher"}, ${yearStr}.`;
    }
    case "website": {
      const site = websiteName ? `*${websiteName}*` : "";
      const accessed = accessDate ? `. Accessed ${new Date(accessDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "";
      return `${authorsStr}. "${title}." ${site}, ${yearStr}${accessed}. ${doiStr}`;
    }
    case "thesis": {
      const type = thesisType ?? "PhD dissertation";
      return `${authorsStr}. *${title}*. ${type}, ${institution ?? "Institution"}, ${yearStr}.`;
    }
    default:
      return `${authorsStr}. "${title}." ${yearStr}. ${doiStr}`;
  }
}

function formatChicago(input: FormatCitationInput): string {
  const { authors, title, year, journal, volume, issue, pages, doi, publisher, publisherCity, bookTitle, editors, url, accessDate, edition, institution, thesisType, sourceType } = input;

  const authorsStr = formatAuthorsChicago(authors);
  const doiStr = doi ? `https://doi.org/${doi}` : url ?? "";

  switch (sourceType) {
    case "journal":
    case "preprint": {
      const volIssue = volume && issue ? `${volume}, no. ${issue}` : volume ?? "";
      const pagesStr = pages ? `: ${pages}` : "";
      const yearStr = year ? ` (${year})` : "";
      return `${authorsStr}. "${title}." *${journal ?? "Unknown Journal"}* ${volIssue}${yearStr}${pagesStr}. ${doiStr}`;
    }
    case "book": {
      const edStr = edition ? ` ${edition} ed.` : "";
      const pubCity = publisherCity ? `${publisherCity}: ` : "";
      return `${authorsStr}. *${title}*${edStr}. ${pubCity}${publisher ?? "Publisher"}, ${year ?? "n.d."}.`;
    }
    case "chapter": {
      const editorsStr = editors && editors.length > 0
        ? `Edited by ${editors.map((e) => `${e.firstName ? e.firstName + " " : ""}${e.lastName}`).join(", ")}. `
        : "";
      const pagesStr = pages ? `, ${pages}` : "";
      return `${authorsStr}. "${title}." In *${bookTitle ?? "Book Title"}*, ${editorsStr}${pagesStr}. ${publisherCity ? publisherCity + ": " : ""}${publisher ?? "Publisher"}, ${year ?? "n.d."}.`;
    }
    case "website": {
      const accessed = accessDate ? `Accessed ${new Date(accessDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. ` : "";
      return `${authorsStr}. "${title}." ${year ?? "n.d."}. ${accessed}${doiStr}`;
    }
    case "thesis": {
      const type = thesisType ?? "PhD diss.";
      return `${authorsStr}. "${title}." ${type}, ${institution ?? "Institution"}, ${year ?? "n.d."}.`;
    }
    default:
      return `${authorsStr}. "${title}." ${year ?? "n.d."}. ${doiStr}`;
  }
}

function formatVancouver(input: FormatCitationInput): string {
  const { authors, title, year, journal, volume, issue, pages, doi, publisher, publisherCity, url, edition, institution, thesisType, sourceType } = input;

  const authorsStr = formatAuthorsVancouver(authors);
  const doiStr = doi ? ` doi:${doi}` : url ? ` Available from: ${url}` : "";

  switch (sourceType) {
    case "journal":
    case "preprint": {
      const volIssue = volume && issue ? `${volume}(${issue})` : volume ?? "";
      const pagesStr = pages ? `:${pages}` : "";
      const yearStr = year ? ` ${year}` : "";
      return `${authorsStr}. ${title}.${yearStr ? " " + journal + "." : ""} ${yearStr};${volIssue}${pagesStr}.${doiStr}`;
    }
    case "book": {
      const edStr = edition ? ` ${edition} ed.` : "";
      const pubCity = publisherCity ? `${publisherCity}: ` : "";
      return `${authorsStr}. ${title}${edStr}. ${pubCity}${publisher ?? "Publisher"}; ${year ?? "n.d."}.`;
    }
    case "website": {
      return `${authorsStr}. ${title} [Internet]. ${year ?? ""}. [cited ${new Date().toISOString().split("T")[0]}].${doiStr}`;
    }
    case "thesis": {
      const type = thesisType ?? "PhD dissertation";
      return `${authorsStr}. ${title} [${type}]. ${institution ?? "Institution"}; ${year ?? "n.d."}.`;
    }
    default:
      return `${authorsStr}. ${title}. ${year ?? "n.d."}.${doiStr}`;
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function formatCitation(input: FormatCitationInput): FormatCitationResult {
  const notes: string[] = [];

  let citation: string;
  let inText: string;

  switch (input.style) {
    case "apa":
      citation = formatApa(input);
      inText = inTextApa(input.authors, input.year);
      notes.push("APA 7th edition. Italics shown with *asterisks* — apply formatting when pasting.");
      if (input.doi) notes.push("DOI included — preferred over URL when available.");
      break;
    case "mla":
      citation = formatMla(input);
      inText = inTextMla(input.authors) + " — replace 'page' with the actual page number";
      notes.push("MLA 9th edition. Works Cited format.");
      break;
    case "chicago":
      citation = formatChicago(input);
      inText = inTextChicago(input.authors, input.year) + " (author-date format)";
      notes.push("Chicago 17th edition (author-date). For Notes-Bibliography style, use a footnote format instead.");
      break;
    case "vancouver":
      citation = formatVancouver(input);
      inText = inTextVancouver(1) + " — replace 1 with the sequential reference number";
      notes.push("Vancouver style (commonly used in medicine/health sciences). Number references sequentially in your text.");
      break;
    default:
      throw new Error(`Unsupported citation style: ${input.style}`);
  }

  if (input.authors.length === 0) {
    notes.push("No authors provided — using 'Anonymous'. Check if the source has an institutional author.");
  }
  if (!input.year) {
    notes.push("No year provided — using 'n.d.' (no date). Try to find the publication year.");
  }
  if (!input.doi && !input.url && ["journal", "preprint"].includes(input.sourceType)) {
    notes.push("Consider adding a DOI or URL for journal articles to improve accessibility.");
  }

  return {
    style: input.style.toUpperCase(),
    sourceType: input.sourceType,
    citation: citation.trim(),
    inTextCitation: inText.trim(),
    notes,
  };
}
