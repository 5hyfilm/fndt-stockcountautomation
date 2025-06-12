// src/components/inventory/ConfirmDeleteDialog.tsx
"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  itemCount,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full mx-4 overflow-hidden">
        {/* Header - Red bar like logout modal */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">ยืนยันการลบข้อมูล</h2>
                <p className="text-red-100 text-sm">
                  กรุณายืนยันก่อนลบข้อมูลทั้งหมด
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Warning message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 mt-0.5" size={18} />
              <div>
                <div className="font-medium text-amber-800">
                  ข้อมูลที่จะถูกลบ
                </div>
                <div className="text-sm text-amber-700 mt-1">
                  คุณกำลังจะลบข้อมูล inventory ทั้งหมด ({itemCount} รายการ)
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation message */}
          <div className="text-center text-gray-700 mb-6">
            คุณต้องการลบข้อมูล inventory ทั้งหมดใช่หรือไม่?
            <div className="text-sm text-red-600 mt-2">
              ข้อมูลทั้งหมดจะถูกลบอย่างถาวร
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              ลบทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
