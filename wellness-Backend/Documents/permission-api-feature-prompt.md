# Feature Prompt: Role-Based Permission API (Frontend Access Control)

---

## Objective

Build a **Permission API** that returns UI-level access control based on the logged-in user's role.

This API will be called **immediately after login** by the frontend to determine:

- What screens to show
- What actions are allowed
- What features to hide or disable

---

## Endpoint Definition

```http
GET /api/v1/auth/permissions
```

**Access:** Protected (JWT required) — available to all roles: `Admin`, `Receptionist`, `User`

---

## Response Format

Return structured permissions grouped by module. All responses must follow the existing standard API response format.

**Example response for `User` role:**

```json
{
  "success": true,
  "message": "Permissions fetched successfully",
  "data": {
    "role": "User",
    "permissions": {
      "dashboard": {
        "view": false
      },
      "centers": {
        "view": true,
        "create": false,
        "update": false,
        "delete": false
      },
      "therapies": {
        "view": true,
        "create": false,
        "update": false,
        "delete": false
      },
      "therapists": {
        "view": true,
        "create": false,
        "update": false,
        "delete": false
      },
      "rooms": {
        "view": false
      },
      "bookings": {
        "view": true,
        "create": true,
        "update": true,
        "cancel": true,
        "viewAll": false
      },
      "reports": {
        "view": false
      }
    }
  }
}
```

---

## Permission Matrix

### Admin — Full access to everything

```json
{
  "dashboard": { "view": true },
  "centers":   { "view": true, "create": true, "update": true, "delete": true },
  "therapies": { "view": true, "create": true, "update": true, "delete": true },
  "therapists":{ "view": true, "create": true, "update": true, "delete": true },
  "rooms":     { "view": true, "create": true, "update": true, "delete": true },
  "bookings":  { "view": true, "create": true, "update": true, "cancel": true, "viewAll": true },
  "reports":   { "view": true }
}
```

---

### Receptionist — Operational access, no master data control

```json
{
  "dashboard": { "view": true },
  "centers":   { "view": true },
  "therapies": { "view": true },
  "therapists":{ "view": true },
  "rooms":     { "view": true },
  "bookings":  { "view": true, "create": true, "update": true, "cancel": true, "viewAll": true },
  "reports":   { "view": false }
}
```

---

### User (Customer) — Limited self-service access

```json
{
  "dashboard": { "view": false },
  "centers":   { "view": true },
  "therapies": { "view": true },
  "therapists":{ "view": false },
  "rooms":     { "view": false },
  "bookings":  { "view": true, "create": true, "update": true, "cancel": true, "viewAll": false },
  "reports":   { "view": false }
}
```

---

## Implementation Requirements

### 1. Permission Service

Create `/src/services/permissionService.js`.

Centralize all permission logic here. Define a static permission map keyed by role and export a function that returns the correct permissions object:

```javascript
const PERMISSIONS = {
  Admin: { ... },
  Receptionist: { ... },
  User: { ... }
};

const getPermissionsByRole = (role) => {
  return PERMISSIONS[role] || null;
};

module.exports = { getPermissionsByRole };
```

Do NOT hardcode permissions inside the controller. Always delegate to this service.

---

### 2. Controller

Create `/src/controllers/permissionController.js`.

Implement a single function `getPermissions(req, res)`:

- Read role from `req.user.role` (set by existing `authMiddleware`)
- Call `permissionService.getPermissionsByRole(role)`
- If role is unrecognized, return `400 Bad Request`
- Return the standard success response with `role` and `permissions` in the `data` field

```javascript
const getPermissions = async (req, res) => {
  try {
    const { role } = req.user;
    const permissions = permissionService.getPermissionsByRole(role);

    if (!permissions) {
      return res.status(400).json({
        success: false,
        message: "Invalid role — permissions not found",
        code: 400
      });
    }

    return res.status(200).json({
      success: true,
      message: "Permissions fetched successfully",
      data: { role, permissions }
    });
  } catch (error) {
    next(error);
  }
};
```

---

### 3. Route

Create `/src/routes/permissionRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/permissions', authMiddleware, permissionController.getPermissions);

module.exports = router;
```

---

### 4. Register Route in app.js

Mount the permission route under the existing `/api/v1/auth` prefix:

```javascript
const permissionRoutes = require('./src/routes/permissionRoutes');
app.use('/api/v1/auth', permissionRoutes);
```

The final endpoint resolves to: `GET /api/v1/auth/permissions`

---

## Files to Create

| File | Purpose |
|---|---|
| `src/services/permissionService.js` | Centralized permission map and lookup logic |
| `src/controllers/permissionController.js` | Reads role, delegates to service, returns response |
| `src/routes/permissionRoutes.js` | Route definition for `GET /permissions` |

## Files to Modify

| File | Change |
|---|---|
| `app.js` | Register `permissionRoutes` under `/api/v1/auth` |

---

## Security Notes

- This API is **only for frontend rendering guidance** — it controls what the UI shows or hides
- The backend must **continue to enforce RBAC** using `authMiddleware` and `roleMiddleware` on every protected route
- Frontend permissions and backend enforcement are independent layers — removing a permission from the frontend response does not remove the backend protection, and vice versa
- Never expose internal role logic, database structure, or middleware names in the API response

---

## Out of Scope for This Feature

- Dynamic database-driven permissions (static role map is sufficient for this phase)
- Per-user permission overrides
- Feature flags or organization-level toggles
- Any frontend implementation

---

## Expected Outcome

The frontend will:

1. Call `GET /api/v1/auth/permissions` immediately after a successful login
2. Store the response in application state (Redux, Signals, or equivalent)
3. Use the permissions object to dynamically show or hide menu items, enable or disable action buttons, and restrict route navigation per role
