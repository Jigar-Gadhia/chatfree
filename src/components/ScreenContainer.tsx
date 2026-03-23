import Ionicons from '@expo/vector-icons/Ionicons';
import { AppColorsType } from "@/constants/theme";
import { useAppColors } from "@/src/hooks/useAppColors";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title?: string;
  children: React.ReactNode;
  showBack?: boolean;
  style?: ViewStyle
};

export default function ScreenContainer({
  title,
  children,
  showBack = false,
  style,
}: Props) {
  const router = useRouter();
  const appColors = useAppColors();
  const styles = useMemo(() => createStyles(appColors), [appColors]);

  return (
    <SafeAreaView style={[styles.container, style]} edges={["top", "bottom"]}>
      {(title || showBack) && (
        <View style={styles.headerWrap}>
          <View style={styles.header}>
            {showBack ? (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={20} color={appColors.icon.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.sideSlot} />
            )}

            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>

            <View style={styles.sideSlot} />
          </View>
        </View>
      )}

      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const createStyles = (appColors: AppColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: appColors.bg.container,
    },
    headerWrap: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
    },
    header: {
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      backgroundColor: appColors.bg.surface,
      borderWidth: 1,
      borderBottomColor: appColors.border.default,
      borderColor: appColors.border.default,
      borderRadius: 16,
      shadowColor: appColors.shadow.base,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: appColors.bg.input,
      borderWidth: 1,
      borderColor: appColors.border.subtle,
    },
    sideSlot: {
      width: 36,
      height: 36,
    },
    title: {
      color: appColors.text.secondary,
      fontSize: 17,
      fontWeight: "700",
      flex: 1,
      textAlign: "center",
      paddingHorizontal: 8,
    },
    content: {
      flex: 1,
    },
  });
