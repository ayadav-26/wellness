# Feature Prompt: Center Discovery, Therapy Search & Slot Allocation APIs

---

## Objective

Extend the existing backend with a set of **discovery and search APIs** that power the booking flow from the frontend. These endpoints cover:

1. Center listing with real-time availability indicators
2. Therapy browsing by category, filterable by center
3. Reverse lookup — which centers offer a given therapy
4. Slot availability with automated therapist & room matching

All endpoints must follow the existing standard API response format and support pagination via `?page=1&limit=10`.

---

## Feature 1: Center Selection API

### Overview

When a user or receptionist begins a booking, they first select a center. This API returns all active centers enriched with their operational hours and a real-time availability flag indicating whether any bookable slot exists for the current day.

---

### Endpoint

```http
GET /api/v1/centers
```

**Access:** Admin, Receptionist, User
**Already exists** — extend the existing `GET /centers` controller with the additions below. Do not create a new route.

---

### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `city` | STRING | Filter centers by city (case-insensitive, partial match) |
| `hasAvailability` | BOOLEAN | If `true`, return only centers that have at least one available slot today |
| `page` | INTEGER | Pagination — page number (default: 1) |
| `limit` | INTEGER | Pagination — results per page (default: 10) |

---

### Required Response Fields

Each center object in the response must include:

```json
{
  "centerId": 1,
  "name": "Serenity Wellness - Andheri",
  "address": "123 Link Road, Andheri West",
  "city": "Mumbai",
  "contactNumber": "9876543210",
  "openingTime": "09:00:00",
  "closingTime": "21:00:00",
  "therapyCategories": [
    {
      "categoryId": 2,
      "categoryName": "Spa"
    },
    {
      "categoryId": 3,
      "categoryName": "Ayurveda"
    }
  ],
  "hasAvailabilityToday": true
}
```

**`hasAvailabilityToday` Calculation Logic:**

- Query the center's active therapists who are working today (check `WorkingHours.dayOfWeek` matches today)
- Exclude therapists on leave today (check `TherapistLeaves.leaveDate`)
- If at least one therapist has a working slot that is not fully booked → set `hasAvailabilityToday: true`
- This must be computed per center, not globally. Use a lightweight count query — do NOT run full slot generation for this field.

---

### Controller Changes

Update `centerController.js` → `getAllCenters` function:

```javascript
// Include linked therapy categories
include: [
  {
    model: TherapyCategory,
    as: 'therapyCategories',
    where: { status: true },
    required: false,
    through: { attributes: [] },
    attributes: ['categoryId', 'categoryName']
  }
]
```

Compute `hasAvailabilityToday` as a separate async step after fetching centers, using a helper function `computeCenterAvailabilityToday(centerId)` in `slotService.js`.

---

---

## Feature 2: Therapy Search API

This is the core discovery API. It supports two search directions:

- **Direction A:** Given a center → return all therapies offered at that center
- **Direction B:** Given a therapy (or therapy name) → return all centers that offer it

Both directions are served by a single endpoint using different query parameters.

---

### Endpoint

```http
GET /api/v1/search/therapies
```

**Access:** Admin, Receptionist, User

Create a new route file `/src/routes/searchRoutes.js` and controller `/src/controllers/searchController.js`.

Register in `app.js`:

```javascript
app.use('/api/v1/search', searchRoutes);
```

---

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `centerId` | INTEGER | Conditional | Search therapies offered at this center |
| `therapyName` | STRING | Conditional | Partial/full name search across therapy services |
| `categoryId` | INTEGER | Optional | Filter by therapy category |
| `page` | INTEGER | Optional | Default: 1 |
| `limit` | INTEGER | Optional | Default: 10 |

**Validation rule:** At least one of `centerId` or `therapyName` must be provided. If neither is present, return `400 Bad Request`:

```json
{
  "success": false,
  "message": "Provide at least one search parameter: centerId or therapyName",
  "code": 400
}
```

---

### Direction A — Therapies by Center

**Request:**
```http
GET /api/v1/search/therapies?centerId=1
GET /api/v1/search/therapies?centerId=1&categoryId=2
```

**Logic:**
1. Verify center exists and is active
2. Load all `TherapyCategory` records linked to this center via `CenterTherapyCategories`
3. For each linked category, load its active `TherapyService` records
4. If `categoryId` is also provided, filter to only that category

**Response:**

