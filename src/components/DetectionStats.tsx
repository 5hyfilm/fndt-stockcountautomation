"use client";

import React from "react";
import { Settings, Activity, Smartphone, Zap } from "lucide-react";
import { Stats, VideoConstraints } from "../types/detection";

interface DetectionStatsProps {
  stats: Stats;
  videoConstraints: VideoConstraints;
  processingQueue: number;
}

export const DetectionStats: React.FC<DetectionStatsProps> = ({
  stats,
  videoConstraints,
  processingQueue,
}) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-2xl border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings className="text-purple-400" size={20} />
        สถิติการตรวจจับ
      </h3>

      <div className="space-y-4">
        {/* Primary Stats */}
        <div className="bg-gray-700/50 rounded-lg p-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm flex items-center gap-1">
              <Activity size={14} />
              มุมหมุน
            </span>
            <span className="text-purple-400 font-mono font-semibold">
              {stats.rotation.toFixed(1)}°
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">ความแม่นยำ</span>
            <span className="text-purple-400 font-mono font-semibold">
              {(stats.confidence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm flex items-center gap-1">
              <Smartphone size={14} />
              กล้อง
            </span>
            <span className="text-purple-400 font-mono">
              {videoConstraints.facingMode === "environment" ? "หลัง" : "หน้า"}
            </span>
          </div>
        </div>

        {/* Technical Stats */}
        <div className="bg-gray-700/50 rounded-lg p-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">วิธีการ</span>
            <span className="text-purple-400 font-mono text-xs break-all max-w-[120px] text-right">
              {stats.method || "N/A"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm flex items-center gap-1">
              <Zap size={14} />
              ประมวลผล/วินาที
            </span>
            <span className="text-yellow-400 font-mono">
              {Math.round(1000 / 300).toFixed(1)} FPS
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">เวลาประมวลผล</span>
            <span className="text-yellow-400 font-mono">
              {stats.lastProcessTime}ms
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">คิวงาน</span>
            <span
              className={`font-mono font-semibold ${
                processingQueue > 0 ? "text-orange-400" : "text-green-400"
              }`}
            >
              {processingQueue}/3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
