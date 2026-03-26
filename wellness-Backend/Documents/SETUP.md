# Wellness Center - Backend Setup & Specification

WellnessHub is a REST API backend for a chain of wellness centers. It handles
therapy session booking, automated therapist/room allocation, leave management,
and business analytics — built with Node.js, Express.js, Sequelize, and PostgreSQL.

No payment gateway integration is required in this phase.

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: [Sequelize ORM](https://sequelize.org) with PostgreSQL
- **Authentication**: JWT via `jsonwebtoken` — 8h token expiry, no refresh tokens
- **Notifications**: [Nodemailer](https://nodemailer.com) (Email) + [Twilio](https://twilio.com) (SMS)
- **Password Hashing**: bcryptjs

## Getting Started

1. Setup project using the tech stack above — refer to `ARCHITECTURE.md` for folder structure
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in all values
4. Create the PostgreSQL database
5. Run migrations: `npx sequelize-cli db:migrate`
6. Start dev server: `npm run dev`

## Environment Variables

Generate a `.env.example` with these keys:

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

## Database Schema

### Users
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

### Centers
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


### TherapyCategories
| Field        | Type                             | Notes         |
| ------------ | -------------------------------- | ------------- |
| categoryId   | INT, Auto-Increment, Primary Key | Required      |
| categoryName | STRING                           | Required      |
| description  | STRING                           |               |
| status       | BOOLEAN                          | Default: true |
| createdAt    | DATETIME                         |               |

### TherapyServices
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

### Therapists
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

### Rooms
| Field    | Type                                               | Notes         |
| -------- | -------------------------------------------------- | ------------- |
| roomId   | INT, Auto-Increment, Primary Key                   | Required      |
| centerId | INT, Foreign Key → Centers.centerId                | Required      |
| roomName | STRING                                             |               |
| roomType | ENUM('Spa Room','Hydro Room','Physiotherapy Room') | Required      |
| capacity | INTEGER                                            |               |
| status   | BOOLEAN                                            | Default: true |

### WorkingHours
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

### TherapistLeaves
| Field       | Type                             | Notes    |
| ----------- | -------------------------------- | -------- |
| leaveId     | INT, Auto-Increment, Primary Key |          |
| therapistId | INT, Foreign Key → Therapists    | Required |
| leaveDate   | DATEONLY                         | Required |
| reason      | STRING                           | Optional |
| createdAt   | DATETIME                         |          |

### Bookings
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

## REST API Endpoints

All routes are prefixed with `/api/v1`. Refer to `AGENTS.md` for RBAC rules.

### Authentication
| Method | Endpoint       | Access | Description                             |
|--------|----------------|--------|-----------------------------------------|
| POST   | /auth/register | Admin  | Create new user (Admin or Receptionist) |
| POST   | /auth/login    | Public | Authenticate and return JWT token       |
| POST   | /auth/logout   | Auth   | Invalidate session                      |

Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.

### Centers
| Method | Endpoint     | Access              | Description             |
|--------|--------------|---------------------|-------------------------|
| POST   | /centers     | Admin               | Create a center         |
| GET    | /centers     | Admin, Receptionist | List all active centers |
| GET    | /centers/:id | Admin, Receptionist | View center details     |
| PUT    | /centers/:id | Admin               | Update center           |
| DELETE | /centers/:id | Admin               | Soft delete center      |

### Therapy Categories
| Method | Endpoint        | Access              | Description             |
|--------|-----------------|---------------------|-------------------------|
| POST   | /categories     | Admin               | Create therapy category |
| GET    | /categories     | Admin, Receptionist | List all categories     |
| PUT    | /categories/:id | Admin               | Update category         |
| DELETE | /categories/:id | Admin               | Soft delete category    |

### Therapy Services
| Method | Endpoint       | Access              | Description            |
|--------|----------------|---------------------|------------------------|
| POST   | /therapies     | Admin               | Create therapy service |
| GET    | /therapies     | Admin, Receptionist | List all therapies     |
| PUT    | /therapies/:id | Admin               | Update therapy         |
| DELETE | /therapies/:id | Admin               | Soft delete therapy    |

### Therapists
| Method | Endpoint         | Access              | Description           |
|--------|------------------|---------------------|-----------------------|
| POST   | /therapists      | Admin               | Create therapist      |
| GET    | /therapists      | Admin, Receptionist | List all therapists   |
| PUT    | /therapists/:id  | Admin               | Update therapist      |
| DELETE | /therapists/:id  | Admin               | Soft delete therapist |

### Rooms
| Method | Endpoint   | Access              | Description      |
|--------|------------|---------------------|------------------|
| POST   | /rooms     | Admin               | Create room      |
| GET    | /rooms     | Admin, Receptionist | List all rooms   |
| PUT    | /rooms/:id | Admin               | Update room      |
| DELETE | /rooms/:id | Admin               | Soft delete room |

### Working Hours
| Method | Endpoint          | Access | Description                     |
|--------|-------------------|--------|---------------------------------|
| POST   | /working-hours    | Admin  | Set working hours for therapist |
| GET    | /working-hours    | Admin  | List all working hour schedules |
| PUT    | /working-hours/:id| Admin  | Update working hours            |
| DELETE | /working-hours/:id| Admin  | Delete working hour entry       |

### Therapist Leaves
| Method | Endpoint    | Access | Description                  |
|--------|-------------|--------|------------------------------|
| POST   | /leaves     | Admin  | Mark therapist on leave      |
| GET    | /leaves     | Admin  | List all leave records       |
| DELETE | /leaves/:id | Admin  | Cancel / remove a leave entry|

### Bookings
| Method | Endpoint       | Access              | Description                      |
|--------|----------------|---------------------|----------------------------------|
| POST   | /bookings      | Admin, Receptionist | Create booking (auto-assign)     |
| GET    | /bookings      | Admin, Receptionist | List bookings (filterable)       |
| PUT    | /bookings/:id  | Admin, Receptionist | Reschedule booking               |
| DELETE | /bookings/:id  | Admin, Receptionist | Cancel booking                   |
| GET    | /slots         | Admin, Receptionist | Get available slots              |

GET /bookings supports query filters: `centerId`, `date`, `therapistId`, `bookingStatus`, `customerPhone`

### Reports (Admin Only)
| Method | Endpoint                      | Description                         |
|--------|-------------------------------|-------------------------------------|
| GET    | /reports/booking-trends       | Daily/Weekly/Monthly booking counts |
| GET    | /reports/therapist-utilization| Hours booked per therapist          |
| GET    | /reports/peak-times           | Most popular booking time slots     |
| GET    | /reports/cancellations        | Cancellation and no-show stats      |
| GET    | /reports/customer-history     | Booking history per customer phone  |

All report endpoints support: `centerId`, `startDate`, `endDate`, `period` (daily/weekly/monthly)

## Required Joins Per Endpoint

### GET /bookings
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

### GET /centers/:id
```javascript
include: [
  { model: Therapist, as: 'therapists', attributes: ['therapistId', 'firstName', 'lastName', 'gender', 'skillSet'], where: { status: true }, required: false },
  { model: Room,      as: 'rooms',      attributes: ['roomId', 'roomName', 'roomType'],                              where: { status: true }, required: false }
]
```

### GET /therapists
```javascript
include: [
  { model: Center,       as: 'center',      attributes: ['centerId', 'name', 'city'] },
  { model: WorkingHours, as: 'workingHours', attributes: ['dayOfWeek', 'startTime', 'endTime', 'breakStartTime', 'breakEndTime'] }
]
```

### GET /therapists/:id
```javascript
include: [
  { model: Center,         as: 'center',      attributes: ['centerId', 'name', 'city'] },
  { model: WorkingHours,   as: 'workingHours', attributes: ['dayOfWeek', 'startTime', 'endTime', 'breakStartTime', 'breakEndTime'] },
  { model: TherapistLeave, as: 'leaves',       attributes: ['leaveId', 'leaveDate', 'reason'] }
]
```

### GET /therapies
```javascript
include: [{ model: TherapyCategory, as: 'category', attributes: ['categoryId', 'categoryName'] }]
```

### GET /rooms
```javascript
include: [{ model: Center, as: 'center', attributes: ['centerId', 'name', 'city'] }]
```

### GET /working-hours
```javascript
include: [
  { model: Therapist, as: 'therapist', attributes: ['therapistId', 'firstName', 'lastName'] },
  { model: Center,    as: 'center',    attributes: ['centerId', 'name'] }
]
```

### GET /leaves
```javascript
include: [{ model: Therapist, as: 'therapist', attributes: ['therapistId', 'firstName', 'lastName', 'centerId'] }]
```

## Additional Requirements

- Use `bcryptjs` for password hashing — never store plain text passwords
- All list endpoints must support pagination: `?page=1&limit=10`
- Use Sequelize migrations — never `sequelize.sync({ force: true })`
- Register all routes under `/api/v1` prefix in `app.js`
- All controllers must use try/catch and pass errors to global `errorHandler.js`
- Log all errors to console with timestamps

## Out of Scope

Do NOT implement the following in this phase:

- Payment gateway integration
- Multi-language support
- Loyalty or wallet system
- External marketplace integrations
- Mobile app or frontend UI
- JWT refresh tokens
- WhatsApp notifications
- Manual therapist/room selection (auto-assign only)

## Agent Guide

For AI-assisted development, refer to `AGENTS.md` for coding standards
and `SKILL.md` for slot allocation and notification workflows.
