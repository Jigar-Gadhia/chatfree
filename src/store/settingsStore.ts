import { Directory, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { create } from "zustand";

export type ThemePreference = "system" | "light" | "dark";

type SettingsStore = {
  themePreference: ThemePreference;
  init: () => Promise<void>;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
};

const SETTINGS_DIR = new Directory(Paths.document, "settings");
const SETTINGS_FILE = `${SETTINGS_DIR.uri}state.json`;

const ensureSettingsDir = async () => {
  if (!(await SETTINGS_DIR.exists)) {
    await SETTINGS_DIR.create({ intermediates: true });
  }
};

const persistSettings = async (themePreference: ThemePreference) => {
  try {
    await ensureSettingsDir();
    await FileSystem.writeAsStringAsync(
      SETTINGS_FILE,
      JSON.stringify({ themePreference }),
    );
  } catch (error) {
    console.log("Settings persist error", error);
  }
};

const loadPersistedSettings = async (): Promise<ThemePreference | null> => {
  try {
    await ensureSettingsDir();
    const info = await FileSystem.getInfoAsync(SETTINGS_FILE);
    if (!info.exists) return null;

    const raw = await FileSystem.readAsStringAsync(SETTINGS_FILE);
    const parsed = JSON.parse(raw) as { themePreference?: ThemePreference };

    if (
      parsed.themePreference === "system" ||
      parsed.themePreference === "light" ||
      parsed.themePreference === "dark"
    ) {
      return parsed.themePreference;
    }

    return null;
  } catch (error) {
    console.log("Settings load error", error);
    return null;
  }
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  themePreference: "system",

  init: async () => {
    const persistedPreference = await loadPersistedSettings();
    if (!persistedPreference) {
      await persistSettings("system");
      return;
    }

    set({ themePreference: persistedPreference });
  },

  setThemePreference: async (preference) => {
    set({ themePreference: preference });
    await persistSettings(preference);
  },
}));
