<div align="center">

<img src="public/logo.png" alt="Airi Logo" width="96" />

# Airi

### Local-first AI desktop assistant for Windows

Control your PC, automate applications, browse the web, manage files, and chat with AI — using natural language.

<p>
  <a href="https://github.com/vinay7349/Airi/releases"><img src="https://img.shields.io/badge/Download-Releases-2ea44f?style=for-the-badge" alt="Download"></a>
  <a href="LICENSE.txt"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"></a>
  <a href="https://github.com/vinay7349/Airi"><img src="https://img.shields.io/badge/Platform-Windows-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Windows"></a>
</p>

<p>
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#building">Building</a> ·
  <a href="#contributing">Contributing</a>
</p>

</div>

---

## Overview

Airi is a Windows desktop AI assistant designed around a **local-first** architecture. It combines a modern Electron + Next.js interface with a Python agent backend that can interact with Windows applications, files, browsers, documents, memory, and local or remote language models.

> **Local-first:** Airi can run completely on your machine when a local model is configured. Remote LLM providers are also supported when you choose to use them.

## Screenshots

<div align="center">
  <img src="public/screenshots/screenshot1.png" alt="Airi main interface" width="92%" />
</div>

<br />

<div align="center">
  <img src="public/screenshots/screenshot2.png" alt="Airi screenshot 2" width="30%" />
  <img src="public/screenshots/screenshot3.png" alt="Airi screenshot 3" width="30%" />
  <img src="public/screenshots/screenshot4.png" alt="Airi screenshot 4" width="30%" />
</div>

## Features

| Capability | What it does |
|---|---|
| 💬 **Natural language chat** | Streaming responses with Qwen3-VL-2B locally or remote APIs such as Gemini, OpenAI, Ollama, and more. |
| 🖥️ **Windows automation** | Launch, inspect, and control installed applications using FlaUI/UIA3. |
| 🌐 **Browser automation** | Navigate Chrome, fill forms, and extract information through Windows UI automation. |
| 📁 **File management** | List, open, copy, move, delete, create folders, and search files. |
| 📄 **Document & image analysis** | Upload PDFs, Word documents, and images for RAG-based analysis. |
| 🎙️ **Speech-to-text** | Real-time transcription using Whisper via faster-whisper. |
| 🧠 **Persistent memory** | Store, search, update, and delete memories using local Qdrant + mem0. |
| 🧩 **Thinking mode** | Extended reasoning for complex, multi-step tasks. |
| ⚡ **Quick access** | Spotlight-style overlay for fast commands. |
| 📚 **Chat library** | Browse, search, and manage chat history. |
| 📦 **Installed apps browser** | View and launch applications installed on Windows. |
| 🔒 **Fully local option** | Run without cloud dependency by using a local model. |
| 🔌 **Remote LLM support** | Connect to Gemini, OpenAI, OpenRouter, Ollama, or another OpenAI-compatible API. |

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Electron 40 |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| UI | Fluent UI, Framer Motion, Sonner, cmdk |
| Agent backend | Python, FastAPI, Qwen-Agent |
| LLM inference | llama.cpp (`llama-server`) or remote APIs |
| Vision model | Qwen3-VL-2B-Instruct |
| Embeddings | embeddinggemma-300m |
| Speech-to-text | faster-whisper (tiny) |
| Windows automation | FlaUI (UIA3) |
| Web search | SearXNG (bundled) |
| Vector database | Qdrant (local, in-process) |
| Memory | mem0 (local) |
| Authentication | Auth0 (Next.js SDK v4) |
| Database | MongoDB Atlas + local JSON store |

## Download

