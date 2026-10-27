# Validação dos Critérios de Aceite — N2

**Projeto:** Prato Cheio

**Data da atualização:** 27/10/2026

**Equipe:**
- Henrique Cordeiro de Oliveira
- Kauã Henrique Lucindo
- Nicholas Scoz dos Santos
- Guilherme Pietro

**Repositório:** https://github.com/rique1011/prato-cheio

**Branch de entrega:** entrega-2

## 1. Objetivo

Este documento apresenta os critérios de aceite e os
testes automatizados das funcionalidades desenvolvidas
no projeto Prato Cheio.

Os testes foram implementados utilizando Vitest,
Supertest e PostgreSQL.

O arquivo principal de testes é:

`tests/doacoes.test.js`

## 2. Cadastro de doações

### Critérios de aceite

- Permitir o cadastro de uma doação válida.
- Exigir os campos obrigatórios.
- Não permitir o cadastro com validade no passado.
- Registrar inicialmente a doação como disponível.

### Testes implementados

1. Mostra a doação publicada na lista de disponíveis.
2. Recusa doação sem os campos obrigatórios.
3. Recusa doação com validade no passado.

**Quantidade:** 3 testes.

## 3. Listagem de doações disponíveis

### Critérios de aceite

- Retornar as doações disponíveis.
- Não listar doações com status "aceita".
- Não disponibilizar novamente doações vencidas.

### Evidências

Os cenários de listagem são verificados pelos testes
de publicação, aceite e expiração de reservas.

A listagem considera as regras de disponibilidade
implementadas na camada de persistência.

## 4. Aceite de doações

### Critérios de aceite

- Permitir que uma ONG aceite uma doação disponível.
- Registrar o nome da ONG responsável.
- Alterar o status para "aceita".
- Impedir que duas ONGs aceitem a mesma doação
  simultaneamente.

### Testes implementados

1. Marca a doação como aceita pela ONG.
2. Remove a doação da lista de disponíveis depois de aceita.
3. Recusa aceitar uma doação que já foi aceita por outra ONG.

**Quantidade:** 3 testes.

## 5. Confirmação de coleta — Henrique

### História de usuário

Como ONG que aceitou uma doação,
quero confirmar que ela foi coletada,
para concluir a retirada.

### Rota

`POST /api/doacoes/:id/coletar`

### Critérios de aceite

- A doação precisa existir.
- A doação precisa estar com status "aceita".
- A ONG informada precisa corresponder à ONG registrada.
- Uma coleta não pode ser confirmada duas vezes.
- Uma coleta válida altera o status para "coletada".

### Testes implementados

1. Confirma a coleta de uma doação aceita pela ONG correta.
2. Recusa a coleta de uma doação ainda disponível.
3. Recusa confirmar a mesma coleta duas vezes.
4. Recusa confirmar a coleta de uma doação inexistente.
5. Recusa a coleta por uma ONG diferente da registrada.

**Quantidade:** 5 testes.

### Limitação

O sistema ainda não possui autenticação real de ONGs.

A identificação da ONG é feita pela comparação
do nome informado na requisição com o nome
registrado no aceite.

Essa comparação é uma regra de negócio,
mas não oferece garantia de identidade
ou segurança equivalente a um sistema de login.

## 6. Migração para PostgreSQL — Nicholas

### Objetivo

Substituir a persistência baseada em SQLite
pela utilização do PostgreSQL.

### Critérios de aceite

- Armazenar as doações no PostgreSQL.
- Manter as funcionalidades existentes.
- Preservar as regras de integridade.
- Permitir testes com um banco separado.
- Evitar que duas ONGs aceitem simultaneamente
  a mesma doação.

### Testes implementados

1. Aceita a doação uma única vez quando duas ONGs
   aceitam ao mesmo tempo.
2. Devolve a validade no formato AAAA-MM-DD,
   sem horário.
3. Cria a doação com aceita_em e coletada_em vazios.
4. O banco recusa um status fora do fluxo.

**Quantidade:** 4 testes.

### Decisão técnica

A migração foi documentada no:

`docs/adr/0001-migracao-para-postgresql.md`

## 7. Expiração de reservas — Kauã

### História de usuário

Como doador, quero que uma doação reservada
volte a ficar disponível quando o prazo de
reserva terminar, para permitir sua retirada
por outra ONG.

### Critérios de aceite

- Registrar o horário de aceite da doação.
- Manter a reserva ativa antes de duas horas.
- Liberar uma reserva ao completar duas horas.
- Não disponibilizar novamente alimentos vencidos.
- Não liberar doações já coletadas.
- Impedir coleta após o prazo da reserva.
- Permitir somente um novo aceite concorrente.

### Testes implementados

1. Registra o horário quando a ONG aceita uma doação.
2. Mantém a reserva ativa antes de completar duas horas.
3. Expira a reserva quando completa duas horas.
4. Libera uma reserva que ultrapassou duas horas.
5. Não disponibiliza novamente uma doação vencida.
6. Não libera uma doação que já foi coletada.
7. Recusa a coleta quando a reserva ultrapassa duas horas.
8. Permite apenas um novo aceite após a reserva expirar.

**Quantidade:** 8 testes.

### Decisão técnica

A expiração foi implementada sob demanda.

A verificação ocorre durante operações do sistema,
como a listagem de doações disponíveis e o aceite.

