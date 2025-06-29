// Path: ./src/hooks/inventory/useInventoryExport.tsx
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
  productData?: Product; // ✅ แก้ไขจาก any เป็น Product
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
      item.id?.startsWith("new_") ||
      !item.materialCode ||
      item.materialCode === ""
    );
  }, []);

  // ✅ Group inventory by Material Code (Wide Format)
  const groupInventoryByMaterialCode = useCallback(() => {
    const grouped = new Map<string, GroupedInventoryData>();

    inventory.forEach((item) => {
      const materialCode = item.materialCode || item.id;

      if (!grouped.has(materialCode)) {
        grouped.set(materialCode, {
          materialCode,
          productName: item.productName,
          description: item.thaiDescription || item.productName,
          productGroup: item.productGroup || "",
          brand: item.brand,
          category: item.category,
          quantities: {
            cs: 0,
            dsp: 0,
            ea: 0,
          },
          isNewProduct: isNewProduct(item),
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

      // เก็บบาร์โค้ดที่สแกน
      // if (item.barcode && !groupedItem.scannedBarcodes.includes(item.barcode)) {
      //   groupedItem.scannedBarcodes.push(item.barcode);
      // }

      // อัพเดทเวลาล่าสุด
      // if (new Date(item.lastUpdated) > new Date(groupedItem.lastUpdated)) {
      //   groupedItem.lastUpdated = item.lastUpdated;
      // }
    });

    return Array.from(grouped.values());
  }, [inventory, isNewProduct]);

  // ✅ Generate CSV content with Wide Format (หลัก)
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

        // Column headers
        const headers = [
          "รหัสสินค้า",
          "ชื่อสินค้า",
          "คำอธิบาย",
          "กลุ่มสินค้า",
          "แบรนด์",
          "หมวดหมู่",
        ];

        if (config.includeUnitBreakdown) {
          headers.push("จำนวน CS", "จำนวน DSP", "จำนวน EA");
        }

        headers
          .push
          // "จำนวนรวม"
          ();

        csvContent +=
          headers.map(escapeCsvField).join(config.csvDelimiter) + "\n";

        // Data rows
        groupedData.forEach((item) => {
          const row = [
            item.materialCode,
            item.productName,
            item.description,
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

          row
            .push
            // totalQuantity.toString()
            ();

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
          // csvContent += `สินค้าใหม่,${
          //   groupedData.filter((item) => item.isNewProduct).length
          // }\n`;
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

  // ✅ Get export statistics
  const getExportStats = useCallback(() => {
    const groupedData = groupInventoryByMaterialCode();

    return {
      totalProducts: groupedData.length,
      totalQuantity: groupedData.reduce(
        (sum, item) =>
          sum + item.quantities.cs + item.quantities.dsp + item.quantities.ea,
        0
      ),
      newProducts: groupedData.filter((item) => item.isNewProduct).length,
      quantityBreakdown: {
        cs: groupedData.reduce((sum, item) => sum + item.quantities.cs, 0),
        dsp: groupedData.reduce((sum, item) => sum + item.quantities.dsp, 0),
        ea: groupedData.reduce((sum, item) => sum + item.quantities.ea, 0),
      },
      lastUpdate:
        inventory.length > 0
          ? Math.max(
              ...inventory.map((item) => new Date(item.lastUpdated).getTime())
            )
          : null,
    };
  }, [groupInventoryByMaterialCode, inventory]);

  return {
    exportInventory,
    getExportPreview,
    getExportStats,
    groupInventoryByMaterialCode,
  };
};
