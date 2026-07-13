import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        // 古い高ラウンドハッシュを10ラウンドに更新して次回ログインを高速化
        const rounds = parseInt(user.passwordHash.split("$")[2] ?? "10", 10);
        if (rounds > 10) {
          const newHash = await bcrypt.hash(credentials.password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }
      // update() でアバター更新を通知（フラグのみ、画像データは持たない）
      if (trigger === "update" && session?.avatarUpdated) {
        token.avatarUpdated = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const userId = token.id as string;
        (session.user as any).id = userId;
        // 画像はAPIルート経由で配信（Cookieを小さく保つ）
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { image: true },
        });
        session.user.image = user?.image
          ? `/api/user/avatar/${userId}`
          : null;
      }
      return session;
    },
  },
};
