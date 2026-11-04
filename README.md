## Como rodar

Requisitos: **Node.js 22.13+** e **PostgreSQL** (testado com a versão 18).

### Preparar o banco (uma vez por máquina)
Depois de instalar o PostgreSQL, crie o usuário e os dois bancos (troque a senha):

```bash
psql -U postgres
```
```sql
CREATE ROLE pratocheio WITH LOGIN PASSWORD 'sua_senha';
CREATE DATABASE pratocheio       OWNER pratocheio;  -- desenvolvimento
CREATE DATABASE pratocheio_teste OWNER pratocheio;  -- testes (é apagado a cada teste)
\q
```

Copie `.env.example` para `.env` e coloque a sua senha nas duas URLs. O `.env` **não vai para o Git**.

```bash
cp .env.example .env          # no PowerShell: Copy-Item .env.example .env
```

### Comandos

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Rodar os testes automatizados (usam o banco pratocheio_teste)
npm test

# 3. Executar o servidor em http://localhost:3000 (usa o banco pratocheio)
npm start
```

A decisão de migrar do SQLite para o PostgreSQL está em [docs/adr/0001-migracao-para-postgresql.md](docs/adr/0001-migracao-para-postgresql.md).

## Integração contínua (CI)

O workflow [CI — testes com PostgreSQL](.github/workflows/ci.yml) executa automaticamente em pushes e Pull Requests destinados à branch `atividade-3`.

- Node.js 22, `npm ci`, migração do schema e `npm test`.
- PostgreSQL 17 iniciado como serviço temporário no GitHub Actions.
- Banco de desenvolvimento e banco de testes separados; o banco de testes é descartável.
- Nenhuma senha real ou arquivo `.env` é publicado: a senha do serviço é exclusiva da execução de CI.

Para preparar o schema localmente, execute `npm run db:migrar` antes de `npm start`. Os testes criam o schema no banco isolado de testes.

## Definition of Done (DoD) — acordo da equipe / Atividade 3

Uma história só está **pronta** quando todos os itens abaixo forem atendidos:

- [ ] História priorizada, objetivo e critérios de aceite descritos no PR.
- [ ] Código implementado sem quebrar cadastro, listagem, aceite, coleta e expiração de reservas.
- [ ] Testes automatizados cobrindo sucesso, falhas e regras de negócio; `npm test` aprovado.
- [ ] Workflow de CI do PR aprovado (**verde**) com PostgreSQL.
- [ ] Pull Request revisado por **outro integrante da equipe**; comentários de revisão resolvidos antes do merge.
- [ ] Migração/configuração do banco reproduzível, mantendo banco de testes separado e sem credenciais no Git.
- [ ] README e documentação técnica atualizados, incluindo limitações conhecidas.
- [ ] Caso IA tenha auxiliado na geração do código, o PR registra **o que foi aproveitado, o que foi alterado e por quê**.
- [ ] Funcionalidade demonstrável, com evidência dos critérios de aceite.
- [ ] PR integrado à branch da atividade após aprovação e CI verde.

A história priorizada e as evidências da Atividade 3 estão em [docs/atividade-3.md](docs/atividade-3.md). A migração de SQLite para PostgreSQL **já foi realizada na N2** e permanece registrada no [ADR 0001](docs/adr/0001-migracao-para-postgresql.md); nesta atividade, o foco é tornar sua execução verificável em CI.
