# ADR 0001: Migração de SQLite para PostgreSQL

## Contexto
O projeto "Prato Cheio" iniciou a sua etapa de validação (Walking Skeleton) utilizando o SQLite embutido no Node.js. O SQLite foi excelente para testes rápidos e desenvolvimento sem infraestrutura. Contudo, à medida que avançamos para um ambiente de produção real, enfrentamos o risco de condição de corrida (duas ONGs a tentarem aceitar a mesma doação ao mesmo tempo). O SQLite possui limitações no bloqueio de nível de linha (*row-level locking*) e bloqueia a base de dados inteira durante operações de escrita, o que pode causar gargalos e falhas de concorrência.

## Alternativas
1. **Manter o SQLite:** 
   - *Vantagens:* Zero custo de infraestrutura, facilidade extrema de configuração.
   - *Desvantagens:* Falta de escalabilidade para escritas concorrentes, bloqueio global da base de dados (database lock) que pode causar recusa de requisições simultâneas.
2. **Migrar para PostgreSQL:**
   - *Vantagens:* Altamente robusto, excelente controlo de transações e concorrência (ACID estrito), suporta *row-level locks* nativamente, escalável.
   - *Desvantagens:* Exige gestão de infraestrutura (cloud/servidor), tempo de setup inicial mais elevado.
3. **Migrar para MongoDB (NoSQL):**
   - *Vantagens:* Flexibilidade de esquema, fácil de escalar horizontalmente.
   - *Desvantagens:* Foge do modelo relacional estruturado que já definimos para Doadores, Doações e ONGs; gestão de integridade referencial mais complexa.

## Decisão
Decidimos pela **Alternativa 2 (Migrar para PostgreSQL)**. O PostgreSQL resolve diretamente o nosso risco mais crítico: o conflito no aceite de doações. Com ele, podemos usar transações e bloqueios de linha para garantir que apenas a primeira ONG consiga alterar o estado da doação para "reservada", recusando as demais sem bloquear as leituras de outras ONGs.

## Consequências
- **O que ganhamos:** Fiabilidade total nos dados, resolução do problema de concorrência, preparação para produção e suporte a tipos de dados avançados (como geolocalização, se necessário no futuro).
- **O que perdemos/custos:** Teremos de configurar um servidor de base de dados (ex: Render, AWS ou Docker local) e adaptar as variáveis de ambiente, aumentando ligeiramente a complexidade da integração contínua (CI).