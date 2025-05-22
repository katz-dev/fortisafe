import { Injectable, Logger } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    // Check if we have email credentials configured
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
    
    if (emailUser && emailPassword) {
      // Initialize the transporter with real SMTP configuration
      this.logger.log('Initializing email service with SMTP transport');
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com'),
        port: this.configService.get<number>('EMAIL_PORT', 587),
        secure: this.configService.get<boolean>('EMAIL_SECURE', false),
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });
    } else {
      // For development/testing - use a mock transport that doesn't send actual emails
      this.logger.warn('Email credentials not found. Using development preview mode.');
      this.transporter = nodemailer.createTransport({
        name: 'fortisafe-dev',
        version: '1.0.0',
        send: (mail, callback) => {
          const output = mail.message.createReadStream();
          let message = '';
          output.on('data', (chunk) => {
            message += chunk.toString();
          });
          output.on('end', () => {
            this.logger.debug('Development mode email content:');
            this.logger.debug(message);
            // Create a complete SentMessageInfo object to satisfy TypeScript
            callback(null, {
              messageId: `dev-${Date.now()}`,
              envelope: { from: 'dev@fortisafe.local', to: ['dev@fortisafe.local'] },
              accepted: ['dev@fortisafe.local'],
              rejected: [],
              pending: [],
              response: 'Development mode - no email sent'
            });
          });
        },
      });
    }
  }

  /**
   * Send an email using a template
   * @param to Recipient email address
   * @param subject Email subject
   * @param templateName Name of the template file (without extension)
   * @param context Data to be passed to the template
   * @returns Promise with the send result
   */
  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: any,
  ): Promise<any> {
    try {
      // Get template path
      const templatePath = path.join(
        process.cwd(),
        'src/email/templates',
        `${templateName}.hbs`,
      );

      // Read template file
      const template = fs.readFileSync(templatePath, 'utf-8');
      
      // Compile template with Handlebars
      const compiledTemplate = handlebars.compile(template);
      
      // Render template with context data
      const html = compiledTemplate(context);

      // Send email
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', 'FortiSafe <noreply@fortisafe.live>'),
        to,
        subject,
        html,
      };

      // Check if we're in development mode without real email credentials
      const emailUser = this.configService.get<string>('EMAIL_USER');
      const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
      
      if (!emailUser || !emailPassword) {
        // In development mode, just log the email content
        this.logger.warn(`[DEV MODE] Email would be sent to ${to}: ${subject}`);
        this.logger.debug(`Email content: ${html}`);
        
        // Return a mock result for development
        return {
          messageId: `dev-${Date.now()}`,
          envelope: { from: mailOptions.from, to: mailOptions.to },
          accepted: [mailOptions.to],
          response: 'Development mode - no email sent',
        };
      }

      // Send the actual email in production mode
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send a password reset email
   * @param email Recipient email address
   * @param resetToken Reset token
   * @param username User's name
   */
  async sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<any> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'https://app.fortisafe.live')}/reset-password?token=${resetToken}`;
    
    return this.sendEmail(
      email,
      'FortiSafe Password Reset',
      'password-reset',
      {
        username,
        resetUrl,
        year: new Date().getFullYear(),
      },
    );
  }

  /**
   * Send a security alert email
   * @param email Recipient email address
   * @param alertType Type of security alert
   * @param details Additional details about the alert
   * @param username User's name
   */
  async sendSecurityAlertEmail(
    email: string, 
    alertType: string, 
    details: any, 
    username: string
  ): Promise<any> {
    return this.sendEmail(
      email,
      `FortiSafe Security Alert: ${alertType}`,
      'security-alert',
      {
        username,
        alertType,
        details,
        timestamp: new Date().toLocaleString(),
        year: new Date().getFullYear(),
      },
    );
  }

  /**
   * Send a test email to an authenticated user
   * @param email Recipient email address
   * @param username User's name
   */
  async sendTestEmail(email: string, username: string): Promise<any> {
    this.logger.log(`Sending test email to ${email}`);
    return this.sendEmail(
      email,
      'FortiSafe Test Email',
      'test-email',
      {
        username,
        email,
        year: new Date().getFullYear(),
      },
    );
  }

  create(createEmailDto: CreateEmailDto) {
    return 'This action adds a new email';
  }

  findAll() {
    return `This action returns all email`;
  }

  findOne(id: number) {
    return `This action returns a #${id} email`;
  }

  update(id: number, updateEmailDto: UpdateEmailDto) {
    return `This action updates a #${id} email`;
  }

  remove(id: number) {
    return `This action removes a #${id} email`;
  }
}
