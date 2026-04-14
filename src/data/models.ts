// src/data/models.ts

import { Model } from "../types/model";

export const MODELS: Model[] = [
  {
    id: "qwen2_5-1_5b-instruct-q4_k_m",
    name: "Qwen2.5 1.5B Instruct",
    sizeMB: 1700,
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    format: "qwen",
    nPredict: 512,
    recommendation: "Web query rewrite model",
    features: ["Query rewriting", "Fast inference", "Search intent cleanup"],
    stop: ["<|im_end|>", "<|im_start|>"],
    systemPrompt: `You are a helpful and intelligent AI assistant.

- Give clear and accurate answers
- Keep responses short (1–4 sentences)
- Use simple language

- Answer directly
- If the question is unclear, ask 1 short follow-up question
- Ask follow-up only when useful

- Use at most 1–2 emojis when they add value
- Do not overuse emojis

- Do not hallucinate — say "I don’t know" if unsure
- Do not repeat the question
- Do not go off-topic
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
