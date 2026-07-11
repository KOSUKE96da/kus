import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getArticles } from "@/lib/getArticles";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { searchParams } = request.nextUrl;
  const filter = (searchParams.get("filter") || "all") as "all" | "unread" | "read" | "favorites";
  const sort = (searchParams.get("sort") || "desc") as "desc" | "asc";
  const siteId = searchParams.get("siteId") || undefined;

  const result = await getArticles(userId, filter, sort, siteId);
  return Response.json(result);
}
