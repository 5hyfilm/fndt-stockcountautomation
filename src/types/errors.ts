// src/types/errors.ts
// 🚨 Consolidated Error Types - Single Source of Truth for All Errors

// =========================================
// 🏷️ Error Categories & Codes
// =========================================

/**
 * Error categories for grouping related errors
 */
export enum ErrorCategory {
  CAMERA = "CAMERA",
  DETECTION = "DETECTION",
  PRODUCT = "PRODUCT",
  API = "API",
  VALIDATION = "VALIDATION",
  NETWORK = "NETWORK",
  CACHE = "CACHE",
  AUTH = "AUTH",
  INVENTORY = "INVENTORY",
  SYSTEM = "SYSTEM",
}

/**
 * Camera-specific error codes
 */
export enum CameraErrorCode {
  NOT_ALLOWED = "CAMERA_NOT_ALLOWED",
  NOT_FOUND = "CAMERA_NOT_FOUND",
  NOT_READABLE = "CAMERA_NOT_READABLE",
  OVERCONSTRAINED = "CAMERA_OVERCONSTRAINED",
  SECURITY_ERROR = "CAMERA_SECURITY_ERROR",
  TYPE_ERROR = "CAMERA_TYPE_ERROR",
  ABORT_ERROR = "CAMERA_ABORT_ERROR",
  STREAM_ERROR = "CAMERA_STREAM_ERROR",
  PERMISSION_DENIED = "CAMERA_PERMISSION_DENIED",
  DEVICE_BUSY = "CAMERA_DEVICE_BUSY",
  TIMEOUT = "CAMERA_TIMEOUT",
}

/**
 * Detection & API error codes
 */
export enum DetectionErrorCode {
  API_REQUEST_FAILED = "DETECTION_API_REQUEST_FAILED",
  PROCESSING_FAILED = "DETECTION_PROCESSING_FAILED",
  INVALID_IMAGE = "DETECTION_INVALID_IMAGE",
  NO_BARCODE_FOUND = "DETECTION_NO_BARCODE_FOUND",
  CONFIDENCE_TOO_LOW = "DETECTION_CONFIDENCE_TOO_LOW",
  TIMEOUT = "DETECTION_TIMEOUT",
  RATE_LIMITED = "DETECTION_RATE_LIMITED",
  SERVICE_UNAVAILABLE = "DETECTION_SERVICE_UNAVAILABLE",
}

/**
 * Product-specific error codes
 */
export enum ProductErrorCode {
  VALIDATION_ERROR = "PRODUCT_VALIDATION_ERROR",
  FETCH_ERROR = "PRODUCT_FETCH_ERROR",
  NOT_FOUND = "PRODUCT_NOT_FOUND",
  INVALID_BARCODE = "PRODUCT_INVALID_BARCODE",
  CACHE_ERROR = "PRODUCT_CACHE_ERROR",
  PARSE_ERROR = "PRODUCT_PARSE_ERROR",
  DUPLICATE_BARCODE = "PRODUCT_DUPLICATE_BARCODE",
  INSUFFICIENT_DATA = "PRODUCT_INSUFFICIENT_DATA",
}

/**
 * Network & API error codes
 */
export enum NetworkErrorCode {
  CONNECTION_FAILED = "NETWORK_CONNECTION_FAILED",
  TIMEOUT = "NETWORK_TIMEOUT",
  OFFLINE = "NETWORK_OFFLINE",
  SERVER_ERROR = "NETWORK_SERVER_ERROR",
  UNAUTHORIZED = "NETWORK_UNAUTHORIZED",
  FORBIDDEN = "NETWORK_FORBIDDEN",
  NOT_FOUND = "NETWORK_NOT_FOUND",
  RATE_LIMITED = "NETWORK_RATE_LIMITED",
  INVALID_RESPONSE = "NETWORK_INVALID_RESPONSE",
}

/**
 * Authentication error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  SESSION_EXPIRED = "AUTH_SESSION_EXPIRED",
  INSUFFICIENT_PERMISSIONS = "AUTH_INSUFFICIENT_PERMISSIONS",
  ACCOUNT_LOCKED = "AUTH_ACCOUNT_LOCKED",
  TOKEN_INVALID = "AUTH_TOKEN_INVALID",
  LOGIN_REQUIRED = "AUTH_LOGIN_REQUIRED",
}

/**
 * Inventory error codes
 */
