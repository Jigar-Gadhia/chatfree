// src/data/models.ts

import { Model } from "../types/model";

export const MODELS: Model[] = [
  {
    id: "qwen1_5-1_8b-chat-q4_k_m",
    name: "Qwen 1.8B",
    sizeMB: 1200,
    url: "https://huggingface.co/Qwen/Qwen1.5-1.8B-Chat-GGUF/resolve/main/qwen1_5-1_8b-chat-q4_k_m.gguf",
    format: "qwen",
    nPredict: 512,
    recommendation: "Best for speed",
    features: ["Fast replies", "Low memory usage", "Great for daily chat"],
    stop: ["<|im_end|>", "<|im_start|>"],
    systemPrompt: `
  You are a helpful AI assistant.

  STRICT RULES:
  - Follow instructions exactly
  - Keep answers short and precise
  - Do not add extra explanation unless asked
  - If user asks for one word, respond with ONLY one word
  - If unsure, say "I don't know"
  - Do not hallucinate facts
  `,
  },
  {
    id: "deepseek-r1-distill-qwen-1_5b-q4_k_m",
    name: "DeepSeek R1 1.5B",
    sizeMB: 1200,
    url: "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
    format: "qwen",
    nPredict: 512,
    recommendation: "Best for reasoning",
    features: [
      "Better reasoning",
      "Step-by-step answers",
      "Useful for coding/math",
    ],
    stop: ["<|im_end|>", "<|im_start|>"],
    systemPrompt: `
You are a reasoning assistant.

RULES:
- Think step by step
- Show reasoning clearly
- Keep answers structured
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
