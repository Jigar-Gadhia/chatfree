// src/types/model.ts

export type ModelFormat =
  | "llama3"
  | "qwen"
  | "gemma2"
  | "phi3"
  | "plain"
  | "chatml";

export type ResponseStyle = "concise" | "detailed" | "code" | "step-by-step";

export interface ResponseFormatConfig {
  maxSentences?: number;
  preferMarkdown: boolean;
  codeBlocksEnabled: boolean;
  bulletPointsEnabled: boolean;
  style: ResponseStyle;
}

export type Model = {
  id: string;
  name: string;
  sizeMB: number;
  url: string;
  format: ModelFormat;
  nPredict: number;
  recommendation?: string;
  features?: string[];
  stop?: string[];
  systemPrompt?: string;
  responseFormat: ResponseFormatConfig; // 🆕 Explicit format config
  contextLength: number; // 🆕 Track context limits
  bosToken?: string; // 🆕 Beginning of sequence
  eosToken?: string; // 🆕 End of sequence
};

export type DownloadStatus =
  | "idle"
  | "downloading"
  | "completed"
  | "cancelled"
  | "failed";

export type DownloadState = {
  progress: number;
  status: DownloadStatus;
  uri?: string;
  resumable?: any;
};

export type ModelStore = {
  downloads: Record<string, DownloadState>;
  lastError: string | null;

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
  loadSelectedModel: () => Promise<void>;
};
