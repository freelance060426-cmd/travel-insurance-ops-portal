import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  attachments?: Array<{ filename: string; path: string; contentType?: string }>;
};

@Injectable()
export class EmailService {
  private transporter = this.createTransporter();

  private createTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "587");
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  getProviderLabel() {
    return this.transporter ? "SMTP" : "SMTP_NOT_CONFIGURED";
  }

  async send(input: SendEmailInput) {
    if (!this.transporter) {
      throw new ServiceUnavailableException(
        "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.",
      );
    }

    const from = process.env.EMAIL_FROM;
    if (!from) {
      throw new ServiceUnavailableException(
        "EMAIL_FROM is not configured.",
      );
    }

    return this.transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      attachments: input.attachments,
    });
  }
}
