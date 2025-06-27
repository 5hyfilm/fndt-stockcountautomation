// Path: src/hooks/inventory/types.ts
// Phase 3: Updated for separate unit storage (CS/DSP/EA as separate records)

import { Product, BarcodeType } from "../../types/product";

// ✅ MAJOR CHANGE: Simple quantity only (no more complex QuantityDetail)
export type QuantityInput = number;

// ✅ NEW: Base product identifier for grouping
export interface ProductIdentifier {
  materialCode: string;
  productName: string;
  brand: string;
  productGroup: string;
  thaiDescription?: string;
}

// ✅ UPDATED: InventoryItem - One record per unit type
export interface InventoryItem {
  id: string;
  barcode: string; // The specific barcode that was scanned
  productName: string; // Product name + unit suffix (e.g., "Bear Brand_CS")
  baseName: string; // Base product name without unit (e.g., "Bear Brand")
  brand: string;
  category: string;
  size: string;
  unit: string;

  // ✅ Simple quantity only (per unit type)
  quantity: number;

  // ✅ REQUIRED: Unit type for this record
  barcodeType: BarcodeType; // "ea" | "dsp" | "cs"

  // Product identification
  materialCode: string; // Original material code from CSV
  productGroup: string; // Product group from CSV
  thaiDescription?: string; // Thai description from CSV

  // Metadata
  lastUpdated: string;
  productData?: Product;
  addedBy?: string;
  branchCode?: string;
  branchName?: string;

  // ✅ NEW: Base product identifier for grouping in UI
  baseProductId: string; // Generated ID for grouping (materialCode_baseName)
}

// ✅ NEW: Grouped inventory view for UI display
export interface GroupedInventoryItem {
  baseProductId: string;
  baseName: string;
  brand: string;
  productGroup: string;
  thaiDescription?: string;
  materialCode: string;

  // Unit quantities
  csQuantity: number;
  dspQuantity: number;
  eaQuantity: number;

  // Individual records
  csRecord?: InventoryItem;
  dspRecord?: InventoryItem;
  eaRecord?: InventoryItem;

  // Metadata
  lastUpdated: string;
  totalRecords: number;
}

// ✅ Updated summary with unit breakdown
export interface InventorySummary {
  totalItems: number; // Total quantity across all units
  totalProducts: number; // Number of unique base products
  totalRecords: number; // Total individual records
  lastUpdate: string;
  categories: Record<string, number>;
  brands: Record<string, number>;

  // ✅ Unit breakdown
  unitBreakdown: {
    totalCS: number;
    totalDSP: number;
    totalEA: number;
    uniqueProductsWithCS: number;
    uniqueProductsWithDSP: number;
    uniqueProductsWithEA: number;
  };

  // ✅ Product groups summary
  productGroups: Record<string, number>;
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

// ✅ Updated export configuration
export interface ExportConfig {
  includeEmployeeInfo: boolean;
  includeTimestamp: boolean;
  includeStats: boolean;
  csvDelimiter: string;
  dateFormat: string;

  // ✅ NEW: Export format options
  exportFormat: "grouped" | "individual"; // Group by base product or keep separate
  includeUnitBreakdown: boolean;
}

// ✅ NEW: Inventory operation result
export interface InventoryOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  affectedItems?: string[]; // IDs of affected items
  data?: InventoryItem | InventoryItem[];
}

// ✅ UPDATED: Hook return type with enhanced operations
export interface UseInventoryManagerReturn {
  // State
  inventory: InventoryItem[]; // Raw inventory items
  groupedInventory: GroupedInventoryItem[]; // Grouped view for UI
  isLoading: boolean;
  error: string | null;
  summary: InventorySummary;

  // ✅ UPDATED: CRUD Actions - simplified for single unit operations
  addOrUpdateItem: (
    product: Product,
    quantity: number,
    barcodeType: BarcodeType,
    directProductGroup?: string
  ) => InventoryOperationResult;

  // ✅ Update specific unit quantity
  updateItemQuantity: (
    baseProductId: string,
    barcodeType: BarcodeType,
    newQuantity: number
  ) => InventoryOperationResult;

  // ✅ Remove specific unit or entire product
  removeItem: (itemId: string) => InventoryOperationResult;
  removeProduct: (baseProductId: string) => InventoryOperationResult; // Remove all units

  clearInventory: () => boolean;

  // Search and utilities
  findItemByBarcode: (
    barcode: string,
    barcodeType?: BarcodeType
  ) => InventoryItem | undefined;
  findProductByBaseId: (
    baseProductId: string
  ) => GroupedInventoryItem | undefined;
  searchItems: (searchTerm: string) => InventoryItem[];
  searchGroupedItems: (searchTerm: string) => GroupedInventoryItem[];

  // Export functionality
  exportInventory: () => boolean;

  // Error handling and utilities
  clearError: () => void;
  loadInventory: () => void;
  resetInventoryState: () => boolean;
}

// ✅ NEW: Utility functions for inventory management
export class InventoryUtils {
  /**
   * Generate base product ID for grouping
   */
  static generateBaseProductId(materialCode: string, baseName: string): string {
    return `${materialCode}_${baseName.replace(/[^a-zA-Z0-9ก-๙]/g, "_")}`;
  }

