import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cors from 'cors';
import { consentText, consentVersion, validateRegistration } from '@entera/shared/registration';

export function createApp({ getCollection }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 0));
  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', methods: ['POST'], allowedHeaders: ['Content-Type'] }));
  app.use(express.json({ limit: '8kb' }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.post('/api/registrations', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' } }), async (req, res, next) => {
    const { data, errors, valid } = validateRegistration(req.body);
    if (!valid) return res.status(400).json({ message: 'Confira os campos indicados.', errors });
    try {
      const collection = await getCollection();
      const now = new Date();
      await collection.insertOne({ ...data, consentText, consentVersion, consentAcceptedAt: now, createdAt: now });
      res.status(201).json({ message: 'Cadastro realizado com sucesso.' });
    } catch (error) { next(error); }
  });
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Envie um JSON válido.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Dados enviados excedem o limite.' });
    console.error('Falha ao processar cadastro:', error.name);
    res.status(503).json({ message: 'Não foi possível salvar agora. Seus dados continuam no formulário; tente novamente em instantes.' });
  });
  return app;
}
