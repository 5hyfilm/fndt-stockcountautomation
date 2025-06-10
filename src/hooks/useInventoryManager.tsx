// src/hooks/useInventoryManager.tsx - Updated with Employee Info
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
  addedBy?: string; // ชื่อพนักงานที่เพิ่ม
  branchCode?: string; // รหัสสาขา
  branchName?: string; // ชื่อสาขา
}

// Interface สำหรับ summary ข้อมูล
export interface InventorySummary {
  totalItems: number;
  totalProducts: number;
  lastUpdate: string;
  categories: Record<string, number>;
  brands: Record<string, number>;
}

// Interface สำหรับข้อมูลพนักงาน (เพื่อความชัดเจน)
export interface EmployeeContext {
  employeeName: string;
  branchCode: string;
  branchName: string;
}

const STORAGE_KEY = "fn_inventory_data";
const VERSION_KEY = "fn_inventory_version";
const CURRENT_VERSION = "1.1"; // เพิ่มเวอร์ชันเพื่อรองรับข้อมูลพนักงาน

export const useInventoryManager = (employeeContext?: EmployeeContext) => {
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

  // Add or update inventory item with employee info
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
          // เพิ่มข้อมูลพนักงาน
          addedBy: employeeContext?.employeeName,
          branchCode: employeeContext?.branchCode,
          branchName: employeeContext?.branchName,
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
                    // อัพเดตข้อมูลพนักงานล่าสุด
                    addedBy: employeeContext?.employeeName || item.addedBy,
                    branchCode: employeeContext?.branchCode || item.branchCode,
                    branchName: employeeContext?.branchName || item.branchName,
                  }
                : item
            );
            console.log(
              `📦 Updated existing item: ${product.name} (+${quantity}) by ${employeeContext?.employeeName}`
            );
          } else {
            // Add new item
            updatedInventory = [...prevInventory, newItem];
            console.log(
              `📦 Added new item: ${product.name} (${quantity}) by ${employeeContext?.employeeName}`
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
    [saveInventory, employeeContext]
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
    [saveInventory, employeeContext]
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
    [saveInventory, employeeContext]
  );

  // Clear all inventory
  const clearInventory = useCallback(() => {
    try {
      setError(null);
      setInventory([]);
      localStorage.removeItem(STORAGE_KEY);
      console.log("🗑️ Cleared all inventory by", employeeContext?.employeeName);
      return true;
    } catch (err: any) {
      console.error("❌ Error clearing inventory:", err);
      setError("เกิดข้อผิดพลาดในการลบข้อมูลทั้งหมด");
      return false;
    }
  }, [employeeContext]);

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

  // Helper function to escape CSV fields
  const escapeCsvField = (field: string | number): string => {
    if (typeof field === "number") return field.toString();
    if (!field) return "";

    // Convert to string and handle special characters
    const str = field.toString();

    // If field contains comma, double quote, or newline, wrap in quotes and escape internal quotes
    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  };

  // Export inventory data as CSV with employee info
  const exportInventory = useCallback(() => {
    try {
      if (inventory.length === 0) {
        setError("ไม่มีข้อมูลสินค้าให้ส่งออก");
        return false;
      }

      // Define CSV headers with employee info
      const headers = [
        "ลำดับ",
        "บาร์โค้ด",
        "ชื่อสินค้า",
        "แบรนด์",
        "หมวดหมู่",
        "ขนาด",
        "หน่วย",
        "จำนวนใน Stock",
        "วันที่อัพเดต",
        "เวลาอัพเดต",
        "เพิ่มโดยพนักงาน",
        "รหัสสาขา",
        "ชื่อสาขา",
      ];

      // Create CSV content
      const csvRows: string[] = [];

      // Add headers
      csvRows.push(headers.map((header) => escapeCsvField(header)).join(","));

      // Add data rows
      inventory.forEach((item, index) => {
        const updateDate = new Date(item.lastUpdated);
        const dateStr = updateDate.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const timeStr = updateDate.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const row = [
          index + 1, // ลำดับ
          escapeCsvField(item.barcode), // บาร์โค้ด
          escapeCsvField(item.productName), // ชื่อสินค้า
          escapeCsvField(item.brand), // แบรนด์
          escapeCsvField(item.category), // หมวดหมู่
          escapeCsvField(item.size), // ขนาด
          escapeCsvField(item.unit), // หน่วย
          item.quantity, // จำนวนใน Stock
          escapeCsvField(dateStr), // วันที่อัพเดต
          escapeCsvField(timeStr), // เวลาอัพเดต
          escapeCsvField(item.addedBy || "ไม่ระบุ"), // เพิ่มโดยพนักงาน
          escapeCsvField(
            item.branchCode || employeeContext?.branchCode || "ไม่ระบุ"
          ), // รหัสสาขา
          escapeCsvField(
            item.branchName || employeeContext?.branchName || "ไม่ระบุ"
          ), // ชื่อสาขา
        ];

        csvRows.push(row.join(","));
      });

      // Add summary at the end with employee context
      csvRows.push(""); // Empty row
      csvRows.push("สรุปข้อมูล Stock");
      csvRows.push(`รายการสินค้าทั้งหมด,${inventory.length} รายการ`);
      csvRows.push(
        `จำนวนสินค้าทั้งหมด,${getInventorySummary().totalItems} ชิ้น`
      );
      csvRows.push(
        `หมวดหมู่,${Object.keys(getInventorySummary().categories).length} หมวด`
      );
      csvRows.push(
        `แบรนด์,${Object.keys(getInventorySummary().brands).length} แบรนด์`
      );

      // Employee and branch info
      csvRows.push(""); // Empty row
      csvRows.push("ข้อมูลการส่งออก");
      csvRows.push(`ส่งออกโดย,${employeeContext?.employeeName || "ไม่ระบุ"}`);
      csvRows.push(`รหัสสาขา,${employeeContext?.branchCode || "ไม่ระบุ"}`);
      csvRows.push(`ชื่อสาขา,${employeeContext?.branchName || "ไม่ระบุ"}`);
      csvRows.push(`วันที่ส่งออก,${new Date().toLocaleDateString("th-TH")}`);
      csvRows.push(`เวลาส่งออก,${new Date().toLocaleTimeString("th-TH")}`);

      // Join all rows
      const csvContent = csvRows.join("\n");

      // Add BOM for UTF-8 to ensure proper display of Thai characters
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csvContent;

      // Create and download file
      const blob = new Blob([csvWithBOM], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      // Generate filename with employee and branch info
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD format
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS format
      const branchCode = employeeContext?.branchCode || "Unknown";

      link.href = url;
      link.download = `FN_Stock_${branchCode}_${dateStr}_${timeStr}.csv`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      console.log(
        "📤 Exported inventory data as CSV:",
        inventory.length,
        "items by",
        employeeContext?.employeeName
      );
      return true;
    } catch (err: any) {
      console.error("❌ Error exporting inventory:", err);
      setError("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
      return false;
    }
  }, [inventory, getInventorySummary, escapeCsvField, employeeContext]);

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
