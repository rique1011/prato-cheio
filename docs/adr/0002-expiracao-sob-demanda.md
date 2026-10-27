# ADR 0002 — Expiração de Reservas Sob Demanda

**Data:** 27/10/2026

**Status:** Aceito

**Projeto:** Prato Cheio

**Responsável pela implementação:** Kauã Henrique Lucindo

**Responsável pela documentação:** Henrique Cordeiro de Oliveira

## 1. Contexto

O sistema Prato Cheio permite que uma ONG aceite uma doação,
reservando o alimento para retirada.

Inicialmente, uma doação aceita permanecia reservada por tempo
indeterminado, mesmo quando a ONG não realizava a coleta.

Esse comportamento poderia impedir outras organizações de
aproveitarem os alimentos disponíveis.

Para resolver o problema, foi definida a seguinte regra:

Uma reserva sem confirmação de coleta deve expirar após duas
horas, desde que o alimento ainda esteja dentro da validade.

A solução deve impedir que doações coletadas sejam liberadas
novamente e preservar a exclusividade do aceite.

## 2. Alternativas consideradas

### Alternativa A — Rotina periódica em segundo plano

Criar uma tarefa agendada para verificar todas as reservas
em intervalos definidos.

**Vantagens:**

- Expiração processada independentemente das requisições.
- Possibilidade de executar outras tarefas automáticas.

**Desvantagens:**

- Necessidade de configurar um agendador.
- Maior complexidade de implantação e manutenção.
- Necessidade de monitorar a execução da rotina.
- A atualização depende da frequência escolhida.

### Alternativa B — Expiração sob demanda

Verificar reservas expiradas durante operações relevantes
do sistema, como listagem de doações e novas tentativas
de aceite.

**Vantagens:**

- Implementação simples.
- Não exige serviços adicionais.
- Utiliza as consultas PostgreSQL existentes.
- Mantém a regra de negócio próxima à persistência.

**Desvantagens:**

- A expiração não é processada continuamente.
- Uma reserva pode permanecer registrada como aceita até
  que uma operação acione a verificação.

### Alternativa C — Estratégia híbrida

Utilizar verificações sob demanda e uma rotina periódica.

**Vantagens:**

- Permite atualização durante as requisições.
- Também executa verificações em segundo plano.

**Desvantagens:**

- Maior complexidade de implementação.
- Exige coordenação entre dois mecanismos.
- Desnecessária para o escopo atual do projeto.

## 3. Análise de trade-offs

| Critério | Rotina periódica | Sob demanda | Híbrida |
|---|---|---|---|
| Complexidade | Média | Baixa | Alta |
| Infraestrutura adicional | Sim | Não | Sim |
| Verificação durante requisições | Depende da implementação | Sim | Sim |
| Execução sem requisições | Sim | Não | Sim |
| Manutenção | Moderada | Simples | Mais complexa |
| Adequação ao projeto atual | Possível | Alta | Desnecessária |

## 4. Decisão adotada

A equipe adotou a alternativa B:

**Expiração de reservas sob demanda utilizando PostgreSQL.**

A decisão considera o escopo atual do Prato Cheio,
que possui uma aplicação simples e uma única tabela
principal de doações.

A implementação utiliza a coluna `aceita_em` para
registrar o horário da reserva.

Quando uma ONG aceita uma doação, o banco registra
automaticamente o horário utilizando `NOW()`.

A função `liberarReservasExpiradas()`, localizada em
`src/repositorio.js`, identifica reservas que ultrapassaram
duas horas.

A verificação utiliza condições SQL equivalentes a:

- Status igual a `aceita`.
- Horário do aceite registrado.
- Prazo de duas horas atingido.
- Alimento ainda dentro da validade.

Quando as condições são atendidas, a reserva é liberada:

- O status volta para `disponivel`.
- O vínculo com a ONG anterior é removido.
- O horário do aceite anterior é limpo.

As verificações são acionadas durante a listagem de doações
e antes de novas tentativas de aceite.

A confirmação de coleta também possui uma condição SQL
que impede a atualização após o vencimento da reserva.

## 5. Consequências positivas

### Simplicidade

A funcionalidade utiliza as camadas já existentes:

- `src/app.js`
- `src/doacoes.js`
- `src/repositorio.js`
- `src/db.js`

Não foi necessário adicionar um agendador ou serviço externo.

### Aproveitamento dos alimentos

Reservas não coletadas podem ser liberadas para outras ONGs,
desde que o alimento continue válido.

### Integridade dos dados

As atualizações utilizam condições SQL para impedir
transições inválidas.

Doações coletadas não retornam ao estado disponível.

### Controle de concorrência

O PostgreSQL permite realizar atualizações condicionais
para impedir que duas ONGs aceitem a mesma doação.

## 6. Consequências negativas e limitações

### Expiração acionada por operações

A reserva não é atualizada continuamente em segundo plano.

A verificação acontece quando uma operação relevante
do sistema é executada.

### Validade armazenada como data

A coluna `validade` utiliza o tipo `DATE` do PostgreSQL.

Portanto, a verificação considera a data de validade,
sem identificar uma hora específica de vencimento.

### Identificação das ONGs

O sistema ainda não possui autenticação real de ONGs.

A identificação ocorre por nome, o que representa
uma limitação para futuras versões.

## 7. Evidências da implementação

**Pull Request:**

https://github.com/rique1011/prato-cheio/pull/5

**Commit principal:**

`bd76bd2`

**Arquivos modificados:**

- `src/repositorio.js`
- `src/doacoes.js`
- `tests/doacoes.test.js`

A implementação acrescentou oito testes automatizados
relacionados à expiração de reservas.

Os testes verificam:

1. Registro do horário do aceite.
2. Reserva ativa antes de duas horas.
3. Expiração no limite de duas horas.
4. Liberação após o prazo.
5. Bloqueio de alimentos vencidos.
6. Proteção de doações coletadas.
7. Rejeição de coleta fora do prazo.
8. Exclusividade no aceite concorrente.

O projeto possui 24 cenários automatizados no total.

Os testes utilizam um banco PostgreSQL separado,
configurado pela variável `DATABASE_URL_TESTE`.

## 8. Possível evolução futura

Caso o sistema passe a atender um volume maior de doações,
a equipe poderá reavaliar a estratégia.

Uma possível evolução seria adicionar uma rotina periódica
para atualizar reservas mesmo quando não houver requisições.

Essa alternativa não faz parte da implementação atual.

## 9. Conclusão

A expiração sob demanda foi escolhida por atender à regra
de negócio com baixa complexidade de implementação.

A decisão aproveita a infraestrutura PostgreSQL existente,
preserva o controle de concorrência e evita a inclusão
de serviços adicionais.

A implementação foi registrada em código, testes
automatizados e Pull Request revisado.