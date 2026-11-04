import { MongoClient } from 'mongodb';
import { createApp } from './app.js';

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/entera_form', { serverSelectionTimeoutMS: 5000 });
const app = createApp({ getCollection: async () => {
  await client.connect();
  return client.db().collection('registrations');
} });
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () => console.log(`Entera API: http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(async () => { await client.close(); process.exit(0); });
});
