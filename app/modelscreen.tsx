import { AppColorsType } from "@/constants/theme";
import ModelCard from "@/src/components/ModelCard";
import ScreenContainer from "@/src/components/ScreenContainer";
import LoadingOverlay from "@/src/components/ui/LoadingOverlay";
import { MODELS } from "@/src/data/models";
import { useAppColors } from "@/src/hooks/useAppColors";
import { useModelStore } from "@/src/store/modelStore";
import * as FileSystem from "expo-file-system/legacy";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

const bytesToGB = (bytes: number): string => {
  return (bytes / (1024 * 1024 * 1024)).toFixed(1);
};

export default function ModelScreen() {
  const appColors = useAppColors();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const { init, selectedModelId, downloads, isModelLoading } = useModelStore();

  const [totalStorage, setTotalStorage] = useState<number>(0);
  const [freeStorage, setFreeStorage] = useState<number>(0);

  useEffect(() => {
    init();
  }, [init]);

  const loadStorageInfo = async () => {
    try {
      const total = await FileSystem.getTotalDiskCapacityAsync();
      const free = await FileSystem.getFreeDiskStorageAsync();

      setTotalStorage(total);
      setFreeStorage(free);
    } catch (e) {
      console.log("Error loading storage info", e);
    }
  };
  useEffect(() => {
    loadStorageInfo();
  }, [downloads]); // 👈 KEY CHANGE

  const usedStorage = totalStorage - freeStorage;
  const usedPercent =
    totalStorage > 0
      ? Math.min(Math.round((usedStorage / totalStorage) * 100), 100)
      : 0;
  const downloadedCount = Object.values(downloads).filter(
    (entry) => entry.status === "completed",
  ).length;

  return (
    <ScreenContainer showBack title="Choose Model">
      <FlatList
        data={MODELS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ModelCard model={item} loadStorage={loadStorageInfo} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={styles.title}>Model Library</Text>
            <Text style={styles.subtitle}>
              Pick the model you want to run locally. Smaller models are faster,
              larger ones are usually smarter.
            </Text>

            <View style={[styles.statCard, styles.storageCard]}>
              <View style={styles.storageTitleRow}>
                <Text style={styles.storageTitle}>Storage</Text>
                <View style={styles.storagePercentBadge}>
                  <Text style={styles.storagePercentText}>{usedPercent}%</Text>
                </View>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[styles.progressBarFill, { width: `${usedPercent}%` }]}
                />
              </View>
              <View style={styles.storageDetails}>
                <View style={styles.storageDetailItem}>
                  <View
                    style={[
                      styles.storageDot,
                      { backgroundColor: appColors.bg.bubbleAssistant },
                    ]}
                  />
                  <Text style={styles.storageDetailUsed}>
                    {bytesToGB(usedStorage)} GB used
                  </Text>
                </View>
                <View style={styles.storageDetailItem}>
                  <View
                    style={[
                      styles.storageDot,
                      { backgroundColor: appColors.border.default },
                    ]}
                  />
                  <Text style={styles.storageDetailFree}>
                    {bytesToGB(freeStorage)} GB free
                  </Text>
                </View>
              </View>
            </View>

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
      backgroundColor: appColors.bg.surface,
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
    progressBarTrack: {
      marginTop: 8,
      height: 6,
      backgroundColor: appColors.bg.surface,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: appColors.bg.bubbleAssistant,
      borderRadius: 3,
    },
    storageCard: {
      flex: 100,
      marginTop: 12,
      padding: 12,
    },
    storageTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    storageTitle: {
      color: appColors.text.primary,
      fontSize: 13,
      fontWeight: "600",
    },
    storagePercentBadge: {
      backgroundColor: appColors.bg.bubbleAssistant,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    storagePercentText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },
    storageDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    storageDetailItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    storageDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    storageDetailUsed: {
      color: appColors.text.secondary,
      fontSize: 12,
      fontWeight: "500",
    },
    storageDetailFree: {
      color: appColors.text.muted,
      fontSize: 12,
    },
  });
