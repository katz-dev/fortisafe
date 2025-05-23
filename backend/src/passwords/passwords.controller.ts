import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PasswordsService } from './passwords.service';
import { CreatePasswordDto } from './dto/create-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CheckReusedPasswordDto } from './dto/check-reused-password.dto';
import { Password } from './entities/password.schema';
import { PasswordHistoryResponseDto } from './dto/password-history.dto';

@ApiTags('passwords')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('passwords')
export class PasswordsController {
  constructor(private readonly passwordsService: PasswordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new password entry' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The password has been successfully created.',
    type: Password,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiBody({ type: CreatePasswordDto })
  create(@Request() req, @Body() createPasswordDto: CreatePasswordDto) {
    return this.passwordsService.create(req.user.userId, createPasswordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all passwords for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all passwords for the user.',
    type: [Password],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  findAll(@Request() req) {
    return this.passwordsService.findAll(req.user.userId);
  }

  @Get('check-duplicate')
  @ApiOperation({ summary: 'Check if a password entry already exists' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Whether a duplicate exists.',
    schema: {
      type: 'object',
      properties: {
        exists: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async checkDuplicate(
    @Request() req,
    @Query('website') website: string,
    @Query('username') username: string,
  ) {
    const exists = await this.passwordsService.checkDuplicate(
      req.user.userId,
      website,
      username,
    );
    return { exists };
  }

  @Post('check-reused')
  @ApiOperation({
    summary: 'Check if a password is reused across multiple accounts',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Information about password reuse',
    schema: {
      type: 'object',
      properties: {
        isReused: {
          type: 'boolean',
          example: true,
        },
        usedIn: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              website: {
                type: 'string',
                example: 'example.com',
              },
              username: {
                type: 'string',
                example: 'user@example.com',
              },
            },
          },
        },
      },
    },
  })
  async checkReusedPassword(
    @Request() req,
    @Body() checkReusedPasswordDto: CheckReusedPasswordDto,
    @Query('currentPasswordId') currentPasswordId?: string,
  ) {
    return this.passwordsService.checkReusedPassword(
      req.user.userId,
      checkReusedPasswordDto.password,
      currentPasswordId,
    );
  }

  @Get('check-password-change')
  @ApiOperation({ summary: 'Check if a password has changed for a website' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Whether the password has changed.',
    schema: {
      type: 'object',
      properties: {
        hasChanged: {
          type: 'boolean',
          example: true,
        },
        lastUpdated: {
          type: 'string',
          format: 'date-time',
          example: '2024-03-20T12:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async checkPasswordChange(
    @Request() req,
    @Query('website') website: string,
    @Query('username') username: string,
    @Query('currentPassword') currentPassword?: string,
  ) {
    return this.passwordsService.checkPasswordChange(
      req.user.userId,
      website,
      username,
      currentPassword,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific password by ID' })
  @ApiParam({ name: 'id', description: 'Password ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The password entry.',
    type: Password,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Password not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  findOne(@Request() req, @Param('id') id: string) {
    return this.passwordsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a password entry' })
  @ApiParam({ name: 'id', description: 'Password ID' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The password has been successfully updated.',
    type: Password,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Password not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.passwordsService.update(req.user.userId, id, updatePasswordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a password entry' })
  @ApiParam({ name: 'id', description: 'Password ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The password has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Password not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  remove(@Request() req, @Param('id') id: string) {
    return this.passwordsService.remove(req.user.userId, id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get password history for a specific password' })
  @ApiParam({ name: 'id', description: 'Password ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password history entries.',
    type: [PasswordHistoryResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Password not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  getPasswordHistory(@Request() req, @Param('id') id: string) {
    return this.passwordsService.getPasswordHistory(req.user.userId, id);
  }

  @Get('history/all')
  @ApiOperation({
    summary: 'Get all password history for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All password history entries grouped by password ID.',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: '#/components/schemas/PasswordHistoryResponseDto' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  getAllPasswordHistory(@Request() req) {
    return this.passwordsService.getAllPasswordHistory(req.user.userId);
  }

  @Get(':id/decrypt')
  @ApiOperation({ summary: 'Get the decrypted password value' })
  @ApiParam({ name: 'id', description: 'Password ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The decrypted password.',
    schema: {
      type: 'object',
      properties: {
        password: {
          type: 'string',
          example: 'MySecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Password not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async getDecryptedPassword(@Request() req, @Param('id') id: string) {
    const decryptedPassword = await this.passwordsService.decryptPassword(
      req.user.userId,
      id,
    );
    return { password: decryptedPassword };
  }

  @Post('update-password')
  @ApiOperation({ summary: 'Update password for a website and username' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The password has been successfully updated.',
    type: Password,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Password not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        website: {
          type: 'string',
          example: 'example.com',
        },
        username: {
          type: 'string',
          example: 'user@example.com',
        },
        password: {
          type: 'string',
          example: 'newPassword123!',
        },
      },
    },
  })
  async updatePassword(
    @Request() req,
    @Body() updateData: { website: string; username: string; password: string },
  ) {
    return this.passwordsService.updatePasswordByWebsiteAndUsername(
      req.user.userId,
      updateData.website,
      updateData.username,
      updateData.password,
    );
  }

  @Post('synchronize-reused')
  @ApiOperation({
    summary: 'Synchronize reused password information across all passwords',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Number of passwords updated.',
    schema: {
      type: 'object',
      properties: {
        updatedCount: {
          type: 'number',
          example: 5,
          description: 'Number of passwords that were updated',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async synchronizeReusedPasswords(@Request() req) {
    const updatedCount = await this.passwordsService.synchronizeReusedPasswords(
      req.user.userId,
    );
    return { updatedCount };
  }
}
