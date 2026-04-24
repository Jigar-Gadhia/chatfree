import React from "react";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "@/src/components/ui/AppText";

interface ChatEmptyStateProps {
  selectedModelId: string | null;
  appColors: any;
  styles: any;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  selectedModelId,
  appColors,
  styles,
}) => {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.logoBubble}>
        <Ionicons name="sparkles" size={26} color={appColors.text.secondary} />
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
  );
};
