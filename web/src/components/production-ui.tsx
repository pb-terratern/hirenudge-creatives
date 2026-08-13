"use client";

import { upload } from "@vercel/blob/client";
import { AlertTriangle, ArrowLeft, ArrowUpRight, Check, CheckCircle2, Clock3, FileText, FileUp, Link2, Plus, RefreshCw, RotateCcw, Search, Send, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { contentApi, draftText, idempotencyKey, type ContentDetail, type ContentItem, type Health, type Reference, type ScheduleSlot } from "@/lib/production-client";

type Resource<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; value: T };

function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [resource, setResource] = useState<Resource<T>>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then((value) => setResource({ status: "ready", value })).catch((error: unknown) => {
      if (!controller.signal.aborted) setResource({ status: "error", message: error instanceof Error ? error.message : "Please try again." });
    });
    return () => controller.abort();
  }, [load, reloadToken]);
  return [resource, reload] as const;
}

function ErrorState({ title, message, retry }: { title: string; message: string; retry: () => void }) {
  return <section role="alert" className="surface mt-7 p-6"><AlertTriangle className="text-red-700" /><h2 className="mt-3 font-[var(--font-serif)] text-2xl">{title}</h2><p className="subtle mt-2">{message}</p><button type="button" className="secondary-button mt-5" onClick={retry}><RefreshCw size={16} />Try again</button></section>;
}

function SyncIcon({ status }: { status?: string }) {
  return status === "failed" ? <AlertTriangle size={16} className="text-red-700" /> : status === "pending" ? <Clock3 size={16} className="text-[var(--amber)]" /> : <CheckCircle2 size={16} className="text-[var(--green)]" />;
}

const columns = [
  { key: "validating", label: "Validating" }, { key: "needs_review", label: "Needs review" }, { key: "approved_topic", label: "Approved topic" },
  { key: "drafting", label: "Drafting" }, { key: "review", label: "Review" }, { key: "ready", label: "Ready" },
] as const;

export function PipelineClient() {
  const [query, setQuery] = useState("");
  const load = useCallback((signal: AbortSignal) => contentApi.listContent(fetch, signal), []);
  const [resource, reload] = useResource(load);
  const items = resource.status === "ready" ? resource.value.filter((item) => `${item.topic} ${item.category} ${item.format}`.toLowerCase().includes(query.toLowerCase())) : [];
  return <AppShell current="pipeline">
    <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 xl:flex-row xl:items-end xl:justify-between"><div><p className="eyebrow">From evidence to final approval</p><h1 className="page-title mt-3">Pipeline</h1><p className="subtle mt-4 max-w-2xl leading-7">Every card shows its current gate. Nothing silently jumps from an idea to production.</p></div><label className="flex min-h-12 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4"><Search size={17} className="text-[var(--muted)]" /><span className="sr-only">Search pipeline</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-56 bg-transparent px-3 outline-none" placeholder="Search content" /></label></header>
    {resource.status === "loading" ? <p className="subtle mt-8">Loading pipeline…</p> : null}
    {resource.status === "error" ? <ErrorState title="Could not load pipeline." message={resource.message} retry={reload} /> : null}
    {resource.status === "ready" ? <section aria-label="Content pipeline" className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{columns.map((column) => {
      const cards = items.filter((item) => item.status === column.key);
      return <section key={column.key} className="min-w-0"><div className="mb-3 flex items-center justify-between px-1"><h2 className="text-sm font-bold">{column.label}</h2><span className="badge">{cards.length}</span></div><div className="min-h-40 space-y-3 rounded-[20px] bg-[#ebe4d8] p-2.5">{cards.length ? cards.map((item) => <PipelineCard key={item.id} item={item} />) : <div className="grid min-h-28 place-items-center text-center text-xs text-[var(--muted)]"><span>Nothing waiting</span></div>}</div></section>;
    })}</section> : null}
  </AppShell>;
}

