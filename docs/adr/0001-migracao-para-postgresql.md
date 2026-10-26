# ADR 0001: Migração de SQLite para PostgreSQL

- **Data:** 2026-10-25
- **Status:** aceito
- **Responsável:** Nicholas Scoz dos Santos

## Contexto
O protótipo usava SQLite (`node:sqlite`, experimental): um arquivo local, um único processo escrevendo por vez e nenhum acesso pela rede. Isso não serve para várias instâncias nem para hospedagem com disco temporário. A disciplina também exige PostgreSQL na Unidade 3. As próximas funcionalidades (confirmar coleta e registrar a hora do aceite) precisam de datas e horas confiáveis.

## Alternativas
1. **Manter o SQLite**: nada a instalar e testes em memória, mas sem concorrência entre processos e com tipos fracos.
2. **PostgreSQL com o driver `pg`** (escolhida): robusto, com bloqueio por linha e tipos fortes. Exige instalar um servidor.
3. **PostgreSQL com ORM (Prisma/Knex)**: migrações automáticas, mas é complexidade demais para uma tabela só.

## Trade-offs
| Critério | SQLite | PostgreSQL |
|---|---|---|
| Configuração | Nenhuma | Instalar, criar bancos e `.env` |
| Escritas simultâneas | Trava o banco inteiro | Trava só a linha |
| Integridade | Tipos flexíveis | `DATE`, `TIMESTAMPTZ`, `CHECK` |
| Testes | `:memory:` | Banco de testes separado |

## Decisão
Migrar para **PostgreSQL com `pg`**, mantendo a interface `query()` de `src/db.js`. Só `db.js`, `repositorio.js` e `vitest.config.js` mudaram:
- Os marcadores `?` viraram `$1, $2…`.
- A conexão usa `DATABASE_URL` do `.env`, que fica fora do Git.
- Novas colunas `aceita_em` e `coletada_em` e um `CHECK` de status.
- O aceite exclusivo continua no `UPDATE ... WHERE status = 'disponivel'`.

## Consequências
- **Ganhos:** aceite exclusivo garantido com várias conexões, dados validados pelo banco, schema pronto para coleta e hora de aceite, e testes que não apagam os dados de desenvolvimento.
- **Custos:** cada integrante precisa instalar o PostgreSQL e criar o `.env`, e os testes ficaram um pouco mais lentos.

## Limitações
- O schema usa `CREATE TABLE IF NOT EXISTS`, sem ferramenta de migração versionada.
- O CI ainda precisa de um serviço PostgreSQL configurado.
- A futura expiração automática vai exigir transação explícita.

## Evidência
- **PR:** https://github.com/rique1011/prato-cheio/pull/3
- **Commits:** `158b5c6` (chore), `08d0985` (feat), `a56b0cf` (test)
- **`npm test`:** 16 testes passando no PostgreSQL 18.6, incluindo o aceite simultâneo por duas ONGs (um 200 e um 400).
- **App real:** doação cadastrada e aceita pela interface, gravada no PostgreSQL com `status = aceita` e `criada_em` preenchido.
