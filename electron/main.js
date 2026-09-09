'use strict';

const { app, BrowserWindow, ipcMain, screen, nativeImage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// ── Paths ─────────────────────────────────────────────────────────────────────
const rootDir      = path.join(__dirname, '..');
const llamaExe     = path.join(rootDir, 'deps', 'llama-cpp', 'llama-server.exe');
const pythonExe    = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
const agentScript  = path.join(rootDir, 'agent-server', 'agent.py');
const settingsPath = path.join(rootDir, 'agent-server', 'settings.json');
const storePath    = path.join(app.getPath('userData'), 'chats.json');

// ── Tiny local JSON "store" (no electron-store version issues) ─────────────────
const store = {
  _data: null,
  _load() {
    if (this._data) return this._data;
    try {
      this._data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    } catch {
      this._data = { chats: {} };
    }
    return this._data;
  },
  _save() {
    try {
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      fs.writeFileSync(storePath, JSON.stringify(this._data, null, 2), 'utf8');
    } catch (e) {
      console.error('[store] save failed:', e.message);
    }
  },
  get(key, defaultVal) {
    return this._load()[key] ?? defaultVal;
  },
  set(key, value) {
    this._load()[key] = value;
    this._save();
  },
};

// ── IPC Handlers ──────────────────────────────────────────────────────────────

// get-chats: returns all chats for a userId (stored as object keyed by chatId)
ipcMain.handle('get-chats', async (_event, userId) => {
  try {
    const allChats = store.get('chats', {});
    const uid = userId || 'default';
    const result = Object.values(allChats).filter(c => !userId || c.userId === uid);
    return { success: true, chats: result };
  } catch (e) {
    console.error('[IPC get-chats]', e.message);
    return { success: false, error: e.message, chats: [] };
  }
});

// pull-chats: same as get-chats for local-only mode; future: sync from Atlas
ipcMain.handle('pull-chats', async (_event, userId) => {
  try {
    const allChats = store.get('chats', {});
    const uid = userId || 'default';
    const result = Object.values(allChats).filter(c => !userId || c.userId === uid);
    return { success: true, chats: result };
  } catch (e) {
    console.error('[IPC pull-chats]', e.message);
    return { success: false, error: e.message, chats: [] };
  }
});

// save-chat: upserts a single chat object
ipcMain.handle('save-chat', async (_event, chatData) => {
  try {
    const allChats = store.get('chats', {});
    const id = chatData?.id || chatData?.chatId || String(Date.now());
    allChats[id] = { ...chatData, id };
    store.set('chats', allChats);
    return { success: true, id };
  } catch (e) {
    console.error('[IPC save-chat]', e.message);
    return { success: false, error: e.message };
  }
});

// delete-chat: removes chat by chatId
ipcMain.handle('delete-chat', async (_event, { chatId, userId }) => {
  try {
    const allChats = store.get('chats', {});
    delete allChats[chatId];
    store.set('chats', allChats);
    return { success: true };
  } catch (e) {
    console.error('[IPC delete-chat]', e.message);
    return { success: false, error: e.message };
  }
});

// trigger-snap-overlay: resize window to thin side-strip overlay
ipcMain.on('trigger-snap-overlay', (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    const overlayWidth = 420;
    win.setSize(overlayWidth, sh);
    win.setPosition(sw - overlayWidth, 0);
    win.setAlwaysOnTop(true, 'screen-saver');
  } catch (e) {
    console.error('[IPC trigger-snap-overlay]', e.message);
  }
});

// ── Child processes ───────────────────────────────────────────────────────────
const children = [];

function startProcess(label, executable, args, options = {}) {
  const child = spawn(executable, args, {
    env: {
      ...process.env,
      PYTHONUTF8: '1',
      PYTHONIOENCODING: 'utf-8',
      OPENBLAS_NUM_THREADS: '1',
    },
    ...options,
  });
  children.push(child);
  child.stdout?.on('data', (d) => process.stdout.write(`[${label}] ${d}`));
  child.stderr?.on('data', (d) => process.stderr.write(`[${label} ERR] ${d}`));
  child.on('error', (e) => console.error(`[${label}] Failed to start:`, e.message));
  child.on('close', (code) => console.log(`[${label}] exited with code ${code}`));
  return child;
}

function startServices() {
  // Determine if we're using a remote (cloud) model
  let useLocalModel = false; // default: cloud
  if (fs.existsSync(settingsPath)) {
    try {
      const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      useLocalModel =
        !s.model_server ||
        s.model_server.includes('127.0.0.1') ||
        s.model_server.includes('localhost');
    } catch (e) {
      console.error('[SETTINGS] Could not read settings:', e.message);
    }
  }

  if (!useLocalModel) {
    console.log('[LLAMA] Remote model configured — skipping local llama-server.');
  } else if (fs.existsSync(llamaExe)) {
    // Local llama-server start (legacy / optional)
    startProcess('LLAMA', llamaExe, [
      '--port', '11434',
      '--threads', '4',
      '--ctx-size', '512',
      '-np', '1',
    ]);
  } else {
    console.warn('[LLAMA] llama-server.exe not found — skipping.');
  }

  // Start Python agent
  const agentExecutable = fs.existsSync(pythonExe) ? pythonExe : 'python';
  console.log(`[AGENT] Starting with: ${agentExecutable}`);
  startProcess('AGENT', agentExecutable, [agentScript], { cwd: rootDir });
}

// ── Window ────────────────────────────────────────────────────────────────────
async function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  await win.loadURL('http://localhost:3000/');
  return win;
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  startServices();
  await createWindow();
});

app.on('before-quit', () => {
  for (const child of children) {
    try { if (!child.killed) child.kill(); } catch {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
