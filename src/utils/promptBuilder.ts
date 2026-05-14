import { ChatMessage } from "../data/models";

export interface PromptOptions {
  systemOverride?: string;
  prefillResponse?: string;
  trimHistory?: boolean;
}

// ─── Token estimation (rough: 1 token ≈ 4 chars) ─────────────────────────────

const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export const trimToContextLimit = (
  history: ChatMessage[],
  systemPrompt: string,
  contextLimit: number,
  reserveForResponse: number = 256,
): ChatMessage[] => {
  const systemTokens = estimateTokens(systemPrompt);
  const available = contextLimit - systemTokens - reserveForResponse;

  let used = 0;
  const trimmed: ChatMessage[] = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(safeText(history[i].text));
    if (used + tokens > available) break;
    trimmed.unshift(history[i]);
    used += tokens;
  }

  return trimmed;
};

// ─── Format builders ──────────────────────────────────────────────────────────

const safeText = (text: unknown): string => {
  return String(text ?? "").trim();
};

export const buildLlama3Prompt = (
  systemPrompt: string,
  history: ChatMessage[],
  prefill?: string,
): string => {
  const sys = `<|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|>`;

  const turns = history
    .map(({ role, text }) => {
      const normalizedRole = role === "user" ? "user" : "assistant";
      return (
        `<|start_header_id|>${normalizedRole}<|end_header_id|>\n\n` +
        `${safeText(text)}<|eot_id|>`
      );
    })
    .join("\n");

  const assistantHeader = `<|start_header_id|>assistant<|end_header_id|>\n\n`;
  return [sys, turns, assistantHeader + (prefill ?? "")]
    .filter(Boolean)
    .join("\n");
};

export const buildQwenPrompt = (
  systemPrompt: string,
  history: ChatMessage[],
  prefill?: string,
): string => {
  const sys = `<|im_start|>system\n${systemPrompt}\n<|im_end|>`;

  const turns = history
    .map(({ role, text }) =>
      role === "user"
        ? `<|im_start|>user\n${safeText(text)}\n<|im_end|>`
        : `<|im_start|>assistant\n${safeText(text)}\n<|im_end|>`,
    )
    .join("\n");

  const assistantStart = `<|im_start|>assistant\n${prefill ?? ""}`;
  return [sys, turns, assistantStart].join("\n");
};

// SmolLM2 uses standard ChatML — identical structure to Qwen, kept separate
// so format strings stay meaningful and future divergence is easy to handle
export const buildChatMLPrompt = (
  systemPrompt: string,
  history: ChatMessage[],
  prefill?: string,
): string => buildQwenPrompt(systemPrompt, history, prefill);

export const buildPhiPrompt = (
  systemPrompt: string,
  history: ChatMessage[],
): string => {
  // Works for both "phi" and "phi3" — Phi-3/3.5 uses the same <|system|> template
  const sys = `<|system|>\n${systemPrompt}<|end|>`;

  const turns = history
    .map(({ role, text }) =>
      role === "user"
        ? `<|user|>\n${safeText(text)}<|end|>`
        : `<|assistant|>\n${safeText(text)}<|end|>`,
    )
    .join("\n");

  return [sys, turns, "<|assistant|>"].join("\n");
};

export const buildGemma2Prompt = (
  systemPrompt: string,
  history: ChatMessage[],
): string => {
  // Gemma 2 IT supports a native system turn
  const sys = `<start_of_turn>system\n${systemPrompt}<end_of_turn>`;

  const turns = history
    .map(({ role, text }) =>
      role === "user"
        ? `<start_of_turn>user\n${safeText(text)}<end_of_turn>`
        : `<start_of_turn>model\n${safeText(text)}<end_of_turn>`,
    )
    .join("\n");

  return [sys, turns, "<start_of_turn>model"].join("\n");
};
