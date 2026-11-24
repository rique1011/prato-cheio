import * as repo from './repositorio.js';

// Refatoração 2: validação e normalização reutilizadas nas duas operações da ONG.
function normalizarOng(ong) {
  if (typeof ong !== 'string' || !ong.trim()) {
    throw new Error('Informe o nome da ONG.');
  }
  return ong.trim();
}



// ==================================================
// CADASTRAR UMA NOVA DOAÇÃO
// ==================================================

export async function criarDoacao({ tipo, quantidade, validade } = {}) {
  const nome = typeof tipo === 'string' ? tipo.trim() : '';
  const volume = typeof quantidade === 'string' ? quantidade.trim()
    : typeof quantidade === 'number' && Number.isFinite(quantidade) ? String(quantidade) : '';

  if (!nome || !volume || nome.includes('\0') || volume.includes('\0')) {
    throw new Error('Informe o tipo e a quantidade da doação.');
  }

  const dataValidade = typeof validade === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(validade)
    ? new Date(validade + 'T00:00:00Z') : new Date(NaN);
  if (isNaN(dataValidade.getTime()) ||
      dataValidade.toISOString().slice(0, 10) !== validade ||
      dataValidade <= new Date()) {
    throw new Error('Validade deve ser uma data futura.');
  }

  return await repo.inserir({ tipo: nome, quantidade: volume, validade });
}

// ==================================================
// LISTAR DOAÇÕES DISPONÍVEIS
// ==================================================

export async function listarDisponiveis() {

  // Verifica e libera as reservas que expiraram
  await repo.liberarReservasExpiradas();

  // Retorna as doações disponíveis
  return await repo.listarDisponiveis();
}

// ==================================================
// ACEITAR UMA DOAÇÃO
// ==================================================

export async function listarReservadas() {
  await repo.liberarReservasExpiradas();
  return await repo.listarReservadas();
}

export async function aceitar(id, ong) {
  const doacao = await repo.aceitar(id, normalizarOng(ong));

  if (!doacao) {
    throw new Error('Doação já foi aceita por outra ONG ou não existe.');
  }

  return doacao;
}

// ==================================================
// CONFIRMAR A COLETA DE UMA DOAÇÃO
// ==================================================

export async function coletar(id, ong) {
  const ongNormalizada = normalizarOng(ong);

  // Busca a doação pelo ID
  const doacao = await repo.buscarPorId(id);

  // Verifica se a doação existe
  if (!doacao) {
    throw new Error('Doação não encontrada.');
  }

  // Verifica se a doação foi aceita
  if (doacao.status !== 'aceita') {
    throw new Error('Somente doações aceitas podem ser coletadas.');
  }

  // Verifica se é a ONG responsável
  if (doacao.ong !== ongNormalizada) {
    throw new Error(
      'Apenas a ONG que aceitou a doação pode confirmar a coleta.'
    );
  }

  // Confirma a coleta no banco de dados
  const doacaoColetada = await repo.coletar(id, ongNormalizada);

  // Verifica se a atualização foi realizada
  if (!doacaoColetada) {
    throw new Error('Não foi possível confirmar a coleta.');
  }

  return doacaoColetada;
}
// ==================================================
// CANCELAR RESERVA DE UMA DOAÇÃO
// ==================================================

export async function cancelarReserva(id, ong) {
  const ongNormalizada = normalizarOng(ong);

  // A validação de status, titularidade, prazo e validade é feita
  // numa única atualização condicional, evitando corrida entre requisições.
  const cancelada = await repo.cancelarReserva(id, ongNormalizada);
  if (!cancelada) {
    throw new Error('Reserva não encontrada, expirada ou não pertence à ONG informada.');
  }
  return cancelada;
}
