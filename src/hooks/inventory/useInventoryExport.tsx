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
  includeStats: false,
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
    // Check if it's a new product based on various indicators
    return (
      item.materialCode?.startsWith("new_") ||
      item.brand === "เพิ่มใหม่" ||
      item.id?.startsWith("new_") ||
      !item.materialCode ||
      item.materialCode === ""
    );
  }, []);

  // ✅ Helper function to get description for CSV export
  const getProductDescription = useCallback(
    (item: InventoryItem): string => {
      // For new products, use description from productData or fallback to productName
      if (isNewProduct(item)) {
        // ใช้ description จาก productData.description (ที่กรอกจากฟอร์ม)
        return (
          item.productData?.description || item.productName || "สินค้าใหม่"
        );
      }

      // For existing products, use thaiDescription or fallback to productName
      return item.thaiDescription || item.productName || "ไม่ระบุรายละเอียด";
    },
    [isNewProduct]
  );

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

      // ✅ จัดกลุ่มข้อมูลแยกตามทั้ง materialCode และ barcodeType
      const groupedData = new Map<
        string,
        {
          materialCode: string;
          productGroup: string;
          description: string; // ✅ เปลี่ยนจาก thaiDescription เป็น description
          barcodeType: string;
          csCount: number;
          pieceCount: number;
          isNewProduct: boolean; // ✅ เพิ่ม flag สำหรับสินค้าใหม่
          // ✅ เพิ่มฟิลด์สำหรับเก็บข้อมูลจากฟอร์ม
          productName: string; // สำหรับ F/FG Prod
          category: string; // สำหรับ Prod. G
          // เก็บ materialCode ของแต่ละประเภทตามลำดับความสำคัญ
          csMaterialCode?: string;
          dspMaterialCode?: string;
          eaMaterialCode?: string;
        }
      >();

      // Process inventory items
      inventory.forEach((item) => {
        const materialCode = item.materialCode || `NEW_${item.barcode}`;
        const barcodeType = item.barcodeType || "ea";
        const key = `${materialCode}_${barcodeType}`;

        // ✅ ใช้ function ใหม่สำหรับ get description
        const description = getProductDescription(item);
        const isNew = isNewProduct(item);

        if (!groupedData.has(key)) {
          groupedData.set(key, {
            materialCode,
            productGroup: item.productGroup || (isNew ? "NEW" : "OTHER"),
            description, // ✅ ใช้ description ที่คำนวณแล้ว
            barcodeType,
            csCount: 0,
            pieceCount: 0,
            isNewProduct: isNew, // ✅ เก็บ flag
            // ✅ เก็บข้อมูลจากฟอร์มสำหรับสินค้าใหม่
            productName: item.productName || "ไม่ระบุชื่อ",
            category: item.category || "ไม่ระบุหมวดหมู่",
          });
        }

        const group = groupedData.get(key)!;

        // จัดเก็บ materialCode ตามประเภท
        if (barcodeType === "cs") {
          group.csMaterialCode = materialCode;
        } else if (barcodeType === "dsp") {
          group.dspMaterialCode = materialCode;
        } else {
          group.eaMaterialCode = materialCode;
        }

        // แปลงจำนวนเป็น cs และ pieces
        if (barcodeType === "cs") {
          group.csCount += item.quantity || 0;
        } else if (barcodeType === "dsp") {
          // สมมติ 1 DSP = 12 pieces (อาจต้องปรับตาม business logic)
          const piecesPerDsp = 12;
          group.pieceCount += (item.quantity || 0) * piecesPerDsp;
        } else {
          // ea = pieces
          group.pieceCount += item.quantity || 0;
        }
      });

      // เรียงลำดับข้อมูลตาม materialCode แล้วตาม barcodeType
      const sortedGroups = Array.from(groupedData.values()).sort((a, b) => {
        const materialCompare = a.materialCode.localeCompare(b.materialCode);
        if (materialCompare !== 0) return materialCompare;
        return a.barcodeType.localeCompare(b.barcodeType);
      });

      // สร้าง CSV rows จากข้อมูลที่จัดกลุ่มแล้ว
      sortedGroups.forEach((group) => {
        // เลือก materialCode ที่เหมาะสมตามลำดับความสำคัญ: CS > DSP > EA
        const displayMaterialCode =
          group.csMaterialCode ||
          group.dspMaterialCode ||
          group.eaMaterialCode ||
          group.materialCode;

        // ✅ สำหรับสินค้าใหม่ ให้ใช้ productName เป็น F/FG
        const fgCode = group.isNewProduct
          ? group.productName
          : displayMaterialCode;
        // ✅ สำหรับสินค้าใหม่ ให้ใช้ category เป็น Prod. Gr.
        const prodGroup = group.isNewProduct
          ? group.category
          : group.productGroup;

        const row = [
          escapeCsvField(fgCode), // F/FG (ใช้ productName สำหรับสินค้าใหม่)
          escapeCsvField(prodGroup), // Prod. Gr. (ใช้ category สำหรับสินค้าใหม่)
          escapeCsvField(group.description), // ✅ รายละเอียด (ใช้ชื่อสินค้าสำหรับสินค้าใหม่)
          group.csCount > 0 ? group.csCount.toString() : "", // นับจริง (cs)
          group.pieceCount > 0 ? group.pieceCount.toString() : "", // นับจริง (ชิ้น)
        ];

        csvRows.push(row.join(","));
      });

      console.log(`📊 Total export rows: ${groupedData.size}`);
      console.log(
        `📝 New products found: ${
          Array.from(groupedData.values()).filter((g) => g.isNewProduct).length
        }`
      );
      console.log(
        `🏷️ F/FG = productName, Prod.Gr. = category, รายละเอียด = productData.description`
      );

      return csvRows.join("\n");
    },
    [
      inventory,
      employeeContext,
      escapeCsvField,
      getProductDescription,
      isNewProduct,
    ]
  );

  // Generate filename
  const generateFileName = useCallback((): string => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS

    let fileName = `inventory_${dateStr}_${timeStr}`;

    if (employeeContext) {
      fileName += `_${employeeContext.branchCode}`;
    }

    return `${fileName}.csv`;
  }, [employeeContext]);

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

  // ✅ Return all export functions
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
    getProductDescription, // ✅ Export helper function
    isNewProduct, // ✅ Export helper function
  };
};
