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
import { Password } from './entities/password.schema';

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
  remove(@Request() req, @Param('id') id: string) {
    return this.passwordsService.remove(req.user.userId, id);
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
}
