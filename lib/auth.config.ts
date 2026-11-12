import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
  providers: [
    // We'll leave this empty in the base config 
    // and add it in the main auth.ts to avoid Edge issues
    Credentials({}), 
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60, // 24 hours in seconds
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
      options: {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds (ensures cookie is persistent, not session-only)
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = (token as any).role
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
} satisfies NextAuthConfig
