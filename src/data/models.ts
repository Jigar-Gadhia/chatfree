// src/data/models.ts

import { Model } from "../types/model";

export const MODELS: Model[] = [
  {
    id: "tinystories-3m",
    name: "TinyStories GPT 3M (Ultra Fast)",
    sizeMB: 8,
    url: "https://huggingface.co/afrideva/Tinystories-gpt-0.1-3m-GGUF/resolve/main/tinystories-gpt-0.1-3m.Q2_K.gguf",
    format: "plain",
    nPredict: 200,
  },
  {
    id: "tinyllama-15m",
    name: "TinyLlama 15M Stories (Fast)",
    sizeMB: 14,
    url: "https://huggingface.co/tensorblock/tinyllama-15M-stories-GGUF/resolve/main/tinyllama-15M-stories-Q4_K_M.gguf",
    format: "plain",
    nPredict: 200,
  },
  {
    id: "tinystories-656k",
    name: "TinyStories 656K (Ultra Lightweight)",
    sizeMB: 1,
    url: "https://huggingface.co/tensorblock/TinyStories-656K-GGUF/resolve/main/TinyStories-656K-Q3_K_M.gguf",
    format: "plain",
    nPredict: 150,
  },
  {
    id: "qwen1_5-1_8b-chat-q4_k_m",
    name: "Qwen1.5 1.8B Chat (Q4 - Recommended)",
    sizeMB: 1200,
    url: "https://huggingface.co/Qwen/Qwen1.5-1.8B-Chat-GGUF/resolve/main/qwen1_5-1_8b-chat-q4_k_m.gguf",
    format: "qwen",
    nPredict: 512,
    stop: ["<|im_end|>", "<|im_start|>"],
    systemPrompt: "You are a helpful AI assistant. Reply briefly.",
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
            : `<|im_start|>assistant\n${m.text}\n<|im_end|>`
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
