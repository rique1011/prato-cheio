# ADR 0003 — Possível evolução da arquitetura para múltiplas cidades

**Data:** 27/10/2026

**Status:** Proposta futura — não implementada

## 1. Contexto

O Prato Cheio é uma aplicação destinada a conectar doadores
de alimentos e organizações responsáveis pela coleta.

Na versão desenvolvida para a Atividade Avaliativa 2 (N2),
o sistema utiliza PostgreSQL para armazenar e gerenciar
as doações.

Caso o projeto seja expandido futuramente para várias
cidades, poderá ocorrer um aumento no número de
usuários, consultas e operações simultâneas.

Esse cenário exige avaliar possíveis alternativas
de escalabilidade.

IMPORTANTE: a expansão para múltiplas cidades é um
cenário hipotético. Ela não faz parte das funcionalidades
implementadas nesta entrega.

## 2. Alternativas consideradas

### Alternativa 1 — Manter somente PostgreSQL

Continuar utilizando PostgreSQL como banco de dados,
aplicando otimizações conforme a demanda.

Vantagens:
- Menor complexidade arquitetural.
- Infraestrutura mais simples.
- Menor custo de manutenção.
- Consistência dos dados centralizada no PostgreSQL.

Desvantagens:
- Pode exigir otimizações adicionais com o crescimento.
- Consultas muito frequentes podem aumentar a carga no banco.

### Alternativa 2 — PostgreSQL com Redis

Utilizar PostgreSQL como banco principal e Redis
como mecanismo de cache para consultas frequentes.

Vantagens:
- Pode reduzir consultas repetitivas ao PostgreSQL.
- Pode melhorar o desempenho de determinadas operações.
- Permite criar uma estratégia de cache para listagens.

Desvantagens:
- Exige infraestrutura adicional.
- Aumenta a complexidade do sistema.
- Requer mecanismos para atualização e invalidação do cache.
- Pode apresentar informações desatualizadas se o cache
  não for administrado corretamente.

### Alternativa 3 — Particionamento de tabelas

Utilizar recursos do PostgreSQL para particionar
dados conforme necessidades futuras.

Vantagens:
- Mantém a solução dentro do PostgreSQL.
- Pode beneficiar consultas sobre grandes volumes de dados.

Desvantagens:
- Exige planejamento das consultas e particionamento.
- Pode aumentar a complexidade da manutenção do banco.

## 3. Decisão

Para a versão entregue na N2, a decisão é manter
somente o PostgreSQL.

Não foi implementada integração com Redis,
particionamento de tabelas ou infraestrutura
específica para múltiplas cidades.

Essas alternativas permanecem como possibilidades
de evolução e deverão ser avaliadas somente quando
existirem requisitos e medições que justifiquem
sua adoção.

## 4. Trade-offs

Manter somente o PostgreSQL simplifica a arquitetura,
reduz a necessidade de infraestrutura e facilita
a manutenção do projeto acadêmico.

Em contrapartida, uma expansão significativa poderá
exigir novas estratégias de desempenho.

A introdução de Redis sem necessidade comprovada
aumentaria a complexidade da solução atual.

## 5. Consequências

### Consequências positivas

- A documentação corresponde à implementação existente.
- O sistema permanece com uma arquitetura mais simples.
- Evita dependências adicionais sem necessidade comprovada.
- Mantém o PostgreSQL como fonte principal dos dados.

### Limitações

- Não foram realizados testes de carga para milhares
  de usuários simultâneos.
- A aplicação não possui camada de cache com Redis.
- Não há particionamento implementado por cidade.
- Não é possível garantir desempenho em grande escala
  sem testes específicos.

## 6. Relação com os demais ADRs

- ADR 0001: documenta a migração de SQLite para PostgreSQL.
- ADR 0002: documenta a expiração de reservas sob demanda.

Este ADR 0003 não altera as decisões implementadas
nos ADRs anteriores.

Seu objetivo é registrar possibilidades futuras
de evolução da arquitetura.

## 7. Conclusão

A arquitetura atual utiliza PostgreSQL e atende
ao escopo implementado nesta atividade.

A adoção de Redis ou de outras técnicas de
escalabilidade dependerá de necessidades futuras,
medições de desempenho e novas decisões de arquitetura.