// src/hooks/inventory/types.ts - Phase 2: Updated Types with Quantity Details
import { Product } from "../../types/product";

// ✅ New quantity detail interface for DSP/CS scanning
export interface QuantityDetail {
  major: number; // DSP/CS amount (แพ็ค/ลัง)
  remainder: number; // EA remainder (เศษ)
  scannedType: "ea" | "dsp" | "cs"; // Type that was scanned
  totalEA?: number; // Optional calculated total (for future use)
}

// ✅ Union type for quantity input - supports both old and new formats
export type QuantityInput = number | QuantityDetail;

// ✅ Updated InventoryItem interface - maintaining backward compatibility
export interface InventoryItem {
  id: string;
  barcode: string;
  productName: string;
  brand: string;
  category: string;
  size: string;
  unit: string;

  // ✅ Keep old quantity field for backward compatibility
  quantity: number;

  // ✅ Add new quantityDetail for enhanced scanning
  quantityDetail?: QuantityDetail;

  lastUpdated: string;
  productData?: Product;
  addedBy?: string;
  branchCode?: string;
  branchName?: string;
  barcodeType?: "ea" | "dsp" | "cs";
  materialCode?: string;
  productGroup?: string;
  thaiDescription?: string;
}

// ✅ Enhanced Interface สำหรับ summary ข้อมูล
export interface InventorySummary {
  totalItems: number;
  totalProducts: number;
  lastUpdate: string;
  categories: Record<string, number>;
  brands: Record<string, number>;
  // ✅ Add new summary fields for quantity details
  quantityBreakdown?: {
    totalEA: number;
    totalDSP: number;
    totalCS: number;
    itemsWithDetail: number;
    totalRemainderItems?: number;
  };
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

// ✅ Enhanced Export configuration
export interface ExportConfig {
  includeEmployeeInfo: boolean;
  includeTimestamp: boolean;
  includeStats: boolean;
  csvDelimiter: string;
  dateFormat: string;
  // ✅ Add new export options
  includeQuantityDetail?: boolean;
  separateQuantityColumns?: boolean;
}

// ✅ Updated Hook return type with enhanced quantity support
export interface UseInventoryManagerReturn {
  // State
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  summary: InventorySummary;

  // ✅ Updated CRUD Actions - supporting both old and new quantity formats AND directProductGroup
  addOrUpdateItem: (
    product: Product,
    quantityInput: QuantityInput,
    barcodeType?: "ea" | "dsp" | "cs",
    directProductGroup?: string // ✅ เพิ่ม parameter สำหรับ product group ตรงๆ
  ) => boolean;

  updateItemQuantity: (itemId: string, newQuantity: number) => boolean;

  // ✅ New method for updating quantity details
  updateItemQuantityDetail?: (
    itemId: string,
    quantityDetail: QuantityDetail
  ) => boolean;

  removeItem: (itemId: string) => boolean;
  clearInventory: () => boolean;

  // Search and utilities
  findItemByBarcode: (barcode: string) => InventoryItem | undefined;
  searchItems: (searchTerm: string) => InventoryItem[];

  // Export functionality
  exportInventory: () => boolean;

  // Error handling and utilities
  clearError: () => void;
  loadInventory: () => void;
  resetInventoryState: () => boolean;
}

// ✅ Utility type guards and helpers
export const isQuantityDetail = (
  input: QuantityInput
): input is QuantityDetail => {
  return typeof input === "object" && "major" in input && "remainder" in input;
};

export const isSimpleQuantity = (input: QuantityInput): input is number => {
  return typeof input === "number";
};

// ✅ Helper function to get effective quantity for compatibility
export const getEffectiveQuantity = (item: InventoryItem): number => {
  // If has quantityDetail, use the major quantity as primary
  if (item.quantityDetail) {
    return item.quantityDetail.major;
  }
  // Fallback to old quantity field
  return item.quantity;
};

// ✅ Helper function to get display text for quantity
export const getQuantityDisplayText = (item: InventoryItem): string => {
  if (item.quantityDetail) {
    const { major, remainder, scannedType } = item.quantityDetail;
    const unitMap = {
      ea: "ชิ้น",
      dsp: "แพ็ค",
      cs: "ลัง",
    };

    const majorText = `${major} ${unitMap[scannedType]}`;
    const remainderText = remainder > 0 ? ` + ${remainder} ชิ้น` : "";

    return majorText + remainderText;
  }

  // Fallback to simple quantity display
  return `${item.quantity} ชิ้น`;
};

// ✅ Helper function to convert old format to new format
export const migrateQuantityToDetail = (
  quantity: number,
  barcodeType: "ea" | "dsp" | "cs" = "ea"
): QuantityDetail => {
  if (barcodeType === "ea") {
    return {
      major: quantity,
      remainder: 0,
      scannedType: "ea",
    };
  }

  // For DSP/CS, assume all quantity is in major unit
  return {
    major: quantity,
    remainder: 0,
    scannedType: barcodeType,
  };
};

// Error types
export interface InventoryError extends Error {
  code?:
    | "STORAGE_ERROR"
    | "VALIDATION_ERROR"
    | "EXPORT_ERROR"
    | "QUANTITY_ERROR";
  context?: Record<string, unknown>;
}
