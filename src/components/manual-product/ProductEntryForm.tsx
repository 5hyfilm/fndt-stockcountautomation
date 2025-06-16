// src/components/manual-product/ProductEntryForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Barcode,
  FileText,
  Globe,
  Tag,
  Calendar,
  AlertCircle,
  Check,
  X,
  Save,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";

// ===== INTERFACES =====
interface ProductEntryFormData {
  scannedBarcode: string;
  barcodeType: "ea" | "dsp" | "cs";
  materialCode: string;
  description: string;
  thaiDescription: string;
  packSize: string;
  productGroup: string;
  shelfLife?: string;
}

interface ProductEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  scannedBarcode: string;
  onSubmit: (formData: ProductEntryFormData) => Promise<boolean>;
  onPreview?: (formData: ProductEntryFormData) => void;
  suggestions?: {
    productGroups: string[];
    materialCodes: string[];
    packSizes: string[];
  };
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
}

interface ValidationErrors {
  materialCode?: string;
  description?: string;
  thaiDescription?: string;
  packSize?: string;
  productGroup?: string;
  barcodeType?: string;
}

// ===== VALIDATION RULES =====
const VALIDATION_RULES = {
  materialCode: {
    pattern: /^[A-Z0-9]{3,10}$/,
    message: "รหัสสินค้าต้องเป็นตัวอักษรและตัวเลข 3-10 ตัวอักษร",
  },
  description: {
    minLength: 3,
    maxLength: 100,
    message: "รายละเอียดต้องมีความยาว 3-100 ตัวอักษร",
  },
  thaiDescription: {
    minLength: 3,
    maxLength: 100,
    message: "รายละเอียดภาษาไทยต้องมีความยาว 3-100 ตัวอักษร",
  },
  packSize: {
    pattern: /^[\d\w\s\(\)\-\/]+$/,
    message: "รูปแบบขนาดแพ็คไม่ถูกต้อง (เช่น 12x250ml, 24 ชิ้น)",
  },
};

// ===== SUGGESTIONS DATA =====
const DEFAULT_PRODUCT_GROUPS = [
  "STM",
  "BB Gold",
  "EVAP",
  "SBC",
  "SCM",
  "Magnolia UHT",
  "NUTRISOY",
  "Gummy",
];

const BARCODE_TYPE_OPTIONS = [
  { value: "ea", label: "EA (Each - ชิ้น)", description: "สินค้าหน่วยเดี่ยว" },
  {
    value: "dsp",
    label: "DSP (Display Pack - แพ็ค)",
    description: "แพ็คแสดงสินค้า",
  },
  { value: "cs", label: "CS (Case/Carton - ลัง)", description: "ลัง/คาร์ตัน" },
];

const PACK_SIZE_EXAMPLES = [
  "12x250ml",
  "24 ชิ้น",
  "6x330ml",
  "12(4x150ml)",
  "48 ซอง",
  "1kg",
  "500g",
  "1L",
];

// ===== SUB-COMPONENTS =====
const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  children,
  description,
  icon,
}) => (
  <div className="space-y-2">
    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
      {icon}
      <span>{label}</span>
      {required && <span className="text-red-500">*</span>}
    </label>
    {description && <p className="text-xs text-gray-500">{description}</p>}
    {children}
    {error && (
      <p className="flex items-center space-x-1 text-xs text-red-600">
        <AlertCircle className="w-3 h-3" />
        <span>{error}</span>
      </p>
    )}
  </div>
);

const SuggestionChips: React.FC<{
  suggestions: string[];
  onSelect: (value: string) => void;
  currentValue: string;
}> = ({ suggestions, onSelect, currentValue }) => (
  <div className="flex flex-wrap gap-1 mt-1">
    {suggestions.slice(0, 5).map((suggestion) => (
      <button
        key={suggestion}
        type="button"
        onClick={() => onSelect(suggestion)}
        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
          currentValue === suggestion
            ? "bg-blue-100 border-blue-300 text-blue-700"
            : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {suggestion}
      </button>
    ))}
  </div>
);

