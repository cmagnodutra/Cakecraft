import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { AuthService, PublicUser, TokenPair } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const { user, ...tokens } = await this.authService.register(dto);
    this.setAuthCookies(res, tokens);
    return { user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const { user, ...tokens } = await this.authService.login(dto);
    this.setAuthCookies(res, tokens);
    return { user };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  }

  /**
   * Decisao confirmada: tokens entregues via cookie httpOnly, nunca no
   * corpo da resposta (protege contra roubo via XSS, ao contrario de
   * localStorage). sameSite 'lax' mitiga a maioria dos casos praticos de
   * CSRF; secure fica condicional ao ambiente porque em dev local sem
   * HTTPS o navegador descartaria um cookie 'secure'.
   */
  private setAuthCookies(res: Response, tokens: TokenPair): void {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: FIFTEEN_MINUTES_MS,
      path: '/',
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: SEVEN_DAYS_MS,
      // Restringe o cookie de refresh a rota que de fato o consome, para
      // nao ser reenviado em toda requisicao a API.
      path: '/api/auth/refresh',
    });
  }
}
