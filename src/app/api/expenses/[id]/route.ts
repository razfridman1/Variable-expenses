import { NextRequest, NextResponse } from "next/server";
import { Category } from "@prisma/client";
import { withUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseUpdateSchema } from "@/lib/validation";
import { serializeExpense } from "@/lib/serialize";

export const dynamic = "force-dynamic";

function extractId(req: NextRequest): string | null {
  // /api/expenses/<id>
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? null;
}

export const PATCH = withUser(async (req: NextRequest, { user }) => {
  const id = extractId(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const json = await req.json().catch(() => ({}));
  const parsed = expenseUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ולידציה נכשלה", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Ensure ownership before updating.
  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const d = parsed.data;
  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(d.amount !== undefined ? { amount: d.amount } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.note !== undefined ? { note: d.note } : {}),
      ...(d.spentAt !== undefined ? { spentAt: new Date(d.spentAt) } : {}),
      ...(d.customCategory !== undefined
        ? {
            customCategory:
              (d.category ?? existing.category) === Category.OTHER
                ? d.customCategory
                : null,
          }
        : {}),
    },
  });

  return NextResponse.json(serializeExpense(updated));
});

export const DELETE = withUser(async (req: NextRequest, { user }) => {
  const id = extractId(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // deleteMany scoped by userId is the simplest race-safe ownership check.
  const { count } = await prisma.expense.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true });
});
