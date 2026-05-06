import type { Expense, MonthlyBudget } from "@prisma/client";
import type { ExpenseDTO, MonthlyBudgetDTO } from "@/types/dto";

export function serializeExpense(e: Expense): ExpenseDTO {
  return {
    id: e.id,
    amount: Number(e.amount),
    category: e.category,
    customCategory: e.customCategory,
    note: e.note,
    spentAt: e.spentAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
  };
}

export function serializeBudget(b: MonthlyBudget): MonthlyBudgetDTO {
  return {
    id: b.id,
    year: b.year,
    month: b.month,
    amount: Number(b.amount),
  };
}
