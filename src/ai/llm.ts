import { initLlama } from "llama.rn";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { formatPrompt, MODELS } from "../data/models";

const LLAMA_3_STOP = [
  "<|eot_id|>",
  "<|end_of_text|>",
  "<|start_header_id|>",
  "<|end_header_id|>",
];

let llamaContext: any = null;

interface LlamaDeviceConfig {
  n_ctx: number;
  n_threads: number;
  n_batch: number;
  n_gpu_layers: number;
  flash_attn: boolean;
  use_mmap: boolean;
  use_mlock: boolean;
  // rope_freq_base: number;
}

// export const getDeviceOptimizedConfig =
//   async (): Promise<LlamaDeviceConfig> => {
//     const totalMemory = await DeviceInfo.getTotalMemory();

//     const isLowRam =
//       Platform.OS === "android" ? DeviceInfo.isLowRamDevice() : false;

//     const ramGB = totalMemory / 1024 / 1024 / 1024;

//     // CPU estimation heuristic
//     let estimatedCores = 4;

//     if (ramGB >= 12) {
//       estimatedCores = 8;
//     } else if (ramGB >= 8) {
//       estimatedCores = 6;
//     } else if (ramGB >= 4) {
//       estimatedCores = 4;
//     } else {
//       estimatedCores = 2;
//     }

//     const isLowEnd = ramGB <= 4 || isLowRam;
//     const isHighEnd = ramGB > 8;

//     return {
//       // safer context
//       n_ctx: isLowEnd ? 1024 : isHighEnd ? 4096 : 2048,

//       // conservative threading
//       n_threads: Math.max(2, estimatedCores - 2),

//       // huge source of crashes
//       n_batch: isLowEnd ? 64 : isHighEnd ? 256 : 128,

//       // Android GPU offloading unstable on many devices
//       n_gpu_layers: Platform.OS === "ios" ? (isLowEnd ? 8 : 35) : 0,

//       // disable on Android first
//       flash_attn: Platform.OS === "ios" && !isLowEnd,

//       use_mmap: true,

//       // NEVER true on Android
//       use_mlock: false,

//       rope_freq_base: 500000,
//     };
//   };

export const getDeviceOptimizedConfig =
  async (): Promise<LlamaDeviceConfig> => {
    const totalMemory = await DeviceInfo.getTotalMemory();

    const ramGB = totalMemory / 1024 / 1024 / 1024;

    const isLowRam =
      Platform.OS === "android" ? await DeviceInfo.isLowRamDevice() : false;

    const lowEnd = ramGB <= 4 || isLowRam;

    const midRange = ramGB > 4 && ramGB <= 8;

    const highEnd = ramGB > 8;

    return {
      // CONTEXT
      n_ctx: lowEnd ? 1024 : highEnd ? 4096 : 2048,

      // THREADS
      n_threads: lowEnd ? 4 : highEnd ? 8 : 6,

      // BATCH
      n_batch: lowEnd ? 64 : highEnd ? 256 : 128,

      // GPU OFFLOAD
      n_gpu_layers:
        Platform.OS === "ios"
          ? highEnd
            ? 40
            : 20
          : lowEnd
            ? 0
            : highEnd
              ? 24
              : 12,

      // ATTENTION
      flash_attn: !lowEnd,

      // MEMORY
      use_mmap: true,

      use_mlock: false,
    };
  };

export const loadModel = async (path: string) => {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }

  const deviceConfig = await getDeviceOptimizedConfig();

  llamaContext = await initLlama({
    model: path,
    ...deviceConfig,
  });

  console.log("✅ Model loaded with device-optimized config");
};

export const isModelLoaded = () => llamaContext !== null;

export const stopGeneration = () => {
  llamaContext?.stopCompletion();
};

export const generateStream = async (
  history: { role: "user" | "assistant"; text: string }[],
  modelId: string,
  onToken: (token: string) => void,
): Promise<void> => {
  if (!llamaContext) throw new Error("Model not loaded");

  const model = MODELS.find((m) => m.id === modelId);
  if (!model) throw new Error("Model not found");

  const formattedPrompt = formatPrompt(model, history);

  // await llamaContext.completion(
  //   {
  //     prompt: formattedPrompt,
  //     n_predict: model.nPredict ?? 512,
  //     temperature: 0.7,
  //     top_p: 0.9, // ✅ was 0.95 — tighter is better on 1B
  //     top_k: 40,
  //     min_p: 0.05, // ✅ added — prunes implausible tokens, great for 1B
  //     repeat_penalty: 1.1,
  //     repeat_last_n: 64, // ✅ added — window for repeat_penalty to look back
  //     stop: [...LLAMA_3_STOP, ...(model.stop ?? [])], // ✅ full stop token set
  //   },
  //   (data: { token: string }) => {
  //     if (data.token) onToken(data.token);
  //   },
  // );

  let buffer = "";

  await llamaContext.completion(
    {
      prompt: formattedPrompt,
      n_predict: model.nPredict ?? 512,
      temperature: 0.7,
      top_p: 0.9, // ✅ was 0.95 — tighter is better on 1B
      top_k: 40,
      min_p: 0.05, // ✅ added — prunes implausible tokens, great for 1B
      repeat_penalty: 1.1,
      repeat_last_n: 64, // ✅ added — window for repeat_penalty to look back
      stop: [...LLAMA_3_STOP, ...(model.stop ?? [])], // ✅ full stop token set
    },
    (data: { token: string }) => {
      if (!data.token) return;

      buffer += data.token;

      if (buffer.length >= 32) {
        onToken(buffer);
        buffer = "";
      }
    },
  );

  if (buffer.length > 0) {
    onToken(buffer);
  }
};
