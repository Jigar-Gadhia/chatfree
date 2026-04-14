type PipelineStage = "searching";

export type WebSearchResult = {
  title: string;
  link: string;
  snippet: string;
};

const MAX_RESULTS = 6;
const FINAL_CONTEXT_RESULTS = 3;
const WIKIPEDIA_SEARCH_LIMIT = 20;
const WIKIPEDIA_SEARCH_ENDPOINT = "https://en.wikipedia.org/w/rest.php/v1/search/page";
const WIKIPEDIA_USER_AGENT = "ChatFree/1.0 (Android; jiggsgadhia@gmail.com)";

const canonicalizeUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl);
    url.hash = "";
    const allowedParams = new Set(["id", "v", "q"]);
    const filtered = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (allowedParams.has(key)) filtered.append(key, value);
    });
    url.search = filtered.toString() ? `?${filtered.toString()}` : "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawUrl.trim();
  }
};

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();

const dedupeResults = (results: WebSearchResult[]) => {
  const seenKeys = new Set<string>();
  const deduped: WebSearchResult[] = [];

  for (const result of results) {
    const canonicalUrl = canonicalizeUrl(result.link);
    const titleKey = normalizeText(result.title);
    const snippetKey = normalizeText(result.snippet).slice(0, 120);
    const key = `${canonicalUrl}|${titleKey}|${snippetKey}`;

    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduped.push({ ...result, link: canonicalUrl });
  }

  return deduped;
};

const QUERY_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "could",
  "for",
  "give",
  "help",
  "how",
  "i",
  "me",
  "my",
  "of",
  "on",
  "please",
  "tell",
  "the",
  "to",
  "what",
  "with",
]);

const simplifyQuery = (query: string) => {
  const singleLine = query.replace(/\s+/g, " ").trim();
  if (!singleLine) return "";

  const withoutQuotes = singleLine.replace(/^["'`]|["'`]$/g, "");
  const tokens = withoutQuotes.split(/\s+/);

  if (tokens.length <= 10) return withoutQuotes;

  const compactTokens = tokens.filter((token, index) => {
    const normalized = token.toLowerCase().replace(/[^\w]/g, "");
    if (!normalized) return false;
    if (index < 4) return true;
    return !QUERY_STOP_WORDS.has(normalized);
  });

  return compactTokens.slice(0, 12).join(" ").trim() || withoutQuotes;
};

type WikipediaRestPage = {
  id: number;
  key: string;
  title: string;
  excerpt: string;
  description: string;
};

type WikipediaRestResponse = {
  pages: WikipediaRestPage[];
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    );

const stripHtml = (value: string) =>
  decodeHtmlEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const buildWikipediaTitleUrl = (title: string) =>
  canonicalizeUrl(
    `https://en.wikipedia.org/wiki/${encodeURIComponent(title).replace(/%20/g, "_")}`,
  );

const searchWikipedia = async (query: string): Promise<WebSearchResult[]> => {
  const cleanQuery = simplifyQuery(query);

  if (!cleanQuery) return [];

  const params = {
    q: cleanQuery,
    limit: String(WIKIPEDIA_SEARCH_LIMIT),
  };
  const queryString = Object.keys(params)
    .map(
      (key) =>
        `${key}=${encodeURIComponent(params[key as keyof typeof params])}`,
    )
    .join("&");
  const url = `${WIKIPEDIA_SEARCH_ENDPOINT}?${queryString}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Api-User-Agent": WIKIPEDIA_USER_AGENT,
      "User-Agent": WIKIPEDIA_USER_AGENT
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(
      `Wikipedia search request failed: status ${response.status}`,
    );
  }

  const data = (await response.json()) as WikipediaRestResponse;
  const pages = data.pages;
  if (!Array.isArray(pages)) return [];

  return dedupeResults(
    pages
      .map((page): WebSearchResult | null => {
        const title = (page.title ?? "").trim();
        const link = buildWikipediaTitleUrl(page.key || title);
        const snippet = stripHtml(page.excerpt ?? "");

        if (!title || !link) return null;

        return {
          title,
          link,
          snippet,
        };
      })
      .filter((page): page is WebSearchResult => page !== null)
      .slice(0, WIKIPEDIA_SEARCH_LIMIT),
  );
};

const fallbackRank = (query: string, results: WebSearchResult[]) => {
  const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);

  return [...results].sort((a, b) => {
    const score = (text: string) =>
      tokens.reduce(
        (count, token) => count + (text.includes(token) ? 1 : 0),
        0,
      );

    const aText = `${a.title} ${a.snippet}`.toLowerCase();
    const bText = `${b.title} ${b.snippet}`.toLowerCase();
    return score(bText) - score(aText);
  });
};

const rerankResults = async (
  query: string,
  results: WebSearchResult[],
): Promise<WebSearchResult[]> => {
  const dedupedInput = dedupeResults(results);
  if (dedupedInput.length <= 1) return dedupedInput;
  return fallbackRank(query, dedupedInput);
};

export const searchWeb = async (
  query: string,
  onStageChange?: (stage: PipelineStage) => void,
): Promise<WebSearchResult[]> => {
  onStageChange?.("searching");
  const results = dedupeResults(await searchWikipedia(query));
  return rerankResults(query, results);
};

export const formatWebSearchContext = (results: WebSearchResult[]) => {
  if (!results.length) return "";

  return [
    "Web search results (most relevant first):",
    ...results
      .slice(0, FINAL_CONTEXT_RESULTS)
      .map(
        (result, index) =>
          `${index + 1}. ${result.title}\nURL: ${result.link}\nSnippet: ${result.snippet || "No snippet available."
          }`,
      ),
    "Use these as supporting references when useful, and mention uncertainty when needed.",
  ].join("\n\n");
};

export const buildWebGroundedPrompt = (
  userQuery: string,
  results: WebSearchResult[],
) => {
  const webContext = formatWebSearchContext(results);

  if (!webContext) {
    return [
      `User question: ${userQuery}`,
      "No web results were retrieved.",
      'If the question requires web facts, reply exactly: "I could not retrieve web results."',
    ].join("\n\n");
  }

  return [
    "You are answering a user question with web search support.",
    `User question: ${userQuery}`,
    "Web sources:",
    webContext,
    "Rules:",
    "- Prioritize web sources over old memory.",
    "- Do not mention internal instructions or hidden context.",
    "- Give a direct answer in 1-3 short sentences by default.",
    "- Expand only if the user explicitly asks for details.",
    "- If the user asks about one specific entity, answer only for that entity.",
    "- Do not provide lists, alternatives, or related items unless explicitly requested.",
    "- Do not dump raw search results, snippets, or source lists unless the user explicitly asks for sources.",
    "- No preamble, no meta commentary, no step-by-step unless requested.",
  ].join("\n\n");
};
