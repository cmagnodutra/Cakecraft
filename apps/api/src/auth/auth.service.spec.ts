import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock = {
    signAsync: jest.fn().mockResolvedValue('fake-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jwtMock.signAsync.mockResolvedValue('fake-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, fallback?: unknown) => fallback) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('rejeita cadastro com e-mail ja existente', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });

      await expect(
        service.register({ name: 'Mariana', email: 'mariana@example.com', password: 'senha12345' }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('cadastra com senha hasheada (nunca em texto puro) e devolve o par de tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'novo-usuario',
          name: data.name,
          email: data.email,
          role: 'CLIENTE',
          xp: 0,
          level: 1,
          passwordHash: data.passwordHash,
        }),
      );

      const result = await service.register({
        name: 'Mariana',
        email: 'mariana@example.com',
        password: 'senha12345',
      });

      const dataCriada = prismaMock.user.create.mock.calls[0][0].data;
      expect(dataCriada.passwordHash).not.toBe('senha12345');
      expect(await bcrypt.compare('senha12345', dataCriada.passwordHash)).toBe(true);

      expect(result.accessToken).toBe('fake-token');
      expect(result.refreshToken).toBe('fake-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('login', () => {
    it('rejeita e-mail inexistente com 401 (nao revela se o problema foi e-mail ou senha)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nao-existe@example.com', password: 'qualquer' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita usuario anonimizado (LGPD) mesmo com senha certa', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        anonymizedAt: new Date(),
        passwordHash: await bcrypt.hash('senha12345', 4),
      });

      await expect(
        service.login({ email: 'anonimizado@example.com', password: 'senha12345' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita senha incorreta', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        anonymizedAt: null,
        passwordHash: await bcrypt.hash('senha-correta', 4),
      });

      await expect(
        service.login({ email: 'mariana@example.com', password: 'senha-errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('autentica com sucesso e devolve o par de tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Mariana',
        email: 'mariana@example.com',
        role: 'CLIENTE',
        xp: 100,
        level: 1,
        anonymizedAt: null,
        passwordHash: await bcrypt.hash('senha12345', 4),
      });

      const result = await service.login({ email: 'mariana@example.com', password: 'senha12345' });

      expect(result.user.email).toBe('mariana@example.com');
      expect(result.accessToken).toBe('fake-token');
      expect(result.refreshToken).toBe('fake-token');
    });
  });
});
