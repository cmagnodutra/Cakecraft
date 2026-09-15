import { Injectable } from '@nestjs/common';

/**
 * Interface exportada de proposito: e o tipo de retorno de um metodo publico
 * consumido pelo controller. Interface local (nao exportada) usada como
 * retorno publico quebra a geracao de arquivos de declaracao (.d.ts) do
 * TypeScript com o erro TS4053.
 */
export interface LivenessStatus {
  status: 'ok';
  service: string;
  uptimeSeconds: number;
  timestamp: string;
}

@Injectable()
export class HealthService {
  getLiveness(): LivenessStatus {
    return {
      status: 'ok',
      service: 'cakecraft-api',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
