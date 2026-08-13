import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "@/server/env";
import { isAllowedOwner } from "@/server/auth-policy";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  providers: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? [Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET })]
    : [],
  callbacks: {
    signIn({ user }) {
      return isAllowedOwner(user.email, env.OWNER_EMAIL);
    },
    authorized({ auth: session }) {
      if (env.DEMO_PUBLIC_ACCESS === "true") return true;
      if (process.env.NODE_ENV !== "production" && (process.env.E2E_BYPASS_AUTH === "true" || !env.AUTH_SECRET)) return true;
      return isAllowedOwner(session?.user?.email, env.OWNER_EMAIL);
    },
  },
  pages: { signIn: "/login" },
});
