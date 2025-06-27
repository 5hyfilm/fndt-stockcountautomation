// src/hooks/inventory/useInventoryOperations.tsx - Phase 2: Multi-Unit Operations
"use client";

import { useCallback } from "react";
import { Product } from "../../types/product";
import {
  InventoryItem,
  QuantityInput,
  MultiUnitQuantities,
  migrateOldInventoryItem,
  getTotalQuantityAllUnits,
} from "./types";

interface UseInventoryOperationsProps {
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[]) => void;
  saveInventory: (inventory: InventoryItem[]) => boolean;
  setError: (error: string | null) => void;
}

export const useInventoryOperations = ({
  inventory,
  setInventory,
  saveInventory,
  setError,
}: UseInventoryOperationsProps) => {
  // ✅ Generate unique material code for new products
  const generateMaterialCode = useCallback((product: Product): string => {
    // ใช้ product.id หรือ barcode เป็น materialCode
    return product.id || product.barcode || `MAT_${Date.now()}`;
  }, []);

  // ✅ Find item by material code (ใหม่ - สำคัญ!)
  const findItemByMaterialCode = useCallback(
    (materialCode: string): InventoryItem | undefined => {
      return inventory.find((item) => item.materialCode === materialCode);
    },
    [inventory]
  );

  // ✅ Find item by barcode (เก่า - เก็บไว้เพื่อ compatibility)
  const findItemByBarcode = useCallback(
    (barcode: string): InventoryItem | undefined => {
      return inventory.find(
        (item) =>
          item.barcode === barcode ||
          item.scannedBarcodes?.cs === barcode ||
          item.scannedBarcodes?.dsp === barcode ||
          item.scannedBarcodes?.ea === barcode
      );
    },
    [inventory]
  );

  // ✅ NEW: Add or update multi-unit item (หลัก)
  const addOrUpdateMultiUnitItem = useCallback(
    (
      product: Product,
      quantityInput: QuantityInput,
      barcodeType: "cs" | "dsp" | "ea",
      directProductGroup?: string
    ): boolean => {
      try {
        setError(null);

        // Parse quantity input
        let quantity: number;
        if (typeof quantityInput === "number") {
          quantity = quantityInput;
        } else {
          quantity = quantityInput.quantity;
          // ตรวจสอบว่า unit ตรงกับ barcodeType หรือไม่
          if (quantityInput.unit !== barcodeType) {
            console.warn(
              `Unit mismatch: input=${quantityInput.unit}, barcode=${barcodeType}`
            );
          }
        }

        // Validate quantity
        if (quantity <= 0) {
          setError("จำนวนสินค้าต้องมากกว่า 0");
          return false;
        }

        // Generate or get material code
        const materialCode = generateMaterialCode(product);

        console.log(
          "🔍 Looking for existing item with materialCode:",
          materialCode
        );

        // Find existing item by material code
        const existingItem = findItemByMaterialCode(materialCode);

        if (existingItem) {
          // ✅ UPDATE: เพิ่มจำนวนเข้ากับรายการเดิม
          console.log("📦 Found existing item, updating quantities:", {
            current: existingItem.quantities,
            adding: { [barcodeType]: quantity },
          });

          const updatedQuantities: MultiUnitQuantities = {
            ...existingItem.quantities,
            [barcodeType]:
              (existingItem.quantities[barcodeType] || 0) + quantity,
          };

          // อัปเดต scanned barcodes
          const updatedScannedBarcodes = {
            ...existingItem.scannedBarcodes,
            [barcodeType]: product.barcode,
          };

          const updatedItem: InventoryItem = {
            ...existingItem,
            quantities: updatedQuantities,
            quantity: getTotalQuantityAllUnits({
              ...existingItem,
              quantities: updatedQuantities,
            }), // อัปเดต total
            scannedBarcodes: updatedScannedBarcodes,
            lastUpdated: new Date().toISOString(),
            // อัปเดต product group ถ้ามี
            productGroup: directProductGroup || existingItem.productGroup,
          };

          const updatedInventory = inventory.map((item) =>
            item.id === existingItem.id ? updatedItem : item
          );

          console.log("✅ Updated existing item:", updatedItem);
          setInventory(updatedInventory);
          return saveInventory(updatedInventory);
        } else {
          // ✅ CREATE: สร้างรายการใหม่
          console.log("🆕 Creating new item with materialCode:", materialCode);

          const quantities: MultiUnitQuantities = {
            [barcodeType]: quantity,
          };

          const newItem: InventoryItem = {
            id: `inv_${materialCode}_${Date.now()}`,
            materialCode,
            productName: product.name || "ไม่ระบุชื่อ",
            brand: product.brand || "ไม่ระบุแบรนด์",
            category: product.category || "ไม่ระบุ",
            size: product.size?.toString() || "",
            unit: product.unit || "",
            barcode: product.barcode, // บาร์โค้ดหลัก
            quantity: quantity, // จำนวนรวม
            quantities,
            lastUpdated: new Date().toISOString(),
            productData: product,
            productGroup: directProductGroup || product.category,
            thaiDescription: product.name,
            scannedBarcodes: {
              [barcodeType]: product.barcode,
            },
          };

          const updatedInventory = [...inventory, newItem];

          console.log("✅ Created new item:", newItem);
          setInventory(updatedInventory);
          return saveInventory(updatedInventory);
        }
      } catch (error) {
        console.error("❌ Error in addOrUpdateMultiUnitItem:", error);
        setError("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
        return false;
      }
    },
    [
      inventory,
      setInventory,
      saveInventory,
      setError,
      generateMaterialCode,
      findItemByMaterialCode,
    ]
  );

  // ✅ NEW: Update specific unit quantity
  const updateUnitQuantity = useCallback(
    (
      materialCode: string,
      unit: "cs" | "dsp" | "ea",
      newQuantity: number
    ): boolean => {
      try {
        setError(null);

        if (newQuantity < 0) {
          setError("จำนวนสินค้าต้องไม่เป็นค่าลบ");
          return false;
        }

        const existingItem = findItemByMaterialCode(materialCode);
        if (!existingItem) {
          setError("ไม่พบรายการสินค้า");
          return false;
        }

        const updatedQuantities: MultiUnitQuantities = {
          ...existingItem.quantities,
          [unit]: newQuantity,
        };

        // ถ้าจำนวนเป็น 0 ให้ลบ unit นั้นออก
        if (newQuantity === 0) {
          delete updatedQuantities[unit];
        }

        const updatedItem: InventoryItem = {
          ...existingItem,
          quantities: updatedQuantities,
          quantity: getTotalQuantityAllUnits({
            ...existingItem,
            quantities: updatedQuantities,
          }),
          lastUpdated: new Date().toISOString(),
        };

        const updatedInventory = inventory.map((item) =>
          item.materialCode === materialCode ? updatedItem : item
        );

        console.log(
          `✅ Updated ${unit} quantity for ${materialCode}:`,
          newQuantity
        );
        setInventory(updatedInventory);
        return saveInventory(updatedInventory);
      } catch (error) {
        console.error("❌ Error updating unit quantity:", error);
        setError("เกิดข้อผิดพลาดในการอัพเดทจำนวน");
        return false;
      }
    },
    [inventory, setInventory, saveInventory, setError, findItemByMaterialCode]
  );

  // ✅ LEGACY: รองรับ API เก่า (จะค่อย ๆ เอาออก)
  const addOrUpdateItem = useCallback(
    (
      product: Product,
      quantityInput: number,
      barcodeType: "cs" | "dsp" | "ea" = "ea",
      directProductGroup?: string
    ): boolean => {
      console.log(
        "⚠️ Using legacy addOrUpdateItem, consider migrating to addOrUpdateMultiUnitItem"
      );
      return addOrUpdateMultiUnitItem(
        product,
        quantityInput,
        barcodeType,
        directProductGroup
      );
    },
    [addOrUpdateMultiUnitItem]
  );

  // ✅ LEGACY: Update item quantity (จะค่อย ๆ เอาออก)
  const updateItemQuantity = useCallback(
    (itemId: string, newQuantity: number): boolean => {
      try {
        console.log(
          "⚠️ Using legacy updateItemQuantity, consider using updateUnitQuantity"
        );

        const existingItem = inventory.find((item) => item.id === itemId);
        if (!existingItem) {
          setError("ไม่พบรายการสินค้า");
          return false;
        }

        // สำหรับ legacy, อัปเดตใน unit หลักที่มีข้อมูล
        const activeUnits = Object.keys(existingItem.quantities) as Array<
          "cs" | "dsp" | "ea"
        >;
        if (activeUnits.length === 0) return false;

        const primaryUnit = activeUnits[0]; // ใช้ unit แรกที่พบ
        return updateUnitQuantity(
          existingItem.materialCode,
          primaryUnit,
          newQuantity
        );
      } catch (error) {
        console.error("❌ Error in legacy updateItemQuantity:", error);
        setError("เกิดข้อผิดพลาดในการอัพเดทจำนวน");
        return false;
      }
    },
    [inventory, updateUnitQuantity, setError]
  );

  // ✅ Remove item (ไม่เปลี่ยน)
  const removeItem = useCallback(
    (itemId: string): boolean => {
      try {
        setError(null);
        const updatedInventory = inventory.filter((item) => item.id !== itemId);
        setInventory(updatedInventory);
        return saveInventory(updatedInventory);
      } catch (error) {
        console.error("❌ Error removing item:", error);
        setError("เกิดข้อผิดพลาดในการลบรายการ");
        return false;
      }
    },
    [inventory, setInventory, saveInventory, setError]
  );

  // ✅ Search items (อัปเดตให้ค้นหาทั้ง materialCode)
  const searchItems = useCallback(
    (searchTerm: string): InventoryItem[] => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return inventory;

      return inventory.filter(
        (item) =>
          item.productName.toLowerCase().includes(term) ||
          item.brand.toLowerCase().includes(term) ||
          item.barcode.includes(term) ||
          item.materialCode.toLowerCase().includes(term) ||
          (item.thaiDescription &&
            item.thaiDescription.toLowerCase().includes(term))
      );
    },
    [inventory]
  );

  return {
    // ✅ NEW: Multi-unit operations
    addOrUpdateMultiUnitItem,
    updateUnitQuantity,
    findItemByMaterialCode,

    // ✅ LEGACY: Backward compatibility
    addOrUpdateItem,
    updateItemQuantity,
    findItemByBarcode,

    // ✅ Core operations
    removeItem,
    searchItems,
  };
};
