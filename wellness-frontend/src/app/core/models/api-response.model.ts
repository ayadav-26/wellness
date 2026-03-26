export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
