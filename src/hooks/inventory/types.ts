// src/hooks/inventory/types.ts - Complete Updated with Dual Unit Support
import { Product } from "../../types/product";

// Interface สำหรับข้อมูล inventory item (Updated)
export interface InventoryItem {
  id: string;
  barcode: string;
  productName: string;
  brand: string;
  category: string;
  size: string;
  unit: string;

  // ✅ เปลี่ยนจาก quantity เดียว → 2 หน่วย
  csCount: number; // "นับจริง (cs)" - หน่วยใหญ่ (CS หรือ DSP)
  pieceCount: number; // "นับจริง (ชิ้น)" - หน่วยเล็ก (DSP, EA, หรือ เศษ)

  // ✅ เพิ่มข้อมูลรายละเอียดหน่วย
  csUnitType: "cs" | "dsp" | null; // ประเภทของหน่วยใหญ่
  pieceUnitType: "dsp" | "ea" | "fractional"; // ประเภทของหน่วยเล็ก

  lastUpdated: string;
  productData?: Product;
  addedBy?: string;
  branchCode?: string;
  branchName?: string;

  // ✅ เก็บข้อมูลเดิมไว้ compatibility
  quantity: number; // รวมจำนวนทั้งหมดแปลงเป็น EA
  barcodeType?: "ea" | "dsp" | "cs"; // ประเภทบาร์โค้ดที่สแกน
  materialCode?: string;
  productGroup?: string;
  thaiDescription?: string;
}

// ✅ เพิ่ม interface สำหรับ dual unit input
export interface DualUnitInputData {
  primaryValue: number; // ค่าหน่วยหลัก (CS หรือ DSP)
  secondaryValue: number; // ค่าหน่วยรอง (DSP, EA, หรือ เศษ)
  primaryUnitType: "cs" | "dsp";
  secondaryUnitType: "dsp" | "ea" | "fractional";
  scannedBarcodeType: "ea" | "dsp" | "cs";
}

// Interface สำหรับ summary ข้อมูล
export interface InventorySummary {
  totalItems: number;
  totalProducts: number;
  lastUpdate: string;
  categories: Record<string, number>;
  brands: Record<string, number>;

  // ✅ เพิ่มสรุปตามหน่วย
  totalCSUnits: number; // รวม CS ทั้งหมด
  totalDSPUnits: number; // รวม DSP ทั้งหมด
  totalPieces: number; // รวมชิ้นทั้งหมด
}

// Interface สำหรับข้อมูลพนักงาน
export interface EmployeeContext {
  employeeName: string;
  branchCode: string;
  branchName: string;
}

// Storage configuration
export interface StorageConfig {
  storageKey: string;
  versionKey: string;
  currentVersion: string;
}

// Export configuration (Updated)
export interface ExportConfig {
  includeEmployeeInfo: boolean;
  includeTimestamp: boolean;
  includeStats: boolean;
  csvDelimiter: string;
  dateFormat: string;

  // ✅ เพิ่มการตั้งค่า export แยกหน่วย
  separateUnitColumns: boolean; // แยก column cs และ piece
  includeConvertedQuantity: boolean; // รวม column quantity รวม
}

// ✅ Updated Hook return type - COMPLETE
export interface UseInventoryManagerReturn {
  // State
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  summary: InventorySummary;

  // ✅ Updated CRUD Actions - รองรับ dual unit
  addOrUpdateItemDualUnit: (
    product: Product,
    dualUnitData: DualUnitInputData
  ) => boolean;

  // ✅ เก็บ method เดิมไว้ compatibility
  addOrUpdateItem: (
    product: Product,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;

  updateItemQuantity: (itemId: string, newQuantity: number) => boolean;

  // ✅ เพิ่ม method อัพเดทแยกหน่วย
  updateItemDualUnit: (
    itemId: string,
    newCSCount: number,
    newPieceCount: number
  ) => boolean;

  removeItem: (itemId: string) => boolean;
  clearInventory: () => boolean;

  // Search and utilities
  findItemByBarcode: (barcode: string) => InventoryItem | undefined;
  searchItems: (searchTerm: string) => InventoryItem[];

  // Export functionality
  exportInventory: () => boolean;

  // ✅ เพิ่ม export แยกหน่วย
  exportInventoryWithDualUnits: () => boolean;

  // Error handling and utilities
  clearError: () => void;
  loadInventory: () => void;
  resetInventoryState: () => boolean;
}

// Error types
export interface InventoryError extends Error {
  code?:
    | "STORAGE_ERROR"
    | "VALIDATION_ERROR"
    | "EXPORT_ERROR"
    | "UNIT_CONVERSION_ERROR";
  context?: string;
}

// ✅ เพิ่ม Validation rules สำหรับ dual unit
export interface InventoryValidationRules {
  minQuantity: number;
  maxQuantity?: number;

  // ✅ Rules สำหรับ dual unit
  minCSCount: number;
  maxCSCount?: number;
  minPieceCount: number;
  maxPieceCount?: number;

  allowZeroValues: boolean; // อนุญาตให้มีค่า 0 ได้หรือไม่
}

// ✅ เพิ่ม utility types
export type UnitColumnType = "cs" | "piece";

export interface UnitConversionResult {
  csCount: number;
  pieceCount: number;
  totalQuantityInEA: number;
  conversionNotes?: string;
}
