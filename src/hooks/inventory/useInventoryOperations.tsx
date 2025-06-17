// src/hooks/inventory/useInventoryOperations.tsx
"use client";

import { useCallback } from "react";
import { Product } from "../../types/product";
import { InventoryItem, EmployeeContext, DualUnitInputData } from "./types";

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

  // Helper function: Convert dual unit to total EA quantity
  const convertDualUnitToTotalEA = useCallback(
    (
      primaryValue: number,
      secondaryValue: number,
      primaryUnitType: "cs" | "dsp",
      secondaryUnitType: "dsp" | "ea" | "fractional",
      packSize: number = 12 // Default pack size, should come from product data
    ): number => {
      let totalEA = 0;

      // Convert primary unit to EA
      if (primaryUnitType === "cs") {
        totalEA += primaryValue * packSize; // CS = 12 DSP (default)
      } else if (primaryUnitType === "dsp") {
        totalEA += primaryValue * 1; // DSP = 1 EA (for simplicity, adjust as needed)
      }

      // Convert secondary unit to EA
      if (secondaryUnitType === "dsp") {
        totalEA += secondaryValue * 1; // DSP = 1 EA
      } else if (
        secondaryUnitType === "ea" ||
        secondaryUnitType === "fractional"
      ) {
        totalEA += secondaryValue; // EA = 1 EA
      }

      return totalEA;
    },
    []
  );

  // ✅ NEW: Add or update inventory item with dual unit support
  const addOrUpdateItemDualUnit = useCallback(
    (product: Product, dualUnitData: DualUnitInputData) => {
      console.log("💾 useInventoryOperations addOrUpdateItemDualUnit:");
      console.log("  📦 Product:", product.name);
      console.log("  🔢 DualUnitData:", dualUnitData);

      if (
        !product ||
        (dualUnitData.primaryValue <= 0 && dualUnitData.secondaryValue <= 0)
      ) {
        setError("ข้อมูลสินค้าหรือจำนวนไม่ถูกต้อง");
        return false;
      }

      try {
        setError(null);

        // ✅ FIXED: Proper dual unit mapping
        let csCount = 0;
        let pieceCount = 0;
        let csUnitType: "cs" | "dsp" | null = null;
        let pieceUnitType: "dsp" | "ea" | "fractional" = "ea";

        // Map ข้อมูลตาม logic ที่ถูกต้อง
        if (dualUnitData.primaryUnitType === "cs") {
          // Primary = CS -> ไปใน csCount
          csCount = dualUnitData.primaryValue;
          csUnitType = "cs";

          // Secondary = DSP/EA/fractional -> ไปใน pieceCount
          pieceCount = dualUnitData.secondaryValue;
          pieceUnitType = dualUnitData.secondaryUnitType;
        } else if (dualUnitData.primaryUnitType === "dsp") {
          // Primary = DSP -> ไปใน csCount (เพราะ DSP ใช้ cs column)
          csCount = dualUnitData.primaryValue;
          csUnitType = "dsp";

          // Secondary = EA/fractional -> ไปใน pieceCount
          pieceCount = dualUnitData.secondaryValue;
          pieceUnitType = dualUnitData.secondaryUnitType;
        }

        // Calculate total quantity in EA for compatibility
        const totalQuantityEA = convertDualUnitToTotalEA(
          dualUnitData.primaryValue,
          dualUnitData.secondaryValue,
          dualUnitData.primaryUnitType,
          dualUnitData.secondaryUnitType,
          (product as any).packSize || 12
        );

        console.log("✅ FIXED Mapping:", {
          input: dualUnitData,
          output: {
            csCount,
            csUnitType,
            pieceCount,
            pieceUnitType,
            totalQuantityEA,
          },
        });

        const newItem: InventoryItem = {
          id: `${product.barcode}_${
            dualUnitData.scannedBarcodeType
          }_${Date.now()}`,
          barcode: product.barcode,
          productName: product.name,
          brand: product.brand,
          category: product.category,
          size: product.size || "",
          unit: product.unit || "",

          // ✅ FIXED: Correct dual unit mapping
          csCount,
          pieceCount,
          csUnitType,
          pieceUnitType,

          // ✅ Legacy compatibility
          quantity: totalQuantityEA,
          barcodeType: dualUnitData.scannedBarcodeType,

          lastUpdated: new Date().toISOString(),
          productData: product,
          addedBy: employeeContext?.employeeName,
          branchCode: employeeContext?.branchCode,
          branchName: employeeContext?.branchName,
          materialCode: product.sku || product.id,
          productGroup: mapCategoryToProductGroup(product.category),
          thaiDescription: product.description || product.name,
        };

        setInventory((prevInventory) => {
          // ค้นหา item ที่มี barcode และ type เดียวกัน
          const existingIndex = prevInventory.findIndex(
            (item) =>
              item.barcode === product.barcode &&
              item.barcodeType === dualUnitData.scannedBarcodeType
          );

          let updatedInventory: InventoryItem[];

          if (existingIndex !== -1) {
            // ✅ FIXED: Update existing item - รวม dual unit values อย่างถูกต้อง
            updatedInventory = prevInventory.map((item, index) =>
              index === existingIndex
                ? {
                    ...item,
                    csCount: item.csCount + csCount,
                    pieceCount: item.pieceCount + pieceCount,
                    quantity: item.quantity + totalQuantityEA,
                    lastUpdated: new Date().toISOString(),
                    productData: product,
                    addedBy: employeeContext?.employeeName || item.addedBy,
                    branchCode: employeeContext?.branchCode || item.branchCode,
                    branchName: employeeContext?.branchName || item.branchName,
                  }
                : item
            );
            console.log(
              `📦 Updated existing dual unit item: ${product.name} (+${csCount} ${csUnitType}, +${pieceCount} ${pieceUnitType})`
            );
          } else {
            // Add new item
            updatedInventory = [...prevInventory, newItem];
            console.log(
              `📦 Added new dual unit item: ${product.name} (${csCount} ${csUnitType}, ${pieceCount} ${pieceUnitType})`
            );
          }

          saveInventory(updatedInventory);
          return updatedInventory;
        });

        return true;
      } catch (error: unknown) {
        console.error("❌ Error adding/updating dual unit item:", error);
        setError("เกิดข้อผิดพลาดในการเพิ่มสินค้าแบบ dual unit");
        return false;
      }
    },
    [
      saveInventory,
      employeeContext,
      setError,
      setInventory,
      mapCategoryToProductGroup,
      convertDualUnitToTotalEA,
    ]
  );

  // Add or update inventory item with employee info (Legacy method)
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

          // ✅ For legacy method, use simple mapping
          csCount:
            barcodeType === "cs"
              ? quantity
              : barcodeType === "dsp"
              ? quantity
              : 0,
          pieceCount: barcodeType === "ea" ? quantity : 0,
          csUnitType:
            barcodeType === "cs" ? "cs" : barcodeType === "dsp" ? "dsp" : null,
          pieceUnitType: barcodeType === "ea" ? "ea" : "dsp",

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
                    csCount: item.csCount + newItem.csCount,
                    pieceCount: item.pieceCount + newItem.pieceCount,
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
      } catch (error: unknown) {
        console.error("❌ Error adding/updating item:", error);
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
      } catch (error: unknown) {
        console.error("❌ Error updating item quantity:", error);
        setError("เกิดข้อผิดพลาดในการอัพเดตจำนวน");
        return false;
      }
    },
    [saveInventory, employeeContext, setError, setInventory]
  );

  // ✅ NEW: Update item with dual unit values
  const updateItemDualUnit = useCallback(
    (itemId: string, newCSCount: number, newPieceCount: number) => {
      if (newCSCount < 0 || newPieceCount < 0) {
        setError("จำนวนต้องไม่น้อยกว่า 0");
        return false;
      }

      try {
        setError(null);

        setInventory((prevInventory) => {
          const updatedInventory = prevInventory
            .map((item) => {
              if (item.id === itemId) {
                // Recalculate total quantity based on new dual unit values
                const newTotalQuantity = convertDualUnitToTotalEA(
                  newCSCount,
                  newPieceCount,
                  item.csUnitType || "dsp",
                  item.pieceUnitType,
                  (item.productData as any)?.packSize || 12
                );

                return {
                  ...item,
                  csCount: newCSCount,
                  pieceCount: newPieceCount,
                  quantity: newTotalQuantity,
                  lastUpdated: new Date().toISOString(),
                  addedBy: employeeContext?.employeeName || item.addedBy,
                };
              }
              return item;
            })
            .filter((item) => item.csCount > 0 || item.pieceCount > 0); // Remove items with all 0 values

          saveInventory(updatedInventory);
          return updatedInventory;
        });

        return true;
      } catch (error: unknown) {
        console.error("❌ Error updating dual unit item:", error);
        setError("เกิดข้อผิดพลาดในการอัพเดตจำนวนแบบ dual unit");
        return false;
      }
    },
    [
      saveInventory,
      employeeContext,
      setError,
      setInventory,
      convertDualUnitToTotalEA,
    ]
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
      } catch (error: unknown) {
        console.error("❌ Error removing item:", error);
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
    } catch (error: unknown) {
      console.error("❌ Error clearing inventory:", error);
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
    // ✅ CRUD Operations - Both legacy and dual unit
    addOrUpdateItem,
    addOrUpdateItemDualUnit, // NEW
    updateItemQuantity,
    updateItemDualUnit, // NEW
    removeItem,
    clearInventory,

    // Search & Utilities
    findItemByBarcode,
    searchItems,
  };
};
