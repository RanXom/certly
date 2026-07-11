import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { z } from "zod";

/* eslint-disable @typescript-eslint/no-unused-vars */
import { JWT } from "next-auth/jwt";

import { db } from "@/db";
import { users } from "@/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const CredentialsSchema = z.object({
  email: z.email(),
  password: z.string(),
});

declare module "next-auth/jwt" {
  interface JWT {
    id: string | undefined;
    emailVerified: Date | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string | undefined;
    emailVerified: Date | null;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      emailVerified: Date | null;
    };
  }
}

export default {
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = CredentialsSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const query = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        const user = query[0];

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return user;
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google,
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }

      if (token.name) {
        session.user.name = token.name;
      }

      if (token.email) {
        session.user.email = token.email;
      }

      if (token.picture) {
        session.user.image = token.picture;
      }

      session.user.emailVerified = token.emailVerified ?? null;

      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;

        // Fetch emailVerified from DB on initial sign-in
        // (the user object from authorize() doesn't reliably include it in the token)
        if (user.id) {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id));
          token.emailVerified = dbUser?.emailVerified ?? null;
        }
      }

      if (trigger === "update" && token.id) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id));

        if (dbUser) {
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          token.emailVerified = dbUser.emailVerified;
        }
      }

      return token;
    },
  },
} satisfies NextAuthConfig;
