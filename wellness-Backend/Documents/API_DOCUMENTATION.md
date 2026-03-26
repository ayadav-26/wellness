# WellnessHub API Reference v1.0

This document provides a detailed reference for the WellnessHub Wellness Center Booking System REST API.

**Base URL:** `http://localhost:3000/api/v1`

---

## GROUP 1: Authentication

### 1. Register User
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/auth/register`
**Access:** Admin only
**Description:** Registers a new user (Admin or Receptionist) into the system.

**Headers:**
| Key           | Value            | Required |
|---------------|------------------|----------|
| Content-Type  | application/json | Yes      |
| Authorization | Bearer <token>   | Yes      |

**Request Body:**
```json
{
  "firstName": "Rajesh",
  "lastName": "Sharma",
  "email": "rajesh.sharma@wellness.com",
  "phoneNumber": "+919876543210",
  "password": "Password@123",
  "role": "Receptionist"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": 2,
    "firstName": "Rajesh",
    "lastName": "Sharma",
    "email": "rajesh.sharma@wellness.com",
    "phoneNumber": "+919876543210",
    "role": "Receptionist",
    "status": true,
    "createdAt": "2026-03-16T12:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400    | Missing required fields |
| 409    | Email already exists |
| 401    | Invalid or expired token |

---

### 2. Login User
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/auth/login`
**Access:** Public
**Description:** Authenticates a user and returns a JWT token.

**Headers:**
| Key          | Value            | Required |
|--------------|------------------|----------|
| Content-Type | application/json | Yes      |

**Request Body:**
```json
{
  "email": "admin@wellness.com",
  "password": "Admin@1234"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@wellness.com",
      "role": "Admin"
    }
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 401    | Invalid credentials |
| 400    | Email and password are required |

---

### 3. Logout
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/auth/logout`
**Access:** Public/Authenticated
**Description:** Logs out the user (client-side disposal of token).

**Headers:**
| Key           | Value            | Required |
|---------------|------------------|----------|
| Authorization | Bearer <token>   | Yes      |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

## GROUP 2: Centers

### 4. Create Center
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/centers`
**Access:** Admin only
**Description:** Creates a new wellness center.

**Headers:**
| Key           | Value            | Required |
|---------------|------------------|----------|
| Content-Type  | application/json | Yes      |
| Authorization | Bearer <token>   | Yes      |

**Request Body:**
```json
{
  "name": "Wellness Palms Mumbai",
  "address": "123 Marine Drive",
  "city": "Mumbai",
  "contactNumber": "+912222334455",
  "openingTime": "09:00",
  "closingTime": "21:00"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Center created successfully",
  "data": {
    "centerId": 1,
    "name": "Wellness Palms Mumbai",
    "address": "123 Marine Drive",
    "city": "Mumbai",
    "contactNumber": "+912222334455",
    "openingTime": "09:00:00",
    "closingTime": "21:00:00",
    "status": true
  }
}
```

---

### 5. List Centers
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/centers?page=1&limit=10`
**Access:** Admin + Receptionist
**Description:** Retrieves a paginated list of active wellness centers.

**Query Parameters:**
| Parameter       | Example | Description |
|-----------------|---------|-------------|
| page            | 1       | Page number |
| limit           | 10      | Records per page |
| includeInactive | true    | Show inactive centers (Admin only) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Centers retrieved successfully",
  "data": {
    "data": [
      {
        "centerId": 1,
        "name": "Wellness Palms Mumbai",
        "city": "Mumbai",
        "status": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 6. Get Center Detail
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/centers/1`
**Access:** Admin + Receptionist
**Description:** Retrieves details of a specific center including its therapists and rooms.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Center retrieved successfully",
  "data": {
    "centerId": 1,
    "name": "Wellness Palms Mumbai",
    "city": "Mumbai",
    "therapists": [...],
    "rooms": [...]
  }
}
```

---

### 7. Update Center
**Method:** `PUT`
**URL:** `http://localhost:3000/api/v1/centers/1`
**Access:** Admin only
**Description:** Updates an existing center's information.

**Request Body:**
```json
{
  "name": "Wellness Palms Marine Drive",
  "closingTime": "22:00"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Center updated successfully",
  "data": {
    "centerId": 1,
    "name": "Wellness Palms Marine Drive",
    "closingTime": "22:00:00"
  }
}
```