  /**
   * Generate product name with unit suffix
   */
  static generateProductNameWithUnit(
    baseName: string,
    barcodeType: BarcodeType
  ): string {
    const suffix = barcodeType.toUpperCase();
    return `${baseName}_${suffix}`;
  }

  /**
   * Extract base name from product name with unit
   */
  static extractBaseName(productNameWithUnit: string): string {
    return productNameWithUnit.replace(/_(CS|DSP|EA)$/i, "");
  }

  /**
   * Group inventory items by base product
   */
  static groupInventoryItems(items: InventoryItem[]): GroupedInventoryItem[] {
    const grouped = new Map<string, GroupedInventoryItem>();

    items.forEach((item) => {
      const existing = grouped.get(item.baseProductId);

      if (existing) {
        // Update existing group
        switch (item.barcodeType) {
          case BarcodeType.CS:
            existing.csQuantity = item.quantity;
            existing.csRecord = item;
            break;
          case BarcodeType.DSP:
            existing.dspQuantity = item.quantity;
            existing.dspRecord = item;
            break;
          case BarcodeType.EA:
            existing.eaQuantity = item.quantity;
            existing.eaRecord = item;
            break;
        }
        existing.totalRecords++;
        existing.lastUpdated =
          item.lastUpdated > existing.lastUpdated
            ? item.lastUpdated
            : existing.lastUpdated;
      } else {
        // Create new group
        const newGroup: GroupedInventoryItem = {
          baseProductId: item.baseProductId,
          baseName: item.baseName,
          brand: item.brand,
          productGroup: item.productGroup,
          thaiDescription: item.thaiDescription,
          materialCode: item.materialCode,
          csQuantity: 0,
          dspQuantity: 0,
          eaQuantity: 0,
          lastUpdated: item.lastUpdated,
          totalRecords: 1,
        };

        // Set quantity for specific unit
        switch (item.barcodeType) {
          case BarcodeType.CS:
            newGroup.csQuantity = item.quantity;
            newGroup.csRecord = item;
            break;
          case BarcodeType.DSP:
            newGroup.dspQuantity = item.quantity;
            newGroup.dspRecord = item;
            break;
          case BarcodeType.EA:
            newGroup.eaQuantity = item.quantity;
            newGroup.eaRecord = item;
            break;
        }

        grouped.set(item.baseProductId, newGroup);
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.materialCode.localeCompare(b.materialCode)
    );
  }

  /**
   * Calculate summary from inventory items
   */
  static calculateSummary(items: InventoryItem[]): InventorySummary {
    const grouped = this.groupInventoryItems(items);
    const categories: Record<string, number> = {};
    const brands: Record<string, number> = {};
    const productGroups: Record<string, number> = {};

    let totalCS = 0;
    let totalDSP = 0;
    let totalEA = 0;
    let totalItems = 0;

    const productsWithCS = new Set<string>();
    const productsWithDSP = new Set<string>();
    const productsWithEA = new Set<string>();

    items.forEach((item) => {
      // Count by category
      categories[item.category] =
        (categories[item.category] || 0) + item.quantity;

      // Count by brand
      brands[item.brand] = (brands[item.brand] || 0) + item.quantity;

      // Count by product group
      productGroups[item.productGroup] =
        (productGroups[item.productGroup] || 0) + item.quantity;

      // Count by unit type
      switch (item.barcodeType) {
        case BarcodeType.CS:
          totalCS += item.quantity;
          productsWithCS.add(item.baseProductId);
          break;
        case BarcodeType.DSP:
          totalDSP += item.quantity;
          productsWithDSP.add(item.baseProductId);
          break;
        case BarcodeType.EA:
          totalEA += item.quantity;
          productsWithEA.add(item.baseProductId);
          break;
      }

      totalItems += item.quantity;
    });

    return {
      totalItems,
      totalProducts: grouped.length,
      totalRecords: items.length,
      lastUpdate:
        items.length > 0
          ? Math.max(
              ...items.map((i) => new Date(i.lastUpdated).getTime())
            ).toString()
          : "",
      categories,
      brands,
      productGroups,
      unitBreakdown: {
        totalCS,
        totalDSP,
        totalEA,
        uniqueProductsWithCS: productsWithCS.size,
        uniqueProductsWithDSP: productsWithDSP.size,
        uniqueProductsWithEA: productsWithEA.size,
      },
    };
  }

  /**
   * Validate inventory item data
   */
  static validateInventoryItem(item: Partial<InventoryItem>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!item.barcode) errors.push("ไม่มี barcode");
    if (!item.productName) errors.push("ไม่มีชื่อสินค้า");
    if (!item.materialCode) errors.push("ไม่มีรหัสสินค้า");
    if (!item.barcodeType) errors.push("ไม่มีประเภทหน่วย");
    if (typeof item.quantity !== "number" || item.quantity < 0)
      errors.push("จำนวนไม่ถูกต้อง");

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Error types
export interface InventoryError extends Error {
  code?:
    | "STORAGE_ERROR"
    | "VALIDATION_ERROR"
    | "EXPORT_ERROR"
    | "QUANTITY_ERROR"
    | "GROUPING_ERROR";
  context?: Record<string, unknown>;
}
