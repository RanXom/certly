import { Hono } from "hono";
import { Resend } from "resend";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { verifyAuth } from "@hono/auth-js";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

// --- In-memory rate limiter (per-user, daily) ---
// Resets on server restart. For persistence across deploys, move to DB/Redis.
const DAILY_EMAIL_LIMIT_FREE = 20;
// TODO: [PRO PLAN] Increase or remove this limit for pro users.
//   - Check `isPro` on the user (once billing is wired up)
//   - Use a higher limit like 500 or unlimited for pro users
//   - Example: const limit = isPro ? DAILY_EMAIL_LIMIT_PRO : DAILY_EMAIL_LIMIT_FREE;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now >= entry.resetAt) {
        // Start a new window (resets at midnight UTC)
        const tomorrow = new Date();
        tomorrow.setUTCHours(24, 0, 0, 0);

        rateLimitMap.set(userId, { count: 1, resetAt: tomorrow.getTime() });
        return { allowed: true, remaining: DAILY_EMAIL_LIMIT_FREE - 1 };
    }

    if (entry.count >= DAILY_EMAIL_LIMIT_FREE) {
        return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: DAILY_EMAIL_LIMIT_FREE - entry.count };
}

const app = new Hono().post(
    "/",
    verifyAuth(),
    zValidator(
        "json",
        z.object({
            to: z.string().email(),
            senderName: z.string().optional(),
            subject: z.string().min(1),
            body: z.string().min(1),
            attachmentBase64: z.string().min(1),
            attachmentName: z.string(),
        })
    ),
    async (c) => {
        const auth = c.get("authUser");

        if (!auth.token?.id || typeof auth.token.id !== "string") {
            return c.json({ error: "Unauthorized" }, 401);
        }

        // Rate limit check
        const { allowed, remaining } = checkRateLimit(auth.token.id);

        if (!allowed) {
            return c.json(
                {
                    error: `Daily email limit reached (${DAILY_EMAIL_LIMIT_FREE}/day). Upgrade to Pro for higher limits.`,
                },
                429
            );
        }

        const { to, senderName, subject, body, attachmentBase64, attachmentName } = c.req.valid("json");

        const formattedName = senderName && senderName.trim() ? senderName.trim() : "Certly";
        const emailSlug = senderName && senderName.trim() ? senderName.trim().toLowerCase().replace(/\s+/g, '') : "certly";
        const fromAddress = `${formattedName} <${emailSlug}@certly.studio>`;

        if (!process.env.RESEND_API_KEY) {
            console.warn(`[Mock Email] Sent to ${to} from ${fromAddress} with subject "${subject}". Attachment: ${attachmentName}. Remaining today: ${remaining}`);
            return c.json({ data: { message: "Mock email sent" }, remaining });
        }

        try {
            const data = await resend.emails.send({
                from: fromAddress,
                to: [to],
                subject: subject,
                html: `<p>${body.replace(/\n/g, '<br />')}</p>`,
                attachments: [
                    {
                        filename: attachmentName,
                        content: attachmentBase64,
                    },
                ],
            });

            return c.json({ data, remaining });
        } catch (error) {
            console.error("Resend Error:", error);
            return c.json({ error: "Failed to send email" }, 500);
        }
    }
);

export default app;
