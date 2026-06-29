import bcrypt from "bcryptjs";

import { zValidator } from "@hono/zod-validator";
import { verifyAuth } from "@hono/auth-js";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/schema";
import { eq } from "drizzle-orm";

const app = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        email: z.email(),
        password: z.string().min(3).max(20),
      }),
    ),
    async (c) => {
      const { name, email, password } = c.req.valid("json");

      const hashedPassword = await bcrypt.hash(password, 12);

      const query = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (query[0]) {
        return c.json(
          {
            error: "Email already in use",
          },
          400,
        );
      }

      await db.insert(users).values({
        email,
        name,
        password: hashedPassword,
      });

      return c.json(null, 200);
    },
  )
  .patch(
    "/",
    verifyAuth(),
    zValidator(
      "json",
      z.object({
        name: z.string().min(1, "Name is required"),
      }),
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { name } = c.req.valid("json");

      if (!auth.token?.id || typeof auth.token.id !== "string") {
        return c.json({ error: "Unauthorized" }, 401);
      }

      await db
        .update(users)
        .set({ name })
        .where(eq(users.id, auth.token.id));

      return c.json({ data: { name } });
    },
  );

export default app;
