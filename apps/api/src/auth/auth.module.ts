import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    // JwtModule.register({}) fica vazio de proposito: o AuthService passa
    // secret/expiresIn explicitamente em cada signAsync() (access e refresh
    // usam segredos e tempos de vida diferentes - nao ha um unico "default"
    // que sirva pros dois).
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
