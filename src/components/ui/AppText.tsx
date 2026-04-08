import { useAppColors } from "@/src/hooks/useAppColors";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
} from "react-native";

type AppTextVariant = "title" | "body" | "caption";

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: string;
  weight?: TextStyle["fontWeight"];
  style?: StyleProp<TextStyle>;
};

const variantStyles: Record<AppTextVariant, TextStyle> = {
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
};

export default function AppText({
  variant = "body",
  color,
  weight,
  style,
  children,
  ...props
}: AppTextProps) {
  const appColors = useAppColors();
  const resolvedColor = color ?? appColors.text.secondary;

  return (
    <Text
      {...props}
      style={[
        styles.base,
        variantStyles[variant],
        { color: resolvedColor },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
