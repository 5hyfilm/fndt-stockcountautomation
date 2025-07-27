// Path: src/types/barcode.ts
// 🏷️ Consolidated Barcode Types - Moved from src/hooks/barcode/types.ts

// =========================================
// 🔍 Barcode Format & Validation
// =========================================

export interface BarcodeFormatInfo {
  name: string;
  pattern: RegExp;
  length: number | number[];
  checksum?: boolean;
}

export interface BarcodeValidation {
  isValid: boolean;
  format?: BarcodeFormatInfo;
  errors: string[];
  suggestions?: string[];
}

// =========================================
// ⚙️ Barcode Processing
// =========================================

export interface BarcodeProcessingOptions {
  normalize: boolean;
  validate: boolean;
  format?: string;
  timeout?: number;
}

export interface BarcodeProcessingResult {
  originalBarcode: string;
  normalizedBarcode: string;
  isValid: boolean;
  format?: string;
  processingTime: number;
  errors?: string[];
}

// =========================================
// 🕒 Debouncing Utilities (Generic)
// =========================================

export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
}

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

// =========================================
// 🪝 Barcode Hook Types
// =========================================

export interface UseBarcodeDebounceOptions {
  delay: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface UseBarcodeDebounceReturn<
  T extends (...args: unknown[]) => unknown
> {
  debouncedFunction: DebouncedFunction<T>;
  isPending: boolean;
  cancel: () => void;
  flush: () => void;
}

// =========================================
// 📊 Barcode Constants & Enums
// =========================================

export enum BarcodeType {
  EAN13 = "EAN13",
  EAN8 = "EAN8",
  UPC_A = "UPC_A",
  UPC_E = "UPC_E",
  CODE128 = "CODE128",
  CODE39 = "CODE39",
  CODE93 = "CODE93",
  ITF = "ITF",
  GTIN = "GTIN",
  QR_CODE = "QR_CODE",
  UNKNOWN = "UNKNOWN",
}

// =========================================
// 🔧 Barcode Validation Utilities
// =========================================

export interface BarcodeValidationResult {
  isValid: boolean;
  normalizedBarcode: string;
  detectedFormat?: BarcodeType;
  errors: string[];
  suggestions?: string[];
}

// =========================================
// 📱 Multi-Format Support
// =========================================

export interface BarcodeTypeMapping {
  ea: string; // Each unit
  dsp: string; // Display pack
  cs: string; // Case/Carton
}

export interface BarcodeMatchResult {
  matched: boolean;
  type?: "ea" | "dsp" | "cs";
  barcode?: string;
  confidence?: number;
}
