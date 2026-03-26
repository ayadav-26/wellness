'use strict';

const { RolePermission } = require('../models');
const ROLES = require('../constants/roles');

const STATIC_LEGACY_MAP = {
  [ROLES.SUPER_ADMIN]: [
    'view_all_bookings', 'manage_own_bookings', 'book_therapy', 'view_available_slots',
    'reschedule_booking', 'cancel_booking', 'view_therapists', 'create_therapist',
    'update_therapist', 'delete_therapist', 'view_rooms', 'create_room', 'update_room',
    'delete_room', 'view_centers', 'create_center', 'update_center', 'delete_center',
    'view_categories', 'create_category', 'update_category', 'delete_category',
    'view_therapies', 'create_therapy', 'update_therapy', 'delete_therapy',
    'view_working_hours', 'manage_working_hours', 'view_leaves', 'manage_leaves',
    'view_analytics', 'create_admin', 'create_receptionist', 'delete_users'
  ],
  [ROLES.ADMIN]: [
    'view_all_bookings', 'manage_own_bookings', 'book_therapy', 'view_available_slots',
    'reschedule_booking', 'cancel_booking', 'view_therapists', 'create_therapist',
    'update_therapist', 'delete_therapist', 'view_rooms', 'create_room', 'update_room',
    'delete_room', 'view_centers', 'create_center', 'update_center', 'delete_center',
    'view_categories', 'create_category', 'update_category', 'delete_category',
    'view_therapies', 'create_therapy', 'update_therapy', 'delete_therapy',
    'view_working_hours', 'manage_working_hours', 'view_leaves', 'manage_leaves',
    'view_analytics', 'create_receptionist'
  ],
  [ROLES.RECEPTIONIST]: [
    'view_all_bookings', 'manage_own_bookings', 'book_therapy', 'view_available_slots',
    'reschedule_booking', 'cancel_booking', 'view_therapists', 'view_rooms', 'view_centers',
    'view_categories', 'view_therapies', 'view_working_hours', 'view_leaves'
  ],
  [ROLES.USER]: [
    'manage_own_bookings', 'book_therapy', 'view_available_slots', 'reschedule_booking',
    'cancel_booking', 'view_centers', 'view_categories', 'view_therapies'
  ]
};

/**
 * Seeds the default Role Permissions based on the static defined map.
 * This runs on startup and ensures every role has rows for all modules.
 * Existing configurations in the database are NOT overwritten (so Super Admin UI changes persist).
 */
const MODULES = [
  'Dashboard', 'Bookings', 'Centers', 'Categories', 'Therapies', 
  'Therapists', 'Rooms', 'WorkingHours', 'Leaves', 'Reports', 'UserManagement'
];

// Helper to deduce static flags based on old granular permissions
const hasGranular = (role, key) => (STATIC_LEGACY_MAP[role] || []).includes(key);

const seedPermissions = async () => {
  try {
    for (const role of Object.values(ROLES)) {
      for (const moduleName of MODULES) {
        // Check if the permission row already exists
        const exists = await RolePermission.findOne({ where: { role, moduleName } });
        
        if (!exists) {
          let isVisible = false;
          let canCreate = false;
          let canEdit = false;
          let canDelete = false;

          // Deduce defaults based on old permissions
          switch (moduleName) {
            case 'Dashboard':
              isVisible = hasGranular(role, 'view_analytics') || hasGranular(role, 'view_all_bookings');
              break;
            case 'Bookings':
              isVisible = hasGranular(role, 'view_all_bookings') || hasGranular(role, 'manage_own_bookings');
              canCreate = hasGranular(role, 'book_therapy');
              canEdit = hasGranular(role, 'reschedule_booking'); // Reschedule = edit for now
              canDelete = hasGranular(role, 'cancel_booking');
              break;
            case 'Centers':
              isVisible = hasGranular(role, 'view_centers');
              canCreate = hasGranular(role, 'create_center');
              canEdit = hasGranular(role, 'update_center');
              canDelete = hasGranular(role, 'delete_center');
              break;
            case 'Categories':
              isVisible = hasGranular(role, 'view_categories');
              canCreate = hasGranular(role, 'create_category');
              canEdit = hasGranular(role, 'update_category');
              canDelete = hasGranular(role, 'delete_category');
              break;
            case 'Therapies':
              isVisible = hasGranular(role, 'view_therapies');
              canCreate = hasGranular(role, 'create_therapy');
              canEdit = hasGranular(role, 'update_therapy');
              canDelete = hasGranular(role, 'delete_therapy');
              break;
            case 'Therapists':
              isVisible = hasGranular(role, 'view_therapists');
              canCreate = hasGranular(role, 'create_therapist');
              canEdit = hasGranular(role, 'update_therapist');
              canDelete = hasGranular(role, 'delete_therapist');
              break;
            case 'Rooms':
              isVisible = hasGranular(role, 'view_rooms');
              canCreate = hasGranular(role, 'create_room');
              canEdit = hasGranular(role, 'update_room');
              canDelete = hasGranular(role, 'delete_room');
              break;
            case 'WorkingHours':
              isVisible = hasGranular(role, 'view_working_hours');
              canEdit = canCreate = canDelete = hasGranular(role, 'manage_working_hours');
              break;
            case 'Leaves':
              isVisible = hasGranular(role, 'view_leaves');
              canEdit = canCreate = canDelete = hasGranular(role, 'manage_leaves');
              break;
            case 'Reports':
              isVisible = hasGranular(role, 'view_analytics');
              break;
            case 'UserManagement':
              isVisible = hasGranular(role, 'create_receptionist') || hasGranular(role, 'create_admin');
              canCreate = hasGranular(role, 'create_receptionist') || hasGranular(role, 'create_admin');
              canEdit = isVisible; // Simplifying for this role
              canDelete = hasGranular(role, 'delete_users');
              break;
          }

          await RolePermission.create({
            role,
            moduleName,
            isVisible,
            canCreate,
            canEdit,
            canDelete
          });
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to seed Role Permissions:', err.message);
  }
};

module.exports = seedPermissions;
