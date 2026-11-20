import 'dotenv/config';

// Variables de entorno, con los mismos valores por defecto que el original
export const PORT = Number(process.env.PORT ?? 3000);
export const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/employees_db';
