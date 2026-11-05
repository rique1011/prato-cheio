import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

const app = criarApp();

describe('Atividade 2: critérios de aceite do cancelamento de reserva', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  async function criarReserva(ong = 'ONG Esperança') {
    const criada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz', quantidade: '10 kg', validade: '2099-12-31' });
    expect(criada.status).toBe(201);

    const id = criada.body.id;
    const aceita = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong });
    expect(aceita.status).toBe(200);

    return id;
  }

  const cancelar = (id, ong) =>
    request(app).post(`/api/doacoes/${id}/cancelar`).send({ ong });

  // CA1: apenas uma reserva ativa, ainda não coletada, pode ser cancelada.
  it('CA1: cancela uma reserva aceita e ativa', async () => {
    const id = await criarReserva();
    const resposta = await cancelar(id, 'ONG Esperança');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ id, status: 'disponivel', ong: null });
  });

  // CA2: a ONG que cancela deve ser a mesma que aceitou.
  it('CA2: recusa ONG diferente e preserva a reserva original', async () => {
    const id = await criarReserva();
    const resposta = await cancelar(id, 'ONG Invasora');

    expect(resposta.status).toBe(400);
    const { rows } = await query(
      'SELECT status, ong FROM doacoes WHERE id = $1',
      [id]
    );
    expect(rows[0]).toEqual({ status: 'aceita', ong: 'ONG Esperança' });
  });

  // CA3: doação dentro da validade, não coletada.
  it('CA3: impede cancelar uma doação já coletada', async () => {
    const id = await criarReserva();
    const coleta = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ ong: 'ONG Esperança' });
    expect(coleta.status).toBe(200);

    const resposta = await cancelar(id, 'ONG Esperança');
    expect(resposta.status).toBe(400);

    const { rows } = await query('SELECT status FROM doacoes WHERE id = $1', [id]);
    expect(rows[0].status).toBe('coletada');
  });

  it('CA3: impede cancelar uma doação vencida', async () => {
    const id = await criarReserva();
    await query('UPDATE doacoes SET validade = CURRENT_DATE - 1 WHERE id = $1', [id]);

    const resposta = await cancelar(id, 'ONG Esperança');
    expect(resposta.status).toBe(400);
  });

  // CA4: retorno a disponível e limpeza dos dados de reserva.
  it('CA4: limpa ong e aceita_em ao liberar a doação', async () => {
    const id = await criarReserva();
    const resposta = await cancelar(id, 'ONG Esperança');

    expect(resposta.status).toBe(200);
    const { rows } = await query(
      'SELECT status, ong, aceita_em FROM doacoes WHERE id = $1',
      [id]
    );
    expect(rows[0]).toMatchObject({
      status: 'disponivel', ong: null, aceita_em: null
    });
  });

  // CA5: recusar duplicação e ID não existente.
  it('CA5: não permite cancelar duas vezes', async () => {
    const id = await criarReserva();
    expect((await cancelar(id, 'ONG Esperança')).status).toBe(200);
    expect((await cancelar(id, 'ONG Esperança')).status).toBe(400);
  });

  it('CA5: recusa doação inexistente', async () => {
    const resposta = await cancelar(999999, 'ONG Esperança');
    expect(resposta.status).toBe(400);
  });

  // CA6: a doação liberada pode ser aceita por outra ONG.
  it('CA6: outra ONG consegue aceitar após o cancelamento', async () => {
    const id = await criarReserva();
    expect((await cancelar(id, 'ONG Esperança')).status).toBe(200);

    const aceita = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Nova' });
    expect(aceita.status).toBe(200);
    expect(aceita.body.ong).toBe('ONG Nova');
  });

  // CA7: concorrência resolvida na atualização SQL condicional.
  it('CA7: duas requisições concorrentes geram um único cancelamento', async () => {
    const id = await criarReserva();
    const respostas = await Promise.all([
      cancelar(id, 'ONG Esperança'),
      cancelar(id, 'ONG Esperança')
    ]);
    expect(respostas.map(r => r.status).sort((a, b) => a - b)).toEqual([200, 400]);
  });

  // Casos extras não descritos nos critérios originais.
  it('EXTRA 1: aceita o nome da ONG com espaços nas extremidades', async () => {
    const id = await criarReserva();
    const resposta = await cancelar(id, '  ONG Esperança  ');

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('disponivel');
  });

  it('EXTRA 2: recusa identificador não numérico sem alterar a reserva', async () => {
    const id = await criarReserva();
    const resposta = await cancelar('id-invalido', 'ONG Esperança');

    expect(resposta.status).toBe(400);
    const { rows } = await query(
      'SELECT status, ong FROM doacoes WHERE id = $1',
      [id]
    );
    expect(rows[0]).toEqual({ status: 'aceita', ong: 'ONG Esperança' });
  });
});
