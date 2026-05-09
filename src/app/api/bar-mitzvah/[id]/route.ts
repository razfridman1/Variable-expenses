import { NextRequest, NextResponse } from "next/server";
import { BarMitzvahCategory } from "@prisma/client";
import { withUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bmExpenseUpdateSchema } from "@/lib/validation";
import { serializeBarMitzvahExpense } from "@/lib/serialize";

export const dynamic = "force-dynamic";

function extractId(req: NextRequest): string | null {
  // /api/bar-mitzvah/<id>
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? null;
}

export const PATCH = withUser(async (req: NextRequest, { user }) => {
  const id = extractId(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const json = await req.json().catch(() => ({}));
  const parsed = bmExpenseUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ולידציה נכשלה", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Ensure ownership before updating.
  const existing = await prisma.barMitzvahExpense.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const d = parsed.data;
  const updated = await prisma.barMitzvahExpense.update({
    where: { id },
    data: {
      ...(d.vendor !== undefined ? { vendor: d.vendor.trim() } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.amountPaid !== undefined ? { amountPaid: d.amountPaid } : {}),
      ...(d.amountRemaining !== undefined
        ? { amountRemaining: d.amountRemaining }
        : {}),
      ...(d.note !== undefined ? { note: d.note } : {}),
      ...(d.paymentDate !== undefined
        ? { paymentDate: new Date(d.paymentDate) }
        : {}),
      ...(d.customCategory !== undefined
        ? {
            customCategory:
              (d.category ?? existing.category) === BarMitzvahCategory.OTHER
                ? d.customCategory
                : null,
          }
        : {}),
    },
  });

  return NextResponse.json(serializeBarMitzvahExpense(updated));
});

export const DELETE = withUser(async (req: NextRequest, { user }) => {
  const id = extractId(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // deleteMany scoped by userId is the simplest race-safe ownership check.
  const { count } = await prisma.barMitzvahExpense.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  return NextResponse.json({ ok: true });
});
