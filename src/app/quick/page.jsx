"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { callAgentAPI } from "@/lib/agent-api";
import LogoMark from "@/component/LogoMark";
import { ArrowUp24Regular, Dismiss24Regular, Stop16Regular, Search24Regular } from "@fluentui/react-icons";

const SUGGESTIONS = [
    { icon: "🌐", label: "Open Chrome" },
    { icon: "📁", label: "List files on my Desktop" },
    { icon: "🔍", label: "Search the web for AI news" },
    { icon: "🧠", label: "Remember I like dark mode" },
];

// Keep the prompt short — this is a quick-access bar, not the full chat
const MAX_HISTORY = 6;

export default function QuickPage() {
    const [query, setQuery] = useState("");
    const [turns, setTurns] = useState([]); // { role: "user"|"assistant", text, tool? }
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState("");

    const inputRef = useRef(null);
    const scrollRef = useRef(null);
    const abortRef = useRef(null);
    const historyRef = useRef([]); // last messages sent to the agent (plain role/content)
    const assistantTextRef = useRef(""); // accumulates the reply currently streaming

    const isElectron = typeof window !== "undefined" && window.electronAPI?.isElectron === true;

    // ── Spotlight window events ────────────────────────────────────────────
    useEffect(() => {
        inputRef.current?.focus();
        if (!isElectron) return;
        // Re-focus + preselect whenever the bar pops up (Alt+Space)
        window.electronAPI.onQuickShown?.(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        });
    }, [isElectron]);

    // Keep the answer area pinned to the bottom while streaming
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [turns, streaming]);

    const submit = useCallback(async (raw) => {
        const prompt = (typeof raw === "string" ? raw : query).trim();
        if (!prompt || streaming) return;

        setError("");
        setQuery("");
        setTurns((t) => [...t, { role: "user", text: prompt }, { role: "assistant", text: "" }]);
        setStreaming(true);

        const controller = new AbortController();
        abortRef.current = controller;
        assistantTextRef.current = "";

        await callAgentAPI({
            prompt,
            history: historyRef.current.slice(-MAX_HISTORY),
            userId: "default_user",
            chatId: "quick_session",
            signal: controller.signal,
            onTextChunk: (chunk) => {
                assistantTextRef.current += chunk;
                setTurns((t) => {
                    const next = [...t];
                    next[next.length - 1] = { ...next[next.length - 1], text: next[next.length - 1].text + chunk };
                    return next;
                });
            },
            onToolCall: ({ tool }) => {
                setTurns((t) => {
                    const next = [...t];
                    next[next.length - 1] = { ...next[next.length - 1], tool };
                    return next;
                });
            },
            onComplete: () => {
                setStreaming(false);
                historyRef.current = [
                    ...historyRef.current,
                    { role: "user", content: prompt },
                    { role: "assistant", content: assistantTextRef.current },
                ].slice(-MAX_HISTORY);
                setTurns((t) => {
                    const next = [...t];
                    const last = next[next.length - 1];
                    if (last?.role === "assistant") next[next.length - 1] = { ...last, tool: undefined };
                    return next;
                });
            },
            onError: (e) => {
                setStreaming(false);
                if (e?.name === "AbortError") return; // user pressed Stop
                setError(e?.message || "Something went wrong.");
            },
        });
    }, [query, streaming]);

    const stop = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStreaming(false);
    }, []);

    // ── Keyboard: Enter sends, Esc clears/hides ────────────────────────────
    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            if (streaming) { stop(); return; }
            if (query) { setQuery(""); return; }
            if (isElectron) window.electronAPI.hideQuick?.();
        }
    };

    const lastAssistant = turns.length && turns[turns.length - 1].role === "assistant" ? turns[turns.length - 1] : null;
    const waiting = streaming && lastAssistant && !lastAssistant.text;

    return (
        <div style={{ width: "100vw", height: "100vh", background: "transparent", display: "flex", padding: 8, boxSizing: "border-box" }}>
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--bg-modal)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 16,
                    boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                    overflow: "hidden",
                    minHeight: 0,
                }}
            >
                {/* ── Search input row ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: turns.length ? "1px solid var(--border-default)" : "none" }}>
                    <LogoMark collapsed />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Ask Airi anything…"
                        autoFocus
                        spellCheck={false}
                        style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: "var(--text-primary)",
                            fontSize: 16,
                            fontFamily: "var(--font-body)",
                        }}
                    />
                    {streaming ? (
                        <button
                            onClick={stop}
                            title="Stop"
                            style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-card)", color: "var(--text-muted)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}
                        >
                            <Stop16Regular /> Stop
                        </button>
                    ) : (
                        <button
                            onClick={() => submit()}
                            disabled={!query.trim()}
                            title="Send (Enter)"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", background: query.trim() ? "var(--accent-blue)" : "var(--bg-card)", color: query.trim() ? "#fff" : "var(--text-muted)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: query.trim() ? "pointer" : "default" }}
                        >
                            <ArrowUp24Regular />
                        </button>
                    )}
                </div>

                {/* ── Content area ── */}
                <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 18px", minHeight: 0 }}>
                    {turns.length === 0 && (
                        <div>
                            <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 10 }}>Try asking…</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s.label}
                                        onClick={() => submit(s.label)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            background: "var(--bg-card)",
                                            color: "var(--text-primary)",
                                            border: "1px solid var(--border-default)",
                                            borderRadius: 999,
                                            padding: "6px 12px",
                                            fontSize: 13,
                                            cursor: "pointer",
                                        }}
                                    >
                                        <span>{s.icon}</span> {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {turns.map((t, i) =>
                        t.role === "user" ? (
                            <div key={i} style={{ display: "flex", justifyContent: "flex-end", margin: "10px 0 6px" }}>
                                <div style={{ background: "var(--bg-card)", color: "var(--text-primary)", borderRadius: "12px 12px 4px 12px", padding: "8px 12px", fontSize: 14, maxWidth: "80%", whiteSpace: "pre-wrap" }}>
                                    {t.text}
                                </div>
                            </div>
                        ) : (
                            <div key={i} style={{ margin: "6px 0" }}>
                                {t.tool && (
                                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                        <Search24Regular style={{ width: 12, height: 12 }} /> using {t.tool}…
                                    </div>
                                )}
                                {t.text && (
                                    <div style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                                        {t.text}
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {waiting && (
                        <div style={{ color: "var(--text-muted)", fontSize: 13, margin: "8px 0" }}>
                            Thinking<span className="animate-pulse">…</span>
                        </div>
                    )}

                    {error && (
                        <div style={{ color: "#e04b4b", fontSize: 13, margin: "8px 0" }}>⚠️ {error}</div>
                    )}
                </div>

                {/* ── Footer hint ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", borderTop: "1px solid var(--border-default)", color: "var(--text-muted)", fontSize: 11 }}>
                    <span>Alt+Space to toggle · Esc to close</span>
                    <span>Enter to send</span>
                </div>
            </div>
        </div>
    );
}
