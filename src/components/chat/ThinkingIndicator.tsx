import AppText from "@/src/components/ui/AppText";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect } from "react";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

interface ThinkingIndicatorProps {
  loading: boolean;
  isModelLoading: boolean;
  streaming: boolean;
  webSearchStatus?: string;
  appColors: any;
  styles: any;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  loading,
  isModelLoading,
  streaming,
  webSearchStatus,
  appColors,
  styles,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 500 }), // bounce up
        withTiming(1, { duration: 500 }), // back
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scale.value }],
  }));

  if (!(loading || isModelLoading) || streaming) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      style={styles.thinkingBar}
    >
      <AnimatedIcon
        name="planet-outline"
        size={18}
        color={appColors.icon.muted}
        style={animatedStyle}
      />

      <AppText variant="caption" style={styles.thinkingText}>
        {isModelLoading
          ? "Loading model..."
          : webSearchStatus === "rewriting"
            ? "Rewriting query..."
            : webSearchStatus === "searching"
              ? "Searching web..."
              : webSearchStatus === "reranking"
                ? "Reranking results..."
                : webSearchStatus === "processing"
                  ? "Summarizing web results..."
                  : "Thinking..."}
      </AppText>
    </Animated.View>
  );
};