export enum InventoryErrorCode {
  ITEM_NOT_FOUND = "INVENTORY_ITEM_NOT_FOUND",
  INSUFFICIENT_QUANTITY = "INVENTORY_INSUFFICIENT_QUANTITY",
  DUPLICATE_ITEM = "INVENTORY_DUPLICATE_ITEM",
  INVALID_QUANTITY = "INVENTORY_INVALID_QUANTITY",
  UPDATE_FAILED = "INVENTORY_UPDATE_FAILED",
  EXPORT_FAILED = "INVENTORY_EXPORT_FAILED",
  IMPORT_FAILED = "INVENTORY_IMPORT_FAILED",
}

/**
 * System error codes
 */
export enum SystemErrorCode {
  UNKNOWN_ERROR = "SYSTEM_UNKNOWN_ERROR",
  INTERNAL_ERROR = "SYSTEM_INTERNAL_ERROR",
  CONFIGURATION_ERROR = "SYSTEM_CONFIGURATION_ERROR",
  INITIALIZATION_ERROR = "SYSTEM_INITIALIZATION_ERROR",
}

/**
 * Union type of all error codes
 */
export type AppErrorCode =
  | CameraErrorCode
  | DetectionErrorCode
  | ProductErrorCode
  | NetworkErrorCode
  | AuthErrorCode
  | InventoryErrorCode
  | SystemErrorCode;

// =========================================
// 🏗️ Base Error Interface
// =========================================

/**
 * Base error interface that all application errors extend
 */
export interface BaseAppError extends Error {
  /** Unique error code for identification */
  code: AppErrorCode;
  /** Error category for grouping */
  category: ErrorCategory;
  /** Whether this error is retryable */
  retryable: boolean;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Additional context data */
  context?: Record<string, unknown>;
  /** Original error that caused this error */
  cause?: Error | unknown;
  /** User-friendly message (optional, falls back to message) */
  userMessage?: string;
  /** Severity level */
  severity?: "low" | "medium" | "high" | "critical";
}

// =========================================
// 🎥 Camera Error Types
// =========================================

/**
 * Camera-specific error interface
 */
export interface CameraError extends BaseAppError {
  category: ErrorCategory.CAMERA;
  code: CameraErrorCode;
  /** Camera device ID that caused the error */
  deviceId?: string;
  /** Requested video constraints */
  constraints?: MediaStreamConstraints;
  /** Available camera devices */
  availableDevices?: MediaDeviceInfo[];
}

/**
 * Legacy camera error name mapping for backward compatibility
 */
export type LegacyCameraErrorName =
  | "NotAllowedError"
  | "NotFoundError"
  | "NotReadableError"
  | "OverconstrainedError"
  | "SecurityError"
  | "TypeError"
  | "AbortError";

// =========================================
// 🔍 Detection & API Error Types
// =========================================

/**
 * Detection/API error interface
 */
export interface DetectionError extends BaseAppError {
  category: ErrorCategory.DETECTION | ErrorCategory.API;
  code: DetectionErrorCode;
  /** HTTP status code for API errors */
  status?: number;
  /** API endpoint that failed */
  endpoint?: string;
  /** Request payload */
  requestData?: unknown;
  /** Response data */
  responseData?: unknown;
}

/**
 * Legacy API error type alias for backward compatibility
 */
export type ApiError = DetectionError;

// =========================================
// 🛒 Product Error Types
// =========================================

/**
 * Product-specific error interface
 */
export interface ProductError extends BaseAppError {
  category: ErrorCategory.PRODUCT;
  code: ProductErrorCode;
  /** Barcode that caused the error */
  barcode?: string;
  /** Product ID if available */
  productId?: string;
  /** Validation errors if applicable */
  validationErrors?: string[];
  /** Suggested corrections */
  suggestions?: string[];
}

/**
 * Legacy product info error for backward compatibility
 */
export type ProductInfoError = ProductError;

// =========================================
// 🌐 Network Error Types
// =========================================

/**
 * Network-specific error interface
 */
export interface NetworkError extends BaseAppError {
  category: ErrorCategory.NETWORK;
  code: NetworkErrorCode;
  /** HTTP status code */
  status?: number;
  /** Request URL */
  url?: string;
  /** Request method */
  method?: string;
  /** Response headers */
  headers?: Record<string, string>;
}

