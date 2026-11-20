import mongoose from 'mongoose';
import { MONGO_URI } from './env';

// Conecta a MongoDB; si falla, el error lo maneja quien la llama (server.ts)
export async function connectDatabase(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB conectado');
}
