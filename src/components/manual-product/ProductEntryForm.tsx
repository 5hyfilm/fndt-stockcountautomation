// src/components/manual-product/ProductEntryForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Barcode,
  FileText,
  Globe,
  Tag,
  Save,
  X,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

// ===== INTERFACES =====
export interface ProductEntryFormData {
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

// ===== CONSTANTS =====
const VALIDATION_RULES = {
  materialCode: {
    pattern: /^[A-Z]{1,2}[0-9]{4,8}$/,
    message: "รหัสสินค้าต้องเป็นตัวอักษร 1-2 ตัว ตามด้วยตัวเลข 4-8 ตัว",
  },
  description: {
    minLength: 3,
    maxLength: 100,
    message: "รายละเอียดต้องมี 3-100 ตัวอักษร",
  },
  thaiDescription: {
    minLength: 3,
    maxLength: 100,
    message: "รายละเอียดภาษาไทยต้องมี 3-100 ตัวอักษร",
  },
  packSize: {
    pattern: /^[\d\w\s\-\.]+$/,
    message: "ขนาดแพ็คไม่ถูกต้อง (เช่น 250ml, 500g, 24x250ml)",
  },
};

const PRODUCT_GROUPS = [
  "STM",
  "BB Gold",
  "EVAP",
  "SBC",
  "SCM",
  "Magnolia UHT",
  "NUTRISOY",
  "Gummy",
];

const PACK_SIZES = [
  "250ml",
  "500ml",
  "1L",
  "24x250ml",
  "12x500ml",
  "6x1L",
  "500g",
  "1kg",
];

// ===== SUB-COMPONENTS =====
const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  description,
  icon,
}) => (
  <div className="space-y-1">
    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
      {icon}
      <span>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
    </label>
    {description && <p className="text-xs text-gray-500">{description}</p>}
    {children}
    {error && (
      <div className="flex items-center space-x-1 text-xs text-red-600">
        <AlertCircle className="w-3 h-3" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

const SuggestionsList: React.FC<{
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  selectedValue: string;
}> = ({ suggestions, onSelect, selectedValue }) => (
  <div className="flex flex-wrap gap-1 mt-1">
    {suggestions.map((suggestion) => (
      <button
        key={suggestion}
        type="button"
        onClick={() => onSelect(suggestion)}
        className={`px-2 py-1 text-xs rounded border transition-colors ${
          selectedValue === suggestion
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
  suggestions = {
    productGroups: PRODUCT_GROUPS,
    materialCodes: [],
    packSizes: PACK_SIZES,
  },
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
        if (!value || !["ea", "dsp", "cs"].includes(value)) {
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
        if (field !== "shelfLife") {
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
        // Form submission successful
        console.log("✅ Form submitted successfully");
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

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                เพิ่มสินค้าใหม่
              </h2>
              <p className="text-sm text-gray-500">กรอกข้อมูลสินค้าที่ตรวจพบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Scanned Barcode Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Barcode className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Barcode ที่ตรวจพบ
              </span>
            </div>
            <div className="font-mono text-lg text-blue-800">
              {scannedBarcode}
            </div>
          </div>

          {/* Barcode Type */}
          <FormField
            label="ประเภท Barcode"
            required
            error={errors.barcodeType}
            icon={<Tag className="w-4 h-4" />}
          >
            <div className="flex space-x-3">
              {["ea", "dsp", "cs"].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="barcodeType"
                    value={type}
                    checked={formData.barcodeType === type}
                    onChange={(e) =>
                      handleInputChange("barcodeType", e.target.value)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {type.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </FormField>

          {/* Material Code */}
          <FormField
            label="รหัสสินค้า (Material Code)"
            required
            error={errors.materialCode}
            icon={<Package className="w-4 h-4" />}
            description="รหัสสินค้าที่ใช้ในระบบ (เช่น F123456)"
          >
            <input
              type="text"
              value={formData.materialCode}
              onChange={(e) =>
                handleInputChange("materialCode", e.target.value.toUpperCase())
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="F123456"
            />
          </FormField>

          {/* Description */}
          <FormField
            label="รายละเอียดสินค้า (อังกฤษ)"
            required
            error={errors.description}
            icon={<FileText className="w-4 h-4" />}
          >
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Bear Brand Sterilized Milk"
            />
          </FormField>

          {/* Thai Description */}
          <FormField
            label="รายละเอียดสินค้า (ไทย)"
            required
            error={errors.thaiDescription}
            icon={<Globe className="w-4 h-4" />}
          >
            <input
              type="text"
              value={formData.thaiDescription}
              onChange={(e) =>
                handleInputChange("thaiDescription", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="แบรนด์ นมปลอดเชื้อ"
            />
          </FormField>

          {/* Pack Size */}
          <FormField
            label="ขนาดแพ็ค"
            required
            error={errors.packSize}
            icon={<Package className="w-4 h-4" />}
          >
            <input
              type="text"
              value={formData.packSize}
              onChange={(e) => handleInputChange("packSize", e.target.value)}
              onFocus={() =>
                setShowSuggestions((prev) => ({ ...prev, packSize: true }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="250ml"
            />
            {showSuggestions.packSize && (
              <SuggestionsList
                suggestions={suggestions.packSizes}
                selectedValue={formData.packSize}
                onSelect={(value) => {
                  handleInputChange("packSize", value);
                  setShowSuggestions((prev) => ({ ...prev, packSize: false }));
                }}
              />
            )}
          </FormField>

          {/* Product Group */}
          <FormField
            label="กลุ่มสินค้า"
            required
            error={errors.productGroup}
            icon={<Tag className="w-4 h-4" />}
          >
            <select
              value={formData.productGroup}
              onChange={(e) =>
                handleInputChange("productGroup", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">เลือกกลุ่มสินค้า</option>
              {suggestions.productGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </FormField>

          {/* Shelf Life (Optional) */}
          <FormField
            label="อายุการเก็บรักษา"
            icon={<Package className="w-4 h-4" />}
            description="ระบุอายุการเก็บรักษา (ถ้ามี)"
          >
            <input
              type="text"
              value={formData.shelfLife || ""}
              onChange={(e) => handleInputChange("shelfLife", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="12 เดือน"
            />
          </FormField>

          {/* Hint */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">💡 เคล็ดลับ:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>รหัสสินค้าต้องไม่ซ้ำกับที่มีอยู่ในระบบ</li>
                  <li>ควรใช้รายละเอียดที่ชัดเจนและง่ายต่อการค้นหา</li>
                  <li>ตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← กลับ
          </button>

          <div className="flex space-x-3">
            {onPreview && (
              <button
                type="button"
                onClick={handlePreview}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                ดูตัวอย่าง
              </button>
            )}

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึกสินค้า"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEntryForm;
