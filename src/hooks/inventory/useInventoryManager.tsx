// src/hooks/inventory/useInventoryManager.tsx - Phase 2: Multi-Unit Manager
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  InventoryItem,
  InventorySummary,
  UseInventoryManagerReturn,
  QuantityInput,
  StorageConfig,
  migrateOldInventoryItem,
} from "./types";
import { Product } from "../../types/product";
import { useInventoryStorage } from "./useInventoryStorage";
import { useInventoryOperations } from "./useInventoryOperations";

const STORAGE_CONFIG: StorageConfig = {
  storageKey: "fn_inventory_data_v2", // ✅ เปลี่ยน key ใหม่
  versionKey: "fn_inventory_version_v2",
  currentVersion: "2.0", // ✅ Version ใหม่
};

export const useInventoryManager = (): UseInventoryManagerReturn => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Storage operations
  const {
    loadInventory: loadFromStorage,
    saveInventory,
    isLoading: storageLoading,
    error: storageError,
  } = useInventoryStorage(STORAGE_CONFIG);

  // ✅ Business operations
  const {
    addOrUpdateMultiUnitItem,
    updateUnitQuantity,
    findItemByMaterialCode,
    addOrUpdateItem, // legacy
    updateItemQuantity, // legacy
    findItemByBarcode, // legacy
    removeItem,
    searchItems,
  } = useInventoryOperations({
    inventory,
    setInventory,
    saveInventory,
    setError,
  });

  // ✅ Data migration helper
  const migrateOldData = (oldData: any[]): InventoryItem[] => {
    console.log("🔄 Migrating old inventory data...");

    try {
      return oldData.map((oldItem) => {
        // ตรวจสอบว่าเป็นข้อมูลเก่าหรือไม่
        if (oldItem.quantities) {
          // ข้อมูลใหม่แล้ว ไม่ต้อง migrate
          return oldItem as InventoryItem;
        }

        // Migrate ข้อมูลเก่า
        const barcodeType = oldItem.barcodeType || "ea";
        return migrateOldInventoryItem(oldItem, barcodeType);
      });
    } catch (error) {
      console.error("❌ Migration error:", error);
      return [];
    }
  };

  // ✅ Load inventory on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // ลองโหลดข้อมูลใหม่ก่อน
        const newData = loadFromStorage();

        if (newData && newData.length > 0) {
          console.log("📦 Loaded new format data:", newData.length, "items");
          const migratedData = migrateOldData(newData);
          setInventory(migratedData);
        } else {
          // ถ้าไม่มีข้อมูลใหม่ ลองโหลดข้อมูลเก่า
          const oldStorageKey = "fn_inventory_data"; // key เก่า
          const oldDataStr = localStorage.getItem(oldStorageKey);

          if (oldDataStr) {
            console.log("🔄 Found old format data, migrating...");
            const oldData = JSON.parse(oldDataStr);
            const migratedData = migrateOldData(oldData);

            if (migratedData.length > 0) {
              setInventory(migratedData);
              // บันทึกข้อมูลใหม่
              saveInventory(migratedData);
              console.log(
                "✅ Migration completed:",
                migratedData.length,
                "items"
              );
            }
          } else {
            console.log("📦 No existing data found, starting fresh");
            setInventory([]);
          }
        }
      } catch (error) {
        console.error("❌ Error loading inventory:", error);
        setError("ไม่สามารถโหลดข้อมูล inventory ได้");
        setInventory([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadFromStorage, saveInventory]);

  // ✅ Update loading state from storage
  useEffect(() => {
    setIsLoading(storageLoading);
  }, [storageLoading]);

  // ✅ Update error state from storage
  useEffect(() => {
    if (storageError) {
      setError(storageError);
    }
  }, [storageError]);

  // ✅ Generate inventory summary
  const summary: InventorySummary = useMemo(() => {
    const totalItems = inventory.length; // จำนวน SKU
    const totalProducts = inventory.length; // เหมือนกัน

    const lastUpdate = inventory.reduce((latest, item) => {
      return item.lastUpdated > latest ? item.lastUpdated : latest;
    }, inventory[0]?.lastUpdated || new Date().toISOString());

    // Category distribution
    const categories: Record<string, number> = {};
    inventory.forEach((item) => {
      const category = item.category || "ไม่ระบุ";
      categories[category] = (categories[category] || 0) + 1;
    });

    // Brand distribution
    const brands: Record<string, number> = {};
    inventory.forEach((item) => {
      const brand = item.brand || "ไม่ระบุ";
      brands[brand] = (brands[brand] || 0) + 1;
    });

    // ✅ NEW: Multi-unit quantity breakdown
    let totalCS = 0;
    let totalDSP = 0;
    let totalEA = 0;
    let itemsWithMultipleUnits = 0;

    inventory.forEach((item) => {
      const { cs = 0, dsp = 0, ea = 0 } = item.quantities;

      totalCS += cs;
      totalDSP += dsp;
      totalEA += ea;

      // นับ SKU ที่มีมากกว่า 1 หน่วย
      const activeUnits = [cs > 0, dsp > 0, ea > 0].filter(Boolean).length;
      if (activeUnits > 1) {
        itemsWithMultipleUnits++;
      }
    });

    return {
      totalItems,
      totalProducts,
      lastUpdate,
      categories,
      brands,
      quantityBreakdown: {
        totalCS,
        totalDSP,
        totalEA,
        itemsWithMultipleUnits,
      },
    };
  }, [inventory]);

  // ✅ Clear inventory
  const clearInventory = (): boolean => {
    try {
      setInventory([]);
      return saveInventory([]);
    } catch (error) {
      console.error("❌ Error clearing inventory:", error);
      setError("เกิดข้อผิดพลาดในการล้างข้อมูล");
      return false;
    }
  };

  // ✅ Export inventory
  const exportInventory = (): boolean => {
    try {
      // TODO: Implement export logic
      console.log("📤 Export inventory:", inventory);
      return true;
    } catch (error) {
      console.error("❌ Error exporting inventory:", error);
      setError("เกิดข้อผิดพลาดในการ export ข้อมูล");
      return false;
    }
  };

  // ✅ Clear error
  const clearError = () => {
    setError(null);
  };

  // ✅ Reload inventory
  const loadInventory = () => {
    const data = loadFromStorage();
    const migratedData = migrateOldData(data);
    setInventory(migratedData);
  };

  // ✅ Reset inventory state
  const resetInventoryState = (): boolean => {
    try {
      setInventory([]);
      setError(null);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("❌ Error resetting inventory state:", error);
      return false;
    }
  };

  return {
    // State
    inventory,
    isLoading,
    error,
    summary,

    // ✅ NEW: Multi-unit operations (หลัก)
    addOrUpdateMultiUnitItem,
    updateUnitQuantity,
    findItemByMaterialCode,

    // ✅ LEGACY: Backward compatibility (จะค่อย ๆ เอาออก)
    addOrUpdateItem,
    updateItemQuantity,
    findItemByBarcode,

    // Core operations
    removeItem,
    clearInventory,
    searchItems,
    exportInventory,

    // Utilities
    clearError,
    loadInventory,
    resetInventoryState,
  };
};
