// app/page.tsx
"use client"; // สำคัญ! เพราะใช้ hooks และ browser APIs

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Camera, Square, Play, Pause, RotateCcw, Zap } from "lucide-react";

export default function BarcodeDetectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDetectedCode, setLastDetectedCode] = useState("");
  const [stats, setStats] = useState({
    rotation: 0,
    method: "",
    confidence: 0,
  });
  const [errors, setErrors] = useState("");

  // เริ่มต้นกล้อง
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment", // ใช้กล้องหลัง
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setErrors("");
      }
    } catch (err: any) {
      setErrors("ไม่สามารถเข้าถึงกล้องได้: " + err.message);
      console.error("Camera error:", err);
    }
  };

  // หยุดกล้อง
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  // จับภาพและส่งไปยัง backend
  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // ตั้งค่าขนาด canvas ให้เท่ากับวิดีโอ
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // วาดภาพจากวิดีโอลงบน canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // แปลงเป็น blob
      canvas.toBlob(
        async (blob) => {
          if (!blob) return;

          const formData = new FormData();
          formData.append("image", blob, "frame.jpg");

          try {
            // ส่งไปยัง API route
            const response = await fetch("/api/detect-barcode", {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              const result = await response.json();

              if (result.success) {
                setDetections(result.detections || []);

                if (result.barcodes && result.barcodes.length > 0) {
                  setLastDetectedCode(result.barcodes[0].data);
                }

                setStats({
                  rotation: result.rotation_angle || 0,
                  method: result.decode_method || "",
                  confidence: result.confidence || 0,
                });
              } else {
                setErrors(result.error || "เกิดข้อผิดพลาดในการประมวลผล");
              }
            } else {
              setErrors("เกิดข้อผิดพลาดในการเชื่อมต่อ backend");
            }
          } catch (err: any) {
            setErrors("เกิดข้อผิดพลาดในการส่งข้อมูล: " + err.message);
          }
        },
        "image/jpeg",
        0.8
      );
    } catch (err: any) {
      setErrors("เกิดข้อผิดพลาดในการจับภาพ: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // ประมวลผลอัตโนมัติทุก 1 วินาที
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming && !isProcessing) {
      interval = setInterval(captureAndProcess, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, isProcessing, captureAndProcess]);

  // วาด bounding boxes บนวิดีโอ
  const drawDetections = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || detections.length === 0)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // ล้าง canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // คำนวณอัตราส่วนการขยาย
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    // วาด bounding boxes
    detections.forEach((detection, index) => {
      const x = detection.xmin * scaleX;
      const y = detection.ymin * scaleY;
      const width = (detection.xmax - detection.xmin) * scaleX;
      const height = (detection.ymax - detection.ymin) * scaleY;

      // วาดกรอบ
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // วาดป้ายกำกับ
      const label = `Barcode ${(detection.confidence * 100).toFixed(1)}%`;
      ctx.fillStyle = "#00ff00";
      ctx.font = "16px Arial";
      const textWidth = ctx.measureText(label).width;

      ctx.fillRect(x, y - 25, textWidth + 10, 25);
      ctx.fillStyle = "#000000";
      ctx.fillText(label, x + 5, y - 5);
    });
  }, [detections]);

  // วาด detections เมื่อมีการอัปเดต
  useEffect(() => {
    drawDetections();
  }, [detections, drawDetections]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3">
          <Camera className="text-blue-400" />
          ระบบตรวจจับ Barcode
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Square className="text-green-400" />
                  กล้อง
                </h2>
                <div className="flex gap-2">
                  {!isStreaming ? (
                    <button
                      onClick={startCamera}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Play size={20} />
                      เริ่ม
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Pause size={20} />
                      หยุด
                    </button>
                  )}
                  <button
                    onClick={captureAndProcess}
                    disabled={!isStreaming || isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Zap size={20} />
                    {isProcessing ? "กำลังประมวลผล..." : "ประมวลผล"}
                  </button>
                </div>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-96 object-contain"
                  onLoadedMetadata={() => {
                    if (canvasRef.current && videoRef.current) {
                      canvasRef.current.width = videoRef.current.videoWidth;
                      canvasRef.current.height = videoRef.current.videoHeight;
                    }
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ mixBlendMode: "screen" }}
                />

                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      กำลังประมวลผล...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Detection Stats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RotateCcw className="text-purple-400" />
                สถิติการตรวจจับ
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">มุมหมุน:</span>
                  <span className="text-purple-400 font-mono">
                    {stats.rotation.toFixed(1)}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">วิธีการ:</span>
                  <span className="text-purple-400 font-mono text-sm">
                    {stats.method || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">ความแม่นยำ:</span>
                  <span className="text-purple-400 font-mono">
                    {(stats.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Last Detected Code */}
            {lastDetectedCode && (
              <div className="bg-green-900 border border-green-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3 text-green-400">
                  ผลลัพธ์ล่าสุด
                </h3>
                <div className="bg-black rounded-lg p-4">
                  <code className="text-green-400 text-lg font-mono break-all">
                    {lastDetectedCode}
                  </code>
                </div>
              </div>
            )}

            {/* Detections List */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                รายการที่ตรวจพบ ({detections.length})
              </h3>
              {detections.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detections.map((detection, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400">
                          Barcode #{index + 1}
                        </span>
                        <span className="text-gray-300 text-sm">
                          {(detection.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        X: {detection.xmin.toFixed(0)}-
                        {detection.xmax.toFixed(0)}, Y:{" "}
                        {detection.ymin.toFixed(0)}-{detection.ymax.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center">ยังไม่พบ barcode</p>
              )}
            </div>

            {/* Errors */}
            {errors && (
              <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                <h3 className="text-red-400 font-semibold mb-2">ข้อผิดพลาด</h3>
                <p className="text-red-300 text-sm">{errors}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
