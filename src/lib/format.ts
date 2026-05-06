const ILS = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const ILS_PRECISE = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 2,
});

export function formatMoney(n: number | string, precise = false): string {
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "—";
  return precise ? ILS_PRECISE.format(v) : ILS.format(v);
}

const DATE_FULL = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
});

const MONTH_LONG = new Intl.DateTimeFormat("he-IL", {
  month: "long",
  year: "numeric",
});

export function formatDate(d: Date | string): string {
  return DATE_FULL.format(typeof d === "string" ? new Date(d) : d);
}

export function formatDateShort(d: Date | string): string {
  return DATE_SHORT.format(typeof d === "string" ? new Date(d) : d);
}

export function formatMonth(d: Date | string): string {
  return MONTH_LONG.format(typeof d === "string" ? new Date(d) : d);
}
