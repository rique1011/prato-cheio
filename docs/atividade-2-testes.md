# Atividade 2 — Construção: testes dos critérios de aceite

## História escolhida

**Como ONG que aceitou uma doação, quero cancelar minha reserva antes da coleta, para que outra ONG possa aproveitar o alimento.**

A história está implementada na branch `atividade-3`. Esta atividade acrescenta testes de aceitação específicos sem alterar definitivamente a regra de negócio.

## 1. Substituir it.todo por testes reais

**Observação da auditoria:** não havia ocorrências de `it.todo` em `tests/doacoes.test.js` na branch de origem `atividade-3`. Portanto, não foi possível substituir pendências inexistentes. Em vez disso, foram **criados 11 testes reais** em `tests/cancelamento-criterios.test.js`, identificados por critério de aceite e por cenário adicional.

| Critério | Teste(s) implementado(s) |
|---|---|
| CA1 — Apenas reserva aceita e ativa pode ser cancelada | `CA1: cancela uma reserva aceita e ativa` |
| CA2 — Apenas a ONG responsável pode cancelar | `CA2: recusa ONG diferente e preserva a reserva original` |
| CA3 — Doação não coletada e dentro da validade | `CA3: impede cancelar uma doação já coletada`; `CA3: impede cancelar uma doação vencida` |
| CA4 — Retorna a disponível e apaga identificação/hora da reserva | `CA4: limpa ong e aceita_em ao liberar a doação` |
| CA5 — Proíbe cancelamento repetido e ID inexistente | `CA5: não permite cancelar duas vezes`; `CA5: recusa doação inexistente` |
| CA6 — Outra ONG pode aceitar a doação liberada | `CA6: outra ONG consegue aceitar após o cancelamento` |
| CA7 — Atualização condicional evita cancelamentos concorrentes | `CA7: duas requisições concorrentes geram um único cancelamento` |

## 2. Dois casos extras não previstos nos critérios originais

1. **EXTRA 1 — ONG com espaços nas extremidades:** `'  ONG Esperança  '` deve ser normalizado e aceito se representar a ONG correta. Resultado esperado: HTTP 200 e status `disponivel`.
2. **EXTRA 2 — Identificador não numérico:** requisição para `/api/doacoes/id-invalido/cancelar` deve falhar com HTTP 400 e **não** modificar a reserva existente.

## 3. Experimento de inversão de regra (mutação controlada)

**Regra escolhida:** apenas a ONG responsável pode cancelar a reserva.

No método `cancelarReserva` de `src/repositorio.js`, a condição SQL foi alterada **temporariamente**:

```diff
- AND ong = $2
+ AND ong <> $2
```

Isto permitia o cancelamento pela ONG errada e bloqueava a ONG correta. A mutação foi realizada apenas na branch de testes, **nunca** na branch `atividade-3`.

| Execução | Testes verdes | Testes falhos | Situação |
|---|---:|---:|---|
| Regra correta, antes da mutação | 45 | 0 | CI verde |
| Regra invertida | **33** | **12** | CI vermelho — erro detectado |
| Regra correta, após restaurar | **45** | **0** | **CI verde** |

**Evidências verificáveis:**

- [CI antes da inversão — 45 testes passaram](https://github.com/rique1011/prato-cheio/actions/runs/41942232156)
- [CI com regra invertida — 33 passaram e 12 falharam](https://github.com/rique1011/prato-cheio/actions/runs/41942273502)
- [CI após restauração — 45 testes passaram](https://github.com/rique1011/prato-cheio/actions/runs/41942418843)
- [CI com a documentação incluída — 45 testes passaram](https://github.com/rique1011/prato-cheio/actions/runs/41942478708)
- Commit da mutação temporária: `c27da3560970492ecb8bc150a09ea181b0ba35c9`.
- Commit de restauração: `ada070283f90057709b26fc4debedc448cfd9d35`.

**Interpretação:** os 12 testes falhos demonstram que a suíte detectou a inversão da autorização. Os outros 33 continuaram verdes por exercitarem regras não afetadas diretamente. O código original foi restaurado, mantendo `AND ong = $2`.

## 4. Validação e integração

O workflow `.github/workflows/ci.yml` testa com Node.js 22, PostgreSQL 17 e banco de testes isolado. A entrega deve ser concluída após **CI final verde** e revisão do PR por outro integrante.

**Pull Request:** [#14 — Atividade 2: testes e mutação controlada](https://github.com/rique1011/prato-cheio/pull/14).

## 5. Uso de IA

IA auxiliou na elaboração dos casos de teste, organização dos critérios, experimento de mutação e documentação. A implementação foi adaptada à API Express, PostgreSQL, Supertest e Vitest do próprio Prato Cheio. Os resultados acima foram obtidos do GitHub Actions, não estimados.
