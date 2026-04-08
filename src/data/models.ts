// src/data/models.ts

import { Model } from "../types/model";

export const MODELS: Model[] = [
  {
    id: "qwen2_5-1_5b-instruct-q4_k_m",
    name: "Qwen2.5 1.5B Instruct",
    sizeMB: 1700,
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    format: "qwen",
    nPredict: 128,
    recommendation: "Web query rewrite model",
    features: ["Query rewriting", "Fast inference", "Search intent cleanup"],
    stop: ["<|im_end|>", "<|im_start|>"],
    systemPrompt: `
You are a helpful and casual assistant.

RULES:
- Answer naturally and clearly
- Keep responses concise unless user asks for detail
- Do not rewrite user prompts unless explicitly asked
`,
  },
  {
    id: "qwen3-reranker-0_6b-q4_k_m",
    name: "Qwen3 Reranker 0.6B",
    sizeMB: 396,
    url: "https://huggingface.co/johnniang/Qwen3-Reranker-0.6B-Q4_K_M-GGUF/resolve/main/qwen3-reranker-0.6b-q4_k_m.gguf",
    format: "qwen",
    nPredict: 128,
    recommendation: "Web result reranker",
    features: ["Result ranking", "Relevance ordering", "Lightweight rerank"],
    stop: ["<|im_end|>", "<|im_start|>"],
    systemPrompt: `
You rerank search candidates by relevance.

RULES:
- Follow ranking instructions exactly
- Return only the requested ranking format
`,
  },
];

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export const formatPrompt = (model: Model, history: ChatMessage[]) => {
  switch (model.format) {
    case "qwen": {
      const turns = history
        .map((m) =>
          m.role === "user"
            ? `<|im_start|>user\n${m.text}\n<|im_end|>`
            : `<|im_start|>assistant\n${m.text}\n<|im_end|>`,
        )
        .join("\n");
      return `<|im_start|>system\n${model.systemPrompt || "You are a helpful assistant"}\n<|im_end|>\n${turns}\n<|im_start|>assistant\n`;
    }

    case "plain":
    default: {
      const turns = history
        .map((m) => (m.role === "user" ? `User: ${m.text}` : `AI: ${m.text}`))
        .join("\n");
      return turns + "\nAI:";
    }
  }
};
