import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport = require('nodemailer/lib/smtp-transport');
import Handlebars from 'handlebars';
import * as juice from 'juice';
import * as fs from 'fs';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templateDir = 'src/email/templates';
  private readonly templateExt = '.hbs';
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    // Validate required email configuration
    const requiredEnvVars = [
      'BREVO_SMTP',
      'BREVO_SMTP_PORT',
      'BREVO_USER',
      'BREVO_PASS',
      'EMAIL_FROM_ADDRESS',
    ];

    for (const envVar of requiredEnvVars) {
      if (!this.configService.get<string>(envVar)) {
        throw new Error(`Missing required email configuration: ${envVar}`);
      }
    }

    const transportOptions: SMTPTransport.Options = {
      host: this.configService.get<string>('BREVO_SMTP'),
      port: parseInt(this.configService.get<string>('BREVO_SMTP_PORT') || '587', 10),
      secure: false,
      auth: {
        user: this.configService.get<string>('BREVO_USER'),
        pass: this.configService.get<string>('BREVO_PASS'),
      },
      debug: true,
      logger: true,
    };

    this.transporter = nodemailer.createTransport(transportOptions);

    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP Connection Error:', error);
      } else {
        this.logger.log('SMTP Server is ready to take our messages');
      }
    });

    this.fromAddress = `FortiSafe <${this.configService.get<string>('EMAIL_FROM_ADDRESS')}>`;

    this.templateDir = `${fs.existsSync('src') ? 'src' : 'dist'}/email/templates`;
    this.logger.verbose(`Template directory: ${this.templateDir}`);
  }

  private async inlineStyles(html: string): Promise<string> {
    return juice(html);
  }

  private readTemplate(templateName: string): string {
    const templatePath = `${this.templateDir}/${templateName}`;
    return fs.readFileSync(templatePath, 'utf8');
  }

  async renderTemplate(
    templateFile: string,
    context: Record<string, unknown>,
  ): Promise<string> {
    const template = Handlebars.compile(this.readTemplate(templateFile));
    const html = template(context);
    return this.inlineStyles(html);
  }

  async sendEmail(to: string[], subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: this.fromAddress,
      to: to.join(','),
      subject: subject,
      html: html,
    };

    this.logger.verbose(`Sending email to: ${to.join(',')}`);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.verbose(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Email error: ${error}`);
      throw error;
    }
  }
}
