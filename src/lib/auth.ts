import type { NextAuthOptions } from "next-auth";

// NextAuth's PrismaAdapter expects the classic @prisma/client query surface
// (db.user.findUnique, etc). This project's db.ts uses Prisma Next's
// db.orm.<Model> API instead, so a custom Adapter is needed for database
// sessions / OAuth account linking. JWT sessions work without one.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [],
  pages: {
    signIn: "/auth/signin",
  },
};
