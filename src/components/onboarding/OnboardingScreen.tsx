import { useAppColors } from "@/src/hooks/useAppColors";
import { useModelStore } from "@/src/store/modelStore";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import AppText from "../ui/AppText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type SlideData = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string, ...string[]];
};

const SLIDES: SlideData[] = [
  {
    id: "1",
    title: "Welcome to ChatFree",
    description:
      "Your privacy-focused, offline-capable AI chat companion. Run powerful LLMs directly on your device.",
    icon: "shield-checkmark-outline",
    gradient: ["#1a1a2e", "#16213e", "#0f3460"] as const,
  },
  {
    id: "2",
    title: "Complete Privacy",
    description:
      "Your conversations never leave your device. No servers, no tracking, no data collection.",
    icon: "lock-closed-outline",
    gradient: ["#1e3a5f", "#152238", "#0d1a2e"] as const,
  },
  {
    id: "3",
    title: "Offline First",
    description:
      "Chat anytime, anywhere. Once models are downloaded, no internet connection required.",
    icon: "cloud-offline-outline",
    gradient: ["#2d1b4e", "#1f1235", "#140a24"] as const,
  },
  {
    id: "4",
    title: "Smart Features",
    description:
      "Voice input/output, PDF chat, web search integration, and multiple model support.",
    icon: "hardware-chip-outline",
    gradient: ["#1a472a", "#12331f", "#0a2214"] as const,
  },
];

type SlideItemProps = {
  item: SlideData;
  appColors: ReturnType<typeof useAppColors>;
};

function SlideItem({ item, appColors }: SlideItemProps) {
  return (
    <View style={[styles.slide, { backgroundColor: appColors.bg.screen }]}>
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Ionicons name={item.icon} size={64} color={appColors.icon.inverse} />
      </LinearGradient>
      <View style={styles.slideContent}>
        <AppText
          variant="title"
          color={appColors.text.primary}
          style={styles.slideTitle}
        >
          {item.title}
        </AppText>
        <AppText
          variant="body"
          color={appColors.text.secondary}
          style={styles.slideDescription}
        >
          {item.description}
        </AppText>
      </View>
    </View>
  );
}

function WelcomeScreen({
  appColors,
  onStart,
}: {
  appColors: ReturnType<typeof useAppColors>;
  onStart: () => void;
}) {
  return (
    <View style={[styles.container, { backgroundColor: appColors.bg.screen }]}>
      <View style={styles.welcomeContent}>
        <LinearGradient
          colors={["#1a1a2e", "#16213e", "#0f3460"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeIconContainer}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={80}
            color={appColors.icon.inverse}
          />
        </LinearGradient>
        <AppText
          variant="title"
          color={appColors.text.primary}
          style={styles.welcomeTitle}
        >
          ChatFree
        </AppText>
        <AppText
          variant="body"
          color={appColors.text.secondary}
          style={styles.welcomeSubtitle}
        >
          Your private AI companion
        </AppText>
        <AppText color={appColors.text.muted} style={styles.welcomeDescription}>
          Run powerful LLMs directly on your device. No servers, no tracking,
          complete privacy.
        </AppText>
      </View>
      <TouchableOpacity onPress={onStart} style={styles.welcomeButton}>
        <AppText
          color={appColors.text.inverse}
          style={styles.welcomeButtonText}
        >
          Start here
        </AppText>
        <Ionicons
          name="arrow-forward"
          size={20}
          color={appColors.text.inverse}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function OnboardingScreen() {
  const appColors = useAppColors();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const { setOnboardingComplete } = useOnboardingStore();
  const { init: initModels } = useModelStore();

  const viewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleWelcomeStart = () => {
    setShowWelcome(false);
  };

  const handleGetStarted = async () => {
    await initModels();
    await setOnboardingComplete();
    router.replace("/");
  };

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const renderSlide = ({ item }: { item: SlideData }) => (
    <SlideItem item={item} appColors={appColors} />
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  if (showWelcome) {
    return <WelcomeScreen appColors={appColors} onStart={handleWelcomeStart} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: appColors.bg.screen }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Pagination */}
      <View style={styles.paginationContainer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? appColors.border.cardActive
                      : appColors.border.subtle,
                },
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentIndex < SLIDES.length - 1 ? (
            <TouchableOpacity
              onPress={() => scrollToIndex(currentIndex + 1)}
              style={[
                styles.button,
                { backgroundColor: appColors.bg.cardActive },
              ]}
            >
              <AppText color={appColors.text.primary} style={styles.buttonText}>
                Next
              </AppText>
              <Ionicons
                name="arrow-forward-outline"
                size={20}
                color={appColors.text.primary}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleGetStarted}
              style={[
                styles.button,
                { backgroundColor: appColors.border.cardActive },
              ]}
            >
              <AppText
                color={appColors.text.inverse}
                style={[styles.buttonText, { color: appColors.text.inverse }]}
              >
                Get Started
              </AppText>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={appColors.text.inverse}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Skip Button */}
      {!isLastSlide && (
        <TouchableOpacity onPress={handleGetStarted} style={styles.skipButton}>
          <AppText color={appColors.text.muted} style={styles.skipText}>
            Skip
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  slideContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  slideDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
  },
  welcomeIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeContent: {
    alignItems: "center",
    paddingHorizontal: 40,
    flex: 1,
    justifyContent: "center",
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  welcomeDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 20,
    letterSpacing: 0.2,
  },
  welcomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f3460",
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 30,
    marginHorizontal: 40,
    marginBottom: 80,
    gap: 8,
  },
  welcomeButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
