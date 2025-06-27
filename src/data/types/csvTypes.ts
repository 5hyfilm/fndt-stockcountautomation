// src/data/types/csvTypes.ts
import { Product, ProductCategory } from "../../types/product";

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

// Enhanced Product interface with multiple barcodes and pack size info
export interface ProductWithMultipleBarcodes
  extends Omit<Product, "createdAt" | "updatedAt"> {
  barcodes: {
    ea?: string; // Each unit
    dsp?: string; // Display pack
    cs?: string; // Case/Carton
    primary: string; // Primary barcode for display
    scannedType?: "ea" | "dsp" | "cs"; // Which barcode was scanned
  };
  packSize: number; // Add packSize property
  packSizeInfo: PackSizeInfo; // เพิ่ม field ใหม่สำหรับข้อมูลรายละเอียดของ pack size
  createdAt?: Date; // Make optional
  updatedAt?: Date; // Make optional
}

// ✅ Product Group Options for dropdown (สำหรับใช้ใน AddNewProductForm)
export const PRODUCT_GROUP_OPTIONS = [
  "STM", // Sterilized Milk
  "BB Gold", // Bear Brand Gold
  "EVAP", // Evaporated
  "SBC", // Sweetened Beverage Creamer
  "SCM", // Sweetened Condensed Milk
  "Magnolia UHT", // Magnolia UHT
  "NUTRISOY", // Nutriwell
  "Gummy", // Gummy candy
] as const;

// ✅ Type for Product Group (เพื่อ type safety)
export type ProductGroupCode = (typeof PRODUCT_GROUP_OPTIONS)[number];

// Product group to category mapping
export const PRODUCT_GROUP_MAPPING: Record<string, ProductCategory> = {
  STM: ProductCategory.BEVERAGES, // Sterilized Milk
  "BB Gold": ProductCategory.BEVERAGES, // Bear Brand Gold
  EVAP: ProductCategory.DAIRY, // Evaporated
  SBC: ProductCategory.DAIRY, // Sweetened Beverage Creamer
  SCM: ProductCategory.DAIRY, // Sweetened Condensed Milk
  "Magnolia UHT": ProductCategory.BEVERAGES, // Magnolia UHT
  NUTRISOY: ProductCategory.BEVERAGES, // Nutriwell
  Gummy: ProductCategory.CONFECTIONERY, // Gummy candy
};

// ✅ Reverse mapping: ProductCategory กลับเป็น Product Group Code array
// (สำหรับกรณีที่ต้องการหา Product Group ของ category เดียวกัน)
export const CATEGORY_TO_PRODUCT_GROUPS: Record<ProductCategory, string[]> = {
  [ProductCategory.BEVERAGES]: ["STM", "BB Gold", "Magnolia UHT", "NUTRISOY"],
  [ProductCategory.DAIRY]: ["EVAP", "SBC", "SCM"],
  [ProductCategory.CONFECTIONERY]: ["Gummy"],
  // เพิ่ม categories อื่นๆ เป็น array ว่างไว้ก่อน
  [ProductCategory.SNACKS]: [],
  [ProductCategory.CANNED_FOOD]: [],
  [ProductCategory.INSTANT_NOODLES]: [],
  [ProductCategory.SAUCES]: [],
  [ProductCategory.SEASONING]: [],
  [ProductCategory.FROZEN]: [],
  [ProductCategory.BAKERY]: [],
  [ProductCategory.OTHER]: [],
};

// Unit type descriptions
export const UNIT_TYPES = {
  ea: "ชิ้น (Each)",
  dsp: "แพ็ค (Display Pack)",
  cs: "ลัง (Case/Carton)",
};

// ✅ Utility functions

/**
 * ตรวจสอบว่า Product Group Code ที่ใส่มาถูกต้องหรือไม่
 */
export const isValidProductGroup = (
  productGroup: string
): productGroup is ProductGroupCode => {
  return PRODUCT_GROUP_OPTIONS.includes(productGroup as ProductGroupCode);
};

/**
 * แปลง Product Group Code เป็น ProductCategory
 */
export const getProductCategoryFromGroup = (
  productGroup: string
): ProductCategory => {
  return PRODUCT_GROUP_MAPPING[productGroup] || ProductCategory.OTHER;
};

/**
 * หา Product Group Codes ทั้งหมดที่อยู่ใน category เดียวกัน
 */
export const getProductGroupsByCategory = (
  category: ProductCategory
): string[] => {
  return CATEGORY_TO_PRODUCT_GROUPS[category] || [];
};

/**
 * สร้าง dropdown options พร้อมกับ category info (สำหรับการแสดงผลที่ละเอียดกว่า)
 */
export const getProductGroupOptionsWithCategory = () => {
  return PRODUCT_GROUP_OPTIONS.map((group) => ({
    value: group,
    label: group,
    category: getProductCategoryFromGroup(group),
    categoryLabel: getCategoryDisplayName(getProductCategoryFromGroup(group)),
  }));
};

/**
 * แปลง ProductCategory enum เป็นชื่อภาษาไทยที่อ่านง่าย
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
