/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform, type ColorValue } from "react-native";

type GradientStops = readonly [ColorValue, ColorValue, ...ColorValue[]];
type AppGradient = {
  topOverlay: GradientStops;
  drawerNewChat: GradientStops;
};
type AppPalette = {
  text: {
    primary: string;
    secondary: string;
    muted: string;
    weak: string;
    inverse: string;
  };
  bg: {
    screen: string;
    container: string;
    card: string;
    cardActive: string;
    surface: string;
    surfaceAlt: string;
    drawer: string;
    input: string;
    chip: string;
    chipAlt: string;
    overlayCard: string;
    dialogCard: string;
    dialogIcon: string;
    dangerSoft: string;
    dangerButton: string;
    success: string;
    successAlt: string;
    stop: string;
    bubbleUser: string;
    bubbleAssistant: string;
    actionSecondary: string;
    drawerAction: string;
    modelButton: string;
    chatActive: string;
  };
  border: {
    default: string;
    subtle: string;
    strong: string;
    input: string;
    card: string;
    cardActive: string;
    meta: string;
    icon: string;
    overlayCard: string;
    dialog: string;
    dialogIcon: string;
    dialogSecondary: string;
    success: string;
    successAlt: string;
    actionSecondary: string;
    dangerSoft: string;
    drawerRight: string;
    drawerAction: string;
    modelButton: string;
    chatRow: string;
    chatRowActive: string;
  };
  icon: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    danger: string;
    warning: string;
    success: string;
    offline: string;
  };
  shadow: {
    base: string;
  };
  overlay: {
    dim: string;
    modal: string;
    loading: string;
  };
  gradient: AppGradient;
  danger: {
    text: string;
    textSoft: string;
    bg: string;
    border: string;
  };
};

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

const appDark: AppPalette = {
  text: {
    primary: "#f5f7fb",
    secondary: "#e6ebf5",
    muted: "#a3a3a3",
    weak: "#7a7a7a",
    inverse: "#f7fffc",
  },
  bg: {
    screen: "#000000",
    container: "#000000",
    card: "#0a0a0a",
    cardActive: "#141414",
    surface: "#050505",
    surfaceAlt: "#0f0f0f",
    drawer: "#030303",
    input: "#0d0d0d",
    chip: "#151515",
    chipAlt: "#1c1c1c",
    overlayCard: "#0d0d0d",
    dialogCard: "#0b0b0b",
    dialogIcon: "#181818",
    dangerSoft: "#27141d",
    dangerButton: "#7a132a",
    success: "#14a37f",
    successAlt: "#0f8b6b",
    stop: "#ef4444",
    bubbleUser: "#1e1e1e",
    bubbleAssistant: "#10a37f",
    actionSecondary: "#161616",
    drawerAction: "#131313",
    modelButton: "#1a1a1a",
    chatActive: "#202020",
  },
  border: {
    default: "#2a2a2a",
    subtle: "#1e1e1e",
    strong: "#343434",
    input: "#333333",
    card: "#2c2c2c",
    cardActive: "#1db58a",
    meta: "#313131",
    icon: "#3a3a3a",
    overlayCard: "#2f2f2f",
    dialog: "#2b2b2b",
    dialogIcon: "#3a3a3a",
    dialogSecondary: "#454545",
    success: "#25c99a",
    successAlt: "#17a980",
    actionSecondary: "#414141",
    dangerSoft: "#542837",
    drawerRight: "#1a1a1a",
    drawerAction: "#2f2f2f",
    modelButton: "#2a2a2a",
    chatRow: "#2a2a2a",
    chatRowActive: "#3d3d3d",
  },
  icon: {
    primary: "#dfdfdf",
    secondary: "#cfcfcf",
    muted: "#9d9d9d",
    inverse: "#ffffff",
    danger: "#fb7185",
    warning: "#fbbf24",
    success: "#22c55e",
    offline: "#ef4444",
  },
  shadow: {
    base: "#000000",
  },
  overlay: {
    dim: "rgba(0,0,0,0.66)",
    modal: "rgba(0,0,0,0.72)",
    loading: "rgba(0,0,0,0.38)",
  },
  gradient: {
    topOverlay: [
      "rgba(0,0,0,0.86)",
      "rgba(0,0,0,0.62)",
      "rgba(0,0,0,0.3)",
      "rgba(0,0,0,0.1)",
      "transparent",
    ] as GradientStops,
    drawerNewChat: [
      "#1a1a1a",
      "#151515",
      "#101010",
      "#0b0b0b",
    ] as GradientStops,
  },
  danger: {
    text: "#fb7185",
    textSoft: "#fda4af",
    bg: "#881337",
    border: "#be123c",
  },
};

