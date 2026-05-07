# ChatFree

ChatFree is a local-first AI chat app built with Expo and React Native. It runs quantized GGUF models on-device with `llama.rn`, keeps chat history locally, and adds optional tools such as Wikipedia-backed web search, PDF context, voice input, text-to-speech, and theme customization.

## Features

- On-device LLM inference with `llama.rn`
- Downloadable local models from Hugging Face
- Offline chat after a model is downloaded
- Multi-chat history with local persistence
- Optional Wikipedia web search with source links
- PDF attachment support with local text extraction
- Voice input and assistant read-aloud
- Light, dark, and system theme modes
- Model picker, onboarding, settings, chat drawer, regenerate, edit, copy, and share flows

## Tech Stack

- Expo 54 and React Native 0.81
- Expo Router for navigation
- Zustand for app state
- `llama.rn` for local model execution
- Expo FileSystem and SecureStore for local persistence
- Expo Document Picker and PDF text extraction
- Expo Speech and Speech Recognition
- TypeScript and Expo ESLint

## Project Structure

```text
app/
  index.tsx          Main chat screen
  modelscreen.tsx    Model download and selection
  onboarding.tsx     First-run onboarding
  settings.tsx       Theme/settings screen

src/ai/
  llm.ts             llama.rn model loading and streaming generation
  webSearch.ts       Wikipedia search, dedupe, rerank, prompt grounding
  pdf.ts             PDF text extraction and chunking

src/components/
  chat/              Chat UI, composer, drawer, message rows, sources modal
  onboarding/        Onboarding screens
  ui/                Shared UI primitives

src/data/
  models.ts          Model catalog and prompt formatting entry point
  prompts.ts         System prompt presets

src/store/
  chatStore.ts       Chat sessions, streaming, persistence, edit/regenerate
  modelStore.ts      Model downloads, selection, loading
  settingsStore.ts   Theme preference persistence
  onboardingStore.ts Onboarding completion state

src/hooks/
  usePdfAttachments.ts
  useVoiceInput.ts
  useChatAutoScroll.ts
  useKeyboardHeight.ts
  useAppColors.ts

constants/theme.ts   Dark/light app palettes
```

## Models

The model catalog is defined in `src/data/models.ts`.

| Model | Size | Format | Best For |
| --- | ---: | --- | --- |
| Llama 3.2 1B Instruct | 808 MB | Llama 3 | Small, general local chat |
| Qwen2.5 1.5B Instruct | 1700 MB | Qwen/ChatML | General conversation and summarization |
| SmolLM2 1.7B Instruct | 1100 MB | ChatML | Fast on-device Q&A |
| Gemma 2 2B Instruct | 1600 MB | Gemma 2 | Reasoning and summarization |
| Phi-3.5 Mini Instruct | 2200 MB | Phi 3 | Reasoning, coding, detailed answers |

Models are downloaded into the app document directory and selected model metadata is stored with SecureStore.

## Web Search

Web search is optional and uses Wikipedia's REST search API:

- Query simplification for long prompts
- Result canonicalization and deduplication
- Lightweight relevance ranking
- Top results injected into the model prompt
- Source links attached to assistant messages

No search API key is required. Web search is the main path where user queries leave the device.

## PDF Chat

PDF attachments are selected with Expo Document Picker and parsed locally. The app extracts readable text, chunks it, and includes a bounded amount of document context in the next prompt. Attachments are cleared after sending.

## Voice

- Voice input uses `expo-speech-recognition`.
- Assistant read-aloud uses `expo-speech`.
- iOS microphone and speech recognition descriptions are configured in `app.json`.
- Android includes `RECORD_AUDIO`.

## Getting Started

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm run start
```

Run native builds:

```bash
npm run android
npm run ios
```

Fast Android install:

```bash
npm run android:fast
```

Build Android release APK:

```bash
npm run build-apk
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start` | Start Expo dev server |
| `npm run android` | Run Android native build |
| `npm run android:fast` | Install Android debug build with lint/tests skipped |
| `npm run ios` | Run iOS native build |
| `npm run web` | Start Expo web |
| `npm run lint` | Run Expo ESLint |
| `npm run build-apk` | Build Android release APK for arm64-v8a |
| `npm run build-all` | Build Android release APK for all configured architectures |

## Development Checks

```bash
npx tsc --noEmit
npm run lint
```

## Privacy Notes

- Local chat, model inference, PDF parsing, and settings are designed to stay on-device.
- Web search sends the search query to Wikipedia when enabled.
- Model downloads are fetched from Hugging Face URLs listed in `src/data/models.ts`.

## Platform Notes

- App scheme: `chatfree`
- Bundle/package id: `com.jiggs19.chatfree`
- Expo new architecture is enabled.
- UI follows the selected theme preference: system, light, or dark.

## License

This repository does not currently include a license file. Add one before distributing the project publicly.
