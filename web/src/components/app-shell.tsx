import { BookOpenText, CalendarDays, FileStack, Lightbulb, Settings2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const items = [
  { key: "ideas", label: "Ideas", href: "/ideas", icon: Lightbulb },
  { key: "pipeline", label: "Pipeline", href: "/pipeline", icon: FileStack },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays },
  { key: "references", label: "References", href: "/references", icon: BookOpenText },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings2 },
] as const;

export function AppShell({
  children,
  current,
}: {
  children: ReactNode;
  current: (typeof items)[number]["key"];
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 z-30 flex h-auto flex-col bg-[var(--nav)] px-4 py-4 text-[#f8f1e6] lg:h-screen lg:px-5 lg:py-6">
        <Link href="/ideas" className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2 lg:mb-10">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--coral)] text-[var(--ink)]">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-[var(--font-serif)] text-xl leading-none">HireNudge</span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[.18em] text-[#aaa99f]">Content studio</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = current === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`flex min-h-11 min-w-max items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors sm:gap-3 sm:px-3 ${selected ? "bg-[#f8f1e6] text-[var(--ink)]" : "text-[#c7c5bd] hover:bg-white/8 hover:text-white"}`}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden rounded-2xl border border-white/10 p-4 lg:block">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[#96968f]">Daily research</p>
          <p className="mt-2 text-sm text-[#d7d3c9]">Next batch at 07:00 IST</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-[var(--coral)]" />
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-7 lg:px-10 lg:py-10 xl:px-14">{children}</main>
    </div>
  );
}
