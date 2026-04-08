import * as PdfTextExtract from "expo-pdf-text-extract";

const normalizeText = (value: string) =>
  value.replace(/\s+/g, " ").replace(/\u0000/g, "").trim();

const chunkText = (text: string, chunkSize = 1100, overlap = 140) => {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    const end = Math.min(cursor + chunkSize, normalized.length);
    chunks.push(normalized.slice(cursor, end));
    if (end >= normalized.length) break;
    cursor = Math.max(0, end - overlap);
  }

  return chunks;
};

const normalizePages = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item ?? ""));
  }

  if (raw && typeof raw === "object") {
    const maybeObject = raw as Record<string, unknown>;

    if (Array.isArray(maybeObject.pages)) {
      return maybeObject.pages.map((item) => String(item ?? ""));
    }

    if (typeof maybeObject.text === "string") {
      return [maybeObject.text];
    }
  }

  if (typeof raw === "string") {
    return [raw];
  }

  return [];
};

const extractPages = async (uri: string): Promise<string[]> => {
  const moduleAny = PdfTextExtract as any;
  const candidates: Array<((value: string) => Promise<unknown>) | undefined> = [
    moduleAny.extractTextAsync,
    moduleAny.extractText,
    moduleAny.extract,
    moduleAny.default?.extractTextAsync,
    moduleAny.default?.extractText,
    moduleAny.default?.extract,
  ];

  let lastError: unknown = null;

  for (const candidate of candidates) {
    if (typeof candidate !== "function") continue;

    try {
      const output = await candidate(uri);
      const pages = normalizePages(output);
      if (pages.length > 0) return pages;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error
      ? lastError
      : new Error("PDF extraction failed.");
  }

  throw new Error("No supported extractor function found in expo-pdf-text-extract.");
};

export const extractPdfContextFromUri = async (
  uri: string,
  options?: { maxPages?: number; maxChunks?: number }
) => {
  const maxPages = options?.maxPages ?? 30;
  const maxChunks = options?.maxChunks ?? 8;
  const extractedPages = await extractPages(uri);
  const pagesToRead = Math.min(extractedPages.length, maxPages);
  const pageTexts: string[] = [];

  for (let pageIndex = 1; pageIndex <= pagesToRead; pageIndex += 1) {
    const clean = normalizeText(extractedPages[pageIndex - 1] ?? "");
    if (clean) {
      pageTexts.push(`[Page ${pageIndex}] ${clean}`);
    }
  }

  const fullText = pageTexts.join("\n");
  const chunks = chunkText(fullText).slice(0, maxChunks);

  return {
    chunks,
    pageCount: extractedPages.length,
  };
};
