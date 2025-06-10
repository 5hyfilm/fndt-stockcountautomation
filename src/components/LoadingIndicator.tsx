// src/components/LoadingIndicator.tsx - Loading indicator for barcode scanning
import React from "react";

interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  message = "กำลังโหลด...",
  size = "md",
  className = "",
}) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-blue-500 border-t-transparent ${sizeClasses[size]}`}
      />
      <span className={`text-blue-600 font-medium ${textSizeClasses[size]}`}>
        {message}
      </span>
    </div>
  );
};

// Specialized loading indicator for barcode scanning
export const BarcodeScanLoadingIndicator: React.FC<{
  isLoading: boolean;
  stage: "scanning" | "processing" | "searching" | "found" | "not-found";
}> = ({ isLoading, stage }) => {
  if (!isLoading) return null;

  const messages = {
    scanning: "กำลังสแกนบาร์โค้ด...",
    processing: "กำลังประมวลผลภาพ...",
    searching: "กำลังค้นหาสินค้า...",
    found: "พบสินค้าแล้ว!",
    "not-found": "ไม่พบข้อมูลสินค้า",
  };

  const colors = {
    scanning: "border-blue-500 text-blue-600",
    processing: "border-yellow-500 text-yellow-600",
    searching: "border-purple-500 text-purple-600",
    found: "border-green-500 text-green-600",
    "not-found": "border-red-500 text-red-600",
  };

  return (
    <div className="flex items-center justify-center space-x-2 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
      {stage !== "found" && stage !== "not-found" && (
        <div
          className={`animate-spin rounded-full border-2 border-t-transparent w-5 h-5 ${colors[stage]}`}
        />
      )}
      {stage === "found" && (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
      {stage === "not-found" && (
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      )}
      <span className={`font-medium text-sm ${colors[stage]}`}>
        {messages[stage]}
      </span>
    </div>
  );
};
