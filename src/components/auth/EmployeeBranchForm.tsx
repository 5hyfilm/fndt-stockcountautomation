// src/components/auth/EmployeeBranchForm.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
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

// รายการสาขาตัวอย่าง
const BRANCH_OPTIONS = [
  { code: "001", name: "สาขาสยามพารากอน" },
  { code: "002", name: "สาขาเซ็นทรัลเวิลด์" },
  { code: "003", name: "สาขาเอ็มบีเค" },
  { code: "004", name: "สาขาเทอร์มินอล 21" },
  { code: "005", name: "สาขาไอคอนสยาม" },
  { code: "006", name: "สาขาเซ็นทรัลลาดพร้าว" },
  { code: "007", name: "สาขาเซ็นทรัลบางนา" },
  { code: "008", name: "สาขาเซ็นทรัลเวสต์เกต" },
  { code: "009", name: "สาขาเกตเวย์เอกมัย" },
  { code: "010", name: "สาขาเซ็นทรัลพิษณุโลก" },
];

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
      newErrors.branchCode = "กรุณาเลือกสาขา";
    }

    if (!branchName.trim()) {
      newErrors.branchName = "กรุณากรอกชื่อสาขา";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBranchChange = (code: string) => {
    setBranchCode(code);
    const selectedBranch = BRANCH_OPTIONS.find(
      (branch) => branch.code === code
    );
    setBranchName(selectedBranch?.name || "");

    // Clear branch-related errors
    setErrors((prev) => ({
      ...prev,
      branchCode: undefined,
      branchName: undefined,
    }));
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
              {/* แก้ไข: ใช้ next/image แทน <img> */}
              <Image
                src="/fn-logo.png"
                alt="F&N Logo"
                width={64}
                height={64}
                className="mx-auto mb-3 object-contain"
                priority
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

          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 size={16} className="inline mr-2" />
              รหัสสาขา
            </label>
            <select
              value={branchCode}
              onChange={(e) => handleBranchChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-fn-green focus:border-fn-green transition-colors ${
                errors.branchCode ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            >
              <option value="">เลือกสาขา</option>
              {BRANCH_OPTIONS.map((branch) => (
                <option key={branch.code} value={branch.code}>
                  {branch.code} - {branch.name}
                </option>
              ))}
            </select>
            {errors.branchCode && (
              <p className="text-red-500 text-xs mt-1">{errors.branchCode}</p>
            )}
          </div>

          {/* Branch Name Display */}
          {branchName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                ชื่อสาขา
              </label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                {branchName}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !employeeName || !branchCode}
            className="w-full bg-gradient-to-r from-fn-green to-fn-red/80 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-blue-700 text-xs leading-relaxed">
              ข้อมูลจะถูกบันทึกในเครื่องและใช้สำหรับการส่งออกรายงาน Stock
            </p>
          </div>
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
