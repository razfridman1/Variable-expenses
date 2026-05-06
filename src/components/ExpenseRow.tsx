"use client";

import { Trash2 } from "lucide-react";
import type { ExpenseDTO } from "@/types/dto";
import { categoryLabel, CATEGORY_COLORS } from "@/lib/categories";
import { formatMoney, formatDateShort } from "@/lib/format";

interface Props {
  expense: ExpenseDTO;
  onDelete?: (id: string) => void;
}

export function ExpenseRow({ expense, onDelete }: Props) {
  const color = CATEGORY_COLORS[expense.category];
  const label = categoryLabel(expense.category, expense.customCategory);

  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className="h-9 w-9 rounded-full flex-none flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        {label.slice(0, 1)}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-muted truncate">
          {formatDateShort(expense.spentAt)}
          {expense.note ? ` · ${expense.note}` : ""}
        </p>
      </div>

      <p className="text-sm font-semibold tabular-nums">
        {formatMoney(expense.amount, true)}
      </p>

      {onDelete && (
        <button
          type="button"
          aria-label="מחק"
          onClick={() => onDelete(expense.id)}
          className="text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
    </li>
  );
}
