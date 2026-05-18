// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  status: number;
  message: string;
  code: string;
  details?: Record<string, any>;
}

// =====================================================
// PAGINATION
// =====================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  skip?: number;
  take?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// =====================================================
// FILTER & SORT
// =====================================================

export type SortOrder = "asc" | "desc";

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface FilterParams {
  [key: string]: any;
}

export interface QueryParams extends PaginationParams, SortParams {
  filter?: FilterParams;
}

// =====================================================
// DATE RANGE
// =====================================================

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface DateRangeInput {
  startDate?: string | Date;
  endDate?: string | Date;
}
