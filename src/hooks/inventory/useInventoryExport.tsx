// Path: src/hooks/inventory/useInventoryExport.tsx
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
    return (
      item.materialCode?.startsWith("new_") ||
      item.brand === "เพิ่มใหม่" ||
      item.id?.startsWith("new_") ||
      !item.materialCode ||
      item.materialCode === ""
    );
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

      // ✅ FIX: จัดกลุ่มข้อมูลตาม materialCode เท่านั้น (ไม่แยก barcodeType)
      const groupedData = new Map<
        string,
        {
          materialCode: string;
          productGroup: string;
          thaiDescription: string;
          csCount: number;
          pieceCount: number;
          // ✅ เพิ่มฟิลด์สำหรับสินค้าใหม่
          isNewProduct: boolean;
          productName?: string; // สำหรับ F/FG ของสินค้าใหม่
          productGroupFromForm?: string; // ✅ เปลี่ยนจาก category เป็น productGroupFromForm เพื่อไม่สับสน
          description?: string; // สำหรับรายละเอียดของสินค้าใหม่
          // ✅ เก็บ barcodeTypes ที่มีในกลุ่มนี้
          barcodeTypes: Set<string>;
          // ✅ เก็บ materialCode ของแต่ละประเภทตามลำดับความสำคัญ (ใช้ logic เดิม)
          csMaterialCode?: string; // รหัสของ CS (ลัง)
          dspMaterialCode?: string; // รหัสของ DSP (แพ็ค)
          eaMaterialCode?: string; // รหัสของ EA (ชิ้น)
        }
      >();

      inventory.forEach((item) => {
        const isNew = isNewProduct(item);

        console.log("📤 Processing item:", {
          name: item.productName,
          materialCode: item.materialCode,
          barcodeType: item.barcodeType,
          quantity: item.quantity,
          quantityDetail: item.quantityDetail,
          isNewProduct: isNew,
          productGroup: item.productGroup, // ✅ Log productGroup instead of category
        });

        // ✅ FIX: ใช้ key ที่รวมตาม materialCode และ productGroup เท่านั้น
        let key: string;
        if (isNew) {
          // ✅ สำหรับสินค้าใหม่ ใช้ productName + productGroup
          key = `NEW_${item.productName}_${item.productGroup}`;
        } else {
          // สำหรับสินค้าเดิม ใช้ materialCode + productGroup
          key = `${item.materialCode}_${item.productGroup}`;
        }

        const existing = groupedData.get(key);

        // Enhanced logic สำหรับ quantityDetail (Phase 2)
        let csToAdd = 0;
        let piecesToAdd = 0;
        let itemType: "cs" | "dsp" | "ea" = "ea";

        if (item.quantityDetail) {
          // ใช้ quantityDetail จาก Phase 2
          const { major, remainder, scannedType } = item.quantityDetail;
          itemType = scannedType;

          if (scannedType === "dsp" || scannedType === "cs") {
            csToAdd = major; // major ไปใน CS column
            piecesToAdd = remainder; // เศษไปใน ชิ้น column
            console.log(
              `  📦 Adding to CS count (${scannedType}): ${major}, remainder pieces: ${remainder}`
            );
          } else if (scannedType === "ea") {
            csToAdd = 0;
            piecesToAdd = major + remainder; // EA รวมทั้งหมดไปใน ชิ้น column
            console.log(
              `  🔢 Adding to piece count (ea): ${major + remainder}`
            );
          }
        } else {
          // Fallback สำหรับข้อมูลเก่าที่ไม่มี quantityDetail
          itemType = (item.barcodeType as "cs" | "dsp" | "ea") || "ea";

          if (item.barcodeType === "dsp" || item.barcodeType === "cs") {
            csToAdd = item.quantity;
            piecesToAdd = 0;
            console.log(
              `  📦 Adding to CS count (${item.barcodeType}): ${item.quantity}`
            );
          } else if (item.barcodeType === "ea") {
            csToAdd = 0;
            piecesToAdd = item.quantity;
            console.log(`  🔢 Adding to piece count (ea): ${item.quantity}`);
          }
        }

        if (existing) {
          // ✅ FIX: รวมจำนวนเข้าด้วยกัน
          existing.csCount += csToAdd;
          existing.pieceCount += piecesToAdd;

          // ✅ เพิ่ม barcodeType เข้าไปใน Set
          existing.barcodeTypes.add(item.barcodeType || "ea");

          // ✅ อัปเดต materialCode ตามประเภทที่เพิ่มเข้ามา (ใช้ logic เดิม)
          if (itemType === "cs" && csToAdd > 0) {
            existing.csMaterialCode = item.materialCode;
          } else if (itemType === "dsp" && csToAdd > 0) {
            existing.dspMaterialCode = item.materialCode;
          } else if (itemType === "ea" && piecesToAdd > 0) {
            existing.eaMaterialCode = item.materialCode;
          }

          console.log(
            `  ↗️ Updated existing group: CS=${existing.csCount}, Pieces=${existing.pieceCount}`
          );
        } else {
          // ✅ FIX: สร้าง entry ใหม่
          groupedData.set(key, {
            materialCode: item.materialCode || "",
            productGroup: item.productGroup || "",
            thaiDescription: item.thaiDescription || item.productName,
            csCount: csToAdd,
            pieceCount: piecesToAdd,
            // ✅ เพิ่มข้อมูลสำหรับสินค้าใหม่
            isNewProduct: isNew,
            productName: isNew ? item.productName : undefined,
            productGroupFromForm: isNew ? item.productGroup : undefined, // ✅ เปลี่ยนจาก category เป็น productGroupFromForm
            description: isNew ? item.productData?.description : undefined,
            // ✅ เริ่มต้น Set ของ barcodeTypes
            barcodeTypes: new Set([item.barcodeType || "ea"]),
            // ✅ เก็บ materialCode ตามประเภท (ใช้ logic เดิม)
            csMaterialCode:
              itemType === "cs" && csToAdd > 0 ? item.materialCode : undefined,
            dspMaterialCode:
              itemType === "dsp" && csToAdd > 0 ? item.materialCode : undefined,
            eaMaterialCode:
              itemType === "ea" && piecesToAdd > 0
                ? item.materialCode
                : undefined,
          });
          console.log(
            `  ✅ Created new group: ${key} - CS=${csToAdd}, Pieces=${piecesToAdd}, isNew=${isNew}`
          );
        }
      });

      // ✅ FIX: เพิ่มข้อมูลแต่ละ row (รวมกันแล้ว) + ใช้ logic เดิมเลือก materialCode
      Array.from(groupedData.values()).forEach((group) => {
        let fgCode: string;
        let prodGroup: string;
        let description: string;

        if (group.isNewProduct) {
          // ✅ สำหรับสินค้าใหม่ ใช้ข้อมูลจากฟอร์ม - ใช้ productGroupFromForm ตรงๆ
          fgCode = group.productName || "NEW";
          prodGroup = group.productGroupFromForm || "NEW"; // ✅ ใช้ productGroupFromForm แทน category
          description = group.description || group.productName || "";

          console.log(
            `🆕 New product export: ${fgCode} - ${prodGroup} (from form)`
          );
        } else {
          // ✅ สำหรับสินค้าเดิม ใช้ logic เดิมไม่เปลี่ยนแปลง
          let displayMaterialCode = group.materialCode; // fallback

          if (group.csCount > 0 && group.csMaterialCode) {
            displayMaterialCode = group.csMaterialCode; // CS มีความสำคัญสูงสุด
          } else if (group.csCount > 0 && group.dspMaterialCode) {
            displayMaterialCode = group.dspMaterialCode; // DSP รองลงมา (ในกรณี DSP ไปใน CS column)
          } else if (group.pieceCount > 0 && group.eaMaterialCode) {
            displayMaterialCode = group.eaMaterialCode; // EA สำหรับชิ้น
          }

          fgCode = displayMaterialCode;
          prodGroup = group.productGroup; // ✅ ใช้ productGroup ตรงๆ จาก item

          // ✅ แสดง barcodeTypes ที่มีในกลุ่มนี้
          // const barcodeTypesArray = Array.from(group.barcodeTypes).sort();
          // description = `${group.thaiDescription} (${barcodeTypesArray
          //   .join(", ")
          //   .toUpperCase()})`;
          description = group.thaiDescription;

          console.log(
            `📦 Existing product export: ${fgCode} - ${prodGroup} (from CSV data)`
          );
        }

        // แสดง Material Code และข้อมูลที่ถูกต้อง
        console.log(
          `📝 Exporting row: ${fgCode} (${Array.from(group.barcodeTypes).join(
            ","
          )}) - CS:${group.csCount}, Pieces:${group.pieceCount}, isNew:${
            group.isNewProduct
          }, prodGroup:${prodGroup}` // ✅ เพิ่ม prodGroup ใน log
        );

        const row = [
          escapeCsvField(fgCode), // F/FG
          escapeCsvField(prodGroup), // Prod. Gr. - ✅ ตอนนี้จะได้ Product Group Code ที่ถูกต้องแล้ว
          escapeCsvField(description), // รายละเอียด
          group.csCount > 0 ? group.csCount.toString() : "",
          group.pieceCount > 0 ? group.pieceCount.toString() : "",
        ];

        csvRows.push(row.join(","));
      });

      console.log(`📊 Total export rows: ${groupedData.size}`);
      console.log(`📦 Total items processed: ${inventory.length}`);
      console.log(
        `📝 New products found: ${
          Array.from(groupedData.values()).filter((g) => g.isNewProduct).length
        }`
      );

      return csvRows.join("\n");
    },
    [inventory, employeeContext, escapeCsvField, isNewProduct]
  );

  // Generate filename
  const generateFileName = useCallback((): string => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS

    // ✅ เปลี่ยนรูปแบบชื่อไฟล์ใหม่
    let fileName = `FN_Stock_${dateStr}_${timeStr}`;

    if (employeeContext) {
      // ✅ ใส่ branchCode ไว้หน้า date/time
      fileName = `FN_Stock_${employeeContext.branchCode}_${dateStr}_${timeStr}`;
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
    isNewProduct, // ✅ Export helper function
  };
};
