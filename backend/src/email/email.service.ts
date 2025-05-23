import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import Handlebars from 'handlebars';
import * as juice from 'juice';
import * as fs from 'fs';

interface BrevoApiErrorData {
  message?: string;
  code?: string;
}

interface BrevoCustomAxiosResponse extends AxiosResponse {
  data: BrevoApiErrorData; // Made data required to match AxiosResponse
}

interface BrevoError extends AxiosError {
  response?: BrevoCustomAxiosResponse;
}

interface BrevoSendEmailSuccessData {
  messageId?: string;
  // Add other potential success fields if known
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiClient: AxiosInstance;
  private templateDir = 'src/email/templates';
  private readonly templateExt = '.hbs';
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly brevoApiKey: string;

  constructor(private readonly configService: ConfigService) {
    const requiredEnvVars = [
      'BREVO_API_KEY',
      'EMAIL_FROM_ADDRESS',
      'EMAIL_FROM_NAME',
      'BREVO_BASE_URL',
    ];

    for (const envVar of requiredEnvVars) {
      if (!this.configService.get<string>(envVar)) {
        throw new Error(`Missing required email configuration: ${envVar}`);
      }
    }

    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY')!;
    this.fromAddress = this.configService.get<string>('EMAIL_FROM_ADDRESS')!;
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME')!;
    const brevoBaseUrl = this.configService.get<string>('BREVO_BASE_URL')!;

    this.apiClient = axios.create({
      baseURL: brevoBaseUrl,
      headers: {
        'api-key': this.brevoApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.verifyApiKey();

    this.templateDir = `${fs.existsSync('src') ? 'src' : 'dist'}/email/templates`;
    this.logger.verbose(`Template directory: ${this.templateDir}`);
  }

  private async verifyApiKey(): Promise<void> {
    try {
      await this.apiClient.get('/account');
      this.logger.log('Successfully connected to Brevo API (verified API key)');
    } catch (err) {
      const error = err as BrevoError;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Unknown Brevo API connection error during key verification';
      this.logger.error('Brevo API Connection Error:', errorMessage);
      // Consider throwing an error here if API key verification is critical for startup
    }
  }

  private inlineStyles(html: string): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    return juice(html);
  }

  private readTemplate(templateName: string): string {
    const templatePath = `${this.templateDir}/${templateName}`;
    return fs.readFileSync(templatePath, 'utf8');
  }

  renderTemplate(
    templateFile: string,
    context: Record<string, unknown>,
  ): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const template: Handlebars.TemplateDelegate<any> = Handlebars.compile(
      this.readTemplate(templateFile),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const html: string = template(context);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.inlineStyles(html);
  }

  async sendEmail(to: string[], subject: string, html: string): Promise<void> {
    const payload = {
      sender: { email: this.fromAddress, name: this.fromName },
      to: to.map((email) => ({ email })),
      subject,
      htmlContent: html,
    };

    this.logger.verbose(`Sending email to: ${to.join(',')} via Brevo API`);

    try {
      const response = await this.apiClient.post<BrevoSendEmailSuccessData>(
        '/smtp/email',
        payload,
      );
      const messageId = response.data?.messageId || 'N/A';
      this.logger.verbose(
        `Email sent successfully via Brevo API. Message ID: ${messageId}, Status: ${response.status}`,
      );
    } catch (err) {
      const error = err as BrevoError;
      let errorMessage = 'Failed to send email via Brevo API';
      let errorStack: string | undefined = undefined;

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (error.isAxiosError && error.stack) {
        errorStack = error.stack;
      } else if (err instanceof Error) {
        // check original err object for stack
        errorStack = err.stack;
      }

      this.logger.error(
        `Brevo API Email error: ${errorMessage}, Status: ${error.response?.status || 'N/A'}`,
        errorStack,
      );
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }
}
