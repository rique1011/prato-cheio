import express from 'express';
import * as doacoes from './doacoes.js';

// Refatoração 1: tratamento uniforme dos erros assíncronos nas rotas.
// Mantém os mesmos status HTTP, JSON e mensagens observáveis.
function responderOperacao(operacao, statusSucesso = 200) {
  return async (req, res) => {
    try {
      const resultado = await operacao(req);
      res.status(statusSucesso).json(resultado);
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  };
}

export function criarApp() {
  const app = express();

  app.use(express.json());
  app.use(express.static('public'));

  app.get('/api/saude', (req, res) => {
    res.json({ ok: true });
  });

  app.get(
    '/api/doacoes',
    responderOperacao(() => doacoes.listarDisponiveis())
  );

  app.post(
    '/api/doacoes',
    responderOperacao((req) => doacoes.criarDoacao(req.body), 201)
  );

  app.post(
    '/api/doacoes/:id/aceitar',
    responderOperacao((req) => doacoes.aceitar(req.params.id, req.body?.ong ?? 'ONG'))
  );

  app.post(
    '/api/doacoes/:id/coletar',
    responderOperacao((req) => doacoes.coletar(req.params.id, req.body?.ong))
  );

  app.post(
    '/api/doacoes/:id/cancelar',
    responderOperacao((req) => doacoes.cancelarReserva(req.params.id, req.body?.ong))
  );

  return app;
}
