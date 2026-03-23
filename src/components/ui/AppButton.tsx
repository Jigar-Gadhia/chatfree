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

type AppButtonProps = TouchableOpacityProps & {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export default function AppButton({
  label,
  labelStyle,
  style,
  children,
  disabled,
  activeOpacity = 0.85,
  ...props
}: AppButtonProps) {
  return (
    <TouchableOpacity
      {...props}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={[style, disabled && styles.disabled]}
    >
      {children}
      {label ? <Text style={labelStyle}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
