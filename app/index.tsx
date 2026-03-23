// src/screens/ChatScreen.tsx

import { MODELS } from "@/src/data/models";
import { useChatStore } from "@/src/store/chatStore";
import { useModelStore } from "@/src/store/modelStore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import AnimatedKeyboardView from "@/src/components/AnimatedKeyboardView";
import ScreenContainer from "@/src/components/ScreenContainer";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from "expo-router";

export default function ChatScreen() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, loading, streaming, clearChat, stopStreaming } = useChatStore();
  const { selectedModelId, init, isModelLoading } = useModelStore();
  const router = useRouter();
  const flatListRef = React.useRef<FlatList>(null);

  // ✅ Removed installedModels filter logic from here

  useEffect(() => {
    init();
  }, []);

  // ✅ Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // ✅ Get readable name
  const getModelName = (id: string) => {
    const model = MODELS.find((m) => m.id === id);
    return model?.name || id;
  };

  // ✅ Send handler
  const handleSend = async () => {

    if (!selectedModelId) {
      router.push("/modelscreen");
      return;
    }
    if (!input.trim()) return;

    setInput("");
    Keyboard.dismiss();
    await sendMessage(input);
  };

  console.log("selectedModelId", selectedModelId);

  return (
    <ScreenContainer title="Chat">
      {/* 🔝 Model Info / Selection */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: "#161622",
          borderBottomWidth: 1,
          borderBottomColor: "#1f1f2e",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: selectedModelId ? "#4CAF50" : "#ff6b6b",
              marginRight: 8,
            }}
          />
          <Text style={{ color: "#aaa", fontSize: 13 }} numberOfLines={1}>
            {selectedModelId
              ? `Using ${getModelName(selectedModelId)}`
              : "No model selected"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/modelscreen")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              backgroundColor: "#1E1E2E",
            }}
          >
            <Ionicons name="settings-outline" size={14} color="#6C5CE7" style={{ marginRight: 4 }} />
            <Text style={{ color: "#6C5CE7", fontSize: 12, fontWeight: "600" }}>
              Models
            </Text>
          </TouchableOpacity>

          {messages.length > 0 && (
            <TouchableOpacity
              onPress={clearChat}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: "#1E1E2E",
              }}
            >
              <Ionicons name="trash-outline" size={14} color="#ff6b6b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 💬 Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyboardShouldPersistTaps='handled'
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E1E2E', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="chatbubbles-outline" size={40} color="#6C5CE7" />
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
              Start Chatting
            </Text>
            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 }}>
              {selectedModelId
                ? "Type something below to start a conversation with the AI."
                : "First, select a model to start talking."}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isUser = item.role === "user";
          const isLastAssistant =
            !isUser &&
            index === messages.length - 1 &&
            streaming;
          return (
            <View
              style={{
                flexDirection: 'row',
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "85%",
                marginVertical: 4,
                alignItems: 'flex-end',
              }}
            >
              {!isUser && (
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#6C5CE7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="sparkles" size={14} color="white" />
                </View>
              )}
              <View
                style={{
                  backgroundColor: isUser ? "#6C5CE7" : "#1E1E2E",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 18,
                  borderBottomRightRadius: isUser ? 4 : 18,
                  borderBottomLeftRadius: isUser ? 18 : 4,
                }}
              >
                <Text style={{ color: "white", fontSize: 15, lineHeight: 20 }}>
                  {item.text}{isLastAssistant ? <Text style={{ color: '#6C5CE7' }}>{'|'}</Text> : null}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* ✍️ Input */}
      <AnimatedKeyboardView>
        <View
          style={{
            flexDirection: "row",
            padding: 10,
            borderTopWidth: 1,
            borderColor: "#222",
            backgroundColor: "#0f0f1a",
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={selectedModelId ? "Ask something..." : "Select a model to start..."}
            placeholderTextColor="#888"
            multiline
            style={{
              flex: 1,
              backgroundColor: "#1E1E2E",
              color: "white",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingTop: 10,
              paddingBottom: 10,
              minHeight: 44,
              maxHeight: 120,
            }}
            editable={!isModelLoading && !streaming}
          />

          <TouchableOpacity
            onPress={streaming ? stopStreaming : handleSend}
            disabled={isModelLoading}
            style={{
              marginLeft: 10,
              width: 44,
              height: 44,
              backgroundColor: streaming ? "#ff6b6b" : "#6C5CE7",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 12,
              opacity: isModelLoading ? 0.5 : 1,
            }}
          >
            <Ionicons
              name={streaming ? "stop-circle" : (selectedModelId ? "send" : "settings-outline")}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </AnimatedKeyboardView>

      {/* ⏳ Loading / Model Loading only (not while streaming — tokens handle that) */}
      {(loading || isModelLoading) && !streaming && (
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          alignItems: 'flex-start',
          flexDirection: 'row',
          backgroundColor: '#0f0f1a',
        }}>
          <View style={{
            backgroundColor: '#1E1E2E',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            borderBottomLeftRadius: 2,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#222',
          }}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#aaa" />
            <Text style={{ color: "#aaa", fontSize: 12, marginLeft: 8 }}>
              {isModelLoading ? "Loading engine..." : "Thinking..."}
            </Text>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
