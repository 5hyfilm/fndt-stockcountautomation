// src/hooks/inventory/useInventoryExport.tsx - Phase 2: Wide Format Export
"use client";

import { useCallback } from "react";
import {
  InventoryItem,
  EmployeeContext,
  ExportConfig,
  MultiUnitQuantities,
} from "./types";

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
  // ✅ NEW: Wide format options
  includeUnitBreakdown: true,
};

// ✅ NEW: Interface for grouped inventory data (Wide Format)
interface GroupedInventoryData {
  materialCode: string;
  productName: string;
  description: string;
  productGroup: string;
  brand: string;
  category: string;
  // ✅ Wide format quantities
  quantities: {
    cs: number;
    dsp: number;
    ea: number;
  };
  // Metadata
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

  // ✅ NEW: Group inventory by Material Code (Wide Format)
  const groupInventoryByMaterialCode = useCallback((): Map<
    string,
    GroupedInventoryData
  > => {
    const groupedData = new Map<string, GroupedInventoryData>();

    console.log(
      "🔄 Grouping inventory data by Material Code for Wide Format export..."
    );

    inventory.forEach((item) => {
      const isNew = isNewProduct(item);
      const materialCode =
        item.materialCode || item.barcode || `UNKNOWN_${item.id}`;

      console.log(`📦 Processing item: ${item.productName} (${materialCode})`);

      const existing = groupedData.get(materialCode);

      // Extract quantities from multi-unit or legacy format
      let quantities: { cs: number; dsp: number; ea: number };

      if (item.quantities) {
        // ✅ New multi-unit format
        quantities = {
          cs: item.quantities.cs || 0,
          dsp: item.quantities.dsp || 0,
          ea: item.quantities.ea || 0,
        };
        console.log(`  📊 Multi-unit quantities:`, quantities);
      } else {
        // ✅ Legacy format conversion
        const barcodeType = item.barcodeType || "ea";
        quantities = { cs: 0, dsp: 0, ea: 0 };
        quantities[barcodeType] = item.quantity || 0;
        console.log(`  📊 Legacy quantity: ${item.quantity} ${barcodeType}`);
      }

      if (existing) {
        // ✅ Merge quantities
        existing.quantities.cs += quantities.cs;
        existing.quantities.dsp += quantities.dsp;
        existing.quantities.ea += quantities.ea;

        // Update metadata
        existing.scannedBarcodes.push(item.barcode);
        if (item.lastUpdated > existing.lastUpdated) {
          existing.lastUpdated = item.lastUpdated;
        }

        console.log(
          `  ✅ Merged with existing: CS=${existing.quantities.cs}, DSP=${existing.quantities.dsp}, EA=${existing.quantities.ea}`
        );
      } else {
        // ✅ Create new group
        const newGroup: GroupedInventoryData = {
          materialCode,
          productName: item.productName,
          description: item.thaiDescription || item.productName,
          productGroup: item.productGroup || "ไม่ระบุ",
          brand: item.brand || "ไม่ระบุ",
          category: item.category || "ไม่ระบุ",
          quantities: { ...quantities },
          isNewProduct: isNew,
          scannedBarcodes: [item.barcode],
          lastUpdated: item.lastUpdated,
        };

        groupedData.set(materialCode, newGroup);
        console.log(
          `  🆕 Created new group: CS=${quantities.cs}, DSP=${quantities.dsp}, EA=${quantities.ea}`
        );
      }
    });

    console.log(
      `📊 Grouped ${inventory.length} items into ${groupedData.size} SKUs`
    );
    return groupedData;
  }, [inventory, isNewProduct]);

