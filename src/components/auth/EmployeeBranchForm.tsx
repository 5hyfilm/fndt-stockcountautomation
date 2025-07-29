// Path: src/components/auth/EmployeeBranchForm.tsx
"use client";

import React, { useState } from "react";
import { User, Building2, MapPin, Save, ArrowRight } from "lucide-react";
import Image from "next/image";
// ✅ FIXED: Import from relative path for consistency
import { EmployeeFormData } from "../../types/auth";

interface EmployeeBranchFormProps {
  onSubmit: (employeeData: EmployeeFormData) => void; // ✅ Keep EmployeeFormData for compatibility
  isLoading?: boolean;
}

export const EmployeeBranchForm: React.FC<EmployeeBranchFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  // ✅ FIXED: Rename state variables to match Employee interface
  const [name, setName] = useState(""); // ✅ Changed from employeeName to name
  const [branchCode, setBranchCode] = useState("");
  const [branchName, setBranchName] = useState("");

  // ✅ FIXED: Update error keys to match Employee interface
  const [errors, setErrors] = useState<{
    name?: string; // ✅ Changed from employeeName to name
    branchCode?: string;
    branchName?: string;
  }>({});

  // ✅ Helper function สำหรับตรวจสอบตัวเลขเท่านั้น
  const isNumericOnly = (value: string): boolean => {
    return /^\d*$/.test(value);
  };

  // ✅ Normalize รหัสสาขา (เอาเฉพาะตัวเลข)
  const normalizeBranchCode = (value: string): string => {
    return value.replace(/[^0-9]/g, "");
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // ✅ FIXED: Update validation for 'name' field
    if (!name.trim()) {
      newErrors.name = "กรุณากรอกชื่อพนักงาน";
    } else if (name.trim().length < 2) {
      newErrors.name = "ชื่อพนักงานต้องมีอย่างน้อย 2 ตัวอักษร";
    }

    // ✅ ตรวจสอบรหัสสาขา - เพิ่ม validation สำหรับตัวเลขเท่านั้น
    if (!branchCode.trim()) {
      newErrors.branchCode = "กรุณากรอกรหัสสาขา";
    } else if (!isNumericOnly(branchCode.trim())) {
      newErrors.branchCode = "รหัสสาขาต้องเป็นตัวเลข 0-9 เท่านั้น";
    } else if (branchCode.trim().length < 3) {
      newErrors.branchCode = "รหัสสาขาต้องมีอย่างน้อย 3 หลัก";
    } else if (branchCode.trim().length > 10) {
      newErrors.branchCode = "รหัสสาขาไม่ควรเกิน 10 หลัก";
    }

    // ตรวจสอบชื่อสาขา
    if (!branchName.trim()) {
      newErrors.branchName = "กรุณากรอกชื่อสาขา";
    } else if (branchName.trim().length < 2) {
      newErrors.branchName = "ชื่อสาขาต้องมีอย่างน้อย 2 ตัวอักษร";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // ✅ FIXED: Return EmployeeFormData to maintain compatibility with existing logic
    const employeeFormData: EmployeeFormData = {
      name: name.trim(), // ✅ Use 'name' field as per EmployeeFormData type
      branchCode: branchCode.trim(),
      branchName: branchName.trim(),
    };

    onSubmit(employeeFormData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // ✅ FIXED: Update handler names and error clearing
  const handleNameChange = (value: string) => {
    setName(value);
    // Clear name error when user starts typing
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  // ✅ ปรับปรุง handleBranchCodeChange ให้กรอกได้เฉพาะตัวเลข
  const handleBranchCodeChange = (value: string) => {
    // กรองเอาเฉพาะตัวเลข และจำกัดความยาว
    const numericValue = normalizeBranchCode(value);
    const limitedValue = numericValue.slice(0, 10); // จำกัดไม่เกิน 10 หลัก

    setBranchCode(limitedValue);

    // Clear branch code error when user starts typing
    if (errors.branchCode) {
      setErrors((prev) => ({ ...prev, branchCode: undefined }));
    }
  };

  const handleBranchNameChange = (value: string) => {
    setBranchName(value);
    // Clear branch name error when user starts typing
    if (errors.branchName) {
      setErrors((prev) => ({ ...prev, branchName: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fn-green/10 to-fn-red/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-fn-green to-fn-red/80 text-white p-6 rounded-t-2xl">
          <div className="text-center">
            <Image
              src="/fn-logo.png"
              alt="F&N Logo"
              width={60}
              height={60}
              className="mx-auto mb-3"
              priority
            />
            <h1 className="text-xl font-bold">ระบบจัดการสินค้าคงคลัง</h1>
            <p className="text-sm text-white/90 mt-1">
              กรุณากรอกข้อมูลพนักงานและสาขา
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* ✅ FIXED: Employee Name Input - updated labels and handlers */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="mr-2 text-fn-green" />
              ชื่อพนักงาน
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="กรอกชื่อของคุณ"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fn-green focus:border-transparent transition-colors ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Branch Code Input */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Building2 size={16} className="mr-2 text-fn-green" />
              รหัสสาขา
            </label>
            <input
              type="text"
              value={branchCode}
              onChange={(e) => handleBranchCodeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="กรอกรหัสสาขา (เช่น 001, 1234)"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fn-green focus:border-transparent transition-colors ${
                errors.branchCode ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.branchCode && (
              <p className="text-red-500 text-xs mt-1">{errors.branchCode}</p>
            )}
          </div>

          {/* Branch Name Input */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="mr-2 text-fn-green" />
              ชื่อสาขา
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => handleBranchNameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="กรอกชื่อสาขา (เช่น สาขาสีลม, สาขาบางนา)"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fn-green focus:border-transparent transition-colors ${
                errors.branchName ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.branchName && (
              <p className="text-red-500 text-xs mt-1">{errors.branchName}</p>
            )}
          </div>

          {/* ✅ FIXED: Submit Button - update disabled condition */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !name || !branchCode || !branchName}
            className="w-full bg-gradient-to-r from-fn-green to-fn-red/80 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>เริ่มใช้งานระบบ</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="text-center text-xs text-gray-500">
            <p>© 2025 F&N Inventory Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
};
