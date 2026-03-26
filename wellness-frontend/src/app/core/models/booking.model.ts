export type BookingStatus = 'Pending' | 'Confirmed' | 'Rescheduled' | 'Cancelled' | 'Completed' | 'NoShow';
export type GenderPreference = 'Male' | 'Female' | 'NoPreference';

export interface Booking {
  bookingId: number;
  centerId: number;
  therapyId: number;
  therapistId: number;
  roomId: number;
  userId?: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  therapistGenderPreference: GenderPreference;
  appointmentStartTime: string;
  appointmentEndTime: string;
  bookingStatus: BookingStatus;
  createdAt: string;
  center?: { centerId: number; name: string; city: string };
  therapy?: {
    therapyId: number; therapyName: string;
    durationMinutes: number; price: string;
    category?: { categoryId: number; categoryName: string }
  };
  therapist?: { therapistId: number; firstName: string; lastName: string; gender: string };
  room?: { roomId: number; roomName: string; roomType: string };
  region?: string;
}
