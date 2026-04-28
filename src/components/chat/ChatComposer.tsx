import AnimatedKeyboardView from "@/src/components/AnimatedKeyboardView";
import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import AppTextInput from "@/src/components/ui/AppTextInput";
import { PdfAttachment } from "@/src/hooks/usePdfAttachments";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, TextInput, View } from "react-native";

interface ChatComposerProps {
  input: string;
  setInput: (text: string) => void;
  inputRef: React.RefObject<TextInput | null>;
  isRecording: boolean;
  handleToggleMic: () => void;
  pdfAttachments: PdfAttachment[];
  handlePickPdf: () => void;
  handleRemovePdf: (id: string) => void;
  useWebSearch: boolean;
  setUseWebSearch: React.Dispatch<React.SetStateAction<boolean>>;
  handleSend: () => void;
  stopStreaming: () => void;
  canSend: boolean;
  streaming: boolean;
  loading: boolean;
  isModelLoading: boolean;
  selectedModelId: string | null;
  editingUserMessageId: string | null;
  appColors: any;
  styles: any;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  input,
  setInput,
  inputRef,
  isRecording,
  handleToggleMic,
  pdfAttachments,
  handlePickPdf,
  handleRemovePdf,
  useWebSearch,
  setUseWebSearch,
  handleSend,
  stopStreaming,
  canSend,
  streaming,
  loading,
  isModelLoading,
  selectedModelId,
  editingUserMessageId,
  appColors,
  styles,
}) => {
  const router = useRouter();

  return (
    <AnimatedKeyboardView>
      <View style={styles.composerWrap}>
        {selectedModelId ? (
          <View style={styles.composerInner}>
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
                      <AppText
                        variant="caption"
                        style={styles.pdfAttachmentStatus}
                      >
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
                        animated={false}
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

            <View style={styles.composerTopRow}>
              <View style={styles.composerInputWrap}>
                <AppTextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder={
                    isRecording
                      ? "Listening..."
                      : editingUserMessageId
                        ? "Edit your message"
                        : "Message Chat"
                  }
                  placeholderTextColor={appColors.text.weak}
                  multiline
                  maxLength={6000}
                  textAlignVertical="top"
                  inputStyle={styles.input}
                  editable={
                    !isModelLoading && !loading && !streaming && !isRecording
                  }
                />
              </View>

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
                animated
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

            <View style={styles.composerActionRow}>
              <AppButton
                onPress={handlePickPdf}
                style={styles.attachButton}
                activeOpacity={0.85}
                disabled={isModelLoading || loading || streaming}
                accessibilityRole="button"
                accessibilityLabel="Attach PDF document"
                animated
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
                disabled={isModelLoading || loading || streaming}
                accessibilityRole="button"
                accessibilityLabel={
                  useWebSearch
                    ? "Disable web search for next message"
                    : "Enable web search for next message"
                }
                animated
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
                onPress={handleToggleMic}
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonActive,
                ]}
                activeOpacity={0.85}
                disabled={isModelLoading || loading || streaming}
                accessibilityRole="button"
                accessibilityLabel={
                  isRecording ? "Stop voice input" : "Start voice input"
                }
                animated
              >
                <Ionicons
                  name={isRecording ? "stop" : "mic-outline"}
                  size={16}
                  color={
                    isRecording
                      ? appColors.icon.inverse
                      : appColors.icon.secondary
                  }
                />
              </AppButton>
            </View>
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
  );
};
