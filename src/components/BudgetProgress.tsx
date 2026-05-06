"use client";

import { motion } from "framer-motion";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props {
  spent: number;
  budget: number;
}

export function BudgetProgress({ spent, budget }: Props) {
  const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const remaining = budget - spent;
  const overBudget = remaining < 0;

  const barColor =
    percent < 60 ? "bg-success"
    : percent < 90 ? "bg-warning"
    : "bg-danger";

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm text-muted">תקציב חודשי</p>
        <p className="text-xs text-muted tabular-nums">{percent.toFixed(0)}%</p>
      </div>

      <div className="h-3 w-full rounded-full bg-surface-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-full", barColor)}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <p className="text-muted">
          הוצאת{" "}
          <span className="font-semibold text-text tabular-nums">
            {formatMoney(spent)}
          </span>{" "}
          מתוך{" "}
          <span className="font-semibold text-text tabular-nums">
            {formatMoney(budget)}
          </span>
        </p>
        <p
          className={cn(
            "font-semibold tabular-nums",
            overBudget ? "text-danger" : "text-success",
          )}
        >
          {overBudget
            ? `חרגת ב־${formatMoney(Math.abs(remaining))}`
            : `נותרו ${formatMoney(remaining)}`}
        </p>
      </div>
    </div>
  );
}
