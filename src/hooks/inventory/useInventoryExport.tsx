// src/hooks/inventory/useInventoryExport.tsx
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

      // Optional: Add summary statistics
      if (config.includeStats) {
        csvRows.push(""); // Empty row
        csvRows.push("ข้อมูลสรุป");
        csvRows.push(`รายการสินค้าทั้งหมด,${groupedData.size} รายการ`);
        csvRows.push(
          `จำนวนสินค้า (cs),${Array.from(groupedData.values()).reduce(
            (sum, item) => sum + item.csCount,
            0
          )} ลัง`
        );
        csvRows.push(
          `จำนวนสินค้า (ชิ้น),${Array.from(groupedData.values()).reduce(
            (sum, item) => sum + item.pieceCount,
            0
          )} ชิ้น`
        );
      }

      return csvRows.join("\n");
    },
    [inventory, employeeContext, escapeCsvField]
  );

  // Generate filename
  const generateFileName = useCallback((): string => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
    const branchCode = employeeContext?.branchCode || "XXX";

    return `สถานะคลัง_${branchCode}_${dateStr}_${timeStr}.csv`;
  }, [employeeContext]);

  // Download CSV file
  const downloadCSV = useCallback(
    (csvContent: string, fileName: string): boolean => {
      try {
        // Add BOM for UTF-8 encoding to support Thai characters
        const BOM = "\uFEFF";
        const csvWithBOM = BOM + csvContent;

        const blob = new Blob([csvWithBOM], {
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
      } catch (err: any) {
        console.error("❌ Error downloading CSV:", err);
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
      } catch (err: any) {
        console.error("❌ Error exporting inventory:", err);
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
    } catch (err: any) {
      console.error("❌ Error exporting JSON:", err);
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
    exportAsJSON,

    // Utility functions
    generateCSVContent,
    generateFileName,
    previewExportData,

    // Helper functions
    downloadCSV,
    escapeCsvField,
  };
};
