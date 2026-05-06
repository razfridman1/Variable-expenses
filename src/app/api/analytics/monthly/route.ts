import { NextRequest, NextResponse } from "next/server";
import { Category } from "@prisma/client";
import { withUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/dates";
import type { MonthlyAnalyticsDTO } from "@/types/dto";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/monthly?year=YYYY&month=MM
 * Defaults to the current month.
 */
export const GET = withUser(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const anchor = new Date(year, month - 1, 1);
  const { from, to } = monthRange(anchor);

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id, spentAt: { gte: from, lte: to } },
    select: {
      amount: true,
      category: true,
      customCategory: true,
      spentAt: true,
    },
  });

  // Aggregate by category in JS to handle the OTHER + customCategory grouping.
  const byCategoryMap = new Map<
    string,
    { category: Category; customCategory: string | null; total: number; count: number }
  >();
  let total = 0;

  for (const e of expenses) {
    const amt = Number(e.amount);
    total += amt;
    const key =
      e.category === Category.OTHER && e.customCategory
        ? `OTHER::${e.customCategory.toLowerCase()}`
        : e.category;
    const existing = byCategoryMap.get(key);
    if (existing) {
      existing.total += amt;
      existing.count += 1;
    } else {
      byCategoryMap.set(key, {
        category: e.category,
        customCategory: e.customCategory,
        total: amt,
        count: 1,
      });
    }
  }

  // Aggregate by day (YYYY-MM-DD).
  const byDayMap = new Map<string, number>();
  for (const e of expenses) {
    const d = e.spentAt.toISOString().slice(0, 10);
    byDayMap.set(d, (byDayMap.get(d) ?? 0) + Number(e.amount));
  }

  // Fill in missing days as zero so the chart has a continuous x-axis.
  const days: Array<{ date: string; total: number }> = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = cursor.toISOString().slice(0, 10);
    days.push({ date: key, total: byDayMap.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const payload: MonthlyAnalyticsDTO = {
    year,
    month,
    total,
    byCategory: Array.from(byCategoryMap.values()).sort((a, b) => b.total - a.total),
    byDay: days,
  };

  return NextResponse.json(payload);
});
