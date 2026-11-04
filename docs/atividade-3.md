# Atividade 3 — Evolução do Prato Cheio

## Situação inicial verificada

- Base de trabalho: `entrega-2` (commit `f7a40ac`).
- Branch de integração da atividade: `atividade-3`.
- O projeto já usa PostgreSQL com `pg` e possui migração do schema em `src/db.js`; ver ADR 0001.
- Antes desta atividade, havia 24 cenários automatizados no Vitest.
- A Definition of Done e o CI foram acrescentados nesta atividade.

## História priorizada: cancelar reserva de doação

**Como** ONG que aceitou uma doação, **quero** cancelar minha reserva antes da coleta, **para** permitir que outra ONG aproveite o alimento sem esperar o prazo de duas horas.

**Justificativa da prioridade:** uma desistência não pode ser informada ao sistema na versão anterior; a doação permanece bloqueada até a expiração. A história reaproveita o ciclo de vida já existente.

### Critérios de aceite

1. Somente doações com status `aceita` e reserva ativa podem ser canceladas.
2. A ONG informada deve ser a mesma que realizou o aceite.
3. A doação deve estar dentro da validade e ainda não pode ter sido coletada.
4. O cancelamento muda o status para `disponivel`, limpa `ong` e `aceita_em`.
5. Cancelamento duplicado e ID inexistente devem ser recusados.
6. Uma segunda ONG pode aceitar a doação liberada.
7. A atualização deve ser condicional no PostgreSQL para evitar alterações concorrentes indevidas.

**API planejada:** `POST /api/doacoes/:id/cancelar` com corpo `{"ong":"Nome da ONG"}`.

## Banco e integração contínua

A migração SQLite → PostgreSQL foi concluída anteriormente e não deve ser refeita. A atividade prepara um serviço PostgreSQL 17 no GitHub Actions e verifica a migração com `npm run db:migrar` e os testes com `npm test`. O banco de testes é independente do banco usado para validar a migração.

## Definition of Done

A DoD coletiva está no `README.md`. O merge da história depende de CI verde e revisão por outro integrante.

## Uso de IA

O desenvolvimento pode usar IA como apoio. O Pull Request da história deve documentar os trechos aproveitados, as adaptações e as justificativas. A revisão e a validação final permanecem sob responsabilidade da equipe.

## Limitação conhecida

A identidade da ONG ainda é validada pelo nome informado, sem autenticação real. O cancelamento herda essa limitação e não deve ser apresentado como uma autorização segura em produção.
