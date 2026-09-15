# CakeCraft

Plataforma Web para montagem visual de bolos customizados, com precificacao
dinamica por peso/volumetria e gestao da fila de producao em tempo real.

Projeto de portfolio individual da disciplina de Engenharia de Software
(PAC VII) - Catolica SC. Especificacao completa no RFC-001 "CakeCraft" v1.4.

## Problema que o sistema resolve

Confeitarias artesanais orcam bolos customizados manualmente via aplicativos
de mensagem. O processo e lento (esperas acima de 4 horas derrubam a
conversao), sujeito a erro humano e sem fila de producao estruturada. O
CakeCraft substitui esse fluxo por um construtor visual com preco calculado
em tempo real e um quadro Kanban de producao para a cozinha.

## Estrutura do monorepo

```
cakecraft/
├── apps/
│   ├── api/   -> Backend: API REST (NestJS + TypeScript)
│   └── web/   -> Frontend: Next.js (entra em uma rodada posterior)
└── package.json  -> Raiz do workspace (npm workspaces)
```

Cada app tem o proprio `package.json` e o proprio ciclo de build, mas todos
compartilham um unico `node_modules` e um unico `package-lock.json` na raiz,
resolvidos por npm workspaces.

## Estado atual

Repositorio em construcao incremental. O backend esta sendo desenvolvido
primeiro; o frontend entra depois que os modulos de API estiverem
implementados e testados.

## Pre-requisitos

- Node.js 20 ou superior
- Docker e Docker Compose (para Postgres e Redis em desenvolvimento)
