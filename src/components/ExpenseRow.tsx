"use client";

import { Trash2, Pencil } from "lucide-react";
import type { ExpenseDTO } from "@/types/dto";
import { categoryLabel, CATEGORY_COLORS } from "@/lib/categories";
import { formatMoney, formatDateShort } from "@/lib/format";

interface Props {
  expense: ExpenseDTO;
  onDelete?: (id: string) => void;
  onEdit?: (expense: ExpenseDTO) => void;
}

export function ExpenseRow({ expense, onDelete, onEdit }: Props) {
  const color = CATEGORY_COLORS[expense.category];
  const label = categoryLabel(expense.category, expense.customCategory);
  const clickable = Boolean(onEdit);

  const handleRowClick = () => {
    if (onEdit) onEdit(expense);
  };

  return (
    <li
      className={`flex items-center gap-3 py-3 ${
        clickable ? "cursor-pointer hover:bg-surface-2 -mx-2 px-2 rounded-lg transition-colors" : ""
      }`}
      onClick={clickable ? handleRowClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleRowClick();
              }
            }
          : undefined
      }
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : -1}
    >
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

      {onEdit && (
        <button
          type="button"
          aria-label="ערוך"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(expense);
          }}
          className="text-muted hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <Pencil size={16} />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          aria-label="מחק"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(expense.id);
          }}
          className="text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
    </li>
  );
}
