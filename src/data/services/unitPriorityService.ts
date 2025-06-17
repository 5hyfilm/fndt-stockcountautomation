// src/data/services/unitPriorityService.ts - Complete Implementation
import { ProductWithMultipleBarcodes } from "../types/csvTypes";

// ประเภทหน่วยตามลำดับ priority
export type UnitType = "cs" | "dsp" | "ea";

// ข้อมูลหน่วยสำหรับแสดงผล
export interface UnitDisplayInfo {
  type: UnitType;
  label: string;
  shortLabel: string;
  description: string;
  column: "cs" | "piece"; // column ที่จะบันทึกใน database
}

// ข้อมูลสำหรับฟอร์มกรอกข้อมูล
export interface DualUnitInput {
  primaryUnit: UnitDisplayInfo;
  secondaryUnit: UnitDisplayInfo;
  allowFractional: boolean; // ให้กรอก "เศษ" ได้หรือไม่
}

// Configuration ของหน่วยต่างๆ
const UNIT_CONFIG: Record<UnitType, UnitDisplayInfo> = {
  cs: {
    type: "cs",
    label: "ลัง (Case/Carton)",
    shortLabel: "ลัง",
    description: "หน่วยลังหรือกล่องใหญ่",
    column: "cs",
  },
  dsp: {
    type: "dsp",
    label: "แพ็ค (Display Pack)",
    shortLabel: "แพ็ค",
    description: "หน่วยแพ็คสำหรับจัดแสดง",
    column: "cs", // DSP จะบันทึกใน column cs
  },
  ea: {
    type: "ea",
    label: "ชิ้น (Each)",
    shortLabel: "ชิ้น",
    description: "หน่วยผลิตภัณฑ์ต่อชิ้น",
    column: "piece",
  },
};

// หน่วย "เศษ" สำหรับกรณีไม่มีหน่วยถัดไป
const FRACTIONAL_UNIT: UnitDisplayInfo = {
  type: "ea",
  label: "เศษ (ชิ้น)",
  shortLabel: "เศษ",
  description: "จำนวนเศษที่เหลือ",
  column: "piece",
};

// ลำดับ priority การหาหน่วยถัดไป
const UNIT_PRIORITY: UnitType[] = ["cs", "dsp", "ea"];

/**
 * หาหน่วยที่มีอยู่ในสินค้า
 */
export const getAvailableUnits = (
  product: ProductWithMultipleBarcodes
): UnitType[] => {
  const availableUnits: UnitType[] = [];

  if (product.barcodes.cs) availableUnits.push("cs");
  if (product.barcodes.dsp) availableUnits.push("dsp");
  if (product.barcodes.ea) availableUnits.push("ea");

  return availableUnits;
};

/**
 * หาหน่วยถัดไปตาม priority: CS → DSP → EA
 */
export const getNextAvailableUnit = (
  currentUnit: UnitType,
  availableUnits: UnitType[]
): UnitType | null => {
  const currentIndex = UNIT_PRIORITY.indexOf(currentUnit);

  // หาหน่วยถัดไปที่มีอยู่
  for (let i = currentIndex + 1; i < UNIT_PRIORITY.length; i++) {
    const nextUnit = UNIT_PRIORITY[i];
    if (availableUnits.includes(nextUnit)) {
      return nextUnit;
    }
  }

  return null; // ไม่มีหน่วยถัดไป
};

/**
 * สร้างข้อมูลสำหรับฟอร์มกรอกข้อมูล
 *
 * ตาม Logic ที่ต้องการ:
 * - ถ้ามี CS + DSP → แสดงให้กรอก CS และ DSP
 * - ถ้ามี CS + EA (ไม่มี DSP) → แสดงให้กรอก CS และ EA
 * - ถ้ามีแค่ CS → แสดงให้กรอก CS และ "เศษ"
 * - ถ้ามี DSP + EA → แสดงให้กรอก DSP และ EA
 * - ถ้ามีแค่ DSP → แสดงให้กรอก DSP และ "เศษ"
 * - ถ้ามีแค่ EA → แสดงให้กรอก EA อย่างเดียว
 */
