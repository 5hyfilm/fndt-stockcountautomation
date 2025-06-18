// src/utils/unitConversionUtils.ts - FIXED VERSION
"use client";

/**
 * Unit Conversion Utilities - แก้ไขปัญหาการแปลงหน่วยอัตโนมัติ
 * Best Practice: เก็บข้อมูลตามที่ผู้ใช้กรอกจริง ไม่แปลงหน่วยโดยอัตโนมัติ
 */

export type UnitType = "cs" | "dsp" | "ea" | "fractional";

export interface DualUnitData {
  csCount: number;
  pieceCount: number;
  csUnitType: UnitType | null;
  pieceUnitType: UnitType;
}

export interface UnitDisplayInfo {
  type: UnitType;
  label: string;
  shortLabel: string;
  description: string;
}

// ✅ FIXED: Unit configuration - ชัดเจนไม่ให้เกิดความสับสน
export const UNIT_CONFIG: Record<UnitType, UnitDisplayInfo> = {
  cs: {
    type: "cs",
    label: "ลัง (Case/Carton)",
    shortLabel: "ลัง",
    description: "หน่วยลังหรือกล่องใหญ่",
  },
  dsp: {
    type: "dsp",
    label: "แพ็ค (Display Pack)",
    shortLabel: "แพ็ค",
    description: "หน่วยแพ็คสำหรับจัดแสดง",
  },
  ea: {
    type: "ea",
    label: "ชิ้น (Each)",
    shortLabel: "ชิ้น",
    description: "หน่วยผลิตภัณฑ์ต่อชิ้น",
  },
  fractional: {
    type: "fractional",
    label: "เศษ (ชิ้น)",
    shortLabel: "เศษ",
    description: "จำนวนเศษที่เหลือ",
  },
};

/**
 * ✅ FIXED: แสดงหน่วยตามที่กรอกจริง - ไม่แปลงอัตโนมัติ
 */
export const getUnitDisplayLabel = (
  unitType: UnitType | null | undefined
): string => {
  if (!unitType) return "หน่วย";
  return UNIT_CONFIG[unitType]?.shortLabel || "หน่วย";
};

/**
 * ✅ FIXED: สร้างข้อความแสดงผลหน่วยคู่ - แสดงตามที่กรอกจริง
 */
export const formatDualUnitDisplay = (data: DualUnitData): string => {
  const { csCount, pieceCount, csUnitType, pieceUnitType } = data;

  console.log("📊 formatDualUnitDisplay:", {
    csCount,
    pieceCount,
    csUnitType,
    pieceUnitType,
  });

  const csLabel = getUnitDisplayLabel(csUnitType);
  const pieceLabel = getUnitDisplayLabel(pieceUnitType);

  // ✅ FIXED: แสดงผลตามที่กรอกจริง ไม่แปลงหน่วย
  if (csCount > 0 && pieceCount > 0) {
    return `${csCount} ${csLabel} + ${pieceCount} ${pieceLabel}`;
  } else if (csCount > 0) {
    return `${csCount} ${csLabel}`;
  } else if (pieceCount > 0) {
    return `${pieceCount} ${pieceLabel}`;
  } else {
    return "0";
  }
};

/**
 * ✅ FIXED: การตรวจสอบความถูกต้องของข้อมูลหน่วย
 */
export const validateDualUnitInput = (
  primaryValue: number,
  secondaryValue: number,
  primaryUnitType: UnitType,
  secondaryUnitType: UnitType
): { isValid: boolean; error?: string } => {
  // ตรวจสอบค่าต้องไม่เป็นลบ
  if (primaryValue < 0) {
    return {
      isValid: false,
      error: `${getUnitDisplayLabel(primaryUnitType)} ต้องมีค่า 0 หรือมากกว่า`,
    };
  }

  if (secondaryValue < 0) {
    return {
      isValid: false,
      error: `${getUnitDisplayLabel(
        secondaryUnitType
      )} ต้องมีค่า 0 หรือมากกว่า`,
    };
  }

  // ต้องมีอย่างน้อย 1 หน่วย
  if (primaryValue === 0 && secondaryValue === 0) {
    return {
      isValid: false,
      error: "ต้องกรอกจำนวนอย่างน้อย 1 หน่วย",
    };
  }

  return { isValid: true };
};

/**
 * ✅ FIXED: คำนวณ totalEA สำหรับ compatibility เท่านั้น (ไม่ใช้ในการแปลงหน่วย)
 * หมายเหตุ: ใช้สำหรับการคำนวณเปรียบเทียบ รายงาน หรือ backward compatibility เท่านั้น
 */
