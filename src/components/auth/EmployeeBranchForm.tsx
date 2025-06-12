// src/components/auth/EmployeeBranchForm.tsx
"use client";

import React, { useState } from "react";
import { User, Building2, MapPin, Save, ArrowRight } from "lucide-react";

export interface EmployeeInfo {
  employeeName: string;
  branchCode: string;
  branchName: string;
  timestamp: string;
}

interface EmployeeBranchFormProps {
  onSubmit: (employeeInfo: EmployeeInfo) => void;
  isLoading?: boolean;
}

export const EmployeeBranchForm: React.FC<EmployeeBranchFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [employeeName, setEmployeeName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [errors, setErrors] = useState<{
    employeeName?: string;
    branchCode?: string;
    branchName?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!employeeName.trim()) {
      newErrors.employeeName = "กรุณากรอกชื่อพนักงาน";
    } else if (employeeName.trim().length < 2) {
      newErrors.employeeName = "ชื่อพนักงานต้องมีอย่างน้อย 2 ตัวอักษร";
    }

    if (!branchCode.trim()) {
      newErrors.branchCode = "กรุณากรอกรหัสสาขา";
    } else if (branchCode.trim().length < 2) {
      newErrors.branchCode = "รหัสสาขาต้องมีอย่างน้อย 2 ตัวอักษร";
    } else if (!/^\d+$/.test(branchCode.trim())) {
      newErrors.branchCode = "รหัสสาขาต้องเป็นตัวเลขเท่านั้น";
    }

    if (!branchName.trim()) {
      newErrors.branchName = "กรุณากรอกชื่อสาขา";
    } else if (branchName.trim().length < 2) {
      newErrors.branchName = "ชื่อสาขาต้องมีอย่างน้อย 2 ตัวอักษร";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBranchCodeChange = (value: string) => {
    // อนุญาตเฉพาะตัวเลข
    const numericValue = value.replace(/[^0-9]/g, "");
    setBranchCode(numericValue);
    setErrors((prev) => ({ ...prev, branchCode: undefined }));
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const employeeInfo: EmployeeInfo = {
      employeeName: employeeName.trim(),
      branchCode: branchCode.trim(),
      branchName: branchName.trim(),
      timestamp: new Date().toISOString(),
    };

    onSubmit(employeeInfo);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fn-green/10 to-fn-red/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-fn-green to-fn-red/80 text-white p-6 rounded-t-2xl">
          <div className="text-center">
            <div className="text-center">
              <img
                src="/fn-logo.png"
                alt="F&N Logo"
                className="w-16 h-16 mx-auto mb-3 object-contain"
              />
              <h1 className="text-xl font-bold mb-1">ระบบเช็ค Stock สินค้า</h1>
              <p className="text-white/90 text-sm">F&N Inventory Management</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              ข้อมูลพนักงานและสาขา
            </h2>
            <p className="text-gray-600 text-sm">
              กรุณากรอกข้อมูลก่อนเริ่มใช้งานระบบ
            </p>
          </div>

          {/* Employee Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              ชื่อพนักงาน
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => {
                setEmployeeName(e.target.value);
                setErrors((prev) => ({ ...prev, employeeName: undefined }));
              }}
              onKeyPress={handleKeyPress}
              placeholder="กรอกชื่อ-นามสกุล"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-colors ${
                errors.employeeName ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.employeeName && (
              <p className="text-red-500 text-xs mt-1">{errors.employeeName}</p>
            )}
          </div>

          {/* Branch Code - Numeric Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 size={16} className="inline mr-2" />
              รหัสสาขา (ตัวเลขเท่านั้น)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={branchCode}
              onChange={(e) => handleBranchCodeChange(e.target.value)}
              onKeyPress={(e) => {
                // อนุญาตเฉพาะตัวเลขและปุ่มควบคุม
                if (
                  !/[0-9]/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Enter",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              onPaste={(e) => {
                // ควบคุมการ paste ให้เป็นตัวเลขเท่านั้น
                e.preventDefault();
                const paste = (
                  e.clipboardData || (window as any).clipboardData
                ).getData("text");
                const numericPaste = paste.replace(/[^0-9]/g, "");
                handleBranchCodeChange(branchCode + numericPaste);
              }}
              placeholder="กรอกรหัสสาขา เช่น 001, 123"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-colors ${
                errors.branchCode ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
              maxLength={10} // จำกัดความยาว
            />
            {errors.branchCode && (
              <p className="text-red-500 text-xs mt-1">{errors.branchCode}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              ใส่ได้เฉพาะตัวเลข 0-9 เท่านั้น
            </p>
          </div>

          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              ชื่อสาขา
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => {
                setBranchName(e.target.value);
                setErrors((prev) => ({ ...prev, branchName: undefined }));
              }}
              onKeyPress={handleKeyPress}
              placeholder="กรอกชื่อสาขา เช่น สาขาสยามพารากอน"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-colors ${
                errors.branchName ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.branchName && (
              <p className="text-red-500 text-xs mt-1">{errors.branchName}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-fn-green hover:bg-fn-green/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>กำลังเริ่มระบบ...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>เริ่มใช้งานระบบ</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Info */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-blue-700 text-xs leading-relaxed">
              ข้อมูลจะถูกบันทึกในเครื่องและใช้สำหรับการส่งออกรายงาน Stock
            </p>
          </div> */}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <div className="text-center text-xs text-gray-500">
            F&N Stock Management System
            <br />
            พัฒนาสำหรับการจัดการ Stock และ Inventory
          </div>
        </div>
      </div>
    </div>
  );
};
