import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  xp: number;
  level: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** UC03, passo 2 - cadastro de um novo usuario (papel padrao: CLIENTE). */
  async register(dto: RegisterDto): Promise<{ user: PublicUser } & TokenPair> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Ja existe uma conta com este e-mail.');
    }

    const saltRounds = this.config.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
      },
    });

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);
    return { user: this.toPublicUser(user), ...tokens };
  }

  /** UC03, passo 3 - valida credenciais e emite o par de tokens JWT. */
  async login(dto: LoginDto): Promise<{ user: PublicUser } & TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || user.anonymizedAt) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);
    return { user: this.toPublicUser(user), ...tokens };
  }

  /**
   * TODO (feature/auth, proxima etapa): implementar rotacao real -
   * comparar o hash recebido com o armazenado em RefreshToken, revogar o
   * antigo e persistir o novo. Hoje o cookie de refresh expira e exige
   * login de novo, sem rotacao.
   */
  async refresh(_refreshToken: string): Promise<TokenPair> {
    throw new Error('TODO: implementar rotacao de refresh token (ver RefreshToken no schema.prisma).');
  }

  /**
   * TODO: depende de feature/email (ainda nao existe) para disparar o
   * e-mail de recuperacao de senha.
   */
  async forgotPassword(_email: string): Promise<void> {
    throw new Error('TODO: implementar apos feature/email existir.');
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    throw new Error('TODO: implementar validacao do token e troca de senha.');
  }

  private async issueTokenPair(userId: string, email: string, role: string): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // TODO: persistir o hash do refreshToken em RefreshToken para permitir
    // revogacao (logout, troca de senha, deteccao de reuso).

    return { accessToken, refreshToken };
  }

  private toPublicUser(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    xp: number;
    level: number;
  }): PublicUser {
    const { id, name, email, role, xp, level } = user;
    return { id, name, email, role, xp, level };
  }
}
