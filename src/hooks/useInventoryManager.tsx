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
  productData?: Product;
  addedBy?: string;
  branchCode?: string;
  branchName?: string;
  // เพิ่มข้อมูลประเภทบาร์โค้ด
  barcodeType?: "ea" | "dsp" | "cs";
  materialCode?: string; // F/FG code
  productGroup?: string; // Prod. Gr.
  thaiDescription?: string; // รายละเอียด
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
    (product: Product, quantity: number, barcodeType?: "ea" | "dsp" | "cs") => {
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
    [saveInventory, employeeContext]
  );

  // Helper function to map category to product group
  const mapCategoryToProductGroup = (category: string): string => {
    const categoryMapping: Record<string, string> = {
      beverages: "STM",
      dairy: "EVAP",
      confectionery: "Gummy",
      snacks: "SNACK",
      canned_food: "EVAP",
      // เพิ่มการ mapping ตามความต้องการ
    };

    return categoryMapping[category.toLowerCase()] || "OTHER";
  };

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

      const now = new Date();
      const thaiDate = now.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const thaiTime = now.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const branchCode = employeeContext?.branchCode || "XXX";
      const branchName = employeeContext?.branchName || "ไม่ระบุสาขา";

      // สร้าง CSV content
      const csvRows: string[] = [];

      // Header row ตามรูปแบบที่ต้องการ
      csvRows.push(
        escapeCsvField(
          `สถานะคลังล่าสุด ${thaiDate} ${thaiTime} สำหรับ ${branchCode} - ${branchName}`
        )
      );
      csvRows.push(`ตรวจนับโดย,${employeeContext?.employeeName || "ไม่ระบุ"}`);

      // เว้น 1 row
      csvRows.push("");

      // Column headers
      const headers = [
        "F/FG",
        "Prod. Gr.",
        "รายละเอียด",
        "นับจริง (cs)",
        "นับจริง (ชิ้น)",
      ];
      csvRows.push(headers.map((header) => escapeCsvField(header)).join(","));

      // จัดกลุ่มข้อมูลตาม material code และ product group
      const groupedData = new Map<
        string,
        {
          materialCode: string;
          productGroup: string;
          thaiDescription: string;
          csCount: number;
          pieceCount: number;
        }
      >();

      inventory.forEach((item) => {
        const key = `${item.materialCode}_${item.productGroup}`;
        const existing = groupedData.get(key);

        if (existing) {
          // รวมจำนวนตามประเภทบาร์โค้ด
          if (item.barcodeType === "cs") {
            existing.csCount += item.quantity;
          } else if (item.barcodeType === "ea" || item.barcodeType === "dsp") {
            existing.pieceCount += item.quantity;
          }
        } else {
          groupedData.set(key, {
            materialCode: item.materialCode || "",
            productGroup: item.productGroup || "",
            thaiDescription: item.thaiDescription || item.productName,
            csCount: item.barcodeType === "cs" ? item.quantity : 0,
            pieceCount:
              item.barcodeType === "ea" || item.barcodeType === "dsp"
                ? item.quantity
                : 0,
          });
        }
      });

      // เพิ่มข้อมูลแต่ละ row
      Array.from(groupedData.values()).forEach((group) => {
        const row = [
          escapeCsvField(group.materialCode),
          escapeCsvField(group.productGroup),
          escapeCsvField(group.thaiDescription),
          group.csCount > 0 ? group.csCount.toString() : "",
          group.pieceCount > 0 ? group.pieceCount.toString() : "",
        ];
        csvRows.push(row.join(","));
      });

      // เพิ่มข้อมูลสรุป
      // csvRows.push(""); // Empty row
      // csvRows.push("ข้อมูลสรุป");
      // csvRows.push(`รายการสินค้าทั้งหมด,${groupedData.size} รายการ`);
      // csvRows.push(
      //   `จำนวนสินค้า (cs),${Array.from(groupedData.values()).reduce(
      //     (sum, item) => sum + item.csCount,
      //     0
      //   )} ลัง`
      // );
      // csvRows.push(
      //   `จำนวนสินค้า (ชิ้น),${Array.from(groupedData.values()).reduce(
      //     (sum, item) => sum + item.pieceCount,
      //     0
      //   )} ชิ้น`
      // );

      // ข้อมูลพนักงาน
      // csvRows.push("");
      // csvRows.push("ข้อมูลการตรวจนับ");
      // csvRows.push(`ตรวจนับโดย,${employeeContext?.employeeName || "ไม่ระบุ"}`);
      // csvRows.push(`รหัสสาขา,${branchCode}`);
      // csvRows.push(`ชื่อสาขา,${branchName}`);
      // csvRows.push(`วันที่ส่งออก,${thaiDate}`);
      // csvRows.push(`เวลาส่งออก,${thaiTime}`);

      // สร้างไฟล์และดาวน์โหลด
      const csvContent = csvRows.join("\n");
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csvContent;

      const blob = new Blob([csvWithBOM], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      // ชื่อไฟล์
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");

      link.href = url;
      link.download = `สถานะคลัง_${branchCode}_${dateStr}_${timeStr}.csv`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      console.log(
        "📤 Exported inventory data as CSV:",
        groupedData.size,
        "items by",
        employeeContext?.employeeName
      );
      return true;
    } catch (err: any) {
      console.error("❌ Error exporting inventory:", err);
      setError("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
      return false;
    }
  }, [inventory, employeeContext, escapeCsvField]);

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
    inventory,
    isLoading,
    error,
    addOrUpdateItem,
    updateItemQuantity,
    removeItem,
    clearInventory,
    findItemByBarcode,
    searchItems,
    exportInventory,
    clearError,
    loadInventory,
    summary: getInventorySummary(),
  };
};
