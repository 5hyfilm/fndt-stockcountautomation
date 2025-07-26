// src/data/types/csvTypes.ts
// 🚀 Simplified approach - No complex legacy types

import { ProductCategory } from "../../types/product";

// =========================================
// 🎯 Simple Product Group Mapping
// =========================================

/**
 * Simple mapping from business product groups to categories
 * ✅ Just a lookup function - no complex types needed
 */
const PRODUCT_GROUP_TO_CATEGORY: Record<string, ProductCategory> = {
  // Beverage groups
  STM: ProductCategory.BEVERAGE,
  BB_GOLD: ProductCategory.BEVERAGE,
  EVAP: ProductCategory.BEVERAGE,
  SBC: ProductCategory.BEVERAGE,
  SCM: ProductCategory.BEVERAGE,
  MAGNOLIA_UHT: ProductCategory.BEVERAGE,
  NUTRISOY: ProductCategory.BEVERAGE,
  DAIRY: ProductCategory.BEVERAGE,
  BEVERAGES: ProductCategory.BEVERAGE,

  // Snack groups
  GUMMY: ProductCategory.SNACK,
  CONFECTIONERY: ProductCategory.SNACK,
  SNACKS: ProductCategory.SNACK,

  // Food groups
  CANNED_FOOD: ProductCategory.FOOD,
  INSTANT_NOODLES: ProductCategory.FOOD,
  SAUCES: ProductCategory.FOOD,
  SEASONING: ProductCategory.FOOD,
  FROZEN: ProductCategory.FOOD,
  BAKERY: ProductCategory.FOOD,
};

/**
 * Valid product groups (business-specific)
 */
export const VALID_PRODUCT_GROUPS = Object.keys(PRODUCT_GROUP_TO_CATEGORY);

// =========================================
// ✅ Simple Helper Functions
// =========================================

/**
 * Convert business product group to category
 */
export function getProductCategoryFromGroup(
  productGroup: string
): ProductCategory {
  return PRODUCT_GROUP_TO_CATEGORY[productGroup] || ProductCategory.OTHER;
}

/**
 * Check if product group is valid
 */
export function isValidProductGroup(productGroup: string): boolean {
  return productGroup in PRODUCT_GROUP_TO_CATEGORY;
}

/**
 * Get display name for product group
 */
export function getProductGroupDisplayName(productGroup: string): string {
  const displayNames: Record<string, string> = {
    STM: "STM",
    BB_GOLD: "BB Gold",
    EVAP: "Evaporated Milk",
    SBC: "SBC",
    SCM: "SCM",
    MAGNOLIA_UHT: "Magnolia UHT",
    NUTRISOY: "Nutrisoy",
    DAIRY: "Dairy Products",
    BEVERAGES: "เครื่องดื่ม",
    GUMMY: "Gummy",
    CONFECTIONERY: "Confectionery",
    SNACKS: "ขนมขบเคี้ยว",
    CANNED_FOOD: "อาหารกระป๋อง",
    INSTANT_NOODLES: "บะหมี่กึ่งสำเร็จรูป",
    SAUCES: "ซอส",
    SEASONING: "เครื่องปรุง",
    FROZEN: "อาหารแช่แข็ง",
    BAKERY: "เบเกอรี่",
  };

  return displayNames[productGroup] || productGroup;
}

/**
 * Get category display name in Thai
 */
export function getCategoryDisplayName(category: ProductCategory): string {
  const displayNames: Record<ProductCategory, string> = {
    [ProductCategory.BEVERAGE]: "เครื่องดื่ม",
    [ProductCategory.SNACK]: "ขนมขบเคี้ยว",
    [ProductCategory.FOOD]: "อาหาร",
    [ProductCategory.PERSONAL_CARE]: "ผลิตภัณฑ์ดูแลผิว",
    [ProductCategory.HOUSEHOLD]: "ของใช้ในบ้าน",
    [ProductCategory.HEALTH]: "สุขภาพ",
    [ProductCategory.OTHER]: "อื่นๆ",
  };

  return displayNames[category] || category;
}

// =========================================
// 📊 CSV Processing Types
// =========================================

/**
 * CSV row structure
 */
export interface CSVProductRow {
  materialCode: string;
  productName: string;
  brand: string;
  productGroup: string; // ✅ Business-specific group (STM, BB_GOLD, etc.)
  size: string;
  unit: string;
  barcode: string;
  description?: string;
  price?: string | number;
  status?: string;
}

/**
 * Validate CSV product row
 */
export function validateCSVProductRow(row: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!row.materialCode) errors.push("Material Code is required");
  if (!row.productName) errors.push("Product Name is required");
  if (!row.brand) errors.push("Brand is required");
  if (!row.productGroup) errors.push("Product Group is required");
  if (!row.barcode) errors.push("Barcode is required");

  if (row.productGroup && !isValidProductGroup(row.productGroup)) {
    errors.push(
      `Invalid product group: ${
        row.productGroup
      }. Valid groups: ${VALID_PRODUCT_GROUPS.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Convert CSV row to Product format
 */
export function csvRowToProduct(
  row: CSVProductRow
): Partial<import("../../types/product").Product> {
  return {
    materialCode: row.materialCode,
    productName: row.productName,
    brand: row.brand,
    category: getProductCategoryFromGroup(row.productGroup), // ✅ Auto-convert to category
    productGroup: row.productGroup, // ✅ Keep business group
    size: row.size,
    unit: row.unit,
    barcode: row.barcode,
    thaiDescription: row.description,
    price:
      typeof row.price === "string" ? parseFloat(row.price) || 0 : row.price,
    status: row.status as any,
  };
}
