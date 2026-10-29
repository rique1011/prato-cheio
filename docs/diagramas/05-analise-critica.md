# Análise Crítica dos Diagramas — Expiração de Reservas

**Projeto:** Prato Cheio

**Autor da análise:** Kauã Henrique Lucindo (responsável pela expiração de reservas de duas horas)

**Data:** 28/10/2026

## 1. Escopo e método

Esta análise compara as versões iniciais dos diagramas com o código da branch `entrega-2`. As versões iniciais foram preservadas sem alteração para permitir a comparação.

| Diagrama | Versão inicial | Versão final |
|---|---|---|
| Estados | [01-estados-inicial.md](01-estados-inicial.md) | [02-estados-final.md](02-estados-final.md) |
| Sequência (aceite) | [03-sequencia-inicial.md](03-sequencia-inicial.md) | [04-sequencia-final.md](04-sequencia-final.md) |

Fontes conferidas, com as referências de linha da branch `entrega-2`:

- [`src/db.js`](../../src/db.js): `CHECK` dos status (linha 46).
- [`src/repositorio.js`](../../src/repositorio.js): `aceitar`, `coletar` e `liberarReservasExpiradas`.
- [`src/doacoes.js`](../../src/doacoes.js): regras de negócio e ponto de chamada da liberação.
- [`src/app.js`](../../src/app.js): rotas e códigos HTTP.
- [ADR 0002](../adr/0002-expiracao-sob-demanda.md): decisão de expirar sob demanda.
- [`tests/doacoes.test.js`](../../tests/doacoes.test.js): cenários que descrevem o comportamento esperado.

Cada problema abaixo só foi registrado depois de localizar a evidência no código. Os testes foram lidos, mas não executados para produzir este documento.

## 2. Pontos investigados

| Ponto investigado | Resultado | Onde |
|---|---|---|
| Status `reservada` inexistente | **Presente** | Sequência inicial (03). O diagrama de estados inicial (01) não usa esse nome. |
| Status `expirada` inexistente | Não presente | Nenhuma versão inicial usa esse status. |
| Expiração por agendador (cron) que não existe | **Presente de forma indireta** | Nenhuma versão inicial cita cron, mas ambas deixam o mecanismo implícito (Problema 3). |
| Liberar alimento vencido | **Presente** | Estados inicial (01). Ver Problema 4. |
| Permitir dupla coleta | Não presente | `Coletada` leva direto ao fim do ciclo no diagrama 01. Ver seção 4. |
| Inventar autenticação de ONG | Não presente | O diagrama 03 diz apenas "dados da ONG". |
| Não representar o retorno 400 | **Presente de forma parcial** | O diagrama 03 tem ramo de falha, mas sem código HTTP. Ver seção 5. |

## 3. Problemas prioritários

### Problema 1 — Status `reservada` não existe

**Onde:** [03-sequencia-inicial.md](03-sequencia-inicial.md), mensagem "Atualizar status para 'reservada' e vincular ONG".

**Justificativa:** o domínio tem três estados: `disponivel`, `aceita` e `coletada`. O diagrama de estados inicial já usava `Aceita`, então os dois diagramas iniciais se contradiziam. Seguir o diagrama 03 ao pé da letra levaria a gravar um valor que o banco recusa.

**Evidência no código:**

- `src/db.js:46` define `CHECK (status IN ('disponivel', 'aceita', 'coletada'))`.
- `src/repositorio.js:51` grava `status = 'aceita'` no aceite.
- Uma busca pelos literais de status em `src/` encontra apenas esses três valores.
- O teste `o banco recusa um status fora do fluxo` (`tests/doacoes.test.js:324`) confirma que o banco rejeita valores fora do fluxo. Ele usa `'aceito'` como exemplo, não `'reservada'`, mas o mecanismo do `CHECK` é o mesmo.

**Correção aplicada:** [04-sequencia-final.md](04-sequencia-final.md) grava `status='aceita'` e registra a diferença na tabela da seção 3, item 1. O diagrama [02-estados-final.md](02-estados-final.md) lista os três valores reais do banco e afirma que `reservada` e `expirada` não são usados.

**Impacto na compreensão:** quem lesse apenas o diagrama 03 procuraria um quarto estado que não existe. O leitor também não conseguiria alinhar o diagrama de sequência ao de estados.

### Problema 2 — Aceite desenhado como "ler e depois gravar"

**Onde:** [03-sequencia-inicial.md](03-sequencia-inicial.md), mensagens "Buscar doação por id" e, depois do `alt`, "Atualizar status".

