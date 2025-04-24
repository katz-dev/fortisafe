import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKeyProvider: jwksRsa.passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `https://${configService.get<string>('AUTH0_DOMAIN')}/.well-known/jwks.json`,
            }),
            audience: configService.get<string>('AUTH0_AUDIENCE'),
            issuer: `https://${configService.get<string>('AUTH0_DOMAIN')}/`,
            algorithms: ['RS256'],
        });
    }

    async validate(payload: any) {
        try {
            // Extract user information from JWT payload
            const userData = {
                auth0Id: payload.sub,
                email: payload.email,
                name: payload.name,
                nickname: payload.nickname,
                picture: payload.picture
            };

            // Find or create user in MongoDB based on Auth0 ID
            const user = await this.usersService.findOrCreateByAuth0Id(
                userData.auth0Id,
                userData.email,
                userData
            );

            // Return the user document to attach to the request object
            return user;
        } catch (error) {
            console.error('JWT validation error:', error);
            throw new UnauthorizedException('Invalid token');
        }
    }
}