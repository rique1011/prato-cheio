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
