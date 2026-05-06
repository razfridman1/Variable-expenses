import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetUpsertSchema } from "@/lib/validation";
import { serializeBudget } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/**
 * GET /api/budget?year=YYYY&month=MM
 * Returns the monthly budget for that month (or null).
 * Defaults to the current month.
 */
export const GET = withUser(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

  const budget = await prisma.monthlyBudget.findUnique({
    where: { userId_year_month: { userId: user.id, year, month } },
  });
  return NextResponse.json(budget ? serializeBudget(budget) : null);
});

/**
 * PUT /api/budget — upsert a (year, month) budget.
 */
export const PUT = withUser(async (req: NextRequest, { user }) => {
  const json = await req.json().catch(() => ({}));
  const parsed = budgetUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ולידציה נכשלה", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { year, month, amount } = parsed.data;
  const budget = await prisma.monthlyBudget.upsert({
    where: { userId_year_month: { userId: user.id, year, month } },
    create: { userId: user.id, year, month, amount },
    update: { amount },
  });
  return NextResponse.json(serializeBudget(budget));
});
