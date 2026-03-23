import React from "react";
import { Alert, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { loadModel } from "../ai/llm";
import { useModelStore } from "../store/modelStore";
import { Model } from "../types/model";

type Props = {
  model: Model;
};

export default function ModelCard({ model }: Props) {
  const {
    downloads,
    downloadModel,
    cancelDownload,
    removeModel,
    selectModel,
    isModelLoading,
    setIsModelLoading,
    selectedModelId,
  } = useModelStore();
  const router = useRouter();

  const state = downloads[model.id];
  const isDownloading = state?.status === "downloading";
  const isDownloaded = state?.status === "completed";
  const progress = state?.progress ?? 0;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 14,
        backgroundColor: "#12121c",
        borderRadius: 16,
      }}
    >
      {/* 🔝 Top Row */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Icon */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            backgroundColor: "#6C5CE7",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 14,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>AI</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>
            {model.name}
          </Text>
          <Text style={{ color: "#aaa", marginTop: 2 }}>{model.sizeMB} MB</Text>
        </View>

        {/* Action */}
        {!state && (
          <TouchableOpacity
            onPress={() => downloadModel(model)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: "#6C5CE7",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Download</Text>
          </TouchableOpacity>
        )}

        {isDownloaded && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  setIsModelLoading(true);
                  await loadModel(state.uri!);
                  selectModel(model.id);
                  router.back();
                } catch (e) {
                  Alert.alert("Error", "Failed to load model");
                } finally {
                  setIsModelLoading(false);
                }
              }}
              disabled={isModelLoading}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedModelId === model.id ? "#4CAF50" : "#6C5CE7",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {isModelLoading && selectedModelId === model.id && (
                <ActivityIndicator size="small" color="white" style={{ marginRight: 6 }} />
              )}
              <Text style={{ color: "white", fontWeight: "600" }}>
                {selectedModelId === model.id ? "Active" : "Use Model"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert("Remove Model", "Delete this model?", [
                  { text: "Cancel" },
                  { text: "Delete", onPress: () => removeModel(model.id) },
                ])
              }
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: "#2a2a3a",
              }}
            >
              <Text style={{ color: "#ff6b6b", fontWeight: "600" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ⏳ Progress Section */}
      {isDownloading && (
        <View style={{ marginTop: 12 }}>
          {/* Progress Bar */}
          <View
            style={{
              height: 4,
              backgroundColor: "#2a2a3a",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                backgroundColor: "#6C5CE7",
              }}
            />
          </View>

          {/* Percentage */}
          <Text style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
            {(progress * 100).toFixed(0)}%
          </Text>

          {/* ❌ Cancel Button (Bottom Full Width) */}
          <TouchableOpacity
            onPress={() => cancelDownload(model.id)}
            style={{
              marginTop: 10,
              backgroundColor: "#1E1E2E",
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <Text style={{ color: "#ff6b6b", fontWeight: "500" }}>
              Cancel Download
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
