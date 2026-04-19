// import { initLlama } from "llama.rn";
// import { formatPrompt, MODELS } from "../data/models";

// let llamaContext: any = null;

// export const loadModel = async (path: string) => {
//   if (llamaContext) {
//     await llamaContext.release();
//     llamaContext = null;
//   }

//   llamaContext = await initLlama({
//     model: path,
//     n_ctx: 2048,
//     n_threads: 4,
//   });
// };

// export const isModelLoaded = () => llamaContext !== null;

// export const stopGeneration = () => {
//   if (llamaContext) {
//     llamaContext.stopCompletion();
//   }
// };

// export const generateStream = async (
//   history: { role: "user" | "assistant"; text: string }[],
//   modelId: string,
//   onToken: (token: string) => void,
// ): Promise<void> => {
//   if (!llamaContext) {
//     throw new Error("Model not loaded");
//   }

//   const model = MODELS.find((m) => m.id === modelId);
//   if (!model) throw new Error("Model not found");

//   const formattedPrompt = formatPrompt(model, history);

//   await llamaContext.completion(
//     {
//       prompt: formattedPrompt,
//       n_predict: model.nPredict,
//       temperature: 0.65,
//       stop: model.stop || [],
//     },
//     (data: { token: string }) => {
//       if (data.token) {
//         onToken(data.token);
//       }
//     },
//   );
// };
import { initLlama } from "llama.rn";
import { formatPrompt, MODELS } from "../data/models";

const LLAMA_3_STOP = [
  "<|eot_id|>",
  "<|end_of_text|>",
  "<|start_header_id|>",
  "<|end_header_id|>",
];

let llamaContext: any = null;

export const loadModel = async (path: string) => {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }

  llamaContext = await initLlama({
    model: path,
    n_ctx: 4096, // ✅ was 1024 (mistakenly "increased" — actually halved)
    n_threads: 4,
    n_batch: 512, // ✅ added — faster prompt ingestion
    n_gpu_layers: 99, // ✅ was false — true = fp16 KV cache (less VRAM)
    use_mlock: false,
    use_mmap: true,
    flash_attn: true, // ✅ added — cuts memory bandwidth per token
    rope_freq_base: 500000, // ✅ added — matches Meta's Llama 3.2 official config
  });

  console.log("✅ Llama 3.2 1B model loaded");
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
      if (data.token) onToken(data.token);
    },
  );
};
