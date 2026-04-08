import { initLlama } from "llama.rn";
import { MODELS, formatPrompt } from "../data/models";
import { useModelStore } from "../store/modelStore";

type SerperOrganicItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

type SerperSearchResponse = {
  organic?: SerperOrganicItem[];
};

type PipelineStage = "rewriting" | "searching" | "reranking";

export type WebSearchResult = {
  title: string;
  link: string;
  snippet: string;
};

const WEB_QUERY_REWRITE_MODEL_ID = "qwen2_5-1_5b-instruct-q4_k_m";
const WEB_RERANK_MODEL_ID = "qwen3-reranker-0_6b-q4_k_m";
const MAX_RESULTS = 6;
const RERANK_CHUNK_SIZE = 3;
const FINAL_CONTEXT_RESULTS = 3;

let helperContext: { modelId: string; context: any } | null = null;

const getSearchConfig = () => {
  const apiKey = process.env.EXPO_PUBLIC_SERPER_API_KEY || "";
  return { apiKey: apiKey.trim() };
};

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
  text.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim();

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

const getModelPath = (modelId: string) => {
  const download = useModelStore.getState().downloads[modelId];
  if (!download || download.status !== "completed" || !download.uri) {
    throw new Error(
      `Model "${modelId}" is not downloaded. Download it from model screen first.`
    );
  }

  return download.uri;
};

const releaseHelperContext = async () => {
  if (!helperContext?.context) return;
  try {
    await helperContext.context.release?.();
  } catch {
    // Ignore release errors.
  } finally {
    helperContext = null;
  }
};

const ensureModelContext = async (modelId: string) => {
  if (helperContext?.modelId === modelId && helperContext.context) {
    return helperContext.context;
  }

  await releaseHelperContext();

  const modelPath = getModelPath(modelId);
  const context = await initLlama({
    model: modelPath,
    n_ctx: 768,
    n_threads: 2,
  });

  helperContext = { modelId, context };
  return context;
};

const runModelCompletion = async (
  modelId: string,
  userPrompt: string,
  nPredict = 128,
  options?: { systemPromptOverride?: string }
) => {
  const model = MODELS.find((entry) => entry.id === modelId);
  if (!model) {
    throw new Error(`Model config not found for "${modelId}".`);
  }

  const context = await ensureModelContext(modelId);
  const promptModel = options?.systemPromptOverride
    ? {
        ...model,
        systemPrompt: options.systemPromptOverride,
      }
    : model;
  const prompt = formatPrompt(promptModel, [{ role: "user", text: userPrompt }]);

  let output = "";
  await context.completion(
    {
      prompt,
      n_predict: nPredict,
      temperature: 0.1,
      stop: model.stop || [],
    },
    (data: { token: string }) => {
      if (data?.token) output += data.token;
    }
  );

  return output.trim();
};

const rewriteQuery = async (query: string) => {
  const prompt = [
    "Rewrite the user query for web search.",
    "Rules:",
    "- Keep intent unchanged.",
    "- Use concise keywords.",
    "- Return only one line query text.",
    `User query: ${query}`,
  ].join("\n");

  const rewrittenRaw = await runModelCompletion(
    WEB_QUERY_REWRITE_MODEL_ID,
    prompt,
    20,
    {
      systemPromptOverride: [
        "You rewrite user queries for web search.",
        "Rules:",
        "- Preserve original intent.",
        "- Keep query concise and searchable.",
        "- Return only one rewritten query line.",
      ].join("\n"),
    }
  );

  const firstLine = rewrittenRaw.split("\n")[0]?.trim() ?? "";
  const clean = firstLine.replace(/^["'`]|["'`]$/g, "").trim();
  return clean || query;
};

const searchSerper = async (query: string): Promise<WebSearchResult[]> => {
  const { apiKey } = getSearchConfig();
  const cleanQuery = query.trim();

  if (!cleanQuery) return [];

  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_SERPER_API_KEY.");
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: cleanQuery,
      num: MAX_RESULTS,
    }),
  });

  if (!response.ok) {
    let errorReason = `status ${response.status}`;
    try {
      const errorPayload = (await response.json()) as { message?: string };
      if (errorPayload?.message) {
        errorReason = errorPayload.message;
      }
    } catch {
      // Keep status fallback.
    }

    throw new Error(`Serper request failed: ${errorReason}`);
  }

  const data = (await response.json()) as SerperSearchResponse;
  if (!Array.isArray(data.organic)) return [];

  return data.organic
    .map((item): WebSearchResult | null => {
      const title = (item.title ?? "").trim();
      const link = (item.link ?? "").trim();
      const snippet = (item.snippet ?? "").replace(/\s+/g, " ").trim();

      if (!title || !link) return null;
      return { title, link, snippet };
    })
    .filter((item): item is WebSearchResult => item !== null)
    .slice(0, MAX_RESULTS);
};

