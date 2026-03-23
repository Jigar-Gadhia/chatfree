import { AppColorsType } from "@/constants/theme";
import { ChatSession } from "@/src/store/chatStore";
import AppSlideDrawer from "@/src/components/ui/AppSlideDrawer";
import AppButton from "@/src/components/ui/AppButton";
import AppDialog from "@/src/components/ui/AppDialog";
import AppText from "@/src/components/ui/AppText";
import AppTextInput from "@/src/components/ui/AppTextInput";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createChatDrawerStyles } from "./chat-drawer.styles";

type ChatDrawerProps = {
  appColors: AppColorsType;
  visible: boolean;
  chats: ChatSession[];
  activeChatId: string;
  onClose: () => void;
  onOpenSettings: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
};

const getChatPreview = (chat: ChatSession) => {
  const lastMessage = chat.messages[chat.messages.length - 1];
  if (!lastMessage) return "No messages yet";
  const clean = lastMessage.text.replace(/\s+/g, " ").trim();
  if (!clean) return "No messages yet";
  return clean.length > 56 ? `${clean.slice(0, 56)}...` : clean;
};

function DrawerSectionHeader({
  styles,
  label,
  count,
}: {
  styles: ReturnType<typeof createChatDrawerStyles>;
  label: string;
  count?: number;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <AppText variant="caption" style={styles.sectionLabel}>
        {label}
      </AppText>
      {typeof count === "number" ? (
        <View style={styles.countChip}>
          <AppText variant="caption" style={styles.countText}>
            {count}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function ChatRow({
  styles,
  appColors,
  item,
  isActive,
  onPress,
  onDelete,
}: {
  styles: ReturnType<typeof createChatDrawerStyles>;
  appColors: AppColorsType;
  item: ChatSession;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.chatRow, isActive && styles.chatRowActive]}>
      <AppButton
        onPress={onPress}
        activeOpacity={0.86}
        accessibilityRole="button"
        accessibilityLabel={`Open chat ${item.title}`}
        accessibilityState={{ selected: isActive }}
        hitSlop={6}
        style={styles.chatRowMainButton}
      >
        <View style={[styles.chatIconWrap, isActive && styles.chatIconWrapActive]}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={13}
            color={isActive ? appColors.icon.primary : appColors.icon.muted}
          />
        </View>
        <View style={styles.chatMain}>
          <AppText variant="body" style={styles.chatTitle} numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="caption" style={styles.chatPreview} numberOfLines={1}>
            {getChatPreview(item)}
          </AppText>
        </View>
        <Ionicons
          name={isActive ? "chevron-forward-circle" : "chevron-forward"}
          size={16}
          color={isActive ? appColors.icon.secondary : appColors.icon.muted}
        />
      </AppButton>

      <AppButton
        onPress={onDelete}
        style={styles.chatDeleteButton}
        activeOpacity={0.8}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Delete chat ${item.title}`}
      >
        <Ionicons name="trash-outline" size={14} color={appColors.icon.danger} />
      </AppButton>
    </View>
  );
}

export function ChatDrawer({
  appColors,
  visible,
  chats,
  activeChatId,
  onClose,
  onOpenSettings,
  onSelectChat,
  onDeleteChat,
}: ChatDrawerProps) {
  const styles = useMemo(() => createChatDrawerStyles(appColors), [appColors]);
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredChats = useMemo(() => {
    if (!normalizedQuery) return chats;

    return chats.filter((chat) => {
      const title = chat.title.toLowerCase();
      const content = chat.messages
        .slice(-12)
        .map((message) => message.text)
        .join(" ")
        .toLowerCase();
      return title.includes(normalizedQuery) || content.includes(normalizedQuery);
    });
  }, [chats, normalizedQuery]);

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
    }
  }, [visible]);

  const panelStyle = useMemo(
    () => ({
      ...styles.panel,
      paddingTop: insets.top + 10,
      paddingBottom: insets.bottom + 14,
    }),
    [insets.bottom, insets.top, styles.panel],
  );

  return (
    <AppSlideDrawer
      visible={visible}
      onClose={onClose}
      panelStyle={panelStyle}
      panelWidth="82%"
      panelMaxWidth={360}
      panelTop={0}
      panelBottom={0}
      slideDistance={380}
      ignoreSafeArea
    >
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons
            name="chatbubbles-outline"
            size={16}
            color={appColors.text.secondary}
          />
        </View>

        <View style={styles.heroTextWrap}>
          <AppText variant="caption" style={styles.brandLabel}>
            chatfree
          </AppText>
          <AppText style={styles.title}>Chats</AppText>
          <AppText variant="caption" style={styles.subtitle}>
            Your recent conversations
          </AppText>
        </View>

        <AppButton
          onPress={onClose}
          style={styles.closeButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Close drawer"
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={appColors.icon.primary} />
        </AppButton>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchIconWrap}>
          <Ionicons name="search-outline" size={13} color={appColors.icon.muted} />
        </View>
        <AppTextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search chats"
          placeholderTextColor={appColors.text.weak}
          inputStyle={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.trim().length > 0 ? (
          <AppButton
            onPress={() => setSearchQuery("")}
            style={styles.searchClearButton}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Clear chat search"
          >
            <Ionicons name="close" size={13} color={appColors.icon.muted} />
          </AppButton>
        ) : null}
      </View>

      <DrawerSectionHeader styles={styles} label="Chats" count={filteredChats.length} />

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={appColors.icon.muted}
            />
            <AppText variant="caption" style={styles.emptyText}>
              {searchQuery.trim().length > 0
                ? "No matching chats found."
                : "No chats yet. Start a new one."}
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <ChatRow
            styles={styles}
            appColors={appColors}
            item={item}
            isActive={item.id === activeChatId}
            onPress={() => onSelectChat(item.id)}
            onDelete={() => setPendingDeleteChatId(item.id)}
          />
        )}
      />

      <View style={styles.bottomSectionCard}>
        <View style={styles.settingsHeader}>
          <AppText variant="caption" style={styles.settingsEyebrow}>
            Settings
          </AppText>
          <AppText variant="body" style={styles.settingsHeading}>
            App preferences
          </AppText>
          <AppText variant="caption" style={styles.settingsHint}>
            Manage model selection and theme options.
          </AppText>
        </View>
        <AppButton
          onPress={onOpenSettings}
          style={styles.settingsButton}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <View style={styles.settingsIconWrap}>
            <Ionicons name="settings-outline" size={16} color={appColors.icon.secondary} />
          </View>
          <AppText variant="body" style={styles.settingsText}>
            Settings
          </AppText>
          <View style={styles.settingsChevronWrap}>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={appColors.icon.secondary}
            />
          </View>
        </AppButton>
      </View>

      <AppDialog
        visible={!!pendingDeleteChatId}
        iconName="trash-outline"
        iconColor={appColors.icon.danger}
        title="Delete chat?"
        message="This will permanently remove this conversation."
        onClose={() => setPendingDeleteChatId(null)}
        primaryLabel="Delete"
        primaryVariant="danger"
        onPrimary={() => {
          if (!pendingDeleteChatId) return;
          onDeleteChat(pendingDeleteChatId);
          setPendingDeleteChatId(null);
        }}
      />
    </AppSlideDrawer>
  );
}
