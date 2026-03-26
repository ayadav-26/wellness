# Feature Addition Prompt: User Role & Center-Therapy Mapping

---

## INSTRUCTION

Extend the existing Wellness Center Booking & Scheduling System backend by adding two new features to the already-built codebase:

1. **User Role** — a new customer-facing role with scoped booking permissions
2. **Center–Therapy Category Mapping** — linking therapy categories to specific centers

Do NOT rewrite existing code. Only add new models, migrations, routes, controllers, middleware changes, and service updates where required.

---

## Feature 1: User Role

### Overview

Add a third role `User` to the system. Users are customers who self-register and can manage their own bookings only.

---

### 1.1 — Update ENUM on Users Table

Update the `role` field in the `Users` table to include the new value:

```sql
ENUM('Admin', 'Receptionist', 'User')
```

Create a new Sequelize migration to alter this column. Do not modify the existing migration file.

---

### 1.2 — Auth Changes

#### POST /api/v1/auth/register (Public)

- This endpoint must now be accessible **without a token** for `User` role self-registration
- When no token is present, the role must be force-set to `User` — the caller cannot choose a different role
- When a valid Admin token is present, the role field is respected (Admin can still create Receptionist or Admin accounts)
- Validation rules remain unchanged (email unique, phone unique, password complexity)

#### POST /api/v1/auth/login (Public — unchanged)

No changes needed. JWT payload must include `userId`, `role`, and `email`.

---

### 1.3 — RBAC Updates

Update `roleMiddleware.js` to recognize the `User` role. Apply the following permission matrix for new and existing routes:

| Route | Admin | Receptionist | User |
|---|---|---|---|
| POST /auth/register | Yes (any role) | No | Yes (self, User role only) |
| GET /centers | Yes | Yes | Yes |
| GET /categories | Yes | Yes | Yes |
| GET /therapies | Yes | Yes | Yes |
| GET /slots | Yes | Yes | Yes |
| POST /bookings | Yes | Yes | Yes (own bookings only) |
| GET /bookings | Yes (all) | Yes (all) | Yes (own only) |
| PUT /bookings/:id | Yes | Yes | Yes (own only, policy-controlled) |
| DELETE /bookings/:id | Yes | Yes | Yes (own only, policy-controlled) |
| All other routes | Per existing matrix | Per existing matrix | No |

---

### 1.4 — Booking Model Changes for User-Linked Bookings

Add an optional `userId` foreign key to the `Bookings` table:

| Field | Type | Notes |
|---|---|---|
| userId | INT, Foreign Key → Users.userId | Nullable — walk-in bookings via Receptionist/Admin will have no userId |

Create a new Sequelize migration to add this column. Update the Booking model and associations:

```javascript
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });
User.hasMany(Booking,   { foreignKey: 'userId', as: 'bookings' });
```

When a `User` role creates a booking via `POST /bookings`, the system must automatically set `userId = req.user.userId`. Admin and Receptionist bookings leave `userId` as null.

---

### 1.5 — User Booking Scope Enforcement

Add a middleware or controller-level guard so that `User` role can only read, reschedule, or cancel their **own** bookings:

- `GET /bookings` → automatically apply `where: { userId: req.user.userId }` when role is `User`
- `PUT /bookings/:id` → verify `booking.userId === req.user.userId` before allowing update; return `403 Forbidden` if mismatch
- `DELETE /bookings/:id` → same ownership check as above

---

### 1.6 — Cancellation & Reschedule Policy for Users

Apply the following time-based policy **only for the `User` role**. Admin and Receptionist are exempt.

| Action | Rule |
|---|---|
| Cancel | Allowed only if `appointmentStartTime` is more than **2 hours** in the future |
| Reschedule | Allowed only if `appointmentStartTime` is more than **4 hours** in the future |

If the policy is violated, return:

```json
{
  "success": false,
  "message": "Cancellations must be made at least 2 hours before the appointment",
  "code": 400
}
```

Implement this check in `bookingController.js` using a helper function `checkUserBookingPolicy(booking, action)` where `action` is `'cancel'` or `'reschedule'`.

---

### 1.7 — Notification Triggers for User Bookings

No changes needed to `notificationService.js`. Ensure existing notification calls (confirmation, cancellation, reschedule) also fire when the action originates from a `User` role request.

---

---

## Feature 2: Center–Therapy Category Mapping

### Overview

An Admin may operate multiple centers. Each center may offer a different subset of therapy categories. This mapping must be established after center creation, and slot/booking queries must respect it — a therapy category not linked to a center cannot be booked at that center.

---

### 2.1 — New Table: CenterTherapyCategories

Create a new junction table with a Sequelize migration:

| Field | Type | Notes |
|---|---|---|
| id | INT, Auto-Increment, Primary Key | |
| centerId | INT, Foreign Key → Centers.centerId | Required |
| categoryId | INT, Foreign Key → TherapyCategories.categoryId | Required |
| createdAt | DATETIME | |

**Constraints:**
- Composite unique constraint on `(centerId, categoryId)` — no duplicate mappings
- `onDelete: 'CASCADE'` on both foreign keys

---

