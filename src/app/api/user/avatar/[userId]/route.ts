import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  if (!user?.image) {
    return new Response(null, { status: 404 });
  }

  // data:image/jpeg;base64,... 形式を解析
  const match = user.image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return new Response(null, { status: 404 });

  const [, mimeType, base64Data] = match;
  const buffer = Buffer.from(base64Data, "base64");

  return new Response(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
