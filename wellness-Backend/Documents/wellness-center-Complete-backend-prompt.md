# Wellness Center Booking & Scheduling System (Backend)

---

## INSTRUCTION

Build a complete, production-ready REST API backend for a Wellness Center Booking & Scheduling System using the following tech stack and specifications. Generate all code including database models, migrations, routes, controllers, middleware, services, and configuration files.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Sequelize (with migrations and seeders)
- **Authentication:** JWT (JSON Web Tokens)
- **Notifications:** Nodemailer (Email) + Twilio (SMS)
- **Environment Config:** dotenv (.env file)

---

## Project Folder Structure

Generate the project using the following folder structure:

```
/wellness-backend
  /src
    /config
      db.js               # Sequelize DB connection
      env.js              # Environment variable loader
    /models
      index.js            # Sequelize model registry
      user.js
      center.js
      therapyCategory.js
      therapyService.js
      therapist.js
      room.js
      booking.js
      workingHours.js
      therapistLeave.js
    /migrations           # Sequelize migration files (one per table)
    /seeders              # Optional seed data
    /controllers
      authController.js
      centerController.js
      therapyCategoryController.js
      therapyServiceController.js
      therapistController.js
      roomController.js
      bookingController.js
      workingHoursController.js
      therapistLeaveController.js
      reportController.js
    /routes
      authRoutes.js
      centerRoutes.js
      therapyCategoryRoutes.js
      therapyServiceRoutes.js
      therapistRoutes.js
      roomRoutes.js
      bookingRoutes.js
      workingHoursRoutes.js
      therapistLeaveRoutes.js
      reportRoutes.js
    /middleware
      authMiddleware.js   # JWT verification
      roleMiddleware.js   # Role-based access control
      errorHandler.js     # Global error handler
    /services
      slotService.js      # Automated slot generation & availability logic
      notificationService.js  # Nodemailer + Twilio integration
    /utils
      responseHelper.js   # Standard API response formatter
  /tests                  # (optional stubs)
  .env
  .env.example
  app.js
  server.js
  package.json
```

---

## Environment Variables (.env)

Generate a `.env.example` file with the following keys:

