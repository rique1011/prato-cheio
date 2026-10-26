// Conexão com o banco.
//
// UNIDADE 1: SQLite, embutido no Node (módulo `node:sqlite`).
// UNIDADE 3: migrado para PostgreSQL com o driver `pg` (ver docs/adr/0001).
//            A interface (`query` devolvendo `{ rows }`) foi mantida, então a
//            troca ficou contida aqui e nas consultas de repositorio.js.
import pg from 'pg';

// Por padrão o `pg` converte DATE em objeto Date do JavaScript, que vira
// "2099-12-31T03:00:00.000Z" no JSON (fuso de Brasília). Mantemos como texto
// "2099-12-31", igual ao que a interface envia e exibe.
const TIPO_DATE = 1082;
pg.types.setTypeParser(TIPO_DATE, (valor) => valor);

let pool;

export function conexao() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não definida. Copie .env.example para .env e preencha a senha.');
    }
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

/**
 * Executa uma consulta e devolve { rows }.
 * Use $1, $2, ... como marcadores de parâmetro (evita injeção de SQL):
 *   query('SELECT * FROM doacoes WHERE id = $1', [id])
 */
export async function query(sql, valores = []) {
  const resultado = await conexao().query(sql, valores);
  return { rows: resultado.rows, alteradas: resultado.rowCount };
}

/** Cria o schema, se ainda não existir. Rodado por `npm run db:migrar` e ao subir o servidor. */
export async function migrar() {
  await query(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      tipo         TEXT NOT NULL,
      quantidade   TEXT NOT NULL,
      validade     DATE NOT NULL,
      status       TEXT NOT NULL DEFAULT 'disponivel'
                   CHECK (status IN ('disponivel', 'aceita', 'coletada')),
      ong          TEXT,
      criada_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
      aceita_em    TIMESTAMPTZ,
      coletada_em  TIMESTAMPTZ
    )
  `);
}

/** Apaga todos os dados e reinicia os ids. Usado pelos testes. */
export async function limparBanco() {
  await query('TRUNCATE doacoes RESTART IDENTITY');
}

export async function encerrar() {
  if (pool) { await pool.end(); pool = undefined; }
}
