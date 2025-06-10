// src/hooks/product/types.ts
import { Product } from "../../types/product";

export type BarcodeType = "ea" | "dsp" | "cs";

export interface ProductLookupResult {
  product: Product;
  barcodeType: BarcodeType;
}

export interface ProductSearchParams {
  barcode?: string;
  name?: string;
  category?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}

export interface ProductCache {
  [barcode: string]: {
    result: ProductLookupResult | null;
    timestamp: number;
    expiresIn: number;
  };
}

export interface BarcodeNormalizationOptions {
  removeSpaces: boolean;
  removeSpecialChars: boolean;
  padLength?: number;
  trimLeadingZeros: boolean;
}

// แก้ไข Return Type ให้ครบถ้วน
export interface UseProductLookupReturn {
  // State
  product: Product | null;
  detectedBarcodeType: BarcodeType | null;
  isLoadingProduct: boolean;
  productError: string | null;
  lastDetectedCode: string;

  // Actions
  updateBarcode: (barcode: string) => Promise<void>;
  clearProduct: () => void;
  clearCurrentDetection: () => void;
}

export interface ProductLookupConfig {
  debounceMs: number;
  cacheEnabled: boolean;
  cacheExpiryMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

export interface BarcodeValidationResult {
  isValid: boolean;
  normalizedBarcode: string;
  detectedFormat?: string;
  errors?: string[];
}
