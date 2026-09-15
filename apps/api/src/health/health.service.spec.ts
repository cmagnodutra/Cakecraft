import { Test, TestingModule } from '@nestjs/testing';

import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('reporta o servico como disponivel', () => {
    const result = service.getLiveness();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('cakecraft-api');
  });

  it('reporta o tempo de atividade como um inteiro nao negativo', () => {
    const result = service.getLiveness();

    expect(Number.isInteger(result.uptimeSeconds)).toBe(true);
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('reporta um timestamp em formato ISO 8601 valido', () => {
    const result = service.getLiveness();

    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});