```
PORT=3000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wellness_db
DB_USER=postgres
DB_PASSWORD=yourpassword

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=8h

# Nodemailer (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
EMAIL_FROM=no-reply@wellnesscenter.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Standard API Response Format

ALL API responses must follow this consistent format:

**Success:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { }
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

Use HTTP status codes correctly: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 500 (Server Error).

---

## Authentication & JWT Rules

- On login, return a signed JWT token with expiry of **8 hours**
- No refresh tokens required in this phase
- All routes except `/auth/login` and `/auth/register` are **protected** and require a valid Bearer token in the Authorization header
- Middleware must verify the token and attach the decoded user object to `req.user`

---

## Role-Based Access Control (RBAC)

There are two user roles: **Admin** and **Receptionist**.

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

Implement `roleMiddleware.js` that accepts an array of allowed roles and returns 403 Forbidden if the user's role is not permitted.

---

## Soft Delete Rules

- All entities (Center, TherapyCategory, TherapyService, Therapist, Room) use **soft delete** via a `status` boolean field (true = active, false = deleted/inactive)
- Soft-deleted records must **NOT appear** in any list or detail API responses unless the Admin explicitly requests inactive records via a query param `?includeInactive=true`
- If a Booking references a soft-deleted Therapist or Room, that booking must still be retrievable (do not cascade delete bookings)
- A new booking **cannot** be created for a soft-deleted Therapist, Room, or Center

---

## Database Schema

### Table: Users

| Field        | Type                             | Notes                   |
| ------------ | -------------------------------- | ----------------------- |
| userId       | INT, Auto-Increment, Primary Key | Required                |
| firstName    | STRING                           | Required                |
| lastName     | STRING                           |                         |
| email        | STRING                           | Required, Unique        |
| phoneNumber  | STRING                           | Required, Unique        |
| passwordHash | STRING                           | Required (bcrypt hash)  |
| role         | ENUM('Admin','Receptionist')     | Required                |
| status       | BOOLEAN                          | Required, Default: true |
| createdAt    | DATETIME                         |                         |
| updatedAt    | DATETIME                         |                         |


---

### Table: Centers

| Field         | Type                             | Notes         |
| ------------- | -------------------------------- | ------------- |
| centerId      | INT, Auto-Increment, Primary Key | Required      |
| name          | STRING                           | Required      |
| address       | STRING                           | Required      |
| city          | STRING                           | Required      |
| contactNumber | STRING                           | Required      |
| openingTime   | TIME                             | Required      |
| closingTime   | TIME                             | Required      |
| status        | BOOLEAN                          | Default: true |
| createdAt     | DATETIME                         |               |
| updatedAt     | DATETIME                         |               |

---

### Table: TherapyCategories

| Field        | Type                             | Notes         |
| ------------ | -------------------------------- | ------------- |
| categoryId   | INT, Auto-Increment, Primary Key | Required      |
| categoryName | STRING                           | Required      |
| description  | STRING                           |               |
| status       | BOOLEAN                          | Default: true |
| createdAt    | DATETIME                         |               |


---

### Table: TherapyServices

| Field            | Type                                            | Notes                           |
| ---------------- | ----------------------------------------------- | ------------------------------- |
| therapyId        | INT, Auto-Increment, Primary Key                | Required                        |
| therapyName      | STRING                                          | Required                        |
| categoryId       | INT, Foreign Key → TherapyCategories.categoryId | Required                        |
| durationMinutes  | INTEGER                                         | Required (e.g., 45, 60, 90)     |
| price            | DECIMAL                                         | Displayed only, no payment      |
| requiredRoomType | STRING                                          | Must match `Room.roomType`      |
| requiredSkill    | STRING                                          | Must match `Therapist.skillSet` |
| status           | BOOLEAN                                         | Default: true                   |
| createdAt        | DATETIME                                        |                                 |


---

### Table: Therapists

| Field           | Type                             | Notes                |
| --------------- | -------------------------------- | -------------------- |
| therapistId     | INT, Auto-Increment, Primary Key | Required             |
| firstName       | STRING                           | Required             |
| lastName        | STRING                           |                      |
| gender          | ENUM('Male','Female')            | Required             |
| experienceYears | INTEGER                          |                      |
| skillSet        | ARRAY of STRING (JSON)           | Stored as JSON array |
| centerId        | Foreign Key → Centers            | Required             |
| phoneNumber     | STRING                           |                      |
| status          | BOOLEAN                          | Default: true        |
| createdAt       | DATETIME                         |                      |


---

### Table: Rooms

| Field    | Type                                               | Notes         |
| -------- | -------------------------------------------------- | ------------- |
| roomId   | INT, Auto-Increment, Primary Key                   | Required      |
| centerId | INT, Foreign Key → Centers.centerId                | Required      |
| roomName | STRING                                             |               |
| roomType | ENUM('Spa Room','Hydro Room','Physiotherapy Room') | Required      |
| capacity | INTEGER                                            |               |
| status   | BOOLEAN                                            | Default: true |


---

### Table: WorkingHours

| Field          | Type                                                                         | Notes                                                    |
| -------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| workingHourId  | INT, Auto-Increment, Primary Key                                             |                                                          |
| centerId       | INT, Foreign Key → Centers.centerId                                          | Required                                                 |
| therapistId    | INT, Foreign Key → Therapists.therapistId                                    | Required — every row must belong to a specific therapist |
| dayOfWeek      | ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') | Required                                                 |
| startTime      | TIME                                                                         | Required                                                 |
| endTime        | TIME                                                                         | Required                                                 |
| breakStartTime | TIME                                                                         | Nullable                                                 |
| breakEndTime   | TIME                                                                         | Nullable                                                 |


> **Important:** Every WorkingHours row belongs to a specific therapist (therapistId is always required). Center-level working hours are defined directly on the Center model (openingTime / closingTime). WorkingHours is only for therapist-level scheduling.

---

### Table: TherapistLeaves

| Field       | Type                             | Notes    |
| ----------- | -------------------------------- | -------- |
| leaveId     | INT, Auto-Increment, Primary Key |          |
| therapistId | INT, Foreign Key → Therapists    | Required |
| leaveDate   | DATEONLY                         | Required |
| reason      | STRING                           | Optional |
| createdAt   | DATETIME                         |          |


> When generating available slots, the system must check TherapistLeaves and exclude any therapist on leave for the requested date.

---

### Table: Bookings

| Field                     | Type                                            | Notes                     |
| ------------------------- | ----------------------------------------------- | ------------------------- |
| bookingId                 | INT, Auto-Increment, Primary Key                |                           |
| centerId                  | INT, Foreign Key → Centers.centerId             | Required                  |
| therapyId                 | INT, Foreign Key → TherapyServices.therapyId    | Required                  |
| therapistId               | INT, Foreign Key → Therapists.therapistId       | Auto-assigned by system   |
| roomId                    | INT, Foreign Key → Rooms.roomId                 | Auto-assigned by system   |
| customerName              | STRING                                          | Required                  |
| customerPhone             | STRING                                          | Required                  |
| therapistGenderPreference | ENUM('Male','Female','NoPreference')            | Required                  |
| appointmentStartTime      | DATETIME                                        | Required                  |
| appointmentEndTime        | DATETIME                                        | Auto-calculated by system |
| bookingStatus             | ENUM('Booked','Cancelled','Completed','NoShow') | Default: 'Booked'         |
| createdAt                 | DATETIME                                        |                           |


---

## Table Relationships & Sequelize Associations

Define all Sequelize associations in `/src/models/index.js`. Every relationship below must be declared with correct foreign keys, `as` aliases, and `onDelete` behavior.

---

### Complete Relationship Map

| Parent Model      | Child Model       | Type        | Foreign Key     | Alias on Parent         | Alias on Child     |
|-------------------|-------------------|-------------|-----------------|-------------------------|--------------------|
| Center            | Therapist         | One-to-Many | centerId        | `therapists`            | `center`           |
| Center            | Room              | One-to-Many | centerId        | `rooms`                 | `center`           |
| Center            | Booking           | One-to-Many | centerId        | `bookings`              | `center`           |
| Center            | WorkingHours      | One-to-Many | centerId        | `workingHours`          | `center`           |
| TherapyCategory   | TherapyService    | One-to-Many | categoryId      | `therapies`             | `category`         |
| TherapyService    | Booking           | One-to-Many | therapyId       | `bookings`              | `therapy`          |
| Therapist         | Booking           | One-to-Many | therapistId     | `bookings`              | `therapist`        |
| Therapist         | WorkingHours      | One-to-Many | therapistId     | `workingHours`          | `therapist`        |
| Therapist         | TherapistLeave    | One-to-Many | therapistId     | `leaves`                | `therapist`        |
| Room              | Booking           | One-to-Many | roomId          | `bookings`              | `room`             |

---

### Sequelize Association Declarations (models/index.js)

```javascript
// Center associations
Center.hasMany(Therapist,      { foreignKey: 'centerId',    as: 'therapists',   onDelete: 'RESTRICT' });
Center.hasMany(Room,           { foreignKey: 'centerId',    as: 'rooms',        onDelete: 'RESTRICT' });
Center.hasMany(Booking,        { foreignKey: 'centerId',    as: 'bookings',     onDelete: 'RESTRICT' });
Center.hasMany(WorkingHours,   { foreignKey: 'centerId',    as: 'workingHours', onDelete: 'CASCADE'  });

