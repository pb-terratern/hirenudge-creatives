"use client";

import { FileUp, Filter, Link2, Plus, Search } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";

const refs = [
  { title: "Global remote application evidence", type: "Primary source collection", tags: ["remote", "applications"], status: "Verified" },
  { title: "Applicant questions about contractor offers", type: "Reddit listening", tags: ["contractor", "problems"], status: "Context only" },
  { title: "HireNudge Product Truth", type: "Google Sheet", tags: ["product", "authoritative"], status: "Authoritative" },
  { title: "Country resume orientation sources", type: "Official guidance", tags: ["resume", "countries"], status: "Verified" },
];

export default function ReferencesPage() {
  const [adding, setAdding] = useState(false);
  return (
    <AppShell current="references">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 xl:flex-row xl:items-end xl:justify-between"><div><p className="eyebrow">Reusable evidence and inspiration</p><h1 className="page-title mt-3">References</h1><p className="subtle mt-4 max-w-2xl leading-7">Store source links, platform examples and private uploads. A saved reference is not automatically verified evidence.</p></div><button type="button" className="primary-button" onClick={() => setAdding((value) => !value)}><Plus size={17} />Add reference</button></header>
      {adding ? <section className="surface mt-7 grid gap-5 p-6 lg:grid-cols-2"><label className="text-sm font-bold">Reference URL<div className="mt-2 flex rounded-xl border border-[var(--line)] bg-white px-3"><Link2 size={16} className="my-auto" /><input className="min-h-12 w-full px-3 outline-none" placeholder="https://…" /></div></label><label className="flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--line)] text-sm font-bold"><FileUp size={18} />Upload a private file<input type="file" className="sr-only" /></label></section> : null}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row"><label className="flex min-h-12 flex-1 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4"><Search size={17} /><span className="sr-only">Search references</span><input className="w-full bg-transparent px-3 outline-none" placeholder="Search title, note or tag" /></label><button type="button" className="secondary-button"><Filter size={17} />Filter</button></div>
      <section aria-label="Reference library" className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">{refs.map((ref) => <article key={ref.title} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="eyebrow">{ref.type}</p><h2 className="mt-2 font-[var(--font-serif)] text-2xl">{ref.title}</h2><div className="mt-3 flex flex-wrap gap-2">{ref.tags.map((tag) => <span className="badge" key={tag}>{tag}</span>)}</div></div><span className="badge w-fit bg-[#edf7f0] text-[var(--green)]">{ref.status}</span></article>)}</section>
    </AppShell>
  );
}
