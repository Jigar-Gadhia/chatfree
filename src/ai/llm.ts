import { initLlama } from "llama.rn";
import { formatPrompt, MODELS } from "../data/models";

let llamaContext: any = null;

export const loadModel = async (path: string) => {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }

  llamaContext = await initLlama({
    model: path,
    n_ctx: 2048,
    n_threads: 4,
  });
};

export const isModelLoaded = () => llamaContext !== null;

export const stopGeneration = () => {
  if (llamaContext) {
    llamaContext.stopCompletion();
  }
};

export const generateStream = async (
  history: { role: "user" | "assistant"; text: string }[],
  modelId: string,
  onToken: (token: string) => void,
): Promise<void> => {
  if (!llamaContext) {
    throw new Error("Model not loaded");
  }

  const model = MODELS.find((m) => m.id === modelId);
  if (!model) throw new Error("Model not found");

  const formattedPrompt = formatPrompt(model, history);

  await llamaContext.completion(
    {
      prompt: formattedPrompt,
      n_predict: model.nPredict,
      temperature: 0.4,
      stop: model.stop || [],
    },
    (data: { token: string }) => {
      if (data.token) {
        onToken(data.token);
      }
    },
  );
};
