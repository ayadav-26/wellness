export type UserRole = 'Super_Admin' | 'Admin' | 'Receptionist' | 'User';

export interface User {
  userId: number;
  id?: number; // alias for backward compat
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  region?: string;
  phone?: string;
  role: UserRole;
  centerId?: number;
  center?: {
    centerId: number;
    name: string;
    city: string;
  };
  profileImageUrl?: string;
}
