// Path: /src/hooks/inventory/useInventoryExport.tsx
"use client";

import { useCallback } from "react";
import { Product } from "../../types/product";

interface InventoryItem {
  id: string;
  materialCode: string;
  productName: string;
  brand: string;
  category: string;
  size: string;
  unit: string;
  barcode: string;
  quantity: number;
  quantities: {
    cs?: number;
    dsp?: number;
    ea?: number;
  };
  lastUpdated: string;
  productData?: Product;
  addedBy?: string;
  branchCode?: string;
  branchName?: string;
  productGroup?: string;
  thaiDescription?: string;
  barcodeType?: "cs" | "dsp" | "ea";
  scannedBarcodes?: {
    cs?: string;
    dsp?: string;
    ea?: string;
  };
  description?: string; // เพิ่ม field description
}

interface EmployeeContext {
  employeeName: string;
  branchCode: string;
  branchName: string;
}

interface ExportConfig {
  includeEmployeeInfo: boolean;
  includeTimestamp: boolean;
  includeStats: boolean;
  csvDelimiter: string;
  dateFormat: string;
  includeUnitBreakdown?: boolean;
}

interface UseInventoryExportProps {
  inventory: InventoryItem[];
  employeeContext?: EmployeeContext;
  setError: (error: string | null) => void;
}

const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  includeEmployeeInfo: true,
  includeTimestamp: true,
  includeStats: false,
  csvDelimiter: ",",
  dateFormat: "th-TH",
  includeUnitBreakdown: true,
};

// ✅ Interface for grouped inventory data (Wide Format)
interface GroupedInventoryData {
  materialCode: string;
  productName: string;
  description: string;
  productGroup: string;
  brand: string;
  category: string;
  quantities: {
    cs: number;
    dsp: number;
    ea: number;
  };
  isNewProduct: boolean;
  scannedBarcodes: string[];
  lastUpdated: string;
}

