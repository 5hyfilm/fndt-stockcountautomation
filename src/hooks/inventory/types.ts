// src/hooks/inventory/types.ts
import { Product } from "../../types/product";

// Interface สำหรับข้อมูล inventory item
export interface InventoryItem {
  id: string;
  barcode: string;
  productName: string;
  brand: string;
  category: string;
  size: string;
  unit: string;
  quantity: number;
  lastUpdated: string;
  productData?: Product;
  addedBy?: string;
  branchCode?: string;
  branchName?: string;
  // เพิ่มข้อมูลประเภทบาร์โค้ด
  barcodeType?: "ea" | "dsp" | "cs";
  materialCode?: string; // F/FG code
  productGroup?: string; // Prod. Gr.
  thaiDescription?: string; // รายละเอียด
}

// Interface สำหรับ summary ข้อมูล
export interface InventorySummary {
  totalItems: number;
  totalProducts: number;
  lastUpdate: string;
  categories: Record<string, number>;
  brands: Record<string, number>;
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

// Export configuration
export interface ExportConfig {
  includeEmployeeInfo: boolean;
  includeTimestamp: boolean;
  includeStats: boolean;
  csvDelimiter: string;
  dateFormat: string;
}

// Hook return type
export interface UseInventoryManagerReturn {
  // State
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  summary: InventorySummary;

  // CRUD Actions
  addOrUpdateItem: (
    product: Product,
    quantity: number,
    barcodeType?: "ea" | "dsp" | "cs"
  ) => boolean;
  updateItemQuantity: (itemId: string, newQuantity: number) => boolean;
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
  resetInventoryState: () => boolean; // เพิ่มฟังก์ชัน reset สำหรับ logout
}

// Error types
export interface InventoryError extends Error {
  code?: "STORAGE_ERROR" | "VALIDATION_ERROR" | "EXPORT_ERROR";
  context?: string;
}

// Validation rules
export interface InventoryValidationRules {
  minQuantity: number;
  maxQuantity?: number; // ✅ เปลี่ยนเป็น optional - ไม่จำกัดจำนวนสูงสุด
  requiredFields: (keyof InventoryItem)[];
  uniqueFields: (keyof InventoryItem)[];
}

// ✅ Default validation rules - ไม่มี max limit
export const DEFAULT_VALIDATION_RULES: InventoryValidationRules = {
  minQuantity: 1,
  // maxQuantity ไม่ได้กำหนด = ไม่จำกัด
  requiredFields: ["id", "barcode", "productName", "quantity"],
  uniqueFields: ["id", "barcode"],
};

// ✅ Updated validation function
export const validateInventoryItem = (
  item: Partial<InventoryItem>,
  rules: InventoryValidationRules = DEFAULT_VALIDATION_RULES
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  rules.requiredFields.forEach((field) => {
    if (!item[field]) {
      errors.push(`${field} is required`);
    }
  });

  // Check quantity constraints
  if (item.quantity !== undefined) {
    if (item.quantity < rules.minQuantity) {
      errors.push(`Quantity must be at least ${rules.minQuantity}`);
    }

    // ✅ เช็ค maxQuantity เฉพาะเมื่อมีการกำหนดไว้
    if (rules.maxQuantity !== undefined && item.quantity > rules.maxQuantity) {
      errors.push(`Quantity must not exceed ${rules.maxQuantity}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
