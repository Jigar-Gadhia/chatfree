// // src/store/modelStore.ts

// import { Directory, Paths } from "expo-file-system";
// import * as FileSystem from "expo-file-system/legacy";
// import * as SecureStore from "expo-secure-store";
// import { create } from "zustand";
// import { Model, ModelStore } from "../types/model";

// const STORAGE_KEY = "downloads";

// export const useModelStore = create<ModelStore>((set, get) => ({
//   downloads: {},

//   init: async () => {
//     const modelDir = new Directory(Paths.document, "models");

//     if (!(await modelDir.exists)) {
//       await modelDir.create({ intermediates: true });
//     }

//     await get().loadPersisted();
//   },

//   loadPersisted: async () => {
//     try {
//       const data = await SecureStore.getItemAsync(STORAGE_KEY);
//       if (data) {
//         set({ downloads: JSON.parse(data) });
//       }
//     } catch (e) {
//       console.log("Load error", e);
//     }
//   },

//   persist: async (downloads) => {
//     try {
//       await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(downloads));
//     } catch (e) {
//       console.log("Persist error", e);
//     }
//   },

//   downloadModel: async (model: Model) => {
//     const modelDir = new Directory(Paths.document, "models");
//     const fileUri = `${modelDir.uri}${model.id}.gguf`;

//     const downloadResumable = FileSystem.createDownloadResumable(
//       model.url,
//       fileUri,
//       {},
//       (progress) => {
//         const percent =
//           progress.totalBytesWritten / progress.totalBytesExpectedToWrite;

//         const updated = {
//           ...get().downloads,
//           [model.id]: {
//             progress: percent,
//             status: "downloading" as const,
//             resumable: downloadResumable,
//           },
//         };

//         set({ downloads: updated });
//       },
//     );

//     // initial state
//     set((state) => ({
//       downloads: {
//         ...state.downloads,
//         [model.id]: {
//           progress: 0,
//           status: "downloading" as const,
//           resumable: downloadResumable,
//         },
//       },
//     }));

//     try {
//       await downloadResumable.downloadAsync();

//       const updated = {
//         ...get().downloads,
//         [model.id]: {
//           progress: 1,
//           status: "completed" as const,
//           uri: fileUri,
//         },
//       };

//       set({ downloads: updated });
//       await get().persist(updated);
//     } catch (e) {
//       console.log("Download error", e);
//     }
//   },

//   cancelDownload: async (modelId: string) => {
//     const download = get().downloads[modelId];

//     if (download?.resumable) {
//       await download.resumable.pauseAsync();
//     }

//     const updated = {
//       ...get().downloads,
//       [modelId]: {
//         ...get().downloads[modelId],
//         status: "cancelled" as const,
//       },
//     };

//     set({ downloads: updated });
//     await get().persist(updated);
//   },

//   removeModel: async (modelId: string) => {
//     try {
//       const fileUri = `${Paths.document.uri}models/${modelId}.gguf`;

//       await FileSystem.deleteAsync(fileUri, {
//         idempotent: true,
//       });

//       const updated = { ...get().downloads };
//       delete updated[modelId];

//       set({ downloads: updated });
//       await get().persist(updated);
//     } catch (e) {
//       console.log("Delete error", e);
//     }
//   },
//   selectedModelId: null,
//   selectModel: (modelId) => {
//     set({ selectedModelId: modelId });
//   },
//   isModelLoading: false,
//   setIsModelLoading: (loading) => {
//     set({ isModelLoading: loading });
//   },
// }));
// src/store/modelStore.ts

import { Directory, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { isModelLoaded, loadModel } from "../ai/llm";
import { Model, ModelStore } from "../types/model";

const STORAGE_KEY = "downloads";
const SELECTED_MODEL_KEY = "selected_model";

const logError = (tag: string, e: unknown) => {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  console.error(`[modelStore/${tag}]`, msg);
  return msg;
};

export const useModelStore = create<ModelStore>((set, get) => ({
  downloads: {},
  selectedModelId: null,
  isModelLoading: false,
  lastError: null,

  loadSelectedModel: async () => {
    const { selectedModelId, downloads } = get();

    if (!selectedModelId) return;

    if (isModelLoaded()) {
      console.log("Model already in memory");
      return;
    }

    const model = downloads[selectedModelId];

    if (!model || model.status !== "completed" || !model.uri) {
      console.log("Model not available locally");
      return;
    }

    try {
      set({ isModelLoading: true, lastError: null });

      await loadModel(model.uri); // 🔥 IMPORTANT

      set({ isModelLoading: false });
    } catch (e) {
      const msg = logError("loadSelectedModel", e);
      set({ isModelLoading: false, lastError: msg });
    }
  },

  // ---------------- INIT ----------------
  init: async () => {
    const modelDir = new Directory(Paths.document, "models");

    if (!(await modelDir.exists)) {
      await modelDir.create({ intermediates: true });
    }

    await get().loadPersisted();

    // 👇 load selected model
    try {
      const selected = await SecureStore.getItemAsync(SELECTED_MODEL_KEY);
      if (selected) {
        set({ selectedModelId: selected });
      }
    } catch (e) {
      console.log("Load selected model error", e);
    }
    await get().loadSelectedModel();
  },

  // ---------------- LOAD ----------------
  loadPersisted: async () => {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEY);
      if (data) {
        set({ downloads: JSON.parse(data) });
      }
    } catch (e) {
      logError("loadPersisted", e);
    }
  },

  // ---------------- SAVE ----------------
  persist: async (downloads) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(downloads));
    } catch (e) {
      logError("persist", e);
    }
  },

  // ---------------- DOWNLOAD ----------------
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

      if (get().downloads[model.id]?.status === "cancelled") {
        return;
      }

      const updated = {
        ...get().downloads,
        [model.id]: {
          progress: 1,
          status: "completed" as const,
          uri: fileUri,
        },
      };

      set({ downloads: updated, lastError: null });
      await get().persist(updated);
    } catch (e) {
      if (get().downloads[model.id]?.status === "cancelled") {
        return;
      }

      const msg = logError("downloadModel", e);
      set((state) => ({
        downloads: {
          ...state.downloads,
          [model.id]: {
            ...state.downloads[model.id],
            status: "failed" as const,
          },
        },
        lastError: msg,
      }));
    }
  },

  // ---------------- CANCEL ----------------
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

  // ---------------- REMOVE ----------------
  removeModel: async (modelId: string) => {
    try {
      const fileUri = `${Paths.document.uri}models/${modelId}.gguf`;

      await FileSystem.deleteAsync(fileUri, {
        idempotent: true,
      });

      const updated = { ...get().downloads };
      delete updated[modelId];

      const isSelected = get().selectedModelId === modelId;

      set({
        downloads: updated,
        selectedModelId: isSelected ? null : get().selectedModelId,
      });

      await get().persist(updated);

      // remove selected from storage if deleted
      if (isSelected) {
        await SecureStore.deleteItemAsync(SELECTED_MODEL_KEY);
      }
    } catch (e) {
      logError("removeModel", e);
    }
  },

  // ---------------- SELECT ----------------
  selectModel: async (modelId: string) => {
    set({ selectedModelId: modelId });

    try {
      await SecureStore.setItemAsync(SELECTED_MODEL_KEY, modelId);
    } catch (e) {
      console.log("Persist selected model error", e);
    }
  },

  // ---------------- LOADING ----------------
  setIsModelLoading: (loading) => {
    set({ isModelLoading: loading });
  },
}));