export const createDualUnitInput = (
  scannedUnit: UnitType,
  product: ProductWithMultipleBarcodes
): DualUnitInput => {
  const availableUnits = getAvailableUnits(product);
  const nextUnit = getNextAvailableUnit(scannedUnit, availableUnits);

  const primaryUnit = UNIT_CONFIG[scannedUnit];

  let secondaryUnit: UnitDisplayInfo;
  let allowFractional = false;

  if (nextUnit) {
    // มีหน่วยถัดไป → ใช้หน่วยนั้น
    secondaryUnit = UNIT_CONFIG[nextUnit];
    console.log(`✅ Found next unit: ${scannedUnit} → ${nextUnit}`);
  } else {
    // ไม่มีหน่วยถัดไป → ให้กรอก "เศษ"
    secondaryUnit = FRACTIONAL_UNIT;
    allowFractional = true;
    console.log(`⚠️ No next unit found for ${scannedUnit}, using fractional`);
  }

  console.log(`📋 Dual Unit Config Created:`, {
    scannedUnit,
    availableUnits,
    primaryUnit: primaryUnit.shortLabel,
    secondaryUnit: secondaryUnit.shortLabel,
    allowFractional,
  });

  return {
    primaryUnit,
    secondaryUnit,
    allowFractional,
  };
};

/**
 * ตรวจสอบว่าเป็นการสแกน EA หรือไม่ (กรอกหน่วยเดียว)
 */
export const isSingleUnitInput = (scannedUnit: UnitType): boolean => {
  return scannedUnit === "ea";
};

/**
 * Get unit display info
 */
export const getUnitDisplayInfo = (unitType: UnitType): UnitDisplayInfo => {
  return UNIT_CONFIG[unitType];
};

/**
 * Get fractional unit info
 */
export const getFractionalUnitInfo = (): UnitDisplayInfo => {
  return FRACTIONAL_UNIT;
};

/**
 * สร้างข้อความอธิบายสำหรับแสดงผล
 */
export const createInputDescription = (dualUnit: DualUnitInput): string => {
  const { primaryUnit, secondaryUnit, allowFractional } = dualUnit;

  if (allowFractional) {
    return `กรอก ${primaryUnit.shortLabel} และ ${secondaryUnit.shortLabel} (หากมี)`;
  }

  return `กรอก ${primaryUnit.shortLabel} และ ${secondaryUnit.shortLabel}`;
};

/**
 * Validate input values
 */
export const validateDualUnitInput = (
  primaryValue: number,
  secondaryValue: number,
  dualUnit: DualUnitInput
): { isValid: boolean; error?: string } => {
  // Primary unit ต้องมีค่า >= 0
  if (primaryValue < 0) {
    return {
      isValid: false,
      error: `${dualUnit.primaryUnit.shortLabel} ต้องมีค่า 0 หรือมากกว่า`,
    };
  }

  // Secondary unit ต้องมีค่า >= 0
  if (secondaryValue < 0) {
    return {
      isValid: false,
      error: `${dualUnit.secondaryUnit.shortLabel} ต้องมีค่า 0 หรือมากกว่า`,
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
 * ตรวจสอบว่าสินค้ามีหน่วยไหนบ้าง และควรแสดงฟอร์มแบบไหน
 */
export const analyzeProductUnits = (
  product: ProductWithMultipleBarcodes
): {
  hasCS: boolean;
  hasDSP: boolean;
  hasEA: boolean;
  availableUnits: UnitType[];
  recommendedInputType: "single" | "dual";
} => {
  const hasCS = !!product.barcodes.cs;
  const hasDSP = !!product.barcodes.dsp;
  const hasEA = !!product.barcodes.ea;
  const availableUnits = getAvailableUnits(product);

  // ถ้ามีแค่ EA → single input
  const recommendedInputType =
    availableUnits.length === 1 && hasEA ? "single" : "dual";

  return {
    hasCS,
    hasDSP,
    hasEA,
    availableUnits,
    recommendedInputType,
  };
};

/**
 * สร้างข้อความอธิบายการทำงานของระบบ
 */
export const getInputModeDescription = (
  scannedUnit: UnitType,
  product: ProductWithMultipleBarcodes
): string => {
  const analysis = analyzeProductUnits(product);

  if (scannedUnit === "ea") {
    return "สแกน EA: กรอกจำนวนชิ้นที่ต้องการ";
  }

  if (scannedUnit === "cs") {
    if (analysis.hasDSP) {
      return "สแกน CS: กรอกจำนวนลัง + แพ็ค";
    } else if (analysis.hasEA) {
      return "สแกน CS: กรอกจำนวนลัง + ชิ้น";
    } else {
      return "สแกน CS: กรอกจำนวนลัง + เศษ";
    }
  }

  if (scannedUnit === "dsp") {
    if (analysis.hasEA) {
      return "สแกน DSP: กรอกจำนวนแพ็ค + ชิ้น";
    } else {
      return "สแกน DSP: กรอกจำนวนแพ็ค + เศษ";
    }
  }

  return "กรอกจำนวนตามหน่วยที่สแกน";
};
