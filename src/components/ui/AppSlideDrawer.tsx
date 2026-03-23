import { useAppColors } from "@/src/hooks/useAppColors";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AppSlideDrawerProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelStyle?: ViewStyle;
  panelWidth?: string | number;
  panelMaxWidth?: number;
  panelTop?: number;
  panelBottom?: number;
  slideDistance?: number;
  ignoreSafeArea?: boolean;
};

export default function AppSlideDrawer({
  visible,
  onClose,
  children,
  panelStyle,
  panelWidth = "82%",
  panelMaxWidth = 360,
  panelTop = 18,
  panelBottom = 18,
  slideDistance = 380,
  ignoreSafeArea = false,
}: AppSlideDrawerProps) {
  const appColors = useAppColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(appColors.overlay.dim), [appColors.overlay.dim]);
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const resolvedPanelTop = panelTop + (ignoreSafeArea ? 0 : insets.top);
  const resolvedPanelBottom = panelBottom + (ignoreSafeArea ? 0 : insets.bottom);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [progress, visible]);

  const translateX = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-slideDistance, 0],
      }),
    [progress, slideDistance],
  );

  const backdropOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    [progress],
  );

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdropLayer, { opacity: backdropOpacity }]}
        />

        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdropTouch}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.panel,
            {
              top: resolvedPanelTop,
              bottom: resolvedPanelBottom,
              width: panelWidth as ViewStyle["width"],
              maxWidth: panelMaxWidth,
              transform: [{ translateX }],
            },
            panelStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (backdropColor: string) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    backdropLayer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: backdropColor,
    },
    backdropTouch: {
      ...StyleSheet.absoluteFillObject,
    },
    panel: {
      position: "absolute",
      left: 0,
    },
  });
