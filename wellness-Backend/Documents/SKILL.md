# Slot Allocation & Notification Skill

**Description**: Specialized logic for automated therapist/room allocation,
available slot generation, and multi-channel customer notifications.

---

## Slot Allocation (slotService.js)

### Instructions

1. Implement all slot logic in `/src/services/slotService.js`
2. For `GET /slots`, accept inputs: `centerId`, `therapyId`, `date`, `genderPreference`
3. Load the TherapyService to extract `durationMinutes`, `requiredRoomType`, `requiredSkill`
4. Filter active Therapists at that center who match ALL of:
   - Have `requiredSkill` inside their `skillSet` JSON array
   - Match `genderPreference` (Male / Female) — if `NoPreference`, skip gender filter
   - Are NOT on leave on the requested date (check TherapistLeave table)
5. For each qualifying therapist, load their WorkingHours for the requested `dayOfWeek`
6. Load all active Rooms at the center where `roomType` matches `requiredRoomType`
7. Generate candidate time slots by stepping through working hours in `durationMinutes` increments — skip break times
8. For each candidate slot (`startTime → startTime + durationMinutes`):
   - Verify no existing `Booked` Booking overlaps for that therapist
   - Verify no existing `Booked` Booking overlaps for any qualifying room
   - Apply a **15-minute buffer** after each session's `appointmentEndTime` (room cleaning window — no new slot starts here)
   - If therapist AND room are both free → slot is valid
9. Return array of valid slots: `{ startTime, endTime, therapistId, roomId }`

### Auto-Assignment on POST /bookings

1. Accept inputs: `centerId`, `therapyId`, `appointmentStartTime`, `therapistGenderPreference`, `customerName`, `customerPhone`
2. Run the same availability check as slot generation for the exact requested time
3. **Gender hard rule**: If `genderPreference` is `Male` or `Female` and NO therapist of that gender is available → return HTTP 400: `"No available therapist matches the requested gender preference for this slot"`. Do NOT fall back to another gender.
4. If multiple therapists qualify → pick the one with the **fewest Booked bookings on that date** (least loaded)
5. If multiple rooms qualify → pick the one with the **lowest roomId** (first available)
6. Auto-calculate: `appointmentEndTime = appointmentStartTime + durationMinutes`
7. Create the Booking record with assigned `therapistId` and `roomId`
8. Call `notificationService.sendBookingConfirmation()` — must be non-blocking

### Optimized Query Pattern (avoid N+1)

Load therapist + working hours + bookings + leaves in a single call:

```javascript
Therapist.findAll({
  where: { centerId, status: true, ...(genderFilter && { gender: genderFilter }) },
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

---

## Notification Service (notificationService.js)

### Instructions

1. Implement using **Nodemailer** for Email and **Twilio** for SMS
2. Retrieve all credentials from `.env` — never hardcode keys
3. All notification functions must be **non-blocking** — wrap in try/catch, log errors, never throw to the caller
4. Each notification must include: `customerName`, `therapyName`, `centerName`, `therapistName`, `appointmentStartTime`, `appointmentEndTime`

### Notification Events

| Event                | Trigger Point                        | Email | SMS |
|----------------------|--------------------------------------|-------|-----|
| Booking confirmation | After `POST /bookings` succeeds      | Yes   | Yes |
| Booking reminder     | Scheduled before appointment time    | Yes   | Yes |
| Booking cancellation | After `DELETE /bookings/:id` succeeds| Yes   | Yes |
| Booking reschedule   | After `PUT /bookings/:id` succeeds   | Yes   | Yes |

### Examples

```javascript
// Booking confirmation (called after booking is created)
await notificationService.sendBookingConfirmation({
  customerName: 'Rahul Shah',
  customerPhone: '+919876543210',
  customerEmail: 'rahul@email.com',
  therapyName: 'Deep Tissue Massage',
  centerName: 'WellnessHub - Andheri',
  therapistName: 'Dr. Priya Sharma',
  appointmentStartTime: '2025-06-10T10:00:00',
  appointmentEndTime: '2025-06-10T11:00:00'
});

// Booking cancellation (called after booking is cancelled)
await notificationService.sendBookingCancellation({ ... });
```
