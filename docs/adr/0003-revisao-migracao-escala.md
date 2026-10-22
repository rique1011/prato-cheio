# ADR 0003: Revisão da Arquitetura Perante a Expansão para Múltiplas Cidades

## Contexto
Houve uma alteração significativa no escopo do projeto: o "Prato Cheio" já não será utilizado apenas num único bairro, mas irá escalar para múltiplas cidades em simultâneo. Isso implica um volume de doações drasticamente maior e milhares de acessos simultâneos (ONGs a consultarem a lista o tempo todo e doadores a publicarem). Precisamos de reavaliar se a nossa decisão de usar PostgreSQL (ADR 0001 e 0002) continua a suportar este novo cenário.

## Reavaliação da Decisão (PostgreSQL)
A decisão de utilizar o PostgreSQL **é mantida e reforçada**, pois é um sistema desenhado precisamente para lidar com grandes volumes e alta concorrência. No entanto, o cenário muda: apenas escalar o banco de dados relacional verticalmente (aumentar o servidor) ficará demasiado caro e lento com milhares de ONGs a fazer requisições de leitura na mesma tabela.

## Novas Alternativas Avaliadas (Evolução)
1. **Escalar o PostgreSQL com Particionamento:** Dividir as tabelas de doações por cidade nativamente no PostgreSQL.
2. **Adicionar uma Camada de Cache (Redis):** Manter o PostgreSQL como fonte de verdade, mas colocar o Redis à frente para servir a listagem de doações disponíveis, que é a operação mais requisitada.

## Decisão Atualizada
A decisão original de usar PostgreSQL **será mantida**, mas a arquitetura global **será evoluída (substituída no design macro)**. Adotaremos a Alternativa 2: **PostgreSQL + Redis**. 
O PostgreSQL continuará a gerir os aceites (garantindo o *lock* de exclusividade com segurança), mas a listagem de doações disponíveis para visualização será servida pelo Redis.

## Consequências
- **O que ganhamos:** A aplicação não irá cair durante picos de acessos em múltiplas cidades, pois o Redis responde em milissegundos a leituras, retirando a carga pesada do PostgreSQL.
- **O que perdemos:** Aumento considerável da complexidade arquitetural. Teremos de gerir o problema de invalidação de cache (quando uma doação é aceite no PostgreSQL, temos de atualizar instantaneamente a lista no Redis para as ONGs não verem doações fantasma). O custo financeiro de infraestrutura também aumenta.