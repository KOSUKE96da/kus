import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { id } = await params;

  const site = await prisma.site.findUnique({ where: { id } });
  if (!site || site.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, feedUrl, category, tags, isActive } = body;

  const updated = await prisma.site.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(feedUrl !== undefined && { feedUrl }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { id } = await params;

  const site = await prisma.site.findUnique({ where: { id } });
  if (!site || site.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // お気に入り記事があるか確認
  const favoriteCount = await prisma.favorite.count({
    where: { userId, article: { siteId: id } },
  });

  // force=true の場合のみ削除を許可
  const url = new URL(_request.url);
  const force = url.searchParams.get("force") === "true";

  if (favoriteCount > 0 && !force) {
    return Response.json(
      { error: "HAS_FAVORITES", favoriteCount },
      { status: 409 }
    );
  }

  await prisma.site.delete({ where: { id } });

  return Response.json({ success: true });
}
