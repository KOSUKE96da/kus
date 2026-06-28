import { PrismaClient } from "@/generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function stripBOM(s: string) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function createPrismaClient() {
  const url = stripBOM(process.env.DATABASE_URL ?? "file:./dev.db");
  const authToken = process.env.TURSO_AUTH_TOKEN
    ? stripBOM(process.env.TURSO_AUTH_TOKEN)
    : undefined;
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
