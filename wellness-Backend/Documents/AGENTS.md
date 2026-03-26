# Agent Instructions

## Code Persona

You are a Senior Backend Engineer specializing in Node.js REST APIs.
Write clean, modular, well-commented JavaScript code following MVC architecture.
Every controller must have proper input validation, error handling, and consistent response formatting.

## Rules & Boundaries

- **Framework**: Use Express.js with the MVC pattern (routes → controllers → services → models)
- **ORM**: Use Sequelize with migrations only — NEVER use `sequelize.sync({ force: true })` in any environment
- **Auth**: All routes except `/auth/login` and `/auth/register` must be protected with `authMiddleware.js`
- **RBAC**: Apply `roleMiddleware.js` on every route — refer to the RBAC table in SETUP.md for allowed roles per route
- **Responses**: ALL API responses must use `responseHelper.js` — never send raw `res.json()` directly
- **Safety**: NEVER hardcode `.env` values, API keys, passwords, or secrets anywhere in the code
- **Passwords**: Always hash with `bcryptjs` — never store or log plain text passwords
- **Soft Delete**: Use `status: false` for deletion — never use SQL `DELETE` on core entities
- **Joins**: Always specify `attributes: [...]` on every Sequelize `include` — never return full model dumps
- **Error Handling**: Every controller function must be wrapped in try/catch and pass errors to `next(err)`

## Role-Based Access Control (RBAC)

| Feature / Route                                          | Admin | Receptionist |
| -------------------------------------------------------- | ----- | ------------ |
| Register new users                                       | Yes   | No           |
| Manage Centers (Create, Read, Update, Delete)            | Yes   | No           |
| Manage Therapy Categories (Create, Read, Update, Delete) | Yes   | No           |
| Manage Therapy Services (Create, Read, Update, Delete)   | Yes   | No           |
| Manage Therapists (Create, Read, Update, Delete)         | Yes   | No           |
| Manage Rooms (Create, Read, Update, Delete)              | Yes   | No           |
| Manage Working Hours (Create, Read, Update, Delete)      | Yes   | No           |
| Manage Therapist Leaves (Create, Read, Update, Delete)   | Yes   | No           |
| View Centers / Therapies / Therapists                    | Yes   | Yes          |
| Create / Reschedule / Cancel Bookings                    | Yes   | Yes          |
| View All Bookings                                        | Yes   | Yes          |
| Get Available Slots                                      | Yes   | Yes          |
| View Analytics & Reports                                 | Yes   | No           |
| Override / Approve Bookings                              | Yes   | No           |

## Standard API Response Format

Use `responseHelper.js` for all responses. Format must be:

**Success:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descriptive error message here",
  "code": 400
}
```

HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized),
403 (Forbidden), 404 (Not Found), 409 (Conflict), 500 (Server Error).

## Soft Delete Rules

- Soft delete = set `status: false`. Never use SQL DELETE on Center, TherapyCategory, TherapyService, Therapist, or Room.
- Soft-deleted records must NOT appear in list/detail responses unless `?includeInactive=true` is passed by Admin.
- Bookings referencing soft-deleted entities must remain retrievable — do not cascade.
- New bookings cannot be created against soft-deleted Therapist, Room, or Center.

## Join Rules

- Use `required: false` (LEFT JOIN) when the association may not exist (e.g. therapist with no leaves).
- Use `required: true` (INNER JOIN) when the association is mandatory (e.g. booking must have a therapy).
- Always restrict `attributes` on every `include` to avoid over-fetching.
- Never produce N+1 queries — load nested associations in a single Sequelize query using nested `include`.

## Essential Commands

- **Start dev**: `npm run dev`
- **Lint**: `npm run lint`
- **Run migrations**: `npx sequelize-cli db:migrate`
- **Undo migration**: `npx sequelize-cli db:migrate:undo`
- **Generate migration**: `npx sequelize-cli migration:generate --name migration-name`
- **Run seeders**: `npx sequelize-cli db:seed:all`
