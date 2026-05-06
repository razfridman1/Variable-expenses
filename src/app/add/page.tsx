"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Category } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { CATEGORY_ORDER, CATEGORY_LABELS_HE, CATEGORY_COLORS } from "@/lib/categories";
import { toast } from "@/components/Toaster";
import { cn } from "@/lib/cn";

interface PrefsRes { lastUsedCategory: Category }

function todayLocalISODate(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function AddExpensePage() {
  const router = useRouter();

  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<Category>(Category.SUPERMARKET);
  const [customCategory, setCustomCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayLocalISODate());
  const [busy, setBusy] = useState(false);

  // Pre-fill last-used category
  useEffect(() => {
    (async () => {
      try {
        const prefs = await api.get<PrefsRes>("/api/preferences");
        if (prefs?.lastUsedCategory) setCategory(prefs.lastUsedCategory);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const numericAmount = useMemo(() => {
    const v = Number(amount);
    return Number.isFinite(v) ? v : 0;
  }, [amount]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (numericAmount <= 0) {
      toast.error("הזן סכום חיובי");
      return;
    }
    if (category === Category.OTHER && customCategory.trim() === "") {
      toast.error('יש להזין שם קטגוריה במצב "אחר"');
      return;
    }

    setBusy(true);
    try {
      const spentAt = new Date(`${date}T12:00:00`);
      await api.post("/api/expenses", {
        amount: numericAmount,
        category,
        customCategory: category === Category.OTHER ? customCategory.trim() : null,
        note: note.trim() || null,
        spentAt: spentAt.toISOString(),
      });
      toast.success("נוסף בהצלחה");
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "שגיאה לא צפויה";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="text-xl sm:text-2xl font-bold mb-1">הוצאה חדשה</h1>
      <p className="text-sm text-muted mb-4">תוסף תוך כמה שניות.</p>

      <form onSubmit={onSubmit} className="card p-4 sm:p-6 flex flex-col gap-4">
        {/* Amount */}
        <div>
          <label htmlFor="amount" className="label">סכום (₪)</label>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input text-2xl font-bold tabular-nums"
          />
        </div>

        {/* Category grid */}
        <div>
          <p className="label">קטגוריה</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {CATEGORY_ORDER.map((c) => {
              const active = c === category;
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-xl border p-3 text-sm flex flex-col items-center gap-1.5 transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-text"
                      : "border-border bg-surface-2 hover:bg-border text-muted",
                  )}
                >
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: CATEGORY_COLORS[c] }}
                  >
                    {active && <Check size={12} />}
                  </span>
                  <span className="leading-tight">{CATEGORY_LABELS_HE[c]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {category === Category.OTHER && (
          <div className="animate-fadeIn">
            <label htmlFor="custom" className="label">שם הקטגוריה</label>
            <input
              id="custom"
              type="text"
              required
              maxLength={80}
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="input"
              placeholder="לדוגמה: חניה, תרופות"
            />
          </div>
        )}

        {/* Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="date" className="label">תאריך</label>
            <input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              dir="ltr"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="label">הערה (לא חובה)</label>
          <input
            id="note"
            type="text"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
            placeholder="לדוגמה: סופ״ש בים"
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-2">
          {busy ? <Loader2 className="animate-spin" size={16} /> : null}
          שמור הוצאה
        </button>
      </form>
    </AppShell>
  );
}
