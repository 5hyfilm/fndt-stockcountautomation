// src/components/inventory/ErrorAlert.tsx
"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorAlertProps {
  error: string | null;
  onDismiss: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-red-500" size={20} />
        <span className="text-red-700">{error}</span>
      </div>
      <button onClick={onDismiss} className="text-red-500 hover:text-red-700">
        <X size={16} />
      </button>
    </div>
  );
};
