// ./src/hooks/inventory/useInventoryManager.tsx
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

  // Destructure storage properties to avoid dependency array warnings
  const {
    loadInventory,
    saveInventory,
    isLoading,
    clearError: clearStorageError,
    clearStorage,
  } = storage;

  const operations = useInventoryOperations({
    inventory,
    setInventory,
    saveInventory,
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
    const loadedInventory = loadInventory();
    setInventory(loadedInventory);
  }, [loadInventory]);

  // Auto-save inventory when it changes (debounced)
  useEffect(() => {
    if (!isLoading && inventory.length > 0) {
      const timeoutId = setTimeout(() => {
        saveInventory(inventory);
      }, 1000); // Auto-save after 1 second of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [inventory, isLoading, saveInventory]);

  // Clear error (combining all error sources)
  const clearError = () => {
    setError(null);
    clearStorageError();
  };

  // Enhanced load inventory that merges storage and local state
  const loadInventoryData = () => {
    const loadedData = loadInventory();
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
      clearStorageError();

      // Clear storage
      clearStorage();

      console.log("✅ Inventory state reset successfully");
      return true;
    } catch (error) {
      console.error("❌ Error resetting inventory state:", error);

      // Force reset even if there's an error
      setInventory([]);
      setError(null);

      return false;
    }
  }, [clearStorageError, clearStorage]);

  return {
    // State
    inventory,
    isLoading,
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
    loadInventory: loadInventoryData,
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
