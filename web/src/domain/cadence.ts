import type { Channel } from "@/domain/content-system";

type CadenceRule = { weekday: number; hour: number; minute: number };

export const defaultCadence: Record<Exclude<Channel, "youtube">, CadenceRule[]> = {
  x: [
    { weekday: 1, hour: 12, minute: 30 },
    { weekday: 3, hour: 12, minute: 30 },
    { weekday: 5, hour: 12, minute: 30 },
  ],
  linkedin: [
    { weekday: 2, hour: 10, minute: 0 },
    { weekday: 4, hour: 10, minute: 0 },
  ],
  instagram: [
    { weekday: 3, hour: 18, minute: 30 },
    { weekday: 6, hour: 18, minute: 30 },
  ],
};

function toUtcFromIst(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month, day, hour - 5, minute - 30));
}

function istDateParts(date: Date): { year: number; month: number; day: number } {
  const shifted = new Date(date.getTime() + 330 * 60 * 1000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

export function suggestNextSlot(input: {
  channel: Channel;
  after: Date;
  occupied: string[];
}): Date {
  if (input.channel === "youtube") {
    throw new Error("YouTube has no production cadence until G9 passes.");
  }

  const occupied = new Set(input.occupied.map((value) => new Date(value).toISOString()));
  const base = istDateParts(input.after);
  for (let offset = 0; offset < 60; offset += 1) {
    const day = new Date(Date.UTC(base.year, base.month, base.day + offset));
    const weekday = day.getUTCDay();
    for (const rule of defaultCadence[input.channel].filter((item) => item.weekday === weekday)) {
      const candidate = toUtcFromIst(
        day.getUTCFullYear(),
        day.getUTCMonth(),
        day.getUTCDate(),
        rule.hour,
        rule.minute,
      );
      if (candidate > input.after && !occupied.has(candidate.toISOString())) return candidate;
    }
  }
  throw new Error("No available cadence slot was found in the next 60 days.");
}
