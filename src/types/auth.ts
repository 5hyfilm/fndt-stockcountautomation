// Path: src/types/auth.ts
// ✅ Consolidated Authentication Types - Best Practice Implementation

// =========================================
// 🔑 Core Business Entities
// =========================================

/**
 * Employee information interface
 * Used across authentication and session management
 */
export interface Employee {
  id?: string; // Optional for new employees
  name: string; // Employee full name
  branchCode: string; // Branch identification code
  branchName: string; // Branch display name
  role?: UserRole; // User permission level
  department?: string; // Employee department
  createdAt?: Date; // Account creation timestamp
  lastLoginAt?: Date; // Last login timestamp
}

/**
 * Employee information interface for forms and authentication
 * Used across the application for employee data
 */
export interface EmployeeInfo {
  employeeName: string;
  branchCode: string;
  branchName: string;
  timestamp: string;
}

/**
 * Branch information interface
 */
export interface Branch {
  code: string; // Unique branch code
  name: string; // Branch display name
  region?: string; // Geographic region
  address?: string; // Branch address
  isActive?: boolean; // Branch operational status
}

// =========================================
// 🛡️ Session & Authentication States
// =========================================

/**
 * User session information
 */
export interface EmployeeSession {
  employee: EmployeeInfo; // Employee details
  sessionId: string; // Unique session identifier
  loginTime: string; // ISO timestamp of login
  expiresAt?: Date; // Session expiration time
  refreshToken?: string; // For session renewal
}

/**
 * Authentication state management
 */
export interface SessionState {
  isAuthenticated: boolean;
  employee: Employee | null;
  sessionId?: string;
  loginTime?: Date;
  expiresAt?: Date;
  isLoading: boolean;
}

/**
 * Login process state
 */
export interface LoginState {
  isLoading: boolean;
  error: string | null;
  attemptCount: number;
  lastAttemptAt?: Date;
  isBlocked?: boolean; // Account temporarily blocked
}

// =========================================
// 📝 Form Types & Validation
// =========================================

/**
 * Employee form data for authentication
 */
export interface EmployeeFormData {
  employeeName: string;
  branchCode: string;
  branchName: string;
}

/**
 * Employee form component props
 */
export interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  initialValues?: Partial<EmployeeFormData>;
  autoFocus?: boolean;
  showAdvancedOptions?: boolean;
}

/**
 * Form validation errors
 */
export interface FormValidationErrors {
  employeeName?: string;
  branchCode?: string;
  branchName?: string;
  general?: string; // General form error
}

/**
 * Form field validation state
 */
export interface FieldValidation {
  isValid: boolean;
  error?: string;
  touched: boolean;
}

/**
 * Complete form validation state
 */
export interface FormValidationState {
  employeeName: FieldValidation;
  branchCode: FieldValidation;
  branchName: FieldValidation;
  isFormValid: boolean;
}

// =========================================
// 🔐 Permissions & Authorization
// =========================================

/**
 * User role definitions
 */
export type UserRole = "admin" | "manager" | "employee" | "viewer";

/**
 * Permission flags for different actions
 */
export interface AccessPermissions {
  // Inventory permissions
  canAddInventory: boolean;
  canEditInventory: boolean;
  canDeleteInventory: boolean;
  canViewInventory: boolean;

  // Data permissions
  canExportData: boolean;
  canImportData: boolean;
  canClearAllData: boolean;

  // System permissions
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
}

/**
 * Role-based permission mapping
 */
export type RolePermissions = Record<UserRole, AccessPermissions>;

// =========================================
// 🎯 Context & Hook Types
// =========================================

/**
 * Authentication context value
 */
export interface AuthContextValue {
  // State
  session: SessionState;
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: AccessPermissions;

  // Actions
  login: (data: EmployeeFormData) => Promise<boolean>;
  logout: () => void;
  updateEmployeeInfo: (data: Partial<Employee>) => Promise<boolean>;
  clearError: () => void;

  // Utilities
  isSessionValid: () => boolean;
  getTimeRemaining: () => number;
  formatTimeRemaining: () => string;
  hasPermission: (permission: keyof AccessPermissions) => boolean;
}

/**
 * useEmployeeAuth hook return type
 */
export interface UseEmployeeAuthReturn extends AuthContextValue {
  // Additional utility methods
  employeeName: string;
  branchCode: string;
  branchName: string;
  sessionInfo: SessionInfo | null;
  checkExistingSession: () => void;
  clearAllLocalStorage: () => boolean;
}

// =========================================
// 📊 Utility & Helper Types
// =========================================

/**
 * Session information for export/reporting
 */
export interface SessionInfo {
  employeeName: string;
  branchCode: string;
  branchName: string;
  sessionId: string;
  loginTime: string;
  sessionDuration: number; // Duration in milliseconds
  timeRemaining: number; // Time remaining in milliseconds
}

/**
 * Login view component props
 */
export interface LoginViewProps {
  onSubmit: (employeeInfo: EmployeeInfo) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  sessionDuration: number; // Duration in milliseconds
  storageKey: string; // localStorage key
  maxLoginAttempts: number; // Maximum failed login attempts
  lockoutDuration: number; // Account lockout duration
  autoLogoutWarning: number; // Warning time before auto logout
}

// =========================================
// 🏷️ Type Guards & Validators
// =========================================

/**
 * Type guard for Employee interface
 */
export const isEmployee = (obj: unknown): obj is Employee => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).name === "string" &&
    typeof (obj as Record<string, unknown>).branchCode === "string" &&
    typeof (obj as Record<string, unknown>).branchName === "string"
  );
};

/**
 * Type guard for EmployeeSession interface
 */
export const isEmployeeSession = (obj: unknown): obj is EmployeeSession => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).employee === "object" &&
    typeof (obj as Record<string, unknown>).sessionId === "string" &&
    typeof (obj as Record<string, unknown>).loginTime === "string"
  );
};

// =========================================
// 📖 Default Values & Constants
// =========================================

/**
 * Default authentication configuration
 */
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  sessionDuration: 8 * 60 * 60 * 1000, // 8 hours
  storageKey: "fn_employee_session",
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  autoLogoutWarning: 5 * 60 * 1000, // 5 minutes
};

/**
 * Default permissions for different roles
 */
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  admin: {
    canAddInventory: true,
    canEditInventory: true,
    canDeleteInventory: true,
    canViewInventory: true,
    canExportData: true,
    canImportData: true,
    canClearAllData: true,
    canManageUsers: true,
    canViewReports: true,
    canManageSettings: true,
  },
  manager: {
    canAddInventory: true,
    canEditInventory: true,
    canDeleteInventory: true,
    canViewInventory: true,
    canExportData: true,
    canImportData: true,
    canClearAllData: false,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
  },
  employee: {
    canAddInventory: true,
    canEditInventory: true,
    canDeleteInventory: false,
    canViewInventory: true,
    canExportData: true,
    canImportData: false,
    canClearAllData: false,
    canManageUsers: false,
    canViewReports: false,
    canManageSettings: false,
  },
  viewer: {
    canAddInventory: false,
    canEditInventory: false,
    canDeleteInventory: false,
    canViewInventory: true,
    canExportData: false,
    canImportData: false,
    canClearAllData: false,
    canManageUsers: false,
    canViewReports: false,
    canManageSettings: false,
  },
};

/**
 * Initial form validation state
 */
export const INITIAL_FORM_VALIDATION: FormValidationState = {
  employeeName: { isValid: false, touched: false },
  branchCode: { isValid: false, touched: false },
  branchName: { isValid: false, touched: false },
  isFormValid: false,
};