---

### 8. Delete Center
**Method:** `DELETE`
**URL:** `http://localhost:3000/api/v1/centers/1`
**Access:** Admin only
**Description:** Soft-deletes a center by setting status to false.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Center deactivated successfully",
  "data": null
}
```

---

## GROUP 3: Therapy Categories

### 9. Create Category
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/categories`
**Access:** Admin only
**Description:** Creates a new therapy category (e.g., Massage, Ayurvedic).

**Request Body:**
```json
{
  "categoryName": "Ayurvedic Treatments",
  "description": "Traditional Indian healing therapies"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "categoryId": 1,
    "categoryName": "Ayurvedic Treatments"
  }
}
```

---

### 10. List Categories
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/categories?page=1&limit=10`
**Access:** Admin + Receptionist
**Description:** Retrieves a paginated list of therapy categories.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "data": [...],
    "pagination": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
  }
}
```

---

### 11. Update Category
**Method:** `PUT`
**URL:** `http://localhost:3000/api/v1/categories/1`
**Access:** Admin only
**Description:** Updates a therapy category.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": { "categoryId": 1, "categoryName": "Updated Name" }
}
```

---

### 12. Delete Category
**Method:** `DELETE`
**URL:** `http://localhost:3000/api/v1/categories/1`
**Access:** Admin only
**Description:** Soft-deletes a therapy category.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category deactivated successfully",
  "data": null
}
```

---

## GROUP 4: Therapy Services

### 13. Create Therapy
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/therapies`
**Access:** Admin only
**Description:** Creates a new therapy service.

**Request Body:**
```json
{
  "therapyName": "Abhyanga Massage",
  "categoryId": 1,
  "durationMinutes": 60,
  "price": 2500,
  "requiredRoomType": "Massage Room",
  "requiredSkill": "Ayurveda"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Therapy service created successfully",
  "data": { "therapyId": 1, "therapyName": "Abhyanga Massage" }
}
```

---

### 14. List Therapies
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/therapies?page=1&limit=10`
**Access:** Admin + Receptionist

**Success Response (200):**
```json
{
  "success": true,
  "message": "Therapy services retrieved successfully",
  "data": { "data": [...], "pagination": {...} }
}
```

---

### 15. Update Therapy
**Method:** `PUT`
**URL:** `http://localhost:3000/api/v1/therapies/1`
**Access:** Admin only

**Success Response (200):**
```json
{ "success": true, "message": "Therapy service updated successfully", "data": {...} }
```

---

### 16. Delete Therapy
**Method:** `DELETE`
**URL:** `http://localhost:3000/api/v1/therapies/1`
**Access:** Admin only

**Success Response (200):**
```json
{ "success": true, "message": "Therapy service deactivated successfully", "data": null }
```

---

## GROUP 5: Therapists

### 17. Create Therapist
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/therapists`
**Access:** Admin only
**Description:** Registers a new therapist.

**Request Body:**
```json
{
  "firstName": "Priya",
  "lastName": "Nair",
  "gender": "Female",
  "experienceYears": 5,
  "skillSet": ["Ayurveda", "Deep Tissue"],
  "centerId": 1,
  "phoneNumber": "+919988776655"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Therapist created successfully",
  "data": { "therapistId": 1, "firstName": "Priya", "status": true }
}
```

---

### 18. List Therapists
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/therapists?page=1&limit=10&centerId=1`
**Access:** Admin + Receptionist

**Success Response (200):**
```json
{
  "success": true,
  "message": "Therapists retrieved successfully",
  "data": { "data": [...], "pagination": {...} }
}
```

---

### 19. Get Therapist Detail
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/therapists/1`
**Access:** Admin + Receptionist
**Description:** Retrieves therapist info, working hours, and leaves.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Therapist retrieved successfully",
  "data": {
    "therapistId": 1,
    "firstName": "Priya",
    "workingHours": [...],
    "leaves": [...]
  }
}
```

---

### 20. Update Therapist
**Method:** `PUT`
**URL:** `http://localhost:3000/api/v1/therapists/1`
**Access:** Admin only

**Success Response (200):**
```json
{ "success": true, "message": "Therapist updated successfully", "data": {...} }
```

---

### 21. Delete Therapist
**Method:** `DELETE`
**URL:** `http://localhost:3000/api/v1/therapists/1`
**Access:** Admin only

