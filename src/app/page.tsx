// app/page.tsx
"use client"; // สำคัญ! เพราะใช้ hooks และ browser APIs

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Camera,
  Square,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Settings,
} from "lucide-react";

export default function BarcodeDetectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingQueue, setProcessingQueue] = useState(0);
  const lastProcessTime = useRef(0);
  const detectionTimeoutRef = useRef<NodeJS.Timeout>();
  const [lastDetectedCode, setLastDetectedCode] = useState("");
  const [stats, setStats] = useState({
    rotation: 0,
    method: "",
    confidence: 0,
    fps: 0,
    lastProcessTime: 0,
  });
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const [errors, setErrors] = useState("");
  const [videoConstraints, setVideoConstraints] = useState({
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "environment",
  });

  // อัปเดตขนาด Canvas ให้ตรงกับ Video ที่แสดงผล
  const updateCanvasSize = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !containerRef.current)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    // รอให้ video โหลดข้อมูล metadata
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // คำนวณขนาดที่แสดงจริงของ video
    const containerRect = container.getBoundingClientRect();
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;

    let displayWidth, displayHeight;

    if (videoAspectRatio > containerAspectRatio) {
      // Video กว้างกว่า container
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / videoAspectRatio;
    } else {
      // Video สูงกว่า container
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * videoAspectRatio;
    }

    // ตั้งค่า canvas ให้ตรงกับขนาดที่แสดงจริง
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // ปรับ CSS ของ canvas
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.position = "absolute";
    canvas.style.top = "50%";
    canvas.style.left = "50%";
    canvas.style.transform = "translate(-50%, -50%)";

    console.log(
      `Video: ${video.videoWidth}x${video.videoHeight}, Display: ${displayWidth}x${displayHeight}`
    );
  }, []);

  // เริ่มต้นกล้อง
  const startCamera = async () => {
    try {
      setErrors("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);

        // รอให้ video เริ่มเล่น
        videoRef.current.onloadedmetadata = () => {
          setTimeout(updateCanvasSize, 100);
        };

        videoRef.current.onresize = updateCanvasSize;
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
      setDetections([]);
    }
  };

  // สลับกล้อง
  const switchCamera = async () => {
    const newFacingMode =
      videoConstraints.facingMode === "environment" ? "user" : "environment";
    setVideoConstraints((prev) => ({
      ...prev,
      facingMode: newFacingMode,
    }));

    if (isStreaming) {
      stopCamera();
      // รอสักครู่แล้วเริ่มกล้องใหม่
      setTimeout(() => {
        setVideoConstraints((prev) => ({
          ...prev,
          facingMode: newFacingMode,
        }));
        startCamera();
      }, 500);
    }
  };

  // จับภาพและส่งไปยัง backend (Optimized)
  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const now = Date.now();
    // Throttle: ประมวลผลไม่เกิน 2 ครั้งต่อวินาที
    if (now - lastProcessTime.current < 500) return;

    if (processingQueue > 2) return; // ไม่ให้งานค้างเกิน 2 งาน

    setProcessingQueue((prev) => prev + 1);
    lastProcessTime.current = now;

    try {
      const video = videoRef.current;

      // สร้าง canvas สำหรับจับภาพ (ลดความละเอียดเพื่อความเร็ว)
      const captureCanvas = document.createElement("canvas");
      const ctx = captureCanvas.getContext("2d");

      if (!ctx) return;

      // ลดขนาดภาพลงเพื่อความเร็วในการประมวลผล
      const scale = Math.min(
        1,
        800 / Math.max(video.videoWidth, video.videoHeight)
      );
      captureCanvas.width = video.videoWidth * scale;
      captureCanvas.height = video.videoHeight * scale;

      // วาดภาพจากวิดีโอลงบน canvas
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

      // แปลงเป็น blob ด้วยคุณภาพที่ลดลง
      captureCanvas.toBlob(
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

                  // Clear old detections after 3 seconds
                  if (detectionTimeoutRef.current) {
                    clearTimeout(detectionTimeoutRef.current);
                  }
                  detectionTimeoutRef.current = setTimeout(() => {
                    setDetections([]);
                  }, 3000);
                }

                setStats({
                  rotation: result.rotation_angle || 0,
                  method: result.decode_method || "",
                  confidence: result.confidence || 0,
                  fps: Math.round(1000 / (Date.now() - lastFrameTime.current)),
                  lastProcessTime: Date.now() - now,
                });
                lastFrameTime.current = Date.now();

                setErrors("");
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
        0.7 // ลดคุณภาพเพื่อความเร็ว
      );
    } catch (err: any) {
      setErrors("เกิดข้อผิดพลาดในการจับภาพ: " + err.message);
    } finally {
      setProcessingQueue((prev) => prev - 1);
    }
  }, [processingQueue]);

  // ประมวลผลอัตโนมัติ Real-time (Optimized)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStreaming) {
      // ประมวลผลทุก 300ms สำหรับ real-time performance
      interval = setInterval(() => {
        captureAndProcess();
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (detectionTimeoutRef.current)
        clearTimeout(detectionTimeoutRef.current);
    };
  }, [isStreaming, captureAndProcess]);

  // วาด bounding boxes อย่างต่อเนื่อง
  const drawDetections = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    // ล้าง canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detections.length === 0) return;

    // คำนวณอัตราส่วนการขยาย
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    // วาด bounding boxes
    detections.forEach((detection, index) => {
      const x = detection.xmin * scaleX;
      const y = detection.ymin * scaleY;
      const width = (detection.xmax - detection.xmin) * scaleX;
      const height = (detection.ymax - detection.ymin) * scaleY;

      // Animation effect - กรอบกระพริบ
      const time = Date.now() / 1000;
      const opacity = 0.7 + Math.sin(time * 3) * 0.3;

      // วาดกรอบหลัก
      ctx.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // วาดกรอบภายใน
      ctx.strokeStyle = `rgba(0, 255, 0, 0.3)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);

      // วาดจุดมุม
      const cornerSize = 20;
      ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;

      // มุมซ้ายบน
      ctx.fillRect(x - 2, y - 2, cornerSize, 4);
      ctx.fillRect(x - 2, y - 2, 4, cornerSize);

      // มุมขวาบน
      ctx.fillRect(x + width - cornerSize + 2, y - 2, cornerSize, 4);
      ctx.fillRect(x + width - 2, y - 2, 4, cornerSize);

      // มุมซ้ายล่าง
      ctx.fillRect(x - 2, y + height - 2, cornerSize, 4);
      ctx.fillRect(x - 2, y + height - cornerSize + 2, 4, cornerSize);

      // มุมขวาล่าง
      ctx.fillRect(x + width - cornerSize + 2, y + height - 2, cornerSize, 4);
      ctx.fillRect(x + width - 2, y + height - cornerSize + 2, 4, cornerSize);

      // วาดเส้นสแกน
      const scanY = y + (Math.sin(time * 4) * 0.5 + 0.5) * height;
      ctx.strokeStyle = `rgba(255, 255, 0, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, scanY);
      ctx.lineTo(x + width, scanY);
      ctx.stroke();

      // วาดป้ายกำกับ
      const label = `🔍 Barcode ${(detection.confidence * 100).toFixed(1)}%`;
      ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
      ctx.font = "bold 14px Arial";
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width;
      const textHeight = 18;

      // พื้นหลังป้าย
      ctx.fillRect(x, y - textHeight - 10, textWidth + 10, textHeight + 8);

      // ข้อความ
      ctx.fillStyle = "#000000";
      ctx.fillText(label, x + 5, y - 5);
    });
  }, [detections]);

  // Real-time Canvas Animation
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      drawDetections();
      updateCanvasSize(); // อัปเดตขนาดต่อเนื่อง
      animationId = requestAnimationFrame(animate);
    };

    if (isStreaming) {
      animate();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isStreaming, drawDetections, updateCanvasSize]);

  // อัปเดตขนาดเมื่อ window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(updateCanvasSize, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCanvasSize]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 flex items-center justify-center gap-3">
          <Camera className="text-blue-400" />
          ระบบตรวจจับ Barcode
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4 md:p-6">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                  <Square className="text-green-400" />
                  กล้อง
                </h2>
                <div className="flex flex-wrap gap-2">
                  {!isStreaming ? (
                    <button
                      onClick={startCamera}
                      className="bg-green-600 hover:bg-green-700 px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
                    >
                      <Play size={18} />
                      เริ่ม
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="bg-red-600 hover:bg-red-700 px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
                    >
                      <Pause size={18} />
                      หยุด
                    </button>
                  )}

                  <button
                    onClick={switchCamera}
                    disabled={!isStreaming}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
                  >
                    <RotateCcw size={18} />
                    สลับ
                  </button>

                  <button
                    onClick={captureAndProcess}
                    disabled={!isStreaming}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
                  >
                    <Zap size={18} />
                    {processingQueue > 0
                      ? `ประมวลผล... (${processingQueue})`
                      : "ประมวลผล"}
                  </button>
                </div>
              </div>

              <div
                ref={containerRef}
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: "16/9", minHeight: "300px" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    mixBlendMode: "screen",
                    zIndex: 10,
                  }}
                />

                {processingQueue > 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-20">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      กำลังประมวลผล... ({processingQueue})
                    </div>
                  </div>
                )}

                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Camera size={48} className="mx-auto mb-2 opacity-50" />
                      <p>กดปุ่ม "เริ่ม" เพื่อเปิดกล้อง</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 text-sm text-gray-400 space-y-1">
                <p>
                  💡 เคล็ดลับ:
                  วางบาร์โค้ดให้อยู่ในกรอบและรอระบบประมวลผลอัตโนมัติ
                </p>
                <p className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      processingQueue > 0
                        ? "bg-orange-400 animate-pulse"
                        : "bg-green-400"
                    }`}
                  ></span>
                  <span className="text-xs">
                    Real-time detection:{" "}
                    {processingQueue > 0 ? "ทำงาน" : "พร้อม"}| ประมวลผลทุก 300ms
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4 md:space-y-6">
            {/* Detection Stats */}
            <div className="bg-gray-800 rounded-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="text-purple-400" />
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
                  <span className="text-purple-400 font-mono text-xs md:text-sm">
                    {stats.method || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">ความแม่นยำ:</span>
                  <span className="text-purple-400 font-mono">
                    {(stats.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">กล้อง:</span>
                  <span className="text-purple-400 font-mono text-xs">
                    {videoConstraints.facingMode === "environment"
                      ? "หลัง"
                      : "หน้า"}
                  </span>
                </div>
                <hr className="border-gray-600" />
                <div className="flex justify-between">
                  <span className="text-gray-300">ประมวลผล/วินาที:</span>
                  <span className="text-yellow-400 font-mono">
                    {Math.round(1000 / 300).toFixed(1)} FPS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">เวลาประมวลผล:</span>
                  <span className="text-yellow-400 font-mono">
                    {stats.lastProcessTime}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">คิวงาน:</span>
                  <span
                    className={`font-mono ${
                      processingQueue > 0 ? "text-orange-400" : "text-green-400"
                    }`}
                  >
                    {processingQueue}/3
                  </span>
                </div>
              </div>
            </div>

            {/* Last Detected Code */}
            {lastDetectedCode && (
              <div className="bg-green-900 border border-green-600 rounded-lg p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-3 text-green-400">
                  ผลลัพธ์ล่าสุด
                </h3>
                <div className="bg-black rounded-lg p-3 md:p-4">
                  <code className="text-green-400 text-sm md:text-lg font-mono break-all">
                    {lastDetectedCode}
                  </code>
                </div>
                <div className="mt-2 text-xs text-green-300">
                  คลิกเพื่อคัดลอก: {lastDetectedCode.substring(0, 20)}...
                </div>
              </div>
            )}

            {/* Detections List */}
            <div className="bg-gray-800 rounded-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">
                รายการที่ตรวจพบ ({detections.length})
              </h3>
              {detections.length > 0 ? (
                <div className="space-y-2 max-h-40 md:max-h-48 overflow-y-auto">
                  {detections.map((detection, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400 text-sm md:text-base">
                          Barcode #{index + 1}
                        </span>
                        <span className="text-gray-300 text-xs md:text-sm">
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
                <p className="text-gray-400 text-center text-sm md:text-base">
                  ยังไม่พบ barcode
                </p>
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
