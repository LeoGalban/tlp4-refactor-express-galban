import express, { Express } from 'express';
import { EmployeeController } from './controllers/EmployeeController';
import { errorHandler } from './middlewares/errorHandler';
import { createEmployeeRoutes } from './routes/employee.routes';

// Arma la aplicación Express (no conecta la base ni escucha el puerto)
export function createApp(employeeController: EmployeeController): Express {
  const app = express();

  app.use(express.json());
  app.use('/employees', createEmployeeRoutes(employeeController));

  // Siempre al final, después de las rutas
  app.use(errorHandler);

  return app;
}
