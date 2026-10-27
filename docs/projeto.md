# Documento de Projeto — Prato Cheio

## Atividade Avaliativa 2 — N2

**Curso:** Engenharia de Software

**Integrantes:**
- Henrique Cordeiro de Oliveira
- Kauã Henrique Lucindo
- Nicholas Scoz dos Santos
- Guilherme Pietro Ruiz Costa

**Repositório:**
https://github.com/rique1011/prato-cheio

**Branch de entrega:** `entrega-2`

**Prazo:** 28/10/2026

---

## 1. Objetivo do projeto

O Prato Cheio é um sistema que conecta doadores de alimentos
a organizações não governamentais (ONGs).

O sistema permite cadastrar doações, consultar alimentos
disponíveis e reservar doações para coleta.

Nesta segunda evolução, foram implementadas duas novas
funcionalidades:

1. Confirmação de coleta de doações.
2. Expiração de reservas após duas horas.

Também foi realizada a migração do banco SQLite para PostgreSQL,
além de melhorias na interface e ampliação dos testes.

## 2. Histórias de usuário implementadas

### História 1 — Confirmação de coleta

**Responsável:** Henrique Cordeiro de Oliveira

**História:**

Como ONG que aceitou uma doação, quero confirmar que ela
foi coletada, para concluir a retirada.

**Critérios de aceite:**

- A doação precisa ter sido aceita anteriormente.
- Apenas a ONG registrada no aceite pode confirmar a coleta.
- A confirmação altera o status para `coletada`.
- A mesma doação não pode ser coletada duas vezes.
- Doações inexistentes devem gerar erro.
- A coleta deve respeitar o prazo da reserva.

**Implementação:**

Foi criada a rota:

`POST /api/doacoes/:id/coletar`

A rota utiliza as regras de negócio de `src/doacoes.js`
e as consultas PostgreSQL de `src/repositorio.js`.

A identificação da ONG é realizada por comparação de nome.
O sistema ainda não possui autenticação real de ONGs.

### História 2 — Expiração automática de reservas

**Responsável:** Kauã Henrique Lucindo

**História:**

Como ONG, quero que uma reserva sem coleta expire após duas
horas, para que outra ONG possa aproveitar o alimento.

**Critérios de aceite:**

- O horário do aceite deve ser registrado em `aceita_em`.
- Uma reserva permanece ativa antes de completar duas horas.
- Após duas horas, a reserva pode ser liberada.
- Somente alimentos ainda válidos voltam à disponibilidade.
- Doações já coletadas não podem ser liberadas.
- Coletas realizadas fora do prazo devem ser recusadas.
- Apenas uma ONG pode aceitar a mesma doação por vez.

**Implementação:**

Foi criada a função `liberarReservasExpiradas()` em
`src/repositorio.js`.

A função verifica o horário armazenado em `aceita_em`,
utilizando as operações de data e hora do PostgreSQL.

Quando a reserva expira e o alimento continua válido,
o sistema altera o status para `disponivel`, remove
a ONG anterior e permite um novo aceite.

A verificação é realizada sob demanda, durante a listagem
de doações e as tentativas de aceite.

## 3. Fluxo de estados das doações

O sistema trabalha com três estados:

- `disponivel`: doação cadastrada e disponível para aceite.
- `aceita`: doação reservada por uma ONG.
- `coletada`: doação retirada e concluída.

**Transições permitidas:**

1. `disponivel` → `aceita`: quando uma ONG aceita a doação.
2. `aceita` → `coletada`: quando a coleta é confirmada no prazo.
3. `aceita` → `disponivel`: quando a reserva expira após duas horas
   e o alimento ainda está válido.

Doações coletadas não retornam ao estado disponível.

Alimentos cuja validade já passou não são apresentados
na listagem de doações disponíveis.

## 4. Principais decisões de arquitetura

### Decisão 1 — Migração para PostgreSQL

**Responsável:** Nicholas Scoz dos Santos

O banco de dados foi migrado de SQLite para PostgreSQL.

**Alternativas consideradas:**

- Manter SQLite.
- Utilizar PostgreSQL com o driver `pg`.
- Utilizar PostgreSQL com ORM.

**Decisão:**

Utilizar PostgreSQL com o driver `pg`, preservando a
abstração de consultas existente no projeto.

**Justificativa:**

O PostgreSQL oferece controle de concorrência,
tipos de dados adequados para datas e horários,
restrições de integridade e suporte a múltiplas conexões.

**Consequências:**

- Maior controle de integridade dos dados.
- Suporte ao aceite concorrente.
- Necessidade de configurar um servidor PostgreSQL.
- Utilização de um banco isolado para testes.

**ADR relacionado:**

`docs/adr/0001-migracao-para-postgresql.md`

### Decisão 2 — Expiração de reservas sob demanda

**Responsável pela implementação:** Kauã Henrique Lucindo

Foi escolhida a estratégia de verificar reservas expiradas
durante operações relevantes do sistema.

**Alternativas consideradas:**

- Utilizar uma rotina periódica em segundo plano.
- Verificar a expiração sob demanda.

**Decisão:**

Utilizar expiração sob demanda por meio de consultas SQL.

