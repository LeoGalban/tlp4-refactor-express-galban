import { Request, Response } from 'express';
import { EmployeeService } from '../services/EmployeeService';

// Capa HTTP: lee la request, llama al service y responde.
// No tiene try/catch: Express 5 pasa los errores de funciones async al errorHandler.
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  // Arrow functions para no perder "this" al pasarlas al router
  create = async (req: Request, res: Response): Promise<void> => {
    const employee = await this.service.create(req.body);
    res.status(201).json(employee);
  };

  findAll = async (_req: Request, res: Response): Promise<void> => {
    const employees = await this.service.findAll();
    res.json(employees);
  };

  findById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const employee = await this.service.findById(req.params.id);
    res.json(employee);
  };
}
