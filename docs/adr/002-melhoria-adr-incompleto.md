# ADR 0002: Escolha do Sistema de Gestão de Base de Dados Principal

## Contexto
O sistema "Prato Cheio" lida com dados sensíveis de segurança alimentar e regras de negócio estritas (como a exclusividade de aceite e expiração de doações). Precisamos de escolher um Sistema de Gestão de Bases de Dados (SGBD) definitivo para o ambiente de produção que garanta integridade referencial, evite perda de dados em falhas e lide bem com relações complexas (Doadores 1:N Doações; ONGs 1:N Aceites). A justificativa inicial "utilizar PostgreSQL porque é melhor" carece de fundamentação técnica perante as restrições do projeto.

## Alternativas
1. **MySQL:**
   - *Vantagens:* Muito popular, amplamente suportado em diversas plataformas de alojamento.
   - *Desvantagens:* Menos aderente ao padrão SQL estrito em algumas configurações padrão, tratamento de concorrência menos otimizado que o Postgres.
2. **PostgreSQL:**
   - *Vantagens:* Conformidade estrita com ACID, excelente ecossistema open-source, suporte nativo a formatos JSONB e extensões de mapeamento geográfico (PostGIS).
   - *Desvantagens:* Consumo de memória ligeiramente superior por ligação.

## Decisão
Decidimos utilizar o **PostgreSQL**. A escolha não se deve apenas por ser "melhor" de forma genérica, mas porque a sua arquitetura de controlo de concorrência multiversão (MVCC) permite que as ONGs continuem a listar doações disponíveis rapidamente, mesmo enquanto o sistema está a processar dezenas de transações de escritas e aceites no mesmo milissegundo. Além disso, a robustez das suas *constraints* garante que doações sem a data de validade correta sejam bloqueadas logo na camada de persistência.

## Consequências
- **O que ganhamos:** Segurança e integridade de dados inquestionável. Capacidade de usar extensões (como PostGIS) nas próximas iterações para calcular a distância entre Doadores e ONGs.
- **O que perdemos:** Curva de aprendizagem da equipa para otimizar queries específicas e necessidade de um planeamento de infraestrutura mais cuidadoso.