  // ✅ NEW: Generate Wide Format CSV content
  const generateWideFormatCSV = useCallback(
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

      // ✅ Header section
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

      // ✅ NEW: Wide Format Column headers
      const headers = [
        "Material Code", // รหัสวัตถุดิบ
        "Product Name", // ชื่อสินค้า
        "Description", // รายละเอียด
        "Product Group", // กลุ่มสินค้า
        "Brand", // แบรนด์
        "CS (ลัง)", // จำนวนลัง
        "DSP (แพ็ค)", // จำนวนแพ็ค
        "EA (ชิ้น)", // จำนวนชิ้น
        "Total Units", // จำนวนรวม (ทุกหน่วย)
        "Last Updated", // อัปเดตล่าสุด
      ];

      csvRows.push(headers.map((header) => escapeCsvField(header)).join(","));

      // ✅ Group and process data
      const groupedData = groupInventoryByMaterialCode();

      // ✅ Sort by Material Code for consistent output
      const sortedGroups = Array.from(groupedData.values()).sort((a, b) =>
        a.materialCode.localeCompare(b.materialCode)
      );

      // ✅ Generate data rows
      sortedGroups.forEach((group) => {
        const { cs, dsp, ea } = group.quantities;
        const totalUnits = cs + dsp + ea;

        // Skip groups with no quantities
        if (totalUnits === 0) {
          console.log(`⚠️ Skipping ${group.materialCode} - no quantities`);
          return;
        }

        const row = [
          escapeCsvField(group.materialCode),
          escapeCsvField(group.productName),
          escapeCsvField(group.description),
          escapeCsvField(group.productGroup),
          escapeCsvField(group.brand),
          cs > 0 ? cs.toString() : "0", // CS column
          dsp > 0 ? dsp.toString() : "0", // DSP column
          ea > 0 ? ea.toString() : "0", // EA column
          totalUnits.toString(), // Total
          escapeCsvField(
            new Date(group.lastUpdated).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          ),
        ];

        csvRows.push(row.join(","));

        console.log(
          `📝 Exported: ${group.materialCode} - CS:${cs}, DSP:${dsp}, EA:${ea}`
        );
      });

      // ✅ Add summary footer
      csvRows.push("");
      csvRows.push(
        `สรุป,${sortedGroups.length} รายการ,${inventory.length} entries รวม`
      );

      const totalCS = sortedGroups.reduce((sum, g) => sum + g.quantities.cs, 0);
      const totalDSP = sortedGroups.reduce(
        (sum, g) => sum + g.quantities.dsp,
        0
      );
      const totalEA = sortedGroups.reduce((sum, g) => sum + g.quantities.ea, 0);

      csvRows.push(`รวมทั้งหมด,,,"",""${totalCS},${totalDSP},${totalEA}`);

      console.log(`📊 Export Summary:`);
      console.log(`   SKUs: ${sortedGroups.length}`);
      console.log(`   Total CS: ${totalCS}`);
      console.log(`   Total DSP: ${totalDSP}`);
      console.log(`   Total EA: ${totalEA}`);

      return csvRows.join("\n");
    },
    [
      employeeContext,
      escapeCsvField,
      groupInventoryByMaterialCode,
      inventory.length,
    ]
  );

  // ✅ Generate filename (updated for wide format)
  const generateFileName = useCallback((): string => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS

    let fileName = `FN_Stock_Wide_${dateStr}_${timeStr}`;

    if (employeeContext) {
      fileName = `FN_Stock_Wide_${employeeContext.branchCode}_${dateStr}_${timeStr}`;
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

  // ✅ MAIN: Export function (Wide Format)
  const exportInventory = useCallback(
    (config: ExportConfig = DEFAULT_EXPORT_CONFIG): boolean => {
      try {
        if (inventory.length === 0) {
          setError("ไม่มีข้อมูลสินค้าให้ส่งออก");
          return false;
        }

        setError(null);

        console.log("📤 Starting Wide Format CSV export...");
        console.log(`📦 Total items: ${inventory.length}`);

        const csvContent = generateWideFormatCSV(config);
        const fileName = generateFileName();

        const success = downloadCSV(csvContent, fileName);

        if (success) {
          console.log("✅ Wide Format CSV export completed successfully");
          console.log(`📁 File: ${fileName}`);
          console.log(`👤 Exported by: ${employeeContext?.employeeName}`);
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
      generateWideFormatCSV,
      generateFileName,
      downloadCSV,
      setError,
    ]
  );

  // ✅ Export as JSON (updated with wide format data)
  const exportAsJSON = useCallback((): boolean => {
    try {
      if (inventory.length === 0) {
        setError("ไม่มีข้อมูลสินค้าให้ส่งออก");
        return false;
      }

      const groupedData = groupInventoryByMaterialCode();

      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: employeeContext?.employeeName,
          branchCode: employeeContext?.branchCode,
          branchName: employeeContext?.branchName,
          format: "wide_format_multi_unit",
          totalSKUs: groupedData.size,
          totalItems: inventory.length,
        },
        data: Array.from(groupedData.values()),
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const fileName = `FN_Stock_Data_${employeeContext?.branchCode || "XXX"}_${
        new Date().toISOString().split("T")[0]
      }.json`;

      link.href = url;
      link.download = fileName;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      console.log("📤 JSON export completed:", fileName);
      return true;
    } catch (error: unknown) {
      console.error("❌ Error exporting JSON:", error);
      setError("เกิดข้อผิดพลาดในการส่งออกข้อมูล JSON");
      return false;
    }
  }, [inventory, employeeContext, groupInventoryByMaterialCode, setError]);

  return {
    exportInventory,
    exportAsJSON,
    generateFileName,
    groupInventoryByMaterialCode, // ✅ Expose for testing/debugging
  };
};
