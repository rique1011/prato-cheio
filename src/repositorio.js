import { query } from './db.js';

export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    "INSERT INTO doacoes (tipo, quantidade, validade, status) VALUES (?, ?, ?, 'disponivel') RETURNING *",
    [tipo, quantidade, validade]
  );
  return rows[0];
}

export async function listarDisponiveis() {
  const { rows } = await query("SELECT * FROM doacoes WHERE status = 'disponivel'");
  return rows;
}

export async function aceitar(id, ong) {
  // Só atualiza se o status AINDA for 'disponivel'
  const { rows } = await query(
    "UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel' RETURNING *",
    [ong, id]
  );
  return rows[0]; // Retorna undefined se já não estiver mais disponível
}

export async function buscarPorId(id) {
  const { rows } = await query("SELECT * FROM doacoes WHERE id = ?", [id]);
  return rows[0];
}