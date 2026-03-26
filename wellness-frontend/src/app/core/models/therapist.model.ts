export interface Therapist {
  therapistId: number;
  userId: number;
  firstName: string;
  lastName: string;
  specialization: string;
  experienceYears: number;
  isActive: boolean;
  status?: boolean;
  gender?: string;
  phoneNumber?: string;
  skillSet?: string[];
  center?: {
    centerId: number;
    name: string;
  };
}
