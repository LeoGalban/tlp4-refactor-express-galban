import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

// ¿Es un error que Express ya trae con su código? (ej: JSON mal formado → 400)
function isExpressClientError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status < 500
  );
}

// Manejo de errores centralizado (reemplaza los try/catch de cada ruta).
// Express lo reconoce como middleware de errores porque tiene 4 parámetros.
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  // Errores esperados de la app: su código y su mensaje
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Errores de Express: los responde Express como siempre (igual que el original)
  if (isExpressClientError(err)) {
    next(err);
    return;
  }

  // Cualquier otro error (ej: CastError de Mongo): 500 genérico
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
}
