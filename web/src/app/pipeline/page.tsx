import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, Cloud, Search } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { demoPipeline } from "@/data/demo";

const columns = [
  { key: "validating", label: "Validating" },
  { key: "needs_review", label: "Needs review" },
  { key: "approved_topic", label: "Approved topic" },
  { key: "drafting", label: "Drafting" },
  { key: "review", label: "Review" },
  { key: "ready", label: "Ready" },
] as const;

export default function PipelinePage() {
  return (
    <AppShell current="pipeline">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="eyebrow">From evidence to final approval</p><h1 className="page-title mt-3">Pipeline</h1><p className="subtle mt-4 max-w-2xl leading-7">Every card shows its current gate. Nothing silently jumps from an idea to production.</p></div>
        <label className="flex min-h-12 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4"><Search size={17} className="text-[var(--muted)]" /><span className="sr-only">Search pipeline</span><input className="w-56 bg-transparent px-3 outline-none" placeholder="Search content" /></label>
      </header>
      <section aria-label="Content pipeline" className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {columns.map((column) => {
          const cards = demoPipeline.filter((item) => item.status === column.key);
          return (
            <section key={column.key} className="min-w-0">
              <div className="mb-3 flex items-center justify-between px-1"><h2 className="text-sm font-bold">{column.label}</h2><span className="badge">{cards.length}</span></div>
              <div className="space-y-3 rounded-[20px] bg-[#ebe4d8] p-2.5 min-h-40">
                {cards.length ? cards.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                    <div className="flex items-center justify-between gap-2"><span className="eyebrow">{item.channel}</span>{item.sync === "failed" ? <AlertTriangle size={16} className="text-red-700" /> : item.sync === "pending" ? <Clock3 size={16} className="text-[var(--amber)]" /> : <Cloud size={16} className="text-[var(--green)]" />}</div>
                    <h3 className="mt-4 font-[var(--font-serif)] text-xl leading-tight">{item.topic}</h3>
                    <p className="subtle mt-3 text-xs leading-5">{item.category} · {item.format}</p>
                    <Link href={`/drafts/${item.id}`} className="mt-5 flex min-h-11 items-center justify-between border-t border-[var(--line)] pt-3 text-sm font-bold text-[var(--blue)]">Open item <ArrowUpRight size={16} /></Link>
                  </article>
                )) : <div className="grid min-h-28 place-items-center text-center text-xs text-[var(--muted)]"><span><CheckCircle2 size={18} className="mx-auto mb-2 opacity-50" />Nothing waiting</span></div>}
              </div>
            </section>
          );
        })}
      </section>
    </AppShell>
  );
}