**Success Response (200):**
```json
{ "success": true, "message": "Therapist deactivated successfully", "data": null }
```

---

## GROUP 6: Rooms

### 22. Create Room
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/rooms`
**Access:** Admin only

**Request Body:**
```json
{
  "centerId": 1,
  "roomName": "Room A1",
  "roomType": "Massage Room",
  "capacity": 1
}
```

**Success Response (201):**
```json
{ "success": true, "message": "Room created successfully", "data": { "roomId": 1 } }
```

---

### 23. List Rooms
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/rooms?page=1&limit=10&centerId=1`
**Access:** Admin + Receptionist

**Success Response (200):**
```json
{ "success": true, "message": "Rooms retrieved successfully", "data": { "data": [...], "pagination": {...} } }
```

---

### 24. Update Room
**Method:** `PUT`
**URL:** `http://localhost:3000/api/v1/rooms/1`
**Access:** Admin only

**Success Response (200):**
```json
{ "success": true, "message": "Room updated successfully", "data": {...} }
```

---

### 25. Delete Room
**Method:** `DELETE`
**URL:** `http://localhost:3000/api/v1/rooms/1`
**Access:** Admin only

**Success Response (200):**
```json
{ "success": true, "message": "Room deactivated successfully", "data": null }
```

---

## GROUP 7: Working Hours

### 26. Create Working Hours
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/working-hours`
**Access:** Admin only

**Request Body:**
```json
{
  "therapistId": 1,
  "centerId": 1,
  "dayOfWeek": "Monday",
  "startTime": "09:00",
  "endTime": "18:00",
  "breakStartTime": "13:00",
  "breakEndTime": "14:00"
}
```

**Success Response (201):**
```json
{ "success": true, "message": "Working hours created successfully", "data": { "id": 1 } }
```

---

### 27. List Working Hours
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/working-hours?therapistId=1`
**Access:** Admin + Receptionist

**Success Response (200):**
```json
{ "success": true, "message": "Working hours retrieved successfully", "data": { "data": [...], "pagination": {...} } }
```

---

### 28. Update Working Hours
**Method:** `PUT`
**URL:** `http://localhost:3000/api/v1/working-hours/1`
**Access:** Admin only

**Success Response (200):**
```json
{ "success": true, "message": "Working hours updated successfully", "data": {...} }
```

---

### 29. Delete Working Hours
**Method:** `DELETE`
**URL:** `http://localhost:3000/api/v1/working-hours/1`
**Access:** Admin only (Hard Delete)

**Success Response (200):**
```json
{ "success": true, "message": "Working hours record deleted successfully", "data": null }
```

---

## GROUP 8: Therapist Leaves

### 30. Create Leave
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/leaves`
**Access:** Admin only

**Request Body:**
```json
{
  "therapistId": 1,
  "leaveDate": "2026-03-20",
  "reason": "Family Emergency"
}
```

**Success Response (201):**
```json
{ "success": true, "message": "Leave record created successfully", "data": { "leaveId": 1 } }
```

---

### 31. List Leaves
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/leaves?therapistId=1`
**Access:** Admin + Receptionist

**Success Response (200):**
```json
{ "success": true, "message": "Leave records retrieved successfully", "data": { "data": [...], "pagination": {...} } }
```

---

### 32. Delete Leave
**Method:** `DELETE`
**URL:** `http://localhost:3000/api/v1/leaves/1`
**Access:** Admin only (Hard Delete)

**Success Response (200):**
```json
{ "success": true, "message": "Leave record deleted successfully", "data": null }
```

---

## GROUP 9: Bookings & Slots

### 33. Get Available Slots
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/slots?centerId=1&therapyId=1&date=2026-03-18&genderPreference=NoPreference`
**Access:** Admin + Receptionist
**Description:** Calculates and returns available time windows for a therapy at a specific center.

**Query Parameters:**
| Parameter | Example | Required |
|-----------|---------|----------|
| centerId  | 1       | Yes      |
| therapyId | 1       | Yes      |
| date      | 2026-03-18 | Yes |
| genderPreference | Male / Female / NoPreference | Yes |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Available slots retrieved successfully",
  "data": [
    {
      "startTime": "2026-03-18T09:00:00.000Z",
      "endTime": "2026-03-18T10:00:00.000Z",
      "therapistId": 1,
      "roomId": 3,
      "therapistName": "Priya Nair",
      "gender": "Female"
    },
    {
      "startTime": "2026-03-18T10:15:00.000Z",
      "endTime": "2026-03-18T11:15:00.000Z",
      "therapistId": 1,
      "roomId": 3,
      "therapistName": "Priya Nair",
      "gender": "Female"
    }
  ]
}
```

