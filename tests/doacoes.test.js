import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

const app = criarApp();

// ==================================================
// TESTES DE FUNCIONAMENTO DA APLICAÇÃO
// ==================================================

describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ==================================================
// TESTES DE CADASTRO E LISTAGEM
// ==================================================

describe('publicar e listar doações', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Sopa',
        quantidade: '10 porções',
        validade: '2099-12-31'
      });

    const res = await request(app).get('/api/doacoes');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });

  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  it('recusa doação com validade no passado', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Frutas',
        quantidade: 10,
        validade: '2020-01-01'
      });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });
});

// ==================================================
// TESTES DE ACEITE
// ==================================================

describe('aceitar uma doação', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  it('marca a doação como aceita pela ONG', async () => {
    const doacaoCriada = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Pão',
        quantidade: '20 pães',
        validade: '2099-12-31'
      });

    const id = doacaoCriada.body.id;

    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Esperança');
  });

  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const doacaoCriada = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Frutas',
        quantidade: '5 kg',
        validade: '2099-12-31'
      });

    const id = doacaoCriada.body.id;

    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Vida' });

    const res = await request(app).get('/api/doacoes');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const doacaoCriada = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Leite',
        quantidade: '12 litros',
        validade: '2099-12-31'
      });

    const id = doacaoCriada.body.id;

    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'Primeira ONG' });

    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'Segunda ONG' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });
});

// ==================================================
// TESTES DE CONFIRMAÇÃO DE COLETA - HENRIQUE
// ==================================================

describe('confirmar a coleta de uma doação', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  // Função auxiliar para criar uma doação nos testes
  async function criarDoacaoTeste() {
    const res = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Arroz',
        quantidade: '10 kg',
        validade: '2099-12-31'
      });

    expect(res.status).toBe(201);

    return res.body.id;
  }

  // Função auxiliar para aceitar uma doação nos testes
  async function aceitarDoacaoTeste(id, ong = 'ONG Esperança') {
    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong });

    expect(res.status).toBe(200);
  }

  // TESTE 1 - COLETA COM SUCESSO
  it('confirma a coleta de uma doação aceita pela ONG correta', async () => {
    const id = await criarDoacaoTeste();

    await aceitarDoacaoTeste(id);

    const res = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('coletada');
    expect(res.body.ong).toBe('ONG Esperança');
  });

  // TESTE 2 - DOAÇÃO AINDA NÃO ACEITA
  it('recusa a coleta de uma doação ainda disponível', async () => {
    const id = await criarDoacaoTeste();

    const res = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('Somente doações aceitas');
  });

  // TESTE 3 - COLETA REPETIDA
  it('recusa confirmar a mesma coleta duas vezes', async () => {
    const id = await criarDoacaoTeste();

    await aceitarDoacaoTeste(id);

    const primeiraColeta = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ ong: 'ONG Esperança' });

    expect(primeiraColeta.status).toBe(200);

    const segundaColeta = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ ong: 'ONG Esperança' });

    expect(segundaColeta.status).toBe(400);
    expect(segundaColeta.body.erro).toContain('Somente doações aceitas');
  });

  // TESTE 4 - ID INEXISTENTE
  it('recusa confirmar a coleta de uma doação inexistente', async () => {
    const res = await request(app)
      .post('/api/doacoes/999999/coletar')
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Doação não encontrada.');
  });

  // TESTE 5 - ONG DIFERENTE
  it('recusa a coleta por uma ONG diferente da registrada', async () => {
    const id = await criarDoacaoTeste();

    await aceitarDoacaoTeste(id, 'ONG Esperança');

    const res = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ ong: 'ONG Diferente' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toContain('Apenas a ONG que aceitou');
  });
});


// ==================================================
// TESTES DO BANCO POSTGRESQL - NICHOLAS
// ==================================================

describe('banco PostgreSQL', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  // Função auxiliar para criar uma doação nos testes
  async function criarDoacaoTeste() {
    const res = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Feijão',
        quantidade: '5 kg',
        validade: '2099-12-31'
      });

    expect(res.status).toBe(201);

    return res.body;
  }

  // TESTE 1 - CONCORRÊNCIA NO ACEITE
  it('aceita a doação uma única vez quando duas ONGs aceitam ao mesmo tempo', async () => {
    const { id } = await criarDoacaoTeste();

    // As duas requisições saem juntas, cada uma em uma conexão do pool
    const respostas = await Promise.all([
      request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG A' }),
      request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG B' })
    ]);

    const codigos = respostas.map((res) => res.status).sort();

    expect(codigos).toEqual([200, 400]);
  });

  // TESTE 2 - FORMATO DA VALIDADE (coluna DATE)
  it('devolve a validade no formato AAAA-MM-DD, sem horário', async () => {
    const doacao = await criarDoacaoTeste();

    expect(doacao.validade).toBe('2099-12-31');
  });

  // TESTE 3 - COLUNAS PREPARADAS PARA HORA DE ACEITE E DE COLETA
  it('cria a doação com aceita_em e coletada_em vazios', async () => {
    const doacao = await criarDoacaoTeste();

    expect(doacao).toHaveProperty('aceita_em', null);
    expect(doacao).toHaveProperty('coletada_em', null);
  });

  // TESTE 4 - REGRA DE STATUS GARANTIDA PELO BANCO (CHECK)
  it('o banco recusa um status fora do fluxo', async () => {
    const { id } = await criarDoacaoTeste();

    await expect(
      query("UPDATE doacoes SET status = 'aceito' WHERE id = $1", [id])
    ).rejects.toThrow();
  });
});

