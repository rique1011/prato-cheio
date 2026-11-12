import { query } from './db.js';

// Refatoração 3: um só predicado para as operações sobre reservas ativas.
const CONDICAO_RESERVA_ATIVA = `
      AND aceita_em IS NOT NULL
      AND aceita_em > NOW() - INTERVAL '2 hours'
      AND validade >= CURRENT_DATE`;

// Refatoração 4: eliminar repetição ao retornar a primeira linha de consultas.
async function primeiraLinha(sql, parametros = []) {
  const { rows } = await query(sql, parametros);
  return rows[0];
}

// CADASTRAR UMA NOVA DOAÇÃO
export async function inserir({ tipo, quantidade, validade }) {
  return await primeiraLinha(
    `
    INSERT INTO doacoes (tipo, quantidade, validade, status)
    VALUES ($1, $2, $3, 'disponivel')
    RETURNING *
    `,
    [tipo, quantidade, validade]
  );
}

// LISTAR DOAÇÕES DISPONÍVEIS
export async function listarDisponiveis() {
  const { rows } = await query(
    `
    SELECT *
    FROM doacoes
    WHERE status = 'disponivel'
      AND validade >= CURRENT_DATE
    ORDER BY id
    `
  );

  return rows;
}

// ACEITAR UMA DOAÇÃO
export async function aceitar(id, ong) {
  // Libera reservas expiradas antes de tentar um novo aceite.
  await liberarReservasExpiradas();

  return await primeiraLinha(
    `
    UPDATE doacoes
    SET
      status = 'aceita',
      ong = $1,
      aceita_em = NOW()
    WHERE id = $2
      AND status = 'disponivel'
      AND validade >= CURRENT_DATE
    RETURNING *
    `,
    [ong, id]
  );
}

// CONFIRMAR A COLETA DE UMA DOAÇÃO
export async function coletar(id, ong) {
  return await primeiraLinha(
    `
    UPDATE doacoes
    SET
      status = 'coletada',
      coletada_em = NOW()
    WHERE id = $1
      AND status = 'aceita'
      AND ong = $2
      ${CONDICAO_RESERVA_ATIVA}
    RETURNING *
    `,
    [id, ong]
  );
}

// BUSCAR UMA DOAÇÃO PELO ID
export async function buscarPorId(id) {
  return await primeiraLinha(
    `
    SELECT *
    FROM doacoes
    WHERE id = $1
    `,
    [id]
  );
}

// EXPIRAÇÃO AUTOMÁTICA DE RESERVAS — KAUÃ
export async function liberarReservasExpiradas() {
  const { rows } = await query(
    `
    UPDATE doacoes
    SET
      status = 'disponivel',
      ong = NULL,
      aceita_em = NULL
    WHERE status = 'aceita'
      AND aceita_em IS NOT NULL
      AND aceita_em <= NOW() - INTERVAL '2 hours'
      AND validade >= CURRENT_DATE
    RETURNING *
    `
  );

  return rows;
}

// CANCELAR RESERVA ATIVA (ATÔMICO)
export async function cancelarReserva(id, ong) {
  return await primeiraLinha(
    `
    UPDATE doacoes
    SET
      status = 'disponivel',
      ong = NULL,
      aceita_em = NULL
    WHERE id = $1
      AND status = 'aceita'
      AND ong = $2
      ${CONDICAO_RESERVA_ATIVA}
    RETURNING *
    `,
    [id, ong]
  );
}
