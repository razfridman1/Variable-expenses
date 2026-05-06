import type { Category } from "@prisma/client";

export interface ExpenseDTO {
  id: string;
  amount: number;
  category: Category;
  customCategory: string | null;
  note: string | null;
  spentAt: string; // ISO
  createdAt: string;
}

export interface MonthlyBudgetDTO {
  id: string;
  year: number;
  month: number;
  amount: number;
}

export interface DashboardDTO {
  today: number;
  week: number;
  month: number;
  budget: MonthlyBudgetDTO | null;
  remaining: number | null;
  percentUsed: number | null;
  recent: ExpenseDTO[];
}

export interface CategoryBreakdownItem {
  category: Category;
  customCategory: string | null;
  total: number;
  count: number;
}

export interface MonthlyAnalyticsDTO {
  year: number;
  month: number;
  total: number;
  byCategory: CategoryBreakdownItem[];
  byDay: Array<{ date: string; total: number }>;
}

export interface YearlyAnalyticsDTO {
  total: number;
  byMonth: Array<{ year: number; month: number; total: number }>;
  byCategory: CategoryBreakdownItem[];
}