// ==================================================
// TESTES DE EXPIRAÇÃO DE RESERVAS - KAUÃ
// ==================================================

describe('expiração automática de reservas - Kauã', () => {

  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  // Cria uma doação e realiza o aceite
  async function criarDoacaoAceita(ong = 'ONG Esperança') {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Arroz',
        quantidade: '10 kg',
        validade: '2099-12-31'
      });

    expect(criacao.status).toBe(201);

    const id = criacao.body.id;

    const aceite = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong });

    expect(aceite.status).toBe(200);

    return { id, aceite: aceite.body };
  }

  // TESTE 1 - REGISTRO DO HORÁRIO DE ACEITE

  it('registra o horário quando a ONG aceita uma doação', async () => {
    const { aceite } = await criarDoacaoAceita();

    expect(aceite.status).toBe('aceita');
    expect(aceite.aceita_em).toBeTruthy();
  });

  // TESTE 2 - RESERVA COM MENOS DE DUAS HORAS

  it('mantém a reserva ativa antes de completar duas horas', async () => {
    const { id } = await criarDoacaoAceita();

    await query(
      `
      UPDATE doacoes
      SET aceita_em = NOW() - INTERVAL '119 minutes'
      WHERE id = $1
      `,
      [id]
    );

    const lista = await request(app).get('/api/doacoes');

    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(0);

    const { rows } = await query(
      'SELECT status FROM doacoes WHERE id = $1',
      [id]
    );

    expect(rows[0].status).toBe('aceita');
  });

  // TESTE 3 - LIMITE EXATO DE DUAS HORAS

  it('expira a reserva quando completa duas horas', async () => {
    const { id } = await criarDoacaoAceita();

    await query(
      `
      UPDATE doacoes
      SET aceita_em = NOW() - INTERVAL '2 hours'
      WHERE id = $1
      `,
      [id]
    );

    const lista = await request(app).get('/api/doacoes');

    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0].status).toBe('disponivel');
  });

  // TESTE 4 - RESERVA EXPIRADA

  it('libera uma reserva que ultrapassou duas horas', async () => {
    const { id } = await criarDoacaoAceita();

    await query(
      `
      UPDATE doacoes
      SET aceita_em = NOW() - INTERVAL '3 hours'
      WHERE id = $1
      `,
      [id]
    );

    const lista = await request(app).get('/api/doacoes');

    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);

    const doacao = lista.body[0];

    expect(doacao.id).toBe(id);
    expect(doacao.status).toBe('disponivel');
    expect(doacao.ong).toBeNull();
    expect(doacao.aceita_em).toBeNull();
  });

  // TESTE 5 - ALIMENTO VENCIDO

  it('não disponibiliza novamente uma doação vencida', async () => {
    const { id } = await criarDoacaoAceita();

    await query(
      `
      UPDATE doacoes
      SET
        aceita_em = NOW() - INTERVAL '3 hours',
        validade = CURRENT_DATE - 1
      WHERE id = $1
      `,
      [id]
    );

    const lista = await request(app).get('/api/doacoes');

    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(0);
  });

  // TESTE 6 - DOAÇÃO JÁ COLETADA

  it('não libera uma doação que já foi coletada', async () => {
    const { id } = await criarDoacaoAceita();

    const coleta = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ ong: 'ONG Esperança' });

    expect(coleta.status).toBe(200);
    expect(coleta.body.status).toBe('coletada');
    expect(coleta.body.coletada_em).toBeTruthy();

    // Simula um aceite antigo, mesmo após a coleta
    await query(
      `
      UPDATE doacoes
      SET aceita_em = NOW() - INTERVAL '3 hours'
      WHERE id = $1
      `,
      [id]
    );

    const lista = await request(app).get('/api/doacoes');

    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(0);

    const { rows } = await query(
      'SELECT status FROM doacoes WHERE id = $1',
      [id]
    );

    expect(rows[0].status).toBe('coletada');
  });

  // TESTE 7 - COLETA FORA DO PRAZO

  it('recusa a coleta quando a reserva ultrapassa duas horas', async () => {
    const { id } = await criarDoacaoAceita();

    await query(
      `
      UPDATE doacoes
      SET aceita_em = NOW() - INTERVAL '3 hours'
      WHERE id = $1
      `,
      [id]
    );

    const coleta = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ ong: 'ONG Esperança' });

    expect(coleta.status).toBe(400);
    expect(coleta.body.erro).toBeDefined();

    const { rows } = await query(
      'SELECT status FROM doacoes WHERE id = $1',
      [id]
    );

    expect(rows[0].status).not.toBe('coletada');
  });

  // TESTE 8 - ACEITE CONCORRENTE APÓS EXPIRAÇÃO

  it('permite apenas um novo aceite após a reserva expirar', async () => {
    const { id } = await criarDoacaoAceita('ONG Antiga');

    await query(
      `
      UPDATE doacoes
      SET aceita_em = NOW() - INTERVAL '3 hours'
      WHERE id = $1
      `,
      [id]
    );

    const respostas = await Promise.all([
      request(app)
        .post(`/api/doacoes/${id}/aceitar`)
        .send({ ong: 'ONG A' }),

      request(app)
        .post(`/api/doacoes/${id}/aceitar`)
        .send({ ong: 'ONG B' })
    ]);

    const codigos = respostas
      .map((res) => res.status)
      .sort((a, b) => a - b);

    expect(codigos).toEqual([200, 400]);

    const { rows } = await query(
      'SELECT status, ong FROM doacoes WHERE id = $1',
      [id]
    );

    expect(rows[0].status).toBe('aceita');
    expect(['ONG A', 'ONG B']).toContain(rows[0].ong);
  });

});