import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
}

/**
 * Extrai o access token do cookie httpOnly 'access_token', em vez do
 * header 'Authorization: Bearer ...' (decisao confirmada: cookies
 * httpOnly protegem contra XSS, ao contrario de localStorage).
 */
function extractFromCookie(req: Request): string | null {
  return req?.cookies?.access_token ?? null;
}

/**
 * Valida o access token JWT em rotas protegidas por JwtAuthGuard.
 * O retorno de validate() e injetado em request.user (ver
 * common/decorators/current-user.decorator.ts).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<{ id: string; email: string; role: string }> {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
