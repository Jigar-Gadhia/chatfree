import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title?: string;
  children: React.ReactNode;
  showBack?: boolean;
  style?: ViewStyle
};

export default function ScreenContainer({
  title,
  children,
  showBack = false,
  style
}: Props) {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, style]} edges={["top", "bottom"]}>
      {/* 🔝 Header */}
      {(title || showBack) && (
        <View style={styles.header}>
          {/* Back Button */}
          {showBack ? (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Right Placeholder (for balance) */}
          <View style={{ width: 24 }} />
        </View>
      )}

      {/* 📦 Content */}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f2e",
  },
  back: {
    fontSize: 30,
    color: "white",
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
});
