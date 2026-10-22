# Análise de Requisitos e Domínio — Prato Cheio

## Stakeholders

| Stakeholder | O que quer | Interesse | Influência | Consequência para a iteração 1 |
|---|---|---|---|---|
| **Marta (Patrocinadora / Operação)** | Validar o piloto do projeto e conectar doadores a ONGs de forma rápida | Alto | Alta | Envolver diretamente na validação e aceitar requisitos de operação imediata |
| **ONGs e Cozinhas Comunitárias** | Previsibilidade sobre os alimentos disponíveis e rapidez no aceite/coleta | Alto | Alta | Entrevistar primeiro e aceitar requisitos de aceite simples agora |
| **Vigilância Sanitária (Regulador)** | Garantia de segurança alimentar e rastreabilidade mínima (tipo, quantidade, validade) | Baixo | Alta | Manter satisfeita atendendo a exigência legal de validade e tipo de alimento sem bloquear a operação |
| **Doadores (Restaurantes e Padarias)** | Cadastrar doações com extrema rapidez, sem burocracia no meio da rotina | Alto | Alta | Focar no formulário com tempo de preenchimento reduzido e poucos campos |
| **Voluntários Entregadores** | Rotas claras e bom funcionamento em celulares com conexão instável | Alto | Baixa | Manter informados; requisitos avançados de logística ficam para iterações futuras |
| **Família Atendida (Beneficiário Final)** | Receber refeições seguras, com dignidade e qualidade | Alto | Baixa | Monitorar o impacto e satisfação indiretamente através do feedback das ONGs |

---

## Objetivos de impacto

1. **Reduzir a mediana do tempo de coleta:** Reduzir o tempo decorrido entre o momento da publicação da doação pelo doador e a coleta efetiva pela ONG (linha de base: desconhecida, medir a partir do piloto).
2. **Aumentar o volume de refeições salvas:** Aumentar a quantidade total (em kg/refeições) de alimentos doados e coletados com sucesso antes do vencimento (linha de base: desconhecida, medir no piloto).
3. **Reduzir a taxa de descarte:** Reduzir o percentual de doações cadastradas que chegam ao horário limite sem que nenhuma ONG aceite ou colete (linha de base: desconhecida, medir a partir da iteração 1).

---

## Regras de negócio

### 1. Registro Mínimo de Rastreabilidade (Imposta / Exigência do Regulador)
* **Onde estava:** Exigência da Vigilância Sanitária.
* **Enunciado explícito:** Toda doação cadastrada deve conter obrigatoriamente o tipo do alimento, a quantidade estimada e a data/hora limite de validade.
* **Como verificar:** O sistema deve impedir a submissão de formulários que omitam esses três dados essenciais.

### 2. Exclusividade por Aceite (Praticada / Comportamento Atual)
* **Onde estava:** Comportamento praticado no grupo de WhatsApp ("quem responde primeiro leva").
* **Enunciado explícito:** Uma doação aceita por uma ONG muda imediatamente seu estado para "reservada", ficando indisponível para aceite por qualquer outra ONG.
* **Como verificar:** Ao realizar duas requisições simultâneas de aceite para a mesma doação, apenas a primeira deve obter sucesso e a segunda deve receber erro de indisponibilidade.

### 3. Expiração Automática por Inação (REGRA AUSENTE)
* **Onde estava:** Silêncio do caso ("o que acontece se a ONG aceita e não busca?").
* **Enunciado explícito:** Se uma ONG aceitar uma doação e não realizar a confirmação de coleta em até 2 horas (ou até o limite estipulado no cadastro), o aceite expira automaticamente e a doação volta ao status "disponível" no sistema.
* **Responsável pela decisão:** Decidido pelo time de desenvolvimento junto à operação (Marta).
* **Como verificar:** Simular uma doação aceita sem confirmação de coleta, avançar o tempo do sistema além do limite e verificar se a doação volta a ser exibida na lista de disponíveis.

---

## Conflitos de prioridade