**Justificativa:** o diagrama separa a verificação (`SELECT`) da escrita (`UPDATE`). Nesse desenho, duas ONGs poderiam ler "disponível" ao mesmo tempo e as duas gravar o aceite. O diagrama também esconde onde a regra de exclusividade realmente fica.

**Evidência no código:**

- `src/repositorio.js:47-60` faz um único `UPDATE ... WHERE id = $2 AND status = 'disponivel' AND validade >= CURRENT_DATE RETURNING *`.
- `src/doacoes.js:34-41` não lê a doação antes de aceitar. Apenas transforma "nenhuma linha atualizada" em erro.
- Os testes `aceita a doação uma única vez quando duas ONGs aceitam ao mesmo tempo` (linha 294) e `permite apenas um novo aceite após a reserva expirar` (linha 544) descrevem o resultado esperado: um 200 e um 400.

**Correção aplicada:** [04-sequencia-final.md](04-sequencia-final.md) mostra o `UPDATE` condicional como única decisão. A seção 2 desse arquivo detalha o caso de duas ONGs simultâneas.

**Impacto na compreensão:** o diagrama inicial sugeria que haveria risco de dupla aceitação ou que seria preciso bloqueio na aplicação. No código, a regra fica no `WHERE`.

*Observação:* `coletar` em `src/doacoes.js:56-76` faz uma leitura antes (`buscarPorId`) para produzir mensagens de erro específicas. Mesmo assim, o `UPDATE` em `src/repositorio.js:72-82` repete todas as condições, então a leitura não é o que protege a regra.

### Problema 3 — Mecanismo de expiração omitido

**Onde:**

- [01-estados-inicial.md](01-estados-inicial.md): a transição `Aceita --> Disponivel: Reserva expira após 2 horas` aparece como evento que acontece sozinho.
- [03-sequencia-inicial.md](03-sequencia-inicial.md): não existe nenhuma etapa de liberação de reservas vencidas.

**Justificativa:** nenhum dos dois diagramas fala em agendador, mas o rótulo do estado dá a entender que a mudança de status acontece no instante em que passam duas horas. No código, nada muda o status por conta própria. Já no diagrama de sequência, uma doação com reserva vencida cairia no ramo "indisponível" e o aceite seria recusado. No código, esse é justamente o caso em que o aceite é bem-sucedido.

**Evidência no código:**

- `src/doacoes.js:24` chama `repo.liberarReservasExpiradas()` antes de listar as doações.
- `src/repositorio.js:45` chama `liberarReservasExpiradas()` antes do `UPDATE` do aceite.
- Uma busca por `cron`, `setInterval`, `setTimeout`, `schedule` e `agend` em `src/` e em `package.json` não encontra ocorrência. As dependências são apenas `express` e `pg`.
- O [ADR 0002](../adr/0002-expiracao-sob-demanda.md) (seção 2, alternativa B, e seção 6) registra a escolha e a limitação: a reserva continua gravada como `aceita` até uma operação acionar a verificação.
- Nos testes `mantém a reserva ativa antes de completar duas horas`, `expira a reserva quando completa duas horas` e `libera uma reserva que ultrapassou duas horas`, a liberação só é observada depois de uma chamada a `GET /api/doacoes`.

**Correção aplicada:** [02-estados-final.md](02-estados-final.md) renomeia a transição para "Verificação sob demanda, reserva de 2h expirada e alimento válido" e inclui uma nota sobre listagem e aceite. [04-sequencia-final.md](04-sequencia-final.md) mostra a liberação como primeira etapa do aceite.

**Impacto na compreensão:** o leitor imaginaria um temporizador ou rotina em segundo plano, que não existe. Também não perceberia que uma reserva vencida pode continuar como `aceita` no banco até alguém listar ou tentar aceitar.

### Problema 4 — Liberação sem condição de validade do alimento

**Onde:** [01-estados-inicial.md](01-estados-inicial.md), transição `Aceita --> Disponivel`.

**Justificativa:** o diagrama inicial devolve a doação ao estado disponível sempre que a reserva expira. Pela regra de negócio, isso só vale se o alimento ainda estiver dentro da validade. Sem essa condição, o modelo permitiria oferecer a outra ONG um alimento vencido.

**Evidência no código:**

- `src/repositorio.js:122` exige `validade >= CURRENT_DATE` na liberação.
- A mesma condição aparece em `listarDisponiveis` (linha 30), `aceitar` (linha 56) e `coletar` (linha 81).
- O teste `não disponibiliza novamente uma doação vencida` (linha 457) verifica que a listagem fica vazia nesse caso.
- O [ADR 0002](../adr/0002-expiracao-sob-demanda.md) afirma a regra na seção 1 ("desde que o alimento ainda esteja dentro da validade") e na seção 4.

