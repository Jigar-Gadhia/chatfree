import { create } from "zustand";
import { generateStream, stopGeneration } from "../ai/llm";
import { useModelStore } from "./modelStore";

type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
};

type ChatStore = {
  messages: Message[];
  loading: boolean;
  streaming: boolean;

  sendMessage: (text: string) => Promise<void>;
  stopStreaming: () => void;
  clearChat: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  loading: false,
  streaming: false,

  sendMessage: async (text) => {
    const { selectedModelId } = useModelStore.getState();

    if (!selectedModelId) return;

    const userId = Date.now().toString();
    const botId = userId + "_bot";

    const userMessage = {
      id: userId,
      text,
      role: "user" as const,
    };

    const botMessage = {
      id: botId,
      text: "",
      role: "assistant" as const,
    };

    set((state) => ({
      messages: [...state.messages, userMessage, botMessage],
      loading: true,
      streaming: false,
    }));

    try {
      // Build history with sliding window (last 12 messages) to avoid overflowing n_ctx
      const history = [...get().messages, userMessage]
        .filter((m) => m.text !== "")
        .map((m) => ({ role: m.role, text: m.text }))
        .slice(-12);

      await generateStream(history, selectedModelId, (token) => {
        set((state) => ({
          loading: false,
          streaming: true,
          messages: state.messages.map((msg) =>
            msg.id === botId ? { ...msg, text: msg.text + token } : msg
          ),
        }));
      });

      set({ streaming: false });
    } catch (err) {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === botId
            ? { ...msg, text: "Error generating response 😅" }
            : msg
        ),
        loading: false,
        streaming: false,
      }));
    }
  },

  stopStreaming: () => {
    stopGeneration();
    set({ streaming: false, loading: false });
  },

  clearChat: () => set({ messages: [] }),
}));
