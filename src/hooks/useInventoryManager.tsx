// src/hooks/useInventoryManager.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { Product } from "../types/product";

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
  productData?: Product; // เก็บข้อมูลสินค้าเต็ม
}

// Interface สำหรับ summary ข้อมูล
export interface InventorySummary {
  totalItems: number;
  totalProducts: number;
  lastUpdate: string;
  categories: Record<string, number>;
  brands: Record<string, number>;
}

const STORAGE_KEY = "fn_inventory_data";
const VERSION_KEY = "fn_inventory_version";
const CURRENT_VERSION = "1.0";

export const useInventoryManager = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load inventory data from localStorage
  const loadInventory = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      // Check version compatibility
      const savedVersion = localStorage.getItem(VERSION_KEY);
      if (savedVersion && savedVersion !== CURRENT_VERSION) {
        console.warn("🔄 Inventory version mismatch, clearing old data");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      }

      const savedData = localStorage.getItem(STORAGE_KEY);

      if (savedData) {
        const parsedData: InventoryItem[] = JSON.parse(savedData);

        // Validate data structure
        const validatedData = parsedData.filter(
          (item) =>
            item.id &&
            item.barcode &&
            item.productName &&
            typeof item.quantity === "number"
        );

        setInventory(validatedData);
        console.log("📦 Loaded inventory:", validatedData.length, "items");
      } else {
        setInventory([]);
        console.log("📦 No saved inventory found, starting fresh");
      }
    } catch (err: any) {
      console.error("❌ Error loading inventory:", err);
      setError("ไม่สามารถโหลดข้อมูล inventory ได้");
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save inventory data to localStorage
  const saveInventory = useCallback((data: InventoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      console.log("💾 Saved inventory:", data.length, "items");
    } catch (err: any) {
      console.error("❌ Error saving inventory:", err);
      setError("ไม่สามารถบันทึกข้อมูลได้");
    }
  }, []);

  // Add or update inventory item
  const addOrUpdateItem = useCallback(
    (product: Product, quantity: number) => {
      if (!product || quantity <= 0) {
        setError("ข้อมูลสินค้าหรือจำนวนไม่ถูกต้อง");
        return false;
      }

      try {
        setError(null);

        const newItem: InventoryItem = {
          id: `${product.barcode}_${Date.now()}`,
          barcode: product.barcode,
          productName: product.name,
          brand: product.brand,
          category: product.category,
          size: product.size || "",
          unit: product.unit || "",
          quantity: quantity,
          lastUpdated: new Date().toISOString(),
          productData: product,
        };

        setInventory((prevInventory) => {
          // Check if product already exists (same barcode)
          const existingIndex = prevInventory.findIndex(
            (item) => item.barcode === product.barcode
          );

          let updatedInventory: InventoryItem[];

          if (existingIndex !== -1) {
            // Update existing item - add to current quantity
            updatedInventory = prevInventory.map((item, index) =>
              index === existingIndex
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    lastUpdated: new Date().toISOString(),
                    productData: product, // Update product data
                  }
                : item
            );
            console.log(
              `📦 Updated existing item: ${product.name} (+${quantity})`
            );
          } else {
            // Add new item
            updatedInventory = [...prevInventory, newItem];
            console.log(`📦 Added new item: ${product.name} (${quantity})`);
          }

          saveInventory(updatedInventory);
          return updatedInventory;
        });

        return true;
      } catch (err: any) {
        console.error("❌ Error adding/updating item:", err);
        setError("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
        return false;
      }
    },
    [saveInventory]
  );

  // Update specific item quantity
  const updateItemQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      if (newQuantity < 0) {
        setError("จำนวนต้องไม่น้อยกว่า 0");
        return false;
      }

      try {
        setError(null);

        setInventory((prevInventory) => {
          const updatedInventory = prevInventory
            .map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    quantity: newQuantity,
                    lastUpdated: new Date().toISOString(),
                  }
                : item
            )
            .filter((item) => item.quantity > 0); // Remove items with 0 quantity

          saveInventory(updatedInventory);
          return updatedInventory;
        });

        return true;
      } catch (err: any) {
        console.error("❌ Error updating item quantity:", err);
        setError("เกิดข้อผิดพลาดในการอัพเดตจำนวน");
        return false;
      }
    },
    [saveInventory]
  );

  // Remove specific item
  const removeItem = useCallback(
    (itemId: string) => {
      try {
        setError(null);

        setInventory((prevInventory) => {
          const updatedInventory = prevInventory.filter(
            (item) => item.id !== itemId
          );
          saveInventory(updatedInventory);
          console.log("🗑️ Removed item:", itemId);
          return updatedInventory;
        });

        return true;
      } catch (err: any) {
        console.error("❌ Error removing item:", err);
        setError("เกิดข้อผิดพลาดในการลบสินค้า");
        return false;
      }
    },
    [saveInventory]
  );

  // Clear all inventory
  const clearInventory = useCallback(() => {
    try {
      setError(null);
      setInventory([]);
      localStorage.removeItem(STORAGE_KEY);
      console.log("🗑️ Cleared all inventory");
      return true;
    } catch (err: any) {
      console.error("❌ Error clearing inventory:", err);
      setError("เกิดข้อผิดพลาดในการลบข้อมูลทั้งหมด");
      return false;
    }
  }, []);

  // Get inventory summary
  const getInventorySummary = useCallback((): InventorySummary => {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalProducts = inventory.length;

    const categories: Record<string, number> = {};
    const brands: Record<string, number> = {};

    let lastUpdate = "";

    inventory.forEach((item) => {
      // Count by category
      categories[item.category] =
        (categories[item.category] || 0) + item.quantity;

      // Count by brand
      brands[item.brand] = (brands[item.brand] || 0) + item.quantity;

      // Track latest update
      if (item.lastUpdated > lastUpdate) {
        lastUpdate = item.lastUpdated;
      }
    });

    return {
      totalItems,
      totalProducts,
      lastUpdate,
      categories,
      brands,
    };
  }, [inventory]);

  // Find item by barcode
  const findItemByBarcode = useCallback(
    (barcode: string) => {
      return inventory.find((item) => item.barcode === barcode);
    },
    [inventory]
  );

  // Search items
  const searchItems = useCallback(
    (searchTerm: string) => {
      const term = searchTerm.toLowerCase();
      return inventory.filter(
        (item) =>
          item.productName.toLowerCase().includes(term) ||
          item.brand.toLowerCase().includes(term) ||
          item.barcode.includes(term) ||
          item.category.toLowerCase().includes(term)
      );
    },
    [inventory]
  );

  // Export inventory data
  const exportInventory = useCallback(() => {
    try {
      const summary = getInventorySummary();
      const exportData = {
        summary,
        items: inventory,
        exportDate: new Date().toISOString(),
        version: CURRENT_VERSION,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fn_inventory_${
        new Date().toISOString().split("T")[0]
      }.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      console.log("📤 Exported inventory data");
      return true;
    } catch (err: any) {
      console.error("❌ Error exporting inventory:", err);
      setError("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
      return false;
    }
  }, [inventory, getInventorySummary]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load inventory on mount
  useEffect(() => {
    loadInventory();
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

  return {
    // State
    inventory,
    isLoading,
    error,

    // Actions
    addOrUpdateItem,
    updateItemQuantity,
    removeItem,
    clearInventory,
    findItemByBarcode,
    searchItems,
    exportInventory,
    clearError,
    loadInventory,

    // Computed
    summary: getInventorySummary(),
  };
};
