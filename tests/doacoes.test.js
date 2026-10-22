import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('publicar e listar doações', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2099-12-31' });

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
      .send({ tipo: 'Frutas', quantidade: 10, validade: '2020-01-01' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });
});

describe('aceitar uma doação', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('marca a doação como aceita pela ONG', async () => {
    const doacaoCriada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão', quantidade: '20 pães', validade: '2099-12-31' });
    
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
      .send({ tipo: 'Frutas', quantidade: '5 kg', validade: '2099-12-31' });
    
    const id = doacaoCriada.body.id;

    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Vida' });

    const res = await request(app).get('/api/doacoes');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    // 1. Cria a doação
    const doacaoCriada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Leite', quantidade: '12 litros', validade: '2099-12-31' });
    
    const id = doacaoCriada.body.id;

    // 2. A primeira ONG aceita normalmente
    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'Primeira ONG' });

    // 3. A segunda ONG tenta aceitar a mesma doação
    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'Segunda ONG' });

    // 4. O sistema DEVE recusar com erro status 400
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });
});