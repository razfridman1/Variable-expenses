import type { BarMitzvahExpense, Expense, MonthlyBudget } from "@prisma/client";
import type {
  BarMitzvahExpenseDTO,
  ExpenseDTO,
  MonthlyBudgetDTO,
} from "@/types/dto";

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

export function serializeBarMitzvahExpense(
  e: BarMitzvahExpense,
): BarMitzvahExpenseDTO {
  return {
    id: e.id,
    vendor: e.vendor,
    category: e.category,
    customCategory: e.customCategory,
    amountPaid: Number(e.amountPaid),
    amountRemaining: Number(e.amountRemaining),
    paymentDate: e.paymentDate.toISOString(),
    note: e.note,
    createdAt: e.createdAt.toISOString(),
  };
}
