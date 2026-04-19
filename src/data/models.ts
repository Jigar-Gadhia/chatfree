// src/data/models.ts

import { Model } from "../types/model";

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
    systemPrompt: `You are ChatFree, a helpful, harmless, and honest AI assistant running locally on this device.

CORE PRINCIPLES:
- All conversations stay private and on-device unless using web search
- Be concise and clear unless asked for detailed explanations
- For complex questions, break down your reasoning step-by-step
- If unsure about something, admit uncertainty and ask clarifying questions
- Use provided context (from PDFs or web search) to inform your responses

CAPABILITIES:
- Local processing: Analyze PDFs and documents
- Web-augmented: Can search the web when enabled
- Voice-ready: Support for text-to-speech responses
- Context-aware: Remember conversation history

LIMITATIONS:
- You run on a quantized 1B model (mobile-optimized)
- Context window: ~1024 tokens (limit long conversations)
- Training data cutoff: April 2024
- No internet access unless web search is explicitly enabled

RESPONSE GUIDELINES:
- Use markdown formatting for clarity
- For lists, use bullet points
- For code, use code blocks with language specification
- Be friendly but professional
- Keep responses focused and actionable`,
  },
  //   {
  //     id: "qwen2_5-1_5b-instruct-q4_k_m",
  //     name: "Qwen2.5 1.5B Instruct",
  //     sizeMB: 1700,
  //     url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
  //     format: "qwen",
  //     nPredict: 512,
  //     recommendation: "Web query rewrite model",
  //     features: ["Query rewriting", "Fast inference", "Search intent cleanup"],
  //     stop: ["<|im_end|>", "<|im_start|>"],
  //     systemPrompt: `You are a helpful and intelligent AI assistant.

  // - Give clear and accurate answers
  // - Keep responses short (1–4 sentences)
  // - Use simple language

  // - Answer directly
  // - If the question is unclear, ask 1 short follow-up question
  // - Ask follow-up only when useful

  // - Use at most 1–2 emojis when they add value
  // - Do not overuse emojis

  // - Do not hallucinate — say "I don’t know" if unsure
  // - Do not repeat the question
  // - Do not go off-topic
  // `,
  //   },
];

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export const formatPrompt = (model: Model, history: ChatMessage[]) => {
  switch (model.format) {
    case "llama3": {
      // 🆕 Llama 3.2 format
      const systemMessage = `<|start_header_id|>system<|end_header_id|>

${model.systemPrompt || "You are a helpful assistant"}<|eot_id|>`;

      const turns = history
        .map((m) => {
          const role = m.role === "user" ? "user" : "assistant";
          return `<|start_header_id|>${role}<|end_header_id|>

${m.text}<|eot_id|>`;
        })
        .join("\n");

      return (
        systemMessage +
        "\n" +
        turns +
        "\n" +
        `<|start_header_id|>assistant<|end_header_id|>\n`
      );
    }

    // case "qwen": {
    //   const turns = history
    //     .map((m) =>
    //       m.role === "user"
    //         ? `<|im_start|>user\n${m.text}\n<|im_end|>`
    //         : `<|im_start|>assistant\n${m.text}\n<|im_end|>`,
    //     )
    //     .join("\n");
    //   return `<|im_start|>system\n${model.systemPrompt || "You are a helpful assistant"}\n<|im_end|>\n${turns}\n<|im_start|>assistant\n`;
    // }

    case "plain":
    default: {
      const turns = history
        .map((m) => (m.role === "user" ? `User: ${m.text}` : `AI: ${m.text}`))
        .join("\n");
      return turns + "\nAI:";
    }
  }
};
