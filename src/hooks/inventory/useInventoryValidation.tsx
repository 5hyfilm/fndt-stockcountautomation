// src/hooks/inventory/useInventoryValidation.tsx - Phase 2: Enhanced Validation Rules
"use client";

import { useCallback, useMemo } from "react";
import {
  InventoryItem,
  QuantityDetail,
  QuantityInput,
  isQuantityDetail,
  isSimpleQuantity,
} from "./types";
import { Product } from "../../types/product";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface QuantityValidationRules {
  // Basic quantity rules
  minQuantity: number;
  maxQuantity: number;

  // Major unit rules (DSP/CS)
  minMajorQuantity: number;
  maxMajorQuantity: number;

  // Remainder rules (EA)
  minRemainder: number;
  maxRemainder: number;

  // Business rules
  allowZeroMajor: boolean;
  allowZeroRemainder: boolean;
  requireRemainderForPackTypes: boolean;

  // Pack size validation
  validatePackRatio: boolean;
  maxRemainderPerPack?: number; // e.g., if 1 pack = 12 items, remainder should be < 12
}

const DEFAULT_VALIDATION_RULES: QuantityValidationRules = {
  minQuantity: 0,
  maxQuantity: 99999,
  minMajorQuantity: 0,
  maxMajorQuantity: 9999,
  minRemainder: 0,
  maxRemainder: 999,
  allowZeroMajor: true,
  allowZeroRemainder: true,
  requireRemainderForPackTypes: false,
  validatePackRatio: false,
};

