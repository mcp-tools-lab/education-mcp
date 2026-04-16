/**
 * OpenAlex academic research API tools.
 *
 * OpenAlex is a free, open catalog of 250M+ academic works, authors,
 * institutions, and concepts. No API key required.
 *
 * Docs: https://docs.openalex.org/
 */

const OPENALEX_BASE = "https://api.openalex.org";
const USER_AGENT = "education-mcp/1.1.0 (https://github.com/mcp-tools-lab/education-mcp)";

async function openalex(path: string): Promise<any> {
  const url = `${OPENALEX_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAlex API error ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// ── search_papers ────────────────────────────────────────────────────────────

export interface SearchPapersArgs {
  query: string;
  per_page?: number;
  year_from?: number;
  year_to?: number;
  open_access_only?: boolean;
  /** Filter by academic domain: e.g. "medicine", "computer science", "biology" */
  domain?: string;
  /** Minimum citation count — useful for finding high-impact papers */
  min_citations?: number;
  /** Sort results: "relevance" (default), "citations" (most cited first), "date" (newest first) */
  sort_by?: "relevance" | "citations" | "date";
  /** Filter by publication type: "article" | "review" | "preprint" | "book-chapter" */
  type?: "article" | "review" | "preprint" | "book-chapter";
}

export async function searchPapers(args: SearchPapersArgs): Promise<string> {
  const perPage = Math.min(args.per_page ?? 5, 25);

  // Sort parameter
  const sortMap: Record<string, string> = {
    relevance: "relevance_score:desc",
    citations: "cited_by_count:desc",
    date: "publication_date:desc",
  };
  const sortParam = sortMap[args.sort_by ?? "relevance"] ?? "relevance_score:desc";

  // Combine query with optional domain to improve relevance
  const effectiveQuery = args.domain
    ? `${args.query} ${args.domain}`
    : args.query;

  let path = `/works?search=${encodeURIComponent(effectiveQuery)}&per_page=${perPage}&sort=${sortParam}`;

  // Build optional filters
  const filters: string[] = [];
  if (args.year_from) filters.push(`from_publication_date:${args.year_from}-01-01`);
  if (args.year_to) filters.push(`to_publication_date:${args.year_to}-12-31`);
  if (args.open_access_only) filters.push("is_oa:true");
  if (args.min_citations && args.min_citations > 0) {
    filters.push(`cited_by_count:>${args.min_citations}`);
  }
  if (args.type) filters.push(`type:${args.type}`);
  if (filters.length > 0) path += `&filter=${filters.join(",")}`;

  const data = await openalex(path);
  const total = data.meta?.count ?? 0;
  const works: any[] = data.results ?? [];

  if (works.length === 0) {
    const suggestions: string[] = [];
    if (args.min_citations) suggestions.push("lower min_citations");
    if (args.year_from || args.year_to) suggestions.push("widen the year range");
    if (args.open_access_only) suggestions.push("remove open_access_only filter");
    const hint = suggestions.length > 0 ? ` Try: ${suggestions.join(", ")}.` : " Try broader keywords.";
    return `No papers found for "${args.query}"${args.domain ? ` in ${args.domain}` : ""}.${hint}`;
  }

  // Build filter summary for header
  const activeFilters: string[] = [];
  if (args.year_from || args.year_to) {
    activeFilters.push(`years: ${args.year_from ?? "any"}–${args.year_to ?? "present"}`);
  }
  if (args.domain) activeFilters.push(`domain: ${args.domain}`);
  if (args.min_citations) activeFilters.push(`min citations: ${args.min_citations}`);
  if (args.open_access_only) activeFilters.push("open access only");
  if (args.type) activeFilters.push(`type: ${args.type}`);
  if (args.sort_by && args.sort_by !== "relevance") activeFilters.push(`sorted by: ${args.sort_by}`);
  const filterLine = activeFilters.length > 0 ? `\n*Filters: ${activeFilters.join(" | ")}*` : "";

  const lines: string[] = [
    `## Academic Papers: "${args.query}"`,
    `Found ${total.toLocaleString()} results (showing top ${works.length})${filterLine}\n`,
  ];

  for (const w of works) {
    const authors = (w.authorships ?? [])
      .slice(0, 4)
      .map((a: any) => a.author?.display_name ?? "Unknown")
      .join(", ");
    const moreAuthors = (w.authorships?.length ?? 0) > 4 ? " et al." : "";
    const journal =
      w.primary_location?.source?.display_name ?? w.host_venue?.display_name ?? "N/A";
    const doi = w.doi ?? "N/A";
    const oaUrl = w.open_access?.oa_url ?? null;
    const abstractSnippet = w.abstract_inverted_index
      ? reconstructAbstract(w.abstract_inverted_index).slice(0, 300)
      : "No abstract available";
    const topConcepts = (w.concepts ?? [])
      .slice(0, 4)
      .map((c: any) => c.display_name)
      .filter(Boolean)
      .join(", ");
    const isOA = w.open_access?.is_oa ? "✅ Open Access" : "🔒 Paywalled";

    lines.push(`### ${w.display_name ?? "Untitled"}`);
    lines.push(`- **Authors:** ${authors}${moreAuthors}`);
    lines.push(`- **Year:** ${w.publication_year ?? "N/A"} | **Type:** ${w.type ?? "N/A"} | ${isOA}`);
    lines.push(`- **Journal:** ${journal}`);
    lines.push(`- **Citations:** ${(w.cited_by_count ?? 0).toLocaleString()}`);
    if (topConcepts) lines.push(`- **Topics:** ${topConcepts}`);
    lines.push(`- **DOI:** ${doi}`);
    if (oaUrl) lines.push(`- **Full text:** ${oaUrl}`);
    lines.push(`- **Abstract:** ${abstractSnippet}${abstractSnippet.length >= 300 ? "..." : ""}`);
    lines.push("");
  }

  lines.push(`*Source: OpenAlex (openalex.org) — 250M+ academic works, updated daily.*`);

  return lines.join("\n");
}

