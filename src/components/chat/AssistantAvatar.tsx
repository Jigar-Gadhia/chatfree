import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = {
  streaming?: boolean;
  styles?: any;
};

export default function AssistantAvatar({ streaming = false, styles }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (streaming) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 300 }),
          withTiming(1, { duration: 300 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 150 }); // reset smoothly
    }
  }, [streaming]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedView style={[styles.assistantAvatar, animatedStyle]}>
      <Ionicons name="happy-outline" size={18} color="#fff" />
    </AnimatedView>
  );
}