export const useInventoryExport = ({
  inventory,
  employeeContext,
  setError,
}: UseInventoryExportProps) => {
  // Helper function to escape CSV fields
  const escapeCsvField = useCallback((field: string | number): string => {
    if (typeof field === "number") return field.toString();
    if (!field) return "";

    const str = field.toString();

    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }, []);

  // ✅ Helper function to determine if item is a new product
  const isNewProduct = useCallback((item: InventoryItem): boolean => {
    return (
      item.materialCode?.startsWith("new_") ||
      item.materialCode?.startsWith("NEW_") ||
      item.brand === "เพิ่มใหม่" ||
      item.brand === "สินค้าใหม่" ||
      item.id?.startsWith("new_") ||
      item.id?.startsWith("NEW_") ||
      !item.materialCode ||
      item.materialCode === ""
    );
  }, []);

  // ✅ Group inventory by Material Code (Wide Format) - แก้ไขการจัดการข้อมูลสินค้าใหม่
  const groupInventoryByMaterialCode = useCallback(() => {
    const grouped = new Map<string, GroupedInventoryData>();

    inventory.forEach((item) => {
      const materialCode = item.materialCode || item.id;
      const isNew = isNewProduct(item);

      if (!grouped.has(materialCode)) {
        // ✅ แก้ไข: แยกการจัดการ description สำหรับสินค้าใหม่และสินค้าเก่า
        const displayDescription = (() => {
          if (isNew) {
            // สำหรับสินค้าใหม่: ใช้ description จาก productData หรือ description field หรือ thaiDescription
            return (
              item.productData?.description ||
              item.description ||
              item.thaiDescription ||
              "ไม่มีคำอธิบาย"
            );
          } else {
            // สำหรับสินค้าเก่า: ใช้ thaiDescription หรือ productName
            return (
              item.productData?.id || item.productName || item.description || ""
            );
          }
        })();

        grouped.set(materialCode, {
          materialCode,
          productName: item.productName,
          description: displayDescription, // ✅ ใช้ description ที่ปรับปรุงแล้ว
          productGroup: item.productGroup || "",
          brand: item.brand,
          category: item.category,
          quantities: {
            cs: 0,
            dsp: 0,
            ea: 0,
          },
          isNewProduct: isNew,
          scannedBarcodes: [],
          lastUpdated: item.lastUpdated,
        });
      }

      const groupedItem = grouped.get(materialCode)!;

      // รวมจำนวนสินค้า
      if (item.quantities) {
        groupedItem.quantities.cs += item.quantities.cs || 0;
        groupedItem.quantities.dsp += item.quantities.dsp || 0;
        groupedItem.quantities.ea += item.quantities.ea || 0;
      } else {
        // Legacy support
        const barcodeType = item.barcodeType || "ea";
        groupedItem.quantities[barcodeType] += item.quantity || 0;
      }
    });

    return Array.from(grouped.values());
  }, [inventory, isNewProduct]);

  // ✅ Generate CSV content - ปรับปรุงการแสดงผลข้อมูล
  const generateCsvContent = useCallback(
    (config: ExportConfig = DEFAULT_EXPORT_CONFIG) => {
      try {
        const groupedData = groupInventoryByMaterialCode();
        let csvContent = "";

        // Header with employee info
        if (config.includeEmployeeInfo && employeeContext) {
          csvContent += `ผู้นับสต็อก,${escapeCsvField(
            employeeContext.employeeName
          )}\n`;
          csvContent += `รหัสสาขา,${escapeCsvField(
            employeeContext.branchCode
          )}\n`;
          csvContent += `ชื่อสาขา,${escapeCsvField(
            employeeContext.branchName
          )}\n`;
          csvContent += `\n`;
        }

        if (config.includeTimestamp) {
          const now = new Date();
          const thaiDate = now.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          csvContent += `วันที่ส่งออก,${thaiDate}\n`;
          csvContent += `\n`;
        }

        // ✅ Column headers
        const headers = [
          "รหัสสินค้า",
          "คำอธิบาย",
          "กลุ่มสินค้า",
          "แบรนด์",
          "หมวดหมู่",
        ];

        if (config.includeUnitBreakdown) {
          headers.push("จำนวน CS", "จำนวน DSP", "จำนวน EA");
        }

        csvContent +=
          headers.map(escapeCsvField).join(config.csvDelimiter) + "\n";

        // ✅ Data rows - แก้ไขการแสดงข้อมูล
        groupedData.forEach((item) => {
          // ✅ สำหรับสินค้าใหม่: แยกแสดงรหัสสินค้าและคำอธิบายแยกกัน
          const displayMaterialCode = item.isNewProduct
            ? item.productName || item.materialCode // สำหรับสินค้าใหม่: แสดงชื่อสินค้าที่ผู้ใช้กรอกเป็นรหัสสินค้า
            : item.materialCode;

          const displayDescription = item.description; // คำอธิบายจะเป็น description ที่แยกออกมาแล้ว

          const row = [
            displayMaterialCode, // รหัสสินค้า (สำหรับสินค้าใหม่จะเป็น productName)
            displayDescription, // คำอธิบาย (แยกออกจากรหัสสินค้าแล้ว)
            item.productGroup,
            item.brand,
            item.category,
          ];

          if (config.includeUnitBreakdown) {
            row.push(
              item.quantities.cs.toString(),
              item.quantities.dsp.toString(),
              item.quantities.ea.toString()
            );
          }

          csvContent +=
            row.map(escapeCsvField).join(config.csvDelimiter) + "\n";
        });

        // Summary
        if (config.includeStats) {
          csvContent += "\n";
          csvContent += "สรุปข้อมูล\n";
          csvContent += `จำนวนรายการสินค้า,${groupedData.length}\n`;
          csvContent += `จำนวนรวมทั้งหมด,${groupedData.reduce(
            (sum, item) =>
              sum +
              item.quantities.cs +
              item.quantities.dsp +
              item.quantities.ea,
            0
          )}\n`;
        }

        return csvContent;
      } catch (error) {
        console.error("Error generating CSV:", error);
        setError(`เกิดข้อผิดพลาดในการสร้างไฟล์ CSV: ${error}`);
        return null;
      }
    },
    [groupInventoryByMaterialCode, employeeContext, escapeCsvField, setError]
  );

  // ✅ Export to CSV file
  const exportInventory = useCallback(
    (config?: Partial<ExportConfig>) => {
      try {
        const finalConfig = { ...DEFAULT_EXPORT_CONFIG, ...config };
        const csvContent = generateCsvContent(finalConfig);

        if (!csvContent) {
          return false;
        }

        // Create and download file
        const blob = new Blob(["\uFEFF" + csvContent], {
          type: "text/csv;charset=utf-8;",
        });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        // Generate filename
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-");
        const branchCode = employeeContext?.branchCode || "UNKNOWN";
        const filename = `inventory_${branchCode}_${timestamp}.csv`;

        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        console.log(`✅ Inventory exported successfully: ${filename}`);
        return true;
      } catch (error) {
        console.error("❌ Export failed:", error);
        setError(`การส่งออกล้มเหลว: ${error}`);
        return false;
      }
    },
    [generateCsvContent, employeeContext, setError]
  );

  // ✅ Get export preview
  const getExportPreview = useCallback(
    (config?: Partial<ExportConfig>) => {
      const finalConfig = { ...DEFAULT_EXPORT_CONFIG, ...config };
      return generateCsvContent(finalConfig);
    },
    [generateCsvContent]
  );

  return {
    exportInventory,
    generateCsvContent,
    getExportPreview,
    groupInventoryByMaterialCode,
  };
};