### 1. Falas em conflito
* **Doador:** "Preciso cadastrar a doação em menos de 10 segundos no meio da correria do restaurante, senão jogo a comida no lixo por falta de tempo."
* **Vigilância Sanitária:** "Exijo o registro detalhado e rastreável da validade e do tipo de alimento para liberar a operação sem riscos à saúde pública."

### 2. Anatomia do conflito
* **Eixo do trade-off:** Quantidade de campos obrigatórios e tempo necessário para preencher o formulário de cadastro.
* **O que cada lado perde:** 
  * Se priorizar apenas o Doador: Perde-se a rastreabilidade exigida pelo regulador, arriscando o veto do piloto pela Vigilância Sanitária.
  * Se priorizar apenas a Vigilância Sanitária: Perde-se doadores devido à burocracia do preenchimento demorado.

### 3. Critério de decisão e saída adotada
* **Critério:** Na Iteração 1, o formulário exigirá apenas os 3 campos obrigatórios previstos em lei (Tipo, Quantidade e Validade), utilizando botões de seleção rápida (presets) para dispensar a digitação de texto longo.
* **Saída adotada:** Anular o trade-off (Redesenho de interface com seletores ágeis de validade e quantidade, garantindo conformidade sanitária em um tempo de preenchimento inferior a 15 segundos).

## Histórias de Usuário e Avaliação INVEST

### 1. Cinco Histórias Iniciais (com falhas no INVEST)
Abaixo estão 5 rascunhos de histórias de usuário e a avaliação do motivo pelo qual elas falham em pelo menos um critério do acrônimo INVEST:

1. **História:** Como ONG, quero aceitar uma doação e já traçar a rota do voluntário no mapa ao mesmo tempo, para garantir a retirada.
   * **Falha no critério:** **I**ndependent (Independente) e **S**mall (Pequena). Ela acopla a regra de negócio de aceite com a complexidade de roteamento de mapas.
2. **História:** Como Doador, quero um formulário de 3 passos com um botão verde neon para cadastrar a comida.
   * **Falha no critério:** **N**egotiable (Negociável). A história dita a interface (UI) em vez de focar no problema a ser resolvido (cadastrar doação).
3. **História:** Como Administrador do banco de dados, quero que a tabela de doações tenha uma chave estrangeira para a tabela de ONGs, para manter a integridade referencial.
   * **Falha no critério:** **V**aluable (Valor). É uma tarefa técnica. Não entrega valor direto de negócio para o usuário final.
4. **História:** Como Doador, quero que o sistema seja rápido ao cadastrar uma doação para eu não perder meu tempo.
   * **Falha no critério:** **E**stimable (Estimável) e **T**estable (Testável). O termo "rápido" é vago, subjetivo e impossível de ser testado objetivamente (rápido é 1 segundo ou 1 minuto?).
5. **História:** Como ONG, quero gerenciar todo o ciclo do alimento, desde o aceite até a entrega na casa das famílias e a geração de relatórios mensais, para ter controle total.
   * **Falha no critério:** **S**mall (Pequena). É um Épico gigante que levaria meses para ser construído, impossível de caber em uma única iteração.

### 2. Quebra de História Gigante (Fatiamento de Épico)
**História Gigante (Épico):** Como ONG, quero gerenciar todo o processo de aquisição de doações (ver o que tem, reservar a comida e confirmar que peguei) para garantir que a comida chegue na cozinha.

**Fatiada em 3 menores e com valor independente:**
* **Fatia 1:** Como ONG, quero visualizar a lista de doações disponíveis no dia, para saber se há alimentos que atendem à minha demanda.
* **Fatia 2:** Como ONG, quero aceitar uma doação específica da lista, para garantir que o alimento fique reservado para mim e não vá para outra instituição.
* **Fatia 3:** Como ONG, quero marcar uma doação reservada como "coletada", para sinalizar ao doador e ao sistema que o processo foi concluído com sucesso.

### 3. Correção de Histórias geradas por IA
Registros das correções feitas após geração inicial via IA:

* **IA Gerou:** "O sistema deve enviar um email quando a doação for aceita."
  * **O que mudamos e por quê:** Mudamos para *"Como Doador, quero ser notificado quando uma ONG aceitar minha doação, para saber que a comida não será descartada."* A IA havia gerado um requisito de sistema sem ator e sem valor; ajustamos para o formato de História de Usuário (Ator, Ação e Valor).
