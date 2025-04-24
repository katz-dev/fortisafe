import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully registered',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'User has been successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('login/auth0')
  @UseGuards(AuthGuard('auth0'))
  @ApiOperation({ summary: 'Redirect to Auth0 login page' })
  @ApiResponse({ status: 302, description: 'Redirect to Auth0' })
  async auth0Login() {
    // Auth0 will redirect to callback URL
  }

  @Get('callback')
  @UseGuards(AuthGuard('auth0'))
  @ApiOperation({ summary: 'Auth0 callback URL' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with tokens' })
  async auth0Callback(@Req() req, @Res() res: Response) {
    // After successful Auth0 authentication, redirect to frontend with tokens
    const { accessToken } = req.user;

    // Redirect to frontend with token
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`,
    );
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req) {
    return req.user;
  }
}