Não existe um processo periódico independente
executando a expiração em segundo plano.

Essa decisão foi documentada no:

`docs/adr/0002-expiracao-sob-demanda.md`

## 8. Resumo dos testes

| Grupo | Quantidade |
|---|---:|
| Verificação de saúde da aplicação | 1 |
| Publicação e listagem | 3 |
| Aceite de doações | 3 |
| Confirmação de coleta | 5 |
| Banco PostgreSQL | 4 |
| Expiração de reservas | 8 |
| **Total** | **24** |

Os 24 cenários estão implementados no arquivo:

`tests/doacoes.test.js`

## 9. Como executar os testes

### Pré-requisitos

- Node.js instalado.
- Dependências instaladas com npm.
- PostgreSQL configurado.
- Banco de testes separado do banco de desenvolvimento.
- Variável DATABASE_URL_TESTE configurada no ambiente.

### Instalar dependências

```bash
npm install
```

### Preparar o banco de desenvolvimento

```bash
npm run db:migrar
```

Resultado esperado:

```text
schema criado
```

### Executar os testes

```bash
npm test
```

Os testes utilizam o Vitest e o Supertest para validar
as funcionalidades do sistema e sua integração
com o banco de dados PostgreSQL.

## 10. Isolamento do banco de testes

O projeto utiliza dois bancos PostgreSQL separados.

### Banco de desenvolvimento

`pratocheio`

Configurado por meio da variável:

`DATABASE_URL`

### Banco de testes

`pratocheio_teste`

Configurado por meio da variável:

`DATABASE_URL_TESTE`

A configuração do Vitest impede que os dois ambientes
utilizem exatamente a mesma URL de conexão.

Os testes executam operações de limpeza no banco
de testes para garantir o isolamento entre os cenários.

Portanto, o banco de testes não deve conter dados
que precisem ser preservados.

O arquivo `.env` contém as configurações de conexão
e não deve ser publicado no repositório.

## 11. Limitações conhecidas

Apesar das funcionalidades implementadas,
o sistema ainda apresenta algumas limitações:

- Não existe autenticação real de ONGs.
- A identificação da ONG utiliza o nome informado.
- A expiração das reservas acontece sob demanda.
- Não existe um serviço periódico de expiração.
- O sistema não utiliza Redis.
- Não foram realizados testes de carga em grande escala.
- A interface não contempla todas as operações
  disponíveis na API.

Essas limitações estão registradas para orientar
possíveis evoluções futuras do projeto.

## 12. Evidência da execução dos testes

### Identificação

**Data da execução:** 27/10/2026

**Responsável:** Henrique Cordeiro de Oliveira

**Ambiente:** Windows 11

**Banco de dados:** PostgreSQL 17

**Framework de testes:** Vitest 2.1.9

**Branch utilizada:** docs/henrique-finalizacao-n2

**Branch de origem:** entrega-2

### Preparação do banco

Foi executado o comando:

```bash
npm run db:migrar
```

Resultado obtido:

```text
schema criado
```

A execução confirmou que o projeto conseguiu
estabelecer conexão com o PostgreSQL e preparar
a estrutura do banco de desenvolvimento.

### Execução dos testes automatizados

Foi executado o comando:

```bash
npm test
```

O Vitest apresentou o seguinte resultado:

```text
Test Files  1 passed (1)
     Tests  24 passed (24)

Duration  5.18s
```

### Resultado por funcionalidade

| Funcionalidade | Testes | Resultado |
|---|---:|---|
| Verificação de saúde | 1 | Aprovado |
| Cadastro e listagem | 3 | Aprovado |
| Aceite de doações | 3 | Aprovado |
| Confirmação de coleta | 5 | Aprovado |
| PostgreSQL | 4 | Aprovado |
| Expiração de reservas | 8 | Aprovado |
| **Total** | **24** | **Todos aprovados** |

### Resultado geral

**Status da execução: APROVADO.**

- 24 testes executados.
- 24 testes aprovados.
- 0 testes com falha.
- 1 arquivo de testes aprovado.

A execução confirmou o funcionamento dos cenários
automatizados na versão integrada do código,
com PostgreSQL configurado no ambiente local.

### Evidências para apresentação

O resultado pode ser demonstrado por meio de:

1. Execução de `npm test` no terminal.
2. Exibição dos 24 testes aprovados.
3. Apresentação do arquivo `tests/doacoes.test.js`.
4. Demonstração das funcionalidades em funcionamento.
5. Apresentação dos Pull Requests revisados.

Após a integração da documentação final,
a equipe deverá repetir os testes na branch
`entrega-2` para confirmar a versão definitiva.

## 13. Conclusão

A evolução do Prato Cheio foi acompanhada
pela implementação de testes automatizados
que verificam as principais regras de negócio.

Os testes contemplam situações de sucesso,
erros de validação, transições de estado,
concorrência no aceite e expiração de reservas.

A migração para PostgreSQL também foi validada
por testes específicos de persistência
e integridade dos dados.

Na execução realizada em 27/10/2026,
todos os 24 testes foram aprovados.

Esse resultado representa uma evidência
do funcionamento das funcionalidades
implementadas na Atividade Avaliativa 2 (N2).

A validação final será confirmada após a
integração de toda a documentação na branch
de entrega e a repetição da suíte de testes.