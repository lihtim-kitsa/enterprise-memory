"use client";

import { useEffect, useMemo, useState } from "react";

const EXAMPLE_EVENTS = [
  {
    type: "status",
    message: "Loading EnterpriseMemory graph...",
    ts: "2026-05-12T09:01:14Z",
  },
  {
    type: "context",
    message: "Slack + Notion + Drive + Gmail synced.",
    ts: "2026-05-12T09:01:20Z",
  },
  {
    type: "answer",
    message:
      "Pricing decisions in Q1 focused on tiered volume discounts and a revised enterprise onboarding fee.",
    ts: "2026-05-12T09:01:29Z",
  },
  {
    type: "citations",
    message:
      "Notion: Q1 Strategy 2026-02-12 | Slack: #pricing 2026-03-08 | Email: Finance recap 2026-03-29",
    ts: "2026-05-12T09:01:38Z",
  },
];

const GRAPH_NODES = [
  { label: "Pricing Decision", meta: "Decision · Q1" },
  { label: "Arun Mehta", meta: "Finance" },
  { label: "NovaLine", meta: "Product" },
  { label: "Slack #pricing", meta: "Thread" },
  { label: "Notion / Q1 Strategy", meta: "Doc" },
];

const GRAPH_EDGES = [
  "Arun Mehta → Pricing Decision",
  "Pricing Decision → NovaLine",
  "Pricing Decision → Slack #pricing",
  "Pricing Decision → Notion / Q1 Strategy",
];

export default function Home() {
  const [theme, setTheme] = useState("light");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [stream, setStream] = useState<{ type: string; message: string; ts: string }[]>(
    EXAMPLE_EVENTS
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("em-theme");
    if (stored === "dark") {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => window.clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("em-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!debouncedQuery) {
      setStream(EXAMPLE_EVENTS);
      return;
    }
    const eventSource = new EventSource("http://localhost:4000/events");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string;
          message: string;
          ts: string;
        };
        setStream((prev) => [...prev, data]);
      } catch {
        return;
      }
    };
    eventSource.addEventListener("done", () => {
      eventSource.close();
    });
    return () => {
      eventSource.close();
    };
  }, [debouncedQuery]);

  const summary = useMemo(() => {
    if (!debouncedQuery) {
      return "Type a question to stream answers with citations.";
    }
    return `Streaming results for “${debouncedQuery}”.`;
  }, [debouncedQuery]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(15,76,92,0.25),_transparent_50%),radial-gradient(circle_at_20%_70%,_rgba(196,93,50,0.22),_transparent_45%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_60%)]" />
      <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(15,76,92,0.24),transparent_70%)] blur-3xl" />
      <header className="z-10 flex items-center justify-between px-6 pt-6 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--accent)] shadow-[var(--shadow)]">
            EM
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              EnterpriseMemory
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Living knowledge, with provenance
            </p>
          </div>
        </div>
        <button
          className="rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text)] shadow-[var(--shadow)]"
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </header>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-20 sm:px-10">
        <section className="flex w-full max-w-4xl animate-[rise_0.8s_ease-out] flex-col items-center gap-10 text-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--text-muted)]">
              Data & Intelligence
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-[var(--text)] sm:text-5xl">
              Ask your company anything.
              <span className="block bg-[linear-gradient(120deg,var(--accent),var(--warning))] bg-[length:200%_200%] bg-clip-text text-transparent animate-[shimmer_6s_linear_infinite]">
                Every answer comes with receipts.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
              EnterpriseMemory ingests Slack, Notion, Drive, and email to build a living
              knowledge graph. Query decisions, owners, and historical context in seconds.
            </p>
          </div>
          <div className="w-full rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:p-6">
            <div className="flex flex-col gap-3 rounded-[20px] border border-transparent bg-[var(--surface-strong)] px-5 py-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Query
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <input
                  className="w-full flex-1 bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
                  placeholder="What decisions were made about pricing in Q1?"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button
                  className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--accent-strong)]"
                  type="button"
                >
                  Ask
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--text-muted)]">
              <span className="rounded-full border border-[var(--surface-border)] px-3 py-1">
                Slack · Notion · Drive · Gmail
              </span>
              <span className="rounded-full border border-[var(--surface-border)] px-3 py-1">
                Hybrid search + graph traversal
              </span>
              <span className="rounded-full border border-[var(--surface-border)] px-3 py-1">
                Streaming answers with citations
              </span>
            </div>
          </div>
          <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                title: "Provenance first",
                description:
                  "Every response includes a citation trail across Slack, Notion, Drive, and email.",
              },
              {
                title: "Decision memory",
                description:
                  "Capture decisions as graph nodes linked to their originating conversations.",
              },
              {
                title: "Onboarding ready",
                description:
                  "New hires get instant context with graph-backed, relational answers.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 text-left shadow-[var(--shadow)]"
              >
                <h3 className="text-lg font-semibold text-[var(--text)]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
          <div className="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 text-left shadow-[var(--shadow)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Live Response
                </p>
                <span className="rounded-full border border-[var(--surface-border)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  SSE stream
                </span>
              </div>
              <p className="mt-4 text-sm text-[var(--text-muted)]">{summary}</p>
              <div className="mt-4 space-y-3">
                {stream.map((item, index) => (
                  <div
                    key={`${item.type}-${index}`}
                    className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-strong)] p-4"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      <span>{item.type}</span>
                      <span>{new Date(item.ts).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text)]">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 text-left shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Knowledge Graph Snapshot
              </p>
              <div className="mt-4 space-y-4">
                {GRAPH_NODES.map((node) => (
                  <div
                    key={node.label}
                    className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-strong)] p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--text)]">{node.label}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{node.meta}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-strong)] p-4 text-xs text-[var(--text-muted)]">
                {GRAPH_EDGES.map((edge) => (
                  <p key={edge}>{edge}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
