// Path: src/components/forms/AddNewProductForm.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Package, Tag, FileText, Hash, Scan, Edit3, Check } from "lucide-react";

interface NewProductData {
  barcode: string;
  productName: string;
  category: string;
  description: string;
  countCs: number;
  countPieces: number;
}

interface AddNewProductFormProps {
  isVisible: boolean;
  barcode: string;
  onClose: () => void;
  onSave: (productData: NewProductData) => Promise<boolean>;
}

export const AddNewProductForm: React.FC<AddNewProductFormProps> = ({
  isVisible,
  barcode,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<NewProductData>({
    barcode: barcode,
    productName: "",
    category: "",
    description: "",
    countCs: 0,
    countPieces: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<NewProductData>>({});
  const [isBarcodeEditable, setIsBarcodeEditable] = useState(false); // ✅ เพิ่ม state สำหรับ control การแก้ไข barcode
  const barcodeInputRef = useRef<HTMLInputElement>(null); // ✅ เพิ่ม ref สำหรับ focus

  // ✅ Update barcode when prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      barcode: barcode
    }));
    // ✅ Reset barcode editable state เมื่อได้รับ barcode ใหม่
    setIsBarcodeEditable(false);
  }, [barcode]);

  // Update form data
  const updateField = (field: keyof NewProductData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // ✅ Helper function สำหรับ format barcode
  const formatBarcode = (value: string): string => {
    // เก็บเฉพาะตัวเลข
    const numbersOnly = value.replace(/\D/g, '');
    // จำกัดความยาวไม่เกิน 14 หลัก
    return numbersOnly.slice(0, 14);
  };

  // ✅ Get barcode validation status
  const getBarcodeValidationStatus = (): { isValid: boolean; message: string } => {
    const barcode = formData.barcode.trim();
    if (!barcode) {
      return { isValid: false, message: "กรุณากรอกหมายเลขบาร์โค้ด" };
    }
    if (barcode.length < 8) {
      return { isValid: false, message: `ต้องการอีก ${8 - barcode.length} หลัก` };
    }
    if (barcode.length > 14) {
      return { isValid: false, message: "ยาวเกินไป" };
    }
    if (!/^\d+$/.test(barcode)) {
      return { isValid: false, message: "ต้องเป็นตัวเลขเท่านั้น" };
    }
    return { isValid: true, message: "รูปแบบถูกต้อง" };
  };

  // ✅ Toggle barcode editable state
  const toggleBarcodeEditable = () => {
    const newEditableState = !isBarcodeEditable;
    setIsBarcodeEditable(newEditableState);
    
    // Clear barcode error when enabling edit
    if (newEditableState && errors.barcode) {
      setErrors(prev => ({
        ...prev,
        barcode: undefined
      }));
    }
    
    // ✅ Focus on input when enabling edit
    if (newEditableState) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select(); // เลือกข้อความทั้งหมดเพื่อให้แก้ไขง่าย
      }, 100);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<NewProductData> = {};

    // ✅ Barcode validation
    if (!formData.barcode.trim()) {
      newErrors.barcode = "กรุณากรอกหมายเลขบาร์โค้ด";
    } else if (!/^\d{8,14}$/.test(formData.barcode.trim())) {
      newErrors.barcode = "บาร์โค้ดต้องเป็นตัวเลข 8-14 หลัก";
    }

    if (!formData.productName.trim()) {
      newErrors.productName = "กรุณากรอกชื่อสินค้า";
    }

    if (!formData.category.trim()) {
      newErrors.category = "กรุณากรอกหมวดหมู่สินค้า";
    }

    if (formData.countCs < 0) {
      newErrors.countCs = "จำนวนลังต้องไม่ติดลบ";
    }

    if (formData.countPieces < 0) {
      newErrors.countPieces = "จำนวนชิ้นต้องไม่ติดลบ";
    }

    if (formData.countCs === 0 && formData.countPieces === 0) {
      newErrors.countCs = "กรุณากรอกจำนวนอย่างน้อย 1 ช่อง";
      newErrors.countPieces = "กรุณากรอกจำนวนอย่างน้อย 1 ช่อง";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await onSave(formData);
      if (success) {
        onClose();
        // ✅ Reset form
        setFormData({
          barcode: "",
          productName: "",
          category: "",
          description: "",
          countCs: 0,
          countPieces: 0,
        });
        setErrors({}); // ✅ Clear errors too
        setIsBarcodeEditable(false); // ✅ Reset barcode editable state
      }
    } catch (error) {
      console.error("Error saving new product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isLoading) {
      // ✅ Reset states when closing
      setIsBarcodeEditable(false);
      setErrors({});
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-fn-green text-white">
            <div className="flex items-center gap-3">
              <Package size={24} />
              <div>
                <h2 className="text-lg font-semibold">เพิ่มสินค้าใหม่</h2>
                <p className="text-sm opacity-90">กรอกข้อมูลสินค้าใหม่</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* ✅ Barcode Field with Edit Button */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Scan size={16} />
                Barcode (หมายเลขบาร์โค้ด) *
              </label>
              <div className="relative">
                <input
                  ref={barcodeInputRef} // ✅ เพิ่ม ref
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => updateField("barcode", formatBarcode(e.target.value))}
                  disabled={!isBarcodeEditable || isLoading} // ✅ Disabled จนกว่าจะกดปุ่มแก้ไข
                  className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent transition-colors font-mono ${
                    errors.barcode ? "border-red-500" : 
                    formData.barcode && getBarcodeValidationStatus().isValid ? "border-green-500" :
                    "border-gray-300"
                  } ${
                    !isBarcodeEditable ? "bg-gray-50 text-gray-600" : "bg-white"
                  }`}
                  placeholder={isBarcodeEditable ? "กรอกหมายเลขบาร์โค้ด (8-14 หลัก)" : "กดปุ่มดินสอเพื่อแก้ไข"}
                />
                
                {/* ✅ Edit/Confirm Button */}
                <button
                  type="button"
                  onClick={toggleBarcodeEditable}
                  disabled={isLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
                    isBarcodeEditable 
                      ? "text-green-600 hover:bg-green-50" 
                      : "text-gray-500 hover:bg-gray-100"
                  } disabled:opacity-50`}
                  title={isBarcodeEditable ? "ยืนยันการแก้ไข" : "แก้ไขบาร์โค้ด"}
                >
                  {isBarcodeEditable ? <Check size={16} /> : <Edit3 size={16} />}
                </button>
              </div>
              
              {/* ✅ Real-time validation feedback */}
              {formData.barcode && !errors.barcode && isBarcodeEditable && (
                <p className={`text-xs mt-1 ${
                  getBarcodeValidationStatus().isValid ? "text-green-600" : "text-orange-600"
                }`}>
                  {getBarcodeValidationStatus().message}
                </p>
              )}
              {errors.barcode && (
                <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>
              )}
              {!formData.barcode && !errors.barcode && (
                <p className="text-gray-500 text-xs mt-1">
                  รองรับบาร์โค้ด 8-14 หลัก (EAN-8, UPC-A, EAN-13 หรือ ITF-14)
                </p>
              )}
              {!isBarcodeEditable && formData.barcode && !errors.barcode && (
                <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                  <Edit3 size={12} />
                  กดปุ่มดินสอเพื่อแก้ไขบาร์โค้ด
                </p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag size={16} />
                F/FG Prod (ชื่อสินค้า) *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => updateField("productName", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent transition-colors ${
                  errors.productName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="กรอกชื่อสินค้า"
                disabled={isLoading}
              />
              {errors.productName && (
                <p className="text-red-500 text-xs mt-1">{errors.productName}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Package size={16} />
                Gr. (หมวดหมู่) *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent transition-colors ${
                  errors.category ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="กรอกหมวดหมู่สินค้า"
                disabled={isLoading}
              />
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={16} />
                รายละเอียด
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent transition-colors resize-none"
                placeholder="กรอกรายละเอียดเพิ่มเติม (ไม่บังคับ)"
                disabled={isLoading}
              />
            </div>

            {/* Count Section */}
            <div className="grid grid-cols-2 gap-4">
              {/* Count CS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Hash size={16} />
                  นับจริง (cs)
                </label>
                <input
                  type="number"
                  value={formData.countCs}
                  onChange={(e) => updateField("countCs", parseInt(e.target.value) || 0)}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent transition-colors ${
                    errors.countCs ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.countCs && (
                  <p className="text-red-500 text-xs mt-1">{errors.countCs}</p>
                )}
              </div>

              {/* Count Pieces */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Hash size={16} />
                  นับจริง (ชิ้น)
                </label>
                <input
                  type="number"
                  value={formData.countPieces}
                  onChange={(e) => updateField("countPieces", parseInt(e.target.value) || 0)}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-fn-green focus:border-transparent transition-colors ${
                    errors.countPieces ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.countPieces && (
                  <p className="text-red-500 text-xs mt-1">{errors.countPieces}</p>
                )}
              </div>
            </div>

            {/* Summary */}
            {(formData.countCs > 0 || formData.countPieces > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">จะเพิ่ม: </span>
                  {formData.countCs > 0 && (
                    <span>{formData.countCs} ลัง</span>
                  )}
                  {formData.countCs > 0 && formData.countPieces > 0 && (
                    <span> + </span>
                  )}
                  {formData.countPieces > 0 && (
                    <span>{formData.countPieces} ชิ้น</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-fn-green text-white rounded-lg hover:bg-fn-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    บันทึก
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};