"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, Wifi, WifiOff } from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

export default function BarcodeDetector() {
  const [results, setResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState("disconnected");
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const wsRef = useRef(null);

  // เชื่อมต่อ WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(`ws://localhost:8000/ws`);

      ws.onopen = () => {
        console.log("🔗 Connected to WebSocket");
        setIsConnected(true);
        setError("");

        // ส่ง ping เพื่อทดสอบการเชื่อมต่อ
        ws.send(JSON.stringify({ type: "ping" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "barcode_detected") {
            // เพิ่มผลลัพธ์ใหม่
            setResults((prev) => [...data.results, ...prev]);
          } else if (data.type === "pong") {
            console.log("📡 WebSocket connection active");
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        console.log("❌ WebSocket disconnected");
        setIsConnected(false);
        setIsScanning(false);

        // พยายามเชื่อมต่อใหม่หลัง 3 วินาที
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("การเชื่อมต่อ WebSocket ล้มเหลว");
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (e) {
      setError("ไม่สามารถเชื่อมต่อ WebSocket ได้");
      setIsConnected(false);
    }
  }, []);

  // ตรวจสอบสถานะ API
  const checkApiStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      const data = await response.json();

      if (response.ok) {
        setApiStatus("connected");
        setError("");
      } else {
        setApiStatus("error");
        setError("API ไม่ตอบสนอง");
      }
    } catch (e) {
      setApiStatus("disconnected");
      setError(
        "ไม่สามารถเชื่อมต่อ API ได้ - ตรวจสอบว่า Python backend ทำงานอยู่"
      );
    }
  }, []);

  // เริ่มการสแกนจากกล้อง (แบบใหม่: Frontend จัดการกล้อง)
  const startCameraScanning = useCallback(async () => {
    try {
      // ขอ permission กล้อง
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsScanning(true);
      setError("");

      // เริ่ม loop การสแกนรูปภาพจาก video
      scanIntervalRef.current = setInterval(captureAndScan, 1000); // scan ทุก 1 วินาที
    } catch (e) {
      setError("ไม่สามารถเข้าถึงกล้องได้: " + e.message);
    }
  }, []);

  // หยุดการสแกนจากกล้อง (แบบใหม่)
  const stopCameraScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setIsScanning(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // จับภาพจาก video และส่งไป scan
  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !isScanning) return;

    try {
      // สร้าง canvas เพื่อจับภาพจาก video
      const canvas = document.createElement("canvas");
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      // แปลงเป็น base64
      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      // ส่งไป backend scan
      const response = await fetch(`${API_BASE_URL}/scan-base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();

      if (data.success && data.results.length > 0) {
        // เพิ่มผลลัพธ์ใหม่ (ป้องกันการซ้ำ)
        const newResults = data.results.filter(
          (newResult) =>
            !results.some(
              (existingResult) =>
                existingResult.data === newResult.data &&
                Date.now() - new Date(existingResult.timestamp).getTime() < 3000 // ป้องกันซ้ำภายใน 3 วินาที
            )
        );

        if (newResults.length > 0) {
          setResults((prev) => [...newResults, ...prev]);
        }
      }
    } catch (e) {
      console.error("Error capturing and scanning:", e);
    }
  }, [isScanning, results]);

  // สแกนจากไฟล์
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/scan-file`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (data.results.length > 0) {
          setResults((prev) => [...data.results, ...prev]);
          setError("");
        } else {
          setError("ไม่พบบาร์โค้ดในรูปภาพ");
        }
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการสแกนไฟล์");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
    }

    // เคลียร์ file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // ล้างผลลัพธ์
  const clearResults = useCallback(() => {
    setResults([]);
    setError("");
  }, []);

  // เชื่อมต่อ WebSocket เมื่อ component mount
  useEffect(() => {
    checkApiStatus();
    connectWebSocket();

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [checkApiStatus, connectWebSocket]);

  // ตรวจสอบสถานะ API ทุก 10 วินาที
  useEffect(() => {
    const interval = setInterval(checkApiStatus, 10000);
    return () => clearInterval(interval);
  }, [checkApiStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔍 Barcode Scanner
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                apiStatus === "connected"
                  ? "bg-green-100 text-green-700"
                  : apiStatus === "disconnected"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {apiStatus === "connected" ? "🟢" : "🔴"}
              API: {apiStatus}
            </div>

            {/* Controls */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                isConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              WebSocket: {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">⚠️ {error}</p>
            {apiStatus === "disconnected" && (
              <p className="text-sm mt-2">
                💡 ตรวจสอบว่า Python backend ทำงานอยู่:{" "}
                <code>python backend/main.py</code>
              </p>
            )}
          </div>
        )}

        {/* Video display */}
        <div className="bg-gray-100 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            📹 Camera View
          </h2>
          <div
            className="relative bg-black rounded-lg overflow-hidden"
            style={{ height: "400px" }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                isScanning ? "block" : "hidden"
              }`}
            />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Camera size={64} className="mx-auto mb-4" />
                  <p>กดปุ่ม "📹 เริ่มกล้อง" เพื่อเริ่มสแกน</p>
                </div>
              </div>
            )}
            {isScanning && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                🔴 LIVE
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* File Upload */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={apiStatus !== "connected"}
            />
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                apiStatus === "connected"
                  ? "border-blue-300 hover:border-blue-400 cursor-pointer"
                  : "border-gray-300 cursor-not-allowed bg-gray-50"
              }`}
            >
              <Upload
                size={32}
                className={`mx-auto mb-2 ${
                  apiStatus === "connected" ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <p
                className={`text-sm ${
                  apiStatus === "connected" ? "text-blue-600" : "text-gray-500"
                }`}
              >
                📁 คลิกเพื่อเลือกรูปภาพ
              </p>
            </div>
          </div>

          {/* Camera Control */}
          <div className="flex flex-col gap-2">
            {!isScanning ? (
              <button
                onClick={startCameraScanning}
                disabled={!isConnected || apiStatus !== "connected"}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <Camera size={20} />
                📹 เริ่มกล้อง
              </button>
            ) : (
              <button
                onClick={stopCameraScanning}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                ⏹️ หยุดกล้อง
              </button>
            )}

            {isScanning && (
              <div className="text-center text-sm text-green-600 font-medium">
                🎥 กล้องกำลังทำงาน...
              </div>
            )}
          </div>

          {/* Clear Results */}
          <button
            onClick={clearResults}
            className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🗑️ ล้างผลลัพธ์
          </button>
        </div>

        {/* Results */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 ผลลัพธ์ ({results.length})
          </h2>

          {results.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>ยังไม่มีผลลัพธ์</p>
              <p className="text-sm mt-2">
                อัปโหลดรูปภาพหรือเริ่มใช้กล้องเพื่อสแกนบาร์โค้ด
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {result.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {result.timestamp}
                        </span>
                      </div>
                      <p className="font-mono text-lg text-gray-800 break-all">
                        {result.data}
                      </p>
                      {result.position && (
                        <p className="text-xs text-gray-500 mt-1">
                          ตำแหน่ง: ({result.position.x}, {result.position.y})
                          ขนาด: {result.position.width}×{result.position.height}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.data)}
                      className="ml-4 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            💡 <strong>วิธีใช้:</strong>{" "}
            อัปโหลดรูปภาพหรือใช้กล้องเพื่อสแกนบาร์โค้ด QR Code
            หรือบาร์โค้ดประเภทต่างๆ
          </p>
          <p className="mt-1">
            🔧 <strong>Backend:</strong> Python FastAPI + OpenCV + pyzbar
          </p>
        </div>
      </div>
    </div>
  );
}
