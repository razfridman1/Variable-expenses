import { NextRequest, NextResponse } from "next/server";
import { Category } from "@prisma/client";
import { withUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseCreateSchema } from "@/lib/validation";
import { serializeExpense } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/**
 * GET /api/expenses
 *   Query params (all optional):
 *     from   ISO date — inclusive lower bound on spentAt
 *     to     ISO date — exclusive upper bound on spentAt
 *     category   one of the Category enum values
 *     limit  default 100, max 500
 *     offset default 0
 */
export const GET = withUser(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const categoryParam = searchParams.get("category");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100), 1), 500);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  const where: {
    userId: string;
    spentAt?: { gte?: Date; lt?: Date };
    category?: Category;
  } = { userId: user.id };

  if (from || to) {
    where.spentAt = {};
    if (from) where.spentAt.gte = new Date(from);
    if (to) where.spentAt.lt = new Date(to);
  }

  if (categoryParam && (Object.values(Category) as string[]).includes(categoryParam)) {
    where.category = categoryParam as Category;
  }

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { spentAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map(serializeExpense),
    total,
    limit,
    offset,
  });
});

/**
 * POST /api/expenses — create new expense.
 * Updates the user's "lastUsedCategory" preference as a side-effect.
 */
export const POST = withUser(async (req: NextRequest, { user }) => {
  const json = await req.json().catch(() => ({}));
  const parsed = expenseCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ולידציה נכשלה", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const created = await prisma.$transaction(async (tx) => {
    const exp = await tx.expense.create({
      data: {
        userId: user.id,
        amount: data.amount,
        category: data.category,
        customCategory:
          data.category === Category.OTHER ? data.customCategory ?? null : null,
        note: data.note ?? null,
        spentAt: data.spentAt ? new Date(data.spentAt) : new Date(),
      },
    });
    await tx.userPreferences.upsert({
      where: { userId: user.id },
      create: { userId: user.id, lastUsedCategory: data.category },
      update: { lastUsedCategory: data.category },
    });
    return exp;
  });

  return NextResponse.json(serializeExpense(created), { status: 201 });
});
