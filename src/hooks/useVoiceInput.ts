import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

const MIC_AUTO_STOP_MS = 2800;

export const useVoiceInput = (
  input: string,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  disabled: boolean
) => {
  const [isRecording, setIsRecording] = useState(false);
  const micBaseInputRef = useRef("");
  const micSilenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (micSilenceTimeoutRef.current) {
        clearTimeout(micSilenceTimeoutRef.current);
        micSilenceTimeoutRef.current = null;
      }
      Speech.stop();
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  const clearMicSilenceTimeout = useCallback(() => {
    if (!micSilenceTimeoutRef.current) return;
    clearTimeout(micSilenceTimeoutRef.current);
    micSilenceTimeoutRef.current = null;
  }, []);

  const scheduleMicSilenceTimeout = useCallback(() => {
    clearMicSilenceTimeout();
    micSilenceTimeoutRef.current = setTimeout(() => {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      micBaseInputRef.current = "";
      micSilenceTimeoutRef.current = null;
    }, MIC_AUTO_STOP_MS);
  }, [clearMicSilenceTimeout]);

  useSpeechRecognitionEvent("start", () => {
    setIsRecording(true);
    scheduleMicSilenceTimeout();
  });

  useSpeechRecognitionEvent("end", () => {
    clearMicSilenceTimeout();
    setIsRecording(false);
    micBaseInputRef.current = "";
  });

  useSpeechRecognitionEvent("result", (event) => {
    const results = event.results ?? [];
    const latestResult = results[results.length - 1];
    const transcript = latestResult?.transcript?.trim();
    if (!transcript) return;
    scheduleMicSilenceTimeout();

    const base = micBaseInputRef.current.trim();
    const nextInput = base ? `${base} ${transcript}` : transcript;
    setInput((current) => (current === nextInput ? current : nextInput));
  });

  useSpeechRecognitionEvent("error", () => {
    clearMicSilenceTimeout();
    setIsRecording(false);
    micBaseInputRef.current = "";
  });

  const handleToggleMic = useCallback(async () => {
    if (disabled) return;

    if (isRecording) {
      clearMicSilenceTimeout();
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      micBaseInputRef.current = "";
      return;
    }

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) return;
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) return;

    micBaseInputRef.current = input.trim();
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
    });
  }, [disabled, isRecording, input, clearMicSilenceTimeout]);

  const stopVoiceInput = useCallback(() => {
    if (isRecording) {
      clearMicSilenceTimeout();
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      micBaseInputRef.current = "";
    }
  }, [isRecording, clearMicSilenceTimeout]);

  return { isRecording, handleToggleMic, stopVoiceInput };
};
