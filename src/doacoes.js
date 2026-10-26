import * as repo from './repositorio.js';

// ==================================================
// CADASTRAR UMA NOVA DOAÇÃO
// ==================================================

export async function criarDoacao({ tipo, quantidade, validade }) {
  const dataValidade = new Date(validade);

  if (isNaN(dataValidade.getTime()) || dataValidade <= new Date()) {
    throw new Error('Validade deve ser uma data futura.');
  }

  return await repo.inserir({ tipo, quantidade, validade });
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

export async function aceitar(id, ong) {
  const doacao = await repo.aceitar(id, ong);

  if (!doacao) {
    throw new Error('Doação já foi aceita por outra ONG ou não existe.');
  }

  return doacao;
}

// ==================================================
// CONFIRMAR A COLETA DE UMA DOAÇÃO
// ==================================================

export async function coletar(id, ong) {

  // Verifica se a ONG foi informada
  if (typeof ong !== 'string' || !ong.trim()) {
    throw new Error('Informe o nome da ONG.');
  }

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
  if (doacao.ong !== ong.trim()) {
    throw new Error(
      'Apenas a ONG que aceitou a doação pode confirmar a coleta.'
    );
  }

  // Confirma a coleta no banco de dados
  const doacaoColetada = await repo.coletar(id, ong.trim());

  // Verifica se a atualização foi realizada
  if (!doacaoColetada) {
    throw new Error('Não foi possível confirmar a coleta.');
  }

  return doacaoColetada;
}