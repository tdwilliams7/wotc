const pad = (n: number) => String(n).padStart(2, "0");

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// dayOffset relative to today, time as "HH:mm"
export function localIso(dayOffset: number, time: string): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return `${toDateStr(d)}T${time}`;
}

export function timeRange(startsAt: string, durationMinutes: number): string {
  const [h, m] = startsAt.slice(11, 16).split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const end = `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
  return `${startsAt.slice(11, 16)}–${end}`;
}
