import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dayRange, weekRange, monthRange } from "@/lib/dates";
import { serializeBudget, serializeExpense } from "@/lib/serialize";
import type { DashboardDTO } from "@/types/dto";

export const dynamic = "force-dynamic";

interface SumRow {
  today: string | null;
  week: string | null;
  month: string | null;
}

export const GET = withUser(async (_req, { user }) => {
  const now = new Date();
  const d = dayRange(now);
  const w = weekRange(now);
  const m = monthRange(now);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // ── ONE SQL round trip for all three sums ──────────────────────────────
  // Single query with conditional SUMs is dramatically faster than three
  // separate aggregate calls when network latency is high.
  const sumPromise = prisma.$queryRaw<SumRow[]>`
    SELECT
      COALESCE(SUM(CASE WHEN "spentAt" >= ${d.from} AND "spentAt" <= ${d.to}   THEN amount END), 0)::text AS today,
      COALESCE(SUM(CASE WHEN "spentAt" >= ${w.from} AND "spentAt" <= ${w.to}   THEN amount END), 0)::text AS week,
      COALESCE(SUM(CASE WHEN "spentAt" >= ${m.from} AND "spentAt" <= ${m.to}   THEN amount END), 0)::text AS month
    FROM expenses
    WHERE "userId" = ${user.id}::uuid
  `;

  // Run the sums query, the budget lookup and the recent list in parallel —
  // 3 parallel round trips instead of 5 sequential ones.
  const [sumRows, budget, recent] = await Promise.all([
    sumPromise,
    prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId: user.id, year, month } },
    }),
    prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { spentAt: "desc" },
      take: 5,
    }),
  ]);

  const sums = sumRows[0] ?? { today: "0", week: "0", month: "0" };
  const today = Number(sums.today ?? 0);
  const week  = Number(sums.week ?? 0);
  const monthTotal = Number(sums.month ?? 0);

  let remaining: number | null = null;
  let percentUsed: number | null = null;
  if (budget) {
    const budgetAmount = Number(budget.amount);
    remaining = budgetAmount - monthTotal;
    percentUsed = budgetAmount > 0 ? Math.min(100, (monthTotal / budgetAmount) * 100) : null;
  }

  const payload: DashboardDTO = {
    today,
    week,
    month: monthTotal,
    budget: budget ? serializeBudget(budget) : null,
    remaining,
    percentUsed,
    recent: recent.map(serializeExpense),
  };

  // Touch Prisma namespace so TS doesn't drop the import (we use it for typing only).
  void Prisma;

  return NextResponse.json(payload);
});
