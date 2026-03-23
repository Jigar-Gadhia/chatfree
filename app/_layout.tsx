import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import React, { useEffect } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore } from "@/src/store/settingsStore";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { themePreference, init } = useSettingsStore();

  useEffect(() => {
    init();
  }, [init]);

  const resolvedScheme =
    themePreference === "system" ? colorScheme : themePreference;

  return (
    <ThemeProvider value={resolvedScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="modelscreen" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
