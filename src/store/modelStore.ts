// src/store/modelStore.ts

import { Directory, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { Model, ModelStore } from "../types/model";

const STORAGE_KEY = "downloads";

export const useModelStore = create<ModelStore>((set, get) => ({
  downloads: {},

  init: async () => {
    const modelDir = new Directory(Paths.document, "models");

    if (!(await modelDir.exists)) {
      await modelDir.create({ intermediates: true });
    }

    await get().loadPersisted();
  },

  loadPersisted: async () => {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEY);
      if (data) {
        set({ downloads: JSON.parse(data) });
      }
    } catch (e) {
      console.log("Load error", e);
    }
  },

  persist: async (downloads) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(downloads));
    } catch (e) {
      console.log("Persist error", e);
    }
  },

  downloadModel: async (model: Model) => {
    const modelDir = new Directory(Paths.document, "models");
    const fileUri = `${modelDir.uri}${model.id}.gguf`;

    const downloadResumable = FileSystem.createDownloadResumable(
      model.url,
      fileUri,
      {},
      (progress) => {
        const percent =
          progress.totalBytesWritten / progress.totalBytesExpectedToWrite;

        const updated = {
          ...get().downloads,
          [model.id]: {
            progress: percent,
            status: "downloading" as const,
            resumable: downloadResumable,
          },
        };

        set({ downloads: updated });
      },
    );

    // initial state
    set((state) => ({
      downloads: {
        ...state.downloads,
        [model.id]: {
          progress: 0,
          status: "downloading" as const,
          resumable: downloadResumable,
        },
      },
    }));

    try {
      await downloadResumable.downloadAsync();

      const updated = {
        ...get().downloads,
        [model.id]: {
          progress: 1,
          status: "completed" as const,
          uri: fileUri,
        },
      };

      set({ downloads: updated });
      await get().persist(updated);
    } catch (e) {
      console.log("Download error", e);
    }
  },

  cancelDownload: async (modelId: string) => {
    const download = get().downloads[modelId];

    if (download?.resumable) {
      await download.resumable.pauseAsync();
    }

    const updated = {
      ...get().downloads,
      [modelId]: {
        ...get().downloads[modelId],
        status: "cancelled" as const,
      },
    };

    set({ downloads: updated });
    await get().persist(updated);
  },

  removeModel: async (modelId: string) => {
    try {
      const fileUri = `${Paths.document.uri}models/${modelId}.gguf`;

      await FileSystem.deleteAsync(fileUri, {
        idempotent: true,
      });

      const updated = { ...get().downloads };
      delete updated[modelId];

      set({ downloads: updated });
      await get().persist(updated);
    } catch (e) {
      console.log("Delete error", e);
    }
  },
  selectedModelId: null,
  selectModel: (modelId) => {
    set({ selectedModelId: modelId });
  },
  isModelLoading: false,
  setIsModelLoading: (loading) => {
    set({ isModelLoading: loading });
  },
}));
