# Revisão de código entre grupos — Atividade Refatoração

**Data da análise:** 12/11/2026  
**Grupo analisado:** Prato Cheio — **AKMS** (Alisson Anderle, Victor Kunz, Lucas Mendonça e Vinicius Steuernagel, conforme o README)  
**Repositório:** https://github.com/mendoncaluucas/prato-cheio  
**Versão examinada:** branch `main`, commit [`61c362e`](https://github.com/mendoncaluucas/prato-cheio/commit/61c362efa3a85e7fc73f13d7d93347700454b813)  
**Grupo revisor:** Prato Cheio — repositório `rique1011/prato-cheio`  
**Tipo de revisão:** leitura estática de código, documentação e evidências do GitHub Actions. Não foram feitas alterações no projeto do AKMS.

> **Status:** revisão técnica realizada e feedback redigido neste arquivo. **Envio/recebimento pelo grupo AKMS não confirmado**; o compartilhamento do relatório deve ser combinado ou encaminhado pela equipe revisora.

## 1. Escopo e evidência geral

Arquivos examinados: `README.md`, `src/app.js`, `src/doacoes.js`, `src/repositorio.js`, `src/db.js`, `src/server.js`, `public/index.html`, `tests/doacoes.test.js`, `vitest.config.js`, `.github/workflows/ci.yml`, `.env.example`, `docs/refatoracoes.md` e `docs/validacao.md`.

**Resultado de testes confirmado:** [CI no commit revisado, 71 testes aprovados de 71, com PostgreSQL 18 e verificação de subida da aplicação](https://github.com/mendoncaluucas/prato-cheio/actions/runs/41943632275). Os testes não foram executados localmente pelo revisor; o resultado acima foi verificado nos logs do GitHub Actions.

Pontos positivos observados:
- Separação de **HTTP** (`app.js`), **negócio** (`doacoes.js`) e **SQL** (`repositorio.js`).
- Tratamento padronizado de erros de negócio e erros internos no [`src/app.js`](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/src/app.js#L10-L26), sem expor detalhes internos na resposta de erro 500.
- SQL com parâmetros e condições de status nos `UPDATE`s de aceite, coleta e retirada, reduzindo disputas entre operações simultâneas.
- Suíte com cenários de aceite, coleta, retirada, vencimento, relatório semanal, migração e validação; CI executando com banco PostgreSQL temporário.
- Projeto documentado com README, ADRs e histórico de PRs.

## 2. Checklist de revisão

| Item | Avaliação | Observação e referência |
|---|---|---|
| Estrutura do projeto e instruções de execução | **Atende (documentação)** | O [README](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/README.md) apresenta instalação e comandos. A clonagem local não foi executada. |
| Testes executáveis e critérios de aceite | **Atende** | [71/71 testes aprovados no CI](https://github.com/mendoncaluucas/prato-cheio/actions/runs/41943632275); testes organizados por histórias em `tests/doacoes.test.js`. |
| CI automático | **Atende** | [Workflow](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/.github/workflows/ci.yml) contém gatilhos de push/PR, testes e verificação de saúde. |
| Separação de responsabilidades | **Atende** | API, regras de negócio e persistência em arquivos distintos. |
| Tratamento de erro HTTP | **Atende** | Wrapper `responder()` e middleware para JSON inválido no `src/app.js`. |
| SQL parametrizado | **Atende com ressalva** | Consultas utilizam parâmetros; ver recomendação **R3** para a tradução por regex. |
| Concorrência / integridade de estado | **Atende com ressalva** | `UPDATE`s verificam status; falta revalidar a validade dentro do aceite atômico (**R2**). |
| Identificação/autorização por perfil | **Precisa melhorar** | Rota de retirada não diferencia administrador de usuário comum (**R1**). |
| Clareza e ausência de duplicação desnecessária | **Parcial** | Cálculos e classificação do relatório semanal concentrados em método extenso (**R4**). |
| Documentação final da refatoração | **Pendente na versão revisada** | [`docs/refatoracoes.md`](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/docs/refatoracoes.md) ainda possui campos de modelo. |
| Validação formal dos critérios de aceite | **Parcial** | [`docs/validacao.md`](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/docs/validacao.md) tem evidências da H4a, mas a tabela inicial ainda não está preenchida. |
| Segredos no Git | **Não auditado integralmente** | `.env.example` contém apenas instruções; não foi realizada varredura completa do histórico do Git. |

A avaliação acima é restrita à revisão do commit indicado. Nenhum item marcado como **parcial** ou **precisa melhorar** significa, por si só, reprovação do projeto.

## 3. Constatações e propostas de melhoria

### R1 — Distinguir operação administrativa de operação comum — Prioridade alta

- **Evidência:** a história H6c descreve a retirada por quem administra a plataforma, mas [`POST /api/doacoes/:id/retirar`](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/src/app.js#L42-L45) chama diretamente a regra, sem verificar perfil. A [interface apresenta o botão “Retirar (imprópria)”](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/public/index.html#L190-L212) em listas de doações.
- **Por que propomos:** na implementação atual, fornecer um motivo é a validação exigida. A ausência de distinção entre administrador e usuário comum pode permitir uma retirada indevida quando o sistema for usado por usuários reais. A interface não substitui uma checagem na API.
- **Proposta:** separar a autorização da regra de retirada e validar o perfil do solicitante no servidor, mantendo a validação do motivo; na UI, exibir o comando apenas para quem tem permissão. Como o projeto é acadêmico, se autenticação não fizer parte do escopo, **documentar explicitamente a limitação** e tratar isso como uma evolução, em vez de alterar contratos sem planejamento.
- **Teste de proteção recomendado:** usuário comum recebe resposta de acesso negado e não altera a doação; administrador autorizado consegue retirar; motivo vazio continua recusado.
- **Natureza da observação:** limitação de autorização identificada por leitura de código; nenhum teste de acesso indevido foi executado.

### R2 — Revalidar a data de validade no UPDATE do aceite — Prioridade média/alta

- **Evidência:** [`doacoes.aceitar()`](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/src/doacoes.js#L97-L127) consulta e valida a validade antes de escrever, mas o [SQL de aceite](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/src/repositorio.js#L72-L80) restringe apenas `id` e `status = 'disponivel'`.
- **Por que propomos:** existe uma janela entre ler/verificar a doação e atualizar o status. Caso a data mude nesse intervalo (por exemplo, na virada do dia), a atualização não revalida a janela de retirada. É um risco de consistência, **não uma falha reproduzida nesta revisão**.
- **Proposta:** incluir uma condição de validade no `UPDATE` parametrizado, usando a mesma referência de dia usada pela camada de negócio. Manter o tratamento de `UPDATE` que não retorna linha.
- **Teste de proteção recomendado:** simular vencimento entre leitura e atualização e confirmar que a linha continua disponível e não aceita; manter o teste de duas ONGs tentando aceitar simultaneamente.
- **Benefício esperado:** garantir a regra de validade também no ponto da escrita atômica.

### R3 — Tornar a tradução de marcadores SQL mais robusta — Prioridade média

- **Evidência:** [`marcadoresPostgres()`](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/src/db.js#L41-L45) troca **todas** as ocorrências de `?` por `$1`, `$2`, etc. usando `sql.replace(/\?/g, ...)`.
- **Por que propomos:** a estratégia funciona para os comandos simples atuais, mas não distingue parâmetros de sinais `?` em literais de texto, comentários ou expressões SQL. Isso pode causar mudanças inesperadas em consultas futuras.
- **Proposta:** limitar o adaptador a consultas que sigam estritamente a convenção e adicionar testes de contrato, ou utilizar uma estratégia de parametrização específica por driver que não reescreva conteúdo literal.
- **Teste de proteção recomendado:** checar a correspondência entre parâmetros e marcadores e casos com `?` literal, além de executar os testes tanto com SQLite quanto com PostgreSQL.
- **Natureza da observação:** risco de manutenção futura; não foi identificado uso problemático de `?` literal nas consultas atuais.

### R4 — Decompor o relatório semanal em funções com responsabilidades menores — Prioridade média/baixa

- **Evidência:** [`montarRelatorioSemanal()`](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/src/doacoes.js#L165-L206) inicializa acumuladores, classifica estados, calcula horas, agrupa por semana e monta indicadores em um mesmo fluxo.
- **Por que propomos:** a concentração de regras em uma função exige compreender vários casos ao fazer mudanças na classificação dos alimentos, taxa de coleta ou mediana. Dificulta manutenção e revisão das regras de negócio.
- **Proposta:** extrair funções pequenas como `classificarDoacao`, `acumularSemana` e `finalizarIndicadores`, preservando o contrato da função pública `montarRelatorioSemanal`. Evitar refatorar os cálculos sem testes.
- **Teste de proteção recomendado:** preservar os testes existentes para taxa, mediana, doações retiradas e coletas tardias; adicionar cenário de fronteira de fuso horário conforme o comportamento de negócio esperado.
- **Benefício esperado:** reduzir complexidade e permitir mudanças mais localizadas.

### R5 — Completar registros de refatoração/validação — Prioridade média para a entrega

- **Evidência:** [`docs/refatoracoes.md`](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/docs/refatoracoes.md#L5-L22) ainda apresenta campos e contagens por preencher; a [tabela principal de `docs/validacao.md`](https://github.com/mendoncaluucas/prato-cheio/blob/61c362efa3a85e7fc73f13d7d93347700454b813/docs/validacao.md#L5-L11) também está sem avaliação.
- **Por que propomos:** o projeto tem boas evidências automatizadas, mas o avaliador ainda não encontra nesses campos o histórico do cheiro atacado, das alterações e dos testes antes/depois.
- **Proposta:** preencher as quatro refatorações com arquivo, razão, comportamento preservado e links de CI; completar a matriz de critérios com `atende/parcial/não` e testes relacionados.
- **Observação:** pode ser apenas trabalho em andamento na versão revisada; não significa ausência de testes ou de refatorações em outras branches.

## 4. Feedback escrito para encaminhar ao AKMS

> Olá, pessoal do AKMS! Fizemos uma revisão técnica da branch `main` do Prato Cheio de vocês, no commit `61c362e`. Gostamos da separação entre rotas, regras de negócio e SQL, do tratamento de erros e da cobertura: conferimos **71 testes aprovados** no CI com PostgreSQL.
>
> Identificamos algumas oportunidades de melhoria: **(1)** a retirada de doações, descrita como administrativa, ainda não diferencia perfis na API; **(2)** a validade é conferida antes do aceite, mas poderia também ser verificada no `UPDATE`; **(3)** a substituição de `?` por `$n` com regex pode ficar frágil com consultas mais complexas; **(4)** o cálculo do relatório semanal pode ser dividido em funções menores; e **(5)** os documentos de refatoração/validação ainda têm campos de modelo.
>
> As observações **R2 e R3 são riscos de evolução**, não bugs reproduzidos; indicamos testes específicos para protegê-los. Deixamos no relatório os arquivos, os motivos e nossas sugestões. Obrigado pela troca entre grupos!

## 5. Registro de envio e acordo entre grupos

- **Repositório indicado para análise:** recebido em 12/11/2026.
- **Combinado ou aceite formal entre os grupos:** não informado.
- **Feedback elaborado:** sim — seção 4 acima.
- **Feedback publicado no repositório alheio ou enviado ao grupo:** **não**. Não houve postagem nem alteração no GitHub do AKMS.
- **Canal, data de envio e confirmação de recebimento:** a preencher após o compartilhamento pela equipe.

**Conclusão:** análise de leitura e evidência de CI concluídas. O passo ainda externo ao repositório é encaminhar o feedback escrito para o outro grupo e registrar a confirmação, caso exigida pela disciplina.
