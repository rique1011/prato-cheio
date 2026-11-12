# Atividade Refatoração — Prato Cheio

**Disciplina:** Engenharia de Software — 3 Construção  
**Repositório:** https://github.com/rique1011/prato-cheio  
**Base preservada:** `atividade-3`  
**Branch de trabalho:** `refactor/atividade-refatoracao-4-melhorias`  
**Pull Request:** https://github.com/rique1011/prato-cheio/pull/15

## Método e proteção com testes

A IA foi usada para analisar o código atual, identificar os cheiros e propor extrações pequenas. Foram verificados os **45 testes preexistentes** e, **antes da primeira refatoração**, adicionados **7 testes de regressão** em `tests/refatoracoes.test.js`, cobrindo erros HTTP, aceite sem ONG, nomes com espaços, rejeição de ONG vazia, prazo expirado, validade vencida e isolamento dos registros.

**Linha de base, com código ainda sem refatoração:** **52 testes aprovados** no [GitHub Actions](https://github.com/rique1011/prato-cheio/actions/runs/43208548530).  
**CI após a primeira alteração:** [execução verde](https://github.com/rique1011/prato-cheio/actions/runs/43208659136).  
**CI após a segunda alteração:** [execução verde](https://github.com/rique1011/prato-cheio/actions/runs/43208743183).  
**CI após a terceira alteração corrigida:** [execução verde](https://github.com/rique1011/prato-cheio/actions/runs/43208829768).

Todas as refatorações se destinam a preservar o comportamento: as rotas, as mensagens de erro, os estados das doações, o limite de duas horas, a integridade no PostgreSQL e a resposta das consultas.

## Refatoração 1 — Extrair tratamento de erros HTTP

- **Cheiro atacado:** código duplicado (`try/catch` e `res.status(400).json({ erro })`) em cinco rotas do Express.
- **Dor concreta:** a repetição exigia várias alterações ao padronizar a resposta e aumentava o risco de inconsistência.
- **O que mudou:** em `src/app.js` foi criado o wrapper `responderOperacao(operacao, statusSucesso = 200)`. As rotas de listar, criar, aceitar, coletar e cancelar passaram a usá-lo; a rota de saúde continua simples.
- **O que não mudou:** URLs, parâmetros, HTTP 201 na criação, HTTP 200 nas demais operações e HTTP 400 com `{ erro: mensagem }` nas falhas.
- **Proteção:** teste novo `mantém respostas 400 e mensagens de erro nas rotas`, `preserva o comportamento existente de aceite sem nome de ONG`, além dos testes antigos de sucesso e erro.
- **Evidência:** [52 testes verdes antes](https://github.com/rique1011/prato-cheio/actions/runs/43208548530) e [52 verdes depois](https://github.com/rique1011/prato-cheio/actions/runs/43208659136).

## Refatoração 2 — Extrair validação e normalização da ONG

- **Cheiro atacado:** validação duplicada de `typeof ong`, espaços em branco e mensagem de erro nas funções de coleta e cancelamento.
- **Dor concreta:** uma correção futura poderia modificar uma operação e esquecer a outra.
- **O que mudou:** `src/doacoes.js` recebeu `normalizarOng(ong)`, usada por `coletar` e `cancelarReserva`.
- **O que não mudou:** recusa de valor ausente/vazio, `trim()`, identificação da ONG pela igualdade exata do nome, mensagens de erro e operação atômica no banco.
- **Proteção:** testes novos de nome com espaços, ONG vazia e isolamento das reservas, além dos existentes de ONG diferente.
- **Evidência:** [CI antes](https://github.com/rique1011/prato-cheio/actions/runs/43208659136) e [CI depois](https://github.com/rique1011/prato-cheio/actions/runs/43208743183), ambos com 52 testes verdes.

## Refatoração 3 — Centralizar critérios SQL da reserva ativa

- **Cheiro atacado:** regras de prazo e validade duplicadas nas instruções SQL de coleta e cancelamento.
- **Dor concreta:** modificar o limite de tempo ou a validade em apenas um fluxo poderia gerar resultados divergentes.
- **O que mudou:** `src/repositorio.js` usa o fragmento `CONDICAO_RESERVA_ATIVA` nas duas operações. Permanecem `aceita_em IS NOT NULL`, prazo estritamente menor que duas horas e `validade >= CURRENT_DATE`.
- **O que não mudou:** `status = 'aceita'`, correspondência com a ONG, `UPDATE ... WHERE ... RETURNING *` e operações SQL atômicas.
- **Proteção:** testes novos de reserva expirada e alimento vencido nas duas operações; testes existentes de expiração no limite, disputa concorrente, cancelamento e coleta.
- **Evidência:** [CI antes](https://github.com/rique1011/prato-cheio/actions/runs/43208743183) e [CI após ajuste da extração](https://github.com/rique1011/prato-cheio/actions/runs/43208829768), ambos aprovados com 52 testes. Um commit intermediário da extração falhou; o erro foi identificado e corrigido antes da continuação, sem permanecer no resultado final.

## Refatoração 4 — Extrair helper para consultas com um único registro

- **Cheiro atacado:** repetição de `const { rows } = await query(...); return rows[0];` nos métodos de cadastro, aceite, coleta, busca por ID e cancelamento.
- **Dor concreta:** dificultava a leitura e repetia detalhes da estrutura do resultado PostgreSQL.
- **O que mudou:** `src/repositorio.js` recebeu o helper `primeiraLinha(sql, parametros = [])`, usado apenas pelas operações que retornam zero ou um registro.
- **O que não mudou:** a função `listarDisponiveis` e a liberação de reservas expiradas **continuam retornando listas**; `undefined` continua sinalizando consulta singular sem resultado.
- **Proteção:** teste novo `cada operação retorna a doação certa sem afetar outras doações`, além dos testes existentes de listagem, aceitação, coleta e cancelamento.
- **Evidência:** validar no último CI do PR #15 após todas as alterações.

## Revisão de código de outro grupo (etapa separada)

O enunciado também exige revisar **o repositório de outro grupo**, combinar com ele e entregar feedback escrito usando checklist. **Ainda não realizada**, porque o link e o grupo serão fornecidos depois.

Foi preparado o arquivo `docs/revisao-outro-grupo.md` com checklist e campos para constatações verificáveis. Não há avaliação inventada de um repositório que ainda não foi apresentado.

## Limitações e escopo

- As quatro mudanças são **refatorações**, não funcionalidades novas.
- A ONG continua sendo identificada pelo nome (ainda sem autenticação real). Não alterar esse contrato nesta atividade.
- A revisão entre grupos deve ser feita após indicação do outro repositório, registrando arquivos, evidências e razões concretas para cada sugestão.
- A IA auxiliou na identificação de cheiros, na proposta de extrações e na criação de testes; a preservação de comportamento foi conferida pelos testes automatizados contra PostgreSQL real no GitHub Actions.
