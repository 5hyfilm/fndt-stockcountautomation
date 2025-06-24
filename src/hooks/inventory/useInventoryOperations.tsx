// src/hooks/inventory/useInventoryOperations.tsx - Fix: QuantityInput Support
"use client";

import { useCallback } from "react";
import { Product } from "../../types/product";
import {
  InventoryItem,
  EmployeeContext,
  QuantityInput,
  QuantityDetail,
  isQuantityDetail,
  isSimpleQuantity,
  migrateQuantityToDetail,
} from "./types";

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
  // Helper function to map category to product group (for existing products only)
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

  // ✅ Helper function to determine product group correctly
  const getProductGroupForItem = useCallback(
    (
      product: Product,
      directProductGroup?: string // ✅ เพิ่ม parameter สำหรับ product group ที่ส่งมาตรงๆ
    ): string => {
      // ✅ ถ้ามี directProductGroup (จาก form) ให้ใช้ตรงๆ
      if (directProductGroup) {
        console.log("🎯 Using direct product group:", directProductGroup);
        return directProductGroup;
      }

      // ✅ ถ้าไม่มี ให้ใช้ mapping เดิม (สำหรับสินค้าจาก CSV)
      const mappedGroup = mapCategoryToProductGroup(product.category || "");
      console.log(
        "🔄 Mapped product group from category:",
        product.category,
        "->",
        mappedGroup
      );
      return mappedGroup;
    },
    [mapCategoryToProductGroup]
  );

  // ✅ Helper function to normalize quantity input
  const normalizeQuantityInput = useCallback(
    (
      quantityInput: QuantityInput,
      barcodeType?: "ea" | "dsp" | "cs"
    ): { quantity: number; quantityDetail?: QuantityDetail } => {
      if (isSimpleQuantity(quantityInput)) {
        // Handle old format (number)
        const effectiveBarcodeType = barcodeType || "ea";

        if (effectiveBarcodeType === "ea") {
          // For EA, keep simple quantity
          return {
            quantity: quantityInput,
          };
        } else {
          // For DSP/CS, create quantityDetail
          const quantityDetail = migrateQuantityToDetail(
            quantityInput,
            effectiveBarcodeType
          );
          return {
            quantity: quantityInput, // Keep for backward compatibility
            quantityDetail,
          };
        }
      }

      if (isQuantityDetail(quantityInput)) {
        // Handle new format (QuantityDetail)
        return {
          quantity: quantityInput.major, // Use major as primary quantity for compatibility
          quantityDetail: quantityInput,
        };
      }

      // Fallback
      setError("รูปแบบข้อมูลจำนวนสินค้าไม่ถูกต้อง");
      return { quantity: 1 };
    },
    [setError]
  );

  // ✅ Validate quantity detail
  const validateQuantityDetail = useCallback(
    (detail: QuantityDetail): boolean => {
      if (detail.major < 0 || detail.remainder < 0) {
        setError("จำนวนสินค้าต้องไม่เป็นค่าลบ");
        return false;
      }

      if (detail.major === 0 && detail.remainder === 0) {
        setError("จำนวนสินค้าต้องมากกว่า 0");
        return false;
      }

      // Additional validation based on scanned type
      if (detail.scannedType !== "ea" && detail.major === 0) {
        setError(`จำนวน ${detail.scannedType.toUpperCase()} ต้องมากกว่า 0`);
        return false;
      }

      return true;
    },
    [setError]
  );

  // ✅ Enhanced add or update inventory item with QuantityInput support and direct productGroup
  const addOrUpdateItem = useCallback(
    (
      product: Product,
      quantityInput: QuantityInput, // ✅ Changed from number to QuantityInput
      barcodeType?: "ea" | "dsp" | "cs",
      directProductGroup?: string // ✅ เพิ่ม parameter สำหรับ product group ที่ส่งมาตรงๆ
    ): boolean => {
      try {
        setError(null);

        console.log("📦 Adding/updating item:", {
          productName: product.name,
          category: product.category,
          directProductGroup,
          quantityInput,
          barcodeType,
        });

        // ✅ Normalize quantity input to handle both formats
        const { quantity, quantityDetail } = normalizeQuantityInput(
          quantityInput,
          barcodeType
        );

        // ✅ Validate quantity detail if present
        if (quantityDetail && !validateQuantityDetail(quantityDetail)) {
          return false;
        }

        const timestamp = new Date().toISOString();
        const itemId = `${product.barcode}_${
          barcodeType || "ea"
        }_${Date.now()}`;

        // Check if item already exists (by barcode and type)
        const existingItemIndex = inventory.findIndex(
          (item) =>
            item.barcode === product.barcode &&
            item.barcodeType === (barcodeType || "ea")
        );

        // ✅ Use the helper function to get correct product group
        const productGroup = getProductGroupForItem(
          product,
          directProductGroup
        );

        const newItem: InventoryItem = {
          id: itemId,
          barcode: product.barcode || "",
          productName: product.name || "",
          brand: product.brand || "",
          category: product.category || "",
          size: product.size?.toString() || "",
          unit: product.unit || "",

          // ✅ Maintain backward compatibility
          quantity,
          quantityDetail,

          lastUpdated: timestamp,
          productData: product,
          addedBy: employeeContext?.employeeName || "",
          branchCode: employeeContext?.branchCode || "",
          branchName: employeeContext?.branchName || "",
          barcodeType: barcodeType || "ea",
          materialCode: product.sku || "",
          productGroup: productGroup, // ✅ ใช้ helper function แทน direct mapping
          thaiDescription: product.description || "",
        };

        console.log(
          "✅ Created inventory item with productGroup:",
          productGroup
        );

        let updatedInventory: InventoryItem[];

        if (existingItemIndex >= 0) {
          // ✅ Update existing item - merge quantities appropriately
          const existingItem = inventory[existingItemIndex];

          if (quantityDetail && existingItem.quantityDetail) {
            // Both have quantityDetail - add them
            const mergedDetail: QuantityDetail = {
              major: existingItem.quantityDetail.major + quantityDetail.major,
              remainder:
                existingItem.quantityDetail.remainder +
                quantityDetail.remainder,
              scannedType: quantityDetail.scannedType, // Use new scanned type
            };

            newItem.quantity = mergedDetail.major;
            newItem.quantityDetail = mergedDetail;
          } else if (quantityDetail) {
            // New has detail, existing doesn't - use new format
            newItem.quantity = quantity;
            newItem.quantityDetail = quantityDetail;
          } else if (existingItem.quantityDetail) {
            // Existing has detail, new doesn't - convert and add
            const convertedDetail = migrateQuantityToDetail(
              quantity,
              barcodeType || "ea"
            );
            const mergedDetail: QuantityDetail = {
              major: existingItem.quantityDetail.major + convertedDetail.major,
              remainder:
                existingItem.quantityDetail.remainder +
                convertedDetail.remainder,
              scannedType: existingItem.quantityDetail.scannedType,
            };

            newItem.quantity = mergedDetail.major;
            newItem.quantityDetail = mergedDetail;
          } else {
            // Both simple quantities - add normally
            newItem.quantity = existingItem.quantity + quantity;
          }

          updatedInventory = [...inventory];
          updatedInventory[existingItemIndex] = newItem;
        } else {
          // Add new item
          updatedInventory = [...inventory, newItem];
        }

        setInventory(updatedInventory);
        const saved = saveInventory(updatedInventory);

        if (saved) {
          console.log("✅ Successfully added/updated inventory item:", {
            product: product.name,
            quantity: quantity,
            quantityDetail: quantityDetail,
            barcodeType: barcodeType || "ea",
            productGroup: productGroup,
          });
          return true;
        } else {
          setError("ไม่สามารถบันทึกข้อมูลได้");
          return false;
        }
      } catch (error) {
        console.error("❌ Error adding/updating inventory:", error);
        setError("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
        return false;
      }
    },
    [
      inventory,
      setInventory,
      saveInventory,
      employeeContext,
      setError,
      getProductGroupForItem, // ✅ ใช้ helper function ใหม่
      normalizeQuantityInput,
      validateQuantityDetail,
    ]
  );

  // Update item quantity (backward compatibility)
  const updateItemQuantity = useCallback(
    (itemId: string, newQuantity: number): boolean => {
      try {
        setError(null);

        if (newQuantity < 0) {
          setError("จำนวนสินค้าต้องไม่เป็นค่าลบ");
          return false;
        }

        const updatedInventory = inventory.map((item) => {
          if (item.id === itemId) {
            const updatedItem = {
              ...item,
              quantity: newQuantity,
              lastUpdated: new Date().toISOString(),
            };

            // ✅ If item has quantityDetail, update major but keep structure
            if (item.quantityDetail) {
              updatedItem.quantityDetail = {
                ...item.quantityDetail,
                major: newQuantity,
              };
            }

            return updatedItem;
          }
          return item;
        });

        setInventory(updatedInventory);
        return saveInventory(updatedInventory);
      } catch (error) {
        console.error("❌ Error updating quantity:", error);
        setError("เกิดข้อผิดพลาดในการอัพเดทจำนวน");
        return false;
      }
    },
    [inventory, setInventory, saveInventory, setError]
  );

  // ✅ New method for updating quantity details
  const updateItemQuantityDetail = useCallback(
    (itemId: string, quantityDetail: QuantityDetail): boolean => {
      try {
        setError(null);

        if (!validateQuantityDetail(quantityDetail)) {
          return false;
        }

        const updatedInventory = inventory.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity: quantityDetail.major, // Update main quantity for compatibility
              quantityDetail,
              lastUpdated: new Date().toISOString(),
            };
          }
          return item;
        });

        setInventory(updatedInventory);
        return saveInventory(updatedInventory);
      } catch (error) {
        console.error("❌ Error updating quantity detail:", error);
        setError("เกิดข้อผิดพลาดในการอัพเดทรายละเอียดจำนวน");
        return false;
      }
    },
    [inventory, setInventory, saveInventory, setError, validateQuantityDetail]
  );

  // Remove item
  const removeItem = useCallback(
    (itemId: string): boolean => {
      try {
        setError(null);
        const updatedInventory = inventory.filter((item) => item.id !== itemId);
        setInventory(updatedInventory);
        return saveInventory(updatedInventory);
      } catch (error) {
        console.error("❌ Error removing item:", error);
        setError("เกิดข้อผิดพลาดในการลบข้อมูล");
        return false;
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

  // Find item by barcode
  const findItemByBarcode = useCallback(
    (barcode: string): InventoryItem | undefined => {
      return inventory.find((item) => item.barcode === barcode);
    },
    [inventory]
  );

  // Search items
  const searchItems = useCallback(
    (searchTerm: string): InventoryItem[] => {
      if (!searchTerm.trim()) return inventory;

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
    addOrUpdateItem,
    updateItemQuantity,
    updateItemQuantityDetail, // ✅ New method
    removeItem,
    clearInventory,
    findItemByBarcode,
    searchItems,
  };
};
