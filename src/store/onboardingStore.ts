import { Directory, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { create } from "zustand";

export type OnboardingState = {
  hasCompletedOnboarding: boolean;
  hasDownloadedModel: boolean;
  init: () => Promise<void>;
  setOnboardingComplete: () => Promise<void>;
  setModelDownloaded: () => Promise<void>;
};

const ONBOARDING_DIR = new Directory(Paths.document, "onboarding");
const ONBOARDING_FILE = `${ONBOARDING_DIR.uri}state.json`;

const ensureOnboardingDir = async () => {
  if (!(await ONBOARDING_DIR.exists)) {
    await ONBOARDING_DIR.create({ intermediates: true });
  }
};

const persistOnboardingState = async (
  hasCompletedOnboarding: boolean,
  hasDownloadedModel: boolean,
) => {
  try {
    await ensureOnboardingDir();
    await FileSystem.writeAsStringAsync(
      ONBOARDING_FILE,
      JSON.stringify({ hasCompletedOnboarding, hasDownloadedModel }),
    );
  } catch (error) {
    console.log("Onboarding persist error", error);
  }
};

const loadOnboardingState = async (): Promise<{
  hasCompletedOnboarding: boolean;
  hasDownloadedModel: boolean;
} | null> => {
  try {
    await ensureOnboardingDir();
    const info = await FileSystem.getInfoAsync(ONBOARDING_FILE);
    if (!info.exists) return null;

    const raw = await FileSystem.readAsStringAsync(ONBOARDING_FILE);
    return JSON.parse(raw) as {
      hasCompletedOnboarding: boolean;
      hasDownloadedModel: boolean;
    };
  } catch (error) {
    console.log("Onboarding load error", error);
    return null;
  }
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompletedOnboarding: false,
  hasDownloadedModel: false,

  init: async () => {
    const state = await loadOnboardingState();
    if (!state) {
      await persistOnboardingState(false, false);
      return;
    }
    set({
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      hasDownloadedModel: state.hasDownloadedModel,
    });
  },

  setOnboardingComplete: async () => {
    set((state) => {
      const newState = { ...state, hasCompletedOnboarding: true };
      persistOnboardingState(true, state.hasDownloadedModel);
      return newState;
    });
  },

  setModelDownloaded: async () => {
    set((state) => {
      const newState = { ...state, hasDownloadedModel: true };
      persistOnboardingState(state.hasCompletedOnboarding, true);
      return newState;
    });
  },
}));
