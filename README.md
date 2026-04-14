# ChatFree 🚀

A privacy-focused, offline-capable chat application built with React Native and Expo that runs local LLMs on-device. ChatFree enables secure conversations without sending your data to external servers, while also providing web search capabilities when needed.

## ✨ Features

- **Local LLM Integration**: Runs AI models directly on your device using [llama.rn](https://github.com/mbzuai-oryx/llama.rn)
- **Offline Capability**: Chat without internet connection once models are downloaded
- **Web Search**: Enhanced responses with real-time Wikipedia search integration (powered by REST API v1)
- **PDF Processing**: Upload and chat with PDF documents using local text extraction
- **Voice Input/Output**: Speech-to-text for input and text-to-speech for responses
- **Multiple Models**: Support for various quantized LLMs optimized for mobile devices
- **Cross-platform**: Works on both iOS and Android
- **Privacy First**: Your conversations never leave your device (except when using web search)

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **AI Engine**: llama.rn for on-device LLM execution
- **UI Components**: React Native elements with custom styling
- **Web Search**: Wikipedia REST API v1 integration with custom User-Agent identification
- **PDF Processing**: Expo PDF text extraction
- **Speech**: Expo Speech Recognition & Text-to-Speech

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Expo CLI
- For Android: Android Studio with emulator
- For iOS: Xcode with iOS Simulator (macOS only)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/chatfree.git
   cd chatfree
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Web Search Identification:
   Wikipedia's API requires a descriptive User-Agent. This is pre-configured in `src/ai/webSearch.ts`.

4. Start the development server:
   ```bash
   npx expo start
   # or with yarn
   yarn expo start
   ```

### Building for Production

For Android:

```bash
npx expo run:android
```

For iOS:

```bash
npx expo run:ios
```

## 🤖 Models

ChatFree comes with pre-configured models optimized for mobile performance:

- **Qwen2.5 1.5B Instruct** (1.7GB): Main chat model for conversation
- **Qwen3 Reranker 0.6B** (396MB): Used for re-ranking web search results

All models are downloaded locally and run on-device for maximum privacy.

## 🔍 Web Search Feature

ChatFree utilizes Wikipedia's modern REST API to provide grounded, factual information for your queries. This implementation prioritizes privacy and open data access.

1. **Wikipedia Integration**: Powered by the MediaWiki REST API v1 (`/w/rest.php/v1/search/page`).
2. **Privacy First**: No external search engine API keys are required. All information is retrieved from Wikipedia's public repositories.
3. **API Etiquette**: The application identifies itself via a custom User-Agent to ensure responsible API usage.

The web search pipeline includes:

- **Query Simplification**: Optimizes user queries for better Wikipedia search matching.
- **Content Pre-processing**: Clean extraction and HTML stripping for LLM compatibility.
- **Token-based Reranking**: Results are scored and sorted based on their relevance to the original query.

## 📄 PDF Chat

Upload PDF documents directly in the chat interface to:

- Extract text content locally
- Include document context in your queries
- Ask questions about specific documents

## 🎙️ Voice Features

- Tap the microphone button to start voice input
- Long-press to cancel recording
- Tap the speaker icon on messages to hear responses aloud

## 🎨 Customization

- **Themes**: Light, dark, or system preference
- **Model Selection**: Choose between different local models
- **Settings**: Accessible via the menu in the top-left corner

## 📱 Supported Platforms

- **iOS**: Requires iOS 13+
- **Android**: Requires Android 7+

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [llama.rn](https://github.com/mbzuai-oryx/llama.rn) for enabling on-device LLM execution
- [Expo](https://expo.dev) for the cross-platform framework
- [Hugging Face](https://huggingface.co) for hosting the quantized models
- [Wikipedia REST API](https://www.mediawiki.org/wiki/API:REST_API) for grounded factual data
- Built using the **Codex AI Coding Agent** for rapid development and implementation
