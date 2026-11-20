import { Router } from 'express';
import { EmployeeController } from '../controllers/EmployeeController';

// Solo asocia URL + método HTTP con el método del controller.
// Se monta en /employees desde app.ts
export function createEmployeeRoutes(controller: EmployeeController): Router {
  const router = Router();

  router.post('/', controller.create);
  router.get('/', controller.findAll);
  router.get('/:id', controller.findById);

  return router;
}
