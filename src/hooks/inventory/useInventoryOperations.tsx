// Path: src/hooks/inventory/useInventoryOperations.tsx
// Phase 3: Separate unit storage (CS/DSP/EA as separate records)

"use client";

import { useCallback } from "react";
import {
  InventoryItem,
  GroupedInventoryItem,
  EmployeeContext,
  InventoryOperationResult,
  InventoryUtils,
} from "./types";
import { Product, BarcodeType, BarcodeUtils } from "../../types/product";
import { ProductWithMultipleBarcodes } from "../../data/types/csvTypes";

interface UseInventoryOperationsProps {
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[]) => void;
  saveInventory: (inventory: InventoryItem[]) => boolean;
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
  // ✅ NEW: Generate unique ID for inventory item
  const generateInventoryItemId = useCallback(
    (
      materialCode: string,
      barcodeType: BarcodeType,
      timestamp?: number
    ): string => {
      const ts = timestamp || Date.now();
      return `${materialCode}_${barcodeType}_${ts}`;
    },
    []
  );

  // ✅ MAJOR UPDATE: Add or update item (separate records per unit)
  const addOrUpdateItem = useCallback(
    (
      product: Product | ProductWithMultipleBarcodes,
      quantity: number,
      barcodeType: BarcodeType,
      directProductGroup?: string
    ): InventoryOperationResult => {
      try {
        setError(null);

        // Validate inputs
        if (!product || !barcodeType || quantity <= 0) {
          const error =
            "ข้อมูลไม่ถูกต้อง: ต้องมีสินค้า, ประเภทบาร์โค้ด, และจำนวนที่มากกว่า 0";
          setError(error);
          return { success: false, error };
        }

        // Validate barcode type availability
        const productWithBarcodes = product as ProductWithMultipleBarcodes;
        if (productWithBarcodes.barcodes) {
          const availableTypes = BarcodeUtils.getAvailableBarcodeTypes(product);
          if (!availableTypes.includes(barcodeType)) {
            const error = `สินค้านี้ไม่มีบาร์โค้ดประเภท ${barcodeType.toUpperCase()}`;
            setError(error);
            return { success: false, error };
          }
        }

        // Extract product information
        const materialCode =
          productWithBarcodes.materialCode || product.sku || product.id;
        const productGroup =
          directProductGroup || productWithBarcodes.productGroup || "OTHER";
        const baseName = InventoryUtils.extractBaseName(product.name);
        const baseProductId = InventoryUtils.generateBaseProductId(
          materialCode,
          baseName
        );

        // Generate specific barcode for this unit type
        const specificBarcode =
          BarcodeUtils.getBarcodeByType(product, barcodeType) ||
          product.barcode;

        console.log("🔄 Adding/updating inventory item:", {
          materialCode,
          baseName,
          barcodeType,
          quantity,
          productGroup,
          baseProductId,
          specificBarcode,
        });

        // ✅ Check if this specific unit type already exists
        const existingItemIndex = inventory.findIndex(
          (item) =>
            item.materialCode === materialCode &&
            item.barcodeType === barcodeType
        );

        let updatedInventory: InventoryItem[];
        let affectedItemId: string;

        if (existingItemIndex >= 0) {
          // ✅ Update existing item (add quantity)
          const existingItem = inventory[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;

          const updatedItem: InventoryItem = {
            ...existingItem,
            quantity: newQuantity,
            lastUpdated: new Date().toISOString(),
          };

          updatedInventory = [...inventory];
          updatedInventory[existingItemIndex] = updatedItem;
          affectedItemId = updatedItem.id;

          console.log(`✅ Updated existing ${barcodeType} item:`, {
            id: updatedItem.id,
            oldQuantity: existingItem.quantity,
            addedQuantity: quantity,
            newQuantity,
          });
        } else {
          // ✅ Create new item for this unit type
          const newItemId = generateInventoryItemId(materialCode, barcodeType);
          const productNameWithUnit =
            InventoryUtils.generateProductNameWithUnit(baseName, barcodeType);

          const newItem: InventoryItem = {
            id: newItemId,
            barcode: specificBarcode,
            productName: productNameWithUnit,
            baseName,
            brand: product.brand,
            category: product.category,
            size: product.size || "",
            unit: BarcodeUtils.getUnitLabel(barcodeType),
            quantity,
            barcodeType,
            materialCode,
            productGroup,
            baseProductId,
            thaiDescription:
              productWithBarcodes.description || product.description,
            lastUpdated: new Date().toISOString(),
            productData: product,
            addedBy: employeeContext?.employeeName,
            branchCode: employeeContext?.branchCode,
            branchName: employeeContext?.branchName,
          };

          updatedInventory = [...inventory, newItem];
          affectedItemId = newItemId;

          console.log(`✅ Created new ${barcodeType} item:`, {
            id: newItemId,
            productName: productNameWithUnit,
            quantity,
            baseProductId,
          });
        }

        // Save to storage
        setInventory(updatedInventory);
        const saved = saveInventory(updatedInventory);

        if (saved) {
          return {
            success: true,
            message: `เพิ่ม ${product.name} (${BarcodeUtils.getUnitLabel(
              barcodeType
            )}) จำนวน ${quantity} เรียบร้อยแล้ว`,
            affectedItems: [affectedItemId],
          };
        } else {
          const error = "ไม่สามารถบันทึกข้อมูลได้";
          setError(error);
          return { success: false, error };
        }
      } catch (error) {
        console.error("❌ Error in addOrUpdateItem:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการเพิ่มข้อมูล";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [
      inventory,
      setInventory,
      saveInventory,
      employeeContext,
      setError,
      generateInventoryItemId,
    ]
  );

  // ✅ UPDATED: Update specific unit quantity
  const updateItemQuantity = useCallback(
    (
      baseProductId: string,
      barcodeType: BarcodeType,
      newQuantity: number
    ): InventoryOperationResult => {
      try {
        setError(null);

        if (newQuantity < 0) {
          const error = "จำนวนสินค้าต้องไม่เป็นค่าลบ";
          setError(error);
          return { success: false, error };
        }

        // Find the specific item
        const itemIndex = inventory.findIndex(
          (item) =>
            item.baseProductId === baseProductId &&
            item.barcodeType === barcodeType
        );

        if (itemIndex === -1) {
          const error = `ไม่พบสินค้าประเภท ${barcodeType.toUpperCase()} ในรายการ`;
          setError(error);
          return { success: false, error };
        }

        const updatedInventory = [...inventory];
        const updatedItem = {
          ...updatedInventory[itemIndex],
          quantity: newQuantity,
          lastUpdated: new Date().toISOString(),
        };

        updatedInventory[itemIndex] = updatedItem;

        setInventory(updatedInventory);
        const saved = saveInventory(updatedInventory);

        if (saved) {
          console.log(`✅ Updated ${barcodeType} quantity:`, {
            baseProductId,
            newQuantity,
            itemId: updatedItem.id,
          });

          return {
            success: true,
            message: `อัพเดทจำนวน ${BarcodeUtils.getUnitLabel(
              barcodeType
            )} เรียบร้อยแล้ว`,
            affectedItems: [updatedItem.id],
            data: updatedItem,
          };
        } else {
          const error = "ไม่สามารถบันทึกข้อมูลได้";
          setError(error);
          return { success: false, error };
        }
      } catch (error) {
        console.error("❌ Error updating quantity:", error);
        const errorMessage = "เกิดข้อผิดพลาดในการอัพเดทจำนวน";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [inventory, setInventory, saveInventory, setError]
  );

  // ✅ NEW: Remove specific unit item
  const removeItem = useCallback(
    (itemId: string): InventoryOperationResult => {
      try {
        setError(null);

        const itemToRemove = inventory.find((item) => item.id === itemId);
        if (!itemToRemove) {
          const error = "ไม่พบรายการที่ต้องการลบ";
          setError(error);
          return { success: false, error };
        }

        const updatedInventory = inventory.filter((item) => item.id !== itemId);
        setInventory(updatedInventory);
        const saved = saveInventory(updatedInventory);

        if (saved) {
          console.log(`✅ Removed ${itemToRemove.barcodeType} item:`, {
            id: itemId,
            productName: itemToRemove.productName,
          });

          return {
            success: true,
            message: `ลบ ${itemToRemove.productName} เรียบร้อยแล้ว`,
            affectedItems: [itemId],
          };
        } else {
          const error = "ไม่สามารถบันทึกการลบข้อมูลได้";
          setError(error);
          return { success: false, error };
        }
      } catch (error) {
        console.error("❌ Error removing item:", error);
        const errorMessage = "เกิดข้อผิดพลาดในการลบข้อมูล";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [inventory, setInventory, saveInventory, setError]
  );

  // ✅ NEW: Remove entire product (all units)
  const removeProduct = useCallback(
    (baseProductId: string): InventoryOperationResult => {
      try {
        setError(null);

        const itemsToRemove = inventory.filter(
          (item) => item.baseProductId === baseProductId
        );
        if (itemsToRemove.length === 0) {
          const error = "ไม่พบสินค้าที่ต้องการลบ";
          setError(error);
          return { success: false, error };
        }

        const updatedInventory = inventory.filter(
          (item) => item.baseProductId !== baseProductId
        );
        setInventory(updatedInventory);
        const saved = saveInventory(updatedInventory);

        if (saved) {
          const removedIds = itemsToRemove.map((item) => item.id);
          const baseName = itemsToRemove[0]?.baseName || "สินค้า";

          console.log(`✅ Removed entire product:`, {
            baseProductId,
            removedCount: itemsToRemove.length,
            removedIds,
          });

          return {
            success: true,
            message: `ลบ ${baseName} ทุกหน่วยเรียบร้อยแล้ว (${itemsToRemove.length} รายการ)`,
            affectedItems: removedIds,
          };
        } else {
          const error = "ไม่สามารถบันทึกการลบข้อมูลได้";
          setError(error);
          return { success: false, error };
        }
      } catch (error) {
        console.error("❌ Error removing product:", error);
        const errorMessage = "เกิดข้อผิดพลาดในการลบสินค้า";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [inventory, setInventory, saveInventory, setError]
  );

  // Clear all inventory
  const clearInventory = useCallback((): boolean => {
    try {
      setError(null);
      setInventory([]);
      return saveInventory([]);
    } catch (error) {
      console.error("❌ Error clearing inventory:", error);
      setError("เกิดข้อผิดพลาดในการล้างข้อมูล");
      return false;
    }
  }, [setInventory, saveInventory, setError]);

  // ✅ UPDATED: Find item by barcode and type
  const findItemByBarcode = useCallback(
    (barcode: string, barcodeType?: BarcodeType): InventoryItem | undefined => {
      return inventory.find((item) => {
        const barcodeMatch = item.barcode === barcode;
        const typeMatch = !barcodeType || item.barcodeType === barcodeType;
        return barcodeMatch && typeMatch;
      });
    },
    [inventory]
  );

  // ✅ NEW: Find product by base ID
  const findProductByBaseId = useCallback(
    (baseProductId: string): GroupedInventoryItem | undefined => {
      const grouped = InventoryUtils.groupInventoryItems(inventory);
      return grouped.find((group) => group.baseProductId === baseProductId);
    },
    [inventory]
  );

  // ✅ UPDATED: Search items (individual records)
  const searchItems = useCallback(
    (searchTerm: string): InventoryItem[] => {
      if (!searchTerm.trim()) return inventory;

      const term = searchTerm.toLowerCase();
      return inventory.filter(
        (item) =>
          item.productName.toLowerCase().includes(term) ||
          item.baseName.toLowerCase().includes(term) ||
          item.brand.toLowerCase().includes(term) ||
          item.barcode.includes(term) ||
          item.materialCode?.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term) ||
          item.productGroup?.toLowerCase().includes(term)
      );
    },
    [inventory]
  );

  // ✅ NEW: Search grouped items
  const searchGroupedItems = useCallback(
    (searchTerm: string): GroupedInventoryItem[] => {
      const grouped = InventoryUtils.groupInventoryItems(inventory);

      if (!searchTerm.trim()) return grouped;

      const term = searchTerm.toLowerCase();
      return grouped.filter(
        (group) =>
          group.baseName.toLowerCase().includes(term) ||
          group.brand.toLowerCase().includes(term) ||
          group.materialCode?.toLowerCase().includes(term) ||
          group.productGroup?.toLowerCase().includes(term)
      );
    },
    [inventory]
  );

  return {
    // ✅ Core CRUD operations
    addOrUpdateItem,
    updateItemQuantity,
    removeItem,
    removeProduct, // ✅ NEW
    clearInventory,

    // ✅ Search and utilities
    findItemByBarcode,
    findProductByBaseId, // ✅ NEW
    searchItems,
    searchGroupedItems, // ✅ NEW
  };
};
