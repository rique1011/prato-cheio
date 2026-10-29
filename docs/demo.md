# Guia de Execução e Demonstração — Prato Cheio

## 1. Objetivo

Este documento apresenta os procedimentos necessários
para executar o sistema Prato Cheio e verificar as
funcionalidades desenvolvidas na Atividade Avaliativa 2 (N2).

## 2. Requisitos

- Node.js 22.13 ou superior.
- PostgreSQL configurado.
- Dependências do projeto instaladas.
- Bancos de desenvolvimento e testes separados.
- Variáveis de ambiente configuradas.

## 3. Preparação do ambiente

Instalar as dependências:

```bash
npm install
```

Preparar o banco de dados:

```bash
npm run db:migrar
```

Executar a aplicação:

```bash
npm start
```

Acessar no navegador:

http://localhost:3000

## 4. Cadastro de doações

Na interface principal:

1. Informar o tipo de alimento.
2. Informar a quantidade.
3. Selecionar uma validade futura.
4. Clicar em "Publicar doação".

Resultado esperado:

A doação deverá ser cadastrada e exibida
na lista de doações disponíveis.

## 5. Aceite de doações

Para aceitar uma doação:

1. Localizar uma doação disponível.
2. Informar o nome da ONG.
3. Clicar em "Aceitar doação".

Resultado esperado:

A doação deverá passar para o status "aceita"
e deixar de aparecer na lista de disponíveis.

## 6. Confirmação de coleta

A confirmação de coleta é disponibilizada
por meio da API.

### Endpoint

POST /api/doacoes/:id/coletar

### Exemplo de requisição

```json
{
  "ong": "ONG Esperança"
}
```

O identificador deve corresponder a uma
doação previamente aceita pela ONG informada.

### Resultado esperado

Uma confirmação válida retorna HTTP 200
e altera o status da doação para "coletada".

Uma segunda tentativa de confirmação
deve ser recusada.

A confirmação também deverá ser recusada
quando a doação não existir, não estiver
aceita ou estiver vinculada a outra ONG.

## 7. Expiração de reservas

As reservas possuem prazo de duas horas,
contado a partir do aceite.

Quando esse prazo é atingido, a doação
pode voltar a ficar disponível,
desde que sua validade permita.

A verificação da expiração ocorre
durante operações do sistema.

Os cenários de expiração são validados
por testes automatizados que simulam
diferentes horários de aceite.

## 8. Testes automatizados

Para executar os testes:

```bash
npm test
```

Os testes utilizam um banco PostgreSQL
separado do ambiente de desenvolvimento.

O banco de testes é limpo durante a execução.
Não deve conter dados que precisem ser preservados.

### Resultado registrado

Na execução realizada em 27/10/2026:

- 24 testes executados.
- 24 testes aprovados.
- Nenhuma falha.

A suíte deverá ser executada novamente
na versão definitiva da branch entrega-2.

## 9. Documentação complementar

As informações técnicas estão disponíveis em:

- docs/projeto.md
- docs/validacao.md
- docs/adr/0001-migracao-para-postgresql.md
- docs/adr/0002-expiracao-sob-demanda.md
- docs/retrospectivas/2.md

## 10. Limitações conhecidas

- Não existe autenticação real de ONGs.
- A identificação da ONG utiliza o nome informado.
- A confirmação de coleta está disponível pela API.
- A expiração de reservas ocorre sob demanda.
- Não existe integração com Redis.

## 11. Repositório

https://github.com/rique1011/prato-cheio

Branch de entrega: entrega-2