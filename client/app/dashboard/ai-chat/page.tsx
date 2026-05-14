import { Bot, SendHorizontal } from "lucide-react";

export default function AiChatPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">AI Chat</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#171717]">
          Ask questions in plain English.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#62584e]">
          Query uploaded spreadsheets, compare rows, summarize tabs, and find cleanup work.
        </p>

        <article className="mt-8 rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 p-5 shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
          <div className="rounded-xl border border-dashed border-[#d9d0c4] bg-[#fbfaf7] p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#f7f1e8] text-[#7c6f5b]">
              <Bot className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#1f2937]">
              No active chat.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#62584e]">
              Upload a spreadsheet first, then ask questions about rows, columns, trends, and
              cleanup tasks.
            </p>
          </div>

          <div className="mt-5 flex gap-2 rounded-lg border border-[#ded7cc] bg-[#fbfaf7] p-2">
            <input
              className="min-w-0 flex-1 bg-transparent px-2 text-sm font-medium outline-none placeholder:text-[#9a9186]"
              placeholder="Ask about a workbook..."
            />
            <button className="grid h-9 w-9 place-items-center rounded-md bg-[#1f2937] text-[#fbfaf7]">
              <SendHorizontal className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </article>
      </div>

      <aside className="rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 p-5 shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
        <h2 className="text-sm font-semibold text-[#1f2937]">Chat context</h2>
        <p className="mt-3 text-sm leading-6 text-[#62584e]">
          AI chat will become available once a file has been uploaded and processed.
        </p>
      </aside>
    </section>
  );
}
