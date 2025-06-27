// src/hooks/inventory/useInventoryExport.tsx - Fixed Version
"use client";

import { useCallback } from "react";

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
  const downloadCSV = useCallback(
    (csvContent: string, fileName: string): Promise<boolean> => {
      return new Promise((resolve) => {
        console.log("🚀🚀🚀 downloadCSV CALLED - NEW VERSION 🚀🚀🚀");
        console.log("📁 fileName:", fileName);
        console.log("📊 csvContent length:", csvContent.length);
        console.log("🔍 First 100 chars:", csvContent.substring(0, 100));

        try {
          console.log("📤 Starting CSV download...");

          // ✅ METHOD 1: Try Blob download
          try {
            console.log("🔄 Trying Method 1: Blob download");
            const BOM = "\uFEFF";
            const blob = new Blob([BOM + csvContent], {
              type: "text/csv;charset=utf-8;",
            });

            console.log(`💾 Blob created successfully: ${blob.size} bytes`);

            const url = URL.createObjectURL(blob);
            console.log("🔗 URL created:", url.substring(0, 50) + "...");

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.style.display = "none";

            console.log("📎 Link element created with:", {
              href: link.href.substring(0, 50) + "...",
              download: link.download,
              display: link.style.display,
            });

            document.body.appendChild(link);
            console.log("📌 Link added to document.body");

            // ✅ Add click event listener for debugging
            link.addEventListener("click", (event) => {
              console.log("🖱️ CLICK EVENT FIRED!");
              console.log("Event details:", event);
            });

            // ✅ Trigger download
            console.log("⚡ About to trigger click...");
            link.click();
            console.log("✅ Click triggered!");

            // ✅ Check if download attribute is supported
            if ("download" in link) {
              console.log("✅ Download attribute is supported");
            } else {
              console.warn("⚠️ Download attribute is NOT supported");
            }

            // ✅ Delay cleanup
            setTimeout(() => {
              try {
                if (document.body.contains(link)) {
                  document.body.removeChild(link);
                  console.log("🧹 Link removed from DOM");
                } else {
                  console.log("ℹ️ Link was already removed from DOM");
                }
                URL.revokeObjectURL(url);
                console.log("🧹 URL revoked");
                console.log("✅ Method 1 completed successfully");
                resolve(true);
              } catch (cleanupError) {
                console.warn("⚠️ Cleanup error (non-critical):", cleanupError);
                resolve(true);
              }
            }, 2000); // Increased to 2 seconds
          } catch (blobError) {
            console.error("❌ Method 1 (Blob) failed:", blobError);

            // ✅ FALLBACK METHOD 2: Data URL
            console.log("🔄 Trying Method 2: Data URL");
            try {
              const BOM = "\uFEFF";
              const dataUrl = `data:text/csv;charset=utf-8,${BOM}${encodeURIComponent(
                csvContent
              )}`;

              console.log("📄 Data URL created, length:", dataUrl.length);

              const link = document.createElement("a");
              link.href = dataUrl;
              link.download = fileName;
              link.style.display = "none";

              document.body.appendChild(link);
              console.log("📌 Data URL link added to DOM");

              link.click();
              console.log("⚡ Data URL click triggered");

              setTimeout(() => {
                if (document.body.contains(link)) {
                  document.body.removeChild(link);
                }
                console.log("✅ Method 2 completed successfully");
                resolve(true);
              }, 1000);
            } catch (dataUrlError) {
              console.error("❌ Method 2 (Data URL) failed:", dataUrlError);

              // ✅ FALLBACK METHOD 3: Force user action
              console.log("🔄 Trying Method 3: Manual copy");

              // Show alert with instructions
              alert(
                `ไม่สามารถดาวน์โหลดไฟล์อัตโนมัติได้\n\nกรุณา:\n1. เปิด Developer Tools (F12)\n2. ไปที่ Console tab\n3. คัดลอกข้อมูลด้านล่าง\n4. บันทึกเป็นไฟล์ ${fileName}\n\nหรือลองใช้ browser อื่น`
              );

              console.log("📋 CSV DATA TO COPY:");
              console.log("=".repeat(50));
              console.log(csvContent);
              console.log("=".repeat(50));

              resolve(false);
            }
          }
        } catch (error: unknown) {
          console.error("❌ Complete download failure:", error);
          setError("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
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
