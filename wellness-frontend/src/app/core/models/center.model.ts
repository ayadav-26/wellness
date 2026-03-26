import { TherapyCategory } from './category.model';
import { Therapist } from './therapist.model';

export interface Room {
  roomId: number;
  roomName: string;
  roomType: string;
}

export interface Center {
  centerId: number;
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  region: string;
  openingTime: string;
  closingTime: string;
  openDays?: string[];
  isActive: boolean;
  hasAvailabilityToday?: boolean;
  therapyCategories?: TherapyCategory[];
  rooms?: Room[];
}

export interface CenterDetail extends Center {
  status: boolean;
  therapists: Therapist[];
  rooms: Room[];
  openDays?: string[];
  therapyCategories: TherapyCategory[];
  createdAt?: string;
  updatedAt?: string;
}
