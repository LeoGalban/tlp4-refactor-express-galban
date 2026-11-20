import { createApp } from './app';
import { connectDatabase } from './config/database';
import { PORT } from './config/env';
import { EmployeeController } from './controllers/EmployeeController';
import { EmployeeRepository } from './repositories/EmployeeRepository';
import { EmployeeService } from './services/EmployeeService';

// Composition root: el único lugar donde se crean las clases concretas
// y se conectan entre sí (repo → service → controller).
const employeeRepository = new EmployeeRepository();
const employeeService = new EmployeeService(employeeRepository);
const employeeController = new EmployeeController(employeeService);

const app = createApp(employeeController);

// Primero conecta la base y después levanta el servidor (igual que el original)
connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((error: unknown) => {
    console.error('No se pudo conectar a MongoDB', error);
    process.exit(1);
  });
