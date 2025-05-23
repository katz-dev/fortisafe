import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestEmailDto } from './dto/test-email.dto';

@ApiTags('email')
@Controller({ path: 'email', version: '1' })
export class EmailController {
  constructor(private readonly emailService: EmailService) { }

  @Post('test')
  @ApiOperation({ summary: 'Send a test email' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async sendTestEmail(@Body() testEmailDto: TestEmailDto) {
    const html = await this.emailService.renderTemplate('test-email.hbs', {
      name: testEmailDto.name,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });

    await this.emailService.sendEmail(
      [testEmailDto.email],
      'FortiSafe Test Email',
      html,
    );

    return { message: 'Test email sent successfully' };
  }
}
