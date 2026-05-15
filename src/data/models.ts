// src/data/models.ts

import { Model } from "../types/model";
import {
  buildChatMLPrompt,
  buildGemma2Prompt,
  buildLlama3Prompt,
  buildPhiPrompt,
  buildQwenPrompt,
  PromptOptions,
  trimToContextLimit,
} from "../utils/promptBuilder";
import { SYSTEM_PROMPTS } from "./prompts";

export const MODELS: Model[] = [
  {
    id: "llama-3.2-1b-instruct-q4_k_m",
    name: "Llama 3.2 1B Instruct",
    sizeMB: 808, // 🎯 Much smaller!
    url: "https://huggingface.co/unsloth/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    format: "llama3", // 🔄 Changed format
    nPredict: 1024, // Can predict more tokens
    recommendation: "Best quality 1B model for mobile",
    features: [
      "26% better reasoning",
      "Superior instruction following",
      "Better code understanding",
      "Improved factual accuracy",
      "Lower memory usage",
    ],
    stop: ["<|eot_id|>"], // 🔄 Llama 3.2 stop token
    contextLength: 4096, // 🆕
    bosToken: "<|begin_of_text|>", // 🆕
    eosToken: "<|eot_id|>", // 🆕
    responseFormat: {
      // 🆕
      preferMarkdown: true,
      codeBlocksEnabled: true,
      bulletPointsEnabled: true,
      style: "concise",
    },
    systemPrompt: SYSTEM_PROMPTS.llama3({
      capabilities: ["local processing", "PDF analysis"],
    }),
  },
  {
    id: "qwen2_5-1_5b-instruct-q4_k_m",
    name: "Qwen2.5 1.5B Instruct",
    sizeMB: 1700,
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    format: "qwen",
    nPredict: 1024,
    recommendation: "lightweight assistant model",
    features: [
      "General conversation",
      "Instruction following",
      "Query understanding",
      "Prompt rewriting",
      "Basic coding assistance",
      "Summarization",
      "Fast CPU inference",
      "Low memory usage",
    ],
    stop: ["<|im_end|>", "<|im_start|>"],
    contextLength: 4096, // 🆕 Qwen handles more context
    responseFormat: {
      // 🆕
      preferMarkdown: false, // Qwen tends to over-format
      codeBlocksEnabled: true,
      bulletPointsEnabled: true,
      style: "concise",
    },
    systemPrompt: SYSTEM_PROMPTS.qwen({
      capabilities: ["general conversation", "summarization"],
    }),
  },
  {
    id: "smollm2-1_7b-instruct-q4_k_m",
    name: "SmolLM2 1.7B Instruct",
    sizeMB: 1100,
    url: "https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF/resolve/main/smollm2-1.7b-instruct-q4_k_m.gguf",
    format: "chatml",
    nPredict: 512,
    recommendation: "Fastest inference, lowest RAM footprint",
    features: [
      "Optimized for on-device use",
      "Strong instruction following for size",
      "Minimal RAM usage",
      "Great for quick Q&A",
    ],
    stop: ["<|im_end|>"],
    contextLength: 2048,
    bosToken: "<|im_start|>",
    eosToken: "<|im_end|>",
    responseFormat: {
      preferMarkdown: false,
      codeBlocksEnabled: true,
      bulletPointsEnabled: true,
      style: "concise",
    },
    systemPrompt: SYSTEM_PROMPTS.chatml({
      capabilities: ["quick answers", "on-device tasks"],
    }),
  },
  {
    id: "gemma2-2b-instruct-q4_k_m",
    name: "Gemma 2 2B Instruct",
    sizeMB: 1600,
    url: "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf",
    format: "gemma2",
    nPredict: 512,
    recommendation: "Best overall quality under 2GB",
    features: [
      "Google's optimized 2B model",
      "Punches above its weight class",
      "Great at reasoning and summarization",
      "Sliding window attention — efficient on long inputs",
    ],
    stop: ["<end_of_turn>"],
    contextLength: 2048,
    bosToken: "<bos>",
    eosToken: "<eos>",
    responseFormat: {
      preferMarkdown: true,
      codeBlocksEnabled: true,
      bulletPointsEnabled: true,
      style: "concise",
    },
    systemPrompt: SYSTEM_PROMPTS.gemma2({
      capabilities: ["summarization", "reasoning"],
    }),
  },
  {
    id: "phi-3.5-mini-instruct-q4_k_m",
    name: "Phi-3.5 Mini Instruct",
    sizeMB: 2200,
    url: "https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf",
    format: "phi3",
    nPredict: 1536,
    recommendation: "Best reasoning per MB — Microsoft's flagship small model",
    features: [
      "SOTA reasoning at this size tier",
      "Trained on 3.4T tokens",
      "128K native context (capped to 2048 on mobile)",
      "Excellent at structured output and code",
    ],
    stop: ["<|end|>"],
    contextLength: 4096,
    bosToken: "<|endoftext|>",
    eosToken: "<|end|>",
    responseFormat: {
      preferMarkdown: true,
      codeBlocksEnabled: true,
      bulletPointsEnabled: true,
      style: "detailed",
    },
    systemPrompt: SYSTEM_PROMPTS.phi3({
      capabilities: ["coding", "reasoning", "structured output"],
    }),
  },
  // {
  //   id: "lfm2.5-1.2b-thinking-q4_k_m",
  //   name: "LFM2.5 1.2B Thinking",

  //   sizeMB: 890,

  //   url: "https://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking-GGUF/resolve/main/LFM2.5-1.2B-Thinking-Q4_K_M.gguf",

  //   format: "chatml",

  //   nPredict: 1024,

  //   recommendation: "Best mobile reasoning model under 1GB",

  //   features: [
  //     "Reasoning-focused small model",
  //     "Excellent structured thinking",
  //     "Fast on-device inference",
  //     "Optimized for edge AI",
  //     "Very low RAM usage",
  //     "Strong coding capabilities",
  //     "Long context support",
  //     "Agentic task optimized",
  //   ],

  //   stop: ["<|im_end|>"],

  //   contextLength: 4096,

  //   bosToken: "<|im_start|>",
  //   eosToken: "<|im_end|>",

  //   responseFormat: {
  //     preferMarkdown: true,
  //     codeBlocksEnabled: true,
  //     bulletPointsEnabled: true,
  //     style: "detailed",
  //   },

  //   systemPrompt: SYSTEM_PROMPTS.chatml([
  //     "reasoning",
  //     "coding",
  //     "structured output",
  //     "agentic tasks",
  //   ]),
  // },
];

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export const formatPrompt = (
  model: Model,
  history: ChatMessage[],
  options: PromptOptions = {},
): string => {
  const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant.";
  const systemPrompt =
    options.systemOverride ?? model.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;

  // ✅ Trim history to fit context window
  const safeHistory = options.trimHistory
    ? trimToContextLimit(
        history,
        systemPrompt,
        model.contextLength,
        model.nPredict,
      )
    : history;

  switch (model.format) {
    case "llama3":
      return buildLlama3Prompt(
        systemPrompt,
        safeHistory,
        options.prefillResponse,
      );

    case "chatml":
      return buildChatMLPrompt(
        systemPrompt,
        safeHistory,
        options.prefillResponse,
      );

    case "qwen":
      return buildQwenPrompt(
        systemPrompt,
        safeHistory,
        options.prefillResponse,
      );

    case "phi3":
      return buildPhiPrompt(systemPrompt, safeHistory);

    case "gemma2":
      return buildGemma2Prompt(systemPrompt, safeHistory);

    case "plain":
    default:
      return buildPlainPrompt(systemPrompt, safeHistory);
  }
};

// ✅ Improved plain format with explicit system framing
const buildPlainPrompt = (
  systemPrompt: string,
  history: ChatMessage[],
): string => {
  const sys = `### Instructions\n${systemPrompt}\n\n### Conversation`;

  const turns = history
    .map(({ role, text }) =>
      role === "user" ? `Human: ${text.trim()}` : `Assistant: ${text.trim()}`,
    )
    .join("\n");

  return [sys, turns, "Assistant:"].join("\n");
};
