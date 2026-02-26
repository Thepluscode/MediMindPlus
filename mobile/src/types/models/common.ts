// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  background: string;
  surface: string;
  error: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  info: string;
  disabled: string;
  placeholder: string;
  backdrop: string;
  notification: string;
  card: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
  };
  fontSize: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
}
