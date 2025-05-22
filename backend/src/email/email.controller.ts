import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { SendPasswordResetEmailDto } from './dto/send-password-reset-email.dto';
import { SendSecurityAlertEmailDto } from './dto/send-security-alert-email.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new email' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Email created successfully' })
  create(@Body() createEmailDto: CreateEmailDto) {
    return this.emailService.create(createEmailDto);
  }
  
  @Post('password-reset')
  @ApiOperation({ summary: 'Send a password reset email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset email sent successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async sendPasswordResetEmail(@Body() sendPasswordResetEmailDto: SendPasswordResetEmailDto) {
    const { email, resetToken, username } = sendPasswordResetEmailDto;
    return this.emailService.sendPasswordResetEmail(email, resetToken, username);
  }
  
  @Post('security-alert')
  @ApiOperation({ summary: 'Send a security alert email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Security alert email sent successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async sendSecurityAlertEmail(@Body() sendSecurityAlertEmailDto: SendSecurityAlertEmailDto) {
    const { email, alertType, details, username } = sendSecurityAlertEmailDto;
    return this.emailService.sendSecurityAlertEmail(email, alertType, details, username);
  }
  
  @Post('test')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send a test email to the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test email sent successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User is not authenticated' })
  async sendTestEmail(@Req() req, @Body() sendTestEmailDto: SendTestEmailDto) {
    // If no email is provided, use the authenticated user's email
    const email = sendTestEmailDto.email || req.user.email;
    const username = sendTestEmailDto.username || req.user.firstName || 'User';
    
    return this.emailService.sendTestEmail(email, username);
  }

  @Get()
  findAll() {
    return this.emailService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmailDto: UpdateEmailDto) {
    return this.emailService.update(+id, updateEmailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emailService.remove(+id);
  }
}
