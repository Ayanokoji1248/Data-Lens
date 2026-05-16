"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Bot, FileText, Send, Table2, TerminalSquare } from "lucide-react";

import {
  authRequest,
  type ApiFileChatResponse,
  type ApiFilePreview,
  type ApiFileQueryResult,
  type ApiFileReportResponse,
} from "@/lib/api";

type WorkspaceTab = "sql" | "report" | "charts";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
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
  const [isChatSending, setIsChatSending] = useState(false);
  const [report, setReport] = useState<ApiFileReportResponse | null>(null);
  const [reportError, setReportError] = useState("");
  const [hasLoadedReport, setHasLoadedReport] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isReportGenerating, setIsReportGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Ask me about this sheet, or ask me to draft SQL for the current file.",
    },
  ]);

  const loadReport = useCallback(async () => {
    setReportError("");
    setIsReportLoading(true);

    try {
      const payload = await authRequest<ApiFileReportResponse | null>(
        `/api/files/${preview.file.id}/report`,
      );
      setReport(payload);
      setHasLoadedReport(true);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Could not load the report.");
    } finally {
      setIsReportLoading(false);
    }
  }, [preview.file.id]);

  useEffect(() => {
    if (activeTab === "report" && !hasLoadedReport && !isReportLoading) {
      loadReport();
    }
  }, [activeTab, hasLoadedReport, isReportLoading, loadReport]);

  async function generateReport() {
    setReportError("");
    setIsReportGenerating(true);

    try {
      const payload = await authRequest<ApiFileReportResponse>(
        `/api/files/${preview.file.id}/report`,
        {
          method: "POST",
        },
      );
      setReport(payload);
      setHasLoadedReport(true);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Could not generate the report.");
    } finally {
      setIsReportGenerating(false);
    }
  }

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

  async function sendChatMessage() {
    const trimmedInput = chatInput.trim();
    if (!trimmedInput || isChatSending) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: trimmedInput },
      { role: "assistant", content: "Thinking...", isLoading: true },
    ]);
    setChatInput("");
    setIsChatSending(true);

    try {
      const payload = await authRequest<ApiFileChatResponse>(
        `/api/files/${preview.file.id}/chat`,
        {
          method: "POST",
          body: JSON.stringify({
            message: trimmedInput,
          }),
        },
      );
      const content =
        payload.operation === "sql" && payload.sql
          ? `${payload.answer ?? "I drafted a safe read-only query for this file."}\n\n${payload.sql}`
          : payload.answer ?? "I can only answer questions about this file.";

      if (payload.sql) {
        setQuery(payload.sql);
        setActiveTab("sql");
      }

      setMessages((currentMessages) =>
        currentMessages.map((message, index) =>
          index === currentMessages.length - 1 && message.isLoading
            ? {
                role: "assistant",
                content,
              }
            : message,
        ),
      );
    } catch (err) {
      setMessages((currentMessages) =>
        currentMessages.map((message, index) =>
          index === currentMessages.length - 1 && message.isLoading
            ? {
                role: "assistant",
                content: err instanceof Error ? err.message : "AI chat failed. Please try again.",
              }
            : message,
        ),
      );
    } finally {
      setIsChatSending(false);
    }
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
        ) : activeTab === "report" ? (
          <ReportTab
            report={report}
            error={reportError}
            isLoading={isReportLoading}
            isGenerating={isReportGenerating}
            onGenerate={generateReport}
          />
        ) : (
          <div className="grid min-h-[28rem] place-items-center p-8 text-center">
            <div>
              <p className="text-lg font-semibold text-[#1f2937]">Chart workspace</p>
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
              className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-6 ${
                message.role === "assistant"
                  ? "bg-[#f7f1e8] text-[#62584e]"
                  : "bg-[#1f2937] text-[#fbfaf7]"
              }`}
            >
              {message.isLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8f8375]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8f8375] [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8f8375] [animation-delay:240ms]" />
                  <span className="ml-1">Thinking...</span>
                </span>
              ) : (
                message.content
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-[#e8dfd2] p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendChatMessage();
                }
              }}
              disabled={isChatSending}
              rows={3}
              className="thin-scrollbar h-24 min-w-0 flex-1 resize-none rounded-lg border border-[#ded7cc] bg-[#fffdf8] px-3 py-2 text-sm leading-5 text-[#292524] outline-none placeholder:text-[#9a9186] focus:border-[#8f8375] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Ask about rows, trends, or columns"
            />
            <button
              type="button"
              onClick={sendChatMessage}
              disabled={isChatSending}
              className="grid h-10 w-10 place-items-center rounded-lg bg-[#1f2937] text-[#fbfaf7] hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
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

function ReportTab({
  report,
  error,
  isLoading,
  isGenerating,
  onGenerate,
}: {
  report: ApiFileReportResponse | null;
  error: string;
  isLoading: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  if (isLoading) {
    return (
      <div className="grid min-h-[28rem] place-items-center p-8 text-center">
        <div>
          <div className="mx-auto h-8 w-8 animate-pulse rounded-lg bg-[#d6b65f]" />
          <p className="mt-4 text-sm font-semibold text-[#1f2937]">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report?.report) {
    return (
      <div className="grid min-h-[28rem] place-items-center p-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-[#1f2937] text-[#fbfaf7]">
            <FileText className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <p className="mt-4 text-lg font-semibold text-[#1f2937]">No report generated yet.</p>
          <p className="mt-2 text-sm leading-6 text-[#62584e]">
            Generate a stored report from this file&apos;s metadata and 50 sample rows. Future
            visits will load the saved report from the database.
          </p>
          {error ? (
            <p className="mt-4 rounded-lg border border-[#f0c7c2] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#9f2f2d]">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#1f2937] px-4 text-sm font-semibold text-[#fbfaf7] hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText className="h-4 w-4" strokeWidth={1.8} />
            {isGenerating ? "Generating..." : "Generate report"}
          </button>
        </div>
      </div>
    );
  }

  const limitations = report.report.sections.find(
    (section) => section.title.trim().toLowerCase() === "limitations",
  );
  const sections = report.report.sections.filter(
    (section) => section.title.trim().toLowerCase() !== "limitations",
  );

  return (
    <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
      <div className="border-b border-[#e8dfd2] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">
          Stored report
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#1f2937]">{report.report.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#62584e]">
          {report.report.executiveSummary}
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        {sections.map((section) => (
          <section key={section.title} className="border-b border-[#ede5d8] pb-4 last:border-0">
            <h3 className="text-sm font-semibold text-[#1f2937]">{section.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#62584e]">
              {section.content}
            </p>
          </section>
        ))}
        {limitations ? (
          <section className="rounded-lg border border-[#ded7cc] bg-[#f7f1e8] p-4">
            <h3 className="text-sm font-semibold text-[#1f2937]">{limitations.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#62584e]">
              {limitations.content}
            </p>
          </section>
        ) : null}
      </div>
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
