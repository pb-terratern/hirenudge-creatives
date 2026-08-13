import { ArrowLeft, ArrowRight, Check, Clock3, FileText } from "lucide-react";

import { AppShell } from "@/components/app-shell";

const days = [
  { day: "Mon", date: "17", slots: [{ time: "12:30", channel: "X", title: "A four-line outreach check", state: "confirmed" }] },
  { day: "Tue", date: "18", slots: [{ time: "10:00", channel: "LinkedIn", title: "Remote-ready proof before location filters", state: "suggested" }] },
  { day: "Wed", date: "19", slots: [{ time: "12:30", channel: "X", title: "Open slot", state: "open" }, { time: "18:30", channel: "Instagram", title: "Build one proof bank", state: "confirmed" }] },
  { day: "Thu", date: "20", slots: [{ time: "10:00", channel: "LinkedIn", title: "What contractor rates hide", state: "confirmed" }] },
  { day: "Fri", date: "21", slots: [{ time: "12:30", channel: "X", title: "Open slot", state: "open" }] },
  { day: "Sat", date: "22", slots: [{ time: "18:30", channel: "Instagram", title: "Country resume decisions", state: "suggested" }] },
  { day: "Sun", date: "23", slots: [] },
];

export default function CalendarPage() {
  return (
    <AppShell current="calendar">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="eyebrow">Human-confirmed placement</p><h1 className="page-title mt-3">Calendar</h1><p className="subtle mt-4 max-w-2xl leading-7">Ready assets receive the next channel-compatible suggestion. Nothing is published from here.</p></div>
        <div className="flex items-center gap-2"><button type="button" className="secondary-button" aria-label="Previous week"><ArrowLeft size={17} /></button><span className="px-3 text-sm font-bold">17–23 August 2026</span><button type="button" className="secondary-button" aria-label="Next week"><ArrowRight size={17} /></button></div>
      </header>
      <div className="mt-7 flex flex-wrap gap-4 text-xs font-bold"><span className="flex items-center gap-2"><Check size={15} className="text-[var(--green)]" />Confirmed</span><span className="flex items-center gap-2"><Clock3 size={15} className="text-[var(--amber)]" />Suggested</span><span className="subtle">Times shown in IST</span></div>
      <section aria-label="Weekly content calendar" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => (
          <article key={day.day} className="surface min-h-52 p-4">
            <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-3"><h2 className="text-sm font-bold">{day.day}</h2><span className="font-[var(--font-serif)] text-2xl">{day.date}</span></div>
            <div className="mt-3 space-y-3">{day.slots.length ? day.slots.map((slot) => (
              <div key={`${slot.time}-${slot.channel}`} className={`rounded-xl border p-3 ${slot.state === "open" ? "border-dashed border-[var(--line)] bg-transparent" : slot.state === "suggested" ? "border-[#d9b77b] bg-[#fff8e9]" : "border-[#b9d1c3] bg-[#edf7f0]"}`}>
                <p className="eyebrow">{slot.time} · {slot.channel}</p><p className="mt-2 text-sm font-bold leading-5">{slot.title}</p>{slot.state !== "open" ? <button type="button" className="mt-3 flex min-h-10 items-center gap-2 text-xs font-bold text-[var(--blue)]"><FileText size={14} />Open brief</button> : null}
              </div>
            )) : <p className="subtle py-8 text-center text-xs">No cadence slots</p>}</div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