// Therapist associations
Therapist.belongsTo(Center,    { foreignKey: 'centerId',    as: 'center'      });
Therapist.hasMany(Booking,     { foreignKey: 'therapistId', as: 'bookings',   onDelete: 'RESTRICT' });
Therapist.hasMany(WorkingHours,{ foreignKey: 'therapistId', as: 'workingHours',onDelete: 'CASCADE'  });
Therapist.hasMany(TherapistLeave,{ foreignKey: 'therapistId', as: 'leaves',   onDelete: 'CASCADE'  });

// Room associations
Room.belongsTo(Center,         { foreignKey: 'centerId',    as: 'center'  });
Room.hasMany(Booking,          { foreignKey: 'roomId',      as: 'bookings', onDelete: 'RESTRICT' });

// TherapyCategory associations
TherapyCategory.hasMany(TherapyService, { foreignKey: 'categoryId', as: 'therapies', onDelete: 'RESTRICT' });

// TherapyService associations
TherapyService.belongsTo(TherapyCategory, { foreignKey: 'categoryId', as: 'category' });
TherapyService.hasMany(Booking,           { foreignKey: 'therapyId',  as: 'bookings', onDelete: 'RESTRICT' });

// WorkingHours associations
WorkingHours.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });
WorkingHours.belongsTo(Center,    { foreignKey: 'centerId',    as: 'center'    });

