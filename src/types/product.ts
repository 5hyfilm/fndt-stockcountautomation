// Path: src/types/product.ts
// Updated with multiple barcode support and detected barcode type

export interface Product {
  id: string;
  barcode: string; // Primary barcode for backward compatibility
  name: string;
  name_en?: string;
  category: ProductCategory;
  brand: string;
  description?: string;
  size?: string;
  unit?: string;
  price?: number;
  currency?: string;
  sku?: string;
  batch_number?: string;
  expiry_date?: string;
  manufacturing_date?: string;
  nutrition_info?: NutritionInfo;
  ingredients?: string[];
  allergens?: string[];
  storage_instructions?: string;
  country_of_origin?: string;
  barcode_type?: string;
  image_url?: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;

  // ✅ NEW: Multiple barcode support
  barcodes?: {
    ea?: string; // Each unit barcode
    dsp?: string; // Display pack barcode
    cs?: string; // Case/Carton barcode
    primary: string; // Primary barcode (same as 'barcode' field)
  };

  // ✅ NEW: Detected barcode type from scanning
  detectedBarcodeType?: "ea" | "dsp" | "cs";

  // ✅ NEW: Material code from CSV
  materialCode?: string;

  // ✅ NEW: Product group from CSV
  productGroup?: string;
}

export interface NutritionInfo {
  serving_size?: string;
  calories_per_serving?: number;
  protein?: number;
  carbohydrates?: number;
  sugar?: number;
  fat?: number;
  saturated_fat?: number;
  sodium?: number;
  fiber?: number;
  vitamin_c?: number;
  calcium?: number;
}

export enum ProductCategory {
  BEVERAGES = "beverages",
  DAIRY = "dairy",
  SNACKS = "snacks",
  CANNED_FOOD = "canned_food",
  INSTANT_NOODLES = "instant_noodles",
  SAUCES = "sauces",
  SEASONING = "seasoning",
  FROZEN = "frozen",
  BAKERY = "bakery",
  CONFECTIONERY = "confectionery",
  OTHER = "other",
}

export enum ProductStatus {
  ACTIVE = "active",
  DISCONTINUED = "discontinued",
  OUT_OF_STOCK = "out_of_stock",
  PENDING = "pending",
}

// ✅ NEW: Barcode type enum for better type safety
export enum BarcodeType {
  EA = "ea", // Each unit
  DSP = "dsp", // Display pack
  CS = "cs", // Case/Carton
}

// ✅ NEW: Barcode detection result
export interface BarcodeDetectionResult {
  barcode: string;
  type: BarcodeType;
  product: Product;
  confidence?: number;
}

export interface ProductSearchParams {
  barcode?: string;
  name?: string;
  category?: ProductCategory;
  brand?: string;
  status?: ProductStatus;
  limit?: number;
  offset?: number;
  // ✅ NEW: Search by barcode type
  barcodeType?: BarcodeType;
}

// Debug information with proper types
export interface DebugInfo {
  searchedBarcode?: string;
  cleanBarcode?: string;
  availableBarcodes?: string[];
  detectedBarcodeType?: BarcodeType; // ✅ NEW
  timestamp?: number;
  processingTime?: number;
  source?: string;
  metadata?: Record<string, string | number | boolean>;
}

// Updated ProductResponse interface with barcode type detection
export interface ProductResponse {
  success: boolean;
  data?: Product;
  error?: string;
  debug?: DebugInfo;
  // ✅ NEW: Which barcode was detected
  detectedBarcodeType?: BarcodeType;
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

// ✅ NEW: Utility functions for barcode type detection
export class BarcodeUtils {
  /**
   * Detect which barcode type was scanned
   */
  static detectBarcodeType(
    scannedBarcode: string,
    product: Product
  ): BarcodeType | null {
    if (!scannedBarcode || !product.barcodes) return null;

    const normalized = scannedBarcode.replace(/[^0-9]/g, "");

    if (
      product.barcodes.ea &&
      product.barcodes.ea.replace(/[^0-9]/g, "") === normalized
    ) {
      return BarcodeType.EA;
    }
    if (
      product.barcodes.dsp &&
      product.barcodes.dsp.replace(/[^0-9]/g, "") === normalized
    ) {
      return BarcodeType.DSP;
    }
    if (
      product.barcodes.cs &&
      product.barcodes.cs.replace(/[^0-9]/g, "") === normalized
    ) {
      return BarcodeType.CS;
    }

    return null;
  }

  /**
   * Get barcode by type
   */
  static getBarcodeByType(
    product: Product,
    type: BarcodeType
  ): string | undefined {
    if (!product.barcodes) return undefined;

    switch (type) {
      case BarcodeType.EA:
        return product.barcodes.ea;
      case BarcodeType.DSP:
        return product.barcodes.dsp;
      case BarcodeType.CS:
        return product.barcodes.cs;
      default:
        return undefined;
    }
  }

  /**
   * Get all available barcode types for a product
   */
  static getAvailableBarcodeTypes(product: Product): BarcodeType[] {
    if (!product.barcodes) return [];

    const types: BarcodeType[] = [];
    if (product.barcodes.ea) types.push(BarcodeType.EA);
    if (product.barcodes.dsp) types.push(BarcodeType.DSP);
    if (product.barcodes.cs) types.push(BarcodeType.CS);

    return types;
  }

  /**
   * Get unit label for barcode type
   */
  static getUnitLabel(type: BarcodeType): string {
    switch (type) {
      case BarcodeType.EA:
        return "ชิ้น";
      case BarcodeType.DSP:
        return "แพ็ค";
      case BarcodeType.CS:
        return "ลัง";
      default:
        return "หน่วย";
    }
  }

  /**
   * Get unit abbreviation for barcode type
   */
  static getUnitAbbr(type: BarcodeType): string {
    switch (type) {
      case BarcodeType.EA:
        return "EA";
      case BarcodeType.DSP:
        return "DSP";
      case BarcodeType.CS:
        return "CS";
      default:
        return "UN";
    }
  }
}
