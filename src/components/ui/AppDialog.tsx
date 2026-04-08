import Ionicons from "@expo/vector-icons/Ionicons";
import { AppColorsType } from "@/constants/theme";
import { useAppColors } from "@/src/hooks/useAppColors";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AppDialogProps = {
  visible: boolean;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  title: string;
  message: string;
  onClose: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryVariant?: "default" | "danger";
  secondaryLabel?: string;
};

export default function AppDialog({
  visible,
  iconName,
  iconColor,
  title,
  message,
  onClose,
  primaryLabel,
  onPrimary,
  primaryVariant = "default",
  secondaryLabel = "Cancel",
}: AppDialogProps) {
  const appColors = useAppColors();
  const styles = React.useMemo(() => createStyles(appColors), [appColors]);
  const resolvedIconColor = iconColor ?? appColors.icon.warning;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name={iconName} size={18} color={resolvedIconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.secondaryAction}
              activeOpacity={0.88}
            >
              <Text style={styles.secondaryActionText}>{secondaryLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPrimary}
              style={[
                styles.primaryAction,
                primaryVariant === "danger"
                  ? styles.primaryActionDanger
                  : styles.primaryActionDefault,
              ]}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryActionText}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (appColors: AppColorsType) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: appColors.overlay.modal,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    overlayTouch: {
      ...StyleSheet.absoluteFillObject,
    },
    card: {
      backgroundColor: appColors.bg.dialogCard,
      borderWidth: 1,
      borderColor: appColors.border.dialog,
      borderRadius: 16,
      padding: 16,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: appColors.bg.dialogIcon,
      borderWidth: 1,
      borderColor: appColors.border.dialogIcon,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    title: {
      color: appColors.text.primary,
      fontSize: 17,
      fontWeight: "700",
    },
    message: {
      color: appColors.text.muted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 6,
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 14,
    },
    secondaryAction: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: appColors.border.dialogSecondary,
      backgroundColor: appColors.bg.dialogIcon,
    },
    secondaryActionText: {
      color: appColors.icon.primary,
      fontSize: 13,
      fontWeight: "700",
    },
    primaryAction: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
    },
    primaryActionDefault: {
      backgroundColor: appColors.bg.success,
      borderColor: appColors.border.success,
    },
    primaryActionDanger: {
      backgroundColor: appColors.danger.bg,
      borderColor: appColors.danger.border,
    },
    primaryActionText: {
      color: appColors.text.primary,
      fontSize: 13,
      fontWeight: "700",
    },
  });
