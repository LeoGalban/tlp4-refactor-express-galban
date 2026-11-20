# Pruebas del servidor ORIGINAL

Pruebas manuales con curl contra `http://localhost:3000` (base de datos vacía al empezar).
Los `_id`, `createdAt` y `updatedAt` cambian en cada ejecución; lo que importa es el código de estado y el cuerpo.

## 1. POST OK: 1.000.000 con 5 años → 1.100.000

```bash
curl -s -X POST http://localhost:3000/employees -H "Content-Type: application/json" -d '{"name":"Ana Perez","position":"Desarrolladora","baseSalary":1000000,"yearsOfService":5}'
```

**Status:** `201`

```json
{
  "name": "Ana Perez",
  "position": "Desarrolladora",
  "baseSalary": 1000000,
  "yearsOfService": 5,
  "finalSalary": 1100000,
  "_id": "6b00bf603fc3db557072d29b",
  "createdAt": "2026-11-20T21:45:04.992Z",
  "updatedAt": "2026-11-20T21:45:04.992Z",
  "__v": 0
}
```

## 2. POST OK: 0 años de antigüedad (sin adicional)

```bash
curl -s -X POST http://localhost:3000/employees -H "Content-Type: application/json" -d '{"name":"Juan Gomez","position":"Analista","baseSalary":800000,"yearsOfService":0}'
```

**Status:** `201`

```json
{
  "name": "Juan Gomez",
  "position": "Analista",
  "baseSalary": 800000,
  "yearsOfService": 0,
  "finalSalary": 800000,
  "_id": "6b00bf623fc3db557072d29d",
  "createdAt": "2026-11-20T21:45:06.468Z",
  "updatedAt": "2026-11-20T21:45:06.468Z",
  "__v": 0
}
```

## 3. POST error: falta el nombre

```bash
curl -s -X POST http://localhost:3000/employees -H "Content-Type: application/json" -d '{"position":"Analista","baseSalary":800000,"yearsOfService":2}'
```

**Status:** `400`

```json
{
  "message": "Nombre y puesto son obligatorios"
}
```

## 4. POST error: falta el puesto

```bash
curl -s -X POST http://localhost:3000/employees -H "Content-Type: application/json" -d '{"name":"Juan","baseSalary":800000,"yearsOfService":2}'
```

**Status:** `400`

```json
{
  "message": "Nombre y puesto son obligatorios"
}
```

## 5. POST error: salario base 0

```bash
curl -s -X POST http://localhost:3000/employees -H "Content-Type: application/json" -d '{"name":"Juan","position":"Analista","baseSalary":0,"yearsOfService":2}'
```

**Status:** `400`

```json
{
  "message": "El salario base debe ser mayor a 0"
}
```

## 6. POST error: salario base como texto

```bash
curl -s -X POST http://localhost:3000/employees -H "Content-Type: application/json" -d '{"name":"Juan","position":"Analista","baseSalary":"800000","yearsOfService":2}'
```

**Status:** `400`

```json
{
  "message": "El salario base debe ser mayor a 0"
}
```

## 7. POST error: antigüedad negativa

```bash
curl -s -X POST http://localhost:3000/employees -H "Content-Type: application/json" -d '{"name":"Juan","position":"Analista","baseSalary":800000,"yearsOfService":-1}'
```

**Status:** `400`

```json
{
  "message": "La antigüedad debe ser un entero mayor o igual a 0"
}
```

## 8. POST error: antigüedad decimal

```bash
curl -s -X POST http://localhost:3000/employees -H "Content-Type: application/json" -d '{"name":"Juan","position":"Analista","baseSalary":800000,"yearsOfService":2.5}'
```

**Status:** `400`

```json
{
  "message": "La antigüedad debe ser un entero mayor o igual a 0"
}
```

## 9. GET lista (orden createdAt descendente: Juan primero, Ana después)

```bash
curl -s -X GET http://localhost:3000/employees
```

**Status:** `200`

```json
[
  {
    "_id": "6b00bf623fc3db557072d29d",
    "name": "Juan Gomez",
    "position": "Analista",
    "baseSalary": 800000,
    "yearsOfService": 0,
    "finalSalary": 800000,
    "createdAt": "2026-11-20T21:45:06.468Z",
    "updatedAt": "2026-11-20T21:45:06.468Z",
    "__v": 0
  },
  {
    "_id": "6b00bf603fc3db557072d29b",
    "name": "Ana Perez",
    "position": "Desarrolladora",
    "baseSalary": 1000000,
    "yearsOfService": 5,
    "finalSalary": 1100000,
    "createdAt": "2026-11-20T21:45:04.992Z",
    "updatedAt": "2026-11-20T21:45:04.992Z",
    "__v": 0
  }
]
```

## 10. GET por id existente

```bash
curl -s -X GET http://localhost:3000/employees/6b00bf603fc3db557072d29b
```

**Status:** `200`

```json
{
  "_id": "6b00bf603fc3db557072d29b",
  "name": "Ana Perez",
  "position": "Desarrolladora",
  "baseSalary": 1000000,
  "yearsOfService": 5,
  "finalSalary": 1100000,
  "createdAt": "2026-11-20T21:45:04.992Z",
  "updatedAt": "2026-11-20T21:45:04.992Z",
  "__v": 0
}
```

## 11. GET por id inexistente (ObjectId válido)

```bash
curl -s -X GET http://localhost:3000/employees/000000000000000000000000
```

**Status:** `404`

```json
{
  "message": "Empleado no encontrado"
}
```

## 12. GET por id inválido (no es ObjectId) → hoy da 500

```bash
curl -s -X GET http://localhost:3000/employees/abc
```

**Status:** `500`

```json
{
  "message": "Error interno del servidor"
}
```

## Salida en la consola del servidor

```text
Empleado creado: Ana Perez - salario final: 1100000
Empleado creado: Juan Gomez - salario final: 800000
CastError: Cast to ObjectId failed for value "abc" (type string) at path "_id" for model "Employee"
    ... (stack trace, viene del console.error del catch → responde 500)
```

## Resumen

| # | Caso | Status |
|---|------|--------|
| 1 | POST OK (5 años) | 201 |
| 2 | POST OK (0 años) | 201 |
| 3 | POST sin nombre | 400 |
| 4 | POST sin puesto | 400 |
| 5 | POST salario 0 | 400 |
| 6 | POST salario texto | 400 |
| 7 | POST antigüedad negativa | 400 |
| 8 | POST antigüedad decimal | 400 |
| 9 | GET lista | 200 |
| 10 | GET id existente | 200 |
| 11 | GET id inexistente | 404 |
| 12 | GET id inválido | 500 |
