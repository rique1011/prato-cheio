import { query } from './db.js';

// Marcadores de parâmetro do PostgreSQL: $1, $2, ... (posição no array de valores).

export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    "INSERT INTO doacoes (tipo, quantidade, validade, status) VALUES ($1, $2, $3, 'disponivel') RETURNING *",
    [tipo, quantidade, validade]
  );
  return rows[0];
}

export async function listarDisponiveis() {
  // Sem ORDER BY o PostgreSQL não garante ordem nenhuma; mantemos a ordem de cadastro.
  const { rows } = await query("SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY id");
  return rows;
}

export async function aceitar(id, ong) {
  // Só atualiza se o status AINDA for 'disponivel'
  const { rows } = await query(
    "UPDATE doacoes SET status = 'aceita', ong = $1 WHERE id = $2 AND status = 'disponivel' RETURNING *",
    [ong, id]
  );
  return rows[0]; // Retorna undefined se já não estiver mais disponível
}

export async function coletar(id, ong) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'coletada' WHERE id = $1 AND status = 'aceita' AND ong = $2 RETURNING *",
    [id, ong]
  );

  return rows[0];
}

export async function buscarPorId(id) {
  const { rows } = await query("SELECT * FROM doacoes WHERE id = $1", [id]);
  return rows[0];
}
