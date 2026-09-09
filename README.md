<div align="center">

<img src="public/logo.png" alt="Airi Logo" width="80" />

# Airi

**Local-first AI desktop assistant for Windows**

Control your PC, automate apps, browse the web, and chat — all with natural language. Runs entirely on your machine.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.txt)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D4?logo=windows)](https://github.com/varshney-ansh/airi/releases)
[![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron)](https://electronjs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://python.org)

[Download](#-download) · [Quick Start](#-quick-start) · [Features](#-features) · [Contributing](#-contributing)

</div>

---

![Airi Screenshot](screenshots/1.png)

<div align="center">
  <img src="screenshots/2.png" width="32%" />
  <img src="screenshots/3.png" width="32%" />
  <img src="screenshots/4.png" width="32%" />
</div>

---

## ✨ Features

- **Natural language chat** — Streaming responses powered by Qwen3-VL-2B running locally, or connect to remote APIs (Gemini, OpenAI, Ollama, etc.)
- **Windows automation** — Launch, inspect, and control any installed app via FlaUI/UIA3
- **Browser automation** — Navigate Chrome, fill forms, extract data via Windows UI Automation (FlaUI)
- **File management** — List, open, copy, move, delete, search files with path aliases
- **Document & image analysis** — Upload PDFs, Word docs, images for instant RAG
- **Speech-to-text** — Real-time voice transcription via Whisper (faster-whisper)
- **Persistent memory** — Full CRUD memory management with semantic search (local Qdrant + mem0)
- **Thinking mode** — Extended reasoning for complex multi-step tasks
- **Quick access** — Spotlight-style overlay bar for instant commands
- **Chat library** — Browse, search, and manage your chat history
- **Installed apps browser** — View and launch installed Windows applications
- **Fully local option** — Run entirely on your machine with no cloud dependency (configure local model in Settings)
- **Remote LLM support** — Connect to Gemini, OpenAI, Ollama, OpenRouter, or any OpenAI-compatible API

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Desktop shell | Electron 40 |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| UI | Fluent UI, Framer Motion, Sonner, cmdk |
| Agent backend | Python, FastAPI, Qwen-Agent |
| LLM inference | llama.cpp (`llama-server`) or remote APIs |
| Vision model | Qwen3-VL-2B-Instruct |
| Embeddings | embeddinggemma-300m |
| Speech-to-text | faster-whisper (tiny) |
| Windows automation | FlaUI (UIA3) |
| Web search | SearXNG (bundled) |
| Vector DB | Qdrant (local, in-process) |
| Memory | mem0 (local) |
| Auth | Auth0 (Next.js SDK v4) |
| Database | MongoDB Atlas (user registration) + local JSON store |

---

## 📦 Download

Grab the latest installer from [Releases](https://github.com/varshney-ansh/airi/releases):

```
Airi-Setup-0.1.0.exe   (~574 MB, includes llama.cpp + all deps)
```

Silent install (for scripting / Microsoft Store):
```
Airi-Setup-0.1.0.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
```

---

## 🚀 Quick Start

### Prerequisites

- Windows 10 (1809+) or Windows 11, x64
- Node.js v18+
- Python 3.10+
- Git

### 1. Clone

```bash
git clone https://github.com/vinay7349/Airi
cd airi
```

### 2. Environment

```bash
cp .env.example .env.local
# Fill in AUTH0_CLIENT_SECRET, AUTH0_SECRET, and your MongoDB credentials
```

If `.env.example` doesn't exist, create `.env.local` with:

```
AUTH0_CLIENT_SECRET=your_auth0_secret
AUTH0_SECRET=your_next_auth_secret
APP_BASE_URL=http://localhost:3000
```

For the Auth0 Regular Web Application, configure these URLs in the Auth0 dashboard:

- Allowed Callback URLs: `http://localhost:3000/auth/callback`
- Allowed Logout URLs: `http://localhost:3000`

The app uses the official Auth0 Next.js SDK v4 server routes through `src/proxy.js`:
`/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile`, and `/auth/access-token`.

### 3. Install dependencies

```bash
npm install

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Start the LLM server

```bash
# llama.cpp binaries are included in deps/llama-cpp/
deps\llama-cpp\llama-server.exe ^
  -hf Qwen/Qwen3-VL-2B-Instruct-GGUF:Q4_K_M ^
  --port 11434 --ctx-size 32768 --jinja
```

> Models are cached to `models/` on first run. Swap for any OpenAI-compatible GGUF.

### 5. Run

```bash
.venv\Scripts\activate
npm run dev
```

The app opens automatically. The Next.js dev server runs on `http://localhost:3000`.

---

## 📁 Project Structure

```
airi/
├── agent-server/
│   ├── agent.py          # FastAPI server + Qwen-Agent + all tools + Whisper STT
│   ├── flaui.py          # FlaUI Windows automation engine
│   ├── win.py            # Windows utility helpers
│   ├── settings.json     # Runtime LLM/theme configuration
│   ├── ChromeNavigator.md # Chrome navigation skill reference
│   ├── WindowsAutomator.md # Windows automation skill reference
│   ├── FileManager.md    # File management skill reference
│   └── agent.spec        # PyInstaller spec for bundling
├── electron/
│   ├── main.js           # Electron entry — spawns llama-server, agent
│   ├── preload.js        # Context bridge (chat IPC, overlay, quick bar)
│   └── model-download.js # Auto model download on first launch
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── page.jsx      # Main chat dashboard
│   │   ├── app/[chatId]/ # Individual chat by ID
│   │   ├── login/        # Auth0 login + onboarding
│   │   ├── library/      # Chat history library
│   │   ├── memory/       # Memory management page
│   │   ├── apps/         # Installed apps browser
│   │   ├── quick/        # Spotlight-style quick access bar
│   │   └── api/          # API routes (agent proxy, summarize)
│   ├── component/        # App-specific components
│   │   ├── chatMain/     # Chat interface + streaming + agent loader
│   │   ├── chatInput/    # Input bar with file upload
│   │   ├── chatItem/     # Message bubbles
│   │   ├── messageRefenceComponent/ # Attachment display
│   │   ├── FluentClientProvider.jsx # Fluent UI theme wrapper
│   │   ├── LogoMark.jsx  # Airi logo
│   │   └── appsidebar.jsx # Sidebar with nav, settings, chat list
│   ├── context/          # React context (ChatContext)
│   ├── hooks/            # Custom hooks (use-mobile)
│   ├── lib/              # Auth0, MongoDB, avatar, API helpers
│   ├── schemas/          # User schema definitions
│   └── types/            # TypeScript type definitions
├── ui-components/        # Reusable design system
│   ├── components/       # Apps, Library, Memory, Settings, Login
│   └── hooks/            # Theme hooks (Day/Night)
├── workspace/tools/      # Document parser placeholders
├── installer/
│   ├── airi-installer.iss  # Inno Setup script
│   └── build-installer.bat
├── scripts/              # Build helper scripts
├── deps/
│   ├── llama-cpp/        # llama.cpp Windows binaries
│   ├── searxng/          # Bundled SearXNG search engine
│   └── flaui/            # FlaUI .NET assemblies
├── public/               # Icons, fonts
├── requirements.txt      # Python dependencies
└── package.json
```

---

## 🧰 Agent Tools

The agent (`agent-server/agent.py`) exposes these tools to the LLM:

| Tool | Description |
|---|---|
| `windows_launch` | Launch any installed Windows app |
| `windows_inspect` | Get UI element tree of a running app |
| `windows_do` | Execute batch UI actions (click, type, key, scroll, read_screen, screenshot, etc.) |
| `file_op` | File system operations (list, open, copy, move, delete, create_folder, search) |
| `list_installed_apps` | Query the pre-built app index |
| `add_memory` | Save a fact to long-term memory |
| `search_memories` | Semantic search over stored memories |
| `get_memories` | Retrieve all memories for the current user |
| `get_memory` | Get a single memory by ID |
| `update_memory` | Update an existing memory |
| `delete_memory` | Delete a specific memory |
| `delete_all_memories` | Clear all memories for the current user |

**Additional API endpoints** (FastAPI, not LLM tools):

| Endpoint | Description |
|---|---|
| `POST /transcribe` | Whisper STT — transcribe audio files |
| `WS /ws/transcribe` | Real-time WebSocket audio transcription |
| `POST /upload` | Upload documents and images for RAG |
| `GET /library` | List uploaded files |
| `GET/PUT/DELETE /memories` | REST API for memory CRUD |
| `GET /settings` | Read current settings |
| `POST /settings` | Update settings |
| `GET /health` | Health check |

---

## ⚙️ Configuration

### LLM Settings

Edit `agent-server/settings.json` (created on first run) or use the in-app Settings panel:

```json
{
  "model_server": "https://generativelanguage.googleapis.com/v1beta/openai/",
  "model": "gemini-2.5-flash",
  "api_key": "",
  "thinking_enabled": false,
  "theme": "Night"
}
```

**To run fully locally**, point `model_server` to your local llama-server:

```json
{
  "model_server": "http://127.0.0.1:11434/v1",
  "model": "default",
  "api_key": "none",
  "thinking_enabled": true,
  "theme": "Night"
}
```

**Supported remote APIs**: Google Gemini, OpenAI, OpenRouter, Ollama, or any OpenAI-compatible endpoint. When a remote API is configured, the local llama-server will not start.

### Memory

Memories are stored locally in `%APPDATA%\Airi\.mem0_db` (Qdrant, in-process). Chat history is stored in `%APPDATA%\Airi\chats.json`. Nothing is sent to the cloud unless you configure a remote LLM API.

---

## 🏗 Building

### Development build
```bash
npm run dev
```

### Production Electron build
```bash
npm run build:electron
```

### Microsoft Store (APPX) package
```bash
npm run build:msix
```

### MSI installer
```bash
npm run build:msi
```

### Inno Setup installer (requires [Inno Setup 6](https://jrsoftware.org/isdl.php))
```bash
npm run build:inno
# or
installer\build-installer.bat
```

### NSIS installer
```bash
npm run build:installer
```

### Bundle Python agent
```bash
cd agent-server
pyinstaller agent.spec
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes and test with `npm run dev`
3. Follow [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add X"`
4. Open a Pull Request against `main`

For bugs, open an [issue](https://github.com/varshney-ansh/airi/issues) with steps to reproduce.

---

## 📄 License

[MIT](LICENSE.txt) — © 2026 Slew Inc.
#   A i r i  
 