Get the latest Windows installer from the [GitHub Releases](https://github.com/vinay7349/Airi/releases) page.

**Current installer**

```text
Airi-Setup-0.1.0.exe
(~574 MB — includes llama.cpp and required dependencies)
```

For a silent installation:

```powershell
Airi-Setup-0.1.0.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
```

## Quick Start

### Prerequisites

- Windows 10 (1809+) or Windows 11, x64
- Node.js 18+
- Python 3.10+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/vinay7349/Airi.git
cd Airi
```

### 2. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then configure your Auth0 and MongoDB values.

If `.env.example` is not available, create `.env.local` with:

```env
AUTH0_CLIENT_SECRET=your_auth0_secret
AUTH0_SECRET=your_next_auth_secret
APP_BASE_URL=http://localhost:3000
```

For Auth0, configure:

- **Allowed Callback URL:** `http://localhost:3000/auth/callback`
- **Allowed Logout URL:** `http://localhost:3000`

Airi uses the Auth0 Next.js SDK v4 routes exposed through `src/proxy.js`:

```text
/auth/login
/auth/logout
/auth/callback
/auth/profile
/auth/access-token
```

### 3. Install dependencies

```powershell
npm install

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Start the local LLM server

The repository includes llama.cpp binaries under `deps/llama-cpp/`.

```powershell
deps\llama-cpp\llama-server.exe `
  -hf Qwen/Qwen3-VL-2B-Instruct-GGUF:Q4_K_M `
  --port 11434 --ctx-size 32768 --jinja
```

The model is cached in `models/` on first use. You can also replace it with another OpenAI-compatible GGUF model.

### 5. Start Airi

```powershell
.venv\Scripts\activate
npm run dev
```

The development app starts on:

```text
http://localhost:3000
```

## Architecture

Airi is organized into three main layers:

```text
┌──────────────────────────────────────────────┐
│              Electron Desktop App            │
│        Windows shell + IPC + overlays        │
└───────────────────────┬──────────────────────┘
                        │
┌───────────────────────▼──────────────────────┐
│             Next.js / React UI               │
│   Chat · Library · Memory · Apps · Settings  │
└───────────────────────┬──────────────────────┘
                        │
┌───────────────────────▼──────────────────────┐
│             Python Agent Server              │
│ FastAPI · Qwen-Agent · FlaUI · Whisper · RAG │
└──────────────────────────────────────────────┘
```

### Project structure

```text
Airi/
├── agent-server/          # Python agent, tools, Windows automation, STT
├── electron/              # Electron main process, preload, model download
├── src/                   # Next.js application
│   ├── app/               # Pages, authentication, API routes
│   ├── component/         # Chat and application components
│   ├── context/           # React context
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Auth0, MongoDB, API helpers
│   ├── schemas/           # Data schemas
│   └── types/             # Type definitions
├── ui-components/         # Reusable UI and theme components
├── workspace/tools/       # Document parser placeholders
├── installer/             # Windows installer configuration
├── scripts/               # Build helpers
├── deps/                  # llama.cpp, SearXNG, FlaUI dependencies
├── public/                # Images, icons, and fonts
├── requirements.txt       # Python dependencies
└── package.json           # Node.js scripts and dependencies
```

## Agent Tools

The Python agent exposes the following tools to the LLM:

| Tool | Purpose |
|---|---|
| `windows_launch` | Launch an installed Windows application. |
| `windows_inspect` | Inspect the UI element tree of a running application. |
| `windows_do` | Perform UI actions such as click, type, key, scroll, screenshot, and screen reading. |
| `file_op` | Perform file-system operations such as list, open, copy, move, delete, create-folder, and search. |
| `list_installed_apps` | Query the installed Windows application index. |
| `add_memory` | Save a fact to long-term memory. |
| `search_memories` | Search memories semantically. |
| `get_memories` | Retrieve the current user's memories. |
| `get_memory` | Retrieve one memory by ID. |
| `update_memory` | Update an existing memory. |
| `delete_memory` | Delete one memory. |
| `delete_all_memories` | Clear all memories for the current user. |

### Additional API endpoints

| Endpoint | Purpose |
|---|---|
| `POST /transcribe` | Transcribe uploaded audio with Whisper. |
| `WS /ws/transcribe` | Real-time audio transcription. |
| `POST /upload` | Upload documents and images for RAG. |
| `GET /library` | List uploaded files. |
| `GET/PUT/DELETE /memories` | Memory CRUD API. |
| `GET /settings` | Read application settings. |
| `POST /settings` | Update application settings. |
| `GET /health` | Health check. |

## Configuration

### LLM configuration

Airi reads runtime LLM settings from `agent-server/settings.json`, or from the in-app Settings panel.

#### Remote model example

```json
{
  "model_server": "https://generativelanguage.googleapis.com/v1beta/openai/",
  "model": "gemini-2.5-flash",
  "api_key": "",
  "thinking_enabled": false,
  "theme": "Night"
}
```

#### Fully local example

```json
{
  "model_server": "http://127.0.0.1:11434/v1",
  "model": "default",
  "api_key": "none",
  "thinking_enabled": true,
  "theme": "Night"
}
```

Supported remote providers include **Google Gemini, OpenAI, OpenRouter, Ollama**, and other OpenAI-compatible endpoints.

### Local data

Airi stores local application data under `%APPDATA%\Airi`:

```text
.mem0_db    → local Qdrant / memory data
chats.json  → chat history
```

Cloud communication occurs only when you configure a remote LLM API.

## Building

### Development

```bash
npm run dev
```

### Production Electron build

```bash
npm run build:electron
```

### Microsoft Store package

```bash
npm run build:msix
```

### MSI installer

```bash
npm run build:msi
```

### Inno Setup installer

Requires [Inno Setup 6](https://jrsoftware.org/isdl.php).

```bash
npm run build:inno
```

Or:

```powershell
installer\build-installer.bat
```

### NSIS installer

```bash
npm run build:installer
```

### Bundle the Python agent

```bash
cd agent-server
pyinstaller agent.spec
```

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

```bash
# Create a feature branch
git checkout -b feat/your-feature

# Test your changes
npm run dev

# Use Conventional Commits
git commit -m "feat: add X"
```

Then open a pull request against `main`.

For bugs, please [open an issue](https://github.com/vinay7349/Airi/issues) and include clear reproduction steps.

## License

Airi is released under the [MIT License](LICENSE.txt).

<div align="center">

**Built with Electron, Next.js, Python, and local AI.**

</div>
