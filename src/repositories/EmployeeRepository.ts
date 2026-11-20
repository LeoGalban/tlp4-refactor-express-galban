import { EmployeeModel, IEmployee } from '../models/employee.model';
import { IEmployeeRepository } from './IEmployeeRepository';

// Implementación concreta con Mongoose (el único lugar que conoce la base)
export class EmployeeRepository implements IEmployeeRepository {
  async create(data: IEmployee): Promise<IEmployee> {
    return await EmployeeModel.create(data);
  }

  async findAll(): Promise<IEmployee[]> {
    return await EmployeeModel.find().sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<IEmployee | null> {
    // Un id inválido lanza CastError → termina en 500 (igual que el original)
    return await EmployeeModel.findById(id);
  }
}
