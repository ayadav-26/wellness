const { sequelize } = require('../config/db');
const User = require('./user');
const Center = require('./center');
const TherapyCategory = require('./therapyCategory');
const TherapyService = require('./therapyService');
const Therapist = require('./therapist');
const Room = require('./room');
const WorkingHours = require('./workingHours');
const TherapistLeave = require('./therapistLeave');
const Booking = require('./booking');
const CenterTherapyCategory = require('./centerTherapyCategory');
const Skill = require('./skill');
const RolePermission = require('./rolePermission');

// --- ASSOCIATIONS ---

// Center associations
Center.hasMany(Therapist,       { foreignKey: 'centerId',    as: 'therapists',   onDelete: 'RESTRICT' });
Center.hasMany(Room,            { foreignKey: 'centerId',    as: 'rooms',        onDelete: 'RESTRICT' });
Center.hasMany(Booking,         { foreignKey: 'centerId',    as: 'bookings',     onDelete: 'RESTRICT' });
Center.hasMany(WorkingHours,    { foreignKey: 'centerId',    as: 'workingHours', onDelete: 'CASCADE'  });
Center.hasMany(User,            { foreignKey: 'centerId',    as: 'users',        onDelete: 'SET NULL' });

// Therapist associations
Therapist.belongsTo(Center,         { foreignKey: 'centerId',    as: 'center'       });
Therapist.hasMany(Booking,          { foreignKey: 'therapistId', as: 'bookings',    onDelete: 'RESTRICT' });
Therapist.hasMany(WorkingHours,     { foreignKey: 'therapistId', as: 'workingHours',onDelete: 'CASCADE'  });
Therapist.hasMany(TherapistLeave,   { foreignKey: 'therapistId', as: 'leaves',      onDelete: 'CASCADE'  });

// Room associations
Room.belongsTo(Center,     { foreignKey: 'centerId', as: 'center'   });
Room.hasMany(Booking,      { foreignKey: 'roomId',   as: 'bookings', onDelete: 'RESTRICT' });

// TherapyCategory associations
TherapyCategory.hasMany(TherapyService, { foreignKey: 'categoryId', as: 'therapies', onDelete: 'RESTRICT' });
TherapyService.belongsTo(TherapyCategory, { foreignKey: 'categoryId', as: 'category' });
TherapyService.hasMany(Booking, { foreignKey: 'therapyId', as: 'bookings', onDelete: 'RESTRICT' });

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

// WorkingHours + TherapistLeave associations
WorkingHours.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });
WorkingHours.belongsTo(Center,    { foreignKey: 'centerId',    as: 'center'    });
TherapistLeave.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });

// Booking associations
Booking.belongsTo(Center,         { foreignKey: 'centerId',    as: 'center'    });
Booking.belongsTo(TherapyService, { foreignKey: 'therapyId',   as: 'therapy'   });
Booking.belongsTo(Therapist,      { foreignKey: 'therapistId', as: 'therapist' });
Booking.belongsTo(Room,           { foreignKey: 'roomId',      as: 'room'      });

// User associations
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });
User.hasMany(Booking,   { foreignKey: 'userId', as: 'bookings' });
User.belongsTo(Center,  { foreignKey: 'centerId', as: 'center' });

module.exports = {
    sequelize,
    User,
    Center,
    TherapyCategory,
    TherapyService,
    Therapists: Therapist, // Export as 'Therapists' or keep singular? User asked for named exports.
    Therapist,
    Room,
    WorkingHours,
    TherapistLeave,
    Booking,
    CenterTherapyCategory,
    Skill,
    RolePermission
};
