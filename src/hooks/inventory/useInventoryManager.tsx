// Path: src/hooks/inventory/useInventoryManager.tsx
// Phase 3: Enhanced with separate unit storage and grouped view

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useInventoryStorage } from "./useInventoryStorage";
import { useInventoryOperations } from "./useInventoryOperations";
import { useInventorySummary } from "./useInventorySummary";
import { useInventoryExport } from "./useInventoryExport";
import {
  InventoryItem,
  GroupedInventoryItem,
  EmployeeContext,
  UseInventoryManagerReturn,
  InventoryUtils,
} from "./types";

export const useInventoryManager = (
  employeeContext?: EmployeeContext
): UseInventoryManagerReturn => {
  // ✅ Core state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ Sub-hooks
  const storage = useInventoryStorage();
  const { summary } = useInventorySummary({ inventory });

  // Destructure storage properties
  const {
    loadInventory,
    saveInventory,
    isLoading,
    clearError: clearStorageError,
    clearStorage,
  } = storage;

  // ✅ Operations hook with updated interface
  const operations = useInventoryOperations({
    inventory,
    setInventory,
    saveInventory,
    employeeContext,
    setError,
  });

  // ✅ Export hook
  const exportHook = useInventoryExport({
    inventory,
    employeeContext,
    setError,
  });

  // ✅ NEW: Grouped inventory view (computed)
  const groupedInventory = useMemo((): GroupedInventoryItem[] => {
    return InventoryUtils.groupInventoryItems(inventory);
  }, [inventory]);

  // ✅ NEW: Enhanced summary with grouped data
  const enhancedSummary = useMemo(() => {
    return InventoryUtils.calculateSummary(inventory);
  }, [inventory]);

  // ✅ Load inventory on mount
  useEffect(() => {
    const loadedInventory = loadInventory();
    setInventory(loadedInventory);
    console.log(`📦 Loaded ${loadedInventory.length} inventory records`);
  }, [loadInventory]);

  // ✅ Auto-save inventory when it changes (debounced)
  useEffect(() => {
    if (!isLoading && inventory.length > 0) {
      const timeoutId = setTimeout(() => {
        const saved = saveInventory(inventory);
        if (saved) {
          console.log(`💾 Auto-saved ${inventory.length} inventory records`);
        }
      }, 1000); // Auto-save after 1 second of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [inventory, isLoading, saveInventory]);

  // ✅ Log grouped inventory changes
  useEffect(() => {
    if (groupedInventory.length > 0) {
      console.log(
        `📊 Grouped inventory: ${groupedInventory.length} unique products`,
        {
          totalRecords: inventory.length,
          totalCS: enhancedSummary.unitBreakdown.totalCS,
          totalDSP: enhancedSummary.unitBreakdown.totalDSP,
          totalEA: enhancedSummary.unitBreakdown.totalEA,
        }
      );
    }
  }, [groupedInventory, inventory, enhancedSummary]);

  // ✅ Enhanced error clearing
  const clearError = useCallback(() => {
    setError(null);
    clearStorageError();
  }, [clearStorageError]);

  // ✅ Enhanced load inventory
  const loadInventoryData = useCallback(() => {
    const loadedData = loadInventory();
    setInventory(loadedData);
    console.log(`🔄 Manually loaded ${loadedData.length} inventory records`);
  }, [loadInventory]);

  // ✅ Enhanced reset inventory state
  const resetInventoryState = useCallback(() => {
    try {
      console.log("🔄 Resetting inventory state...");

      // Clear all state
      setInventory([]);
      setError(null);
      clearStorageError();
      clearStorage();

      console.log("✅ Inventory state reset successfully");
      return true;
    } catch (error) {
      console.error("❌ Error resetting inventory state:", error);

      // Force reset even on error
      setInventory([]);
      setError(null);
      return false;
    }
  }, [clearStorageError, clearStorage]);

  // ✅ NEW: Debug information
  const getDebugInfo = useCallback(() => {
    const grouped = InventoryUtils.groupInventoryItems(inventory);

    return {
      totalRecords: inventory.length,
      uniqueProducts: grouped.length,
      unitBreakdown: enhancedSummary.unitBreakdown,
      recentItems: inventory
        .sort(
          (a, b) =>
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
        )
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          productName: item.productName,
          barcodeType: item.barcodeType,
          quantity: item.quantity,
          lastUpdated: item.lastUpdated,
        })),
      groupedSample: grouped.slice(0, 3).map((group) => ({
        baseProductId: group.baseProductId,
        baseName: group.baseName,
        csQuantity: group.csQuantity,
        dspQuantity: group.dspQuantity,
        eaQuantity: group.eaQuantity,
        totalRecords: group.totalRecords,
      })),
    };
  }, [inventory, groupedInventory, enhancedSummary]);

  // ✅ NEW: Validation function
  const validateInventoryData = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate base product IDs
    const baseIds = new Set<string>();
    const duplicates = new Set<string>();

    inventory.forEach((item) => {
      if (!item.baseProductId) {
        errors.push(`Item ${item.id}: Missing base product ID`);
      }

      if (!item.materialCode) {
        errors.push(`Item ${item.id}: Missing material code`);
      }

      if (!item.barcodeType) {
        errors.push(`Item ${item.id}: Missing barcode type`);
      }

      if (item.quantity < 0) {
        errors.push(`Item ${item.id}: Negative quantity`);
      }

      // Check for potential duplicates (same material code + barcode type)
      const key = `${item.materialCode}_${item.barcodeType}`;
      if (baseIds.has(key)) {
        duplicates.add(key);
        warnings.push(
          `Duplicate item: ${item.materialCode} (${item.barcodeType})`
        );
      } else {
        baseIds.add(key);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalItems: inventory.length,
        uniqueProducts: groupedInventory.length,
        duplicatesFound: duplicates.size,
      },
    };
  }, [inventory, groupedInventory]);

  // ✅ Export validation
  console.log("🔍 Export hook debug:", {
    hasExportFunction: !!exportHook?.exportInventory,
    exportHookKeys: exportHook ? Object.keys(exportHook) : "undefined",
  });

  return {
    // ✅ Core state
    inventory,
    groupedInventory, // ✅ NEW: Grouped view
    isLoading,
    error: error || storage.error,
    summary: enhancedSummary, // ✅ Use enhanced summary

    // ✅ CRUD Operations (from operations hook)
    addOrUpdateItem: operations.addOrUpdateItem,
    updateItemQuantity: operations.updateItemQuantity,
    removeItem: operations.removeItem,
    removeProduct: operations.removeProduct, // ✅ NEW
    clearInventory: operations.clearInventory,

    // ✅ Search and utilities
    findItemByBarcode: operations.findItemByBarcode,
    findProductByBaseId: operations.findProductByBaseId, // ✅ NEW
    searchItems: operations.searchItems,
    searchGroupedItems: operations.searchGroupedItems, // ✅ NEW

    // ✅ Export functionality
    exportInventory:
      exportHook?.exportInventory ||
      (() => {
        console.error("❌ exportInventory function is not available");
        setError("ฟังก์ชันส่งออกข้อมูลไม่พร้อมใช้งาน");
        return false;
      }),

    // ✅ Error handling and utilities
    clearError,
    loadInventory: loadInventoryData,
    resetInventoryState,

    // ✅ NEW: Debug and validation utilities
    getDebugInfo,
    validateInventoryData,
  };
};

// ✅ Re-export types for convenience
export type {
  InventoryItem,
  GroupedInventoryItem, // ✅ NEW
  InventorySummary,
  EmployeeContext,
  UseInventoryManagerReturn,
  InventoryOperationResult, // ✅ NEW
} from "./types";
