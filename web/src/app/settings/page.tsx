import { CheckCircle2, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";

const cadence = ["X · Mon, Wed, Fri · 12:30", "LinkedIn · Tue, Thu · 10:00", "Instagram · Wed, Sat · 18:30", "YouTube · Research only"];

export default function SettingsPage() {
  return (
    <AppShell current="settings">
      <header className="border-b border-[var(--line)] pb-8"><p className="eyebrow">Connections and operating policy</p><h1 className="page-title mt-3">Settings</h1><p className="subtle mt-4 max-w-2xl leading-7">The manifest supplies operational identifiers. Product Truth remains read-only and authoritative.</p></header>
      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        <section className="surface p-6"><div className="flex items-start justify-between"><div><p className="eyebrow">Google Workspace</p><h2 className="mt-3 font-[var(--font-serif)] text-3xl">Operational sync</h2></div><CheckCircle2 className="text-[var(--green)]" /></div><dl className="mt-6 space-y-4 text-sm"><div><dt className="subtle">Owner</dt><dd className="mt-1 font-bold">priyanshbajpai@gmail.com</dd></div><div><dt className="subtle">Tracker</dt><dd className="mt-1 font-bold">HireNudge Content Tracker</dd></div><div><dt className="subtle">Product Truth</dt><dd className="mt-1 font-bold">HireNudge Product Truth · read-only</dd></div></dl><button type="button" className="secondary-button mt-6"><RefreshCw size={16} />Check connection</button></section>
        <section className="surface p-6"><div className="flex items-start justify-between"><div><p className="eyebrow">Research protocol</p><h2 className="mt-3 font-[var(--font-serif)] text-3xl">Eight source groups</h2></div><ShieldCheck className="text-[var(--blue)]" /></div><p className="subtle mt-5 leading-7">Primary and official sources, news/web, X, LinkedIn, YouTube, Instagram, Reddit and specialist sites. Access gaps are shown, never hidden.</p><a href="/references" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-[var(--blue)]">View source library <ExternalLink size={16} /></a></section>
        <section className="surface p-6 xl:col-span-2"><p className="eyebrow">Default cadence · Asia/Kolkata</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{cadence.map((item) => <div key={item} className="rounded-xl border border-[var(--line)] bg-white p-4 text-sm font-bold">{item}</div>)}</div></section>
      </div>
    </AppShell>
  );
}