const fallbackRank = (query: string, results: WebSearchResult[]) => {
  const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);

  return [...results].sort((a, b) => {
    const score = (text: string) =>
      tokens.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);

    const aText = `${a.title} ${a.snippet}`.toLowerCase();
    const bText = `${b.title} ${b.snippet}`.toLowerCase();
    return score(bText) - score(aText);
  });
};

const chunkResults = (results: WebSearchResult[], chunkSize: number) => {
  const chunks: WebSearchResult[][] = [];
  for (let start = 0; start < results.length; start += chunkSize) {
    chunks.push(results.slice(start, start + chunkSize));
  }
  return chunks;
};

const rerankChunk = async (query: string, results: WebSearchResult[]) => {
  if (results.length <= 1) return results;

  const candidates = results
    .map(
      (result, index) =>
        `[${index + 1}] ${result.title}\nURL: ${result.link}\nSnippet: ${
          result.snippet || "No snippet"
        }`
    )
    .join("\n\n");

  const prompt = [
    "Rank the candidate search results by relevance to the query.",
    "Return only JSON with this exact schema: {\"ranked_ids\":[...]}",
    "Use IDs exactly as listed in candidates (1-based).",
    "Do not invent IDs that are not present.",
    `Query: ${query}`,
    "Candidates:",
    candidates,
  ].join("\n\n");

  try {
    const rerankRaw = await runModelCompletion(WEB_RERANK_MODEL_ID, prompt, 48);
    const jsonMatch = rerankRaw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackRank(query, results);

    const parsed = JSON.parse(jsonMatch[0]) as { ranked_ids?: number[] };
    if (!Array.isArray(parsed.ranked_ids)) return fallbackRank(query, results);

    const seen = new Set<number>();
    const toOneBasedId = (id: number) => {
      if (id >= 1 && id <= results.length) return id;
      if (id >= 0 && id < results.length) return id + 1;
      return -1;
    };

    const ranked = parsed.ranked_ids
      .filter((id) => Number.isInteger(id))
      .map(toOneBasedId)
      .filter((id) => id >= 1 && id <= results.length)
      .filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((id) => results[id - 1]);

    const remaining = results.filter((_, index) => !seen.has(index + 1));
    return [...ranked, ...remaining];
  } catch {
    return fallbackRank(query, results);
  }
};

const rerankResults = async (
  query: string,
  results: WebSearchResult[]
): Promise<WebSearchResult[]> => {
  if (results.length <= 1) return results;
  if (results.length <= FINAL_CONTEXT_RESULTS) return results;

  const dedupedInput = dedupeResults(results);
  if (dedupedInput.length <= 1) return dedupedInput;
  if (dedupedInput.length <= FINAL_CONTEXT_RESULTS) return dedupedInput;

  const chunks = chunkResults(dedupedInput, RERANK_CHUNK_SIZE);
  const chunkRanked: WebSearchResult[][] = [];
  for (const chunk of chunks) {
    const rankedChunk = await rerankChunk(query, chunk);
    chunkRanked.push(rankedChunk);
  }

  const candidates = chunkRanked.flatMap((chunk) => chunk.slice(0, 2));
  const uniqueByUrl: WebSearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const item of candidates) {
    const canonicalUrl = canonicalizeUrl(item.link);
    if (seenUrls.has(canonicalUrl)) continue;
    seenUrls.add(canonicalUrl);
    uniqueByUrl.push(item);
  }

  return rerankChunk(query, uniqueByUrl);
};

export const searchWeb = async (
  query: string,
  onStageChange?: (stage: PipelineStage) => void
): Promise<WebSearchResult[]> => {
  try {
    onStageChange?.("rewriting");
    const rewrittenQuery = await rewriteQuery(query);

    onStageChange?.("searching");
    const results = dedupeResults(await searchSerper(rewrittenQuery));

    onStageChange?.("reranking");
    return rerankResults(query, results);
  } finally {
    await releaseHelperContext();
  }
};

export const formatWebSearchContext = (results: WebSearchResult[]) => {
  if (!results.length) return "";

  return [
    "Web search results (most relevant first):",
    ...results.slice(0, FINAL_CONTEXT_RESULTS).map(
      (result, index) =>
        `${index + 1}. ${result.title}\nURL: ${result.link}\nSnippet: ${
          result.snippet || "No snippet available."
        }`
    ),
    "Use these as supporting references when useful, and mention uncertainty when needed.",
  ].join("\n\n");
};

export const buildWebGroundedPrompt = (
  userQuery: string,
  results: WebSearchResult[]
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
