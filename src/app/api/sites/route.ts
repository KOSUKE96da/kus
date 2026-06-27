import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const sites = await prisma.site.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(sites);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body = await request.json();
  const { name, feedUrl, category, tags } = body;

  if (!name || !feedUrl) {
    return Response.json({ error: "name and feedUrl are required" }, { status: 400 });
  }

  const site = await prisma.site.create({
    data: {
      userId,
      name,
      feedUrl,
      category: category || null,
      tags: tags || null,
    },
  });

  return Response.json(site, { status: 201 });
}
