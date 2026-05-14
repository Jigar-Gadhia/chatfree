import { AppColorsType } from "@/constants/theme";
import {
  Message,
  MessageAttachment,
  MessageSource,
} from "@/src/store/chatStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessagePart =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language: string };

type MessageContentProps = {
  styles: any;
  appColors: AppColorsType;
  text: string;
  textStyle: StyleProp<TextStyle>;
  showStreamingCursor?: boolean;
};

type AssistantMessageContentProps = {
  styles: any;
  appColors: AppColorsType;
  text: string;
  isStreaming?: boolean;
};

type ChatMessageRowProps = {
  styles: any;
  appColors: AppColorsType;
  item: Message;
  index: number;
  messageCount: number;
  nextMessage?: Message;
  loading: boolean;
  streaming: boolean;
  latestAssistantMessageId: string | null;
  selectedModelId: string | null;
  isModelLoading: boolean;
  onCopy: (text: string) => void;
  onShare: (text: string) => void;
  onRegenerate: (messageId: string) => void;
  onEdit: (messageId: string, text: string) => void;
  onSpeak: (messageId: string, text: string) => void;
  speakingMessageId: string | null;
  onOpenSources: (sources: MessageSource[]) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSourceFaviconUrl = (rawUrl: string): string | null => {
  try {
    const hostname = new URL(rawUrl).hostname;
    if (!hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return null;
  }
};

const parseMessageParts = (message: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  let cursor = 0;

  while (cursor < message.length) {
    const openFence = message.indexOf("```", cursor);

    if (openFence === -1) {
      parts.push({ type: "text", content: message.slice(cursor) });
      break;
    }

    if (openFence > cursor) {
      parts.push({ type: "text", content: message.slice(cursor, openFence) });
    }

    const metaStart = openFence + 3;
    const newlineIndex = message.indexOf("\n", metaStart);

    if (newlineIndex === -1) {
      parts.push({
        type: "code",
        language: message.slice(metaStart).trim(),
        content: "",
      });
      cursor = message.length;
      break;
    }

    const language = message.slice(metaStart, newlineIndex).trim();
    const codeStart = newlineIndex + 1;
    const closeFence = message.indexOf("```", codeStart);

    if (closeFence === -1) {
      parts.push({
        type: "code",
        language,
        content: message.slice(codeStart),
      });
      cursor = message.length;
      break;
    }

    parts.push({
      type: "code",
      language,
      content: message.slice(codeStart, closeFence),
    });
    cursor = closeFence + 3;
  }

  if (parts.length === 0) return [{ type: "text", content: message }];
  return parts;
};

// ─── Source favicon ───────────────────────────────────────────────────────────

const SourceActionFavicon = ({
  sourceUrl,
  styles,
  appColors,
}: {
  sourceUrl: string;
  styles: any;
  appColors: AppColorsType;
}) => {
  const faviconUrl = getSourceFaviconUrl(sourceUrl);

  if (!faviconUrl) {
    return (
      <Ionicons name="globe-outline" size={12} color={appColors.icon.muted} />
    );
  }

  return (
    <Image
      source={{ uri: faviconUrl }}
      style={styles.messageSourceFavicon}
      contentFit="cover"
    />
  );
};

// ─── Source stack ─────────────────────────────────────────────────────────────

const SourceActionStack = ({
  sources,
  styles,
  appColors,
}: {
  sources: MessageSource[];
  styles: any;
  appColors: AppColorsType;
}) => {
  const previewSources = sources.slice(0, 3);

  return (
    <View style={styles.messageSourceStack}>
      {previewSources.map((source, index) => (
        <View
          key={`${source.url}-${index}`}
          style={[
            styles.messageSourceStackItem,
            {
              marginLeft: index === 0 ? 0 : -6,
              zIndex: previewSources.length - index,
            },
          ]}
        >
          <SourceActionFavicon
            sourceUrl={source.url}
            styles={styles}
            appColors={appColors}
          />
        </View>
      ))}
    </View>
  );
};

// ─── User message content (plain text + manual code blocks) ──────────────────

const MessageContent = ({
  styles,
  appColors,
  text,
  textStyle,
  showStreamingCursor = false,
}: MessageContentProps) => {
  const parts = useMemo(() => parseMessageParts(text), [text]);
  const cursorPartIndex = parts.length - 1;

  return (
    <View style={styles.messageContentWrap}>
      {parts.map((part, index) => {
        const shouldShowCursorOnPart =
          showStreamingCursor && index === cursorPartIndex;

        if (part.type === "code") {
          return (
            <View key={`code-${index}`} style={styles.codeBlock}>
              <TouchableOpacity
                onPress={() => Clipboard.setStringAsync(part.content)}
                style={styles.codeCopyButton}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="copy-outline"
                  size={13}
                  color={appColors.icon.muted}
                />
              </TouchableOpacity>
              <Text style={styles.codeBlockLang}>
                {part.language ? part.language.toUpperCase() : "CODE"}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.codeBlockText}>
                  {part.content}
                  {shouldShowCursorOnPart ? (
                    <Text style={styles.cursor}> ▍</Text>
                  ) : null}
                </Text>
              </ScrollView>
            </View>
          );
        }

        return (
          <Text key={`text-${index}`} style={textStyle}>
            {part.content}
            {shouldShowCursorOnPart ? (
              <Text style={styles.cursor}> ▍</Text>
            ) : null}
          </Text>
        );
      })}
      {showStreamingCursor && cursorPartIndex < 0 ? (
        <Text style={styles.cursor}>▍</Text>
      ) : null}
    </View>
  );
};

const createMarkdownStyles = (appColors: any) => {
  return StyleSheet.create({
    // body text
    body: {
      color: appColors.text.primary,
      fontSize: 15,
      lineHeight: 23,
    },

    // headings
    heading1: {
      color: appColors.text.primary,
      fontSize: 22,
      fontWeight: "700",
      marginTop: 14,
      marginBottom: 6,
    },

    heading2: {
      color: appColors.text.primary,
      fontSize: 19,
      fontWeight: "700",
      marginTop: 12,
      marginBottom: 4,
    },

    heading3: {
      color: appColors.text.secondary,
      fontSize: 16,
      fontWeight: "600",
      marginTop: 10,
      marginBottom: 4,
    },

    heading4: {
      color: appColors.text.secondary,
      fontSize: 15,
      fontWeight: "600",
      marginTop: 8,
      marginBottom: 2,
    },

    heading5: {
      color: appColors.text.muted,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 6,
      marginBottom: 2,
    },

    heading6: {
      color: appColors.text.muted,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 4,
      marginBottom: 2,
    },

    // inline text
    strong: {
      fontWeight: "700",
      color: appColors.text.primary,
    },

    em: {
      fontStyle: "italic",
      color: appColors.text.secondary,
    },

    s: {
      textDecorationLine: "line-through",
      color: appColors.text.muted,
    },

    // links
    link: {
      color: appColors.bg.success,
      textDecorationLine: "underline",
    },

    // inline code
    code_inline: {
      color: appColors.text.secondary,
      backgroundColor: appColors.bg.chip,
      borderColor: appColors.border.subtle,
      borderWidth: 1,
      borderRadius: 4,
      fontSize: 13,
      fontFamily: "monospace",
      paddingHorizontal: 4,
      paddingVertical: 2,
    },

    // fenced code block
    fence: {
      backgroundColor: appColors.bg.surface,
      borderColor: appColors.border.default,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginVertical: 8,
    },

    code_block: {
      color: appColors.text.secondary,
      fontFamily: "monospace",
      fontSize: 13,
      lineHeight: 20,
      backgroundColor: appColors.bg.surface,
      borderColor: appColors.border.default,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginVertical: 8,
    },

    // blockquote
    blockquote: {
      backgroundColor: appColors.bg.surfaceAlt,
      borderLeftColor: appColors.border.strong,
      borderLeftWidth: 3,
      borderRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginVertical: 6,
    },

    // lists
    bullet_list: {
      marginVertical: 4,
    },

    ordered_list: {
      marginVertical: 4,
    },

    list_item: {
      marginBottom: 2,
      color: appColors.text.primary,
      fontSize: 15,
      lineHeight: 23,
    },

    bullet_list_icon: {
      color: appColors.text.muted,
      marginRight: 8,
      marginTop: 3,
    },

    ordered_list_icon: {
      color: appColors.text.muted,
      marginRight: 8,
      fontSize: 14,
    },

    // horizontal rule
    hr: {
      backgroundColor: appColors.border.subtle,
      height: 1,
      marginVertical: 12,
    },

    // paragraph spacing
    paragraph: {
      color: appColors.text.primary,
      fontSize: 15,
      lineHeight: 23,
      marginBottom: 4,
    },

    // table
    table: {
      borderWidth: 1,
      borderColor: appColors.border.default,
      borderRadius: 12,
      overflow: "hidden",
      marginVertical: 12,
      backgroundColor: appColors.bg.surface,
    },

    table_wrapper: {
      marginVertical: 10,
    },

    thead: {
      backgroundColor: appColors.bg.surfaceAlt,
    },

    tbody: {
      backgroundColor: appColors.bg.surface,
    },

    tr: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: appColors.border.subtle,
    },

    th: {
      flex: 1,
      minWidth: 120,

      paddingVertical: 12,
      paddingHorizontal: 14,

      backgroundColor: appColors.bg.surfaceAlt,

      borderRightWidth: 1,
      borderRightColor: appColors.border.default,

      borderBottomWidth: 1,
      borderBottomColor: appColors.border.default,

      color: appColors.text.primary,
      fontSize: 14,
      fontWeight: "700",

      textAlignVertical: "center",
    },

    td: {
      flex: 1,
      minWidth: 120,

      paddingVertical: 12,
      paddingHorizontal: 14,

      backgroundColor: appColors.bg.surface,

      borderRightWidth: 1,
      borderRightColor: appColors.border.subtle,

      borderBottomWidth: 1,
      borderBottomColor: appColors.border.subtle,

      color: appColors.text.secondary,
      fontSize: 14,
      lineHeight: 20,

      textAlignVertical: "center",
    },

    th_last: {
      borderRightWidth: 0,
    },

    td_last: {
      borderRightWidth: 0,
    },
  });
};

