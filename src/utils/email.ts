/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../app/config/env.js";
import AppError from "./appError.js";

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: envVars.EMAIL_SENDER.SMTP_HOST,
    secure: true,
    auth: {
        user: envVars.EMAIL_SENDER.SMTP_USER,
        pass: envVars.EMAIL_SENDER.SMTP_PASS
    },
    port: Number(envVars.EMAIL_SENDER.SMTP_PORT)
});

interface SendEmailOptions {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType: string;
    }[];
}

/**
 * Send an email (templated via EJS)
 * Adapted for Registration ↔ Payment schema
 */
export const sendEmail = async ({
    to,
    subject,
    templateName,
    templateData,
    attachments
}: SendEmailOptions) => {
    try {
        // Resolve EJS template path
        const templatePath = path.resolve(process.cwd(), `src/app/templates/${templateName}.ejs`);

        // Render HTML from template
        const html = await ejs.renderFile(templatePath, templateData);

        // Send email
        const info = await transporter.sendMail({
            from: envVars.EMAIL_SENDER.SMTP_FROM,
            to,
            subject,
            html,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType
            }))
        });

        console.log(`✅ Email sent to ${to} : ${info.messageId}`);
    } catch (error: any) {
        console.error("❌ Email Sending Error:", error.message);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
    }
};