---

### 34. Create Booking
**Method:** `POST`
**URL:** `http://localhost:3000/api/v1/bookings`
**Access:** Admin + Receptionist
**Description:** Creates a new booking and triggers automated notifications.

**Request Body:**
```json
{
  "centerId": 1,
  "therapyId": 1,
  "appointmentStartTime": "2026-03-18T09:00:00.000Z",
  "therapistGenderPreference": "Female",
  "customerName": "Amit Patil",
  "customerPhone": "+919900112233"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "bookingId": 105,
    "customerName": "Amit Patil",
    "appointmentStartTime": "2026-03-18T09:00:00.000Z",
    "bookingStatus": "Booked"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400    | No available therapist matches requested gender preference |
| 404    | Center not found |

---

### 35. List Bookings
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/bookings?page=1&limit=10&centerId=1&date=2026-03-18`
**Access:** Admin + Receptionist

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": {
    "data": [
      {
        "bookingId": 105,
        "customerName": "Amit Patil",
        "appointmentStartTime": "2026-03-18T09:00:00.000Z",
        "center": { "name": "Wellness Palms Mumbai" },
        "therapy": { "therapyName": "Abhyanga Massage" },
        "therapist": { "firstName": "Priya", "lastName": "Nair" },
        "room": { "roomName": "Room A1" }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
  }
}
```

---

### 36. Reschedule Booking
**Method:** `PUT`
**URL:** `http://localhost:3000/api/v1/bookings/105`
**Access:** Admin + Receptionist

**Request Body:**
```json
{
  "appointmentStartTime": "2026-03-18T14:30:00.000Z"
}
```

**Success Response (200):**
```json
{ "success": true, "message": "Booking rescheduled successfully", "data": {...} }
```

---

### 37. Cancel Booking
**Method:** `DELETE`
**URL:** `http://localhost:3000/api/v1/bookings/105`
**Access:** Admin + Receptionist
**Description:** Sets booking status to 'Cancelled' and triggers notification.

**Success Response (200):**
```json
{ "success": true, "message": "Booking cancelled successfully", "data": null }
```

---

## GROUP 10: Reports (Admin Only)

### 38. Booking Trends
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/reports/booking-trends?period=daily&centerId=1&startDate=2026-03-01&endDate=2026-03-31`
**Access:** Admin Only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking trends retrieved successfully",
  "data": [
    { "date": "2026-03-01", "count": 12 },
    { "date": "2026-03-02", "count": 15 }
  ]
}
```

---

### 39. Therapist Utilization
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/reports/therapist-utilization?centerId=1`
**Access:** Admin Only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Therapist utilization retrieved successfully",
  "data": [
    {
      "therapistId": 1,
      "firstName": "Priya",
      "lastName": "Nair",
      "totalBookings": 45,
      "totalMinutes": 2700
    }
  ]
}
```

---

### 40. Peak Times
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/reports/peak-times?centerId=1`
**Access:** Admin Only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Peak times retrieved successfully",
  "data": [
    { "hour": 10, "count": 24 },
    { "hour": 11, "count": 18 }
  ]
}
```

---

### 41. Cancellation Stats
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/reports/cancellations?centerId=1`
**Access:** Admin Only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cancellation stats retrieved successfully",
  "data": {
    "totalBookings": 500,
    "cancelled": 25,
    "noShow": 10,
    "cancellationRate": "5.00%",
    "noShowRate": "2.00%"
  }
}
```

---

### 42. Customer History
**Method:** `GET`
**URL:** `http://localhost:3000/api/v1/reports/customer-history?customerPhone=+919900112233`
**Access:** Admin Only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Customer booking history retrieved successfully",
  "data": [
    {
      "bookingId": 105,
      "appointmentStartTime": "2026-03-18T09:00:00.000Z",
      "therapy": { "therapyName": "Abhyanga Massage" },
      "center": { "name": "Wellness Palms Mumbai" }
    }
  ]
}
```
