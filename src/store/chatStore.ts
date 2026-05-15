import { Directory, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { create } from "zustand";
import { generateStream, stopGeneration } from "../ai/llm";
import {
  buildWebGroundedPrompt,
  searchWeb,
  WebSearchResult,
} from "../ai/webSearch";
import { useModelStore } from "./modelStore";

type MessageSource = {
  title: string;
  url: string;
};

type MessageAttachment = {
  name: string;
};

type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
  sources?: MessageSource[];
  attachments?: MessageAttachment[];
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

type ChatStore = {
  chats: ChatSession[];
  activeChatId: string;
  loading: boolean;
  streaming: boolean;
  webSearchStatus:
    | "idle"
    | "rewriting"
    | "searching"
    | "reranking"
    | "processing"
    | "failed";

  init: () => Promise<void>;
  sendMessage: (
    text: string,
    options?: {
      useWebSearch?: boolean;
      documentContext?: string;
      userAttachments?: MessageAttachment[];
    },
  ) => Promise<void>;
  stopStreaming: () => void;
  clearChat: () => void;
  createNewChat: () => string;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  regenerateAssistant: (assistantMessageId: string) => Promise<void>;
  editUserMessage: (userMessageId: string, text: string) => Promise<void>;
};

const CHAT_DIR = new Directory(Paths.document, "chat");
const CHAT_STATE_FILE = `${CHAT_DIR.uri}state.json`;

const makeId = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const makeChat = (title = "New chat"): ChatSession => {
  const now = Date.now();

  return {
    id: makeId(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
};

const deriveTitle = (text: string) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 40 ? `${clean.slice(0, 40)}...` : clean;
};

const isUntouchedNewChat = (chat: ChatSession) =>
  chat.title === "New chat" && chat.messages.length === 0;

const sortChats = (chats: ChatSession[]) =>
  [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

const ensureChatDir = async () => {
  if (!(await CHAT_DIR.exists)) {
    await CHAT_DIR.create({ intermediates: true });
  }
};

const persistChats = async (chats: ChatSession[], activeChatId: string) => {
  try {
    await ensureChatDir();
    await FileSystem.writeAsStringAsync(
      CHAT_STATE_FILE,
      JSON.stringify({ chats, activeChatId }),
    );
  } catch (e) {
    console.log("Chat persist error", e);
  }
};

const loadPersistedChatState = async (): Promise<{
  chats: ChatSession[];
  activeChatId: string | null;
} | null> => {
  try {
    await ensureChatDir();
    const info = await FileSystem.getInfoAsync(CHAT_STATE_FILE);
    if (!info.exists) return null;

    const raw = await FileSystem.readAsStringAsync(CHAT_STATE_FILE);
    const parsed = JSON.parse(raw) as {
      chats?: ChatSession[];
      activeChatId?: string;
    };

    return {
      chats: Array.isArray(parsed.chats) ? parsed.chats : [],
      activeChatId:
        typeof parsed.activeChatId === "string" ? parsed.activeChatId : null,
    };
  } catch (e) {
    console.log("Chat load error", e);
    return null;
  }
};

export const useChatStore = create<ChatStore>((set, get) => {
  const initialChat = makeChat();
  const streamFlushIntervalMs = 50;

  const appendAssistantChunk = (
    chatId: string,
    assistantMessageId: string,
    chunk: string,
  ) => {
    if (!chunk) return;

    set((state) => ({
      chats: state.chats.map((chat) => {
        if (chat.id !== chatId) return chat;

        return {
          ...chat,
          messages: chat.messages.map((message) =>
            message.id === assistantMessageId
              ? { ...message, text: message.text + chunk }
              : message,
          ),
          updatedAt: Date.now(),
        };
      }),
      loading: false,
      streaming: true,
    }));
  };

  const setAssistantSources = (
    chatId: string,
    assistantMessageId: string,
    results: WebSearchResult[],
  ) => {
    const sources: MessageSource[] = results
      .map((result) => ({
        title: result.title,
        url: result.link,
      }))
      .filter((source) => source.title && source.url);

    if (!sources.length) return;

    set((state) => ({
      chats: state.chats.map((chat) => {
        if (chat.id !== chatId) return chat;

        return {
          ...chat,
          messages: chat.messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  sources,
                }
              : message,
          ),
          updatedAt: Date.now(),
        };
      }),
    }));
  };

  return {
    chats: [initialChat],
    activeChatId: initialChat.id,
    loading: false,
    streaming: false,
    webSearchStatus: "idle",

    init: async () => {
      try {
        const persisted = await loadPersistedChatState();
        const parsedChats: ChatSession[] = persisted?.chats ?? [];

        if (!Array.isArray(parsedChats) || parsedChats.length === 0) {
          const freshChat = makeChat();
          set({ chats: [freshChat], activeChatId: freshChat.id });
          await persistChats([freshChat], freshChat.id);
          return;
        }

        const chats = sortChats(parsedChats);
        const latestChat = chats[0];

        if (isUntouchedNewChat(latestChat)) {
          set({ chats, activeChatId: latestChat.id });
          await persistChats(chats, latestChat.id);
          return;
        }

        const freshChat = makeChat();
        const nextChats = sortChats([freshChat, ...chats]);
        set({ chats: nextChats, activeChatId: freshChat.id });
        await persistChats(nextChats, freshChat.id);
      } catch (e) {
        console.log("Chat init error", e);
      }
    },

    createNewChat: () => {
      stopGeneration();

      const existingUntouchedChat = get().chats.find((chat) =>
        isUntouchedNewChat(chat),
      );
      if (existingUntouchedChat) {
        set({
          activeChatId: existingUntouchedChat.id,
          loading: false,
          streaming: false,
        });
        persistChats(get().chats, existingUntouchedChat.id);
        return existingUntouchedChat.id;
      }

      const newChat = makeChat();
      const nextChats = sortChats([newChat, ...get().chats]);
      set({
        chats: nextChats,
        activeChatId: newChat.id,
        loading: false,
        streaming: false,
      });
      persistChats(nextChats, newChat.id);
      return newChat.id;
    },

    selectChat: (chatId) => {
      if (!get().chats.some((chat) => chat.id === chatId)) return;
      set({ activeChatId: chatId });
      persistChats(get().chats, chatId);
    },

    deleteChat: (chatId) => {
      const { chats, activeChatId, streaming } = get();
      if (activeChatId === chatId && streaming) {
        stopGeneration();
      }
      const nextChats = chats.filter((chat) => chat.id !== chatId);

      if (nextChats.length === 0) {
        const freshChat = makeChat();
        set({
          chats: [freshChat],
          activeChatId: freshChat.id,
          loading: false,
          streaming: false,
        });
        persistChats([freshChat], freshChat.id);
        return;
      }

      const nextActiveId =
        activeChatId === chatId ? nextChats[0].id : activeChatId;
      set({
        chats: sortChats(nextChats),
        activeChatId: nextActiveId,
        loading: false,
        streaming: false,
      });
      persistChats(sortChats(nextChats), nextActiveId);
    },

    clearChat: () => {
      const { chats, activeChatId } = get();
      const nextChats = chats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title: "New chat",
              messages: [],
              updatedAt: Date.now(),
            }
          : chat,
      );

      const sorted = sortChats(nextChats);
      set({ chats: sorted, activeChatId, loading: false, streaming: false });
      persistChats(sorted, activeChatId);
    },

    sendMessage: async (text, options) => {
      const { selectedModelId } = useModelStore.getState();
      if (!selectedModelId) return;

      const content = text.trim();
      if (!content) return;
      const useWebSearch = options?.useWebSearch === true;
      const documentContext = options?.documentContext?.trim() || "";
      const userAttachments = options?.userAttachments ?? [];

      const chatId = get().activeChatId;
      const userId = makeId();
      const botId = `${userId}_bot`;
      const now = Date.now();

      const userMessage: Message = {
        id: userId,
        text: content,
        role: "user",
        attachments: userAttachments,
      };

      const botMessage: Message = {
        id: botId,
        text: "",
        role: "assistant",
      };

      let historyForModel: { role: "user" | "assistant"; text: string }[] = [];

      set((state) => {
        const chats = state.chats.map((chat) => {
          if (chat.id !== chatId) return chat;

          const nextMessages = [...chat.messages, userMessage, botMessage];
          const nextTitle =
            chat.title === "New chat" && chat.messages.length === 0
              ? deriveTitle(content)
              : chat.title;

          historyForModel = nextMessages
            .filter((m) => m.text !== "")
            .map((m) => ({ role: m.role, text: m.text }))
            .slice(-12);

          return {
            ...chat,
            title: nextTitle,
            messages: nextMessages,
            updatedAt: now,
          };
        });

        return {
          chats: sortChats(chats),
          loading: true,
          streaming: false,
          webSearchStatus: useWebSearch ? "searching" : "idle",
        };
      });

      persistChats(get().chats, get().activeChatId);

      try {
        let historyForGeneration = historyForModel;
        const hasGenerationContext = documentContext.length > 0 || useWebSearch;
        let generationUserText = content;

        if (documentContext) {
          generationUserText = [
            "Attached PDF context:",
            documentContext,
            "",
            `User question: ${content}`,
          ].join("\n");
        }

        if (useWebSearch) {
          try {
            const webResults = await searchWeb(content, (stage) => {
              set({ webSearchStatus: stage });
            });
            if (webResults.length === 0) {
              throw new Error("No web results returned for this query.");
            }

            set({ webSearchStatus: "processing" });

            if (historyForModel.length > 0) {
              const lastIndex = historyForModel.length - 1;
              const lastMessage = historyForModel[lastIndex];

              if (lastMessage.role === "user") {
                const groundedUserPrompt = buildWebGroundedPrompt(
                  generationUserText,
                  webResults,
                );

                historyForGeneration = [
                  ...historyForModel.slice(0, lastIndex),
                  { role: "user", text: groundedUserPrompt },
                ];
              }
            }

            setAssistantSources(chatId, botId, webResults);
          } catch (error) {
            const reason =
              error instanceof Error
                ? error.message
                : "Unknown web search error.";
            console.log("Web search error", error);

            set((state) => {
              const chats = state.chats.map((chat) => {
                if (chat.id !== chatId) return chat;

                return {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === botId
                      ? {
                          ...msg,
                          text: `Web search failed: ${reason}\n\nPlease try again in a moment.`,
                        }
                      : msg,
                  ),
                  updatedAt: Date.now(),
                };
              });

              return {
                chats: sortChats(chats),
                loading: false,
                streaming: false,
                webSearchStatus: "failed",
              };
            });

            persistChats(get().chats, get().activeChatId);
            return;
          }
        } else if (hasGenerationContext && historyForModel.length > 0) {
          const lastIndex = historyForModel.length - 1;
          const lastMessage = historyForModel[lastIndex];
          if (lastMessage.role === "user") {
            historyForGeneration = [
              ...historyForModel.slice(0, lastIndex),
              { role: "user", text: generationUserText },
            ];
          }
        }

        let pendingChunk = "";
        let flushTimer: ReturnType<typeof setTimeout> | null = null;

        const flushPendingChunk = () => {
          if (!pendingChunk) return;
          const chunk = pendingChunk;
          pendingChunk = "";
          appendAssistantChunk(chatId, botId, chunk);
        };

        const scheduleFlush = () => {
          if (flushTimer) return;
          flushTimer = setTimeout(() => {
            flushTimer = null;
            flushPendingChunk();
          }, streamFlushIntervalMs);
        };

        await generateStream(historyForGeneration, selectedModelId, (token) => {
          pendingChunk += token;
          scheduleFlush();
        });

        if (flushTimer) clearTimeout(flushTimer);
        flushPendingChunk();
        set({ streaming: false, loading: false, webSearchStatus: "idle" });
        persistChats(get().chats, get().activeChatId);
      } catch {
        set((state) => {
          const chats = state.chats.map((chat) => {
            if (chat.id !== chatId) return chat;

            return {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.id === botId
                  ? { ...msg, text: "Error generating response." }
                  : msg,
              ),
              updatedAt: Date.now(),
            };
          });

          return {
            chats: sortChats(chats),
            loading: false,
            streaming: false,
            webSearchStatus: "idle",
          };
        });

        persistChats(get().chats, get().activeChatId);
      }
    },

    regenerateAssistant: async (assistantMessageId) => {
      const { selectedModelId } = useModelStore.getState();
      if (!selectedModelId) return;

      const activeChatId = get().activeChatId;
      let canRegenerate = false;
      let historyForModel: { role: "user" | "assistant"; text: string }[] = [];

      set((state) => {
        const chats = state.chats.map((chat) => {
          if (chat.id !== activeChatId) return chat;

          const assistantIndex = chat.messages.findIndex(
            (message) =>
              message.id === assistantMessageId && message.role === "assistant",
          );

          if (assistantIndex <= 0) return chat;

          const previousMessage = chat.messages[assistantIndex - 1];
          if (!previousMessage || previousMessage.role !== "user") return chat;

          const baseMessages = chat.messages.slice(0, assistantIndex);
          historyForModel = baseMessages
            .filter((message) => message.text !== "")
            .map((message) => ({ role: message.role, text: message.text }))
            .slice(-12);

          canRegenerate = true;

          return {
            ...chat,
            messages: [
              ...baseMessages,
              {
                ...chat.messages[assistantIndex],
                text: "",
              },
            ],
            updatedAt: Date.now(),
          };
        });

        return {
          chats: sortChats(chats),
          loading: canRegenerate,
          streaming: false,
        };
      });

      if (!canRegenerate) return;

      persistChats(get().chats, get().activeChatId);

      try {
        let pendingChunk = "";
        let flushTimer: ReturnType<typeof setTimeout> | null = null;

        const flushPendingChunk = () => {
          if (!pendingChunk) return;
          const chunk = pendingChunk;
          pendingChunk = "";
          appendAssistantChunk(activeChatId, assistantMessageId, chunk);
        };

        const scheduleFlush = () => {
          if (flushTimer) return;
          flushTimer = setTimeout(() => {
            flushTimer = null;
            flushPendingChunk();
          }, streamFlushIntervalMs);
        };

        await generateStream(historyForModel, selectedModelId, (token) => {
          pendingChunk += token;
          scheduleFlush();
        });

        if (flushTimer) clearTimeout(flushTimer);
        flushPendingChunk();
        set({ streaming: false, loading: false, webSearchStatus: "idle" });
        persistChats(get().chats, get().activeChatId);
      } catch {
        set((state) => {
          const chats = state.chats.map((chat) => {
            if (chat.id !== activeChatId) return chat;

            return {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, text: "Error generating response." }
                  : message,
              ),
              updatedAt: Date.now(),
            };
          });

          return {
            chats: sortChats(chats),
            loading: false,
            streaming: false,
            webSearchStatus: "idle",
          };
        });

        persistChats(get().chats, get().activeChatId);
      }
    },

    editUserMessage: async (userMessageId, text) => {
      const { selectedModelId } = useModelStore.getState();
      if (!selectedModelId) return;

      const content = text.trim();
      if (!content) return;

      const activeChatId = get().activeChatId;
      let canEdit = false;
      let targetAssistantId = "";
      let historyForModel: { role: "user" | "assistant"; text: string }[] = [];

      set((state) => {
        const chats = state.chats.map((chat) => {
          if (chat.id !== activeChatId) return chat;

          const userIndex = chat.messages.findIndex(
            (message) =>
              message.id === userMessageId && message.role === "user",
          );
          if (userIndex < 0) return chat;

          const existingAssistant = chat.messages[userIndex + 1];
          targetAssistantId =
            existingAssistant?.role === "assistant"
              ? existingAssistant.id
              : `${userMessageId}_bot`;

          const editedUserMessage: Message = {
            id: userMessageId,
            role: "user",
            text: content,
            attachments: chat.messages[userIndex].attachments,
          };

          const nextMessages: Message[] = [
            ...chat.messages.slice(0, userIndex),
            editedUserMessage,
            {
              id: targetAssistantId,
              role: "assistant",
              text: "",
            },
          ];

          historyForModel = nextMessages
            .filter((message) => message.text !== "")
            .map((message) => ({ role: message.role, text: message.text }))
            .slice(-12);

          canEdit = true;

          return {
            ...chat,
            title: userIndex === 0 ? deriveTitle(content) : chat.title,
            messages: nextMessages,
            updatedAt: Date.now(),
          };
        });

        return {
          chats: sortChats(chats),
          loading: canEdit,
          streaming: false,
        };
      });

      if (!canEdit || !targetAssistantId) return;

      persistChats(get().chats, get().activeChatId);

      try {
        let pendingChunk = "";
        let flushTimer: ReturnType<typeof setTimeout> | null = null;

        const flushPendingChunk = () => {
          if (!pendingChunk) return;
          const chunk = pendingChunk;
          pendingChunk = "";
          appendAssistantChunk(activeChatId, targetAssistantId, chunk);
        };

        const scheduleFlush = () => {
          if (flushTimer) return;
          flushTimer = setTimeout(() => {
            flushTimer = null;
            flushPendingChunk();
          }, streamFlushIntervalMs);
        };

        await generateStream(historyForModel, selectedModelId, (token) => {
          pendingChunk += token;
          scheduleFlush();
        });

        if (flushTimer) clearTimeout(flushTimer);
        flushPendingChunk();
        set({ streaming: false, loading: false, webSearchStatus: "idle" });
        persistChats(get().chats, get().activeChatId);
      } catch {
        set((state) => {
          const chats = state.chats.map((chat) => {
            if (chat.id !== activeChatId) return chat;

            return {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === targetAssistantId
                  ? { ...message, text: "Error generating response." }
                  : message,
              ),
              updatedAt: Date.now(),
            };
          });

          return {
            chats: sortChats(chats),
            loading: false,
            streaming: false,
            webSearchStatus: "idle",
          };
        });

        persistChats(get().chats, get().activeChatId);
      }
    },

    stopStreaming: () => {
      stopGeneration();
      set({ streaming: false, loading: false, webSearchStatus: "idle" });
      persistChats(get().chats, get().activeChatId);
    },
  };
});

export type { ChatSession, Message, MessageAttachment, MessageSource };
