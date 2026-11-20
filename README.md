# Práctica SOLID - Empleados y Salarios

Esta versión funciona, pero está deliberadamente mal estructurada.

## Objetivo

Refactorizar el servidor aplicando una separación clara de responsabilidades:

- controllers
- routes
- services
- repository
- models
- errorHandler

## Regla de negocio

El salario final se calcula así:

**salario final = salario base + 2% del salario base por cada año de antigüedad**

Ejemplo:

- Salario base: 1.000.000
- Antigüedad: 5 años
- Adicional: 10%
- Salario final: 1.100.000

## Endpoints requeridos

- POST /employees
- GET /employees
- GET /employees/:id

## Cómo ejecutar

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

## Consigna

Identificar los problemas del diseño actual y refactorizarlo.
El comportamiento observable de la API debe mantenerse.

## Problemas del diseño original

Todo el servidor vive en `src/server.ts`. Ese único archivo hace **ocho cosas distintas**:

| # | Responsabilidad | Dónde está en `server.ts` |
|---|-----------------|---------------------------|
| 1 | Configuración (leer `.env`, `PORT`, `MONGO_URI`) | `import 'dotenv/config'` y las constantes del final |
| 2 | Conexión a la base de datos | `mongoose.connect(...)` |
| 3 | Definición del modelo (schema) | `employeeSchema` y `model('Employee', ...)` |
| 4 | Validación de datos de entrada | los `if` dentro de `POST /employees` |
| 5 | Regla de negocio (cálculo del salario) | `bonus` y `finalSalary` dentro de la ruta |
| 6 | Acceso a datos | `Employee.create`, `Employee.find`, `Employee.findById` llamados desde las rutas |
| 7 | Manejo HTTP (leer `req`, responder `res`) | cada `app.post` / `app.get` |
| 8 | Manejo de errores | un `try/catch` repetido en cada ruta |

### Qué principio SOLID viola cada problema

**1. Un archivo con muchas razones para cambiar → viola SRP (Responsabilidad Única).**
Si cambia la regla del salario, la base de datos, un mensaje de error o el puerto, hay que tocar
el mismo archivo. Cada una de esas cosas debería estar en su propia clase o módulo.

**2. Validación y cálculo atados a `req`/`res` → viola SRP.**
La regla de negocio (salario + 2% por año) está escrita adentro del handler HTTP. No se puede
reutilizar ni probar sin levantar Express. La lógica de negocio no debería saber qué es una request.

**3. Las rutas dependen directamente de Mongoose → viola DIP (Inversión de Dependencias).**
El código de alto nivel (la lógica de empleados) llama a `Employee.create`, `Employee.find`, etc.,
o sea, depende de un detalle concreto (Mongoose). Para cambiar de base de datos, o para probar con
datos en memoria, habría que reescribir las rutas. Lo correcto es depender de una **interfaz**
(`IEmployeeRepository`) y recibir la implementación desde afuera (por constructor).

**4. Para extender hay que modificar → viola OCP (Abierto/Cerrado).**
Como todo está mezclado, agregar algo nuevo (otro tipo de adicional, otra base de datos, otro
endpoint) obliga a editar código que ya funciona, con riesgo de romperlo. Con capas separadas
se puede agregar una implementación nueva sin tocar las demás.

**5. No hay abstracciones → no se puede aplicar LSP ni ISP.**
No existe ninguna interfaz, así que no hay nada que se pueda sustituir (LSP) ni interfaces
chicas y específicas (ISP). En el refactor, `IEmployeeRepository` va a tener solo los 3 métodos
que se usan (`create`, `findAll`, `findById`), y cualquier implementación que la cumpla
(Mongo, memoria, etc.) va a poder reemplazar a otra sin que el service lo note.

**6. Manejo de errores duplicado.**
El mismo `try/catch` con `console.error` y `500 "Error interno del servidor"` está copiado en las
tres rutas. Esto también es un problema de SRP: cada ruta decide cómo responder los errores. Lo
correcto es centralizarlo en un middleware `errorHandler` y usar un error propio (`AppError`)
con su `statusCode`.

**7. Sin tipos propios.**
No hay un tipo `IEmployee`; `req.body` llega sin tipar y el modelo no expone su forma. Esto
hace más difícil entender qué datos circulan entre las partes.

### Comportamiento que se mantiene a propósito

`GET /employees/:id` con un id que no es un ObjectId válido (por ejemplo `abc`) hoy responde
**500 "Error interno del servidor"**, porque Mongoose lanza un `CastError`. El refactor **mantiene**
ese comportamiento (la consigna pide no cambiar lo observable). Ver "Posibles mejoras" más abajo.
