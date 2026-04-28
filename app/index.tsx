import { ChatDrawer } from "@/src/components/chat/ChatDrawer";
import { ChatMessageRow } from "@/src/components/chat/ChatMessageRow";
import ScreenContainer from "@/src/components/ScreenContainer";
import AppButton from "@/src/components/ui/AppButton";
import { useAppColors } from "@/src/hooks/useAppColors";
import {
  Message,
  MessageAttachment,
  MessageSource,
  useChatStore,
} from "@/src/store/chatStore";
import { useModelStore } from "@/src/store/modelStore";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { createIndexStyles } from "@/src/styles/index.styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import * as Speech from "expo-speech";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  ListRenderItemInfo,
  TextInput,
  View,
} from "react-native";

// New components and hooks
import { ChatComposer } from "@/src/components/chat/ChatComposer";
import { ChatEmptyState } from "@/src/components/chat/ChatEmptyState";
import { SourcesModal } from "@/src/components/chat/SourcesModal";
import { ThinkingIndicator } from "@/src/components/chat/ThinkingIndicator";
import { useChatAutoScroll } from "@/src/hooks/useChatAutoScroll";
import { useKeyboardHeight } from "@/src/hooks/useKeyboardHeight";
import { usePdfAttachments } from "@/src/hooks/usePdfAttachments";
import { useVoiceInput } from "@/src/hooks/useVoiceInput";

