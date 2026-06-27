import bcrypt from "bcryptjs";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/schema";

const app = new Hono().post(
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

    await db.insert(users).values({
      email,
      name,
      password: hashedPassword,
    });

    return c.json(null, 200);
  },
);

export default app;