// =========================================
// 🔐 Authentication Error Types
// =========================================

/**
 * Authentication error interface
 */
export interface AuthError extends BaseAppError {
  category: ErrorCategory.AUTH;
  code: AuthErrorCode;
  /** User ID if available */
  userId?: string;
  /** Attempted action */
  action?: string;
  /** Required permission level */
  requiredPermission?: string;
}

// =========================================
// 📦 Inventory Error Types
// =========================================

/**
 * Inventory error interface
 */
export interface InventoryError extends BaseAppError {
  category: ErrorCategory.INVENTORY;
  code: InventoryErrorCode;
  /** Item ID or barcode */
  itemId?: string;
  /** Current quantity */
  currentQuantity?: number;
  /** Requested quantity */
  requestedQuantity?: number;
}

// =========================================
// ⚙️ System Error Types
// =========================================

/**
 * System error interface
 */
export interface SystemError extends BaseAppError {
  category: ErrorCategory.SYSTEM;
  code: SystemErrorCode;
  /** System component that failed */
  component?: string;
  /** Stack trace if available */
  stackTrace?: string;
}

// =========================================
// 🔧 Error Utility Types
// =========================================

/**
 * Union type of all specific error interfaces
 */
export type AppError =
  | CameraError
  | DetectionError
  | ProductError
  | NetworkError
  | AuthError
  | InventoryError
  | SystemError;

/**
 * Error creation options
 */
export interface CreateErrorOptions {
  code: AppErrorCode;
  message: string;
  category?: ErrorCategory;
  retryable?: boolean;
  context?: Record<string, unknown>;
  cause?: Error | unknown;
  userMessage?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: AppError) => void | Promise<void>;

/**
 * Error recovery function type
 */
export type ErrorRecovery = (error: AppError) => boolean | Promise<boolean>;

// =========================================
// 🎯 Type Guards
// =========================================

/**
 * Check if error is an application error
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "category" in error &&
    "retryable" in error &&
    "timestamp" in error
  );
}

/**
 * Check if error is a camera error
 */
export function isCameraError(error: unknown): error is CameraError {
  return isAppError(error) && error.category === ErrorCategory.CAMERA;
}

/**
 * Check if error is a detection error
 */
export function isDetectionError(error: unknown): error is DetectionError {
  return (
    isAppError(error) &&
    (error.category === ErrorCategory.DETECTION ||
      error.category === ErrorCategory.API)
  );
}

/**
 * Check if error is a product error
 */
export function isProductError(error: unknown): error is ProductError {
  return isAppError(error) && error.category === ErrorCategory.PRODUCT;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return isAppError(error) && error.category === ErrorCategory.NETWORK;
}

/**
 * Check if error is an auth error
 */
export function isAuthError(error: unknown): error is AuthError {
  return isAppError(error) && error.category === ErrorCategory.AUTH;
}

/**
 * Check if error is an inventory error
 */
export function isInventoryError(error: unknown): error is InventoryError {
  return isAppError(error) && error.category === ErrorCategory.INVENTORY;
}

/**
 * Check if error is a system error
 */
export function isSystemError(error: unknown): error is SystemError {
  return isAppError(error) && error.category === ErrorCategory.SYSTEM;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return isAppError(error) && error.retryable;
}

// =========================================
// 🏭 Error Factory Functions
// =========================================

/**
 * Create a new application error
 */
export function createError(options: CreateErrorOptions): AppError {
  const category = options.category || getCategoryFromCode(options.code);

  const baseError: BaseAppError = {
    name: "AppError",
    message: options.message,
    code: options.code,
    category,
    retryable: options.retryable ?? false,
    timestamp: Date.now(),
    context: options.context,
    cause: options.cause,
    userMessage: options.userMessage,
    severity: options.severity ?? "medium",
  };

  // Create specific error type based on category
  switch (category) {
    case ErrorCategory.CAMERA:
      return baseError as CameraError;
    case ErrorCategory.DETECTION:
    case ErrorCategory.API:
      return baseError as DetectionError;
    case ErrorCategory.PRODUCT:
      return baseError as ProductError;
    case ErrorCategory.NETWORK:
      return baseError as NetworkError;
    case ErrorCategory.AUTH:
      return baseError as AuthError;
    case ErrorCategory.INVENTORY:
      return baseError as InventoryError;
    case ErrorCategory.SYSTEM:
      return baseError as SystemError;
    default:
      return baseError as SystemError; // Fallback to system error
  }
}

