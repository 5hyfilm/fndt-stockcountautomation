// src/hooks/inventory/useInventoryOperations.tsx
"use client";

import { useCallback } from "react";
import { Product } from "../../types/product";
import { InventoryItem, EmployeeContext } from "./types";

interface UseInventoryOperationsProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  saveInventory: (data: InventoryItem[]) => boolean;
  employeeContext?: EmployeeContext;
  setError: (error: string | null) => void;
}

export const useInventoryOperations = ({
  inventory,
  setInventory,
  saveInventory,
  employeeContext,
  setError,
}: UseInventoryOperationsProps) => {
  // Helper function to map category to product group
  const mapCategoryToProductGroup = useCallback((category: string): string => {
    const categoryMapping: Record<string, string> = {
      beverages: "STM",
      dairy: "EVAP",
      confectionery: "Gummy",
      snacks: "SNACK",
      canned_food: "EVAP",
      // เพิ่มการ mapping ตามความต้องการ
    };

    return categoryMapping[category.toLowerCase()] || "OTHER";
  }, []);

  // Add or update inventory item with employee info
  const addOrUpdateItem = useCallback(
    (product: Product, quantity: number, barcodeType?: "ea" | "dsp" | "cs") => {
      console.log("💾 useInventoryOperations addOrUpdateItem:");
      console.log("  📦 Product:", product.name);
      console.log("  🔢 Quantity:", quantity);
      console.log("  🏷️ BarcodeType:", barcodeType);

      if (!product || quantity <= 0) {
        setError("ข้อมูลสินค้าหรือจำนวนไม่ถูกต้อง");
        return false;
      }

      try {
        setError(null);

        const newItem: InventoryItem = {
          id: `${product.barcode}_${barcodeType || "ea"}_${Date.now()}`,
          barcode: product.barcode,
          productName: product.name,
          brand: product.brand,
          category: product.category,
          size: product.size || "",
          unit: product.unit || "",
          quantity: quantity,
          lastUpdated: new Date().toISOString(),
          productData: product,
          addedBy: employeeContext?.employeeName,
          branchCode: employeeContext?.branchCode,
          branchName: employeeContext?.branchName,
          // เพิ่มข้อมูลใหม่
          barcodeType: barcodeType || "ea",
          materialCode: product.sku || product.id,
          productGroup: mapCategoryToProductGroup(product.category),
          thaiDescription: product.description || product.name,
        };

        console.log(
          "💾 Created InventoryItem with barcodeType:",
          newItem.barcodeType
        );

        setInventory((prevInventory) => {
          // ค้นหา item ที่มี barcode และ type เดียวกัน
          const existingIndex = prevInventory.findIndex(
            (item) =>
              item.barcode === product.barcode &&
              item.barcodeType === (barcodeType || "ea")
          );

          let updatedInventory: InventoryItem[];

          if (existingIndex !== -1) {
            updatedInventory = prevInventory.map((item, index) =>
              index === existingIndex
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    lastUpdated: new Date().toISOString(),
                    productData: product,
                    addedBy: employeeContext?.employeeName || item.addedBy,
                    branchCode: employeeContext?.branchCode || item.branchCode,
                    branchName: employeeContext?.branchName || item.branchName,
                  }
                : item
            );
            console.log(
              `📦 Updated existing item: ${product.name} (+${quantity}) ${
                barcodeType || "ea"
              } by ${employeeContext?.employeeName}`
            );
          } else {
            updatedInventory = [...prevInventory, newItem];
            console.log(
              `📦 Added new item: ${product.name} (${quantity}) ${
                barcodeType || "ea"
              } by ${employeeContext?.employeeName}`
            );
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
    [
      saveInventory,
      employeeContext,
      setError,
      setInventory,
      mapCategoryToProductGroup,
    ]
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
                    // อัพเดตข้อมูลพนักงานที่แก้ไข
                    addedBy: employeeContext?.employeeName || item.addedBy,
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
    [saveInventory, employeeContext, setError, setInventory]
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
          console.log(
            "🗑️ Removed item:",
            itemId,
            "by",
            employeeContext?.employeeName
          );
          return updatedInventory;
        });

        return true;
      } catch (err: any) {
        console.error("❌ Error removing item:", err);
        setError("เกิดข้อผิดพลาดในการลบสินค้า");
        return false;
      }
    },
    [saveInventory, employeeContext, setError, setInventory]
  );

  // Clear all inventory
  const clearInventory = useCallback(() => {
    try {
      setError(null);
      setInventory([]);
      saveInventory([]);
      console.log("🗑️ Cleared all inventory by", employeeContext?.employeeName);
      return true;
    } catch (err: any) {
      console.error("❌ Error clearing inventory:", err);
      setError("เกิดข้อผิดพลาดในการลบข้อมูลทั้งหมด");
      return false;
    }
  }, [saveInventory, employeeContext, setError, setInventory]);

  // Search and utility functions
  const findItemByBarcode = useCallback(
    (barcode: string) => {
      return inventory.find((item) => item.barcode === barcode);
    },
    [inventory]
  );

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

  return {
    // CRUD Operations
    addOrUpdateItem,
    updateItemQuantity,
    removeItem,
    clearInventory,

    // Search & Utilities
    findItemByBarcode,
    searchItems,
  };
};