// ===== MAIN COMPONENT =====
const ProductEntryForm: React.FC<ProductEntryFormProps> = ({
  isOpen,
  onClose,
  onBack,
  scannedBarcode,
  onSubmit,
  onPreview,
  suggestions,
}) => {
  // Form State
  const [formData, setFormData] = useState<ProductEntryFormData>({
    scannedBarcode,
    barcodeType: "ea",
    materialCode: "",
    description: "",
    thaiDescription: "",
    packSize: "",
    productGroup: "",
    shelfLife: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState({
    productGroup: false,
    packSize: false,
  });

  // Validation Function
  const validateField = (
    field: keyof ProductEntryFormData,
    value: string
  ): string | undefined => {
    switch (field) {
      case "materialCode":
        if (!value.trim()) return "กรุณาระบุรหัสสินค้า";
        if (!VALIDATION_RULES.materialCode.pattern.test(value)) {
          return VALIDATION_RULES.materialCode.message;
        }
        break;

      case "description":
        if (!value.trim()) return "กรุณาระบุรายละเอียดสินค้า";
        if (
          value.length < VALIDATION_RULES.description.minLength ||
          value.length > VALIDATION_RULES.description.maxLength
        ) {
          return VALIDATION_RULES.description.message;
        }
        break;

      case "thaiDescription":
        if (!value.trim()) return "กรุณาระบุรายละเอียดภาษาไทย";
        if (
          value.length < VALIDATION_RULES.thaiDescription.minLength ||
          value.length > VALIDATION_RULES.thaiDescription.maxLength
        ) {
          return VALIDATION_RULES.thaiDescription.message;
        }
        break;

      case "packSize":
        if (!value.trim()) return "กรุณาระบุขนาดแพ็ค";
        if (!VALIDATION_RULES.packSize.pattern.test(value)) {
          return VALIDATION_RULES.packSize.message;
        }
        break;

      case "productGroup":
        if (!value.trim()) return "กรุณาเลือกกลุ่มสินค้า";
        break;

      case "barcodeType":
        if (!["ea", "dsp", "cs"].includes(value)) {
          return "กรุณาเลือกประเภท barcode";
        }
        break;
    }
    return undefined;
  };

  // Validate All Fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    (Object.keys(formData) as Array<keyof ProductEntryFormData>).forEach(
      (field) => {
        if (field !== "shelfLife" && field !== "scannedBarcode") {
          const error = validateField(field, formData[field] as string);
          if (error) {
            newErrors[field as keyof ValidationErrors] = error;
          }
        }
      }
    );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Input Change
  const handleInputChange = (
    field: keyof ProductEntryFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmit(formData);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Preview
  const handlePreview = () => {
    if (validateForm() && onPreview) {
      onPreview(formData);
    }
  };

  // Auto-fill suggestions based on barcode pattern
  useEffect(() => {
    // Simple barcode type detection logic
    if (scannedBarcode.length === 13 && scannedBarcode.startsWith("8")) {
      setFormData((prev) => ({ ...prev, barcodeType: "ea" }));
    }
  }, [scannedBarcode]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="กลับ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  เพิ่มสินค้าใหม่
                </h3>
                <p className="text-sm text-gray-500">
                  กรอกข้อมูลสินค้าที่ไม่พบในระบบ
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="ปิด"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="max-h-[calc(95vh-200px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Scanned Barcode Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Barcode className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Barcode ที่สแกนได้
                  </p>
                  <p className="text-lg font-mono text-blue-700">
                    {scannedBarcode}
                  </p>
                </div>
              </div>
            </div>

            {/* Barcode Type Selection */}
            <FormField
              label="ประเภท Barcode"
              required
              error={errors.barcodeType}
              icon={<Tag className="w-4 h-4" />}
              description="เลือกประเภทของ barcode ที่สแกนได้"
            >
              <div className="grid grid-cols-1 gap-3">
                {BARCODE_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.barcodeType === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="barcodeType"
                      value={option.value}
                      checked={formData.barcodeType === option.value}
                      onChange={(e) =>
                        handleInputChange("barcodeType", e.target.value)
                      }
                      className="text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </FormField>

            {/* Material Code */}
            <FormField
              label="รหัสสินค้า (Material Code)"
              required
              error={errors.materialCode}
              icon={<FileText className="w-4 h-4" />}
              description="รหัสสินค้าในระบบ (เช่น F123, FG456)"
            >
              <input
                type="text"
                value={formData.materialCode}
                onChange={(e) =>
                  handleInputChange(
                    "materialCode",
                    e.target.value.toUpperCase()
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.materialCode ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="F123456"
                maxLength={10}
              />
            </FormField>

            {/* Description (English) */}
            <FormField
              label="รายละเอียดสินค้า (English)"
              required
              error={errors.description}
              icon={<Globe className="w-4 h-4" />}
            >
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Bear Brand Sterilized Milk"
                maxLength={100}
              />
            </FormField>

            {/* Thai Description */}
            <FormField
              label="รายละเอียดสินค้า (ภาษาไทย)"
              required
              error={errors.thaiDescription}
              icon={<FileText className="w-4 h-4" />}
            >
              <input
                type="text"
                value={formData.thaiDescription}
                onChange={(e) =>
                  handleInputChange("thaiDescription", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.thaiDescription ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="นมสเตอริไลซ์ แบรนด์ แบร์"
                maxLength={100}
              />
            </FormField>

            {/* Pack Size */}
            <FormField
              label="ขนาดแพ็ค (Pack Size)"
              required
              error={errors.packSize}
              icon={<Package className="w-4 h-4" />}
              description="ระบุขนาดหรือจำนวนในแพ็ค"
            >
              <input
                type="text"
                value={formData.packSize}
                onChange={(e) => handleInputChange("packSize", e.target.value)}
                onFocus={() =>
                  setShowSuggestions((prev) => ({ ...prev, packSize: true }))
                }
                onBlur={() =>
                  setTimeout(
                    () =>
                      setShowSuggestions((prev) => ({
                        ...prev,
                        packSize: false,
                      })),
                    150
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.packSize ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="12x250ml"
              />
              {showSuggestions.packSize && (
                <SuggestionChips
                  suggestions={PACK_SIZE_EXAMPLES}
                  onSelect={(value) => handleInputChange("packSize", value)}
                  currentValue={formData.packSize}
                />
              )}
            </FormField>

            {/* Product Group */}
            <FormField
              label="กลุ่มสินค้า (Product Group)"
              required
              error={errors.productGroup}
              icon={<Tag className="w-4 h-4" />}
            >
              <input
                type="text"
                value={formData.productGroup}
                onChange={(e) =>
                  handleInputChange("productGroup", e.target.value)
                }
                onFocus={() =>
                  setShowSuggestions((prev) => ({
                    ...prev,
                    productGroup: true,
                  }))
                }
                onBlur={() =>
                  setTimeout(
                    () =>
                      setShowSuggestions((prev) => ({
                        ...prev,
                        productGroup: false,
                      })),
                    150
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.productGroup ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="STM"
              />
              {showSuggestions.productGroup && (
                <SuggestionChips
                  suggestions={
                    suggestions?.productGroups || DEFAULT_PRODUCT_GROUPS
                  }
                  onSelect={(value) => handleInputChange("productGroup", value)}
                  currentValue={formData.productGroup}
                />
              )}
            </FormField>

            {/* Shelf Life (Optional) */}
            <FormField
              label="อายุการเก็บรักษา (เดือน)"
              icon={<Calendar className="w-4 h-4" />}
              description="ระบุจำนวนเดือน (ไม่บังคับ)"
            >
              <input
                type="number"
                value={formData.shelfLife}
                onChange={(e) => handleInputChange("shelfLife", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="12"
                min="1"
                max="60"
              />
            </FormField>

            {/* Help Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    💡 เคล็ดลับการกรอกข้อมูล
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li>
                      • รหัสสินค้าควรขึ้นต้นด้วย F (Finished Goods) หรือ FG
                    </li>
                    <li>• ขนาดแพ็คใส่ตามรูปแบบ: 12x250ml, 24 ชิ้น, 1kg</li>
                    <li>• กลุ่มสินค้าเลือกจากรายการที่แนะนำ หรือพิมพ์ใหม่</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            ยกเลิก
          </button>

          {onPreview && (
            <button
              type="button"
              onClick={handlePreview}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
              disabled={isSubmitting}
            >
              ดูตัวอย่าง
            </button>
          )}

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึกสินค้า"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductEntryForm;

// ===== EXPORT TYPES =====
export type { ProductEntryFormProps, ProductEntryFormData, ValidationErrors };