```json
{
  "success": true,
  "message": "Therapies fetched successfully",
  "data": {
    "center": {
      "centerId": 1,
      "name": "Serenity Wellness - Andheri",
      "city": "Mumbai",
      "openingTime": "09:00:00",
      "closingTime": "21:00:00"
    },
    "categories": [
      {
        "categoryId": 2,
        "categoryName": "Spa",
        "therapies": [
          {
            "therapyId": 5,
            "therapyName": "Deep Tissue Massage",
            "durationMinutes": 60,
            "price": "1500.00",
            "requiredRoomType": "Spa Room",
            "requiredSkill": "Deep Tissue"
          },
          {
            "therapyId": 6,
            "therapyName": "Hot Stone Therapy",
            "durationMinutes": 90,
            "price": "2200.00",
            "requiredRoomType": "Spa Room",
            "requiredSkill": "Hot Stone"
          }
        ]
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### Direction B — Centers by Therapy

**Request:**
```http
GET /api/v1/search/therapies?therapyName=massage
GET /api/v1/search/therapies?therapyName=massage&categoryId=2
```

**Logic:**
1. Search `TherapyService` where `therapyName ILIKE '%massage%'` (case-insensitive partial match)
2. For each matched therapy, look up which centers have its `categoryId` linked via `CenterTherapyCategories`
3. Also verify those centers are active (`status: true`)
4. Return matched therapies grouped with their available centers

**Response:**

```json
{
  "success": true,
  "message": "Therapies fetched successfully",
  "data": {
    "results": [
      {
        "therapyId": 5,
        "therapyName": "Deep Tissue Massage",
        "categoryId": 2,
        "categoryName": "Spa",
        "durationMinutes": 60,
        "price": "1500.00",
        "requiredRoomType": "Spa Room",
        "availableAtCenters": [
          {
            "centerId": 1,
            "name": "Serenity Wellness - Andheri",
            "city": "Mumbai",
            "openingTime": "09:00:00",
            "closingTime": "21:00:00"
          },
          {
            "centerId": 3,
            "name": "Serenity Wellness - Bandra",
            "city": "Mumbai",
            "openingTime": "10:00:00",
            "closingTime": "22:00:00"
          }
        ]
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### Sequelize Query for Direction B

```javascript
const therapies = await TherapyService.findAll({
  where: {
    therapyName: { [Op.iLike]: `%${therapyName}%` },
    status: true,
    ...(categoryId && { categoryId })
  },
  include: [
    {
      model: TherapyCategory,
      as: 'category',
      attributes: ['categoryId', 'categoryName'],
      where: { status: true },
      required: true,
      include: [
        {
          model: Center,
          as: 'centers',
          attributes: ['centerId', 'name', 'city', 'openingTime', 'closingTime'],
          where: { status: true },
          required: false,
          through: { attributes: [] }
        }
      ]
    }
  ]
});
```

---

---

## Feature 3: Gender Preference Filter on Slot API

### Overview

The existing `GET /api/v1/slots` endpoint already supports `genderPreference`. This section documents the required behavior explicitly and adds a therapist preview to the slot response.

---

### Endpoint

```http
GET /api/v1/slots
```

**Access:** Admin, Receptionist, User (no change to existing route)

---

### Query Parameters (existing + additions)

| Parameter | Type | Required | Description |
|---|---|---|---|
| `centerId` | INTEGER | Yes | Target center |
| `therapyId` | INTEGER | Yes | Therapy to be booked |
| `date` | DATE (YYYY-MM-DD) | Yes | Requested date |
| `genderPreference` | ENUM | Yes | `Male`, `Female`, or `NoPreference` |

---

### Slot Generation Logic (Full Specification)

The `slotService.js` must implement the following steps in order:

**Step 1 — Load Therapy Details**

Fetch `TherapyService` by `therapyId`. Extract `durationMinutes`, `requiredRoomType`, and `requiredSkill`.

**Step 2 — Validate Center–Therapy Mapping**

Check that a `CenterTherapyCategory` row exists for `(centerId, therapy.categoryId)`. If not, return `400` with message: `"This therapy is not available at the selected center"`.

**Step 3 — Load Matching Therapists**

Load all active therapists at the center who:
- Have `requiredSkill` in their `skillSet` JSON array
- Match `genderPreference` (skip gender filter if `NoPreference`)
- Are NOT on leave on the requested date (no matching row in `TherapistLeaves`)
- Have a `WorkingHours` row for the requested day of week

Use a single query with nested includes to avoid N+1 queries:

```javascript
Therapist.findAll({
  where: {
    centerId,
    status: true,
    ...(genderPreference !== 'NoPreference' && { gender: genderPreference }),
    skillSet: { [Op.contains]: [requiredSkill] }
  },
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
        appointmentStartTime: { [Op.between]: [dayStart, dayEnd] },
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

**Step 4 — Filter Out Therapists on Leave**

After the query, discard any therapist where `leaves.length > 0`.

**Step 5 — Load Available Rooms**

Fetch all active rooms at the center where `roomType === requiredRoomType`.

**Step 6 — Generate Candidate Slots**

For each matching therapist, iterate through their working hours in increments of `durationMinutes`:

- Skip any time window that falls within `breakStartTime` to `breakEndTime`
- For each candidate window (`slotStart` to `slotStart + durationMinutes`):
  - Check no existing therapist booking overlaps this window (with 15-minute buffer after end)
  - Check at least one room of the required type has no overlapping booking in this window (also with 15-minute buffer)
  - If both checks pass → add to available slots

**Step 7 — Apply 15-Minute Buffer**

A slot is invalid if it starts within 15 minutes of the end of any existing booking for that therapist or room. Buffer applies to prevent back-to-back bookings without cleaning/setup time.

```javascript
const bufferMinutes = 15;
const effectiveEnd = existingBookingEnd + bufferMinutes;
// New slot start must be >= effectiveEnd
```

**Step 8 — Return Available Slots**

```json
{
  "success": true,
  "message": "Available slots fetched successfully",
  "data": {
    "therapy": {
      "therapyId": 5,
      "therapyName": "Deep Tissue Massage",
      "durationMinutes": 60,
      "price": "1500.00"
    },
    "date": "2025-08-15",
    "genderPreference": "Female",
    "slots": [
      {
        "startTime": "2025-08-15T10:00:00",
        "endTime": "2025-08-15T11:00:00",
        "therapist": {
          "therapistId": 4,
          "firstName": "Priya",
          "lastName": "Sharma",
          "gender": "Female",
          "experienceYears": 5
        },
        "room": {
          "roomId": 2,
          "roomName": "Spa Room A",
          "roomType": "Spa Room"
        }
      },
      {
        "startTime": "2025-08-15T11:15:00",
        "endTime": "2025-08-15T12:15:00",
        "therapist": {
          "therapistId": 4,
          "firstName": "Priya",
          "lastName": "Sharma",
          "gender": "Female",
          "experienceYears": 5
        },
        "room": {
          "roomId": 2,
          "roomName": "Spa Room A",
          "roomType": "Spa Room"
        }
      }
    ],
    "totalSlots": 2
  }
}
```

**No slots available response:**

If `genderPreference` is `Male` or `Female` and no therapist of that gender is available:

```json
{
  "success": false,
  "message": "No available therapist matches the requested gender preference for this slot",
  "code": 400
}
```

If there are matching therapists but all slots are booked:

```json
{
  "success": true,
  "message": "No available slots for the selected date",
  "data": {
    "slots": [],
    "totalSlots": 0
  }
}
```

---

---

## Files to Create

| File | Purpose |
|---|---|
| `src/controllers/searchController.js` | Therapy search logic (Direction A and B) |
| `src/routes/searchRoutes.js` | Route definitions for search endpoints |

---

## Files to Modify

| File | Change |
|---|---|
| `src/controllers/centerController.js` | Add `therapyCategories` include and `hasAvailabilityToday` to `getAllCenters` |
| `src/services/slotService.js` | Add `computeCenterAvailabilityToday()`, full slot generation spec above, 15-min buffer logic |
| `app.js` | Register `/api/v1/search` route group |

---

## API Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/v1/centers | Admin, Receptionist, User | List centers with categories and today's availability |
| GET | /api/v1/search/therapies | Admin, Receptionist, User | Search therapies by center OR search centers by therapy name |
| GET | /api/v1/slots | Admin, Receptionist, User | Get available slots with therapist preview and gender filter |

---

## Out of Scope for This Feature

- Manual therapist selection by the user (auto-assign only — manual selection is a future version)
- Payment or pricing logic (price is display-only)
- Therapist ratings or reviews
- Waitlist for fully-booked slots
