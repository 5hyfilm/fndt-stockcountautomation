// Path: src/data/types/csvTypes.ts
// Complete CSV types with all utility functions properly exported

import { Product, ProductCategory, BarcodeType } from "../../types/product";

// CSV Row interface based on the actual CSV structure
export interface CSVProductRow {
  Material: string;
  Description: string;
  "Thai Desc.": string;
  "Pack Size": string;
  "Product Group": string;
  "Shelflife (Months)": string;
  "Bar Code EA": string;
  "Bar Code DSP": string;
  "Bar Code CS": string;
}

// Pack size information interface
export interface PackSizeInfo {
  rawPackSize: string;
  displayText: string;
  totalQuantity: number;
  unit: string | null;
}

// ✅ NEW: Barcode lookup result
export interface BarcodeSearchResult {
  found: boolean;
  product?: ProductWithMultipleBarcodes;
  detectedType?: BarcodeType;
  scannedBarcode: string;
  normalizedBarcode: string;
  matchedBarcode?: string; // The actual barcode from CSV that matched
}

// ✅ UPDATED: Enhanced Product interface with improved barcode support
export interface ProductWithMultipleBarcodes
  extends Omit<Product, "createdAt" | "updatedAt" | "barcode"> {
  // ✅ Required barcode information
  barcodes: {
    ea?: string; // Each unit barcode
    dsp?: string; // Display pack barcode
    cs?: string; // Case/Carton barcode
    primary: string; // Primary barcode for backward compatibility
    scannedType?: BarcodeType; // Which barcode was actually scanned
  };

  // ✅ Enhanced product information
  materialCode: string; // Material code from CSV (required)
  productGroup: string; // Product group from CSV (required)
  packSize: number; // Parsed pack size quantity
  packSizeInfo: PackSizeInfo; // Detailed pack size information

  // Optional dates (for backward compatibility)
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ Product Group Options (รองรับข้อมูลจริงจาก CSV)
export const PRODUCT_GROUP_OPTIONS = [
  "STM", // Sterilized Milk
  "BB Gold", // Bear Brand Gold
  "EVAP", // Evaporated
  "SBC", // Sweetened Beverage Creamer
  "SCM", // Sweetened Condensed Milk
  "Magnolia UHT", // Magnolia UHT
  "NUTRISOY", // Nutriwell
  "Gummy", // Gummy candy
  "NEW", // สำหรับสินค้าใหม่
] as const;

export type ProductGroupCode = (typeof PRODUCT_GROUP_OPTIONS)[number];

// Product group to category mapping
export const PRODUCT_GROUP_MAPPING: Record<string, ProductCategory> = {
  STM: ProductCategory.BEVERAGES,
  "BB Gold": ProductCategory.BEVERAGES,
  EVAP: ProductCategory.DAIRY,
  SBC: ProductCategory.DAIRY,
  SCM: ProductCategory.DAIRY,
  "Magnolia UHT": ProductCategory.BEVERAGES,
  NUTRISOY: ProductCategory.BEVERAGES,
  Gummy: ProductCategory.CONFECTIONERY,
  NEW: ProductCategory.OTHER,
};

// ✅ Reverse mapping: ProductCategory กลับเป็น Product Group Code array
export const CATEGORY_TO_PRODUCT_GROUPS: Record<
  ProductCategory,
  ProductGroupCode[]
> = {
  [ProductCategory.BEVERAGES]: ["STM", "BB Gold", "Magnolia UHT", "NUTRISOY"],
  [ProductCategory.DAIRY]: ["EVAP", "SBC", "SCM"],
  [ProductCategory.CONFECTIONERY]: ["Gummy"],
  [ProductCategory.SNACKS]: [],
  [ProductCategory.CANNED_FOOD]: [],
  [ProductCategory.INSTANT_NOODLES]: [],
  [ProductCategory.SAUCES]: [],
  [ProductCategory.SEASONING]: [],
  [ProductCategory.FROZEN]: [],
  [ProductCategory.BAKERY]: [],
  [ProductCategory.OTHER]: ["NEW"],
};

// ✅ MAIN UTILITY FUNCTIONS (เพื่อแก้ build error)

/**
 * Get product category from product group
 */
export const getProductCategoryFromGroup = (
  productGroup: string
): ProductCategory => {
  return PRODUCT_GROUP_MAPPING[productGroup] || ProductCategory.OTHER;
};

/**
 * Get product groups from category
 */
export const getProductGroupsFromCategory = (
  category: ProductCategory
): ProductGroupCode[] => {
  return CATEGORY_TO_PRODUCT_GROUPS[category] || [];
};

/**
 * Check if product group is valid
 */
export const isValidProductGroup = (productGroup: string): boolean => {
  return Object.keys(PRODUCT_GROUP_MAPPING).includes(productGroup);
};

/**
 * Get display name for category (Thai)
 */
export const getCategoryDisplayName = (category: ProductCategory): string => {
  const categoryNames: Record<ProductCategory, string> = {
    [ProductCategory.BEVERAGES]: "เครื่องดื่ม",
    [ProductCategory.DAIRY]: "ผลิตภัณฑ์นม",
    [ProductCategory.SNACKS]: "ขนม",
    [ProductCategory.CANNED_FOOD]: "อาหารกระป๋อง",
    [ProductCategory.INSTANT_NOODLES]: "บะหมี่กึ่งสำเร็จรูป",
    [ProductCategory.SAUCES]: "ซอส",
    [ProductCategory.SEASONING]: "เครื่องปรุงรส",
    [ProductCategory.FROZEN]: "อาหารแช่แข็ง",
    [ProductCategory.BAKERY]: "เบเกอรี่",
    [ProductCategory.CONFECTIONERY]: "ขนมหวาน",
    [ProductCategory.OTHER]: "อื่นๆ",
  };
  return categoryNames[category] || "ไม่ระบุ";
};

// ✅ NEW: CSV Processing utilities
export class CSVUtils {
  /**
   * Search for product by barcode across all barcode types
   */
  static searchByBarcode(
    products: ProductWithMultipleBarcodes[],
    scannedBarcode: string
  ): BarcodeSearchResult {
    const normalized = scannedBarcode.replace(/[^0-9]/g, "").trim();

    if (!normalized) {
      return {
        found: false,
        scannedBarcode,
        normalizedBarcode: normalized,
      };
    }

    // Search through all products
    for (const product of products) {
      // Check EA barcode
      if (product.barcodes.ea) {
        const eaNormalized = product.barcodes.ea.replace(/[^0-9]/g, "");
        if (eaNormalized === normalized) {
          return {
            found: true,
            product: {
              ...product,
              barcodes: {
                ...product.barcodes,
                scannedType: BarcodeType.EA,
              },
              detectedBarcodeType: BarcodeType.EA,
            },
            detectedType: BarcodeType.EA,
            scannedBarcode,
            normalizedBarcode: normalized,
            matchedBarcode: product.barcodes.ea,
          };
        }
      }

      // Check DSP barcode
      if (product.barcodes.dsp) {
        const dspNormalized = product.barcodes.dsp.replace(/[^0-9]/g, "");
        if (dspNormalized === normalized) {
          return {
            found: true,
            product: {
              ...product,
              barcodes: {
                ...product.barcodes,
                scannedType: BarcodeType.DSP,
              },
              detectedBarcodeType: BarcodeType.DSP,
            },
            detectedType: BarcodeType.DSP,
            scannedBarcode,
            normalizedBarcode: normalized,
            matchedBarcode: product.barcodes.dsp,
          };
        }
      }

      // Check CS barcode
      if (product.barcodes.cs) {
        const csNormalized = product.barcodes.cs.replace(/[^0-9]/g, "");
        if (csNormalized === normalized) {
          return {
            found: true,
            product: {
              ...product,
              barcodes: {
                ...product.barcodes,
                scannedType: BarcodeType.CS,
              },
              detectedBarcodeType: BarcodeType.CS,
            },
            detectedType: BarcodeType.CS,
            scannedBarcode,
            normalizedBarcode: normalized,
            matchedBarcode: product.barcodes.cs,
          };
        }
      }
    }

    return {
      found: false,
      scannedBarcode,
      normalizedBarcode: normalized,
    };
  }

  /**
   * Get available barcode types for a product
   */
  static getAvailableBarcodeTypes(
    product: ProductWithMultipleBarcodes
  ): BarcodeType[] {
    const types: BarcodeType[] = [];

    if (product.barcodes.ea && product.barcodes.ea.trim()) {
      types.push(BarcodeType.EA);
    }
    if (product.barcodes.dsp && product.barcodes.dsp.trim()) {
      types.push(BarcodeType.DSP);
    }
    if (product.barcodes.cs && product.barcodes.cs.trim()) {
      types.push(BarcodeType.CS);
    }

    return types;
  }

  /**
   * Get barcode by type
   */
  static getBarcodeByType(
    product: ProductWithMultipleBarcodes,
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
   * Validate CSV row data
   */
  static validateCSVRow(
    row: CSVProductRow,
    index: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!row.Material || row.Material.trim() === "") {
      errors.push(`Row ${index}: ไม่มีรหัสสินค้า (Material)`);
    }

    if (!row.Description || row.Description.trim() === "") {
      errors.push(`Row ${index}: ไม่มีชื่อสินค้า (Description)`);
    }

    if (!row["Thai Desc."] || row["Thai Desc."].trim() === "") {
      errors.push(`Row ${index}: ไม่มีชื่อสินค้าภาษาไทย`);
    }

    if (!row["Product Group"] || row["Product Group"].trim() === "") {
      errors.push(`Row ${index}: ไม่มีกลุ่มสินค้า (Product Group)`);
    }

    // ต้องมี barcode อย่างน้อย 1 ตัว
    const hasBarcode =
      (row["Bar Code EA"] && row["Bar Code EA"].trim()) ||
      (row["Bar Code DSP"] && row["Bar Code DSP"].trim()) ||
      (row["Bar Code CS"] && row["Bar Code CS"].trim());

    if (!hasBarcode) {
      errors.push(
        `Row ${index}: ต้องมี barcode อย่างน้อย 1 ประเภท (EA/DSP/CS)`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clean and normalize barcode
   */
  static normalizeBarcode(barcode: string | undefined): string {
    if (!barcode) return "";
    return barcode.replace(/[^0-9]/g, "").trim();
  }

  /**
   * Check if barcode is valid (has content)
   */
  static isValidBarcode(barcode: string | undefined): boolean {
    if (!barcode) return false;
    const normalized = this.normalizeBarcode(barcode);
    return normalized.length >= 8; // Minimum barcode length
  }

  /**
   * Extract brand name from description
   */
  static extractBrand(description: string, thaiDesc: string): string {
    // Common brand extraction patterns
    const brandPatterns = [
      /^([A-Z][A-Z\s&]+?)(?:\s+[A-Z][A-Z\s]*)?(?:\s+\w+\s*\d+|\s+\w+)*$/i,
      /^(BEAR\s+BRAND|MAGNOLIA|NUTRISOY)/i,
      /^([A-Za-z]+(?:\s+[A-Za-z]+)*)/,
    ];

    for (const pattern of brandPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: use first word
    const firstWord = description.split(/\s+/)[0];
    return firstWord || "ไม่ระบุแบรนด์";
  }

  /**
   * Format product name for display
   */
  static formatProductName(thaiDesc: string, description: string): string {
    // ใช้ชื่อภาษาไทยเป็นหลัก ถ้าไม่มีใช้ชื่ภาษาอังกฤษ
    const name = thaiDesc?.trim() || description?.trim() || "ไม่ระบุชื่อ";

    // ลบข้อความขนาดบรรจุภัณฑ์ออกจากชื่อ
    return name
      .replace(/\s*\d+[xX]\(\d+[xX]\d+\s*(ml|g|มล|กรัม)\)/gi, "")
      .replace(/\s*\d+[xX]\d+\s*(ml|g|มล|กรัม)/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}

// ✅ Unit type descriptions (backward compatibility)
export const UNIT_TYPES = {
  ea: "ชิ้น (Each)",
  dsp: "แพ็ค (Display Pack)",
  cs: "ลัง (Case/Carton)",
};

// ✅ Export all CSVUtils functions for convenience
export { CSVUtils as BarcodeDetectionUtils };
