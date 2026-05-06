import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Category } from "@prisma/client";
import { withUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  lastUsedCategory: z.nativeEnum(Category),
});

export const GET = withUser(async (_req, { user }) => {
  const prefs = await prisma.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  return NextResponse.json({ lastUsedCategory: prefs.lastUsedCategory });
});

export const PATCH = withUser(async (req: NextRequest, { user }) => {
  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ולידציה נכשלה", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const prefs = await prisma.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, lastUsedCategory: parsed.data.lastUsedCategory },
    update: { lastUsedCategory: parsed.data.lastUsedCategory },
  });
  return NextResponse.json({ lastUsedCategory: prefs.lastUsedCategory });
});