**Justificativa:**

A solução é suficiente para o escopo atual e evita
a necessidade de configurar processos adicionais.

**Consequências:**

- Implementação mais simples.
- Menor complexidade de infraestrutura.
- A expiração é processada quando operações relevantes
  são executadas.
- Não existe uma rotina independente verificando reservas
  continuamente.

**ADR relacionado:**

`docs/adr/0002-expiracao-sob-demanda.md`

## 5. Requisitos não funcionais

| Requisito | Descrição | Impacto na implementação |
|---|---|---|
| Integridade dos dados | Impedir transições inválidas e aceites duplicados | Uso de condições SQL, restrições de status e PostgreSQL |
| Segurança alimentar | Evitar a disponibilidade de alimentos vencidos | Validação da data de validade no cadastro, na listagem e no aceite |
| Confiabilidade e testabilidade | Verificar o comportamento do sistema e impedir que testes afetem dados reais | Testes automatizados com Vitest e banco PostgreSQL isolado |

### 5.1 Integridade dos dados

As consultas SQL utilizam condições para impedir que
uma doação seja aceita simultaneamente por duas ONGs.

A confirmação de coleta também verifica o estado
e o prazo da reserva antes de atualizar os dados.

### 5.2 Segurança alimentar

O sistema valida a data de validade dos alimentos.

Doações vencidas são impedidas de voltar à lista
de disponíveis.

### 5.3 Confiabilidade e testabilidade

Os testes automatizados utilizam Vitest e Supertest.

O banco `pratocheio_teste` é separado do banco de
desenvolvimento, evitando que a limpeza realizada
durante os testes apague dados do sistema principal.

## 6. Testes implementados

O projeto possui 24 testes automatizados no arquivo:

`tests/doacoes.test.js`

**Distribuição dos testes:**

| Funcionalidade | Quantidade |
|---|---:|
| Verificação de saúde | 1 |
| Cadastro e listagem | 3 |
| Aceite de doações | 3 |
| Confirmação de coleta | 5 |
| PostgreSQL e integridade | 4 |
| Expiração de reservas | 8 |
| Total | 24 |

Os testes contemplam cenários de sucesso e erro.

Entre os cenários verificados estão:

- Cadastro de doação válida.
- Rejeição de doação com validade passada.
- Aceite exclusivo por uma ONG.
- Confirmação de coleta.
- Rejeição de coleta repetida.
- Rejeição de coleta por ONG diferente.
- Registro do horário de aceite.
- Expiração no limite de duas horas.
- Bloqueio de alimento vencido.
- Impedimento de coleta fora do prazo.
- Aceite concorrente após a expiração.

**Comando para executar:**

`npm test`

A execução depende da configuração do PostgreSQL
e das variáveis de ambiente do banco de testes.

## 7. Participação individual e Pull Requests

As contribuições foram realizadas em branches
individuais e integradas por Pull Requests revisados.

| Integrante | Contribuição | Pull Request |
|---|---|---|
| Henrique Cordeiro de Oliveira | Confirmação de coleta | #1 |
| Guilherme Pietro Ruiz Costa | Melhorias na interface | #2 |
| Nicholas Scoz dos Santos | Migração para PostgreSQL | #3 |
| Kauã Henrique Lucindo | Expiração de reservas | #5 |

**Links dos Pull Requests:**

- Henrique: https://github.com/rique1011/prato-cheio/pull/1
- Guilherme: https://github.com/rique1011/prato-cheio/pull/2
- Nicholas: https://github.com/rique1011/prato-cheio/pull/3
- Kauã: https://github.com/rique1011/prato-cheio/pull/5

Todos esses PRs foram revisados por outro integrante
e integrados à branch `entrega-2`.

## 8. Limitações conhecidas

O sistema ainda apresenta algumas limitações:

- Não possui autenticação real de ONGs.
- A identificação das ONGs ocorre por nome.
- A validade dos alimentos é armazenada como data,
  sem horário específico.
- A expiração é acionada sob demanda.
- A interface web não possui uma ação própria para
  confirmar a coleta; essa funcionalidade está na API.

Essas limitações podem ser trabalhadas em futuras evoluções.

## 9. Uso de inteligência artificial

A equipe utilizou o ChatGPT como ferramenta de apoio
ao desenvolvimento e à compreensão do projeto.

A ferramenta auxiliou na análise de regras de negócio,
organização de etapas, elaboração de exemplos de código
e criação de cenários de teste.

As alterações foram aplicadas pelos integrantes,
que também realizaram verificações e testes locais.

A utilização de IA não substitui a responsabilidade
da equipe pela implementação e pela validação final.

## 10. Conclusão

A evolução do Prato Cheio ampliou o controle sobre
o ciclo de vida das doações.

A confirmação de coleta permite concluir uma retirada,
enquanto a expiração de reservas reduz o risco de alimentos
permanecerem indisponíveis sem necessidade.

A migração para PostgreSQL contribuiu para a integridade
dos dados e o controle de operações concorrentes.

As funcionalidades foram integradas por Pull Requests
revisados e possuem testes automatizados para os
principais cenários de sucesso e falha.