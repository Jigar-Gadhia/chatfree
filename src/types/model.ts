// src/types/model.ts

export type Model = {
  id: string;
  name: string;
  sizeMB: number;
  url: string;
  format: "plain" | "qwen" | "chatml";
  nPredict: number;
  stop?: string[];
  systemPrompt?: string;
};

export type DownloadStatus = "idle" | "downloading" | "completed" | "cancelled";

export type DownloadState = {
  progress: number;
  status: DownloadStatus;
  uri?: string;
  resumable?: any;
};

export type ModelStore = {
  downloads: Record<string, DownloadState>;

  init: () => Promise<void>;
  downloadModel: (model: Model) => Promise<void>;
  persist: (downloads: Record<string, DownloadState>) => Promise<void>;
  cancelDownload: (modelId: string) => Promise<void>;
  loadPersisted: () => Promise<void>;
  removeModel: (modelId: string) => Promise<void>;
  selectedModelId: string | null;
  selectModel: (modelId: string) => void;
  isModelLoading: boolean;
  setIsModelLoading: (loading: boolean) => void;
};
