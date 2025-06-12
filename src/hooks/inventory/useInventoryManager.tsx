// src/hooks/inventory/useInventoryManager.tsx - Refactored Main Hook
"use client";

import { useState, useEffect, useCallback } from "react";
import { useInventoryStorage } from "./useInventoryStorage";
import { useInventoryOperations } from "./useInventoryOperations";
import { useInventorySummary } from "./useInventorySummary";
import { useInventoryExport } from "./useInventoryExport";
import {
  InventoryItem,
  EmployeeContext,
  UseInventoryManagerReturn,
} from "./types";

export const useInventoryManager = (
  employeeContext?: EmployeeContext
): UseInventoryManagerReturn => {
  // State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sub-hooks
  const storage = useInventoryStorage();
  const { summary } = useInventorySummary({ inventory });

  const operations = useInventoryOperations({
    inventory,
    setInventory,
    saveInventory: storage.saveInventory,
    employeeContext,
    setError,
  });

  const exportHook = useInventoryExport({
    inventory,
    employeeContext,
    setError,
  });

  // Load inventory on mount
  useEffect(() => {
    const loadedInventory = storage.loadInventory();
    setInventory(loadedInventory);
  }, [storage.loadInventory]);

  // Auto-save inventory when it changes (debounced)
  useEffect(() => {
    if (!storage.isLoading && inventory.length > 0) {
      const timeoutId = setTimeout(() => {
        storage.saveInventory(inventory);
      }, 1000); // Auto-save after 1 second of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [inventory, storage.isLoading, storage.saveInventory]);

  // Clear error (combining all error sources)
  const clearError = () => {
    setError(null);
    storage.clearError();
  };

  // Enhanced load inventory that merges storage and local state
  const loadInventory = () => {
    const loadedData = storage.loadInventory();
    setInventory(loadedData);
  };

  // Reset all inventory state (for logout)
  const resetInventoryState = useCallback(() => {
    try {
      console.log("🔄 Resetting inventory state...");

      // Clear inventory state
      setInventory([]);

      // Clear any errors
      setError(null);
      storage.clearError();

      // Clear storage
      storage.clearStorage();

      console.log("✅ Inventory state reset successfully");
      return true;
    } catch (error) {
      console.error("❌ Error resetting inventory state:", error);

      // Force reset even if there's an error
      setInventory([]);
      setError(null);

      return false;
    }
  }, [storage]);

  return {
    // State
    inventory,
    isLoading: storage.isLoading,
    error: error || storage.error,
    summary,

    // CRUD Operations (from operations hook)
    addOrUpdateItem: operations.addOrUpdateItem,
    updateItemQuantity: operations.updateItemQuantity,
    removeItem: operations.removeItem,
    clearInventory: operations.clearInventory,

    // Search and utilities (from operations hook)
    findItemByBarcode: operations.findItemByBarcode,
    searchItems: operations.searchItems,

    // Export functionality (from export hook)
    exportInventory: exportHook.exportInventory,

    // Error handling and utilities
    clearError,
    loadInventory,
    resetInventoryState, // เพิ่มฟังก์ชัน reset สำหรับ logout
  };
};

// Re-export types for convenience
export type {
  InventoryItem,
  InventorySummary,
  EmployeeContext,
  UseInventoryManagerReturn,
} from "./types";
