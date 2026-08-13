"use client";

import { ArrowUpRight, Check, ChevronRight, FileUp, Link2, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { demoIdeas, type DemoIdea } from "@/data/demo";
import type { Channel } from "@/domain/content-system";

const channelLabels: Record<Channel, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
};

export default function IdeasPage() {
  const [ideas, setIdeas] = useState(demoIdeas);
  const [channel, setChannel] = useState<Channel>("instagram");
  const [period, setPeriod] = useState<"today" | "week" | "saved">("today");
  const [drawer, setDrawer] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const apiMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "true";
  const wall = useMemo(
    () => ideas.filter((idea) => idea.channel === channel && idea.status === "surfaced"),
    [ideas, channel],
  );

  useEffect(() => {
    if (!apiMode) return;
    const status = period === "saved" ? "saved" : "surfaced";
    fetch(`/api/ideas/generate?status=${status}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load ideas.");
        return result as { ideas: Array<Record<string, unknown>> };
      })
      .then(({ ideas: records }) => setIdeas(records.map((record) => ({
        id: String(record.id),
        channel: record.channel as Channel,
        topic: String(record.topic),
        approach: String(record.approach),
        category: String(record.category),
        format: String(record.format),
        whyNow: String(record.whyNow || "Current research direction"),
        evidence: String(record.evidenceSummary || "See the attached evidence packet."),
        sources: [...new Set(((record.sources as Array<{ sourceGroup: string }> | undefined) || []).map((source) => source.sourceGroup))],
        gates: ["G1 prelim pass", record.productLed ? "G2 required" : "G2 n/a"],
        status: record.status as DemoIdea["status"],
        g9Passed: Boolean(record.g9Passed),
      }))))
      .catch((error: Error) => setNotice(error.message))
      .finally(() => setLoading(false));
  }, [apiMode, period]);

  async function updateIdea(id: string, status: DemoIdea["status"], message: string) {
    if (apiMode) {
      const action = status === "validating" ? "approve" : status === "saved" ? "save" : "reject";
      const response = await fetch(`/api/ideas/${id}/${action}`, { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: action === "approve" ? JSON.stringify({}) : undefined });
      const result = await response.json();
      if (!response.ok) { setNotice(result.error || result.reasons?.join(" ") || "The action failed."); return; }
    }
    setIdeas((current) => current.map((idea) => (idea.id === id ? { ...idea, status } : idea)));
    setNotice(message);
  }

  return (
    <AppShell current="ideas">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="eyebrow">Daily evidence-led directions</p>
          <h1 className="page-title mt-3">Idea wall</h1>
          <p className="subtle mt-4 max-w-2xl text-base leading-7">
            Four qualified directions per channel. Approve only the exact treatment you want researched and drafted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="secondary-button" type="button"><Search size={17} />Search archive</button>
          <button className="primary-button" type="button" onClick={() => setDrawer(true)}><Plus size={17} />Generate from context</button>
        </div>
      </header>

      {notice ? (
        <div role="status" className="mt-6 flex items-center justify-between rounded-xl border border-[#b9d1c3] bg-[#edf7f0] px-4 py-3 text-sm text-[var(--green)]">
          <span className="flex items-center gap-2"><Check size={17} />{notice}</span>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-black/5" onClick={() => setNotice(null)} aria-label="Dismiss notice"><X size={16} /></button>
        </div>
      ) : null}

      <section className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-fit gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1" aria-label="Idea period">
            {(["today", "week", "saved"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setPeriod(value)} className={`min-h-10 rounded-full px-4 text-sm font-bold capitalize ${period === value ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"}`}>
                {value === "week" ? "Last 7 days" : value}
              </button>
            ))}
          </div>
          <p className="subtle text-sm">{loading ? "Loading evidence-led ideas…" : "Research coverage 8/8 groups"}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-[var(--line)]" role="tablist" aria-label="Channels">
          {(Object.keys(channelLabels) as Channel[]).map((key) => {
            const count = ideas.filter((idea) => idea.channel === key && idea.status === "surfaced").length;
            return (
              <button key={key} role="tab" aria-selected={channel === key} onClick={() => setChannel(key)} className={`min-h-12 min-w-max border-b-2 px-4 text-sm font-bold ${channel === key ? "border-[var(--coral-dark)] text-[var(--ink)]" : "border-transparent text-[var(--muted)]"}`}>
                {channelLabels[key]} <span className="ml-1 text-xs">{count || (key === "youtube" ? "Research" : 4)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {channel === "youtube" ? (
        <section className="surface mt-8 p-8">
          <p className="eyebrow">G9 phase gate</p>
          <h2 className="mt-3 font-[var(--font-serif)] text-3xl">YouTube is research-only</h2>
          <p className="subtle mt-3 max-w-2xl leading-7">Ideas can be researched and saved, but production approval remains disabled until three comparable executions and credible human production capacity pass G9.</p>
        </section>
      ) : wall.length ? (
        <section aria-label="Idea wall" className="mt-8 grid gap-5 xl:grid-cols-2">
          {wall.map((idea, index) => (
            <article key={idea.id} className="surface flex min-h-[430px] flex-col p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap gap-2"><span className="badge">{idea.category}</span><span className="badge">{idea.format}</span></div>
                <span className="font-[var(--font-serif)] text-3xl text-[var(--line)]">0{index + 1}</span>
              </div>
              <h2 className="mt-7 max-w-xl font-[var(--font-serif)] text-3xl leading-[1.08] tracking-[-.025em] sm:text-[2.1rem]">{idea.topic}</h2>
              <p className="mt-4 leading-7 text-[var(--ink)]">{idea.approach}</p>
              <dl className="mt-6 grid gap-4 border-t border-[var(--line)] pt-5 sm:grid-cols-2">
                <div><dt className="eyebrow">Why now</dt><dd className="subtle mt-2 text-sm leading-6">{idea.whyNow}</dd></div>
                <div><dt className="eyebrow">Evidence plan</dt><dd className="subtle mt-2 text-sm leading-6">{idea.evidence}</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">{idea.sources.map((source) => <span key={source} className="badge bg-[#edf3f5] text-[var(--blue)]">{source}</span>)}{idea.gates.map((gate) => <span key={gate} className="badge bg-[#edf7f0] text-[var(--green)]">{gate}</span>)}</div>
              <div className="mt-auto flex flex-wrap gap-2 pt-7">
                <button type="button" className="primary-button" aria-label="Approve and validate" onClick={() => updateIdea(idea.id, "validating", "Moved to validation. Full evidence checks are running.")}>Approve and validate <ChevronRight size={17} /></button>
                <button type="button" className="secondary-button" onClick={() => updateIdea(idea.id, "saved", "Saved for later and removed from today’s wall.")}>Save for later</button>
                <button type="button" className="ghost-button" onClick={() => updateIdea(idea.id, "rejected", "Rejected and added to duplicate suppression.")}>Reject</button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section aria-label="Idea wall" className="surface mt-8 grid min-h-72 place-items-center p-8 text-center">
          <div><p className="eyebrow">Clear wall</p><h2 className="mt-3 font-[var(--font-serif)] text-3xl">No surfaced ideas here</h2><p className="subtle mt-3">Generate another batch or check saved and archived directions.</p></div>
        </section>
      )}

      {drawer ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35 p-2 sm:p-4" onMouseDown={() => setDrawer(false)}>
          <section role="dialog" aria-modal="true" aria-label="Generate ideas from context" className="h-full w-full max-w-2xl overflow-y-auto rounded-[24px] bg-[var(--surface)] p-6 shadow-2xl sm:p-8" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Custom generation</p><h2 className="mt-3 font-[var(--font-serif)] text-4xl">Bring your context</h2></div><button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)]" onClick={() => setDrawer(false)} aria-label="Close"><X size={18} /></button></div>
            <p className="subtle mt-4 max-w-xl leading-7">The same evidence, Product Truth and duplicate gates apply. Custom ideas do not reduce the daily batch.</p>
            <form className="mt-8 space-y-6" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const selectedChannels = form.getAll("channels") as Channel[]; const prompt = String(form.get("prompt") || ""); if (apiMode) { setLoading(true); const response = await fetch("/api/ideas/generate", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ channels: selectedChannels, prompt }) }); const result = await response.json(); setLoading(false); if (!response.ok) { setNotice(result.error || "Custom research failed."); return; } } setDrawer(false); setNotice("Custom research batch completed across all selected source groups."); }}>
              <label className="block text-sm font-bold">Content objective or context<textarea name="prompt" aria-label="Content objective or context" className="mt-2 min-h-40 w-full rounded-2xl border border-[var(--line)] bg-white p-4 font-normal" placeholder="Example: Help freshers understand what a global contractor rate does not include…" /></label>
              <fieldset><legend className="text-sm font-bold">Channels</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{Object.entries(channelLabels).map(([key, label]) => <label key={key} className="flex min-h-12 items-center gap-2 rounded-xl border border-[var(--line)] px-3 text-sm"><input name="channels" value={key} type="checkbox" defaultChecked={key !== "youtube"} />{label}</label>)}</div></fieldset>
              <label className="block text-sm font-bold">Reference URL<div className="mt-2 flex items-center rounded-2xl border border-[var(--line)] bg-white px-4"><Link2 size={17} className="text-[var(--muted)]" /><input aria-label="Reference URL" type="url" className="min-h-12 w-full border-0 bg-transparent px-3 outline-none" placeholder="https://…" /></div></label>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] p-5 text-center text-sm font-bold"><FileUp size={22} /><span className="mt-2">Add reference files</span><span className="subtle mt-1 font-normal">PDF, DOCX, TXT, PNG, JPG or WEBP · 20 MB each</span><input aria-label="Reference files" type="file" multiple className="sr-only" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp" /></label>
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4"><p className="text-sm font-bold">Coverage protocol</p><p className="subtle mt-2 text-sm leading-6">Primary/official · web/news · X · LinkedIn · YouTube · Instagram · Reddit · specialist sources. Access gaps remain visible.</p></div>
              <button type="submit" className="primary-button w-full">Start research batch <ArrowUpRight size={17} /></button>
            </form>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
