# System Architecture

## Data Model

- **User**: System operators with role `Admin` or `Receptionist`. Auth via JWT.
- **Center**: A wellness center location with opening/closing hours and contact info.
- **TherapyCategory**: Top-level grouping (e.g. Physiotherapy, Spa, Ayurveda).
- **TherapyService**: A specific therapy under a category with duration, price, required room type, and required skill.
- **Therapist**: A staff member with gender, skillSet (JSON array), and center assignment.
- **Room**: A physical room at a center with a type (Spa Room, Hydro Room, Physiotherapy Room).
- **WorkingHours**: Therapist-level schedule per day of week including break times.
- **TherapistLeave**: Date-specific leave records per therapist.
- **Booking**: Connects Center + TherapyService + Therapist + Room with appointment time and customer info.

## Table Relationships

| Parent Model    | Child Model      | Type        | Foreign Key  |
|-----------------|------------------|-------------|--------------|
| Center          | Therapist        | One-to-Many | centerId     |
| Center          | Room             | One-to-Many | centerId     |
| Center          | Booking          | One-to-Many | centerId     |
| Center          | WorkingHours     | One-to-Many | centerId     |
| TherapyCategory | TherapyService   | One-to-Many | categoryId   |
| TherapyService  | Booking          | One-to-Many | therapyId    |
| Therapist       | Booking          | One-to-Many | therapistId  |
| Therapist       | WorkingHours     | One-to-Many | therapistId  |
| Therapist       | TherapistLeave   | One-to-Many | therapistId  |
| Room            | Booking          | One-to-Many | roomId       |

## Sequelize Associations (models/index.js)

```javascript
Center.hasMany(Therapist,        { foreignKey: 'centerId',    as: 'therapists',    onDelete: 'RESTRICT' });
Center.hasMany(Room,             { foreignKey: 'centerId',    as: 'rooms',         onDelete: 'RESTRICT' });
Center.hasMany(Booking,          { foreignKey: 'centerId',    as: 'bookings',      onDelete: 'RESTRICT' });
Center.hasMany(WorkingHours,     { foreignKey: 'centerId',    as: 'workingHours',  onDelete: 'CASCADE'  });

Therapist.belongsTo(Center,         { foreignKey: 'centerId',    as: 'center'       });
Therapist.hasMany(Booking,          { foreignKey: 'therapistId', as: 'bookings',    onDelete: 'RESTRICT' });
Therapist.hasMany(WorkingHours,     { foreignKey: 'therapistId', as: 'workingHours',onDelete: 'CASCADE'  });
Therapist.hasMany(TherapistLeave,   { foreignKey: 'therapistId', as: 'leaves',      onDelete: 'CASCADE'  });

Room.belongsTo(Center,          { foreignKey: 'centerId',    as: 'center'  });
Room.hasMany(Booking,           { foreignKey: 'roomId',      as: 'bookings', onDelete: 'RESTRICT' });

TherapyCategory.hasMany(TherapyService, { foreignKey: 'categoryId', as: 'therapies', onDelete: 'RESTRICT' });
TherapyService.belongsTo(TherapyCategory, { foreignKey: 'categoryId', as: 'category' });
TherapyService.hasMany(Booking,           { foreignKey: 'therapyId',  as: 'bookings', onDelete: 'RESTRICT' });

WorkingHours.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });
WorkingHours.belongsTo(Center,    { foreignKey: 'centerId',    as: 'center'    });

TherapistLeave.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });

Booking.belongsTo(Center,         { foreignKey: 'centerId',    as: 'center'    });
Booking.belongsTo(TherapyService, { foreignKey: 'therapyId',   as: 'therapy'   });
Booking.belongsTo(Therapist,      { foreignKey: 'therapistId', as: 'therapist' });
Booking.belongsTo(Room,           { foreignKey: 'roomId',      as: 'room'      });
```

## Folder Structure

```
/wellness-backend
  /src
    /config
      db.js                       # Sequelize DB connection
      env.js                      # Environment variable loader
    /models
      index.js                    # Sequelize model registry + all associations
      user.js
      center.js
      therapyCategory.js
      therapyService.js
      therapist.js
      room.js
      booking.js
      workingHours.js
      therapistLeave.js
    /migrations                   # Sequelize migration files (one per table)
    /seeders                      # Optional seed data
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
      authMiddleware.js           # JWT token verification
      roleMiddleware.js           # Role-based access control
      errorHandler.js             # Global error handler
    /services
      slotService.js              # Slot generation + therapist/room auto-allocation
      notificationService.js      # Nodemailer + Twilio integration
    /utils
      responseHelper.js           # Standard API response formatter
  /tests
  .env
  .env.example
  app.js
  server.js
  package.json
```

## Request Lifecycle

1. Receptionist selects center + therapy + date + gender preference → calls `GET /slots`
2. `slotService.js` checks therapist availability, working hours, leaves, room availability → returns valid slots
3. Receptionist selects a slot → calls `POST /bookings`
4. System auto-assigns best-matched therapist (fewest bookings that day) and first available room
5. Booking record created → `notificationService.js` sends Email + SMS confirmation to customer
6. Admin monitors all bookings via calendar view in dashboard using `GET /bookings` with filters
7. Admin accesses analytics via `GET /reports/*` endpoints