export default function ChatScreen() {
  // === ALL HOOKS MUST BE AT THE TOP - NO CONDITIONAL RETURNS BEFORE THIS ===

  // Onboarding state
  const { hasCompletedOnboarding, init: initOnboarding } = useOnboardingStore();
  const [initialized, setInitialized] = useState(false);
  const [input, setInput] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );
  const [editingUserMessageId, setEditingUserMessageId] = useState<
    string | null
  >(null);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [activeSources, setActiveSources] = useState<MessageSource[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const appColors = useAppColors();
  const styles = useMemo(() => createIndexStyles(appColors), [appColors]);
  const inputRef = useRef<TextInput>(null);
  const hasAutoFocusedRef = useRef(false);

  const {
    chats,
    activeChatId,
    sendMessage,
    loading,
    streaming,
    webSearchStatus,
    stopStreaming,
    init,
    createNewChat,
    selectChat,
    deleteChat,
    regenerateAssistant,
    editUserMessage,
  } = useChatStore();
  const { selectedModelId, init: initModels, isModelLoading } = useModelStore();
  const router = useRouter();

  // Initialize onboarding store
  useEffect(() => {
    initOnboarding().then(() => setInitialized(true));
  }, [initOnboarding]);

  useEffect(() => {
    initModels();
    init();
  }, [init, initModels]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId),
    [chats, activeChatId],
  );
  const messages = useMemo(() => activeChat?.messages ?? [], [activeChat]);
  const latestAssistantMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === "assistant") return messages[index].id;
    }
    return null;
  }, [messages]);
  const latestAssistantText = useMemo(() => {
    if (!latestAssistantMessageId) return "";
    return (
      messages.find((message) => message.id === latestAssistantMessageId)
        ?.text ?? ""
    );
  }, [latestAssistantMessageId, messages]);

  const canSend =
    input.trim().length > 0 && !!selectedModelId && !isModelLoading && !loading;

  // Custom Hooks
  const keyboardHeight = useKeyboardHeight();
  const { isRecording, handleToggleMic, stopVoiceInput } = useVoiceInput(
    input,
    setInput,
    isModelLoading || loading || streaming,
  );
  const { pdfAttachments, handlePickPdf, handleRemovePdf, clearAttachments } =
    usePdfAttachments();
  const {
    flatListRef,
    onScroll,
    onScrollBeginDrag,
    onMomentumScrollEnd,
    onScrollEndDrag,
    onContentSizeChange,
    onLayout,
  } = useChatAutoScroll(
    messages.length,
    streaming,
    activeChatId,
    latestAssistantText,
  );

  const listBottomPadding = 18 + 78 + keyboardHeight;

  useEffect(() => {
    if (hasAutoFocusedRef.current) return;
    if (!activeChatId) return;
    if (!selectedModelId) return;
    if (streaming || isModelLoading) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
      hasAutoFocusedRef.current = true;
    }, 120);

    return () => clearTimeout(timer);
  }, [activeChatId, isModelLoading, selectedModelId, streaming]);

  const handleSend = async () => {
    if (!selectedModelId) {
      router.push("/modelscreen");
      return;
    }

    const text = input.trim();
    if (!text || isModelLoading || loading || streaming) return;

    stopVoiceInput();

    setInput("");
    const editingId = editingUserMessageId;
    setEditingUserMessageId(null);
    Keyboard.dismiss();

    if (editingId) {
      await editUserMessage(editingId, text);
      return;
    }

    const readyAttachments = pdfAttachments.filter(
      (attachment) =>
        attachment.status === "ready" && attachment.chunks.length > 0,
    );
    const userAttachments: MessageAttachment[] = readyAttachments.map(
      (attachment) => ({
        name: attachment.name,
      }),
    );
    const documentContext = readyAttachments
      .flatMap((attachment) =>
        attachment.chunks
          .slice(0, 2)
          .map(
            (chunk, index) =>
              `[${attachment.name} chunk ${index + 1}] ${chunk}`,
          ),
      )
      .slice(0, 8)
      .join("\n\n");

    clearAttachments();
    await sendMessage(text, { useWebSearch, documentContext, userAttachments });
    setUseWebSearch(false);
  };

  const handleCreateNewChat = () => {
    createNewChat();
    setInput("");
    setEditingUserMessageId(null);
    closeDrawer();
  };

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    setInput("");
    setEditingUserMessageId(null);
    closeDrawer();
  };

  const handleOpenSettings = () => {
    closeDrawer();
    router.push("/settings");
  };

  const handleCopyMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    await Clipboard.setStringAsync(text);
  }, []);

  const handleShareMessage = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content) return;

    if (!(await Sharing.isAvailableAsync())) {
      await Clipboard.setStringAsync(content);
      return;
    }

    const fileUri = `${FileSystem.cacheDirectory}chat-share-${Date.now()}.txt`;

    try {
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Share message",
        mimeType: "text/plain",
        UTI: "public.plain-text",
      });
    } finally {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  }, []);

  const handleRegenerate = useCallback(
    async (messageId: string) => {
      if (loading || streaming || isModelLoading || !selectedModelId) return;
      await regenerateAssistant(messageId);
    },
    [isModelLoading, loading, regenerateAssistant, selectedModelId, streaming],
  );

  const handleSpeakMessage = useCallback(
    (messageId: string, text: string) => {
      const content = text.trim();
      if (!content) return;

      if (speakingMessageId === messageId) {
        Speech.stop();
        setSpeakingMessageId(null);
        return;
      }

      Speech.stop();
      setSpeakingMessageId(messageId);
      Speech.speak(content, {
        onDone: () => {
          setSpeakingMessageId((current) =>
            current === messageId ? null : current,
          );
        },
        onStopped: () => {
          setSpeakingMessageId((current) =>
            current === messageId ? null : current,
          );
        },
        onError: () => {
          setSpeakingMessageId((current) =>
            current === messageId ? null : current,
          );
        },
      });
    },
    [speakingMessageId],
  );

  const handleEditMessage = useCallback(
    (messageId: string, text: string) => {
      if (streaming || isModelLoading) return;
      setEditingUserMessageId(messageId);
      setInput(text);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    },
    [isModelLoading, streaming],
  );

  const handleOpenSources = useCallback((sources: MessageSource[]) => {
    if (!sources.length) return;
    setActiveSources(sources);
    setSourceModalVisible(true);
  }, []);

  const handleCloseSourcesModal = useCallback(() => {
    setSourceModalVisible(false);
  }, []);

  const renderMessageItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Message>) => (
      <ChatMessageRow
        styles={styles}
        appColors={appColors}
        item={item}
        index={index}
        messageCount={messages.length}
        nextMessage={messages[index + 1]}
        loading={loading}
        streaming={streaming}
        latestAssistantMessageId={latestAssistantMessageId}
        selectedModelId={selectedModelId}
        isModelLoading={isModelLoading}
        onCopy={handleCopyMessage}
        onShare={handleShareMessage}
        onRegenerate={handleRegenerate}
        onEdit={handleEditMessage}
        onSpeak={handleSpeakMessage}
        speakingMessageId={speakingMessageId}
        onOpenSources={handleOpenSources}
      />
    ),
    [
      appColors,
      handleCopyMessage,
      handleEditMessage,
      handleRegenerate,
      handleShareMessage,
      handleSpeakMessage,
      handleOpenSources,
      isModelLoading,
      latestAssistantMessageId,
      loading,
      messages,
      selectedModelId,
      speakingMessageId,
      styles,
      streaming,
    ],
  );

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  // === CONDITIONAL RETURNS MUST BE AFTER ALL HOOKS ===

  // Show loading while initializing
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect to onboarding if not completed
  if (hasCompletedOnboarding === false) {
    return <Redirect href="/onboarding" />;
  }

  // === MAIN RENDER ===

  return (
    <ScreenContainer style={styles.screenContainer}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: listBottomPadding },
        ]}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        ListEmptyComponent={
          <ChatEmptyState
            selectedModelId={selectedModelId}
            appColors={appColors}
            styles={styles}
          />
        }
      />

      <LinearGradient
        pointerEvents="none"
        colors={appColors.gradient.topOverlay}
        locations={[0, 0.22, 0.5, 0.78, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topOverlayGradient}
      />

      <View style={styles.topBar}>
        <AppButton
          onPress={openDrawer}
          style={styles.floatingPill}
          activeOpacity={0.8}
        >
          <Ionicons name="menu" size={25} color={appColors.icon.primary} />
        </AppButton>

        <AppButton
          onPress={handleCreateNewChat}
          style={styles.floatingPill}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={25} color={appColors.icon.primary} />
        </AppButton>
      </View>

      <ThinkingIndicator
        loading={loading}
        isModelLoading={isModelLoading}
        streaming={streaming}
        webSearchStatus={webSearchStatus}
        appColors={appColors}
        styles={styles}
      />

      <ChatComposer
        input={input}
        setInput={setInput}
        inputRef={inputRef}
        isRecording={isRecording}
        handleToggleMic={handleToggleMic}
        pdfAttachments={pdfAttachments}
        handlePickPdf={handlePickPdf}
        handleRemovePdf={handleRemovePdf}
        useWebSearch={useWebSearch}
        setUseWebSearch={setUseWebSearch}
        handleSend={handleSend}
        stopStreaming={stopStreaming}
        canSend={canSend}
        streaming={streaming}
        loading={loading}
        isModelLoading={isModelLoading}
        selectedModelId={selectedModelId}
        editingUserMessageId={editingUserMessageId}
        appColors={appColors}
        styles={styles}
      />

      <ChatDrawer
        visible={drawerVisible}
        chats={chats}
        activeChatId={activeChatId}
        onClose={closeDrawer}
        onOpenSettings={handleOpenSettings}
        onSelectChat={handleSelectChat}
        onDeleteChat={deleteChat}
        appColors={appColors}
      />

      <SourcesModal
        visible={sourceModalVisible}
        sources={activeSources}
        onClose={handleCloseSourcesModal}
        appColors={appColors}
        styles={styles}
      />
    </ScreenContainer>
  );
}
