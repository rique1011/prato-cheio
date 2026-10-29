// Os testes rodam no banco PostgreSQL ISOLADO (DATABASE_URL_TESTE), nunca no de
// desenvolvimento: limparBanco() apaga todos os dados antes de cada teste.
try {
  process.loadEnvFile('.env');
} catch {
  // Sem .env (ex.: no CI): as variáveis já vêm do ambiente.
}

const urlTeste = process.env.DATABASE_URL_TESTE;

if (!urlTeste) {
  throw new Error('DATABASE_URL_TESTE não definida. Copie .env.example para .env e preencha a senha.');
}
if (urlTeste === process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_TESTE precisa apontar para um banco diferente do de desenvolvimento.');
}

export default {
  test: {
    // O código da aplicação só conhece DATABASE_URL; nos testes ela aponta para o banco de testes.
    env: { DATABASE_URL: urlTeste },
    // Todos os arquivos de teste usam o mesmo banco: em paralelo, um apagaria os dados do outro.
    fileParallelism: false
  }
};
