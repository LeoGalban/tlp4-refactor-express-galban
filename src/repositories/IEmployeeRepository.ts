import { IEmployee } from '../models/employee.model';

// Contrato de acceso a datos: el service depende de esto, no de Mongoose
export interface IEmployeeRepository {
  create(data: IEmployee): Promise<IEmployee>;
  findAll(): Promise<IEmployee[]>; // ordenados por createdAt descendente
  findById(id: string): Promise<IEmployee | null>; // null si no existe
}
