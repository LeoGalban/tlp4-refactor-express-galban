import { Schema, model } from 'mongoose';

// Forma de un empleado guardado en la base
export interface IEmployee {
  name: string;
  position: string;
  baseSalary: number;
  yearsOfService: number;
  finalSalary: number;
  createdAt?: Date; // lo agrega timestamps
  updatedAt?: Date; // lo agrega timestamps
}

// Mismo schema que el original
const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true },
    position: { type: String, required: true },
    baseSalary: { type: Number, required: true },
    yearsOfService: { type: Number, required: true },
    finalSalary: { type: Number, required: true }
  },
  { timestamps: true }
);

export const EmployeeModel = model<IEmployee>('Employee', employeeSchema);
