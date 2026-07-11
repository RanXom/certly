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
  )
  .post(
    "/change-password",
    verifyAuth(),
    zValidator(
      "json",
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
          .string()
          .min(3, "Password must be at least 3 characters")
          .max(20, "Password must be at most 20 characters"),
        confirmPassword: z.string().min(1, "Please confirm your new password"),
      }),
    ),
    async (c) => {
      const auth = c.get("authUser");

      if (!auth.token?.id || typeof auth.token.id !== "string") {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { currentPassword, newPassword, confirmPassword } =
        c.req.valid("json");

      if (newPassword !== confirmPassword) {
        return c.json({ error: "Passwords do not match" }, 400);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, auth.token.id));

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      if (!user.password) {
        return c.json(
          {
            error:
              "Password change is not available for accounts using social login",
          },
          400,
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        return c.json({ error: "Current password is incorrect" }, 400);
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);

      if (isSamePassword) {
        return c.json(
          { error: "New password must be different from current password" },
          400,
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, auth.token.id));

      return c.json({ data: { success: true } });
    },
  );

export default app;
