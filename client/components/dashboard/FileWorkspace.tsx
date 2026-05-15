"use client";

import { useState } from "react";
import { BarChart3, Bot, FileText, Send, Table2, TerminalSquare } from "lucide-react";

import { authRequest, type ApiFilePreview, type ApiFileQueryResult } from "@/lib/api";

type WorkspaceTab = "sql" | "report" | "charts";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type FileWorkspaceProps = {
  preview: ApiFilePreview;
};

const tabs: Array<{ id: WorkspaceTab; label: string; icon: typeof TerminalSquare }> = [
  { id: "sql", label: "SQL Editor", icon: TerminalSquare },
  { id: "report", label: "Report", icon: FileText },
  { id: "charts", label: "Charts", icon: BarChart3 },
];

function formatCellValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getPreviewColumns(preview: ApiFilePreview) {
  return preview.columns.map((column) => ({
    label: column.originalName,
    key: column.storedName,
  }));
}

export function FileWorkspace({ preview }: FileWorkspaceProps) {
  const previewColumns = getPreviewColumns(preview);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("sql");
  const [query, setQuery] = useState("SELECT * FROM current_file LIMIT 20");
  const [resultColumns, setResultColumns] = useState(previewColumns);
  const [resultRows, setResultRows] = useState(preview.rows);
  const [queryError, setQueryError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Ask me about this sheet. The AI endpoint will be connected next.",
    },
  ]);

  async function runQuery() {
    setQueryError("");
    setIsRunning(true);

    try {
      const payload = await authRequest<ApiFileQueryResult>(
        `/api/files/${preview.file.id}/query`,
        {
          method: "POST",
          body: JSON.stringify({
            query,
            limit: 20,
          }),
        },
      );
      const columns =
        payload.columns.length > 0
          ? payload.columns.map((column) => ({ label: column, key: column }))
          : resultColumns;
      setResultColumns(columns);
      setResultRows(payload.rows);
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : "Query failed. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }

  function sendChatMessage() {
    const trimmedInput = chatInput.trim();
    if (!trimmedInput) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: trimmedInput },
      {
        role: "assistant",
        content: "AI chat is ready in the interface; the backend answer endpoint comes next.",
      },
    ]);
    setChatInput("");
  }

  return (
    <div className="grid gap-5 xl:h-[calc(100vh-13rem)] xl:min-h-[34rem] xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex min-w-0 flex-col rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 shadow-[0_18px_50px_rgba(65,50,35,0.04)] xl:min-h-0">
        <div className="border-b border-[#e8dfd2] px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                  activeTab === id
                    ? "bg-[#1f2937] text-[#fbfaf7]"
                    : "bg-[#f7f1e8] text-[#62584e] hover:bg-[#eee6d8]"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "sql" ? (
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="overflow-hidden rounded-xl border border-[#2f352f] bg-[#171717] shadow-[0_18px_60px_rgba(23,23,23,0.12)]">
              <div className="flex items-center justify-between border-b border-[#2f352f] bg-[#20211f] px-4 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d96b5f]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d6b65f]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6e9f72]" />
                </div>
                <label
                  className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#b8b1a8]"
                  htmlFor="sql-editor"
                >
                  current_file.sql
                </label>
              </div>
              <div className="grid grid-cols-[3rem_minmax(0,1fr)]">
                <div
                  aria-hidden="true"
                  className="select-none border-r border-[#2f352f] bg-[#1d1e1c] px-3 py-4 text-right font-mono text-sm leading-6 text-[#77736d]"
                >
                  {query.split("\n").map((_, index) => (
                    <div key={index}>{index + 1}</div>
                  ))}
                </div>
                <textarea
                  id="sql-editor"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="thin-scrollbar min-h-44 w-full resize-none bg-[#171717] p-4 font-mono text-sm leading-6 text-[#fbfaf7] caret-[#d6b65f] outline-none placeholder:text-[#9a9186]"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-[#78716c]">
                Write read-only SELECT queries against `current_file`. Results are capped for
                safety.
              </p>
              <button
                type="button"
                onClick={runQuery}
                disabled={isRunning}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1f2937] px-4 text-sm font-semibold text-[#fbfaf7] hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TerminalSquare className="h-4 w-4" strokeWidth={1.8} />
                {isRunning ? "Running..." : "Run query"}
              </button>
            </div>
            {queryError ? (
              <p className="mt-3 rounded-lg border border-[#f0c7c2] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#9f2f2d]">
                {queryError}
              </p>
            ) : null}
            <ResultTable columns={resultColumns} rows={resultRows} />
          </div>
        ) : (
          <div className="grid min-h-[28rem] place-items-center p-8 text-center">
            <div>
              <p className="text-lg font-semibold text-[#1f2937]">
                {activeTab === "report" ? "Report builder" : "Chart workspace"}
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#62584e]">
                This tab is reserved for the next pass. The file data is ready in DuckDB.
              </p>
            </div>
          </div>
        )}
      </section>

      <aside className="flex min-h-[34rem] flex-col rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 shadow-[0_18px_50px_rgba(65,50,35,0.04)] xl:min-h-0">
        <div className="border-b border-[#e8dfd2] p-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#1f2937] text-[#fbfaf7]">
              <Bot className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1f2937]">AI chat</h2>
              <p className="text-xs text-[#78716c]">Ask questions about this file</p>
            </div>
          </div>
        </div>
        <div className="thin-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-xl px-3 py-2 text-sm leading-6 ${
                message.role === "assistant"
                  ? "bg-[#f7f1e8] text-[#62584e]"
                  : "bg-[#1f2937] text-[#fbfaf7]"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <div className="border-t border-[#e8dfd2] p-4">
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendChatMessage();
                }
              }}
              className="min-w-0 flex-1 rounded-lg border border-[#ded7cc] bg-[#fffdf8] px-3 text-sm text-[#292524] outline-none placeholder:text-[#9a9186] focus:border-[#8f8375]"
              placeholder="Ask about rows, trends, or columns"
            />
            <button
              type="button"
              onClick={sendChatMessage}
              className="grid h-10 w-10 place-items-center rounded-lg bg-[#1f2937] text-[#fbfaf7] hover:bg-[#111827]"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ResultTable({
  columns,
  rows,
}: {
  columns: Array<{ label: string; key: string }>;
  rows: Record<string, unknown>[];
}) {
  return (
    <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#ded7cc] bg-[#fffdf8]">
      <div className="flex items-center justify-between border-b border-[#e8dfd2] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1f2937]">
          <Table2 className="h-4 w-4" strokeWidth={1.8} />
          Output
        </div>
        <span className="text-xs text-[#78716c]">{rows.length} rows</span>
      </div>
      <div className="thin-scrollbar min-h-0 flex-1 overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#f7f1e8] text-xs uppercase tracking-[0.08em] text-[#7c6f5b]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ede5d8]">
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="max-w-[240px] truncate whitespace-nowrap px-4 py-3 text-[#292524]"
                  >
                    {formatCellValue(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#78716c]">No rows returned.</p>
        ) : null}
      </div>
    </div>
  );
}
