import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

import type { Env } from "../config/env.schema";

@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private readonly from: string;
  // Undefined in "log" transport mode — sendOtp then logs instead of sending.
  private readonly transporter?: Transporter;

  constructor(config: ConfigService<Env, true>) {
    this.from = config.get("MAIL_FROM", { infer: true });
    if (config.get("MAIL_TRANSPORT", { infer: true }) === "smtp") {
      this.transporter = nodemailer.createTransport({
        host: config.get("MAIL_HOST", { infer: true }),
        port: config.get("MAIL_PORT", { infer: true }),
        auth: {
          user: config.get("MAIL_USER", { infer: true }),
          pass: config.get("MAIL_PASS", { infer: true }),
        },
      });
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.transporter) {
      await this.transporter.verify();
      this.logger.log("Mail transport ready (smtp)");
    } else {
      this.logger.log("Mail transport: log (no emails sent — code goes to console)");
    }
  }

  async sendOtp(email: string, code: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[mail:log] OTP for ${email}: ${code}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Your FanDrop sign-in code",
      text: `Your FanDrop sign-in code is ${code}. It expires in 5 minutes.`,
      html: `<p>Your FanDrop sign-in code is <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
    });
    this.logger.log(`OTP email sent to ${email}`);
  }

  async sendPurchaseConfirmation(email: string, itemTitle: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[mail:log] Purchase confirmation for ${email}: ${itemTitle}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Your FanDrop purchase",
      text: `Thanks for your purchase: ${itemTitle}.`,
      html: `<p>Thanks for your purchase: <strong>${itemTitle}</strong>.</p>`,
    });
    this.logger.log(`Purchase email sent to ${email}`);
  }
}