// ─── Assistant message content (StreamdownText) ───────────────────────────────

const AssistantMessageContent = ({
  styles,
  appColors,
  text,
}: AssistantMessageContentProps) => {
  const markdown = useMemo(() => {
    let processed = text.replace(/\$\$/g, "$");

    // Fix incomplete fenced code blocks while streaming
    const fenceCount = (processed.match(/```/g) || []).length;

    if (fenceCount % 2 !== 0) {
      processed += "\n```";
    }

    return processed;
  }, [text]);

  const markdownStyles = useMemo(
    () => createMarkdownStyles(appColors),

    [appColors],
  );

  return (
    <View style={styles.messageContentWrap}>
      <View style={styles.assistantMarkdownWrap}>
        <Markdown
          style={markdownStyles}
          rules={{
            fence: (node) => {
              const language = (node as any).sourceInfo || "CODE";
              const content = node.content;

              return (
                <View key={`code-${node.index}`} style={styles.codeBlock}>
                  <TouchableOpacity
                    onPress={() => Clipboard.setStringAsync(content)}
                    style={styles.codeCopyButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={13}
                      color={appColors.icon.muted}
                    />
                  </TouchableOpacity>

                  <Text style={styles.codeBlockLang}>
                    {language.toUpperCase()}
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={styles.codeBlockText}>{content}</Text>
                  </ScrollView>
                </View>
              );
            },
          }}
        >
          {markdown}
        </Markdown>
      </View>
    </View>
  );
};

// ─── ChatMessageRow ───────────────────────────────────────────────────────────

export const ChatMessageRow = React.memo(
  ({
    styles,
    appColors,
    item,
    index,
    messageCount,
    nextMessage,
    loading,
    streaming,
    latestAssistantMessageId,
    selectedModelId,
    isModelLoading,
    onCopy,
    onShare,
    onRegenerate,
    onEdit,
    onSpeak,
    speakingMessageId,
    onOpenSources,
  }: ChatMessageRowProps) => {
    const isUser = item.role === "user";
    const isLastAssistant = !isUser && index === messageCount - 1 && streaming;

    const isCurrentAssistantPending =
      item.id === latestAssistantMessageId &&
      (streaming || loading || item.text.trim().length === 0);

    const shouldShowAssistantActions =
      !isCurrentAssistantPending && item.text.trim().length > 0;

    const isUserTurnPending =
      !!nextMessage &&
      nextMessage.role === "assistant" &&
      nextMessage.id === latestAssistantMessageId &&
      (streaming || loading || nextMessage.text.trim().length === 0);

    const shouldShowUserActions = !isUserTurnPending;

    // ── User bubble ──────────────────────────────────────────────────────────
    if (isUser) {
      const attachments: MessageAttachment[] = item.attachments ?? [];

      return (
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            {attachments.length > 0 ? (
              <View style={styles.userAttachmentRow}>
                {attachments.map((attachment, attachmentIndex) => (
                  <View
                    key={`${item.id}-attachment-${attachmentIndex}`}
                    style={styles.userAttachmentChip}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={12}
                      color={appColors.icon.secondary}
                    />
                    <Text style={styles.userAttachmentText} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* User messages stay as plain text – no markdown needed */}
            <MessageContent
              styles={styles}
              appColors={appColors}
              text={item.text}
              textStyle={styles.userText}
            />
          </View>

          {shouldShowUserActions ? (
            <View style={styles.userActionsRow}>
              <TouchableOpacity
                style={styles.messageAction}
                onPress={() => onEdit(item.id, item.text)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="create-outline"
                  size={13}
                  color={appColors.icon.muted}
                />
                <Text style={styles.messageActionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageAction}
                onPress={() => onCopy(item.text)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="copy-outline"
                  size={13}
                  color={appColors.icon.muted}
                />
                <Text style={styles.messageActionText}>Copy</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      );
    }

    // ── Assistant bubble ─────────────────────────────────────────────────────
    return (
      <View style={styles.assistantRow}>
        <View style={styles.assistantBody}>
          {/*
           * StreamdownText handles all markdown rendering including fenced
           * code blocks, inline code, headings, lists and LaTeX.
           * isStreaming shows the "● Streaming…" indicator while tokens
           * are still arriving.
           */}
          <AssistantMessageContent
            styles={styles}
            appColors={appColors}
            text={item.text}
            key={item.id}
          />

          {shouldShowAssistantActions ? (
            <View style={styles.assistantActionsRow}>
              <TouchableOpacity
                style={styles.messageAction}
                onPress={() => onCopy(item.text)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="copy-outline"
                  size={13}
                  color={appColors.icon.muted}
                />
                <Text style={styles.messageActionText}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageAction}
                onPress={() => onShare(item.text)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="share-social-outline"
                  size={13}
                  color={appColors.icon.muted}
                />
                <Text style={styles.messageActionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageAction}
                onPress={() => onSpeak(item.id, item.text)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    speakingMessageId === item.id
                      ? "stop-circle-outline"
                      : "volume-high-outline"
                  }
                  size={13}
                  color={appColors.icon.muted}
                />
                <Text style={styles.messageActionText}>
                  {speakingMessageId === item.id ? "Stop" : "Speak"}
                </Text>
              </TouchableOpacity>

              {item.id === latestAssistantMessageId ? (
                <TouchableOpacity
                  style={[
                    styles.messageAction,
                    (!selectedModelId || streaming || isModelLoading) &&
                      styles.messageActionDisabled,
                  ]}
                  onPress={() => onRegenerate(item.id)}
                  disabled={!selectedModelId || streaming || isModelLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={13}
                    color={appColors.icon.muted}
                  />
                  <Text style={styles.messageActionText}>Regenerate</Text>
                </TouchableOpacity>
              ) : null}

              {Array.isArray(item.sources) && item.sources.length > 0 ? (
                <TouchableOpacity
                  style={styles.messageAction}
                  onPress={() => onOpenSources(item.sources ?? [])}
                  activeOpacity={0.8}
                >
                  <SourceActionStack
                    sources={item.sources}
                    styles={styles}
                    appColors={appColors}
                  />
                  <Text style={styles.messageActionText}>
                    ({item.sources.length})
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.styles === next.styles &&
    prev.appColors === next.appColors &&
    prev.item === next.item &&
    prev.index === next.index &&
    prev.messageCount === next.messageCount &&
    prev.nextMessage === next.nextMessage &&
    prev.loading === next.loading &&
    prev.streaming === next.streaming &&
    prev.latestAssistantMessageId === next.latestAssistantMessageId &&
    prev.selectedModelId === next.selectedModelId &&
    prev.isModelLoading === next.isModelLoading &&
    prev.speakingMessageId === next.speakingMessageId,
);

ChatMessageRow.displayName = "ChatMessageRow";
