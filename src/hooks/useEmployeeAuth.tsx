// src/hooks/useEmployeeAuth.tsx
"use client";

import { useState, useCallback, useEffect } from "react";

export interface EmployeeInfo {
  employeeName: string;
  branchCode: string;
  branchName: string;
  timestamp: string;
}

export interface EmployeeSession {
  employee: EmployeeInfo;
  sessionId: string;
  loginTime: string;
}

const STORAGE_KEY = "fn_employee_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export const useEmployeeAuth = () => {
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ตรวจสอบ session ที่มีอยู่
  const checkExistingSession = useCallback(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY);

      if (savedSession) {
        const parsedSession: EmployeeSession = JSON.parse(savedSession);
        const loginTime = new Date(parsedSession.loginTime).getTime();
        const now = Date.now();

        // ตรวจสอบว่า session ยังไม่หมดอายุ
        if (now - loginTime < SESSION_DURATION) {
          setSession(parsedSession);
          console.log(
            "📋 Existing session loaded:",
            parsedSession.employee.employeeName
          );
        } else {
          // Session หมดอายุ
          localStorage.removeItem(STORAGE_KEY);
          console.log("⏰ Session expired, clearing data");
        }
      }
    } catch (error) {
      console.error("❌ Error loading session:", error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // สร้าง session ใหม่
  const login = useCallback((employeeInfo: EmployeeInfo) => {
    const newSession: EmployeeSession = {
      employee: employeeInfo,
      sessionId: `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      loginTime: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      console.log("✅ Employee session created:", employeeInfo.employeeName);
    } catch (error) {
      console.error("❌ Error saving session:", error);
      throw new Error("ไม่สามารถบันทึกข้อมูลการเข้าสู่ระบบได้");
    }
  }, []);

  // ออกจากระบบ
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
      console.log("👋 Employee logged out");
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  }, []);

  // อัพเดตข้อมูลพนักงาน
  const updateEmployeeInfo = useCallback(
    (updatedInfo: Partial<EmployeeInfo>) => {
      if (!session) return;

      const updatedSession: EmployeeSession = {
        ...session,
        employee: {
          ...session.employee,
          ...updatedInfo,
        },
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
        setSession(updatedSession);
        console.log("✅ Employee info updated");
      } catch (error) {
        console.error("❌ Error updating employee info:", error);
        throw new Error("ไม่สามารถอัพเดตข้อมูลได้");
      }
    },
    [session]
  );

  // ตรวจสอบว่า session ยังใช้งานได้
  const isSessionValid = useCallback(() => {
    if (!session) return false;

    const loginTime = new Date(session.loginTime).getTime();
    const now = Date.now();

    return now - loginTime < SESSION_DURATION;
  }, [session]);

  // รับข้อมูลสำหรับการส่งออก
  const getSessionInfo = useCallback(() => {
    if (!session) return null;

    return {
      employeeName: session.employee.employeeName,
      branchCode: session.employee.branchCode,
      branchName: session.employee.branchName,
      sessionId: session.sessionId,
      loginTime: session.loginTime,
      sessionDuration: Date.now() - new Date(session.loginTime).getTime(),
    };
  }, [session]);

  // ตรวจสอบเวลาคงเหลือของ session
  const getTimeRemaining = useCallback(() => {
    if (!session) return 0;

    const loginTime = new Date(session.loginTime).getTime();
    const now = Date.now();
    const elapsed = now - loginTime;
    const remaining = SESSION_DURATION - elapsed;

    return Math.max(0, remaining);
  }, [session]);

  // Format เวลาคงเหลือ
  const formatTimeRemaining = useCallback(() => {
    const remaining = getTimeRemaining();
    if (remaining <= 0) return "หมดเวลา";

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours} ชม. ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  }, [getTimeRemaining]);

  // โหลด session เมื่อ component mount
  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

  // ตั้งค่าให้ตรวจสอบ session ทุก ๆ 1 นาที
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      if (!isSessionValid()) {
        console.log("⏰ Session expired during use");
        logout();
      }
    }, 60000); // ตรวจสอบทุก 1 นาที

    return () => clearInterval(interval);
  }, [session, isSessionValid, logout]);

  return {
    // State
    session,
    isLoading,
    isAuthenticated: !!session && isSessionValid(),

    // Employee info shortcuts
    employee: session?.employee || null,
    employeeName: session?.employee.employeeName || "",
    branchCode: session?.employee.branchCode || "",
    branchName: session?.employee.branchName || "",

    // Actions
    login,
    logout,
    updateEmployeeInfo,

    // Utilities
    isSessionValid,
    getSessionInfo,
    getTimeRemaining,
    formatTimeRemaining,
    checkExistingSession,
  };
};
