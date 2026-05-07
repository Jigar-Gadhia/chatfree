// src/utils/promptBuilder.ts

import { ChatMessage } from "../data/models";

export interface PromptOptions {
  systemOverride?: string; // Allow runtime system prompt injection
  prefillResponse?: string; // Prefill assistant response start
  trimHistory?: boolean; // Auto-trim to fit context
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

  // ✅ Always keep the latest message, trim from oldest
  for (let i = history.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(history[i].text);
    if (used + tokens > available) break;
    trimmed.unshift(history[i]);
    used += tokens;
  }

  return trimmed;
};

// ─── Format builders ──────────────────────────────────────────────────────────

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
        `${text.trim()}<|eot_id|>`
      );
    })
    .join("\n");

  const assistantHeader = `<|start_header_id|>assistant<|end_header_id|>\n\n`;

  // ✅ Prefill steers the response format
  const prefillText = prefill ? prefill : "";

  return [sys, turns, assistantHeader + prefillText].filter(Boolean).join("\n");
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
        ? `<|im_start|>user\n${text.trim()}\n<|im_end|>`
        : `<|im_start|>assistant\n${text.trim()}\n<|im_end|>`,
    )
    .join("\n");

  const assistantStart = `<|im_start|>assistant\n${prefill ?? ""}`;

  return [sys, turns, assistantStart].join("\n");
};

export const buildPhiPrompt = (
  systemPrompt: string,
  history: ChatMessage[],
): string => {
  const sys = `<|system|>\n${systemPrompt}<|end|>`;

  const turns = history
    .map(({ role, text }) =>
      role === "user"
        ? `<|user|>\n${text.trim()}<|end|>`
        : `<|assistant|>\n${text.trim()}<|end|>`,
    )
    .join("\n");

  return [sys, turns, "<|assistant|>"].join("\n");
};

export const buildGemmaPrompt = (
  systemPrompt: string,
  history: ChatMessage[],
): string => {
  // Gemma injects system prompt as first user turn
  const firstTurn = history[0]
    ? `<start_of_turn>user\n${systemPrompt}\n\n${history[0].text}<end_of_turn>`
    : `<start_of_turn>user\n${systemPrompt}<end_of_turn>`;

  const remainingTurns = history
    .slice(1)
    .map(({ role, text }) =>
      role === "user"
        ? `<start_of_turn>user\n${text.trim()}<end_of_turn>`
        : `<start_of_turn>model\n${text.trim()}<end_of_turn>`,
    )
    .join("\n");

  return [firstTurn, remainingTurns, "<start_of_turn>model"].join("\n");
};
