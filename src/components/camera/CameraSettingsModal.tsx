// src/components/camera/CameraSettingsModal.tsx
"use client";

import React, { useState } from "react";
import { X, Camera, Monitor, Smartphone } from "lucide-react";

interface CameraSettings {
  resolution: {
    width: number;
    height: number;
  };
  facingMode: "environment" | "user";
  frameRate: number;
  autoProcess: boolean;
  processInterval: number;
  beepOnDetection: boolean;
  vibrationOnDetection: boolean;
}

interface CameraSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CameraSettings;
  onSettingsChange: (settings: CameraSettings) => void;
}

export const CameraSettingsModal: React.FC<CameraSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState<CameraSettings>(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: CameraSettings = {
      resolution: { width: 1280, height: 720 },
      facingMode: "environment",
      frameRate: 30,
      autoProcess: true,
      processInterval: 300,
      beepOnDetection: false,
      vibrationOnDetection: true,
    };
    setLocalSettings(defaultSettings);
  };

  const resolutionOptions = [
    { label: "HD (1280x720)", value: { width: 1280, height: 720 } },
    { label: "Full HD (1920x1080)", value: { width: 1920, height: 1080 } },
    { label: "VGA (640x480)", value: { width: 640, height: 480 } },
    { label: "QVGA (320x240)", value: { width: 320, height: 240 } },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Camera size={20} />
            ตั้งค่ากล้อง
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Resolution Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ความละเอียด
            </label>
            <select
              value={`${localSettings.resolution.width}x${localSettings.resolution.height}`}
              onChange={(e) => {
                const selected = resolutionOptions.find(
                  (opt) =>
                    `${opt.value.width}x${opt.value.height}` === e.target.value
                );
                if (selected) {
                  setLocalSettings((prev) => ({
                    ...prev,
                    resolution: selected.value,
                  }));
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              {resolutionOptions.map((option) => (
                <option
                  key={`${option.value.width}x${option.value.height}`}
                  value={`${option.value.width}x${option.value.height}`}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              กล้อง
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    facingMode: "environment",
                  }))
                }
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                  localSettings.facingMode === "environment"
                    ? "border-fn-green bg-fn-green/10 text-fn-green"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Smartphone size={20} />
                <span className="text-sm">กล้องหลัง</span>
              </button>
              <button
                onClick={() =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    facingMode: "user",
                  }))
                }
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                  localSettings.facingMode === "user"
                    ? "border-fn-green bg-fn-green/10 text-fn-green"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Monitor size={20} />
                <span className="text-sm">กล้องหน้า</span>
              </button>
            </div>
          </div>

          {/* Auto Processing */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                สแกนอัตโนมัติ
              </label>
              <input
                type="checkbox"
                checked={localSettings.autoProcess}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    autoProcess: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-fn-green bg-gray-100 border-gray-300 rounded focus:ring-fn-green"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              สแกนบาร์โค้ดอัตโนมัติขณะเปิดกล้อง
            </p>
          </div>

          {/* Process Interval */}
          {localSettings.autoProcess && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ความเร็วการสแกน: {localSettings.processInterval}ms
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="100"
                value={localSettings.processInterval}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    processInterval: parseInt(e.target.value),
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>เร็ว (100ms)</span>
                <span>ช้า (1000ms)</span>
              </div>
            </div>
          )}

          {/* Audio Feedback */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                เสียงแจ้งเตือน
              </label>
              <input
                type="checkbox"
                checked={localSettings.beepOnDetection}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    beepOnDetection: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-fn-green bg-gray-100 border-gray-300 rounded focus:ring-fn-green"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              เล่นเสียงเมื่อตรวจพบบาร์โค้ด
            </p>
          </div>

          {/* Vibration Feedback */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                การสั่นเตือน
              </label>
              <input
                type="checkbox"
                checked={localSettings.vibrationOnDetection}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    vibrationOnDetection: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-fn-green bg-gray-100 border-gray-300 rounded focus:ring-fn-green"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              สั่นเครื่องเมื่อตรวจพบบาร์โค้ด (บนมือถือ)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            รีเซ็ต
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-fn-green text-white rounded-lg hover:bg-fn-green/90 text-sm"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};