**Correção aplicada:** [02-estados-final.md](02-estados-final.md) acrescenta "alimento válido" à transição e uma nota afirmando que alimentos vencidos não retornam ao estado disponível.

**Impacto na compreensão:** o diagrama inicial omitia a regra de segurança mais importante da expiração.

## 4. Verificação sob demanda, prazo, validade e caráter terminal

A expiração das reservas é verificada sob demanda, por duas rotas. A primeira é `GET /api/doacoes`, que chama `listarDisponiveis` em `src/doacoes.js`, e esta chama `liberarReservasExpiradas()` antes de consultar a lista. A segunda é a tentativa de aceite (`POST /api/doacoes/:id/aceitar`), que executa a mesma liberação antes do `UPDATE` condicional. Entre uma operação e outra, a doação continua com `status = 'aceita'` no banco, mesmo que o prazo já tenha passado.

O prazo é de duas horas contadas a partir de `aceita_em`, gravado com `NOW()` no aceite. A liberação usa `aceita_em <= NOW() - INTERVAL '2 hours'` e a coleta usa `aceita_em > NOW() - INTERVAL '2 hours'`. As duas condições são complementares: no instante exato de duas horas a reserva já conta como expirada e a coleta é recusada. O teste `expira a reserva quando completa duas horas` cobre esse limite.

A condição de validade é `validade >= CURRENT_DATE`, aplicada na liberação, no aceite e na coleta. A coluna é do tipo `DATE`, então o alimento vale até o fim da data informada, sem hora de vencimento (ADR 0002, seção 6). Quando a reserva passou de duas horas e o alimento está vencido, a doação não é liberada nem pode ser coletada. Pela leitura do código, ela permanece como `aceita`. Esse caso não é representado como transição nos diagramas finais, e o teste correspondente verifica apenas que a listagem fica vazia, não que o status continua `aceita`.

`coletada` é terminal. Nenhum `UPDATE` em `src/repositorio.js` altera uma linha que esteja `coletada`: a liberação filtra `status = 'aceita'`, o aceite filtra `status = 'disponivel'` e a coleta filtra `status = 'aceita'`. Os testes `não libera uma doação que já foi coletada` e `recusa confirmar a mesma coleta duas vezes` descrevem esse comportamento. Por isso o diagrama inicial já estava correto ao ligar `Coletada` somente ao fim do ciclo, e a dupla coleta não foi tratada como problema.

## 5. Outras diferenças reais, não priorizadas

- **Coleta sem condições no diagrama 01.** A transição `Aceita --> Coletada: ONG confirma a coleta` não indicava a exigência da mesma ONG, do prazo de duas horas e da validade (`src/repositorio.js:76-81` e `src/doacoes.js:64-73`). Os testes `recusa a coleta por uma ONG diferente da registrada` e `recusa a coleta quando a reserva ultrapassa duas horas` cobrem as duas primeiras. Corrigido em [02-estados-final.md](02-estados-final.md).
- **Falha sem código HTTP no diagrama 03.** O ramo de erro dizia apenas "Falha — aceite recusado". O código responde `400` com `{ erro }` (`src/app.js:37-39`). Corrigido em [04-sequencia-final.md](04-sequencia-final.md).

## 6. Observações sobre o código

Estas observações não são erros dos diagramas.

- Em `src/app.js:36`, o aceite usa o valor `'ONG'` quando o corpo não traz o nome. A coleta, ao contrário, exige o nome (`src/doacoes.js:51-53`). O [ADR 0002](../adr/0002-expiracao-sob-demanda.md), seção 6, registra que não existe autenticação real e que a identificação é por nome.
- O comentário em `src/repositorio.js:108` ("EXPIRAÇÃO AUTOMÁTICA DE RESERVAS") e o título do bloco de testes em `tests/doacoes.test.js:337` usam a palavra "automática". Como a expiração é sob demanda, o termo pode sugerir um agendador a quem lê só o código.
- Não encontrei o histórico do Git no material analisado. Por isso não confirmei o Pull Request nem o commit citados na seção 7 do ADR 0002. A contagem de oito testes de expiração e 24 cenários no total confere com o arquivo de testes.

## 7. Conclusão

As versões iniciais acertaram a sequência geral do ciclo (disponível, aceita, coletada), o estado terminal e a separação entre camada HTTP e regra de negócio. Os quatro problemas prioritários têm origem em informações que só aparecem no código: o nome real do status, onde a exclusividade do aceite é garantida, quando a expiração acontece e a condição de validade. As versões finais corrigem esses pontos.
