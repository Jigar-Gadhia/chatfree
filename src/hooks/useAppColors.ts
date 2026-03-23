import { getAppColors } from "@/constants/theme";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useColorScheme as useSystemColorScheme } from "react-native";

export const useAppColors = () => {
  const systemScheme = useSystemColorScheme();
  const themePreference = useSettingsStore((state) => state.themePreference);

  const resolvedScheme =
    themePreference === "system" ? systemScheme ?? "dark" : themePreference;

  return getAppColors(resolvedScheme === "dark" ? "dark" : "light");
};
