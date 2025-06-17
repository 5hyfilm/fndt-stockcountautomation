// src/hooks/inventory/useInventoryManager.tsx - Updated with Dual Unit Support
"use client";

import { useState, useEffect, useCallback } from "react";
import { useInventoryStorage } from "./useInventoryStorage";
import { useInventoryOperations } from "./useInventoryOperations";
import { useInventorySummary } from "./useInventorySummary";
import { useInventoryExport } from "./useInventoryExport";
import {
  InventoryItem,
  InventorySummary,
  EmployeeContext,
  UseInventoryManagerReturn,
  DualUnitInputData,
} from "./types";
import { Product } from "../../types/product";

export const useInventoryManager = (
  employeeContext?: EmployeeContext
): UseInventoryManagerReturn => {
  // State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Storage operations
  const { loadInventory: loadFromStorage, saveInventory } = useInventoryStorage(
    "inventory_v2",
    employeeContext
  );

  // Operations with dual unit support
  const {
    addOrUpdateItem,
    addOrUpdateItemDualUnit, // ✅ NEW
    updateItemQuantity,
    updateItemDualUnit, // ✅ NEW
    removeItem,
    clearInventory,
    findItemByBarcode,
    searchItems,
  } = useInventoryOperations({
    inventory,
    setInventory,
    saveInventory,
    employeeContext,
    setError,
  });

  // Summary calculations
  const summary: InventorySummary = useInventorySummary(inventory);

  // Export functionality
  const { exportInventory, exportInventoryWithDualUnits } = useInventoryExport({
    inventory,
    summary,
    employeeContext,
    setError,
  });

  // Load initial inventory data
  const loadInventory = useCallback(() => {
    setIsLoading(true);
    try {
      const savedInventory = loadFromStorage();
      console.log("📋 Loaded inventory items:", savedInventory.length);
      setInventory(savedInventory);
      setError(null);
    } catch (error) {
      console.error("❌ Failed to load inventory:", error);
      setError("ไม่สามารถโหลดข้อมูล inventory ได้");
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromStorage]);

  // Load inventory on mount and when employee context changes
  useEffect(() => {
    loadInventory();
  }, [loadInventory, employeeContext?.branchCode]);

  // Reset inventory state
  const resetInventoryState = useCallback(() => {
    try {
      setInventory([]);
      setError(null);
      setIsLoading(false);
      saveInventory([]);
      console.log("🔄 Reset inventory state");
      return true;
    } catch (error) {
      console.error("❌ Failed to reset inventory state:", error);
      setError("ไม่สามารถรีเซ็ตข้อมูลได้");
      return false;
    }
  }, [saveInventory]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Debug logging
  useEffect(() => {
    if (inventory.length > 0) {
      console.log("📊 Current inventory state:", {
        itemCount: inventory.length,
        totalQuantity: summary.totalPieces,
        totalCSUnits: summary.totalCSUnits,
        totalDSPUnits: summary.totalDSPUnits,
        employee: employeeContext?.employeeName,
        branch: employeeContext?.branchName,
      });
    }
  }, [inventory.length, summary, employeeContext]);

  return {
    // State
    inventory,
    isLoading,
    error,
    summary,

    // ✅ CRUD Actions - Both legacy and dual unit
    addOrUpdateItem,
    addOrUpdateItemDualUnit, // NEW - Dual unit support
    updateItemQuantity,
    updateItemDualUnit, // NEW - Dual unit update
    removeItem,
    clearInventory,

    // Search & Utilities
    findItemByBarcode,
    searchItems,

    // Export functionality
    exportInventory,
    exportInventoryWithDualUnits, // NEW - Dual unit export

    // Error handling and utilities
    clearError,
    loadInventory,
    resetInventoryState,
  };
};
