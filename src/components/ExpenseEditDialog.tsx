"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Loader2, Check } from "lucide-react";
import { Category } from "@prisma/client";
import { api, ApiError } from "@/lib/api";
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS_HE,
  CATEGORY_COLORS,
} from "@/lib/categories";
import { toast } from "@/components/Toaster";
import { cn } from "@/lib/cn";
import type { ExpenseDTO } from "@/types/dto";

interface Props {
  expense: ExpenseDTO | null;
  onClose: () => void;
  onSaved: () => void;
}

function toLocalDate(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function ExpenseEditDialog({ expense, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>(Category.SUPERMARKET);
  const [customCategory, setCustomCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  // Re-seed form whenever a different expense is opened
  useEffect(() => {
    if (!expense) return;
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setCustomCategory(expense.customCategory ?? "");
    setNote(expense.note ?? "");
    setDate(toLocalDate(expense.spentAt));
  }, [expense]);

  // Lock body scroll while open & close on ESC
  useEffect(() => {
    if (!expense) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [expense, onClose]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!expense) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("הזן סכום חיובי");
      return;
    }
    if (category === Category.OTHER && customCategory.trim() === "") {
      toast.error('יש להזין שם קטגוריה במצב "אחר"');
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/api/expenses/${expense.id}`, {
        amount: n,
        category,
        customCategory:
          category === Category.OTHER ? customCategory.trim() : null,
        note: note.trim() || null,
        spentAt: new Date(`${date}T12:00:00`).toISOString(),
      });
      toast.success("עודכן");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "שגיאה בעדכון");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!expense) return;
    if (!confirm("למחוק את ההוצאה?")) return;
    setBusy(true);
    try {
      await api.delete(`/api/expenses/${expense.id}`);
      toast.success("נמחק");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "שגיאה במחיקה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {expense && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            dir="rtl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto bg-surface
                       rounded-t-2xl border-t border-border shadow-soft-lg
                       sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2
                       sm:rounded-2xl sm:border sm:max-w-lg sm:w-[92vw] sm:max-h-[88vh]"
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <span className="h-1.5 w-12 rounded-full bg-border" />
            </div>

            <div className="px-4 sm:px-6 pt-2 pb-4 flex items-center justify-between border-b border-border">
              <h2 className="text-base sm:text-lg font-bold">עריכת הוצאה</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="סגור"
                className="btn-ghost h-9 w-9 !p-0 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-4 sm:px-6 py-4 flex flex-col gap-4">
              {/* Amount */}
              <div>
                <label htmlFor="edit-amount" className="label">סכום (₪)</label>
                <input
                  id="edit-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input text-2xl font-bold tabular-nums"
                />
              </div>

              {/* Category */}
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
                  <label htmlFor="edit-custom" className="label">שם הקטגוריה</label>
                  <input
                    id="edit-custom"
                    type="text"
                    required
                    maxLength={80}
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="input"
                  />
                </div>
              )}

              {/* Date */}
              <div>
                <label htmlFor="edit-date" className="label">תאריך</label>
                <input
                  id="edit-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                  dir="ltr"
                />
              </div>

              {/* Note */}
              <div>
                <label htmlFor="edit-note" className="label">הערה (לא חובה)</label>
                <input
                  id="edit-note"
                  type="text"
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="btn-danger sm:flex-none"
                >
                  <Trash2 size={16} />
                  מחק
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary flex-1"
                >
                  {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                  שמור שינויים
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