* **IA Gerou:** "Como usuário, quero fazer login para usar o app."
  * **O que mudamos e por quê:** Mudamos para *"Como Voluntário, quero acessar o sistema com meu email e senha, para visualizar as coletas designadas a mim."* "Usuário" era muito genérico e "usar o app" não refletia um valor de negócio real.
* **IA Gerou:** "Como Doador, quero cadastrar doação."
  * **O que mudamos e por quê:** Mudamos para *"Como Doador, quero cadastrar uma doação informando tipo, quantidade e validade, para disponibilizá-la às ONGs cadastradas."* A IA não especificou o "para quê" (o valor da entrega) nem as restrições básicas para a história ser testável.

### 4. História Zero (Walking Skeleton)
A fatia fina escolhida para o walking skeleton da próxima aula é:
**"Como Doador, quero cadastrar uma doação simples com sua validade, para que ela fique registrada no sistema e disponível."**
*Justificativa:* É a funcionalidade central que dispara todo o fluxo de valor. Sem o cadastro da doação, as ONGs não têm o que listar ou aceitar.

## Critérios de Aceite (BDD)

Para validar as histórias de usuário, definimos os seguintes cenários usando a estrutura Dado/Quando/Então:

**História 1:** Como Doador, quero cadastrar uma doação simples com sua validade (História Zero / Walking Skeleton).
* **Cenário:** Cadastro de doação com sucesso
* **Dado** que o doador preencheu os campos obrigatórios "tipo", "quantidade" e "validade" (futura)
* **Quando** ele submete o formulário de cadastro
* **Então** o sistema salva a doação no banco de dados com o status "disponível" e retorna uma confirmação visual de sucesso (HTTP 201).

**História 2:** Como ONG, quero visualizar a lista de doações disponíveis no dia.
* **Cenário:** Listagem de doações ativas
* **Dado** que existem doações com status "disponível" não expiradas no banco de dados
* **Quando** a ONG acessa a rota de listagem de doações
* **Então** o sistema retorna apenas as doações ativas, ocultando as que já foram aceitas ou vencidas.

**História 3:** Como ONG, quero aceitar uma doação específica da lista.
* **Cenário:** Concorrência no aceite de doação
* **Dado** que a doação X está "disponível"
* **Quando** a ONG solicita o aceite dessa doação
* **Então** o sistema altera o status da doação X para "reservada" e vincula à ONG, impedindo que outras instituições aceitem a mesma doação.

---

## Hipóteses e Experimentos

* **Suposição do caso:** Assumimos que as ONGs estão com tempo e infraestrutura para ficar atualizando o sistema o tempo todo em busca de comida.
* **Hipótese testável:** Acreditamos que **notificar as ONGs ativamente** (push/mensagem) reduzirá drasticamente o gargalo de coleta. Saberemos que estamos certos se, no piloto, **80% das doações cadastradas forem aceitas em menos de 15 minutos**.
* **Experimento:** Durante as duas primeiras semanas do piloto, enviaremos um alerta manual (WhatsApp) para as ONGs sempre que uma doação for publicada, e mediremos no banco de dados a diferença de tempo (timestamp) entre a criação e o aceite.

---

## Riscos e Mitigações

1. **Risco Técnico/Legal (Vigilância Sanitária):** Doadores cadastrarem alimentos com a validade já expirada por erro de digitação, gerando risco à saúde das famílias e embargo do projeto.
   * **Mitigação Concreta:** Implementar validação estrita no backend impedindo qualquer `INSERT` no banco de dados de doações cuja data/hora de validade seja menor ou igual ao horário atual do servidor.

2. **Risco Operacional (Falso Aceite):** Uma ONG aceitar a doação para garantir a reserva, mas não ter voluntários para buscar, deixando a comida estragar na origem.
   * **Mitigação Concreta:** Criar a rotina de "Expiração Automática". Se a doação for aceita e não for marcada como "coletada" em um prazo de 2 horas, o sistema reverte o status automaticamente para "disponível" e alerta a próxima ONG da fila.