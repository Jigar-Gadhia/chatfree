import { AppColorsType } from "@/constants/theme";
import ScreenContainer from "@/src/components/ScreenContainer";
import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import { MODELS } from "@/src/data/models";
import { useAppColors } from "@/src/hooks/useAppColors";
import { useModelStore } from "@/src/store/modelStore";
import { ThemePreference, useSettingsStore } from "@/src/store/settingsStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const appColors = useAppColors();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const selectedModelId = useModelStore((state) => state.selectedModelId);
  const { themePreference, setThemePreference } = useSettingsStore();

  const selectedModelName = useMemo(() => {
    if (!selectedModelId) return "No model selected";
    return (
      MODELS.find((model) => model.id === selectedModelId)?.name ??
      "Unknown model"
    );
  }, [selectedModelId]);

  return (
    <ScreenContainer showBack title="Settings">
      <View style={styles.container}>
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Model</AppText>
          <AppText variant="caption" style={styles.sectionHint}>
            Pick which local model should be used for chat responses.
          </AppText>

          <AppButton
            onPress={() => router.push("/modelscreen")}
            style={styles.rowButton}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open model selection screen"
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons
                  name="hardware-chip-outline"
                  size={16}
                  color={appColors.icon.secondary}
                />
              </View>
              <View style={styles.rowTextWrap}>
                <AppText variant="body" style={styles.rowLabel}>
                  Choose model
                </AppText>
                <AppText
                  variant="caption"
                  style={styles.rowValue}
                  numberOfLines={1}
                >
                  {selectedModelName}
                </AppText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={appColors.icon.muted}
            />
          </AppButton>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Theme</AppText>
          <AppText variant="caption" style={styles.sectionHint}>
            Choose how the app should appear.
          </AppText>

          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => {
              const selected = option.id === themePreference;

              return (
                <AppButton
                  key={option.id}
                  onPress={() => setThemePreference(option.id)}
                  style={[
                    styles.themeButton,
                    selected && styles.themeButtonActive,
                  ]}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${option.label} theme`}
                  accessibilityState={{ selected }}
                >
                  <AppText
                    variant="caption"
                    style={[
                      styles.themeButtonText,
                      selected && styles.themeButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </AppText>
                </AppButton>
              );
            })}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (appColors: AppColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 10,
      gap: 14,
    },
    section: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: appColors.border.default,
      backgroundColor: appColors.bg.surface,
      padding: 12,
    },
    sectionTitle: {
      color: appColors.text.primary,
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 4,
    },
    sectionHint: {
      color: appColors.text.muted,
      marginBottom: 10,
    },
    rowButton: {
      minHeight: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: appColors.border.modelButton,
      backgroundColor: appColors.bg.surfaceAlt,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    rowIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: appColors.bg.drawerAction,
    },
    rowTextWrap: {
      flex: 1,
    },
    rowLabel: {
      color: appColors.text.secondary,
      fontWeight: "600",
    },
    rowValue: {
      color: appColors.text.muted,
      marginTop: 2,
    },
    themeRow: {
      flexDirection: "row",
      gap: 8,
    },
    themeButton: {
      flex: 1,
      minHeight: 38,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: appColors.border.modelButton,
      backgroundColor: appColors.bg.input,
      alignItems: "center",
      justifyContent: "center",
    },
    themeButtonActive: {
      borderColor: appColors.border.chatRowActive,
      backgroundColor: appColors.bg.chatActive,
    },
    themeButtonText: {
      color: appColors.text.muted,
      fontWeight: "600",
    },
    themeButtonTextActive: {
      color: appColors.text.primary,
    },
  });
