import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

import { zValidator } from "@hono/zod-validator";
import { verifyAuth } from "@hono/auth-js";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/db";
import { users, verificationTokens } from "@/schema";
import { and, eq } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

// --- In-memory rate limiter for forgot-password (per-email) ---
const FORGOT_PW_LIMIT = 3;
const FORGOT_PW_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const forgotPwRateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

function checkForgotPasswordRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = forgotPwRateLimitMap.get(key);

  if (!entry || now >= entry.resetAt) {
    forgotPwRateLimitMap.set(key, {
      count: 1,
      resetAt: now + FORGOT_PW_WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= FORGOT_PW_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

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
  )
  .post(
    "/forgot-password",
    zValidator(
      "json",
      z.object({
        email: z.string().email("Invalid email address"),
      }),
    ),
    async (c) => {
      const { email } = c.req.valid("json");
      const normalizedEmail = email.toLowerCase().trim();

      // Generic success message — always returned to prevent email enumeration
      const successResponse = {
        data: {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
      };

      // Rate limit check
      if (!checkForgotPasswordRateLimit(normalizedEmail)) {
        // Still return success to avoid leaking rate-limit info as an enumeration vector
        return c.json(successResponse);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail));

      // If user doesn't exist or is an OAuth-only account, silently succeed
      if (!user || !user.password) {
        return c.json(successResponse);
      }

      // Delete any existing tokens for this email
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, normalizedEmail));

      // Generate a cryptographically secure token (256 bits)
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.insert(verificationTokens).values({
        identifier: normalizedEmail,
        token,
        expires,
      });

      // Build reset link
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetLink = `${appUrl}/forgot-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

      if (!process.env.RESEND_API_KEY) {
        console.warn(
          `[Mock Reset Email] To: ${normalizedEmail} | Link: ${resetLink}`,
        );
        return c.json(successResponse);
      }

      try {
        await resend.emails.send({
          from: "Certly <noreply@certly.studio>",
          to: [normalizedEmail],
          subject: "Reset your password — Certly",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2>Reset your password</h2>
              <p>We received a request to reset the password for your Certly account.</p>
              <p>Click the button below to choose a new password. This link expires in 15 minutes.</p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">Reset Password</a>
              <p style="color: #6b7280; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send reset email:", error);
        // Still return success to avoid leaking info
      }

      return c.json(successResponse);
    },
  )
  .post(
    "/reset-password",
    zValidator(
      "json",
      z.object({
        email: z.string().email("Invalid email address"),
        token: z.string().min(1, "Reset token is required"),
        newPassword: z
          .string()
          .min(3, "Password must be at least 3 characters")
          .max(20, "Password must be at most 20 characters"),
        confirmPassword: z.string().min(1, "Please confirm your new password"),
      }),
    ),
    async (c) => {
      const { email, token, newPassword, confirmPassword } =
        c.req.valid("json");
      const normalizedEmail = email.toLowerCase().trim();

      if (newPassword !== confirmPassword) {
        return c.json({ error: "Passwords do not match" }, 400);
      }

      // Look up the token
      const [storedToken] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, normalizedEmail),
            eq(verificationTokens.token, token),
          ),
        );

      if (!storedToken) {
        return c.json(
          { error: "Invalid or expired reset link. Please request a new one." },
          400,
        );
      }

      // Check expiry
      if (new Date() > storedToken.expires) {
        // Clean up expired token
        await db
          .delete(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, normalizedEmail),
              eq(verificationTokens.token, token),
            ),
          );
        return c.json(
          {
            error:
              "This reset link has expired. Please request a new one.",
          },
          400,
        );
      }

      // Verify user exists and is a credential account
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail));

      if (!user || !user.password) {
        return c.json(
          { error: "Unable to reset password for this account." },
          400,
        );
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));

      // Delete the used token (prevent replay)
      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, normalizedEmail),
            eq(verificationTokens.token, token),
          ),
        );

      return c.json({ data: { success: true } });
    },
  );

export default app;
