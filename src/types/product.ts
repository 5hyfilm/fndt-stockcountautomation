// src/types/product.ts
// 🛒 Product types with consolidated error handling

import React from "react";
// ✅ Import from consolidated errors

// =========================================
// 🛍️ Core Product Types
// =========================================

/**
 * Product status enumeration
 */
export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCONTINUED = "discontinued",
  OUT_OF_STOCK = "out_of_stock",
  PENDING = "pending",
}

/**
 * Product category enumeration
 */
export enum ProductCategory {
  BEVERAGE = "beverage",
  SNACK = "snack",
  FOOD = "food",
  PERSONAL_CARE = "personal_care",
  HOUSEHOLD = "household",
  HEALTH = "health",
  OTHER = "other",
}

/**
 * Main product interface
 */
export interface Product {
  // Basic Info
  id: string;
  materialCode: string;
  productName: string;
  brand: string;
  category: ProductCategory;
  size: string;
  unit: string;
  status: ProductStatus;

  // Pricing
  price?: number;
  currency?: string;
  pricePerUnit?: number;

  // Descriptions
  thaiDescription?: string;
  englishDescription?: string;
  shortDescription?: string;

  // Barcodes
  barcode: string;
  alternativeBarcodes?: string[];

  // Categorization
  productGroup?: string;
  subCategory?: string;
  department?: string;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  lastModifiedBy?: string;

  // Nutrition (optional)
  nutrition?: NutritionInfo;

  // Additional Info
  images?: string[];
  tags?: string[];
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Nutrition information
 */
export interface NutritionInfo {
  servingSize?: string;
  servingsPerContainer?: number;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbohydrate?: number;
  dietaryFiber?: number;
  totalSugars?: number;
  addedSugars?: number;
  protein?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
}

// =========================================
// 🔍 API & Search Types
// =========================================

export interface ProductSearchParams {
  barcode?: string;
  materialCode?: string;
  productName?: string;
  brand?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  limit?: number;
  offset?: number;
}

export interface DebugInfo {
  searchedBarcode?: string;
  cleanBarcode?: string;
  availableBarcodes?: string[];
  timestamp?: number;
  processingTime?: number;
  source?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ProductResponse {
  success: boolean;
  data?: Product;
  error?: string;
  debug?: DebugInfo;
}

export interface ProductListResponse {
  success: boolean;
  data?: Product[];
  total?: number;
  error?: string;
  stats?: {
    totalProducts: number;
    activeProducts: number;
    categories: number;
    brands: number;
  };
}

// =========================================
// 🏷️ Barcode Types (moved from hooks)
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

export interface BarcodeValidationResult {
  isValid: boolean;
  normalizedBarcode: string;
  detectedFormat?: BarcodeType;
  errors: string[];
  suggestions?: string[];
}

// =========================================
// ⚙️ Product Configuration Types
// =========================================

export interface ProductInfoConfig {
  enableCaching: boolean;
  cacheExpiryMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  enableDebouncing: boolean;
  debounceDelayMs: number;
}

export interface FetchProductOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

// =========================================
// 💾 Cache Types
// =========================================

export interface ProductCacheEntry {
  product: Product;
  timestamp: number;
  expiresAt: number;
}

export interface ProductCacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  cacheHitRate: number;
}

// =========================================
// 🎯 Hook Types
// =========================================

export interface UseProductInfoReturn {
  // State
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  lastSearchedBarcode: string;
  retryCount: number;

  // Actions
  fetchProductByBarcode: (barcode: string) => Promise<void>;
  updateBarcode: (barcode: string) => void | (() => void);
  clearProduct: () => void;
  clearError: () => void;
  retryFetch: () => void;

  // Cache utilities
  clearCache: () => void;
  getCacheStats: () => ProductCacheStats;
}

export interface UseProductCacheProps {
  enabled: boolean;
  expiryMs: number;
}

export interface UseProductFetcherProps {
  retryAttempts: number;
  retryDelayMs: number;
  setRetryCount: (count: number) => void;
}

export interface UseProductCacheReturn {
  get: (barcode: string) => Product | null;
  set: (barcode: string, product: Product) => void;
  clear: () => void;
  remove: (barcode: string) => boolean;
  getStats: () => ProductCacheStats;
}

export interface UseProductFetcherReturn {
  fetchProduct: (barcode: string) => Promise<ProductResponse>;
}

export interface UseProductValidatorReturn {
  normalizeBarcode: (barcode: string) => string;
  validateBarcode: (barcode: string) => BarcodeValidationResult;
  isValidBarcodeFormat: (barcode: string) => boolean;
  suggestBarcodeCorreections: (barcode: string) => string[];
  detectBarcodeType: (barcode: string) => BarcodeType;
}

// =========================================
// 🧩 Component Props Types
// =========================================

export interface BaseProductComponentProps {
  product: Product;
}

export interface ProductInfoMainProps {
  product: Product | null;
  barcode?: string;
  isLoading?: boolean;
  error?: string;
  onAddToInventory?: (product: Product, quantity: number) => boolean;
  currentInventoryQuantity?: number;
}

export interface InventoryActionProps {
  product: Product;
  onAddToInventory: (product: Product, quantity: number) => boolean;
  currentInventoryQuantity: number;
}

export interface BarcodeDisplayProps {
  barcode: string;
  scannedBarcode?: string;
  onCopy?: () => void;
  copied?: boolean;
}

export interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

// =========================================
// 🔢 Quantity & Controls Types
// =========================================

export interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  unit?: string;
}

// =========================================
// 🍎 Nutrition Types
// =========================================

export interface NutritionItem {
  label: string;
  value: number | undefined;
  unit: string;
}

export interface NutritionDisplayProps {
  nutritionData: NutritionItem[];
  servingSize?: string;
}

// =========================================
// 🎨 Display & Styling Types
// =========================================

export interface CategoryStyling {
  icon: React.ReactNode;
  colorClass: string;
}

export interface ProductDisplayOptions {
  showPrice?: boolean;
  showNutrition?: boolean;
  showDetails?: boolean;
  showInventoryActions?: boolean;
  compactMode?: boolean;
}

// =========================================
// 🔄 Backward Compatibility & Re-exports
// =========================================

/**
 * Export consolidated error types for compatibility
 * ✅ Now using consolidated ProductError and ProductInfoError from errors.ts
 */
export type { ProductError, ProductInfoError } from "./errors";
