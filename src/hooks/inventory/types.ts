// src/hooks/inventory/types.ts - Phase 2: Simplified Multi-Unit Structure
import { Product } from "../../types/product";

// ✅ NEW: Multi-unit quantities interface (ไม่มี remainder แล้ว)
export interface MultiUnitQuantities {
  cs?: number; // ลัง
  dsp?: number; // แพ็ค
  ea?: number; // ชิ้น
}

// ✅ NEW: Simplified quantity input (รองรับทั้งแบบเก่าและใหม่)
export type QuantityInput =
  | number
  | {
      quantity: number;
      unit: "cs" | "dsp" | "ea";
    };

// ✅ UPDATED: InventoryItem with multi-unit support
export interface InventoryItem {
  id: string;

  // ✅ Product identification (ใช้ materialCode เป็นหลัก)
  materialCode: string; // รหัสสินค้า (สำคัญ - ใช้รวม SKU)
  productName: string;
  brand: string;
  category: string;
  size: string;
  unit: string;

  // ✅ OLD: Keep for backward compatibility
  barcode: string; // บาร์โค้ดหลัก (primary)
  quantity: number; // จำนวนรวม (สำหรับ compatibility)

  // ✅ NEW: Multi-unit quantities (ไม่มี remainder)
  quantities: MultiUnitQuantities;

  // ✅ Metadata
  lastUpdated: string;
  productData?: Product;
  addedBy?: string;
  branchCode?: string;
  branchName?: string;
  productGroup?: string;
  thaiDescription?: string;

  // ✅ Barcode tracking (เก็บประเภทบาร์โค้ดที่เคยสแกน)
  scannedBarcodes?: {
    cs?: string;
    dsp?: string;
    ea?: string;
  };
}

// ✅ UPDATED: Summary with multi-unit breakdown
export interface InventorySummary {
  totalItems: number; // จำนวน SKU ทั้งหมด
  totalProducts: number; // เหมือนเดิม
  lastUpdate: string;
  categories: Record<string, number>;
  brands: Record<string, number>;

  // ✅ NEW: Multi-unit summary
  quantityBreakdown: {
    totalCS: number; // ลังรวม
    totalDSP: number; // แพ็ครวม
    totalEA: number; // ชิ้นรวม
    itemsWithMultipleUnits: number; // SKU ที่มีหลายหน่วย
  };
}

// ✅ Employee context (ไม่เปลี่ยน)
export interface EmployeeContext {
  employeeName: string;
  branchCode: string;
  branchName: string;
}

// ✅ Storage configuration (อัปเดต version)
export interface StorageConfig {
  storageKey: string;
  versionKey: string;
  currentVersion: string; // เปลี่ยนเป็น "2.0"
}

// ✅ UPDATED: Export configuration with Wide Format support
export interface ExportConfig {
  includeEmployeeInfo: boolean;
  includeTimestamp: boolean;
  includeStats: boolean;
  csvDelimiter: string;
  dateFormat: string;
  // ✅ NEW: Wide format options
  includeUnitBreakdown?: boolean; // แสดงรายละเอียดหน่วยแยก columns
  exportFormat?: "wide" | "long"; // รูปแบบการ export (default: "wide")
  includeBrandInfo?: boolean; // รวมข้อมูล brand/category
  includeTotalColumn?: boolean; // รวม column จำนวนรวม
}

// ✅ UPDATED: Hook interface with new methods
export interface UseInventoryManagerReturn {
  // State
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  summary: InventorySummary;

  // ✅ NEW: Multi-unit operations
  addOrUpdateMultiUnitItem: (
    product: Product,
    quantityInput: QuantityInput,
    barcodeType: "cs" | "dsp" | "ea",
    directProductGroup?: string
  ) => boolean;

  // ✅ NEW: Update specific unit quantity
  updateUnitQuantity: (
    materialCode: string,
    unit: "cs" | "dsp" | "ea",
    newQuantity: number
  ) => boolean;

  // ✅ Legacy support (อาจจะเอาออกในอนาคต)
  addOrUpdateItem: (
    product: Product,
    quantityInput: number,
    barcodeType?: "cs" | "dsp" | "ea",
    directProductGroup?: string
  ) => boolean;

  updateItemQuantity: (itemId: string, newQuantity: number) => boolean;

  // ✅ Core operations (ไม่เปลี่ยน)
  removeItem: (itemId: string) => boolean;
  clearInventory: () => boolean;

  // ✅ Search and utilities
  findItemByMaterialCode: (materialCode: string) => InventoryItem | undefined;
  findItemByBarcode: (barcode: string) => InventoryItem | undefined;
  searchItems: (searchTerm: string) => InventoryItem[];

  // ✅ Export functionality
  exportInventory: () => boolean;

  // ✅ Error handling
  clearError: () => void;
  loadInventory: () => void;
  resetInventoryState: () => boolean;
}

// ✅ NEW: Utility functions
export const getTotalQuantityByUnit = (
  item: InventoryItem,
  unit: "cs" | "dsp" | "ea"
): number => {
  return item.quantities[unit] || 0;
};

export const getTotalQuantityAllUnits = (item: InventoryItem): number => {
  const { cs = 0, dsp = 0, ea = 0 } = item.quantities;
  return cs + dsp + ea;
};

export const hasMultipleUnits = (item: InventoryItem): boolean => {
  const units = Object.keys(item.quantities).filter(
    (unit) => (item.quantities as any)[unit] > 0
  );
  return units.length > 1;
};

export const getActiveUnits = (
  item: InventoryItem
): Array<"cs" | "dsp" | "ea"> => {
  return (Object.keys(item.quantities) as Array<"cs" | "dsp" | "ea">).filter(
    (unit) => (item.quantities[unit] || 0) > 0
  );
};

// ✅ Migration helper (แปลงข้อมูลเก่าเป็นใหม่)
export const migrateOldInventoryItem = (
  oldItem: any,
  barcodeType: "cs" | "dsp" | "ea" = "ea"
): InventoryItem => {
  const quantities: MultiUnitQuantities = {};
  quantities[barcodeType] = oldItem.quantity || 0;

  return {
    id: oldItem.id,
    materialCode: oldItem.materialCode || oldItem.barcode,
    productName: oldItem.productName,
    brand: oldItem.brand || "ไม่ระบุ",
    category: oldItem.category || "ไม่ระบุ",
    size: oldItem.size || "",
    unit: oldItem.unit || "",
    barcode: oldItem.barcode,
    quantity: oldItem.quantity || 0,
    quantities,
    lastUpdated: oldItem.lastUpdated || new Date().toISOString(),
    productData: oldItem.productData,
    addedBy: oldItem.addedBy,
    branchCode: oldItem.branchCode,
    branchName: oldItem.branchName,
    productGroup: oldItem.productGroup,
    thaiDescription: oldItem.thaiDescription,
    scannedBarcodes: {
      [barcodeType]: oldItem.barcode,
    },
  };
};

// ✅ Error types (ไม่เปลี่ยน)
export interface InventoryError extends Error {
  code?:
    | "STORAGE_ERROR"
    | "VALIDATION_ERROR"
    | "EXPORT_ERROR"
    | "QUANTITY_ERROR"
    | "MIGRATION_ERROR"; // ใหม่
  context?: Record<string, unknown>;
}
