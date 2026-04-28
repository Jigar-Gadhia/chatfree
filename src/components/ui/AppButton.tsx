import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

type AppButtonProps = TouchableOpacityProps & {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
};

export default function AppButton({
  label,
  labelStyle,
  style,
  children,
  disabled,
  activeOpacity = 0.85,
  animated = false,
  onPress,
  ...props
}: AppButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!animated || disabled) return;
    scale.value = withTiming(0.5, { duration: 80 });
  };

  const handlePressOut = () => {
    if (!animated || disabled) return;
    scale.value = withSpring(1, {
      damping: 84,
    });
  };

  return (
    <AnimatedTouchableOpacity
      {...props}
      disabled={disabled}
      activeOpacity={activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[disabled && styles.disabled, style, animated && animatedStyle]}
    >
      {children}
      {label ? <Text style={labelStyle}>{label}</Text> : null}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
