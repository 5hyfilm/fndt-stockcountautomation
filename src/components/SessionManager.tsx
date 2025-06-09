// src/components/SessionManager.tsx
"use client";

import React, { useState } from "react";
import {
  Play,
  Square,
  Clock,
  Users,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
} from "lucide-react";
import { useInventory } from "../hooks/useInventory";

interface SessionManagerProps {
  className?: string;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  className = "",
}) => {
  const {
    currentSession,
    sessions,
    createSession,
    endSession,
    hasActiveSession,
  } = useInventory();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");

  const handleCreateSession = () => {
    if (!sessionName.trim()) return;

    createSession(
      sessionName.trim(),
      sessionDescription.trim() || undefined,
      sessionLocation.trim() || undefined
    );

    // Reset form
    setSessionName("");
    setSessionDescription("");
    setSessionLocation("");
    setShowCreateForm(false);
  };

  const handleEndSession = () => {
    if (confirm("ต้องการสิ้นสุดเซชันนี้หรือไม่?")) {
      endSession();
    }
  };

  const getSessionDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);

    if (diffHours > 0) {
      return `${diffHours} ชม. ${diffMins} นาที`;
    }
    return `${diffMins} นาที`;
  };

  if (showCreateForm) {
    return (
      <div
        className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 ${className}`}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Plus className="text-blue-600" size={20} />
            สร้างเซชันใหม่
          </h3>
          <p className="text-sm text-gray-600">
            เซชันช่วยจัดกลุ่มการสแกนสินค้าตามช่วงเวลาหรือวัตถุประสงค์
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อเซชัน *
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="เช่น ตรวจนับสต็อกประจำเดือน"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              สถานที่
            </label>
            <input
              type="text"
              value={sessionLocation}
              onChange={(e) => setSessionLocation(e.target.value)}
              placeholder="เช่น คลังสินค้า A, ร้านสาขา 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียด
            </label>
            <textarea
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
              placeholder="วัตถุประสงค์ หรือรายละเอียดเพิ่มเติม..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={100}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreateSession}
              disabled={!sessionName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              เริ่มเซชัน
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="font-semibold">จัดการเซชัน</h3>
            <p className="text-green-100 text-sm">
              {hasActiveSession
                ? "มีเซชันที่กำลังทำงาน"
                : "ไม่มีเซชันที่กำลังทำงาน"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Active Session */}
        {currentSession ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="text-green-600 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <h4 className="font-semibold text-green-800">
                      {currentSession.name}
                    </h4>
                    <p className="text-sm text-green-600">เซชันที่กำลังทำงาน</p>
                  </div>
                </div>

                <button
                  onClick={handleEndSession}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                  title="สิ้นสุดเซชัน"
                >
                  <Square size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-green-600" />
                  <span className="text-green-700">
                    {getSessionDuration(currentSession.startedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-green-600" />
                  <span className="text-green-700">
                    {currentSession.totalItems} รายการ
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users size={14} className="text-green-600" />
                  <span className="text-green-700">
                    {currentSession.totalQuantity} ชิ้น
                  </span>
                </div>
              </div>

              {currentSession.location && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-green-600" />
                  <span className="text-green-700">
                    {currentSession.location}
                  </span>
                </div>
              )}

              {currentSession.description && (
                <div className="mt-3">
                  <p className="text-sm text-green-700 bg-green-100 rounded p-2">
                    {currentSession.description}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                💡 เซชันจะช่วยจัดกลุ่มการสแกนของคุณ
                คุณสามารถสิ้นสุดเซชันเมื่อเสร็จสิ้นการทำงาน
              </p>
            </div>
          </div>
        ) : (
          /* No Active Session */
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <AlertCircle className="text-gray-400 mx-auto mb-3" size={32} />
              <h4 className="font-medium text-gray-700 mb-2">
                ไม่มีเซชันที่กำลังทำงาน
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                สร้างเซชันใหม่เพื่อเริ่มจัดกลุ่มการสแกนสินค้า
              </p>

              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
              >
                <Play size={16} />
                เริ่มเซชันใหม่
              </button>
            </div>

            {/* Recent Sessions */}
            {sessions.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-3">เซชันล่าสุด</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className="bg-gray-50 rounded-lg p-3 text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            {session.name}
                          </p>
                          <p className="text-gray-600">
                            {session.totalItems} รายการ |{" "}
                            {session.totalQuantity} ชิ้น
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            session.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : session.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {session.status === "completed"
                            ? "เสร็จสิ้น"
                            : session.status === "cancelled"
                            ? "ยกเลิก"
                            : "กำลังทำงาน"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
