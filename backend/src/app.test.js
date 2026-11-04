import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { consentText, validateRegistration } from '@entera/shared/registration';

const registration = { fullName: ' Ana Silva ', crm: '123456', state: 'sp', phone: '(11) 99999-1234', email: 'ANA@example.com', consent: true };

test('normaliza os campos e rejeita entradas inválidas e aceite não booleano', () => {
  const result = validateRegistration(registration);
  assert.equal(result.valid, true);
  assert.equal(result.data.phone, '11999991234');
  assert.equal(result.data.email, 'ana@example.com');
  assert.equal(result.data.state, 'SP');
  for (const [key, value] of Object.entries({ fullName: 'Ana', crm: 'abc', state: 'XX', phone: '123', email: 'sem-email', consent: 'true' })) {
    assert.ok(validateRegistration({ ...registration, [key]: value }).errors[key]);
  }
  assert.equal(validateRegistration(null).valid, false);
});

test('API salva somente dados validados e registra o texto e a data do aceite', async (t) => {
  const saved = [];
  const server = createApp({ getCollection: async () => ({ insertOne: async (doc) => saved.push(doc) }) }).listen(0);
  await new Promise((resolve) => server.on('listening', resolve));
  t.after(() => server.close());
  const url = `http://127.0.0.1:${server.address().port}/api/registrations`;
  const post = (body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await post({ ...registration, consent: false })).status, 400);
  assert.equal(saved.length, 0);
  assert.equal((await post({ ...registration, admin: true })).status, 201);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].fullName, 'Ana Silva');
  assert.equal(saved[0].admin, undefined);
  assert.equal(saved[0].consentText, consentText);
  assert.ok(saved[0].consentAcceptedAt instanceof Date);
});

test('API retorna falha sem confirmar cadastro quando banco não salva', async (t) => {
  const server = createApp({ getCollection: async () => { throw new Error('Database unavailable'); } }).listen(0);
  await new Promise((resolve) => server.on('listening', resolve));
  t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registration) });
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /Não foi possível salvar/);
});
