# Validação dos Critérios de Aceite

## História 1 — Cadastro de doação (Walking Skeleton)

- **Critério:** dado tipo, quantidade e validade futura, ao submeter, o sistema salva com status "disponivel" e retorna sucesso.
- **Atende?** Sim.
- **Evidência:** teste automatizado em `tests/doacoes.test.js` ("doação publicada aparece na lista de disponíveis"). Executado com `npm test` em 23/09/2026 — 6/6 testes passando.

## História 2 — Listagem de doações disponíveis

- **Critério:** a rota de listagem retorna somente doações com status "disponivel", ocultando as já aceitas.
- **Atende?** Sim.
- **Evidência:** teste "doação aceita some da lista de disponíveis".

## História 3 — Aceite exclusivo (concorrência)

- **Critério:** uma doação só pode ser aceita por uma ONG; a segunda tentativa deve ser recusada.
- **Atende?** Sim.
- **Evidência:** teste "segunda ONG NÃO consegue aceitar doação já aceita por outra" (retorna erro 400).

## Regra pendente

- **Expiração automática em 2h:** ainda **não** implementada. Fica como próximo passo da próxima iteração.

---

Validado por: Kauã Henrique Lucindo — 23/09/2026
