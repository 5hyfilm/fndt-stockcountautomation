// src/hooks/inventory/useInventoryOperations.tsx - FIXED VERSION
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
    };

    return categoryMapping[category.toLowerCase()] || "OTHER";
  }, []);

  // ✅ FIXED: Proper dual unit processing (แยกจาก conversion)
  const processDualUnitData = useCallback(
    (
      primaryValue: number,
      secondaryValue: number,
      primaryUnitType: "cs" | "dsp",
      secondaryUnitType: "dsp" | "ea" | "fractional",
      packSize: number = 12
    ) => {
      // เก็บข้อมูลแยกหน่วยตาม database schema
      let csCount = 0;
      let pieceCount = 0;
      let csUnitType: "cs" | "dsp" | null = null;
      let pieceUnitType: "dsp" | "ea" | "fractional" = "ea";

      // Primary unit mapping
      if (primaryUnitType === "cs") {
        csCount = primaryValue;
        csUnitType = "cs";
      } else if (primaryUnitType === "dsp") {
        csCount = primaryValue; // DSP ใช้ cs column
        csUnitType = "dsp";
      }

      // Secondary unit mapping
      pieceCount = secondaryValue;
      pieceUnitType = secondaryUnitType;

      // ✅ Calculate total EA for compatibility ONLY
      let totalEA = 0;

      // Convert cs count to EA
      if (csUnitType === "cs") {
        // 1 CS = 12 แพ็ค (default), 1 แพ็ค = packSize ชิ้น
        totalEA += csCount * 12 * packSize;
      } else if (csUnitType === "dsp") {
        // 1 DSP = packSize ชิ้น ✅ ใช้ packSize ที่ถูกต้อง
        totalEA += csCount * packSize;
      }

      // Convert piece count to EA
      if (pieceUnitType === "dsp") {
        totalEA += pieceCount * packSize;
      } else {
        totalEA += pieceCount; // EA or fractional
      }

      return {
        csCount,
        pieceCount,
        csUnitType,
        pieceUnitType,
        totalEA,
      };
    },
    []
  );

  // ✅ FIXED: Single addOrUpdateItemDualUnit function (ลบ duplicate)
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

        // ✅ FIXED: Use proper processing function
        const processedData = processDualUnitData(
          dualUnitData.primaryValue,
          dualUnitData.secondaryValue,
          dualUnitData.primaryUnitType,
          dualUnitData.secondaryUnitType,
          (product as any).packSize || 12
        );

        console.log("✅ FIXED Processing Result:", processedData);

        // Create new item
        const newItem: InventoryItem = {
          id: `${product.barcode}_${
            dualUnitData.scannedBarcodeType
          }_${Date.now()}`,
          barcode: product.barcode,
          productName: product.name,
          brand: product.brand || "F&N",
          category: product.category,
          size: product.name,
          unit: "mixed", // แสดงว่าเป็น dual unit

          // ✅ FIXED: เก็บแยกหน่วยตาม schema ที่ถูกต้อง
          csCount: processedData.csCount,
          pieceCount: processedData.pieceCount,
          csUnitType: processedData.csUnitType,
          pieceUnitType: processedData.pieceUnitType,

          // เก็บข้อมูลเดิมไว้เพื่อ compatibility
          quantity: processedData.totalEA,
          barcodeType: dualUnitData.scannedBarcodeType,

          lastUpdated: new Date().toISOString(),
          productData: product,
          addedBy: employeeContext?.employeeName,
          branchCode: employeeContext?.branchCode,
          branchName: employeeContext?.branchName,
          materialCode: product.id,
          productGroup: mapCategoryToProductGroup(product.category),
          thaiDescription: product.name,
        };

        // Update inventory
        setInventory((prevInventory) => {
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
                    csCount: item.csCount + processedData.csCount,
                    pieceCount: item.pieceCount + processedData.pieceCount,
                    quantity: item.quantity + processedData.totalEA,
                    lastUpdated: new Date().toISOString(),
                    productData: product,
                    addedBy: employeeContext?.employeeName || item.addedBy,
                    branchCode: employeeContext?.branchCode || item.branchCode,
                    branchName: employeeContext?.branchName || item.branchName,
                  }
                : item
            );
            console.log(
              `📦 Updated existing dual unit item: ${product.name} (+${processedData.csCount} ${processedData.csUnitType}, +${processedData.pieceCount} ${processedData.pieceUnitType})`
            );
          } else {
            // Add new item
            updatedInventory = [...prevInventory, newItem];
            console.log(
              `📦 Added new dual unit item: ${product.name} (${processedData.csCount} ${processedData.csUnitType}, ${processedData.pieceCount} ${processedData.pieceUnitType})`
            );
          }

          saveInventory(updatedInventory);
          return updatedInventory;
        });

        return true;
      } catch (error: unknown) {
        console.error("❌ Error adding dual unit item:", error);
        setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        return false;
      }
    },
    [
      inventory,
      setInventory,
      saveInventory,
      employeeContext,
      setError,
      processDualUnitData,
      mapCategoryToProductGroup,
    ]
  );

  // ✅ Legacy addOrUpdateItem method (for backward compatibility)
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
          brand: product.brand || "F&N",
          category: product.category,
          size: product.name,
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
          barcodeType: barcodeType || "ea",
          materialCode: product.id,
          productGroup: mapCategoryToProductGroup(product.category),
          thaiDescription: product.name,
        };

        setInventory((prevInventory) => {
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
              }`
            );
          } else {
            updatedInventory = [...prevInventory, newItem];
            console.log(
              `📦 Added new item: ${product.name} (${quantity}) ${
                barcodeType || "ea"
              }`
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
                    addedBy: employeeContext?.employeeName || item.addedBy,
                  }
                : item
            )
            .filter((item) => item.quantity > 0);

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

  // ✅ Update item with dual unit values
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
                // ✅ FIXED: คำนวณ totalEA ใหม่โดยใช้ข้อมูล cs/piece โดยตรง
                let totalEA = 0;
                const packSize = (item.productData as any)?.packSize || 12;

                // คำนวณจาก csCount
                if (item.csUnitType === "cs") {
                  totalEA += newCSCount * 12 * packSize; // 1 CS = 12 DSP * packSize EA
                } else if (item.csUnitType === "dsp") {
                  totalEA += newCSCount * packSize; // 1 DSP = packSize EA
                }

                // คำนวณจาก pieceCount
                if (item.pieceUnitType === "dsp") {
                  totalEA += newPieceCount * packSize; // DSP = packSize EA
                } else {
                  totalEA += newPieceCount; // EA or fractional = 1:1
                }

                console.log("🔄 Updated dual unit item:", {
                  itemId,
                  oldValues: {
                    csCount: item.csCount,
                    pieceCount: item.pieceCount,
                  },
                  newValues: { csCount: newCSCount, pieceCount: newPieceCount },
                  packSize,
                  csUnitType: item.csUnitType,
                  pieceUnitType: item.pieceUnitType,
                  calculatedTotalEA: totalEA,
                });

                return {
                  ...item,
                  csCount: newCSCount,
                  pieceCount: newPieceCount,
                  quantity: totalEA, // ✅ ใช้การคำนวณที่ถูกต้อง
                  lastUpdated: new Date().toISOString(),
                  addedBy: employeeContext?.employeeName || item.addedBy,
                };
              }
              return item;
            })
            .filter((item) => item.csCount > 0 || item.pieceCount > 0);

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
          console.log("🗑️ Removed item:", itemId);
          return updatedInventory;
        });

        return true;
      } catch (error: unknown) {
        console.error("❌ Error removing item:", error);
        setError("เกิดข้อผิดพลาดในการลบสินค้า");
        return false;
      }
    },
    [saveInventory, setError, setInventory]
  );

  // Clear all inventory
  const clearInventory = useCallback(() => {
    try {
      setError(null);
      setInventory([]);
      saveInventory([]);
      console.log("🗑️ Cleared all inventory");
      return true;
    } catch (error: unknown) {
      console.error("❌ Error clearing inventory:", error);
      setError("เกิดข้อผิดพลาดในการลบข้อมูลทั้งหมด");
      return false;
    }
  }, [saveInventory, setError, setInventory]);

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
    addOrUpdateItemDualUnit,
    updateItemQuantity,
    updateItemDualUnit,
    removeItem,
    clearInventory,

    // Search & Utilities
    findItemByBarcode,
    searchItems,
  };
};
