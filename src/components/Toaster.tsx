"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  push: (kind: ToastKind, message: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

let nextId = 1;
const listeners = new Set<(t: Toast) => void>();

/** Imperative API — usable from non-hook code (e.g. error handlers in fetchers). */
export const toast = {
  success: (m: string) => emit("success", m),
  error:   (m: string) => emit("error", m),
  info:    (m: string) => emit("info", m),
};

function emit(kind: ToastKind, message: string) {
  const t: Toast = { id: nextId++, kind, message };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setItems((prev) => [...prev, t]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, 3500);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[min(92vw,420px)]"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "card flex items-start gap-3 p-3 animate-fadeIn",
            t.kind === "success" && "border-success/40",
            t.kind === "error" && "border-danger/40",
          )}
          role="status"
        >
          <span className="mt-0.5">
            {t.kind === "success" && <CheckCircle2 size={18} className="text-success" />}
            {t.kind === "error" && <AlertCircle size={18} className="text-danger" />}
            {t.kind === "info" && <Info size={18} className="text-primary" />}
          </span>
          <p className="text-sm flex-1">{t.message}</p>
          <button
            type="button"
            aria-label="סגור"
            onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}
            className="text-muted hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* Optional context hook for descendants who prefer DI over the singleton. */
export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  // useCallback must run unconditionally — never put a hook on the right side of ??.
  const push = useCallback((kind: ToastKind, message: string) => emit(kind, message), []);
  return ctx ?? { push };
}
