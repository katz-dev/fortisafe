import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async register(createUserDto: CreateUserDto) {
    // Try to authenticate with Auth0 first
    try {
      // Create an account in Auth0
      const auth0TokenResponse = await axios.post(
        `https://${this.configService.get('AUTH0_DOMAIN')}/oauth/token`,
        {
          client_id: this.configService.get('AUTH0_CLIENT_ID'),
          client_secret: this.configService.get('AUTH0_CLIENT_SECRET'),
          audience: `https://${this.configService.get('AUTH0_DOMAIN')}/api/v2/`,
          grant_type: 'client_credentials',
        },
      );

      const auth0ManagementToken = auth0TokenResponse.data.access_token;

      // Create user in Auth0
      const auth0User = await axios.post(
        `https://${this.configService.get('AUTH0_DOMAIN')}/api/v2/users`,
        {
          email: createUserDto.email,
          password: createUserDto.password,
          connection: 'Username-Password-Authentication',
          email_verified: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth0ManagementToken}`,
          },
        },
      );

      // Create user in our database
      const newUser = await this.usersService.create({
        ...createUserDto,
        auth0Id: auth0User.data.user_id,
      });

      return {
        message: 'User registered successfully',
        user: {
          id: newUser._id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(
        error.response?.data?.message || 'Registration failed',
      );
    }
  }

  async login(loginDto: LoginDto) {
    try {
      // Authenticate with Auth0
      const tokenResponse = await axios.post(
        `https://${this.configService.get('AUTH0_DOMAIN')}/oauth/token`,
        {
          grant_type: 'password',
          username: loginDto.email,
          password: loginDto.password,
          client_id: this.configService.get('AUTH0_CLIENT_ID'),
          client_secret: this.configService.get('AUTH0_CLIENT_SECRET'),
          audience: this.configService.get('AUTH0_AUDIENCE'),
          scope: 'openid profile email',
        },
      );

      const decodedToken = this.jwtService.decode(tokenResponse.data.id_token);

      // Find or create user in our database
      const user = await this.usersService.findOrCreateByAuth0Id(
        decodedToken.sub,
        loginDto.email,
      );

      return {
        access_token: tokenResponse.data.access_token,
        id_token: tokenResponse.data.id_token,
        token_type: tokenResponse.data.token_type,
        expires_in: tokenResponse.data.expires_in,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(
        error.response?.data?.error_description || 'Invalid credentials',
      );
    }
  }

  async validateUser(auth0Id: string) {
    return this.usersService.findOneByAuth0Id(auth0Id);
  }
}