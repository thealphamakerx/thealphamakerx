// Number formatting for admin figures. Amounts are stored in paise.

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** "₹1,23,400" — whole rupees, for totals and tiles. */
export const rupees = (paise: number) => inr.format(Math.round(paise / 100));

/** "₹12.4K" / "₹1.2L" — compact, for axis ticks and bar labels. */
export function compactRupees(paise: number) {
  const r = paise / 100;
  if (r >= 1e7) return `₹${trim(r / 1e7)}Cr`;
  if (r >= 1e5) return `₹${trim(r / 1e5)}L`;
  if (r >= 1e3) return `₹${trim(r / 1e3)}K`;
  return `₹${Math.round(r)}`;
}

const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");

export const count = (n: number) => n.toLocaleString("en-IN");

export const plural = (n: number, word: string) => `${count(n)} ${word}${n === 1 ? "" : "s"}`;

/** Signed percentage change, or null when there's nothing to compare against. */
export function change(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

const IST = "Asia/Kolkata";

export const formatDateTime = (d: Date | string) =>
  new Date(d).toLocaleString("en-IN", { timeZone: IST, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const formatDay = (key: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export const formatMonth = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });

/** "3 PM" */
export const formatHour = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;
