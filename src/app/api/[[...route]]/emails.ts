import { Hono } from "hono";
import { Resend } from "resend";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

const app = new Hono().post(
    "/",
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
        const { to, senderName, subject, body, attachmentBase64, attachmentName } = c.req.valid("json");

        const formattedName = senderName && senderName.trim() ? senderName.trim() : "Certly";
        const emailSlug = senderName && senderName.trim() ? senderName.trim().toLowerCase().replace(/\s+/g, '') : "certly";
        const fromAddress = `${formattedName} <${emailSlug}@shizain.xyz>`;

        if (!process.env.RESEND_API_KEY) {
            console.warn(`[Mock Email] Sent to ${to} from ${fromAddress} with subject "${subject}". Attachment: ${attachmentName}`);
            return c.json({ data: { message: "Mock email sent" } });
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

            return c.json({ data });
        } catch (error) {
            console.error("Resend Error:", error);
            return c.json({ error: "Failed to send email" }, 500);
        }
    }
);

export default app;
