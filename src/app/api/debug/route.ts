import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const url = process.env.DATABASE_URL ?? "not set";
    return Response.json({
      ok: true,
      userCount,
      dbUrl: url.substring(0, 30) + "...",
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