### 2.2 — Sequelize Model & Associations

Create `/src/models/centerTherapyCategory.js`.

Add the following associations in `models/index.js`:

```javascript
// Many-to-Many: Center <-> TherapyCategory through CenterTherapyCategory
Center.belongsToMany(TherapyCategory, {
  through: CenterTherapyCategory,
  foreignKey: 'centerId',
  otherKey: 'categoryId',
  as: 'therapyCategories'
});

TherapyCategory.belongsToMany(Center, {
  through: CenterTherapyCategory,
  foreignKey: 'categoryId',
  otherKey: 'centerId',
  as: 'centers'
});
```

---

### 2.3 — New API Endpoints

Add the following endpoints. Create a new route file `/src/routes/centerTherapyCategoryRoutes.js` and controller `/src/controllers/centerTherapyCategoryController.js`.

Register routes under `/api/v1`:

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /centers/:centerId/categories | Admin | Link a therapy category to a center |
| DELETE | /centers/:centerId/categories/:categoryId | Admin | Unlink a therapy category from a center |
| GET | /centers/:centerId/categories | Admin, Receptionist, User | List all therapy categories available at a center |

#### POST /centers/:centerId/categories

Request body:
```json
{ "categoryId": 2 }
```

Validations:
- Center must exist and be active (`status: true`)
- Category must exist and be active (`status: true`)
- Mapping must not already exist — return `409 Conflict` if duplicate

Response on success (`201 Created`):
```json
{
  "success": true,
  "message": "Therapy category linked to center successfully",
  "data": { "centerId": 1, "categoryId": 2 }
}
```

#### DELETE /centers/:centerId/categories/:categoryId

- Remove the mapping row (hard delete — this is a junction record)
- Return `404` if mapping does not exist

#### GET /centers/:centerId/categories

- Return all active `TherapyCategory` records linked to the given center
- Include the therapy services within each category that are also active:

```javascript
include: [
  {
    model: TherapyCategory,
    as: 'therapyCategories',
    where: { status: true },
    through: { attributes: [] }, // hide junction table fields
    include: [
      {
        model: TherapyService,
        as: 'therapies',
        where: { status: true },
        required: false,
        attributes: ['therapyId', 'therapyName', 'durationMinutes', 'price', 'requiredRoomType']
      }
    ]
  }
]
```

---

### 2.4 — Enforce Center–Category Mapping on Slot & Booking Queries

Update `slotService.js` and `bookingController.js` to validate the mapping before proceeding:

**In `GET /slots` and `POST /bookings`:**

After loading the `TherapyService`, load its `categoryId`. Then verify a `CenterTherapyCategory` row exists for `(centerId, categoryId)`:

```javascript
const mapping = await CenterTherapyCategory.findOne({
  where: { centerId, categoryId: therapyService.categoryId }
});

if (!mapping) {
  return res.status(400).json({
    success: false,
    message: "This therapy is not available at the selected center",
    code: 400
  });
}
```

---

### 2.5 — Update GET /centers/:id Response

Update the existing `centerController.js` `getById` method to include linked therapy categories:

```javascript
include: [
  { model: Therapist,        as: 'therapists',       where: { status: true }, required: false,
    attributes: ['therapistId', 'firstName', 'lastName', 'gender', 'skillSet'] },
  { model: Room,             as: 'rooms',            where: { status: true }, required: false,
    attributes: ['roomId', 'roomName', 'roomType'] },
  { model: TherapyCategory,  as: 'therapyCategories', where: { status: true }, required: false,
    through: { attributes: [] },
    attributes: ['categoryId', 'categoryName', 'description'] }
]
```

---

## Files to Create or Modify

### New Files

| File | Purpose |
|---|---|
| `src/models/centerTherapyCategory.js` | Junction model |
| `src/controllers/centerTherapyCategoryController.js` | Link/unlink/list category-center mappings |
| `src/routes/centerTherapyCategoryRoutes.js` | Route definitions |
| `src/migrations/XXXXXX-add-userId-to-bookings.js` | Add userId FK to Bookings |
| `src/migrations/XXXXXX-create-center-therapy-categories.js` | New junction table |
| `src/migrations/XXXXXX-update-user-role-enum.js` | Add 'User' to role ENUM |

### Modified Files

| File | Change |
|---|---|
| `src/models/user.js` | Add `'User'` to role ENUM |
| `src/models/booking.js` | Add `userId` field |
| `src/models/index.js` | Add new associations |
| `src/controllers/authController.js` | Public self-registration logic for User role |
| `src/controllers/bookingController.js` | Ownership checks, policy enforcement, userId auto-assign |
| `src/middleware/roleMiddleware.js` | Recognize User role |
| `src/services/slotService.js` | Center-category mapping validation |
| `src/routes/centerRoutes.js` | Register nested category routes or import new router |
| `app.js` | Register `/api/v1/centers/:centerId/categories` route group |

---

## Out of Scope for This Feature Addition

- No changes to payment, loyalty, or wallet systems
- No frontend or mobile UI
- No WhatsApp notification changes
- No changes to report endpoints (User role has no access to reports — existing restriction stands)
