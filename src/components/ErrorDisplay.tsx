"use client";

import React from "react";
import { AlertTriangle, X, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  error: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  onRetry,
}) => {
  if (!error) return null;

  return (
    <div className="bg-red-900/90 backdrop-blur-sm border border-red-500/50 rounded-xl p-4 shadow-2xl animate-in slide-in-from-top duration-300">
      <div className="flex items-start gap-3">
        <div className="bg-red-500/20 p-2 rounded-lg">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-red-400 font-semibold mb-1">เกิดข้อผิดพลาด</h3>
          <p className="text-red-200 text-sm leading-relaxed break-words">
            {error}
          </p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              <RefreshCw size={14} />
              ลองใหม่
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 flex-shrink-0 p-1 hover:bg-red-500/20 rounded transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
