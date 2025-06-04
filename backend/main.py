# backend/main_opencv.py
# FastAPI Backend สำหรับ Barcode Scanner (ใช้ OpenCV แทน pyzbar)
# ติดตั้ง: pip install fastapi uvicorn python-multipart opencv-contrib-python pillow

from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import base64
import json
import asyncio
import threading
from typing import List
import time
from dataclasses import dataclass, asdict

app = FastAPI(title="Barcode Scanner API", version="1.0.0")

# CORS สำหรับ React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@dataclass
class BarcodeResult:
    type: str
    data: str
    position: dict
    timestamp: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                if connection in self.active_connections:
                    self.active_connections.remove(connection)

manager = ConnectionManager()

def detect_barcodes_from_image(image_data):
    """ตรวจหา barcode จากรูปภาพด้วย OpenCV"""
    try:
        # แปลงข้อมูลรูปภาพ
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return []
        
        # สร้าง BarcodeDetector (OpenCV)
        detector = cv2.barcode.BarcodeDetector()
        
        # ตรวจหา barcode
        retval, decoded_info, decoded_type, points = detector.detectAndDecode(image)
        
        results = []
        if retval:
            for i, (info, dtype, point_set) in enumerate(zip(decoded_info, decoded_type, points)):
                if info:  # ถ้ามีข้อมูล
                    # คำนวณ bounding box จาก points
                    if len(point_set) > 0:
                        x_coords = [p[0] for p in point_set]
                        y_coords = [p[1] for p in point_set]
                        x, y = int(min(x_coords)), int(min(y_coords))
                        w = int(max(x_coords) - min(x_coords))
                        h = int(max(y_coords) - min(y_coords))
                    else:
                        x, y, w, h = 0, 0, 0, 0
                    
                    result = BarcodeResult(
                        type=dtype if dtype else "UNKNOWN",
                        data=info,
                        position={"x": x, "y": y, "width": w, "height": h},
                        timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
                    )
                    results.append(result)
        
        return results
    
    except Exception as e:
        print(f"Error detecting barcodes: {e}")
        return []

@app.get("/")
async def root():
    return {"message": "Barcode Scanner API (OpenCV)", "status": "running"}

@app.post("/scan-file")
async def scan_file(file: UploadFile = File(...)):
    """สแกน barcode จากไฟล์รูปภาพ"""
    try:
        # ตรวจสอบประเภทไฟล์
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # อ่านข้อมูลไฟล์
        image_data = await file.read()
        
        # ตรวจหา barcode
        results = detect_barcodes_from_image(image_data)
        
        return {
            "success": True,
            "filename": file.filename,
            "barcodes_found": len(results),
            "results": [asdict(result) for result in results]
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/scan-base64")
async def scan_base64_image(data: dict):
    """สแกน barcode จากรูปภาพ base64"""
    try:
        # แปลง base64 เป็น image
        image_data = base64.b64decode(data["image"].split(",")[1])
        
        # ตรวจหา barcode
        results = detect_barcodes_from_image(image_data)
        
        return {
            "success": True,
            "barcodes_found": len(results),
            "results": [asdict(result) for result in results]
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

# Camera scanning globals
camera_scanning = False
cap = None

def camera_scan_worker():
    """Worker thread สำหรับการสแกนจากกล้อง"""
    global camera_scanning, cap
    
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ Cannot open camera")
            return
        
        detector = cv2.barcode.BarcodeDetector()
        
        while camera_scanning:
            ret, frame = cap.read()
            if not ret:
                break
            
            # ตรวจหา barcode
            retval, decoded_info, decoded_type, points = detector.detectAndDecode(frame)
            
            if retval and any(decoded_info):
                results = []
                for i, (info, dtype, point_set) in enumerate(zip(decoded_info, decoded_type, points)):
                    if info:  # ถ้ามีข้อมูล
                        # คำนวณ bounding box
                        if len(point_set) > 0:
                            x_coords = [p[0] for p in point_set]
                            y_coords = [p[1] for p in point_set]
                            x, y = int(min(x_coords)), int(min(y_coords))
                            w = int(max(x_coords) - min(x_coords))
                            h = int(max(y_coords) - min(y_coords))
                        else:
                            x, y, w, h = 0, 0, 0, 0
                        
                        result = BarcodeResult(
                            type=dtype if dtype else "UNKNOWN",
                            data=info,
                            position={"x": x, "y": y, "width": w, "height": h},
                            timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
                        )
                        results.append(result)
                
                # ส่งผลลัพธ์ไปยัง WebSocket clients
                if results:
                    message = {
                        "type": "barcode_detected",
                        "results": [asdict(result) for result in results]
                    }
                    
                    # ส่งไปยัง clients ทั้งหมด
                    asyncio.run(manager.broadcast(json.dumps(message)))
            
            time.sleep(0.1)  # ลด CPU usage
    
    except Exception as e:
        print(f"Camera scan error: {e}")
    
    finally:
        if cap:
            cap.release()

@app.post("/camera/start")
async def start_camera():
    """เริ่มการสแกนจากกล้อง"""
    global camera_scanning
    
    if camera_scanning:
        return {"success": False, "message": "Camera already running"}
    
    camera_scanning = True
    
    # เริ่ม thread สำหรับ camera scanning
    scan_thread = threading.Thread(target=camera_scan_worker)
    scan_thread.daemon = True
    scan_thread.start()
    
    return {"success": True, "message": "Camera started"}

@app.post("/camera/stop")
async def stop_camera():
    """หยุดการสแกนจากกล้อง"""
    global camera_scanning, cap
    
    camera_scanning = False
    
    if cap:
        cap.release()
        cap = None
    
    return {"success": True, "message": "Camera stopped"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint สำหรับ real-time communication"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await manager.send_personal_message(
                    json.dumps({"type": "pong"}),
                    websocket
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/status")
async def get_status():
    """ตรวจสอบสถานะ API"""
    return {
        "api_status": "running",
        "camera_scanning": camera_scanning,
        "active_connections": len(manager.active_connections),
        "detector": "OpenCV"
    }

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting Barcode Scanner API (OpenCV)...")
    print("📡 API will be available at: http://localhost:8000")
    print("📖 API docs at: http://localhost:8000/docs")
    print("🔧 Using OpenCV barcode detector (no pyzbar dependency)")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )