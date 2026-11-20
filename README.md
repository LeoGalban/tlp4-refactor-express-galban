# Práctica SOLID - Empleados y Salarios

Taller de Lenguajes de Programación IV — TP4.

El proyecto original (`empleados-solid-starter`) tenía todo el servidor en un solo archivo.
Esta versión está **refactorizada en capas** aplicando SOLID, sin cambiar el comportamiento de la API.

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

Requisitos: Node.js y Docker Desktop abierto (para MongoDB).

```bash
cp .env.example .env      # en PowerShell: Copy-Item .env.example .env
docker compose up -d      # levanta MongoDB en el puerto 27017
npm install
npm run dev               # servidor en http://localhost:3000
```

Otros comandos:

```bash
npx tsc --noEmit          # verifica tipos sin generar archivos
npm run build             # compila a dist/
npm start                 # corre la versión compilada
```

Ejemplo de uso:

```bash
curl -X POST http://localhost:3000/employees -H "Content-Type: application/json" -d '{"name":"Ana Perez","position":"Desarrolladora","baseSalary":1000000,"yearsOfService":5}'
curl http://localhost:3000/employees
curl http://localhost:3000/employees/<id>
```

Las pruebas completas (requests y respuestas) están en `PRUEBAS_ORIGINAL.md` (antes del refactor)
y `PRUEBAS_REFACTOR.md` (después, con la comparación).

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

## Estructura nueva

```text
src/
├── config/
│   ├── env.ts                      # PORT y MONGO_URI (lee el .env)
│   └── database.ts                 # connectDatabase(): conexión con mongoose
├── models/
│   └── employee.model.ts           # schema de Mongoose + interfaz IEmployee
├── repositories/
│   ├── IEmployeeRepository.ts      # interfaz: create, findAll, findById
│   └── EmployeeRepository.ts       # implementación con Mongoose
├── services/
│   └── EmployeeService.ts          # validaciones + cálculo del salario final
├── controllers/
│   └── EmployeeController.ts       # recibe req, llama al service, responde
├── routes/
│   └── employee.routes.ts          # URL + método HTTP → método del controller
├── errors/
│   └── AppError.ts                 # error con statusCode (400, 404, ...)
├── middlewares/
│   └── errorHandler.ts             # convierte errores en respuestas HTTP
├── app.ts                          # arma Express: json, rutas, errorHandler
└── server.ts                       # composition root: crea y conecta todo, levanta el servidor
```

## Qué hace cada capa

Recorrido de un `POST /employees`:

```text
request → routes → controller → service → repository → MongoDB
                                    │
                    si algo falla, lanza un error → errorHandler → response
```

| Capa | Responsabilidad | Qué **no** hace |
|------|-----------------|-----------------|
| **routes** | Asocia cada URL y método HTTP con un método del controller. | No tiene lógica. |
| **controller** | Lee `req.body` / `req.params`, llama al service y responde (201 o 200). | No valida ni calcula; no tiene `try/catch` (Express 5 manda los errores async al errorHandler). |
| **service** | Valida los datos, calcula el salario final, hace el `console.log` al crear y lanza `AppError` (400/404). | No conoce `req`/`res` ni Mongoose: recibe el repositorio como **interfaz** por constructor. |
| **repository** | Guarda y busca empleados en MongoDB con Mongoose (orden `createdAt` descendente). | No valida ni conoce HTTP. |
| **models** | Define el schema de Mongoose y el tipo `IEmployee`. | — |
| **errors / middlewares** | `AppError` → su `statusCode` y `{ message }`. Cualquier otro error → `500 "Error interno del servidor"`. Los errores propios de Express (ej: JSON mal formado → 400) se los deja a Express, como en el original. | — |
| **config** | Variables de entorno y conexión a la base. | — |
| **app.ts** | Arma la aplicación Express. | No conecta la base ni escucha el puerto. |
| **server.ts** | **Composition root**: único lugar con `new` de las clases concretas (`repo → service → controller`). Conecta la base y levanta el servidor. | — |

## Cómo se aplica SOLID en el refactor

- **S — Responsabilidad Única:** cada archivo tiene una sola razón para cambiar (la regla del salario solo está en `EmployeeService.calculateFinalSalary`, el acceso a datos solo en `EmployeeRepository`, etc.).
- **O — Abierto/Cerrado:** para usar otra base de datos se crea otra clase que implemente `IEmployeeRepository` y se cambia una línea en `server.ts`; el service y el controller no se modifican.
- **L — Sustitución de Liskov:** cualquier implementación de `IEmployeeRepository` (Mongo, en memoria para tests) puede reemplazar a otra sin que el service lo note.
- **I — Segregación de Interfaces:** `IEmployeeRepository` tiene solo los 3 métodos que se usan.
- **D — Inversión de Dependencias:** el service depende de la abstracción `IEmployeeRepository`, no de Mongoose, y recibe la implementación por constructor desde `server.ts`.

## Posibles mejoras

- **Id inválido en `GET /employees/:id`:** hoy un id que no es un ObjectId válido (ej: `abc`) responde
  **500 "Error interno del servidor"**, porque Mongoose lanza un `CastError`. Se mantuvo así a propósito
  para no cambiar el comportamiento observable. Lo correcto sería validarlo (por ejemplo con
  `mongoose.isValidObjectId(id)` en el repositorio, o devolviendo `null`) y responder **404** o **400**.
- **POST sin body:** si se envía sin `Content-Type: application/json`, `req.body` llega `undefined` y
  responde 500. Podría responder 400 "Nombre y puesto son obligatorios".
- **Validación de tipos de `name` y `position`:** hoy se acepta cualquier valor "verdadero" (ej: un número)
  y Mongoose lo convierte a texto. Se podría exigir que sean strings.
- **Tests automáticos:** gracias a la interfaz del repositorio, el service se puede testear con un
  repositorio en memoria, sin MongoDB.
