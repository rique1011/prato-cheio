import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

let servidor;
let origem;

beforeAll(async () => {
  await migrar();
  servidor = criarApp().listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    servidor.once('listening', resolve);
    servidor.once('error', reject);
  });
  origem = 'http://127.0.0.1:' + servidor.address().port;
});
beforeEach(async () => { await limparBanco(); });
afterAll(async () => {
  if (servidor) await new Promise(resolve => servidor.close(resolve));
  await encerrar();
});

async function api(path, dados) {
  const r = await fetch(origem + '/api' + path, dados === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  return { status: r.status, body: await r.json() };
}
async function publicar(tipo = 'Arroz') {
  const r = await api('/doacoes', { tipo, quantidade: '10 kg', validade: '2099-12-31' });
  expect(r.status).toBe(201);
  expect(r.body.status).toBe('disponivel');
  return r.body.id;
}
const acao = (id, acao, ong) => api('/doacoes/' + id + '/' + acao, { ong });
async function estado(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = $1', [id]);
  return rows[0];
}
async function ids(path) {
  const r = await api(path);
  expect(r.status).toBe(200);
  return r.body.map(d => d.id);
}

describe('N3: integração HTTP real + Express + PostgreSQL', () => {
  it('I1 — publica, lista, aceita e coleta; preserva a coleta no banco', async () => {
    const id = await publicar();
    expect(await ids('/doacoes')).toContain(id);
    const aceite = await acao(id, 'aceitar', 'ONG A');
    expect(aceite.status).toBe(200);
    expect(aceite.body.aceita_em).toBeTruthy();
    expect(await ids('/doacoes')).not.toContain(id);
    expect(await ids('/doacoes/reservadas')).toContain(id);
    const coleta = await acao(id, 'coletar', 'ONG A');
    expect(coleta.status).toBe(200);
    expect(await ids('/doacoes/reservadas')).not.toContain(id);
    expect(await ids('/doacoes')).not.toContain(id);
    const registro = await estado(id);
    expect(registro).toMatchObject({ status: 'coletada', ong: 'ONG A' });
    expect(registro.coletada_em).toBeTruthy();
    expect((await acao(id, 'coletar', 'ONG A')).status).toBe(400);
  });

  it('I2 — recusa ONG incorreta, cancela com a correta e permite novo aceite', async () => {
    const id = await publicar('Pães');
    expect((await acao(id, 'aceitar', 'ONG A')).status).toBe(200);
    expect((await acao(id, 'aceitar', 'ONG B')).status).toBe(400);
    expect((await acao(id, 'coletar', 'ONG B')).status).toBe(400);
    expect((await acao(id, 'cancelar', 'ONG B')).status).toBe(400);
    expect(await estado(id)).toMatchObject({ status: 'aceita', ong: 'ONG A' });
    expect((await acao(id, 'cancelar', 'ONG A')).status).toBe(200);
    expect(await estado(id)).toMatchObject({ status: 'disponivel', ong: null, aceita_em: null });
    expect(await ids('/doacoes')).toContain(id);
    expect((await acao(id, 'aceitar', 'ONG B')).status).toBe(200);
    expect((await acao(id, 'coletar', 'ONG B')).status).toBe(200);
    expect(await estado(id)).toMatchObject({ status: 'coletada', ong: 'ONG B' });
  });

  it('I3 — expira reserva, bloqueia coleta atrasada e permite novo aceite exclusivo', async () => {
    const id = await publicar('Frutas');
    expect((await acao(id, 'aceitar', 'ONG A')).status).toBe(200);
    await query("UPDATE doacoes SET aceita_em = NOW() - INTERVAL '3 hours' WHERE id = $1", [id]);
    expect((await acao(id, 'coletar', 'ONG A')).status).toBe(400);
    expect(await ids('/doacoes/reservadas')).not.toContain(id);
    expect(await ids('/doacoes')).toContain(id);
    const tentativas = await Promise.all([acao(id, 'aceitar', 'ONG B'), acao(id, 'aceitar', 'ONG C')]);
    expect(tentativas.map(r => r.status).sort()).toEqual([200, 400]);
    const vencedor = tentativas.find(r => r.status === 200).body.ong;
    expect(await estado(id)).toMatchObject({ status: 'aceita', ong: vencedor });
  });

  it('I4 — campos obrigatórios e datas inválidas são recusados sem persistir registros', async () => {
    const valida = { tipo: 'Arroz', quantidade: '1 kg', validade: '2099-12-31' };
    for (const dados of [
      { ...valida, tipo: '   ' },
      { ...valida, quantidade: '' },
      { ...valida, validade: undefined },
      { ...valida, validade: '2099-02-30' },
      { ...valida, validade: '2020-01-01' }
    ]) expect((await api('/doacoes', dados)).status).toBe(400);
    expect((await query('SELECT id FROM doacoes')).rows).toHaveLength(0);
  });

  it('I5 — listas excluem vencidas, aceitas e coletadas; reservas contêm só ativas', async () => {
    const disponivel = await publicar('Arroz');
    const vencida = await publicar('Pão');
    const reservada = await publicar('Fruta');
    const coletada = await publicar('Sopa');
    await query('UPDATE doacoes SET validade = CURRENT_DATE - 1 WHERE id = $1', [vencida]);
    expect((await acao(reservada, 'aceitar', 'ONG A')).status).toBe(200);
    expect((await acao(coletada, 'aceitar', 'ONG B')).status).toBe(200);
    expect((await acao(coletada, 'coletar', 'ONG B')).status).toBe(200);
    expect(await ids('/doacoes')).toEqual([disponivel]);
    expect(await ids('/doacoes/reservadas')).toEqual([reservada]);
    expect((await acao(vencida, 'aceitar', 'ONG C')).status).toBe(400);
  });

  it('I6 — interface HTML servida inclui coleta e cancelamento e script sintaticamente válido', async () => {
    const resposta = await fetch(origem + '/');
    expect(resposta.status).toBe(200);
    const html = await resposta.text();
    expect(html).toContain('Reservas ativas');
    expect(html).toContain('Confirmar coleta');
    expect(html).toContain('Cancelar reserva');
    expect(html).toContain('/api/doacoes/reservadas');
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    expect(() => new Function(script)).not.toThrow();
  });
});