export const useInventoryValidation = (
  customRules: Partial<QuantityValidationRules> = {}
) => {
  // ✅ แก้ไข: ใช้ useMemo เพื่อ memoize rules object
  const rules = useMemo(() => {
    return { ...DEFAULT_VALIDATION_RULES, ...customRules };
  }, [customRules]);

  // ✅ Validate basic product data
  const validateProduct = useCallback((product: Product): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields validation
    if (!product.name || product.name.trim() === "") {
      errors.push("ชื่อสินค้าเป็นข้อมูลที่จำเป็น");
    }

    if (!product.barcode || product.barcode.trim() === "") {
      errors.push("บาร์โค้ดเป็นข้อมูลที่จำเป็น");
    }

    // Brand validation
    if (!product.brand || product.brand.trim() === "") {
      warnings.push("ไม่พบข้อมูลแบรนด์");
      suggestions.push("ควรระบุแบรนด์เพื่อความถูกต้องของข้อมูล");
    }

    // Category validation
    if (!product.category || product.category.trim() === "") {
      warnings.push("ไม่พบข้อมูลหมวดหมู่");
      suggestions.push("ควรระบุหมวดหมู่เพื่อการจัดกลุ่มที่ดี");
    }

    // Barcode format validation
    if (product.barcode && !/^\d+$/.test(product.barcode)) {
      warnings.push("บาร์โค้ดควรเป็นตัวเลขเท่านั้น");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }, []);

  // ✅ Validate simple quantity (EA) - ตอนนี้ใช้ stable rules dependency
  const validateSimpleQuantity = useCallback(
    (quantity: number): ValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      if (quantity < rules.minQuantity) {
        errors.push(`จำนวนต้องไม่น้อยกว่า ${rules.minQuantity}`);
      }

      if (quantity > rules.maxQuantity) {
        errors.push(`จำนวนต้องไม่เกิน ${rules.maxQuantity}`);
      }

      if (quantity === 0) {
        warnings.push("จำนวนเป็น 0 อาจไม่ใช่การเพิ่มสินค้าปกติ");
        suggestions.push("ตรวจสอบว่าต้องการเพิ่มจำนวน 0 จริงหรือไม่");
      }

      if (quantity > 1000) {
        warnings.push("จำนวนสูงมาก กรุณาตรวจสอบความถูกต้อง");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };
    },
    [rules]
  );

  // ✅ Validate quantity detail (DSP/CS) - ตอนนี้ใช้ stable rules dependency
  const validateQuantityDetail = useCallback(
    (quantityDetail: QuantityDetail, product?: Product): ValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      const { major, remainder, scannedType } = quantityDetail;

      // Basic range validation
      if (major < rules.minMajorQuantity) {
        errors.push(
          `จำนวน${scannedType.toUpperCase()}ต้องไม่น้อยกว่า ${
            rules.minMajorQuantity
          }`
        );
      }

      if (major > rules.maxMajorQuantity) {
        errors.push(
          `จำนวน${scannedType.toUpperCase()}ต้องไม่เกิน ${
            rules.maxMajorQuantity
          }`
        );
      }

      if (remainder < rules.minRemainder) {
        errors.push(`จำนวนเศษต้องไม่น้อยกว่า ${rules.minRemainder}`);
      }

      if (remainder > rules.maxRemainder) {
        errors.push(`จำนวนเศษต้องไม่เกิน ${rules.maxRemainder}`);
      }

      // Business logic validation
      if (!rules.allowZeroMajor && major === 0) {
        errors.push(`จำนวน${scannedType.toUpperCase()}ต้องมากกว่า 0`);
      }

      if (
        !rules.allowZeroRemainder &&
        remainder === 0 &&
        rules.requireRemainderForPackTypes
      ) {
        warnings.push("ไม่มีจำนวนเศษ ตรวจสอบว่าถูกต้องหรือไม่");
      }

      // Total quantity validation
      if (major === 0 && remainder === 0) {
        errors.push("จำนวนรวมต้องมากกว่า 0");
      }

      // Pack ratio validation (if enabled and pack size data available)
      if (rules.validatePackRatio && rules.maxRemainderPerPack && product) {
        // This would require pack size data from the product
        // For now, we'll use a general warning
        if (remainder > (rules.maxRemainderPerPack || 50)) {
          warnings.push(
            `จำนวนเศษ ${remainder} ดูเหมือนสูงกว่าปกติสำหรับ ${scannedType}`
          );
          suggestions.push("ตรวจสอบว่าควรเพิ่มจำนวนหลักแทน");
        }
      }

      // Type-specific validations
      if (scannedType === "cs" && major > 100) {
        warnings.push("จำนวนลังสูงมาก กรุณาตรวจสอบความถูกต้อง");
      }

      if (scannedType === "dsp" && major > 500) {
        warnings.push("จำนวนแพ็คสูงมาก กรุณาตรวจสอบความถูกต้อง");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };
    },
    [rules]
  );

  // ✅ Validate quantity input (unified validation)
  const validateQuantityInput = useCallback(
    (
      quantityInput: QuantityInput,
      barcodeType: "ea" | "dsp" | "cs" = "ea",
      product?: Product
    ): ValidationResult => {
      if (isSimpleQuantity(quantityInput)) {
        // Simple quantity validation
        const result = validateSimpleQuantity(quantityInput);

        // Additional checks for non-EA types with simple quantity
        if (barcodeType !== "ea" && quantityInput > 0) {
          result.warnings.push(
            `สแกนจาก ${barcodeType.toUpperCase()} แต่ใช้จำนวนแบบง่าย - พิจารณาใช้จำนวนแบบรายละเอียด`
          );
          result.suggestions.push("ลองใช้การกรอกจำนวนแบบแยกหลักและเศษ");
        }

        return result;
      }

      if (isQuantityDetail(quantityInput)) {
        // Quantity detail validation
        const result = validateQuantityDetail(quantityInput, product);

        // Check consistency between scanned type and barcode type
        if (quantityInput.scannedType !== barcodeType) {
          result.warnings.push(
            `ประเภทที่สแกน (${quantityInput.scannedType}) ไม่ตรงกับประเภทบาร์โค้ด (${barcodeType})`
          );
        }

        return result;
      }

      // Invalid input type
      return {
        isValid: false,
        errors: ["รูปแบบข้อมูลจำนวนไม่ถูกต้อง"],
        warnings: [],
        suggestions: [
          "กรุณาระบุจำนวนเป็นตัวเลข หรือข้อมูลรายละเอียดที่ถูกต้อง",
        ],
      };
    },
    [validateSimpleQuantity, validateQuantityDetail]
  );

  // ✅ Validate inventory item duplication
  const validateDuplication = useCallback(
    (
      product: Product,
      barcodeType: "ea" | "dsp" | "cs",
      existingInventory: InventoryItem[]
    ): ValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Check for exact duplicate (same barcode + same type)
      const exactDuplicate = existingInventory.find(
        (item) =>
          item.barcode === product.barcode && item.barcodeType === barcodeType
      );

      if (exactDuplicate) {
        warnings.push("พบสินค้าประเภทเดียวกันในระบบแล้ว");
        suggestions.push("จำนวนจะถูกรวมเข้ากับข้อมูลเดิม");
      }

      // Check for same product with different barcode types
      const sameProductDifferentType = existingInventory.filter(
        (item) =>
          item.barcode === product.barcode && item.barcodeType !== barcodeType
      );

      if (sameProductDifferentType.length > 0) {
        const otherTypes = sameProductDifferentType
          .map((item) => item.barcodeType)
          .join(", ");
        warnings.push(`พบสินค้าเดียวกันในประเภทอื่น: ${otherTypes}`);
        suggestions.push("ตรวจสอบว่าต้องการเพิ่มในประเภทนี้จริงหรือไม่");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };
    },
    []
  );

  // ✅ Comprehensive validation for adding inventory
  const validateAddInventory = useCallback(
    (
      product: Product,
      quantityInput: QuantityInput,
      barcodeType: "ea" | "dsp" | "cs" = "ea",
      existingInventory: InventoryItem[] = []
    ): ValidationResult => {
      const allErrors: string[] = [];
      const allWarnings: string[] = [];
      const allSuggestions: string[] = [];

      // Validate product data
      const productValidation = validateProduct(product);
      allErrors.push(...productValidation.errors);
      allWarnings.push(...productValidation.warnings);
      allSuggestions.push(...productValidation.suggestions);

      // Validate quantity input
      const quantityValidation = validateQuantityInput(
        quantityInput,
        barcodeType,
        product
      );
      allErrors.push(...quantityValidation.errors);
      allWarnings.push(...quantityValidation.warnings);
      allSuggestions.push(...quantityValidation.suggestions);

      // Validate duplication
      const duplicationValidation = validateDuplication(
        product,
        barcodeType,
        existingInventory
      );
      allErrors.push(...duplicationValidation.errors);
      allWarnings.push(...duplicationValidation.warnings);
      allSuggestions.push(...duplicationValidation.suggestions);

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
        suggestions: allSuggestions,
      };
    },
    [validateProduct, validateQuantityInput, validateDuplication]
  );

  return {
    // Individual validation functions
    validateProduct,
    validateSimpleQuantity,
    validateQuantityDetail,
    validateQuantityInput,
    validateDuplication,

    // Comprehensive validation
    validateAddInventory,

    // Configuration
    rules,
  };
};
