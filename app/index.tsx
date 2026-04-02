import AnimatedKeyboardView from "@/src/components/AnimatedKeyboardView";
import { ChatDrawer } from "@/src/components/chat/ChatDrawer";
import { ChatMessageRow } from "@/src/components/chat/ChatMessageRow";
import ScreenContainer from "@/src/components/ScreenContainer";
import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import AppTextInput from "@/src/components/ui/AppTextInput";
import { extractPdfContextFromUri } from "@/src/ai/pdf";
import { useAppColors } from "@/src/hooks/useAppColors";
import {
  Message,
  MessageAttachment,
  MessageSource,
  useChatStore,
} from "@/src/store/chatStore";
import { useModelStore } from "@/src/store/modelStore";
import { createIndexStyles } from "@/src/styles/index.styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import * as Speech from "expo-speech";
import * as WebBrowser from "expo-web-browser";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Keyboard,
  ListRenderItemInfo,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";

const getSourceFaviconUrl = (rawUrl: string) => {
  try {
    const hostname = new URL(rawUrl).hostname;
    if (!hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return null;
  }
};

const SourceFavicon = ({
  sourceUrl,
  styles,
  appColors,
}: {
  sourceUrl: string;
  styles: any;
  appColors: any;
}) => {
  const [failed, setFailed] = useState(false);
  const faviconUrl = getSourceFaviconUrl(sourceUrl);

  if (!faviconUrl || failed) {
    return (
      <Ionicons
        name="globe-outline"
        size={14}
        color={appColors.icon.secondary}
      />
    );
  }

  return (
    <Image
      source={{ uri: faviconUrl }}
      style={styles.sourceItemFavicon}
      contentFit="cover"
      onError={() => setFailed(true)}
    />
  );
};

type PdfAttachment = {
  id: string;
  name: string;
  uri: string;
  status: "processing" | "ready" | "failed";
  error?: string;
  chunks: string[];
};

export default function ChatScreen() {
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
  const [pdfAttachments, setPdfAttachments] = useState<PdfAttachment[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const appColors = useAppColors();
  const styles = useMemo(() => createIndexStyles(appColors), [appColors]);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const hasAutoFocusedRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const followStreamingRef = useRef(true);
  const lastAutoScrollAtRef = useRef(0);

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
    input.trim().length > 0 && !!selectedModelId && !isModelLoading;
  const listBottomPadding = 18 + 78 + keyboardHeight;

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  };

  useEffect(() => {
    if (messages.length) {
      scrollToBottom(!streaming);
    }
  }, [activeChatId, messages.length, streaming]);

  useEffect(() => {
    if (streaming) {
      followStreamingRef.current = true;
      shouldAutoScrollRef.current = true;
    }
  }, [streaming, activeChatId]);

  useEffect(() => {
    if (!streaming || !followStreamingRef.current) return;
    scrollToBottom(false);
  }, [latestAssistantText, streaming]);

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

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleSend = async () => {
    if (!selectedModelId) {
      router.push("/modelscreen");
      return;
    }

    const text = input.trim();
    if (!text || isModelLoading || streaming) return;

    setInput("");
    const editingId = editingUserMessageId;
    setEditingUserMessageId(null);
    Keyboard.dismiss();
    if (editingId) {
      await editUserMessage(editingId, text);
      return;
    }

    const readyAttachments = pdfAttachments.filter(
      (attachment) => attachment.status === "ready" && attachment.chunks.length > 0,
    );
    const userAttachments: MessageAttachment[] = readyAttachments.map(
      (attachment) => ({
        name: attachment.name,
      }),
    );
    const documentContext = readyAttachments
      .flatMap((attachment) =>
        attachment.chunks.slice(0, 2).map(
          (chunk, index) => `[${attachment.name} chunk ${index + 1}] ${chunk}`,
        ),
      )
      .slice(0, 8)
      .join("\n\n");

    setPdfAttachments([]);
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
      if (streaming || isModelLoading || !selectedModelId) return;
      await regenerateAssistant(messageId);
    },
    [isModelLoading, regenerateAssistant, selectedModelId, streaming],
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

  const handleOpenSourceUrl = useCallback(async (url: string) => {
    if (!url.trim()) return;
    await WebBrowser.openBrowserAsync(url);
  }, []);

  const handleRemovePdf = useCallback((attachmentId: string) => {
    setPdfAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId),
    );
  }, []);

  const handlePickPdf = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    for (const asset of result.assets) {
      const attachmentId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      setPdfAttachments((current) => [
        ...current,
        {
          id: attachmentId,
          name: asset.name ?? "Document.pdf",
          uri: asset.uri,
          status: "processing",
          chunks: [],
        },
      ]);

      try {
        const extracted = await extractPdfContextFromUri(asset.uri, {
          maxPages: 24,
          maxChunks: 8,
        });

        setPdfAttachments((current) =>
          current.map((attachment) =>
            attachment.id === attachmentId
              ? {
                  ...attachment,
                  status: extracted.chunks.length ? "ready" : "failed",
                  error: extracted.chunks.length ? undefined : "No readable text found",
                  chunks: extracted.chunks,
                }
              : attachment,
          ),
        );
      } catch (error) {
        setPdfAttachments((current) =>
          current.map((attachment) =>
            attachment.id === attachmentId
              ? {
                  ...attachment,
                  status: "failed",
                  error:
                    error instanceof Error ? error.message : "Failed to parse PDF",
                }
              : attachment,
          ),
        );
      }
    }
  }, []);

  const renderMessageItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Message>) => (
      <ChatMessageRow
        styles={styles}
        appColors={appColors}
        item={item}
        index={index}
        messages={messages}
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
        onScroll={(event) => {
          const { y } = event.nativeEvent.contentOffset;
          const viewportHeight = event.nativeEvent.layoutMeasurement.height;
          const contentHeight = event.nativeEvent.contentSize.height;
          const distanceFromBottom = contentHeight - (y + viewportHeight);

          const isNearBottom = distanceFromBottom < 140;
          shouldAutoScrollRef.current = isNearBottom;
          if (!isNearBottom && streaming) {
            followStreamingRef.current = false;
          }
          if (isNearBottom && !streaming) {
            followStreamingRef.current = true;
          }
        }}
        onScrollBeginDrag={() => {
          if (streaming) {
            followStreamingRef.current = false;
          }
        }}
        onMomentumScrollEnd={() => {
          if (shouldAutoScrollRef.current) {
            followStreamingRef.current = true;
          }
        }}
        onScrollEndDrag={() => {
          if (shouldAutoScrollRef.current) {
            followStreamingRef.current = true;
          }
        }}
        scrollEventThrottle={16}
        onContentSizeChange={() => {
          if (!shouldAutoScrollRef.current && !followStreamingRef.current)
            return;

          const now = Date.now();
          if (streaming && now - lastAutoScrollAtRef.current < 45) return;
          lastAutoScrollAtRef.current = now;

          scrollToBottom(!streaming);
        }}
        onLayout={() => {
          if (messages.length) {
            scrollToBottom(false);
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.logoBubble}>
              <Ionicons
                name="sparkles"
                size={26}
                color={appColors.text.secondary}
              />
            </View>
            <AppText variant="title" style={styles.emptyTitle}>
              How can I help today?
            </AppText>
            <AppText variant="body" style={styles.emptySubtext}>
              {selectedModelId
                ? "Ask anything to start the conversation."
                : "Choose a model first, then ask your question."}
            </AppText>
          </View>
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

      {(loading || isModelLoading) && !streaming ? (
        <View style={styles.thinkingBar}>
          <Ionicons
            name="ellipsis-horizontal"
            size={16}
            color={appColors.icon.muted}
          />
          <AppText variant="caption" style={styles.thinkingText}>
            {isModelLoading
              ? "Loading model..."
              : webSearchStatus === "rewriting"
                ? "Rewriting query..."
                : webSearchStatus === "searching"
                ? "Searching web..."
                : webSearchStatus === "reranking"
                  ? "Reranking results..."
                : webSearchStatus === "processing"
                  ? "Summarizing web results..."
                  : "Thinking..."}
          </AppText>
        </View>
      ) : null}

      <AnimatedKeyboardView>
        <View style={styles.composerWrap}>
          {selectedModelId ? (
            <View style={styles.composerInner}>
              <View style={styles.composerInputWrap}>
                {pdfAttachments.length > 0 ? (
                  <View style={styles.pdfAttachmentRow}>
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={pdfAttachments}
                      keyExtractor={(item) => item.id}
                      style={styles.pdfAttachmentList}
                      contentContainerStyle={styles.pdfAttachmentListContent}
                      renderItem={({ item }) => (
                        <View style={styles.pdfAttachmentChip}>
                          <Ionicons
                            name="document-text-outline"
                            size={13}
                            color={appColors.icon.secondary}
                          />
                          <AppText
                            variant="caption"
                            style={styles.pdfAttachmentName}
                            numberOfLines={1}
                          >
                            {item.name}
                          </AppText>
                          <AppText variant="caption" style={styles.pdfAttachmentStatus}>
                            {item.status === "processing"
                              ? "Indexing"
                              : item.status === "ready"
                                ? "Ready"
                                : "Failed"}
                          </AppText>
                          <AppButton
                            style={styles.pdfAttachmentRemove}
                            onPress={() => handleRemovePdf(item.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="close"
                              size={12}
                              color={appColors.icon.muted}
                            />
                          </AppButton>
                        </View>
                      )}
                    />
                  </View>
                ) : null}

                <AppTextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder={
                    editingUserMessageId ? "Edit your message" : "Message Chat"
                  }
                  placeholderTextColor={appColors.text.weak}
                  multiline
                  maxLength={6000}
                  textAlignVertical="top"
                  inputStyle={styles.input}
                  editable={!isModelLoading && !streaming}
                />
              </View>

              <AppButton
                onPress={handlePickPdf}
                style={styles.attachButton}
                activeOpacity={0.85}
                disabled={isModelLoading || streaming}
                accessibilityRole="button"
                accessibilityLabel="Attach PDF document"
              >
                <Ionicons
                  name="attach-outline"
                  size={16}
                  color={appColors.icon.secondary}
                />
              </AppButton>

              <AppButton
                onPress={() => setUseWebSearch((current) => !current)}
                style={[
                  styles.webSearchButton,
                  useWebSearch && styles.webSearchButtonActive,
                ]}
                activeOpacity={0.85}
                disabled={isModelLoading || streaming}
                accessibilityRole="button"
                accessibilityLabel={
                  useWebSearch
                    ? "Disable web search for next message"
                    : "Enable web search for next message"
                }
              >
                <Ionicons
                  name={useWebSearch ? "globe" : "globe-outline"}
                  size={16}
                  color={
                    useWebSearch
                      ? appColors.icon.inverse
                      : appColors.icon.secondary
                  }
                />
              </AppButton>

              <AppButton
                onPress={streaming ? stopStreaming : handleSend}
                disabled={streaming ? false : !canSend}
                style={[
                  styles.sendButton,
                  streaming
                    ? styles.stopButton
                    : canSend
                      ? styles.sendButtonEnabled
                      : styles.sendButtonDisabled,
                ]}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={streaming ? "stop" : "arrow-up"}
                  size={18}
                  color={
                    streaming || canSend
                      ? appColors.icon.inverse
                      : appColors.icon.muted
                  }
                />
              </AppButton>
            </View>
          ) : (
            <AppButton
              onPress={() => router.push("/modelscreen")}
              style={styles.chooseModelButton}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Choose model"
            >
              <View style={styles.chooseModelLeft}>
                <View style={styles.chooseModelIconWrap}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={16}
                    color={appColors.icon.secondary}
                  />
                </View>
                <View style={styles.chooseModelTextWrap}>
                  <AppText variant="body" style={styles.chooseModelTitle}>
                    Choose model
                  </AppText>
                  <AppText variant="caption" style={styles.chooseModelSubtitle}>
                    Select a model to start chatting
                  </AppText>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={appColors.icon.muted}
              />
            </AppButton>
          )}
        </View>
      </AnimatedKeyboardView>

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

      <Modal
        visible={sourceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseSourcesModal}
      >
        <Pressable
          style={styles.sourceModalBackdrop}
          onPress={handleCloseSourcesModal}
        />
        <View style={styles.sourceModalWrap}>
          <View style={styles.sourceModalCard}>
            <View style={styles.sourceModalHeader}>
              <AppText variant="body" style={styles.sourceModalTitle}>
                Sources
              </AppText>
              <AppButton
                style={styles.sourceModalCloseButton}
                onPress={handleCloseSourcesModal}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={appColors.icon.secondary}
                />
              </AppButton>
            </View>

            <FlatList
              data={activeSources}
              keyExtractor={(item, index) => `${item.url}-${index}`}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sourceListContent}
              renderItem={({ item }) => (
                <AppButton
                  style={styles.sourceItemRow}
                  onPress={() => handleOpenSourceUrl(item.url)}
                  activeOpacity={0.82}
                >
                  <View style={styles.sourceItemLeft}>
                    <View style={styles.sourceItemIconWrap}>
                      <SourceFavicon
                        sourceUrl={item.url}
                        styles={styles}
                        appColors={appColors}
                      />
                    </View>
                    <View style={styles.sourceItemTextWrap}>
                      <AppText
                        variant="body"
                        style={styles.sourceItemTitle}
                        numberOfLines={1}
                      >
                        {item.title}
                      </AppText>
                      <AppText
                        variant="caption"
                        style={styles.sourceItemUrl}
                        numberOfLines={1}
                      >
                        {item.url}
                      </AppText>
                    </View>
                  </View>
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={appColors.icon.muted}
                  />
                </AppButton>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
