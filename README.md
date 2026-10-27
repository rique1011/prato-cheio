# Prato Cheio

Projeto da disciplina — Análise, Projeto e Desenvolvimento Ágil.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Henrique Cordeiro de Oliveira – @rique1011
- Kauã Henrique Lucindo – @lucind0
- Nicholas Scoz dos Santos – @nicholasscoz
- Guilherme Pietro Ruiz Costa - @GuiPRC

## Como rodar

Requisito: **Node.js 22.13 ou superior**. Mais nada — o banco da Unidade 1 é SQLite, 
embutido no próprio Node.

> Esta é a **stack preferencial** da disciplina. Se o seu grupo optar por outra, registre 
o ADR de justificativa e garanta os mesmos compromissos: repositório público com CI 
verde, rota de saúde, testes por um comando, os três comandos documentados aqui no README 
e banco relacional migrado para PostgreSQL na Unidade 3.

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Rodar os testes automatizados
npm test

# 3. Executar o servidor
npm start
