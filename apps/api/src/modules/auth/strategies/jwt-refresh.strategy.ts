import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
}

const cookieExtractor = (req: Request): string | null => {
  return (req?.cookies?.refresh_token as string | undefined) ?? null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: false,
    });
  }

  validate(payload: JwtRefreshPayload): JwtRefreshPayload {
    if (!payload.sub || !payload.jti) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
