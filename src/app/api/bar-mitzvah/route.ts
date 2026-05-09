import { NextRequest, NextResponse } from "next/server";
import { BarMitzvahCategory } from "@prisma/client";
import { withUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bmExpenseCreateSchema } from "@/lib/validation";
import { serializeBarMitzvahExpense } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/**
 * GET /api/bar-mitzvah
 *   Query params (all optional):
 *     category   one of the BarMitzvahCategory enum values
 *     limit      default 200, max 500
 *     offset     default 0
 *
 * Always returns a totals block alongside the items so the client can
 * render a summary without paginating every row.
 */
export const GET = withUser(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);

  const categoryParam = searchParams.get("category");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 200), 1), 500);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  const where: { userId: string; category?: BarMitzvahCategory } = {
    userId: user.id,
  };
  if (
    categoryParam &&
    (Object.values(BarMitzvahCategory) as string[]).includes(categoryParam)
  ) {
    where.category = categoryParam as BarMitzvahCategory;
  }

  const [items, total, sums] = await Promise.all([
    prisma.barMitzvahExpense.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.barMitzvahExpense.count({ where }),
    prisma.barMitzvahExpense.aggregate({
      where: { userId: user.id },
      _sum: { amountPaid: true, amountRemaining: true },
    }),
  ]);

  const totalPaid = Number(sums._sum.amountPaid ?? 0);
  const totalRemaining = Number(sums._sum.amountRemaining ?? 0);

  return NextResponse.json({
    items: items.map(serializeBarMitzvahExpense),
    total,
    limit,
    offset,
    summary: {
      totalPaid,
      totalRemaining,
      totalCommitted: totalPaid + totalRemaining,
    },
  });
});

/**
 * POST /api/bar-mitzvah — create a new Bar Mitzvah expense.
 */
export const POST = withUser(async (req: NextRequest, { user }) => {
  const json = await req.json().catch(() => ({}));
  const parsed = bmExpenseCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ולידציה נכשלה", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const created = await prisma.barMitzvahExpense.create({
    data: {
      userId: user.id,
      vendor: data.vendor.trim(),
      category: data.category,
      customCategory:
        data.category === BarMitzvahCategory.OTHER
          ? data.customCategory ?? null
          : null,
      amountPaid: data.amountPaid,
      amountRemaining: data.amountRemaining,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      note: data.note ?? null,
    },
  });

  return NextResponse.json(serializeBarMitzvahExpense(created), { status: 201 });
});
