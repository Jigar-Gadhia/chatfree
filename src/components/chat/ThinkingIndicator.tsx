import AppText from "@/src/components/ui/AppText";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { View } from "react-native";

interface ThinkingIndicatorProps {
  loading: boolean;
  isModelLoading: boolean;
  streaming: boolean;
  webSearchStatus?: string;
  appColors: any;
  styles: any;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  loading,
  isModelLoading,
  streaming,
  webSearchStatus,
  appColors,
  styles,
}) => {
  if (!(loading || isModelLoading) || streaming) {
    return null;
  }

  return (
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
  );
};