export const calculateTotalEA = (
  data: DualUnitData,
  packSize: number = 12
): number => {
  const { csCount, pieceCount, csUnitType, pieceUnitType } = data;
  let totalEA = 0;

  // คำนวณจาก csCount
  if (csUnitType === "cs") {
    // 1 CS = 12 DSP * packSize EA
    totalEA += csCount * 12 * packSize;
  } else if (csUnitType === "dsp") {
    // 1 DSP = packSize EA
    totalEA += csCount * packSize;
  }

  // คำนวณจาก pieceCount
  if (pieceUnitType === "dsp") {
    totalEA += pieceCount * packSize; // DSP = packSize EA
  } else {
    totalEA += pieceCount; // EA or fractional = 1:1
  }

  return totalEA;
};

/**
 * ✅ FIXED: สร้างข้อมูลหน่วยคู่จากการกรอกของผู้ใช้
 */
export const createDualUnitData = (
  primaryValue: number,
  secondaryValue: number,
  primaryUnitType: UnitType,
  secondaryUnitType: UnitType
): DualUnitData => {
  // ✅ เก็บข้อมูลตามที่กรอกจริง ไม่แปลงหน่วย
  let csCount = 0;
  let pieceCount = 0;
  let csUnitType: UnitType | null = null;
  let pieceUnitType: UnitType = "ea";

  // Primary unit mapping
  if (primaryUnitType === "cs" || primaryUnitType === "dsp") {
    csCount = primaryValue;
    csUnitType = primaryUnitType;
  }

  // Secondary unit mapping
  pieceCount = secondaryValue;
  pieceUnitType = secondaryUnitType;

  return {
    csCount,
    pieceCount,
    csUnitType,
    pieceUnitType,
  };
};

/**
 * ✅ FIXED: เปรียบเทียบหน่วยสองแบบ
 */
export const compareDualUnits = (
  unit1: DualUnitData,
  unit2: DualUnitData,
  packSize: number = 12
): number => {
  const total1 = calculateTotalEA(unit1, packSize);
  const total2 = calculateTotalEA(unit2, packSize);
  return total1 - total2;
};

/**
 * ✅ FIXED: รวมหน่วยคู่สองชุด
 */
export const addDualUnits = (
  unit1: DualUnitData,
  unit2: DualUnitData
): DualUnitData => {
  // ✅ ตรวจสอบว่าหน่วยเข้ากันได้
  if (
    unit1.csUnitType !== unit2.csUnitType ||
    unit1.pieceUnitType !== unit2.pieceUnitType
  ) {
    console.warn("⚠️ Warning: Adding incompatible unit types");
  }

  return {
    csCount: unit1.csCount + unit2.csCount,
    pieceCount: unit1.pieceCount + unit2.pieceCount,
    csUnitType: unit1.csUnitType || unit2.csUnitType,
    pieceUnitType: unit1.pieceUnitType,
  };
};

/**
 * ✅ FIXED: ตรวจสอบว่าข้อมูลหน่วยคู่ว่างเปล่าหรือไม่
 */
export const isDualUnitEmpty = (data: DualUnitData): boolean => {
  return data.csCount === 0 && data.pieceCount === 0;
};

/**
 * ✅ FIXED: สร้างข้อความอธิบายการแสดงผล
 */
export const createDisplayDescription = (
  primaryUnitType: UnitType,
  secondaryUnitType: UnitType
): string => {
  const primaryLabel = getUnitDisplayLabel(primaryUnitType);
  const secondaryLabel = getUnitDisplayLabel(secondaryUnitType);

  return `กรอก ${primaryLabel} และ ${secondaryLabel} (หากมี)`;
};

/**
 * ✅ FIXED: Export ทั้งหมดสำหรับใช้งาน
 */
export { type UnitType, type DualUnitData, type UnitDisplayInfo };

// ✅ Example usage:
/*
// ตัวอย่างการใช้งานที่ถูกต้อง:

// 1. สร้างข้อมูลจากการกรอก: 5 แพ็ค + 1 ชิ้น
const userInput = createDualUnitData(5, 1, "dsp", "ea");
console.log(userInput);
// Output: { csCount: 5, pieceCount: 1, csUnitType: "dsp", pieceUnitType: "ea" }

// 2. แสดงผล: จะแสดง "5 แพ็ค + 1 ชิ้น" ตามที่กรอกจริง
const display = formatDualUnitDisplay(userInput);
console.log(display);
// Output: "5 แพ็ค + 1 ชิ้น"

// 3. คำนวณ totalEA เฉพาะเมื่อจำเป็น (เช่น รายงาน)
const totalEA = calculateTotalEA(userInput, 12);
console.log(`Total EA: ${totalEA}`); // ใช้เฉพาะเมื่อจำเป็น

// ❌ ไม่ทำ: ไม่แปลงหน่วยอัตโนมัติ
// ❌ const converted = convertToSingleUnit(userInput); // ห้าม!

// ✅ ทำ: เก็บและแสดงผลตามที่ผู้ใช้กรอก
*/
