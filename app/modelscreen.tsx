import { AppColorsType } from "@/constants/theme";
import ModelCard from "@/src/components/ModelCard";
import ScreenContainer from "@/src/components/ScreenContainer";
import LoadingOverlay from "@/src/components/ui/LoadingOverlay";
import { MODELS } from "@/src/data/models";
import { useAppColors } from "@/src/hooks/useAppColors";
import { useModelStore } from "@/src/store/modelStore";
import React, { useEffect, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function ModelScreen() {
  const appColors = useAppColors();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const { init, selectedModelId, downloads, isModelLoading } = useModelStore();

  useEffect(() => {
    init();
  }, [init]);

  const downloadedCount = Object.values(downloads).filter(
    (entry) => entry.status === "completed",
  ).length;

  return (
    <ScreenContainer showBack title="Choose Model">
      <FlatList
        data={MODELS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ModelCard model={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={styles.title}>Model Library</Text>
            <Text style={styles.subtitle}>
              Pick the model you want to run locally. Smaller models are faster,
              larger ones are usually smarter.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Available</Text>
                <Text style={styles.statValue}>{MODELS.length}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Downloaded</Text>
                <Text style={styles.statValue}>{downloadedCount}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Active</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {selectedModelId ? "1" : "0"}
                </Text>
              </View>
            </View>
          </View>
        }
      />

      <LoadingOverlay visible={isModelLoading} label="Loading model..." />
    </ScreenContainer>
  );
}

const createStyles = (appColors: AppColorsType) =>
  StyleSheet.create({
    listContent: {
      paddingBottom: 24,
    },
    headerWrap: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    title: {
      color: appColors.text.primary,
      fontSize: 26,
      fontWeight: "800",
      marginBottom: 8,
    },
    subtitle: {
      color: appColors.text.muted,
      fontSize: 14,
      lineHeight: 20,
    },
    statsRow: {
      marginTop: 14,
      flexDirection: "row",
      gap: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: appColors.bg.surfaceAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: appColors.border.default,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    statLabel: {
      color: appColors.text.muted,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    statValue: {
      color: appColors.text.secondary,
      fontSize: 20,
      fontWeight: "700",
    },
  });
