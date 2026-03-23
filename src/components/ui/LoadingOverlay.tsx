import React from "react";
import { AppColorsType } from "@/constants/theme";
import { useAppColors } from "@/src/hooks/useAppColors";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type LoadingOverlayProps = {
  visible: boolean;
  label?: string;
};

export default function LoadingOverlay({
  visible,
  label = "Loading...",
}: LoadingOverlayProps) {
  const appColors = useAppColors();
  const styles = React.useMemo(() => createStyles(appColors), [appColors]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.card}>
        <ActivityIndicator size="small" color={appColors.text.inverse} />
        <Text style={styles.text}>{label}</Text>
      </View>
    </View>
  );
}

const createStyles = (appColors: AppColorsType) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: appColors.overlay.loading,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: appColors.bg.overlayCard,
      borderWidth: 1,
      borderColor: appColors.border.overlayCard,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    text: {
      color: appColors.text.secondary,
      fontSize: 14,
      fontWeight: "600",
    },
  });
