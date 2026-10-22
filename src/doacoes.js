import * as repo from './repositorio.js';

export async function criarDoacao({ tipo, quantidade, validade }) {
  const dataValidade = new Date(validade);
  if (isNaN(dataValidade.getTime()) || dataValidade <= new Date()) {
    throw new Error('Validade deve ser uma data futura.');
  }

  return await repo.inserir({ tipo, quantidade, validade });
}

export async function listarDisponiveis() {
  return await repo.listarDisponiveis();
}

export async function aceitar(id, ong) {
  const doacao = await repo.aceitar(id, ong);
  
  // Se o banco não atualizou nada (pois já foi aceita por outra ONG), lança um erro!
  if (!doacao) {
    throw new Error('Doação já foi aceita por outra ONG ou não existe.');
  }

  return doacao;
}