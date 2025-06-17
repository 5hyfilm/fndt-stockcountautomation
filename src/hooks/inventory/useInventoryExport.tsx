// ./src/hooks/inventory/useInventoryExport.tsx
"use client";

import { useCallback } from "react";
import { InventoryItem, EmployeeContext, ExportConfig } from "./types";

interface UseInventoryExportProps {
  inventory: InventoryItem[];
  employeeContext?: EmployeeContext;
  setError: (error: string | null) => void;
}

const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  includeEmployeeInfo: true,
  includeTimestamp: true,
  includeStats: false, // เปลี่ยนเป็น false เพื่อให้ไฟล์สั้นลง
  csvDelimiter: ",",
  dateFormat: "th-TH",
  separateUnitColumns: true,
  includeConvertedQuantity: true,
};

export const useInventoryExport = ({
  inventory,
  employeeContext,
  setError,
}: UseInventoryExportProps) => {
  // Helper function to escape CSV fields
  const escapeCsvField = useCallback((field: string | number): string => {
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
  }, []);

  // Generate CSV content
  const generateCSVContent = useCallback(
    (config: ExportConfig = DEFAULT_EXPORT_CONFIG): string => {
      const now = new Date();
      const thaiDate = now.toLocaleDateString(config.dateFormat, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const thaiTime = now.toLocaleTimeString(config.dateFormat, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const branchCode = employeeContext?.branchCode || "XXX";
      const branchName = employeeContext?.branchName || "ไม่ระบุสาขา";

      const csvRows: string[] = [];

      // Header section
      if (config.includeTimestamp) {
        csvRows.push(
          escapeCsvField(
            `สถานะคลังล่าสุด ${thaiDate} ${thaiTime} สำหรับ ${branchCode} - ${branchName}`
          )
        );
      }

      if (config.includeEmployeeInfo && employeeContext) {
        csvRows.push(
          `ตรวจนับโดย,${escapeCsvField(employeeContext.employeeName)}`
        );
      }

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
        console.log("📤 Exporting item:", {
          name: item.productName,
          barcodeType: item.barcodeType,
          quantity: item.quantity,
        });

        const key = `${item.materialCode}_${item.productGroup}`;
        const existing = groupedData.get(key);

        if (existing) {
          if (item.barcodeType === "cs") {
            console.log(`  📦 Adding to CS count: ${item.quantity}`);
            existing.csCount += item.quantity;
          } else if (item.barcodeType === "ea" || item.barcodeType === "dsp") {
            console.log(`  🔢 Adding to piece count: ${item.quantity}`);
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

      return csvRows.join("\n");
    },
    [inventory, employeeContext, escapeCsvField]
  );

  // ✅ NEW: Generate Dual Unit CSV content with detailed breakdown
  const generateDualUnitCSVContent = useCallback(
    (config: ExportConfig = DEFAULT_EXPORT_CONFIG): string => {
      const now = new Date();
      const thaiDate = now.toLocaleDateString(config.dateFormat, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const thaiTime = now.toLocaleTimeString(config.dateFormat, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const branchCode = employeeContext?.branchCode || "XXX";
      const branchName = employeeContext?.branchName || "ไม่ระบุสาขา";

      const csvRows: string[] = [];

      // Header section
      if (config.includeTimestamp) {
        csvRows.push(
          escapeCsvField(
            `สถานะคลังล่าสุด (Dual Unit) ${thaiDate} ${thaiTime} สำหรับ ${branchCode} - ${branchName}`
          )
        );
      }

      if (config.includeEmployeeInfo && employeeContext) {
        csvRows.push(
          `ตรวจนับโดย,${escapeCsvField(employeeContext.employeeName)}`
        );
      }

      // เว้น 1 row
      csvRows.push("");

      // ✅ Detailed Dual Unit Column headers
      const headers = [
        "ลำดับ",
        "บาร์โค้ด",
        "ชื่อสินค้า",
        "แบรนด์",
        "หมวดหมู่",
        "ขนาด",
        "นับจริง (cs)",
        "ประเภทหน่วย cs",
        "นับจริง (ชิ้น)",
        "ประเภทหน่วย ชิ้น",
        ...(config.includeConvertedQuantity ? ["จำนวนรวม (EA)"] : []),
        "ประเภทบาร์โค้ดที่สแกน",
        "วันที่อัพเดต",
        ...(config.includeEmployeeInfo ? ["ผู้เพิ่ม", "รหัสสาขา"] : []),
      ];

      csvRows.push(
        headers
          .map((header) => escapeCsvField(header))
          .join(config.csvDelimiter)
      );

      // Data rows with detailed dual unit format (no grouping)
      inventory.forEach((item, index) => {
        const row = [
          escapeCsvField(index + 1), // ลำดับ
          escapeCsvField(item.barcode), // บาร์โค้ด
          escapeCsvField(item.productName), // ชื่อสินค้า
          escapeCsvField(item.brand), // แบรนด์
          escapeCsvField(item.category), // หมวดหมู่
          escapeCsvField(item.size || ""), // ขนาด
          escapeCsvField(item.csCount || 0), // นับจริง (cs)
          escapeCsvField(item.csUnitType || ""), // ประเภทหน่วย cs
          escapeCsvField(item.pieceCount || 0), // นับจริง (ชิ้น)
          escapeCsvField(item.pieceUnitType || ""), // ประเภทหน่วย ชิ้น
          ...(config.includeConvertedQuantity
            ? [escapeCsvField(item.quantity)]
            : []), // จำนวนรวม (EA)
          escapeCsvField(item.barcodeType || "ea"), // ประเภทบาร์โค้ดที่สแกน
          escapeCsvField(
            new Date(item.lastUpdated).toLocaleDateString(config.dateFormat)
          ), // วันที่อัพเดต
          ...(config.includeEmployeeInfo
            ? [
                escapeCsvField(item.addedBy || ""),
                escapeCsvField(item.branchCode || ""),
              ]
            : []),
        ];

        csvRows.push(row.join(config.csvDelimiter));
      });

      return csvRows.join("\n");
    },
    [inventory, employeeContext, escapeCsvField]
  );

  // Generate filename
  const generateFileName = useCallback(
    (suffix?: string): string => {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS

      let fileName = `inventory_${dateStr}_${timeStr}`;

      if (suffix) {
        fileName += `_${suffix}`;
      }

      if (employeeContext) {
        fileName += `_${employeeContext.branchCode}`;
      }

      return `${fileName}.csv`;
    },
    [employeeContext]
  );

  // Download CSV file
  const downloadCSV = useCallback(
    (csvContent: string, fileName: string): boolean => {
      try {
        // Add BOM for proper Unicode handling in Excel
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvContent], {
          type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        return true;
      } catch (error: unknown) {
        console.error("❌ Error downloading CSV:", error);
        setError("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
        return false;
      }
    },
    [setError]
  );

  // Main export function
  const exportInventory = useCallback(
    (config: ExportConfig = DEFAULT_EXPORT_CONFIG): boolean => {
      try {
        if (inventory.length === 0) {
          setError("ไม่มีข้อมูลสินค้าให้ส่งออก");
          return false;
        }

        setError(null);

        const csvContent = generateCSVContent(config);
        const fileName = generateFileName();

        const success = downloadCSV(csvContent, fileName);

        if (success) {
          console.log(
            "📤 Exported inventory data as CSV:",
            inventory.length,
            "items by",
            employeeContext?.employeeName
          );
        }

        return success;
      } catch (error: unknown) {
        console.error("❌ Error exporting inventory:", error);
        setError("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
        return false;
      }
    },
    [
      inventory,
      employeeContext,
      generateCSVContent,
      generateFileName,
      downloadCSV,
      setError,
    ]
  );

  // ✅ NEW: Export inventory with dual unit format
  const exportInventoryWithDualUnits = useCallback(
    (config: ExportConfig = DEFAULT_EXPORT_CONFIG): boolean => {
      try {
        if (inventory.length === 0) {
          setError("ไม่มีข้อมูลสินค้าให้ส่งออก");
          return false;
        }

        setError(null);

        const csvContent = generateDualUnitCSVContent(config);
        const fileName = generateFileName("dual_unit");

        const success = downloadCSV(csvContent, fileName);

        if (success) {
          console.log(
            "📤 Exported dual unit inventory data as CSV:",
            inventory.length,
            "items by",
            employeeContext?.employeeName
          );
        }

        return success;
      } catch (error: unknown) {
        console.error("❌ Error exporting dual unit inventory:", error);
        setError("เกิดข้อผิดพลาดในการส่งออกข้อมูลแบบ dual unit");
        return false;
      }
    },
    [
      inventory,
      employeeContext,
      generateDualUnitCSVContent,
      generateFileName,
      downloadCSV,
      setError,
    ]
  );

  // Export as JSON (for backup purposes)
  const exportAsJSON = useCallback((): boolean => {
    try {
      if (inventory.length === 0) {
        setError("ไม่มีข้อมูลสินค้าให้ส่งออก");
        return false;
      }

      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: employeeContext?.employeeName,
          branchCode: employeeContext?.branchCode,
          branchName: employeeContext?.branchName,
          totalItems: inventory.length,
          version: "1.1",
        },
        inventory: inventory,
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const fileName = generateFileName().replace(".csv", ".json");
      link.href = url;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);

      console.log("📤 Exported inventory as JSON:", inventory.length, "items");
      return true;
    } catch (error: unknown) {
      console.error("❌ Error exporting JSON:", error);
      setError("เกิดข้อผิดพลาดในการส่งออก JSON");
      return false;
    }
  }, [inventory, employeeContext, generateFileName, setError]);

  // Preview export data (for UI)
  const previewExportData = useCallback(
    (maxRows: number = 10) => {
      const csvContent = generateCSVContent();
      const rows = csvContent.split("\n");

      return {
        totalRows: rows.length,
        previewRows: rows.slice(0, maxRows),
        estimatedFileSize: new Blob([csvContent]).size,
        fileName: generateFileName(),
      };
    },
    [generateCSVContent, generateFileName]
  );

  return {
    // Main export functions
    exportInventory,
    exportInventoryWithDualUnits, // ✅ NEW
    exportAsJSON,

    // Utility functions
    generateCSVContent,
    generateDualUnitCSVContent, // ✅ NEW
    generateFileName,
    previewExportData,

    // Helper functions
    downloadCSV,
    escapeCsvField,
  };
};
