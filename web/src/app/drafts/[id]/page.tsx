"use client";

import { ArrowLeft, CheckCircle2, FileText, RefreshCw, RotateCcw, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";

const initialDraft = `Most remote-job advice starts with the search filter. That is too late.\n\nBefore you apply, collect four kinds of proof: a project delivered without constant supervision, a written update that made work clearer, a decision you documented, and an example of handling feedback across distance or time zones.\n\nYour resume does not need to say “remote-ready”. It needs to make that judgement easier for the reader.`;

export default function DraftPage() {
  const [body, setBody] = useState(initialDraft);
  const [versions, setVersions] = useState(["v1 · First draft"]);
  const [instruction, setInstruction] = useState("");
  return (
    <AppShell current="pipeline">
      <Link href="/pipeline" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--blue)]"><ArrowLeft size={16} />Back to pipeline</Link>
      <header className="mt-5 border-b border-[var(--line)] pb-7"><p className="eyebrow">Instagram · Reel · Drafting</p><h1 className="mt-3 max-w-4xl font-[var(--font-serif)] text-4xl leading-tight tracking-[-.035em] sm:text-5xl">Remote-ready proof before the application form</h1></header>
      <div className="mt-7 grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)_260px]">
        <aside className="surface h-fit p-5"><p className="eyebrow">Approved brief</p><h2 className="mt-3 font-[var(--font-serif)] text-2xl">Applicant decision</h2><p className="subtle mt-3 text-sm leading-6">Prepare proof of async communication and self-directed delivery before targeting global remote roles.</p><h3 className="mt-6 text-sm font-bold">Evidence packet</h3><ul className="subtle mt-3 space-y-2 text-sm"><li>Primary remote-employer guidance</li><li>LinkedIn applicant conversations</li><li>Reddit listening themes</li></ul><a className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-[var(--blue)]" href="#"><FileText size={16} />Open research</a></aside>
        <section className="surface min-w-0 p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Draft v{versions.length}</p><h2 className="mt-2 font-[var(--font-serif)] text-3xl">Final copy or script</h2></div><span className="badge bg-[#edf7f0] text-[var(--green)]"><CheckCircle2 size={14} className="mr-1" />Sources attached</span></div><textarea value={body} onChange={(event) => setBody(event.target.value)} aria-label="Draft body" className="mt-6 min-h-[470px] w-full resize-y rounded-2xl border border-[var(--line)] bg-white p-5 leading-8 outline-none" /><label className="mt-5 block text-sm font-bold">Rewrite instruction<input value={instruction} onChange={(event) => setInstruction(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 font-normal" placeholder="Make the opening more direct without changing the evidence…" /></label><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="secondary-button" disabled={!instruction.trim()} onClick={() => { setVersions((current) => [...current, `v${current.length + 1} · Rewrite`]); setInstruction(""); }}><Sparkles size={16} />Rewrite</button><button type="button" className="secondary-button" onClick={() => setVersions((current) => [...current, `v${current.length + 1} · Recreated`])}><RefreshCw size={16} />Recreate</button><button type="button" className="primary-button ml-auto"><Send size={16} />Submit for review</button></div></section>
        <aside className="surface h-fit p-5"><p className="eyebrow">Version history</p><div className="mt-4 space-y-2">{versions.map((version, index) => <button type="button" key={version} className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-3 text-left text-sm font-bold ${index === versions.length - 1 ? "border-[var(--ink)] bg-[var(--surface-muted)]" : "border-[var(--line)]"}`}>{version}{index !== versions.length - 1 ? <RotateCcw size={14} /> : null}</button>)}</div><div className="mt-6 rounded-xl bg-[#fff8e9] p-4"><p className="text-xs font-bold text-[var(--amber)]">G6 next</p><p className="subtle mt-2 text-xs leading-5">Final material, one CTA, human narration and source links must be complete.</p></div></aside>
      </div>
    </AppShell>
  );
}