function PipelineCard({ item }: { item: ContentItem }) {
  const docUrl = item.sync?.documentUrl;
  return <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"><div className="flex items-center justify-between gap-2"><span className="eyebrow">{item.channel}</span><SyncIcon status={item.sync?.status} /></div><h3 className="mt-4 font-[var(--font-serif)] text-xl leading-tight">{item.topic}</h3><p className="subtle mt-3 text-xs leading-5">{item.category} · {item.format}</p><div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--line)] pt-3"><Link href={`/drafts/${item.id}`} className="inline-flex min-h-8 items-center gap-1 text-sm font-bold text-[var(--blue)]">Open item <ArrowUpRight size={16} /></Link>{docUrl ? <a href={docUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center text-xs font-bold text-[var(--blue)]">Production Doc</a> : null}</div></article>;
}

function formatDay(value: string) {
  const date = new Date(value);
  return { weekday: new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }).format(date), date: new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }).format(date), key: new Intl.DateTimeFormat("en-CA", { dateStyle: "short", timeZone: "Asia/Kolkata" }).format(date) };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export function CalendarClient() {
  const window = useMemo(() => {
    const now = new Date();
    const mondayOffset = (now.getUTCDay() + 6) % 7;
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - mondayOffset));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);
  const load = useCallback((signal: AbortSignal) => contentApi.listSchedule(fetch, window, signal), [window]);
  const [resource, reload] = useResource(load);
  const [slotStatuses, setSlotStatuses] = useState<Record<string, ScheduleSlot["status"]>>({});
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const grouped = useMemo(() => {
    const slots = resource.status === "ready" ? resource.value.map((slot) => ({ ...slot, status: slotStatuses[slot.id] || slot.status })) : [];
    return Object.entries(slots.reduce<Record<string, ScheduleSlot[]>>((groups, slot) => { const key = formatDay(slot.scheduledFor).key; (groups[key] ||= []).push(slot); return groups; }, {})).sort(([a], [b]) => a.localeCompare(b));
  }, [resource, slotStatuses]);
  async function confirm(slot: ScheduleSlot) {
    setActionError("");
    try {
      await contentApi.confirmSchedule(fetch, { contentItemId: slot.contentItemId, channel: slot.channel, scheduledFor: slot.scheduledFor, finalApproved: true, workspaceSynced: true }, idempotencyKey());
      setSlotStatuses((current) => ({ ...current, [slot.id]: "confirmed" }));
      setNotice("Confirmed");
    } catch (error) { setActionError(error instanceof Error ? error.message : "Could not confirm this slot."); }
  }
  return <AppShell current="calendar"><header className="border-b border-[var(--line)] pb-8"><p className="eyebrow">Human-confirmed placement</p><h1 className="page-title mt-3">Calendar</h1><p className="subtle mt-4 max-w-2xl leading-7">Ready assets receive the next channel-compatible suggestion. Nothing is published from here.</p></header><div className="mt-7 flex flex-wrap gap-4 text-xs font-bold"><span className="flex items-center gap-2"><Check size={15} className="text-[var(--green)]" />Confirmed</span><span className="flex items-center gap-2"><Clock3 size={15} className="text-[var(--amber)]" />Suggested</span><span className="subtle">Times shown in IST</span></div>{notice ? <p className="mt-4 text-sm font-bold text-[var(--green)]">{notice}</p> : null}{actionError ? <p role="alert" className="mt-4 text-sm text-red-700">{actionError}</p> : null}{resource.status === "loading" ? <p className="subtle mt-8">Loading calendar…</p> : null}{resource.status === "error" ? <ErrorState title="Could not load calendar." message={resource.message} retry={reload} /> : null}{resource.status === "ready" ? grouped.length ? <section aria-label="Weekly content calendar" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">{grouped.map(([, daySlots]) => <CalendarDay key={daySlots[0].id} slots={daySlots} confirm={confirm} />)}</section> : <section className="surface mt-6 p-6"><p className="subtle">No proposed or confirmed schedule slots yet.</p></section> : null}</AppShell>;
}

