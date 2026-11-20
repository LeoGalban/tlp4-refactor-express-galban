import { AppError } from '../errors/AppError';
import { IEmployee } from '../models/employee.model';
import { IEmployeeRepository } from '../repositories/IEmployeeRepository';

// Datos que llegan para crear un empleado (todavía sin validar)
export interface CreateEmployeeInput {
  name?: unknown;
  position?: unknown;
  baseSalary?: unknown;
  yearsOfService?: unknown;
}

// Lógica de negocio: validaciones y cálculo del salario. No conoce req/res.
export class EmployeeService {
  // Recibe el repositorio como interfaz (inyección por constructor)
  constructor(private readonly repository: IEmployeeRepository) {}

  async create(data: CreateEmployeeInput): Promise<IEmployee> {
    const { name, position, baseSalary, yearsOfService } = data;

    // Mismas validaciones, mismo orden y mismos mensajes que el original
    if (!name || !position) {
      throw new AppError('Nombre y puesto son obligatorios', 400);
    }

    if (typeof baseSalary !== 'number' || baseSalary <= 0) {
      throw new AppError('El salario base debe ser mayor a 0', 400);
    }

    if (
      typeof yearsOfService !== 'number' ||
      yearsOfService < 0 ||
      !Number.isInteger(yearsOfService)
    ) {
      throw new AppError('La antigüedad debe ser un entero mayor o igual a 0', 400);
    }

    const employee = await this.repository.create({
      // Se pasan tal cual llegan; Mongoose los convierte a String como antes
      name: name as string,
      position: position as string,
      baseSalary,
      yearsOfService,
      finalSalary: this.calculateFinalSalary(baseSalary, yearsOfService)
    });

    console.log(`Empleado creado: ${employee.name} - salario final: ${employee.finalSalary}`);
    return employee;
  }

  async findAll(): Promise<IEmployee[]> {
    return await this.repository.findAll();
  }

  async findById(id: string): Promise<IEmployee> {
    const employee = await this.repository.findById(id);

    if (!employee) {
      throw new AppError('Empleado no encontrado', 404);
    }

    return employee;
  }

  // Regla de negocio: base + 2% de la base por cada año de antigüedad
  private calculateFinalSalary(baseSalary: number, yearsOfService: number): number {
    const bonus = baseSalary * 0.02 * yearsOfService;
    return baseSalary + bonus;
  }
}
