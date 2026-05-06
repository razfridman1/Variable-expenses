import { NextRequest, NextResponse } from "next/server";
import { Category } from "@prisma/client";
import { withUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lastNMonths } from "@/lib/dates";
import type { YearlyAnalyticsDTO } from "@/types/dto";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/yearly
 * Returns rolling 12-month totals + by-month breakdown + by-category totals.
 */
export const GET = withUser(async (_req: NextRequest, { user }) => {
  const months = lastNMonths(12);
  const earliest = months[0].from;
  const latest = months[months.length - 1].to;

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id, spentAt: { gte: earliest, lte: latest } },
    select: {
      amount: true,
      category: true,
      customCategory: true,
      spentAt: true,
    },
  });

  let total = 0;
  const byMonthMap = new Map<string, number>();
  const byCategoryMap = new Map<
    string,
    { category: Category; customCategory: string | null; total: number; count: number }
  >();

  for (const e of expenses) {
    const amt = Number(e.amount);
    total += amt;

    const y = e.spentAt.getFullYear();
    const m = e.spentAt.getMonth() + 1;
    const key = `${y}-${m}`;
    byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + amt);

    const catKey =
      e.category === Category.OTHER && e.customCategory
        ? `OTHER::${e.customCategory.toLowerCase()}`
        : e.category;
    const existing = byCategoryMap.get(catKey);
    if (existing) {
      existing.total += amt;
      existing.count += 1;
    } else {
      byCategoryMap.set(catKey, {
        category: e.category,
        customCategory: e.customCategory,
        total: amt,
        count: 1,
      });
    }
  }

  const byMonth = months.map(({ year, month }) => ({
    year,
    month,
    total: byMonthMap.get(`${year}-${month}`) ?? 0,
  }));

  const payload: YearlyAnalyticsDTO = {
    total,
    byMonth,
    byCategory: Array.from(byCategoryMap.values()).sort((a, b) => b.total - a.total),
  };

  return NextResponse.json(payload);
});
