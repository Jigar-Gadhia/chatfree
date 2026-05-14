import { useAppColors } from "@/src/hooks/useAppColors";
import React, { useEffect, useRef, useState } from "react";
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
  const [mounted, setMounted] = useState(visible);

  // ✅ Stable animated value — never recreated
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  // ✅ Stable interpolations — created once, never recreated
  const translateX = useRef(
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-slideDistance, 0],
    }),
  ).current;

  const backdropOpacity = useRef(
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  ).current;

  const resolvedTop = panelTop + (ignoreSafeArea ? 0 : insets.top);
  const resolvedBottom = panelBottom + (ignoreSafeArea ? 0 : insets.bottom);

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
      if (finished) setMounted(false);
    });
  }, [visible]);

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
        {/* ✅ Backdrop dim layer */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backdropLayer,
            {
              backgroundColor: appColors.overlay.dim,
              opacity: backdropOpacity,
            },
          ]}
        />

        {/* ✅ Dismiss touch target */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdropTouch}
          onPress={onClose}
        />

        {/* ✅ Sliding panel */}
        <Animated.View
          style={[
            styles.panel,
            {
              top: resolvedTop,
              bottom: resolvedBottom,
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

// ✅ Styles defined once at module level — zero runtime cost
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: "absolute",
    left: 0,
  },
});
