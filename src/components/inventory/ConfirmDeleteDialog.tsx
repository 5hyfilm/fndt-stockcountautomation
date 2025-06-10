// src/components/inventory/ConfirmDeleteDialog.tsx
"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-500" size={24} />
          <h3 className="text-lg font-semibold">ยืนยันการลบข้อมูล</h3>
        </div>
        <p className="text-gray-600 mb-6">
          คุณต้องการลบข้อมูล inventory ทั้งหมด ({itemCount} รายการ) ใช่หรือไม่?
          การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            ลบทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
};
