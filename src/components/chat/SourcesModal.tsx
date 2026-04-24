import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import { MessageSource } from "@/src/store/chatStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";

const getSourceFaviconUrl = (rawUrl: string) => {
  try {
    const hostname = new URL(rawUrl).hostname;
    if (!hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return null;
  }
};

const SourceFavicon = ({
  sourceUrl,
  styles,
  appColors,
}: {
  sourceUrl: string;
  styles: any;
  appColors: any;
}) => {
  const [failed, setFailed] = useState(false);
  const faviconUrl = getSourceFaviconUrl(sourceUrl);

  if (!faviconUrl || failed) {
    return (
      <Ionicons
        name="globe-outline"
        size={14}
        color={appColors.icon.secondary}
      />
    );
  }

  return (
    <Image
      source={{ uri: faviconUrl }}
      style={styles.sourceItemFavicon}
      contentFit="cover"
      onError={() => setFailed(true)}
    />
  );
};

interface SourcesModalProps {
  visible: boolean;
  sources: MessageSource[];
  onClose: () => void;
  appColors: any;
  styles: any;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({
  visible,
  sources,
  onClose,
  appColors,
  styles,
}) => {
  const handleOpenSourceUrl = async (url: string) => {
    if (!url.trim()) return;
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sourceModalBackdrop} onPress={onClose} />
      <View style={styles.sourceModalWrap}>
        <View style={styles.sourceModalCard}>
          <View style={styles.sourceModalHeader}>
            <AppText variant="body" style={styles.sourceModalTitle}>
              Sources
            </AppText>
            <AppButton
              style={styles.sourceModalCloseButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={16} color={appColors.icon.secondary} />
            </AppButton>
          </View>

          <FlatList
            data={sources}
            keyExtractor={(item, index) => `${item.url}-${index}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sourceListContent}
            renderItem={({ item }) => (
              <AppButton
                style={styles.sourceItemRow}
                onPress={() => handleOpenSourceUrl(item.url)}
                activeOpacity={0.82}
              >
                <View style={styles.sourceItemLeft}>
                  <View style={styles.sourceItemIconWrap}>
                    <SourceFavicon
                      sourceUrl={item.url}
                      styles={styles}
                      appColors={appColors}
                    />
                  </View>
                  <View style={styles.sourceItemTextWrap}>
                    <AppText
                      variant="body"
                      style={styles.sourceItemTitle}
                      numberOfLines={1}
                    >
                      {item.title}
                    </AppText>
                    <AppText
                      variant="caption"
                      style={styles.sourceItemUrl}
                      numberOfLines={1}
                    >
                      {item.url}
                    </AppText>
                  </View>
                </View>
                <Ionicons name="open-outline" size={14} color={appColors.icon.muted} />
              </AppButton>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};
