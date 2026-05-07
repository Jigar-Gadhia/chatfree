// src/data/models.ts

import { Model } from "../types/model";
import {
  buildGemmaPrompt,
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
    nPredict: 256, // Can predict more tokens
    recommendation: "Best quality 1B model for mobile",
    features: [
      "26% better reasoning",
      "Superior instruction following",
      "Better code understanding",
      "Improved factual accuracy",
      "Lower memory usage",
    ],
    stop: ["<|eot_id|>"], // 🔄 Llama 3.2 stop token
    contextLength: 1024, // 🆕
    bosToken: "<|begin_of_text|>", // 🆕
    eosToken: "<|eot_id|>", // 🆕
    responseFormat: {
      // 🆕
      preferMarkdown: true,
      codeBlocksEnabled: true,
      bulletPointsEnabled: true,
      style: "concise",
    },
    systemPrompt: SYSTEM_PROMPTS.llama3(["local processing", "PDF analysis"]),
  },
  {
    id: "qwen2_5-1_5b-instruct-q4_k_m",
    name: "Qwen2.5 1.5B Instruct",
    sizeMB: 1700,
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    format: "qwen",
    nPredict: 512,
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
    contextLength: 2048, // 🆕 Qwen handles more context
    responseFormat: {
      // 🆕
      preferMarkdown: false, // Qwen tends to over-format
      codeBlocksEnabled: true,
      bulletPointsEnabled: true,
      style: "concise",
    },
    systemPrompt: SYSTEM_PROMPTS.qwen([
      "general conversation",
      "summarization",
    ]),
  },
];

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

// export const formatPrompt = (model: Model, history: ChatMessage[]) => {
//   switch (model.format) {
//     case "llama3": {
//       // 🆕 Llama 3.2 format
//       const systemMessage = `<|start_header_id|>system<|end_header_id|>

// ${model.systemPrompt || "You are a helpful assistant"}<|eot_id|>`;

//       const turns = history
//         .map((m) => {
//           const role = m.role === "user" ? "user" : "assistant";
//           return `<|start_header_id|>${role}<|end_header_id|>

// ${m.text}<|eot_id|>`;
//         })
//         .join("\n");

//       return (
//         systemMessage +
//         "\n" +
//         turns +
//         "\n" +
//         `<|start_header_id|>assistant<|end_header_id|>\n`
//       );
//     }

//     case "qwen": {
//       const turns = history
//         .map((m) =>
//           m.role === "user"
//             ? `<|im_start|>user\n${m.text}\n<|im_end|>`
//             : `<|im_start|>assistant\n${m.text}\n<|im_end|>`,
//         )
//         .join("\n");
//       return `<|im_start|>system\n${model.systemPrompt || "You are a helpful assistant"}\n<|im_end|>\n${turns}\n<|im_start|>assistant\n`;
//     }

//     case "plain":
//     default: {
//       const turns = history
//         .map((m) => (m.role === "user" ? `User: ${m.text}` : `AI: ${m.text}`))
//         .join("\n");
//       return turns + "\nAI:";
//     }
//   }
// };
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

    case "qwen":
      return buildQwenPrompt(
        systemPrompt,
        safeHistory,
        options.prefillResponse,
      );

    case "phi":
      return buildPhiPrompt(systemPrompt, safeHistory);

    case "gemma":
      return buildGemmaPrompt(systemPrompt, safeHistory);

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
