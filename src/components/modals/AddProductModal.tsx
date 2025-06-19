// ./src/components/modals/AddProductModal.tsx
"use client";

import React, { useState } from "react";
import {
  X,
  Package,
  Save,
  Camera,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { ProductCategory } from "../../types/product";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcode: string;
  onSuccess?: (product: any) => void;
}

interface ProductFormData {
  barcode: string;
  name: string;
  brand: string;
  category: ProductCategory | "";
  size: string;
  unit: string;
  price?: number;
  description?: string;
}

// ✅ เพิ่ม export เพื่อแก้ปัญหา module
export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  barcode,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    barcode,
    name: "",
    brand: "",
    category: "",
    size: "",
    unit: "",
    price: undefined,
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "กรุณาใส่ชื่อสินค้า";
    }
    if (!formData.brand.trim()) {
      newErrors.brand = "กรุณาใส่แบรนด์";
    }
    if (!formData.category) {
      newErrors.category = "กรุณาเลือกหมวดหมู่";
    }
    if (!formData.size.trim()) {
      newErrors.size = "กรุณาใส่ขนาด";
    }
    if (!formData.unit.trim()) {
      newErrors.unit = "กรุณาใส่หน่วย";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus("success");
        onSuccess?.(result.data);

        // Auto close after success
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1500);
      } else {
        setSubmitStatus("error");
        if (result.error.includes("Barcode นี้มีอยู่ในระบบแล้ว")) {
          setErrors({ barcode: result.error });
        }
      }
    } catch (error) {
      console.error("Error adding product:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      barcode,
      name: "",
      brand: "",
      category: "",
      size: "",
      unit: "",
      price: undefined,
      description: "",
    });
    setErrors({});
    setSubmitStatus("idle");
  };

  // Handle input changes
  const handleChange = (
    field: keyof ProductFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-fn-green/10 p-2 rounded-lg">
              <Package className="text-fn-green" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                เพิ่มสินค้าใหม่
              </h2>
              <p className="text-sm text-gray-600">
                สร้างข้อมูลสินค้าสำหรับบาร์โค้ด:{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                  {barcode}
                </code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success/Error Status */}
          {submitStatus === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-green-700 text-sm">
                เพิ่มสินค้าใหม่เรียบร้อยแล้ว!
              </p>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700 text-sm">
                เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง
              </p>
            </div>
          )}

          {/* Barcode (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              บาร์โค้ด
            </label>
            <input
              type="text"
              value={formData.barcode}
              disabled
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-mono text-sm"
            />
            {errors.barcode && (
              <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อสินค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="เช่น น้ำส้มปั่น 100%"
              className={`w-full p-3 border rounded-xl transition-colors ${
                errors.name
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-fn-green"
              } focus:outline-none focus:ring-2 focus:ring-fn-green/20`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              แบรนด์ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
              placeholder="เช่น Malee, Tipco"
              className={`w-full p-3 border rounded-xl transition-colors ${
                errors.brand
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-fn-green"
              } focus:outline-none focus:ring-2 focus:ring-fn-green/20`}
            />
            {errors.brand && (
              <p className="text-red-500 text-xs mt-1">{errors.brand}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่ <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={`w-full p-3 border rounded-xl transition-colors ${
                errors.category
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-fn-green"
              } focus:outline-none focus:ring-2 focus:ring-fn-green/20`}
            >
              <option value="">เลือกหมวดหมู่</option>
              <option value={ProductCategory.BEVERAGES}>เครื่องดื่ม</option>
              <option value={ProductCategory.SNACKS}>ขนม</option>
              <option value={ProductCategory.DAIRY}>ผลิตภัณฑ์นม</option>
              <option value={ProductCategory.CANNED_FOOD}>อาหารกระป๋อง</option>
              <option value={ProductCategory.BAKERY}>เบเกอรี่</option>
              <option value={ProductCategory.CONFECTIONERY}>ขนมหวาน</option>
              <option value={ProductCategory.INSTANT_NOODLES}>
                บะหมี่กึ่งสำเร็จรูป
              </option>
              <option value={ProductCategory.SAUCES}>ซอส</option>
              <option value={ProductCategory.SEASONING}>เครื่องปรุง</option>
              <option value={ProductCategory.FROZEN}>อาหารแช่แข็ง</option>
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category}</p>
            )}
          </div>

          {/* Size and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ขนาด <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => handleChange("size", e.target.value)}
                placeholder="เช่น 250"
                className={`w-full p-3 border rounded-xl transition-colors ${
                  errors.size
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-fn-green"
                } focus:outline-none focus:ring-2 focus:ring-fn-green/20`}
              />
              {errors.size && (
                <p className="text-red-500 text-xs mt-1">{errors.size}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หน่วย <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="เช่น ml, g"
                className={`w-full p-3 border rounded-xl transition-colors ${
                  errors.unit
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-fn-green"
                } focus:outline-none focus:ring-2 focus:ring-fn-green/20`}
              />
              {errors.unit && (
                <p className="text-red-500 text-xs mt-1">{errors.unit}</p>
              )}
            </div>
          </div>

          {/* Price (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ราคา (บาท)
            </label>
            <input
              type="number"
              value={formData.price || ""}
              onChange={(e) =>
                handleChange("price", parseFloat(e.target.value) || 0)
              }
              placeholder="เช่น 15.50"
              step="0.01"
              min="0"
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-fn-green focus:outline-none focus:ring-2 focus:ring-fn-green/20 transition-colors"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="รายละเอียดสินค้า..."
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-fn-green focus:outline-none focus:ring-2 focus:ring-fn-green/20 transition-colors resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors duration-200 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-fn-green hover:bg-fn-green/90 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={18} />
                  บันทึกสินค้า
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ✅ เพิ่ม default export
export default AddProductModal;