function CalendarDay({ slots, confirm }: { slots: ScheduleSlot[]; confirm: (slot: ScheduleSlot) => void }) {
  const day = formatDay(slots[0].scheduledFor);
  return <article className="surface min-h-52 p-4"><div className="flex items-baseline justify-between border-b border-[var(--line)] pb-3"><h2 className="text-sm font-bold">{day.weekday}</h2><span className="font-[var(--font-serif)] text-2xl">{day.date}</span></div><div className="mt-3 space-y-3">{slots.map((slot) => <div key={slot.id} className={`rounded-xl border p-3 ${slot.status === "suggested" ? "border-[#d9b77b] bg-[#fff8e9]" : "border-[#b9d1c3] bg-[#edf7f0]"}`}><p className="eyebrow">{formatTime(slot.scheduledFor)} · {slot.channel}</p><p className="mt-2 text-sm font-bold leading-5">{slot.content?.topic || "Scheduled content"}</p><div className="mt-3 flex flex-wrap gap-3">{slot.content?.production?.googleDocUrl ? <a href={slot.content.production.googleDocUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-[var(--blue)]">Open production Doc</a> : null}{slot.status === "suggested" ? <button type="button" onClick={() => confirm(slot)} className="text-xs font-bold text-[var(--blue)]">Confirm slot</button> : <span className="text-xs font-bold text-[var(--green)]">Confirmed</span>}</div></div>)}</div></article>;
}

export function ReferencesClient() {
  const load = useCallback((signal: AbortSignal) => contentApi.listReferences(fetch, signal), []);
  const [resource, reload] = useResource(load);
  const [createdReferences, setCreatedReferences] = useState<Reference[]>([]);
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const references = resource.status === "ready" ? [...createdReferences, ...resource.value.filter((reference) => !createdReferences.some((created) => created.id === reference.id))] : createdReferences;
  const visible = references.filter((reference) => `${reference.title} ${reference.notes || ""} ${reference.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  async function saveUrl(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setActionError(""); try { const created = await contentApi.createReference(fetch, { url, title: title.trim() || new URL(url).hostname }, idempotencyKey()); setCreatedReferences((current) => [created, ...current]); setUrl(""); setTitle(""); setNotice("Reference saved."); } catch (error) { setActionError(error instanceof Error ? error.message : "Could not save reference."); } }
  async function uploadFile(file: File) { setActionError(""); try { await upload(file.name, file, { access: "private", handleUploadUrl: "/api/references/upload", clientPayload: JSON.stringify({ type: file.type, size: file.size }) }); await reload(); setNotice("File uploaded. It will appear after processing."); } catch (error) { setActionError(error instanceof Error ? error.message : "Could not upload file."); } }
  return <AppShell current="references"><header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 xl:flex-row xl:items-end xl:justify-between"><div><p className="eyebrow">Reusable evidence and inspiration</p><h1 className="page-title mt-3">References</h1><p className="subtle mt-4 max-w-2xl leading-7">Store source links, platform examples and private uploads. A saved reference is not automatically verified evidence.</p></div><button type="button" className="primary-button" onClick={() => setAdding((value) => !value)}><Plus size={17} />Add reference</button></header>{adding ? <form onSubmit={saveUrl} className="surface mt-7 grid gap-5 p-6 lg:grid-cols-2"><div><label className="text-sm font-bold">Reference URL<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 outline-none" placeholder="https://…" /></label><label className="mt-4 block text-sm font-bold">Title (optional)<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 outline-none" placeholder="Useful source title" /></label><button className="primary-button mt-4" type="submit"><Link2 size={16} />Save URL</button></div><label className="flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--line)] text-sm font-bold"><FileUp size={18} />Upload a private file<input aria-label="Upload a private file" type="file" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); }} /></label></form> : null}{notice ? <p className="mt-4 text-sm font-bold text-[var(--green)]">{notice}</p> : null}{actionError ? <p role="alert" className="mt-4 text-sm text-red-700">{actionError}</p> : null}<label className="mt-7 flex min-h-12 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4"><Search size={17} /><span className="sr-only">Search references</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent px-3 outline-none" placeholder="Search title, note or tag" /></label>{resource.status === "loading" ? <p className="subtle mt-6">Loading references…</p> : null}{resource.status === "error" ? <ErrorState title="Could not load references." message={resource.message} retry={reload} /> : null}{resource.status === "ready" ? visible.length ? <section aria-label="Reference library" className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">{visible.map((reference) => <article key={reference.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="eyebrow">{reference.kind}</p>{reference.url || reference.blobUrl ? <a className="mt-2 block font-[var(--font-serif)] text-2xl text-[var(--blue)]" href={reference.url || reference.blobUrl || undefined} target="_blank" rel="noreferrer">{reference.title}</a> : <h2 className="mt-2 font-[var(--font-serif)] text-2xl">{reference.title}</h2>}<div className="mt-3 flex flex-wrap gap-2">{reference.tags.map((tag) => <span className="badge" key={tag}>{tag}</span>)}</div></div><span className="badge w-fit bg-[#edf7f0] text-[var(--green)]">{reference.verificationStatus}</span></article>)}</section> : <section className="surface mt-6 p-6"><p className="subtle">No references match this search.</p></section> : null}</AppShell>;
}

export function SettingsClient() {
  const load = useCallback((signal: AbortSignal) => contentApi.getHealth(fetch, signal), []);
  const [resource, reload] = useResource(load);
  return <AppShell current="settings"><header className="border-b border-[var(--line)] pb-8"><p className="eyebrow">Connections and operating policy</p><h1 className="page-title mt-3">Settings</h1><p className="subtle mt-4 max-w-2xl leading-7">Connection health is live. Product Truth remains read-only and authoritative.</p></header>{resource.status === "loading" ? <p className="subtle mt-8">Checking connection health…</p> : null}{resource.status === "error" ? <ErrorState title="Could not load connection health." message={resource.message} retry={reload} /> : null}{resource.status === "ready" ? <HealthPanel health={resource.value} refresh={reload} /> : null}</AppShell>;
}

function HealthPanel({ health, refresh }: { health: Health; refresh: () => void }) {
  const checks = [{ label: "Google Workspace", value: health.googleConnected }, { label: "Workspace sync", value: health.workspaceSynced }, { label: "Product Truth read-only", value: health.productTruthReadOnly }, { label: "Safe to write", value: health.safeToWrite }];
  return <div className="mt-8 grid gap-5 xl:grid-cols-2"><section className="surface p-6"><div className="flex items-start justify-between"><div><p className="eyebrow">Connection health</p><h2 className="mt-3 font-[var(--font-serif)] text-3xl">Google Workspace</h2></div><ShieldCheck className={health.googleConnected ? "text-[var(--green)]" : "text-red-700"} /></div><dl className="mt-6 space-y-4 text-sm">{checks.map((check) => <div key={check.label} className="flex items-center justify-between gap-4"><dt className="subtle">{check.label}</dt><dd className={check.value ? "font-bold text-[var(--green)]" : "font-bold text-[var(--amber)]"}>{check.value ? "Healthy" : check.label === "Safe to write" ? "Writes paused" : "Needs attention"}</dd></div>)}</dl><div className="mt-6 flex flex-wrap gap-2"><button type="button" className="secondary-button" onClick={refresh}><RefreshCw size={16} />Check connection</button>{!health.googleConnected ? <a className="primary-button" href="/api/integrations/google/connect">Connect Google Workspace <ArrowUpRight size={16} /></a> : null}</div></section><section className="surface p-6"><p className="eyebrow">Research protocol</p><h2 className="mt-3 font-[var(--font-serif)] text-3xl">Evidence stays attributable</h2><p className="subtle mt-5 leading-7">Source links and limitations remain visible in the production workflow. Health checks do not change product claims or publishing authority.</p><Link href="/references" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-[var(--blue)]">View source library <ArrowUpRight size={16} /></Link></section></div>;
}

export function DraftClient({ contentId }: { contentId: string }) {
  const load = useCallback((signal: AbortSignal) => contentApi.getContent(fetch, contentId, signal), [contentId]);
  const [resource, reload] = useResource(load);
  return <AppShell current="pipeline">{resource.status === "loading" ? <p className="subtle">Loading draft…</p> : null}{resource.status === "error" ? <><Link href="/pipeline" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--blue)]"><ArrowLeft size={16} />Back to pipeline</Link><ErrorState title="Could not load draft." message={resource.message} retry={reload} /></> : null}{resource.status === "ready" ? <DraftDetail detail={resource.value} reload={reload} /> : null}</AppShell>;
}

function DraftDetail({ detail: initialDetail, reload }: { detail: ContentDetail; reload: () => void }) {
  const [selectedId, setSelectedId] = useState(initialDetail.content.selectedDraftVersionId || initialDetail.drafts.at(-1)?.id || "");
  const [instruction, setInstruction] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [contentChanges, setContentChanges] = useState<Partial<ContentDetail["content"]>>({});
  const detail = { ...initialDetail, content: { ...initialDetail.content, ...contentChanges } };
  const selected = detail.drafts.find((draft) => draft.id === selectedId) || detail.drafts.at(-1);
  const [body, setBody] = useState(() => draftText(selected?.body));
  async function mutate(action: "rewrite" | "recreate" | "restore" | "submit" | "approve", sourceVersionId?: string) {
    if (!selected) return;
    setActionError("");
    try {
      if (action === "rewrite") { await contentApi.reviseDraft(fetch, selected.id, { type: "rewrite", instruction }, idempotencyKey()); setInstruction(""); setNotice("Rewrite requested. Reload the item to view the new immutable version."); }
      if (action === "recreate") { await contentApi.reviseDraft(fetch, selected.id, { type: "recreate" }, idempotencyKey()); setNotice("Recreation requested. Reload the item to view the new immutable version."); }
      if (action === "restore" && sourceVersionId) { await contentApi.reviseDraft(fetch, selected.id, { type: "restore", sourceVersionId }, idempotencyKey()); setNotice("Restore requested. Reload the item to view the new immutable version."); }
      if (action === "submit") { const result = await contentApi.submitDraft(fetch, selected.id, idempotencyKey()); setContentChanges((current) => ({ ...current, status: result.status })); setNotice("Submitted for review."); }
      if (action === "approve") { await contentApi.finalApprove(fetch, detail.content.id, selected.id, idempotencyKey()); setContentChanges((current) => ({ ...current, finalApprovedAt: new Date().toISOString() })); setNotice("Final approval recorded."); }
    } catch (error) { setActionError(error instanceof Error ? error.message : "Could not complete this action."); }
  }
  const docUrl = detail.production?.googleDocUrl || detail.content.sync?.documentUrl;
  return <><Link href="/pipeline" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--blue)]"><ArrowLeft size={16} />Back to pipeline</Link><header className="mt-5 border-b border-[var(--line)] pb-7"><p className="eyebrow">{detail.content.channel} · {detail.content.format} · {detail.content.status}</p><h1 className="mt-3 max-w-4xl font-[var(--font-serif)] text-4xl leading-tight tracking-[-.035em] sm:text-5xl">{detail.content.topic}</h1></header>{notice ? <p className="mt-5 text-sm font-bold text-[var(--green)]">{notice}</p> : null}{actionError ? <p role="alert" className="mt-5 text-sm text-red-700">{actionError}</p> : null}<div className="mt-7 grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)_260px]"><aside className="surface h-fit p-5"><p className="eyebrow">Approved brief</p><h2 className="mt-3 font-[var(--font-serif)] text-2xl">Applicant decision</h2><p className="subtle mt-3 text-sm leading-6">{detail.content.approach || "The approved treatment is available in the production packet."}</p><h3 className="mt-6 text-sm font-bold">Evidence packet</h3><ul className="subtle mt-3 space-y-2 text-sm">{detail.sources.length ? detail.sources.map((source) => <li key={source.id}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="text-[var(--blue)]">{source.sourceGroup}</a> : source.sourceGroup}{source.limitation ? ` · ${source.limitation}` : ""}</li>) : <li>No linked sources yet.</li>}</ul>{docUrl ? <a className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-[var(--blue)]" href={docUrl} target="_blank" rel="noreferrer"><FileText size={16} />Open production Doc</a> : null}</aside><section className="surface min-w-0 p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Draft v{selected?.version || "—"}</p><h2 className="mt-2 font-[var(--font-serif)] text-3xl">Final copy or script</h2></div><span className="badge bg-[#edf7f0] text-[var(--green)]"><CheckCircle2 size={14} className="mr-1" />{detail.sources.length ? "Sources attached" : "Sources pending"}</span></div><textarea value={body} onChange={(event) => setBody(event.target.value)} aria-label="Draft body" className="mt-6 min-h-[470px] w-full resize-y rounded-2xl border border-[var(--line)] bg-white p-5 leading-8 outline-none" /><label className="mt-5 block text-sm font-bold">Rewrite instruction<input value={instruction} onChange={(event) => setInstruction(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 font-normal" placeholder="Make the opening more direct without changing the evidence…" /></label><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="secondary-button" disabled={!instruction.trim() || !selected} onClick={() => void mutate("rewrite")}><Sparkles size={16} />Rewrite</button><button type="button" className="secondary-button" disabled={!selected} onClick={() => void mutate("recreate")}><RefreshCw size={16} />Recreate</button><button type="button" className="primary-button" disabled={!selected} onClick={() => void mutate("submit")}><Send size={16} />Submit for review</button>{detail.content.status === "ready" && !detail.content.finalApprovedAt ? <button type="button" className="primary-button ml-auto" disabled={!selected} onClick={() => void mutate("approve")}>Final approve</button> : null}{detail.content.finalApprovedAt ? <span className="self-center text-sm font-bold text-[var(--green)]">Final approval recorded</span> : null}</div></section><aside className="surface h-fit p-5"><p className="eyebrow">Version history</p><div className="mt-4 space-y-2">{detail.drafts.map((draft) => <div key={draft.id} className={`flex min-h-12 items-center justify-between rounded-xl border px-3 text-left text-sm font-bold ${draft.id === selectedId ? "border-[var(--ink)] bg-[var(--surface-muted)]" : "border-[var(--line)]"}`}><button type="button" onClick={() => { setSelectedId(draft.id); setBody(draftText(draft.body)); }}>v{draft.version} · {draft.revisionType}</button><button type="button" aria-label={`Restore version ${draft.version}`} onClick={() => void mutate("restore", draft.id)}><RotateCcw size={14} /></button></div>)}</div><button type="button" className="secondary-button mt-5" onClick={reload}><RefreshCw size={16} />Reload item</button></aside></div></>;
}