// ── get_author_profile ───────────────────────────────────────────────────────

export interface GetAuthorProfileArgs {
  name: string;
  per_page?: number;
}

export async function getAuthorProfile(args: GetAuthorProfileArgs): Promise<string> {
  const perPage = Math.min(args.per_page ?? 3, 10);
  const path = `/authors?search=${encodeURIComponent(args.name)}&per_page=${perPage}`;
  const data = await openalex(path);
  const authors: any[] = data.results ?? [];

  if (authors.length === 0) {
    return `No researchers found for "${args.name}". Try full name or check spelling.`;
  }

  const lines: string[] = [
    `## Researcher Profiles: "${args.name}"`,
    `Found ${data.meta?.count ?? 0} results (showing top ${authors.length})\n`,
  ];

  for (const a of authors) {
    const institution =
      a.last_known_institutions?.[0]?.display_name ??
      a.last_known_institution?.display_name ??
      "N/A";
    const concepts = (a.x_concepts ?? [])
      .slice(0, 5)
      .map((c: any) => c.display_name)
      .join(", ");

    lines.push(`### ${a.display_name ?? "Unknown"}`);
    lines.push(`- **Institution:** ${institution}`);
    lines.push(`- **H-index:** ${a.summary_stats?.h_index ?? "N/A"}`);
    lines.push(`- **Total citations:** ${a.cited_by_count ?? 0}`);
    lines.push(`- **Works count:** ${a.works_count ?? 0}`);
    lines.push(`- **Top topics:** ${concepts || "N/A"}`);
    lines.push(`- **ORCID:** ${a.orcid ?? "N/A"}`);
    lines.push(`- **OpenAlex ID:** ${a.id ?? "N/A"}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ── get_citation_stats ───────────────────────────────────────────────────────

export interface GetCitationStatsArgs {
  doi: string;
}

export async function getCitationStats(args: GetCitationStatsArgs): Promise<string> {
  // Normalize DOI: strip https://doi.org/ prefix if present
  let doi = args.doi.trim();
  if (doi.startsWith("https://doi.org/")) doi = doi.slice("https://doi.org/".length);
  if (doi.startsWith("http://doi.org/")) doi = doi.slice("http://doi.org/".length);

  const path = `/works/doi:${encodeURIComponent(doi)}`;
  const data = await openalex(path);

  const authors = (data.authorships ?? [])
    .slice(0, 5)
    .map((a: any) => a.author?.display_name ?? "Unknown")
    .join(", ");
  const moreAuthors = (data.authorships?.length ?? 0) > 5 ? " et al." : "";
  const concepts = (data.concepts ?? [])
    .slice(0, 5)
    .map((c: any) => `${c.display_name} (${(c.score * 100).toFixed(0)}%)`)
    .join(", ");
  const referencedCount = data.referenced_works?.length ?? 0;

  const lines: string[] = [
    `## Citation Stats for DOI: ${doi}`,
    "",
    `### ${data.display_name ?? "Untitled"}`,
    `- **Authors:** ${authors}${moreAuthors}`,
    `- **Year:** ${data.publication_year ?? "N/A"}`,
    `- **Journal:** ${data.primary_location?.source?.display_name ?? "N/A"}`,
    `- **Citation count:** ${data.cited_by_count ?? 0}`,
    `- **Referenced works:** ${referencedCount}`,
    `- **Open Access:** ${data.open_access?.is_oa ? "Yes" : "No"}${data.open_access?.oa_url ? ` — ${data.open_access.oa_url}` : ""}`,
    `- **Type:** ${data.type ?? "N/A"}`,
    `- **Concepts:** ${concepts || "N/A"}`,
    `- **DOI:** https://doi.org/${doi}`,
  ];

  // Citation counts by year (if available)
  if (data.counts_by_year?.length > 0) {
    lines.push("");
    lines.push("### Citations by Year");
    for (const entry of data.counts_by_year.slice(0, 10)) {
      lines.push(`- ${entry.year}: ${entry.cited_by_count} citations`);
    }
  }

  return lines.join("\n");
}

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Reconstruct abstract from OpenAlex inverted index format.
 * The inverted index maps words to their position indices.
 */
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }
  words.sort((a, b) => a[0] - b[0]);
  return words.map(([, w]) => w).join(" ");
}
