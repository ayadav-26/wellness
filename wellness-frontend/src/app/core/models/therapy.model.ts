import { TherapyCategory } from './category.model';

export interface Therapy {
  therapyId: number;
  therapyName: string;
  categoryId: number;
  category?: TherapyCategory;
  durationMinutes: number;
  price: number;
  description?: string;
  requiredRoomType: string;
  requiredSkill: string;
  isActive: boolean;
}
