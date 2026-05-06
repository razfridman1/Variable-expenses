import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_req: NextRequest, { user }) => {
  return NextResponse.json({ id: user.id, email: user.email });
});
