import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { encerrar, limparBanco, migrar, query } from '../src/db.js';

const app = criarApp();

describe('regressão: comportamento protegido antes das refatorações', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  async function publicar(tipo = 'Arroz') {
    const resposta = await request(app)
      .post('/api/doacoes')
      .send({ tipo, quantidade: '10 kg', validade: '2099-12-31' });
    expect(resposta.status).toBe(201);
    return resposta.body.id;
  }

  async function reservar(id, ong = 'ONG Esperança') {
    const resposta = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong });
    expect(resposta.status).toBe(200);
    return resposta.body;
  }

  it('mantém respostas 400 e mensagens de erro nas rotas', async () => {
    const criar = await request(app).post('/api/doacoes')
      .send({ tipo: 'Arroz', quantidade: '5 kg', validade: '2020-01-01' });
    expect(criar.status).toBe(400);
    expect(criar.body.erro).toBe('Validade deve ser uma data futura.');

    const aceitar = await request(app)
      .post('/api/doacoes/99999/aceitar').send({ ong: 'ONG Esperança' });
    expect(aceitar.status).toBe(400);
    expect(aceitar.body.erro).toBe('Doação já foi aceita por outra ONG ou não existe.');

    const coletar = await request(app)
      .post('/api/doacoes/99999/coletar').send({ ong: 'ONG Esperança' });
    expect(coletar.status).toBe(400);
    expect(coletar.body.erro).toBe('Doação não encontrada.');

    const cancelar = await request(app)
      .post('/api/doacoes/99999/cancelar').send({ ong: 'ONG Esperança' });
    expect(cancelar.status).toBe(400);
    expect(cancelar.body.erro).toBe(
      'Reserva não encontrada, expirada ou não pertence à ONG informada.'
    );
  });

  it('preserva o comportamento existente de aceite sem nome de ONG', async () => {
    const id = await publicar();
    const resposta = await request(app)
      .post(`/api/doacoes/${id}/aceitar`).send({});
    expect(resposta.status).toBe(200);
    expect(resposta.body.ong).toBe('ONG');
  });

  it('aceita nome da ONG com espaços ao coletar e cancelar', async () => {
    const idColeta = await publicar('Sopa');
    await reservar(idColeta);
    const coleta = await request(app)
      .post(`/api/doacoes/${idColeta}/coletar`)
      .send({ ong: '  ONG Esperança  ' });
    expect(coleta.status).toBe(200);
    expect(coleta.body).toMatchObject({ id: idColeta, status: 'coletada' });

    const idCancelamento = await publicar('Feijão');
    await reservar(idCancelamento);
    const cancelamento = await request(app)
      .post(`/api/doacoes/${idCancelamento}/cancelar`)
      .send({ ong: '  ONG Esperança  ' });
    expect(cancelamento.status).toBe(200);
    expect(cancelamento.body).toMatchObject({
      id: idCancelamento, status: 'disponivel', ong: null
    });
  });

  it('recusa nome vazio em coleta e cancelamento sem alterar a reserva', async () => {
    const id = await publicar();
    await reservar(id);

    const coleta = await request(app)
      .post(`/api/doacoes/${id}/coletar`).send({ ong: '   ' });
    const cancelamento = await request(app)
      .post(`/api/doacoes/${id}/cancelar`).send({ ong: '   ' });

    expect(coleta.status).toBe(400);
    expect(cancelamento.status).toBe(400);
    expect(coleta.body.erro).toBe('Informe o nome da ONG.');
    expect(cancelamento.body.erro).toBe('Informe o nome da ONG.');

    const { rows } = await query('SELECT status, ong FROM doacoes WHERE id = $1', [id]);
    expect(rows[0]).toEqual({ status: 'aceita', ong: 'ONG Esperança' });
  });

  it('reserva com prazo expirado não pode ser coletada nem cancelada', async () => {
    const idColeta = await publicar('Leite');
    const idCancelamento = await publicar('Frutas');
    await reservar(idColeta);
    await reservar(idCancelamento);
    await query(
      "UPDATE doacoes SET aceita_em = NOW() - INTERVAL '3 hours' WHERE id IN ($1, $2)",
      [idColeta, idCancelamento]
    );

    const coleta = await request(app)
      .post(`/api/doacoes/${idColeta}/coletar`)
      .send({ ong: 'ONG Esperança' });
    const cancelamento = await request(app)
      .post(`/api/doacoes/${idCancelamento}/cancelar`)
      .send({ ong: 'ONG Esperança' });

    expect(coleta.status).toBe(400);
    expect(cancelamento.status).toBe(400);
    const { rows } = await query(
      'SELECT id, status, ong FROM doacoes ORDER BY id'
    );
    expect(rows).toEqual([
      { id: idColeta, status: 'aceita', ong: 'ONG Esperança' },
      { id: idCancelamento, status: 'aceita', ong: 'ONG Esperança' }
    ]);
  });

  it('doação vencida não pode ser coletada nem cancelada', async () => {
    const idColeta = await publicar('Leite');
    const idCancelamento = await publicar('Frutas');
    await reservar(idColeta);
    await reservar(idCancelamento);
    await query(
      'UPDATE doacoes SET validade = CURRENT_DATE - 1 WHERE id IN ($1, $2)',
      [idColeta, idCancelamento]
    );

    const coleta = await request(app)
      .post(`/api/doacoes/${idColeta}/coletar`)
      .send({ ong: 'ONG Esperança' });
    const cancelamento = await request(app)
      .post(`/api/doacoes/${idCancelamento}/cancelar`)
      .send({ ong: 'ONG Esperança' });

    expect(coleta.status).toBe(400);
    expect(cancelamento.status).toBe(400);
  });

  it('cada operação retorna a doação certa sem afetar outras doações', async () => {
    const idA = await publicar('A');
    const idB = await publicar('B');
    const aceiteB = await reservar(idB, 'ONG B');
    const aceiteA = await reservar(idA, 'ONG A');

    expect(aceiteA.id).toBe(idA);
    expect(aceiteB.id).toBe(idB);

    const coletaA = await request(app)
      .post(`/api/doacoes/${idA}/coletar`).send({ ong: 'ONG A' });
    const cancelamentoB = await request(app)
      .post(`/api/doacoes/${idB}/cancelar`).send({ ong: 'ONG B' });

    expect(coletaA.status).toBe(200);
    expect(coletaA.body).toMatchObject({ id: idA, status: 'coletada', ong: 'ONG A' });
    expect(cancelamentoB.status).toBe(200);
    expect(cancelamentoB.body).toMatchObject({ id: idB, status: 'disponivel', ong: null });
  });
});