const appLight: AppPalette = {
  text: {
    primary: "#121723",
    secondary: "#1f2a3d",
    muted: "#596273",
    weak: "#768095",
    inverse: "#ffffff",
  },
  bg: {
    screen: "#f5f7fb",
    container: "#eef2f8",
    card: "#ffffff",
    cardActive: "#e9f7f2",
    surface: "#ffffff",
    surfaceAlt: "#f8fafd",
    drawer: "#f4f6fb",
    input: "#ffffff",
    chip: "#f2f5f9",
    chipAlt: "#e9eef5",
    overlayCard: "#ffffff",
    dialogCard: "#ffffff",
    dialogIcon: "#eef3fa",
    dangerSoft: "#fde8ec",
    dangerButton: "#b4233d",
    success: "#0e9f6e",
    successAlt: "#0b845c",
    stop: "#dc2626",
    bubbleUser: "#e9edf5",
    bubbleAssistant: "#14a37f",
    actionSecondary: "#edf1f6",
    drawerAction: "#eef2f7",
    modelButton: "#e7edf6",
    chatActive: "#e4ebf6",
  },
  border: {
    default: "#d7deea",
    subtle: "#dfe5ef",
    strong: "#c8d1e2",
    input: "#d2dceb",
    card: "#d7deea",
    cardActive: "#8dd8be",
    meta: "#d5deed",
    icon: "#d0d9e9",
    overlayCard: "#d7deea",
    dialog: "#d7deea",
    dialogIcon: "#dce4f2",
    dialogSecondary: "#d2dbea",
    success: "#66c6a4",
    successAlt: "#70cdb0",
    actionSecondary: "#d9e2ef",
    dangerSoft: "#efb6c3",
    drawerRight: "#d8dfec",
    drawerAction: "#d9e1ee",
    modelButton: "#d4deed",
    chatRow: "#d9e1ee",
    chatRowActive: "#bfd0ea",
  },
  icon: {
    primary: "#30415f",
    secondary: "#415678",
    muted: "#66748b",
    inverse: "#ffffff",
    danger: "#dc2626",
    warning: "#d97706",
    success: "#16a34a",
    offline: "#ef4444",
  },
  shadow: {
    base: "#0b1220",
  },
  overlay: {
    dim: "rgba(14,23,40,0.22)",
    modal: "rgba(14,23,40,0.3)",
    loading: "rgba(14,23,40,0.16)",
  },
  gradient: {
    topOverlay: [
      "rgba(245,247,251,0.96)",
      "rgba(245,247,251,0.82)",
      "rgba(245,247,251,0.56)",
      "rgba(245,247,251,0.28)",
      "transparent",
    ] as GradientStops,
    drawerNewChat: [
      "#dfe9fb",
      "#d4e1f7",
      "#cbdaf4",
      "#c1d2f0",
    ] as GradientStops,
  },
  danger: {
    text: "#dc2626",
    textSoft: "#b4233d",
    bg: "#fee2e2",
    border: "#fca5a5",
  },
};

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
  app: appDark,
};

export const AppColors = {
  dark: appDark,
  light: appLight,
};

export type AppColorsType = AppPalette;

export const getAppColors = (scheme: "light" | "dark"): AppColorsType =>
  scheme === "dark" ? AppColors.dark : AppColors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
