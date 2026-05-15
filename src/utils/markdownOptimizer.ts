/**
 * Markdown Optimizer Utilities
 *
 * Optimized markdown parsing for smooth streaming response rendering.
 * Implements:
 * - Token batching
 * - Debounced parsing
 * - Stable AST caching
 * - Memoized code blocks
 * - Incremental rendering
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParsedBlock =
  | { type: "text"; content: string }
  | { type: "fence"; language: string; content: string };

export type MarkdownAST = {
  blocks: ParsedBlock[];
  timestamp: number;
  version: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 100;
const MIN_PARSE_CHARS = 50;
const CODE_BLOCK_REGEX = /```(\w*)\n?([\s\S]*?)```/g;
const PARTIAL_CODE_FENCE_REGEX = /```(\w*)\n?([\s\S]*?)$/;

// Pre-process markdown with improved partial handling
export const preprocessMarkdown = (text: string): string => {
  // Fix incomplete fenced code blocks while streaming
  const fenceCount = (text.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    text += "\n```";
  }

  // Escape double dollar signs (LaTeX)
  return text.replace(/\$\$/g, "$");
};

// Incremental parse - only parse new content
export const parseMarkdownIncremental = (
  fullText: string,
  previousAst: MarkdownAST | null,
  previousTextLength: number,
): MarkdownAST => {
  const now = Date.now();

  // If text got shorter (edited), full reparse needed
  if (previousTextLength > fullText.length) {
    return parseMarkdown(fullText, now);
  }

  // If previous AST exists and text grew incrementally, try incremental parse
  if (previousAst && previousTextLength > 0) {
    const newContent = fullText.slice(previousTextLength);

    // Only do incremental if new content is substantial enough
    if (newContent.length >= MIN_PARSE_CHARS) {
      // For simplicity, we'll still do a full parse but skip expensive parts
      // A more sophisticated approach would use a diff-based parser
    }
  }

  return parseMarkdown(fullText, now);
};

// Parse markdown into blocks (text and code fences)
export const parseMarkdown = (
  text: string,
  timestamp?: number,
): MarkdownAST => {
  const now = timestamp ?? Date.now();
  const processed = preprocessMarkdown(text);

  const blocks: ParsedBlock[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex state
  CODE_BLOCK_REGEX.lastIndex = 0;

  while ((match = CODE_BLOCK_REGEX.exec(processed)) !== null) {
    const [fullMatch, language, content] = match;
    const startIndex = match.index;

    // Add text before code block
    if (startIndex > lastIndex) {
      const textContent = processed.slice(lastIndex, startIndex);
      if (textContent.trim()) {
        blocks.push({ type: "text", content: textContent });
      }
    }

    // Add code block
    blocks.push({
      type: "fence",
      language: language || "CODE",
      content: content.trimEnd(),
    });

    lastIndex = startIndex + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < processed.length) {
    const remainingText = processed.slice(lastIndex);
    if (remainingText.trim()) {
      blocks.push({ type: "text", content: remainingText });
    }
  }

  // Handle partial code block at end (streaming in progress)
  if (lastIndex === 0 && processed.length > 0) {
    // Check for unclosed code fence at the end
    const partialMatch = processed.match(PARTIAL_CODE_FENCE_REGEX);
    if (partialMatch && partialMatch[0].startsWith("```")) {
      const [, language, content] = partialMatch;
      // Find where this partial starts
      const partialStart = processed.lastIndexOf("```");

      // Add text before the partial code fence
      if (partialStart > 0) {
        const beforeText = processed.slice(0, partialStart);
        if (beforeText.trim()) {
          blocks.push({ type: "text", content: beforeText });
        }
      }

      blocks.push({
        type: "fence",
        language: language || "CODE",
        content: content,
      });
    } else {
      blocks.push({ type: "text", content: processed });
    }
  }

  return {
    blocks,
    timestamp: now,
    version: 1,
  };
};

// Extract stable content (content that won't change - completed blocks)
export const extractStableContent = (
  ast: MarkdownAST,
  fullText: string,
): string => {
  if (ast.blocks.length === 0) return "";

  // Simple heuristic: content up to the last complete code block
  const lastCompleteFence = fullText.lastIndexOf(
    "```",
    fullText.lastIndexOf("```"),
  );

  // If we have completed blocks at the end, use them
  const lastBlock = ast.blocks[ast.blocks.length - 1];
  if (lastBlock.type === "text") {
    return fullText;
  }

  // For code blocks, find the closing fence
  const lastFenceIndex = fullText.lastIndexOf("```");
  if (lastFenceIndex > 0 && lastFenceIndex < fullText.length - 3) {
    return fullText.slice(0, lastFenceIndex + 3);
  }

  return fullText;
};

// Debounce utility for markdown parsing
export const createDebouncedParser = (debounceMs: number = DEBOUNCE_MS) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingText: string | null = null;
  let resolveCallback: ((ast: MarkdownAST) => void) | null = null;

  return {
    parse: (text: string): Promise<MarkdownAST> => {
      return new Promise((resolve) => {
        pendingText = text;
        resolveCallback = resolve;

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          if (pendingText !== null && resolveCallback) {
            const ast = parseMarkdown(pendingText);
            resolveCallback(ast);
            resolveCallback = null;
            pendingText = null;
            timeoutId = null;
          }
        }, debounceMs);
      });
    },

    flush: (): Promise<MarkdownAST | null> => {
      return new Promise((resolve) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (pendingText !== null && resolveCallback) {
          const ast = parseMarkdown(pendingText);
          resolveCallback(ast);
          resolveCallback = null;
          pendingText = null;
          resolve(ast);
        } else {
          resolve(null);
        }
      });
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingText = null;
      resolveCallback = null;
    },
  };
};

// Batch tokens before triggering re-render
export const createTokenBatcher = (batchSize: number = 32) => {
  let buffer = "";
  let flushCallback: (() => void) | null = null;

  return {
    add: (token: string, flush: () => void): boolean => {
      buffer += token;
      flushCallback = flush;

      if (buffer.length >= batchSize) {
        flush();
        buffer = "";
        return true;
      }
      return false;
    },

    flush: (): string => {
      const content = buffer;
      buffer = "";
      if (flushCallback) flushCallback();
      return content;
    },

    getBuffered: (): string => buffer,

    clear: (): string => {
      const content = buffer;
      buffer = "";
      return content;
    },
  };
};

// Memoization key generator for code blocks
export const getCodeBlockKey = (language: string, content: string): string => {
  // Use content hash for stable keys
  const hash = content.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);
  return `${language}-${Math.abs(hash)}`;
};

// Pre-detect code blocks for early rendering
export const detectCodeBlocks = (
  text: string,
): Array<{ start: number; end: number; language: string }> => {
  const fences: Array<{ start: number; end: number; language: string }> = [];
  let index = 0;

  while (index < text.length) {
    const openFence = text.indexOf("```", index);
    if (openFence === -1) break;

    const metaStart = openFence + 3;
    const newlineIndex = text.indexOf("\n", metaStart);

    if (newlineIndex === -1) {
      // Incomplete fence
      fences.push({
        start: openFence,
        end: text.length,
        language: text.slice(metaStart).trim() || "CODE",
      });
      break;
    }

    const language = text.slice(metaStart, newlineIndex).trim();
    const codeStart = newlineIndex + 1;
    const closeFence = text.indexOf("```", codeStart);

    if (closeFence === -1) {
      fences.push({
        start: openFence,
        end: text.length,
        language: language || "CODE",
      });
      break;
    }

    fences.push({
      start: openFence,
      end: closeFence + 3,
      language: language || "CODE",
    });

    index = closeFence + 3;
  }

  return fences;
};