// TherapistLeave associations
TherapistLeave.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });

// Booking associations
Booking.belongsTo(Center,        { foreignKey: 'centerId',    as: 'center'    });
Booking.belongsTo(TherapyService,{ foreignKey: 'therapyId',   as: 'therapy'   });
Booking.belongsTo(Therapist,     { foreignKey: 'therapistId', as: 'therapist' });
Booking.belongsTo(Room,          { foreignKey: 'roomId',      as: 'room'      });
```

---

### Required Joins Per API Endpoint

Implement the following `include` arrays in each controller query. Never return raw IDs without their associated data where specified below.

#### GET /bookings (List & View)
Each booking must include full details of all 4 associated entities:
```javascript
include: [
  { model: Center,         as: 'center',    attributes: ['centerId', 'name', 'city'] },
  { model: TherapyService, as: 'therapy',   attributes: ['therapyId', 'therapyName', 'durationMinutes', 'price'],
    include: [{ model: TherapyCategory, as: 'category', attributes: ['categoryId', 'categoryName'] }]
  },
  { model: Therapist,      as: 'therapist', attributes: ['therapistId', 'firstName', 'lastName', 'gender'] },
  { model: Room,           as: 'room',      attributes: ['roomId', 'roomName', 'roomType'] }
]
```

#### GET /centers/:id (View Single Center)
Return center with its therapists and rooms:
```javascript
include: [
  { model: Therapist, as: 'therapists', attributes: ['therapistId', 'firstName', 'lastName', 'gender', 'skillSet'], where: { status: true }, required: false },
  { model: Room,      as: 'rooms',      attributes: ['roomId', 'roomName', 'roomType'],                              where: { status: true }, required: false }
]
```

#### GET /therapists (List Therapists)
Return each therapist with their center and working hours:
```javascript
include: [
  { model: Center,       as: 'center',       attributes: ['centerId', 'name', 'city'] },
  { model: WorkingHours, as: 'workingHours',  attributes: ['dayOfWeek', 'startTime', 'endTime', 'breakStartTime', 'breakEndTime'] }
]
```

#### GET /therapists/:id (View Single Therapist)
Return therapist with center, working hours, and upcoming leaves:
```javascript
include: [
  { model: Center,          as: 'center',       attributes: ['centerId', 'name', 'city'] },
  { model: WorkingHours,    as: 'workingHours',  attributes: ['dayOfWeek', 'startTime', 'endTime', 'breakStartTime', 'breakEndTime'] },
  { model: TherapistLeave,  as: 'leaves',        attributes: ['leaveId', 'leaveDate', 'reason'] }
]
```

#### GET /therapies (List Therapy Services)
Return each therapy with its category:
```javascript
include: [
  { model: TherapyCategory, as: 'category', attributes: ['categoryId', 'categoryName'] }
]
```

#### GET /rooms (List Rooms)
Return each room with its center:
```javascript
include: [
  { model: Center, as: 'center', attributes: ['centerId', 'name', 'city'] }
]
```

#### GET /working-hours (List Working Hours)
Return each schedule with therapist and center:
```javascript
include: [
  { model: Therapist, as: 'therapist', attributes: ['therapistId', 'firstName', 'lastName'] },
  { model: Center,    as: 'center',    attributes: ['centerId', 'name'] }
]
```

#### GET /leaves (List Therapist Leaves)
Return each leave with therapist details:
```javascript
include: [
  { model: Therapist, as: 'therapist', attributes: ['therapistId', 'firstName', 'lastName', 'centerId'] }
]
```

---

### Join Rules & Constraints

- Always use `required: false` (LEFT JOIN) when including associated data that may not exist (e.g. a therapist may have no leaves)
- Always use `required: true` (INNER JOIN) when the association is mandatory for the query (e.g. a booking must always have a therapy)
- Always specify `attributes: [...]` on every `include` — never return full model objects with sensitive or unnecessary fields
- When filtering bookings by `centerId`, `therapistId`, or `date`, add `where` clauses directly on the Booking model, not on the include
- For the slot availability query in `slotService.js`, use a single query with nested includes to load therapist + workingHours + existing bookings in one database call to avoid N+1 queries:

```javascript
// Example: load therapist with working hours and existing bookings for a date
Therapist.findAll({
  where: { centerId, status: true, gender: genderFilter },
  include: [
    {
      model: WorkingHours,
      as: 'workingHours',
      where: { dayOfWeek: requestedDayOfWeek },
      required: true
    },
    {
      model: Booking,
      as: 'bookings',
      where: {
        appointmentStartTime: {
          [Op.between]: [dayStart, dayEnd]
        },
        bookingStatus: { [Op.in]: ['Booked'] }
      },
      required: false
    },
    {
      model: TherapistLeave,
      as: 'leaves',
      where: { leaveDate: requestedDate },
      required: false
    }
  ]
});
```

---

## Automated Slot Allocation Logic (slotService.js)

This is the most critical piece of business logic. Implement it in `/src/services/slotService.js`.

### GET /slots — Available Slot Generation

When a request comes in for available slots, the system must:

1. Accept inputs: `centerId`, `therapyId`, `date`, `genderPreference`
2. Load the TherapyService to get `durationMinutes` and `requiredRoomType` and `requiredSkill`
3. Load all active Therapists at that center who:
   - Have the `requiredSkill` in their skillSet
   - Match the `genderPreference` (if Male or Female specified)
   - Are NOT on leave on the requested date (check TherapistLeaves)
4. For each matching therapist, load their WorkingHours for the requested day of week
5. Load all Rooms at that center matching `requiredRoomType`
6. Generate time slots by iterating through the therapist's working hours in increments of `durationMinutes`, skipping break times
7. For each candidate slot (startTime → startTime + durationMinutes):
   - Check no existing Booking overlaps for that therapist
   - Check no existing Booking overlaps for any available room of the required type
   - If both are free → slot is valid
8. Apply a **15-minute buffer** after each session end time for room cleaning (no new booking can start in this window)
9. Return a list of available slots with each slot showing: `startTime`, `endTime`, `therapistId`, `roomId`

### POST /bookings — Auto-Assign Therapist & Room

When a booking is created:

1. Accept inputs: `centerId`, `therapyId`, `appointmentStartTime`, `therapistGenderPreference`, `customerName`, `customerPhone`
2. Run the same availability check as slot generation for the requested time
3. **Gender preference rule:** If `genderPreference` is Male or Female and NO therapist of that gender is available for the slot → **return HTTP 400 error:** `"No available therapist matches the requested gender preference for this slot"`
4. If multiple therapists match → select the one with the **fewest bookings on that date** (least loaded)
5. If multiple rooms match → select the **first available room** (lowest roomId)
6. Auto-calculate `appointmentEndTime` = `appointmentStartTime` + `durationMinutes`
7. Create the booking record with the assigned therapistId and roomId
8. Trigger notification: send booking confirmation via Email and SMS to the customer

---

## REST API Endpoints

### Authentication

| Method | Endpoint        | Access | Description                              |
|--------|-----------------|--------|------------------------------------------|
| POST   | /auth/register  | Admin  | Create new user (Admin or Receptionist)  |
| POST   | /auth/login     | Public | Authenticate and return JWT token        |
| POST   | /auth/logout    | Auth   | Invalidate session                       |

**Register Validation Rules:**
- Email must be unique
- Phone number must be unique
- Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
- Password must be stored as bcrypt hash (never plain text)

---

### Centers

| Method | Endpoint       | Access              | Description              |
|--------|----------------|---------------------|--------------------------|
| POST   | /centers       | Admin               | Create a center          |
| GET    | /centers       | Admin, Receptionist | List all active centers  |
| GET    | /centers/:id   | Admin, Receptionist | View center details      |
| PUT    | /centers/:id   | Admin               | Update center            |
| DELETE | /centers/:id   | Admin               | Soft delete center       |

---

### Therapy Categories

| Method | Endpoint         | Access              | Description               |
|--------|------------------|---------------------|---------------------------|
| POST   | /categories      | Admin               | Create therapy category   |
| GET    | /categories      | Admin, Receptionist | List all categories       |
| PUT    | /categories/:id  | Admin               | Update category           |
| DELETE | /categories/:id  | Admin               | Soft delete category      |

---

### Therapy Services

| Method | Endpoint        | Access              | Description              |
|--------|-----------------|---------------------|--------------------------|
| POST   | /therapies      | Admin               | Create therapy service   |
| GET    | /therapies      | Admin, Receptionist | List all therapies       |
| PUT    | /therapies/:id  | Admin               | Update therapy           |
| DELETE | /therapies/:id  | Admin               | Soft delete therapy      |

---

### Therapists

| Method | Endpoint          | Access              | Description              |
|--------|-------------------|---------------------|--------------------------|
| POST   | /therapists       | Admin               | Create therapist         |
| GET    | /therapists       | Admin, Receptionist | List all therapists      |
| PUT    | /therapists/:id   | Admin               | Update therapist         |
| DELETE | /therapists/:id   | Admin               | Soft delete therapist    |

---

### Rooms

| Method | Endpoint    | Access              | Description        |
|--------|-------------|---------------------|--------------------|
| POST   | /rooms      | Admin               | Create room        |
| GET    | /rooms      | Admin, Receptionist | List all rooms     |
| PUT    | /rooms/:id  | Admin               | Update room        |
| DELETE | /rooms/:id  | Admin               | Soft delete room   |

---

### Working Hours

| Method | Endpoint           | Access | Description                      |
|--------|--------------------|--------|----------------------------------|
| POST   | /working-hours     | Admin  | Set working hours for therapist  |
| GET    | /working-hours     | Admin  | List all working hour schedules  |
| PUT    | /working-hours/:id | Admin  | Update working hours             |
| DELETE | /working-hours/:id | Admin  | Delete working hour entry        |

---

### Therapist Leaves

| Method | Endpoint      | Access | Description                 |
|--------|---------------|--------|-----------------------------|
| POST   | /leaves       | Admin  | Mark therapist on leave     |
| GET    | /leaves       | Admin  | List all leave records      |
| DELETE | /leaves/:id   | Admin  | Cancel/remove a leave entry |

---

### Bookings

| Method | Endpoint        | Access              | Description                       |
|--------|-----------------|---------------------|-----------------------------------|
| POST   | /bookings       | Admin, Receptionist | Create booking (auto-assign)      |
| GET    | /bookings       | Admin, Receptionist | List all bookings (with filters)  |
| PUT    | /bookings/:id   | Admin, Receptionist | Reschedule booking                |
| DELETE | /bookings/:id   | Admin, Receptionist | Cancel booking                    |
| GET    | /slots          | Admin, Receptionist | Get available slots               |

**GET /bookings filters (query params):** `centerId`, `date`, `therapistId`, `bookingStatus`, `customerPhone`

---

### Reports (Admin Only)

| Method | Endpoint                    | Access | Description                          |
|--------|-----------------------------|--------|--------------------------------------|
| GET    | /reports/booking-trends     | Admin  | Daily/Weekly/Monthly booking counts  |
| GET    | /reports/therapist-utilization | Admin | Hours booked per therapist         |
| GET    | /reports/peak-times         | Admin  | Most popular booking time slots      |
| GET    | /reports/cancellations      | Admin  | Cancellation and no-show stats       |
| GET    | /reports/customer-history   | Admin  | Booking history per customer phone   |

All report endpoints should support query params: `centerId`, `startDate`, `endDate`, `period` (daily/weekly/monthly)

---

## Notification Service (notificationService.js)

Implement a notification service using **Nodemailer** for email and **Twilio** for SMS.

Send notifications for the following events:

| Event               | Email | SMS   |
|---------------------|-------|-------|
| Booking confirmation| Yes   | Yes   |
| Booking reminder    | Yes   | Yes   |
| Booking cancellation| Yes   | Yes   |
| Booking reschedule  | Yes   | Yes   |

Each notification must include: customer name, therapy name, center name, therapist name, appointment date and time.

Notification functions must be non-blocking (use async/await with try/catch, do not fail the booking API if notification fails — log the error instead).

---

## Out of Scope

Do NOT implement the following:

- Payment gateway integration
- Multi-language support
- Loyalty or wallet system
- External marketplace integrations
- Mobile app or frontend UI
- Refresh token mechanism
- WhatsApp notifications (optional — stub only if easy)
- Manual therapist/room selection by receptionist (auto-assign only in this phase)

---

## Additional Requirements

- Use `bcryptjs` for password hashing
- All list endpoints must support pagination via `?page=1&limit=10`
- Use Sequelize migrations (not sync force) to create the database schema
- Include a `package.json` with all required dependencies listed
- All controllers must use try/catch with the global error handler
- Log all errors to console with timestamps
- The `app.js` file must register all routes under an `/api/v1` prefix (e.g. `/api/v1/bookings`)