/**
 * Create a camera error
 */
export function createCameraError(
  code: CameraErrorCode,
  message: string,
  options?: Partial<Omit<CameraError, "code" | "message" | "category">>
): CameraError {
  return createError({
    code,
    message,
    category: ErrorCategory.CAMERA,
    retryable: isCameraErrorRetryable(code),
    ...options,
  }) as CameraError;
}

/**
 * Create a detection error
 */
export function createDetectionError(
  code: DetectionErrorCode,
  message: string,
  options?: Partial<Omit<DetectionError, "code" | "message" | "category">>
): DetectionError {
  return createError({
    code,
    message,
    category: ErrorCategory.DETECTION,
    retryable: isDetectionErrorRetryable(code),
    ...options,
  }) as DetectionError;
}

/**
 * Create a product error
 */
export function createProductError(
  code: ProductErrorCode,
  message: string,
  options?: Partial<Omit<ProductError, "code" | "message" | "category">>
): ProductError {
  return createError({
    code,
    message,
    category: ErrorCategory.PRODUCT,
    retryable: isProductErrorRetryable(code),
    ...options,
  }) as ProductError;
}

/**
 * Create a network error
 */
export function createNetworkError(
  code: NetworkErrorCode,
  message: string,
  options?: Partial<Omit<NetworkError, "code" | "message" | "category">>
): NetworkError {
  return createError({
    code,
    message,
    category: ErrorCategory.NETWORK,
    retryable: isNetworkErrorRetryable(code),
    ...options,
  }) as NetworkError;
}

/**
 * Create a system error
 */
export function createSystemError(
  code: SystemErrorCode,
  message: string,
  options?: Partial<Omit<SystemError, "code" | "message" | "category">>
): SystemError {
  return createError({
    code,
    message,
    category: ErrorCategory.SYSTEM,
    retryable: false, // System errors are generally not retryable
    ...options,
  }) as SystemError;
}

// =========================================
// 🔄 Legacy Error Conversion
// =========================================

/**
 * Convert legacy MediaError names to camera error codes
 */
export function legacyCameraErrorToCode(
  name: LegacyCameraErrorName
): CameraErrorCode {
  const mapping: Record<LegacyCameraErrorName, CameraErrorCode> = {
    NotAllowedError: CameraErrorCode.NOT_ALLOWED,
    NotFoundError: CameraErrorCode.NOT_FOUND,
    NotReadableError: CameraErrorCode.NOT_READABLE,
    OverconstrainedError: CameraErrorCode.OVERCONSTRAINED,
    SecurityError: CameraErrorCode.SECURITY_ERROR,
    TypeError: CameraErrorCode.TYPE_ERROR,
    AbortError: CameraErrorCode.ABORT_ERROR,
  };

  return mapping[name] || CameraErrorCode.STREAM_ERROR;
}

/**
 * Convert standard Error to AppError
 */
export function toAppError(
  error: unknown,
  fallbackCode?: AppErrorCode
): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Try to map known error types
    if (
      error.name in ["NotAllowedError", "NotFoundError", "NotReadableError"]
    ) {
      return createCameraError(
        legacyCameraErrorToCode(error.name as LegacyCameraErrorName),
        error.message,
        { cause: error }
      );
    }

    return createError({
      code: fallbackCode || SystemErrorCode.UNKNOWN_ERROR,
      message: error.message,
      cause: error,
    });
  }

  return createError({
    code: fallbackCode || SystemErrorCode.UNKNOWN_ERROR,
    message: typeof error === "string" ? error : "Unknown error occurred",
    cause: error,
  });
}

// =========================================
// 🔍 Helper Functions
// =========================================

/**
 * Get error category from error code
 */
