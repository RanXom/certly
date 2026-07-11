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

// --- Generic in-memory rate limiter ---
const rateLimitMaps = new Map<string, Map<string, { count: number; resetAt: number }>>();

function checkRateLimit(
  category: string,
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  if (!rateLimitMaps.has(category)) {
    rateLimitMaps.set(category, new Map());
  }
  const map = rateLimitMaps.get(category)!;
  const now = Date.now();
  const normalizedKey = key.toLowerCase();
  const entry = map.get(normalizedKey);

  if (!entry || now >= entry.resetAt) {
    map.set(normalizedKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 3;

// Helper to send a verification email
async function sendVerificationEmail(
  email: string,
  userName: string | null,
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  // Delete any existing verification tokens for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, `verify:${normalizedEmail}`));

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(verificationTokens).values({
    identifier: `verify:${normalizedEmail}`,
    token,
    expires,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyLink = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[Mock Verification Email] To: ${normalizedEmail} | Link: ${verifyLink}`,
    );
    return;
  }

  try {
    await resend.emails.send({
      from: "Certly <noreply@certly.studio>",
      to: [normalizedEmail],
      subject: "Verify your email — Certly",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Verify your email</h2>
          <p>Hi${userName ? ` ${userName}` : ""},</p>
          <p>Thanks for signing up for Certly! Please verify your email address by clicking the button below.</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">Verify Email</a>
          <p style="color: #6b7280; font-size: 13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
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

      // Send verification email
      await sendVerificationEmail(email, name);

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

      // Check email verification
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, auth.token.id));

      if (currentUser?.password && !currentUser.emailVerified) {
        return c.json(
          { error: "Please verify your email before updating your profile." },
          403,
        );
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

      // Check email verification for credential accounts
      if (user.password && !user.emailVerified) {
        return c.json(
          { error: "Please verify your email before changing your password." },
          403,
        );
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
      if (!checkRateLimit("forgot-pw", normalizedEmail, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
        // Still return success to avoid leaking rate-limit info as an enumeration vector
        return c.json(successResponse);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail));

      // If user doesn't exist, is OAuth-only, or hasn't verified email, silently succeed
      if (!user || !user.password || !user.emailVerified) {
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
  )
  .post(
    "/verify-email",
    zValidator(
      "json",
      z.object({
        email: z.string().email("Invalid email address"),
        token: z.string().min(1, "Verification token is required"),
      }),
    ),
    async (c) => {
      const { email, token } = c.req.valid("json");
      const normalizedEmail = email.toLowerCase().trim();
      const identifier = `verify:${normalizedEmail}`;

      // Look up the token
      const [storedToken] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        );

      if (!storedToken) {
        return c.json(
          {
            error:
              "Invalid or expired verification link. Please request a new one.",
          },
          400,
        );
      }

      // Check expiry (24 hours)
      if (new Date() > storedToken.expires) {
        await db
          .delete(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, identifier),
              eq(verificationTokens.token, token),
            ),
          );
        return c.json(
          {
            error:
              "This verification link has expired. Please request a new one.",
          },
          400,
        );
      }

      // Verify user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail));

      if (!user) {
        return c.json({ error: "User not found." }, 404);
      }

      // Set emailVerified
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id));

      // Delete the used token
      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        );

      return c.json({ data: { success: true } });
    },
  )
  .post(
    "/resend-verification",
    verifyAuth(),
    async (c) => {
      const auth = c.get("authUser");

      if (!auth.token?.id || typeof auth.token.id !== "string") {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Rate limit by user ID
      if (
        !checkRateLimit(
          "resend-verify",
          auth.token.id,
          RATE_LIMIT_MAX,
          RATE_LIMIT_WINDOW,
        )
      ) {
        return c.json(
          {
            error:
              "Too many verification emails requested. Please try again later.",
          },
          429,
        );
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, auth.token.id));

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      if (user.emailVerified) {
        return c.json({ error: "Email is already verified" }, 400);
      }

      if (!user.email) {
        return c.json({ error: "No email address on account" }, 400);
      }

      await sendVerificationEmail(user.email, user.name);

      return c.json({
        data: { message: "Verification email sent" },
      });
    },
  )
  .post(
    "/delete-account",
    verifyAuth(),
    async (c) => {
      const auth = c.get("authUser");

      if (!auth.token?.id || typeof auth.token.id !== "string") {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, auth.token.id));

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      if (user.password && !user.emailVerified) {
        return c.json({ error: "Please verify your email first." }, 403);
      }

      if (!user.email) {
        return c.json({ error: "No email associated with account." }, 400);
      }

      const normalizedEmail = user.email.toLowerCase().trim();

      // Rate limit check
      if (!checkRateLimit("delete-account", normalizedEmail, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
        return c.json({ error: "Too many requests. Please try again later." }, 429);
      }

      // Delete any existing tokens for this email
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, `delete:${normalizedEmail}`));

      // Generate a cryptographically secure token (256 bits)
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.insert(verificationTokens).values({
        identifier: `delete:${normalizedEmail}`,
        token,
        expires,
      });

      // Build delete link
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const deleteLink = `${appUrl}/delete-account?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

      if (!process.env.RESEND_API_KEY) {
        console.warn(
          `[Mock Delete Account Email] To: ${normalizedEmail} | Link: ${deleteLink}`,
        );
        return c.json({ data: { success: true } });
      }

      try {
        await resend.emails.send({
          from: "Certly <noreply@certly.studio>",
          to: [normalizedEmail],
          subject: "Confirm Account Deletion — Certly",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Confirm Account Deletion</h2>
              <p>We received a request to permanently delete your Certly account.</p>
              <p><strong>Warning: This action is irreversible. All of your projects and data will be permanently lost.</strong></p>
              <p>If you are sure you want to delete your account, click the button below:</p>
              <a href="${deleteLink}" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">Yes, Delete My Account</a>
              <p style="color: #6b7280; font-size: 13px;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send delete account email:", error);
      }

      return c.json({ data: { success: true } });
    }
  )
  .post(
    "/confirm-delete-account",
    zValidator(
      "json",
      z.object({
        email: z.string().email("Invalid email address"),
        token: z.string().min(1, "Token is required"),
      }),
    ),
    async (c) => {
      const { email, token } = c.req.valid("json");
      const normalizedEmail = email.toLowerCase().trim();
      const identifier = `delete:${normalizedEmail}`;

      // Look up the token
      const [storedToken] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        );

      if (!storedToken) {
        return c.json(
          { error: "Invalid or expired deletion link. Please request a new one." },
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
              eq(verificationTokens.identifier, identifier),
              eq(verificationTokens.token, token),
            ),
          );
        return c.json(
          {
            error:
              "This deletion link has expired. Please request a new one.",
          },
          400,
        );
      }

      // Delete the used token
      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        );

      // Verify user exists and delete
      // Cascade will take care of everything else (projects, sessions, accounts)
      await db
        .delete(users)
        .where(eq(users.email, normalizedEmail));

      return c.json({ data: { success: true } });
    }
  );

export default app;
