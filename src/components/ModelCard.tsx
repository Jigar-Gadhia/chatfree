import { AppColorsType } from "@/constants/theme";
import { loadModel } from "@/src/ai/llm";
import AppDialog from "@/src/components/ui/AppDialog";
import { useAppColors } from "@/src/hooks/useAppColors";
import { useModelStore } from "@/src/store/modelStore";
import { Model } from "@/src/types/model";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  model: Model;
};

export default function ModelCard({ model }: Props) {
  const appColors = useAppColors();
  const styles = useMemo(() => createStyles(appColors), [appColors]);

  const [dialogType, setDialogType] = React.useState<"delete" | "error" | null>(
    null,
  );
  const [loadingThisModel, setLoadingThisModel] = React.useState(false);
  const {
    downloads,
    downloadModel,
    cancelDownload,
    removeModel,
    selectModel,
    isModelLoading,
    setIsModelLoading,
    selectedModelId,
  } = useModelStore();
  const router = useRouter();

  const state = downloads[model.id];
  const isDownloading = state?.status === "downloading";
  const isDownloaded = state?.status === "completed";
  const isFailed = state?.status === "failed";
  const isActive = selectedModelId === model.id;
  const isBusy = isModelLoading;
  const showUseLoading = isBusy && loadingThisModel;
  const progress = state?.progress ?? 0;
  const downloadedMB = model.sizeMB * progress;
  const recommendationText = (model.recommendation ?? "").toLowerCase();
  const isSpeedRecommended = recommendationText.includes("speed");
  const recommendationIcon = isSpeedRecommended ? "flash-outline" : "git-branch-outline";
  const recommendationColor = isSpeedRecommended
    ? appColors.icon.warning
    : appColors.icon.success;
  const featureIcon = isSpeedRecommended ? "rocket-outline" : "code-slash-outline";

  const formatSize = (sizeMB: number) => {
    if (sizeMB >= 1024) {
      return `${(sizeMB / 1024).toFixed(2)} GB`;
    }
    if (sizeMB >= 100) {
      return `${Math.round(sizeMB)} MB`;
    }
    return `${sizeMB.toFixed(1)} MB`;
  };

  const handleUseModel = async () => {
    if (!state?.uri || isBusy) return;

    try {
      setLoadingThisModel(true);
      setIsModelLoading(true);
      await loadModel(state.uri);
      selectModel(model.id);
      router.back();
    } catch {
      setDialogType("error");
    } finally {
      setIsModelLoading(false);
      setLoadingThisModel(false);
    }
  };

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
          <Ionicons
            name="sparkles"
            size={16}
            color={isActive ? "#ffffff" : appColors.text.secondary}
          />
        </View>

        <View style={styles.infoWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {model.name}
            </Text>
            {model.recommendation ? (
              <View
                style={[
                  styles.recommendChip,
                  {
                    backgroundColor: isSpeedRecommended
                      ? appColors.bg.actionSecondary
                      : appColors.bg.cardActive,
                    borderColor: isSpeedRecommended
                      ? appColors.border.actionSecondary
                      : appColors.border.cardActive,
                  },
                ]}
              >
                <Ionicons
                  name={recommendationIcon}
                  size={12}
                  color={recommendationColor}
                />
                <Text style={[styles.recommendText, { color: recommendationColor }]}>
                  {model.recommendation}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="server-outline" size={12} color={appColors.icon.muted} />
              <Text style={styles.metaText}>{model.sizeMB} MB</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="flash-outline" size={12} color={appColors.icon.muted} />
              <Text style={styles.metaText}>{model.nPredict} tok</Text>
            </View>
          </View>

          {model.features?.length ? (
            <View style={styles.featureRow}>
              {model.features.map((feature) => (
                <View key={feature} style={styles.featureChip}>
                  <Ionicons
                    name={featureIcon}
                    size={11}
                    color={recommendationColor}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {!state || isFailed ? (
        <>
          {isFailed ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={13} color={appColors.icon.danger} />
              <Text style={styles.errorBannerText}>
                Download failed — check your connection and try again.
              </Text>
            </View>
          ) : null}
          <TouchableOpacity
            onPress={() => downloadModel(model)}
            style={styles.primaryButton}
            activeOpacity={0.88}
          >
            <Ionicons
              name={isFailed ? "refresh-outline" : "download-outline"}
              size={16}
              color={appColors.text.inverse}
            />
            <Text style={styles.primaryButtonText}>
              {isFailed ? "Retry Download" : "Download"}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}

      {isDownloaded ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleUseModel}
            disabled={isBusy}
            style={[styles.primaryButton, isActive && styles.primaryButtonActive]}
            activeOpacity={0.88}
          >
            {showUseLoading ? (
              <ActivityIndicator
                size="small"
                color={appColors.text.inverse}
                style={styles.buttonSpinner}
              />
            ) : (
              <Ionicons
                name={isActive ? "checkmark-circle" : "play"}
                size={16}
                color={appColors.text.inverse}
              />
            )}
            <Text style={styles.primaryButtonText}>
              {showUseLoading ? "Loading..." : isActive ? "Active" : "Use model"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDialogType("delete")}
            style={styles.secondaryButton}
            activeOpacity={0.88}
          >
            <Ionicons name="trash-outline" size={16} color={appColors.icon.danger} />
            <Text style={styles.secondaryButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isDownloading ? (
        <View style={styles.downloadWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(4, progress * 100)}%` },
              ]}
            />
          </View>

          <View style={styles.downloadMetaRow}>
            <Text style={styles.progressText}>
              Downloading {formatSize(downloadedMB)} / {formatSize(model.sizeMB)}
            </Text>

            <TouchableOpacity
              onPress={() => cancelDownload(model.id)}
              style={styles.cancelButton}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <AppDialog
        visible={dialogType === "delete"}
        iconName="trash-outline"
        iconColor={appColors.icon.danger}
        title="Remove model?"
        message="This will delete the model from your device storage."
        onClose={() => setDialogType(null)}
        primaryLabel="Delete"
        primaryVariant="danger"
        onPrimary={() => {
          setDialogType(null);
          removeModel(model.id);
        }}
      />

      <AppDialog
        visible={dialogType === "error"}
        iconName="alert-circle-outline"
        iconColor={appColors.icon.warning}
        title="Could not load model"
        message="Please try again. If this keeps failing, re-download the model."
        onClose={() => setDialogType(null)}
        primaryLabel="OK"
        onPrimary={() => setDialogType(null)}
      />
    </View>
  );
}

const createStyles = (appColors: AppColorsType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: appColors.border.card,
      backgroundColor: appColors.bg.card,
      overflow: "hidden",
    },
    cardActive: {
      borderColor: appColors.border.cardActive,
      backgroundColor: appColors.bg.cardActive,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: appColors.bg.chipAlt,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      borderWidth: 1,
      borderColor: appColors.border.icon,
    },
    iconWrapActive: {
      backgroundColor: appColors.bg.successAlt,
      borderColor: appColors.border.cardActive,
    },
    infoWrap: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    name: {
      color: appColors.text.primary,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
      flex: 1,
    },
    recommendChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: appColors.bg.cardActive,
      borderWidth: 1,
      borderColor: appColors.border.cardActive,
    },
    recommendText: {
      color: appColors.text.primary,
      fontSize: 11,
      fontWeight: "800",
    },
    metaRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
      flexWrap: "wrap",
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: appColors.bg.chip,
      borderWidth: 1,
      borderColor: appColors.border.meta,
    },
    metaText: {
      color: appColors.text.secondary,
      fontSize: 11,
      fontWeight: "600",
    },
    featureRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 8,
    },
    featureChip: {
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: appColors.border.subtle,
      backgroundColor: appColors.bg.surfaceAlt,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    featureText: {
      color: appColors.text.secondary,
      fontSize: 10,
      fontWeight: "500",
    },
    actionsRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    primaryButton: {
      marginTop: 12,
      borderRadius: 12,
      backgroundColor: appColors.bg.successAlt,
      borderWidth: 1,
      borderColor: appColors.border.successAlt,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 6,
      flex: 1,
    },
    primaryButtonActive: {
      backgroundColor: appColors.bg.success,
      borderColor: appColors.border.success,
    },
    primaryButtonText: {
      color: appColors.text.inverse,
      fontSize: 13,
      fontWeight: "700",
    },
    buttonSpinner: {
      marginRight: 6,
    },
    secondaryButton: {
      marginTop: 12,
      borderRadius: 12,
      backgroundColor: appColors.bg.actionSecondary,
      borderWidth: 1,
      borderColor: appColors.border.actionSecondary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 6,
    },
    secondaryButtonText: {
      color: appColors.danger.textSoft,
      fontSize: 13,
      fontWeight: "700",
    },
    downloadWrap: {
      marginTop: 12,
      paddingTop: 2,
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: appColors.bg.surface,
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: appColors.bg.success,
    },
    downloadMetaRow: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    progressText: {
      color: appColors.text.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    cancelButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: appColors.border.dangerSoft,
      backgroundColor: appColors.bg.dangerSoft,
    },
    cancelText: {
      color: appColors.danger.text,
      fontSize: 12,
      fontWeight: "700",
    },
    errorBanner: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: appColors.bg.dangerSoft,
      borderWidth: 1,
      borderColor: appColors.border.dangerSoft,
    },
    errorBannerText: {
      flex: 1,
      color: appColors.danger.text,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 16,
    },
  });