function getCategoryFromCode(code: AppErrorCode): ErrorCategory {
  if (Object.values(CameraErrorCode).includes(code as CameraErrorCode)) {
    return ErrorCategory.CAMERA;
  }
  if (Object.values(DetectionErrorCode).includes(code as DetectionErrorCode)) {
    return ErrorCategory.DETECTION;
  }
  if (Object.values(ProductErrorCode).includes(code as ProductErrorCode)) {
    return ErrorCategory.PRODUCT;
  }
  if (Object.values(NetworkErrorCode).includes(code as NetworkErrorCode)) {
    return ErrorCategory.NETWORK;
  }
  if (Object.values(AuthErrorCode).includes(code as AuthErrorCode)) {
    return ErrorCategory.AUTH;
  }
  if (Object.values(InventoryErrorCode).includes(code as InventoryErrorCode)) {
    return ErrorCategory.INVENTORY;
  }
  if (Object.values(SystemErrorCode).includes(code as SystemErrorCode)) {
    return ErrorCategory.SYSTEM;
  }
  // This should never happen with proper typing, but fallback to SYSTEM
  return ErrorCategory.SYSTEM;
}

/**
 * Check if camera error is retryable
 */
function isCameraErrorRetryable(code: CameraErrorCode): boolean {
  const retryableCodes = [
    CameraErrorCode.NOT_READABLE,
    CameraErrorCode.STREAM_ERROR,
    CameraErrorCode.DEVICE_BUSY,
    CameraErrorCode.ABORT_ERROR,
    CameraErrorCode.TIMEOUT,
  ];
  return retryableCodes.includes(code);
}

/**
 * Check if detection error is retryable
 */
function isDetectionErrorRetryable(code: DetectionErrorCode): boolean {
  const retryableCodes = [
    DetectionErrorCode.API_REQUEST_FAILED,
    DetectionErrorCode.TIMEOUT,
    DetectionErrorCode.SERVICE_UNAVAILABLE,
  ];
  return retryableCodes.includes(code);
}

/**
 * Check if product error is retryable
 */
function isProductErrorRetryable(code: ProductErrorCode): boolean {
  const retryableCodes = [
    ProductErrorCode.FETCH_ERROR,
    ProductErrorCode.CACHE_ERROR,
  ];
  return retryableCodes.includes(code);
}

/**
 * Check if network error is retryable
 */
function isNetworkErrorRetryable(code: NetworkErrorCode): boolean {
  const retryableCodes = [
    NetworkErrorCode.CONNECTION_FAILED,
    NetworkErrorCode.TIMEOUT,
    NetworkErrorCode.SERVER_ERROR,
    NetworkErrorCode.RATE_LIMITED,
  ];
  return retryableCodes.includes(code);
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  if (error.userMessage) {
    return error.userMessage;
  }

  // Default user-friendly messages based on error codes
  const messages: Partial<Record<AppErrorCode, string>> = {
    // Camera errors
    [CameraErrorCode.NOT_ALLOWED]: "กรุณาอนุญาตการเข้าถึงกล้อง",
    [CameraErrorCode.NOT_FOUND]: "ไม่พบกล้องในอุปกรณ์",
    [CameraErrorCode.NOT_READABLE]: "ไม่สามารถเปิดกล้องได้",
    [CameraErrorCode.PERMISSION_DENIED]: "การเข้าถึงกล้องถูกปฏิเสธ",

    // Product errors
    [ProductErrorCode.NOT_FOUND]: "ไม่พบข้อมูลสินค้า",
    [ProductErrorCode.INVALID_BARCODE]: "บาร์โค้ดไม่ถูกต้อง",

    // Network errors
    [NetworkErrorCode.CONNECTION_FAILED]: "การเชื่อมต่อล้มเหลว",
    [NetworkErrorCode.OFFLINE]: "ไม่มีการเชื่อมต่ออินเทอร์เน็ต",

    // System errors
    [SystemErrorCode.UNKNOWN_ERROR]: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
    [SystemErrorCode.INTERNAL_ERROR]: "เกิดข้อผิดพลาดภายในระบบ",
  };

  return messages[error.code] || error.message || "เกิดข้อผิดพลาด";
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: AppError): string {
  const context = error.context ? JSON.stringify(error.context) : "";
  return `[${error.category}:${error.code}] ${error.message} ${context}`.trim();
}

/**
 * Check if error should be reported to monitoring
 */
export function shouldReportError(error: AppError): boolean {
  const reportableSeverities = ["high", "critical"];
  const alwaysReportCategories = [ErrorCategory.SYSTEM];

  return (
    (error.severity && reportableSeverities.includes(error.severity)) ||
    alwaysReportCategories.includes(error.category)
  );
}
