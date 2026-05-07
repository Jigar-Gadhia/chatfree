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
    primary: "#f7f7f4",
    secondary: "#e7e5df",
    muted: "#a9a59c",
    weak: "#77736b",
    inverse: "#ffffff",
  },
  bg: {
    screen: "#11110f",
    container: "#151513",
    card: "#1b1b18",
    cardActive: "#20251f",
    surface: "#191917",
    surfaceAlt: "#22211e",
    drawer: "#161613",
    input: "#1d1d1a",
    chip: "#24231f",
    chipAlt: "#2c2a25",
    overlayCard: "#1d1d1a",
    dialogCard: "#1d1d1a",
    dialogIcon: "#292824",
    dangerSoft: "#32181b",
    dangerButton: "#9f2431",
    success: "#10a37f",
    successAlt: "#0e8f70",
    stop: "#e5484d",
    bubbleUser: "#262521",
    bubbleAssistant: "#10a37f",
    actionSecondary: "#292824",
    drawerAction: "#24231f",
    modelButton: "#2b2924",
    chatActive: "#2a2d27",
  },
  border: {
    default: "#33312c",
    subtle: "#292823",
    strong: "#47443d",
    input: "#3a3832",
    card: "#34322d",
    cardActive: "#257d67",
    meta: "#38362f",
    icon: "#46433c",
    overlayCard: "#3a3832",
    dialog: "#36342f",
    dialogIcon: "#46433c",
    dialogSecondary: "#555148",
    success: "#23c69b",
    successAlt: "#16aa85",
    actionSecondary: "#4a463f",
    dangerSoft: "#683035",
    drawerRight: "#2b2924",
    drawerAction: "#3a3731",
    modelButton: "#3d3932",
    chatRow: "#38352f",
    chatRowActive: "#504d45",
  },
  icon: {
    primary: "#efede7",
    secondary: "#d4d0c7",
    muted: "#9d978d",
    inverse: "#ffffff",
    danger: "#fb7185",
    warning: "#f6b73c",
    success: "#10b981",
    offline: "#ef4444",
  },
  shadow: {
    base: "#000000",
  },
  overlay: {
    dim: "rgba(10,10,9,0.68)",
    modal: "rgba(10,10,9,0.74)",
    loading: "rgba(10,10,9,0.42)",
  },
  gradient: {
    topOverlay: [
      "rgba(17,17,15,0.94)",
      "rgba(17,17,15,0.72)",
      "rgba(17,17,15,0.42)",
      "rgba(17,17,15,0.16)",
      "transparent",
    ] as GradientStops,
    drawerNewChat: [
      "#2c2a25",
      "#282720",
      "#24231d",
      "#1f1e19",
    ] as GradientStops,
  },
  danger: {
    text: "#fb7185",
    textSoft: "#fda4af",
    bg: "#9f1239",
    border: "#e11d48",
  },
};

const appLight: AppPalette = {
  text: {
    primary: "#181713",
    secondary: "#38352f",
    muted: "#6f6a60",
    weak: "#9c968b",
    inverse: "#ffffff",
  },
  bg: {
    screen: "#faf8f2",
    container: "#f2efe7",
    card: "#ffffff",
    cardActive: "#edf8f2",
    surface: "#fffefd",
    surfaceAlt: "#f4f1eb",
    drawer: "#f6f3ec",
    input: "#fffefd",
    chip: "#f0ede5",
    chipAlt: "#e6e2d8",
    overlayCard: "#ffffff",
    dialogCard: "#ffffff",
    dialogIcon: "#eeebe3",
    dangerSoft: "#fff0f0",
    dangerButton: "#c73643",
    success: "#10a37f",
    successAlt: "#0d8f70",
    stop: "#ef4444",
    bubbleUser: "#eeeae1",
    bubbleAssistant: "#10a37f",
    actionSecondary: "#ece8df",
    drawerAction: "#eae6dc",
    modelButton: "#e7e2d7",
    chatActive: "#e8eee7",
  },
  border: {
    default: "#ded8cc",
    subtle: "#ebe7df",
    strong: "#c7bfb1",
    input: "#d7d0c4",
    card: "#ddd7cb",
    cardActive: "#84d3b9",
    meta: "#ddd6ca",
    icon: "#d3ccbf",
    overlayCard: "#ddd7cb",
    dialog: "#ddd7cb",
    dialogIcon: "#d7d0c4",
    dialogSecondary: "#d1c9bc",
    success: "#79d6bf",
    successAlt: "#55c2a6",
    actionSecondary: "#d6cec1",
    dangerSoft: "#ffc9ce",
    drawerRight: "#ddd6ca",
    drawerAction: "#d8d0c3",
    modelButton: "#d2cabd",
    chatRow: "#d8d0c3",
    chatRowActive: "#c7d5c8",
  },
  icon: {
    primary: "#2c2a25",
    secondary: "#514d45",
    muted: "#817a70",
    inverse: "#ffffff",
    danger: "#dc2626",
    warning: "#d97706",
    success: "#10a37f",
    offline: "#ef4444",
  },
  shadow: {
    base: "#171510",
  },
  overlay: {
    dim: "rgba(30,27,20,0.18)",
    modal: "rgba(30,27,20,0.28)",
    loading: "rgba(30,27,20,0.12)",
  },
  gradient: {
    topOverlay: [
      "rgba(250,248,242,0.98)",
      "rgba(250,248,242,0.84)",
      "rgba(250,248,242,0.56)",
      "rgba(250,248,242,0.24)",
      "transparent",
    ] as GradientStops,
    drawerNewChat: [
      "#ffffff",
      "#f6f5f1",
      "#efeee8",
      "#e8e6df",
    ] as GradientStops,
  },
  danger: {
    text: "#dc2626",
    textSoft: "#b91c1c",
    bg: "#fff0f0",
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
