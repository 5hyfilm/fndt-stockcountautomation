// src/hooks/inventory/useInventoryExport.tsx - Fixed Version
"use client";

import { useCallback } from "react";
import { useInventoryExport } from "../hooks/inventory/useInventoryExport"; // ✅ เพิ่ม import

// ✅ FIX: Import from correct path
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
  productData?: any;
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

  // ✅ Generate Wide Format CSV content
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

      // ✅ Wide Format Column headers
      const headers = [
        "Material Code",
        "Product Name",
        "Description",
        "Product Group",
        "Brand",
        "CS (ลัง)",
        "DSP (แพ็ค)",
        "EA (ชิ้น)",
        "Total Units",
        "Last Updated",
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
          cs > 0 ? cs.toString() : "0",
          dsp > 0 ? dsp.toString() : "0",
          ea > 0 ? ea.toString() : "0",
          totalUnits.toString(),
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

      csvRows.push(`รวมทั้งหมด,,,,,${totalCS},${totalDSP},${totalEA}`);

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

  // ✅ Generate filename
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

  // ✅ FIXED: Download CSV with proper async handling and fallback methods
  // Debug Real Export - เพิ่มใน useInventoryExport.tsx
  // แทนที่ downloadCSV function เดิมด้วยโค้ดนี้

  const downloadCSV = useCallback(
    (csvContent: string, fileName: string): Promise<boolean> => {
      return new Promise((resolve) => {
        console.log("🚀🚀🚀 REAL EXPORT DEBUG VERSION 🚀🚀🚀");
        console.log("📁 fileName:", fileName);
        console.log("📊 csvContent length:", csvContent.length);

        // ✅ DEBUG: Show first 300 characters of CSV
        console.log("📄 CSV Preview (first 300 chars):");
        console.log("─".repeat(50));
        console.log(csvContent.substring(0, 300));
        console.log("─".repeat(50));

        // ✅ DEBUG: Check for common issues
        const debugChecks = {
          hasContent: csvContent && csvContent.length > 0,
          hasValidFileName: fileName && fileName.includes(".csv"),
          contentType: typeof csvContent,
          fileNameType: typeof fileName,
          contentStartsWithBOM: csvContent.startsWith("\uFEFF"),
          hasCommas: csvContent.includes(","),
          hasNewlines: csvContent.includes("\n"),
          estimatedRows: csvContent.split("\n").length,
        };

        console.log("🔍 DEBUG CHECKS:");
        console.table(debugChecks);

        // ✅ DEBUG: Validate inputs
        if (!csvContent || csvContent.length === 0) {
          console.error("❌ CRITICAL: CSV content is empty or null!");
          setError("CSV content is empty");
          resolve(false);
          return;
        }

        if (!fileName || !fileName.includes(".csv")) {
          console.error("❌ CRITICAL: Invalid filename:", fileName);
          setError("Invalid filename");
          resolve(false);
          return;
        }

        try {
          console.log("💾 Creating blob...");
          const BOM = "\uFEFF";
          const finalContent = csvContent.startsWith(BOM)
            ? csvContent
            : BOM + csvContent;

          const blob = new Blob([finalContent], {
            type: "text/csv;charset=utf-8;",
          });

          console.log(`✅ Blob created successfully:`);
          console.log(`   Size: ${blob.size} bytes`);
          console.log(`   Type: ${blob.type}`);
          console.log(`   Expected size: ~${finalContent.length} bytes`);

          if (blob.size === 0) {
            console.error("❌ CRITICAL: Blob size is 0!");
            resolve(false);
            return;
          }

          const url = URL.createObjectURL(blob);
          console.log("🔗 Object URL created:", url.substring(0, 60) + "...");

          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";

          console.log("🔗 Link element properties:");
          console.log(`   href: ${link.href.substring(0, 60)}...`);
          console.log(`   download: ${link.download}`);
          console.log(`   display: ${link.style.display}`);

          // ✅ Check download support again
          const downloadSupported = "download" in link;
          console.log(`✅ Download attribute supported: ${downloadSupported}`);

          if (!downloadSupported) {
            console.error("❌ CRITICAL: Download attribute not supported!");
            URL.revokeObjectURL(url);
            resolve(false);
            return;
          }

          // ✅ Enhanced event listeners with detailed logging
          let clickFired = false;
          let resolved = false;

          const cleanup = () => {
            if (!resolved) {
              resolved = true;
              try {
                if (document.body.contains(link)) {
                  document.body.removeChild(link);
                  console.log("🧹 Link removed from DOM");
                }
                URL.revokeObjectURL(url);
                console.log("🧹 Object URL revoked");
              } catch (cleanupError) {
                console.warn("⚠️ Cleanup warning:", cleanupError);
              }
            }
          };

          link.addEventListener("click", (event) => {
            console.log("🖱️ CLICK EVENT FIRED! Event details:");
            console.log(`   type: ${event.type}`);
            console.log(`   target: ${event.target}`);
            console.log(`   currentTarget: ${event.currentTarget}`);
            console.log(`   defaultPrevented: ${event.defaultPrevented}`);
            console.log(`   cancelBubble: ${event.cancelBubble}`);

            clickFired = true;

            // ✅ Immediate feedback
            console.log("⏱️ Waiting for download to complete...");

            // ✅ Progressive timeout with status updates
            setTimeout(() => {
              if (!resolved) {
                console.log(
                  "⏱️ 1 second passed, checking browser downloads..."
                );
                console.log(
                  "💡 TIP: Check browser downloads (Ctrl+J) to see if file appeared"
                );
              }
            }, 1000);

            setTimeout(() => {
              if (!resolved) {
                console.log("⏱️ 3 seconds passed, assuming success");
                console.log(
                  "✅ Download process completed (assumed successful)"
                );
                cleanup();
                resolve(true);
              }
            }, 3000);
          });

          link.addEventListener("error", (event) => {
            console.error("❌ LINK ERROR EVENT FIRED:");
            console.error("   Event:", event);
            console.error(
              "   Error details:",
              event.error || "No error details"
            );

            if (!resolved) {
              cleanup();
              resolve(false);
            }
          });

          // ✅ Safety timeout
          setTimeout(() => {
            if (!clickFired && !resolved) {
              console.error("❌ TIMEOUT: Click event never fired!");
              console.error(
                "This indicates a serious browser compatibility issue"
              );
              cleanup();
              resolve(false);
            }
          }, 5000);

          // ✅ Add to DOM with logging
          console.log("📌 Adding link to document.body...");
          document.body.appendChild(link);
          console.log("✅ Link added to DOM");

          // ✅ Verify link was added
          const linkInDOM = document.body.contains(link);
          console.log(`🔍 Link in DOM verification: ${linkInDOM}`);

          if (!linkInDOM) {
            console.error("❌ CRITICAL: Link was not added to DOM!");
            resolve(false);
            return;
          }

          // ✅ Trigger click with detailed logging
          console.log("⚡ About to trigger click...");
          console.log("🎯 Current timestamp:", new Date().toISOString());

          try {
            link.click();
            console.log("✅ link.click() executed successfully");
            console.log("⏳ Waiting for click event and download to start...");
          } catch (clickError) {
            console.error("❌ CRITICAL: link.click() threw an error:");
            console.error(clickError);
            cleanup();
            resolve(false);
          }
        } catch (error: unknown) {
          console.error("❌ CRITICAL: Unexpected error in downloadCSV:");
          console.error(error);
          setError("Critical error in download process");
          resolve(false);
        }
      });
    },
    [setError]
  );

  // ✅ Main export function
  const exportInventory = useCallback(
    async (config: ExportConfig = DEFAULT_EXPORT_CONFIG): Promise<boolean> => {
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

        // ✅ Validate content
        if (!csvContent || csvContent.length === 0) {
          console.error("❌ Empty CSV content generated");
          setError("ไม่สามารถสร้างเนื้อหา CSV ได้");
          return false;
        }

        console.log(
          "📝 CSV content preview:",
          csvContent.substring(0, 200) + "..."
        );

        // ✅ Start download
        const success = await downloadCSV(csvContent, fileName);

        if (success) {
          console.log("✅ Wide Format CSV export completed successfully");
          console.log(`📁 File: ${fileName}`);
          console.log(`👤 Exported by: ${employeeContext?.employeeName}`);
        } else {
          console.error("❌ CSV export failed");
          setError("ไม่สามารถดาวน์โหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
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

  // ✅ Export as JSON
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

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 1000);

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
    groupInventoryByMaterialCode,
  };
};
