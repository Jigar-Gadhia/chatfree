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
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";

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

const getSourceFaviconUrl = (rawUrl: string) => {
  try {
    const hostname = new URL(rawUrl).hostname;
    if (!hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return null;
  }
};

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

    return (
      <View style={styles.assistantRow}>
        {/* <AssistantAvatar streaming={isLastAssistant} styles={styles} /> */}
        <View style={styles.assistantBody}>
          <MessageContent
            styles={styles}
            appColors={appColors}
            text={item.text}
            textStyle={styles.assistantText}
            showStreamingCursor={isLastAssistant}
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
