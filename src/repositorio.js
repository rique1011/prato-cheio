import { query } from './db.js';

// Refatoração 3: evita divergência entre os critérios de coleta e cancelamento.
// O fragmento conserva exatamente as mesmas condições SQL, inclusive o limite de 2h.
const CONDICAO_RESERVA_ATIVA = `
      ${CONDICAO_RESERVA_ATIVA}`;


// ==================================================
// CADASTRAR UMA NOVA DOAÇÃO
// ==================================================

export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    `
    INSERT INTO doacoes (tipo, quantidade, validade, status)
    VALUES ($1, $2, $3, 'disponivel')
    RETURNING *
    `,
    [tipo, quantidade, validade]
  );

  return rows[0];
}

// ==================================================
// LISTAR DOAÇÕES DISPONÍVEIS
// ==================================================

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

// ==================================================
// ACEITAR UMA DOAÇÃO
// ==================================================

export async function aceitar(id, ong) {

  // Libera reservas expiradas antes de tentar um novo aceite
  await liberarReservasExpiradas();

  const { rows } = await query(
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

  return rows[0];
}

// ==================================================
// CONFIRMAR A COLETA DE UMA DOAÇÃO
// ==================================================

export async function coletar(id, ong) {
  const { rows } = await query(
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

  return rows[0];
}

// ==================================================
// BUSCAR UMA DOAÇÃO PELO ID
// ==================================================

export async function buscarPorId(id) {
  const { rows } = await query(
    `
    SELECT *
    FROM doacoes
    WHERE id = $1
    `,
    [id]
  );

  return rows[0];
}

// ==================================================
// EXPIRAÇÃO AUTOMÁTICA DE RESERVAS - KAUÃ
// ==================================================

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
// ==================================================
// CANCELAR RESERVA ATIVA (ATÔMICO)
// ==================================================

export async function cancelarReserva(id, ong) {
  const { rows } = await query(
    `
    UPDATE doacoes
    SET status = 'disponivel',
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

  return rows[0];
}
