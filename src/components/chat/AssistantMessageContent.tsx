import { AppColorsType } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { createMarkdownStyles } from "./ChatMessageRow";

type AssistantMessageContentProps = {
  styles: any;
  appColors: AppColorsType;
  text: string;
  isStreaming?: boolean;
};

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

export default memo(AssistantMessageContent);
