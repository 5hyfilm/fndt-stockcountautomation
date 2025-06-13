# Path: /backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import cv2
import numpy as np
from pyzbar import pyzbar 
from collections import defaultdict
import math
import io
from PIL import Image
import base64

app = Flask(__name__)
CORS(app)  # เปิดใช้ CORS สำหรับ frontend

# โหลดโมเดล YOLOv5
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
try:
    model = torch.hub.load('ultralytics/yolov5', 'custom', path='model.pt').to(device)
    print("✅ โหลดโมเดลสำเร็จ")
except Exception as e:
    print(f"⚠️ ไม่สามารถโหลดโมเดลได้: {e}")
    model = None

def detect_line_segments(image):
    """
    Detect line segments using LSD algorithm (Stage 1.2 from paper)
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    lsd = cv2.createLineSegmentDetector()
    lines = lsd.detect(gray)[0]
    
    if lines is not None:
        lines = lines.reshape(-1, 4)
    
    return lines

def calculate_line_angles_and_lengths(lines):
    """
    Calculate angles and lengths of line segments
    """
    if lines is None or len(lines) == 0:
        return [], []
    
    angles = []
    lengths = []
    
    for line in lines:
        x1, y1, x2, y2 = line
        
        length = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        lengths.append(length)
        
        angle = math.atan2(y2 - y1, x2 - x1) * 180 / math.pi
        if angle < 0:
            angle += 180
        angles.append(angle)
    
    return angles, lengths

def predict_rotation_angle(angles, lengths, angle_tolerance=5):
    """
    Predict rotation angle by clustering line angles
    """
    if not angles or not lengths:
        return 0
    
    angle_weights = defaultdict(float)
    
    for angle, length in zip(angles, lengths):
        rounded_angle = round(angle)
        angle_weights[rounded_angle] += length
    
    if angle_weights:
        best_angle = max(angle_weights.items(), key=lambda x: x[1])[0]
        return best_angle
    
    return 0

def rotate_image(image, angle):
    """
    Rotate image by given angle
    """
    if angle == 0:
        return image
    
    height, width = image.shape[:2]
    center = (width // 2, height // 2)
    
    # คำนวณ rotation matrix
    rotation_matrix = cv2.getRotationMatrix2D(center, -angle, 1.0)
    
    # คำนวณขนาดใหม่หลังหมุน
    cos = np.abs(rotation_matrix[0, 0])
    sin = np.abs(rotation_matrix[0, 1])
    
    new_width = int((height * sin) + (width * cos))
    new_height = int((height * cos) + (width * sin))
    
    # ปรับ translation
    rotation_matrix[0, 2] += (new_width / 2) - center[0]
    rotation_matrix[1, 2] += (new_height / 2) - center[1]
    
    # หมุนรูปภาพ
    rotated = cv2.warpAffine(image, rotation_matrix, (new_width, new_height))
    
    return rotated

def scan_barcodes_pyzbar(image):
    """
    Scan barcodes using pyzbar
    """
    try:
        # แปลงเป็น grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # ค้นหาบาร์โค้ด
        barcodes = pyzbar.decode(gray)
        
        results = []
        for barcode in barcodes:
            # แปลง data เป็น string
            barcode_data = barcode.data.decode('utf-8')
            barcode_type = barcode.type
            
            # ตำแหน่งของบาร์โค้ด
            rect = barcode.rect
            
            results.append({
                'data': barcode_data,
                'format': barcode_type,
                'position': {
                    'x': rect.left,
                    'y': rect.top,
                    'width': rect.width,
                    'height': rect.height
                }
            })
        
        return results
    
    except Exception as e:
        print(f"Error in pyzbar scanning: {e}")
        return []

def process_detections(frame):
    """
    Process frame and detect barcodes
    """
    try:
        detection_results = []
        barcode_results = []
        
        # วิธีที่ 1: ใช้ pyzbar แบบปกติ
        barcodes = scan_barcodes_pyzbar(frame)
        
        if barcodes:
            for barcode in barcodes:
                detection_results.append({
                    'format': barcode['format'],
                    'data': barcode['data'],
                    'position': barcode['position'],
                    'confidence': 0.9  # Default confidence สำหรับ pyzbar
                })
                
                barcode_results.append({
                    'barcode': barcode['data'],
                    'format': barcode['format'],
                    'confidence': 0.9,
                    'decode_method': 'pyzbar_direct',
                    'rotation_angle': 0
                })
        
        # วิธีที่ 2: ถ้าไม่เจอ ลองหมุนรูป
        if not barcodes:
            print("🔄 ไม่เจอบาร์โค้ด ลองหมุนรูป...")
            
            # ตรวจหา line segments เพื่อประเมิน rotation angle
            lines = detect_line_segments(frame)
            angles, lengths = calculate_line_angles_and_lengths(lines)
            rotation_angle = predict_rotation_angle(angles, lengths)
            
            print(f"📐 Predicted rotation angle: {rotation_angle}")
            
            # ลองหมุนรูปตาม angle ที่คำนวณได้
            if rotation_angle != 0:
                rotated = rotate_image(frame, rotation_angle)
                barcodes_rotated = scan_barcodes_pyzbar(rotated)
                
                if barcodes_rotated:
                    for barcode in barcodes_rotated:
                        detection_results.append({
                            'format': barcode['format'],
                            'data': barcode['data'],
                            'position': barcode['position'],
                            'confidence': 0.85
                        })
                        
                        barcode_results.append({
                            'barcode': barcode['data'],
                            'format': barcode['format'],
                            'confidence': 0.85,
                            'decode_method': 'pyzbar_rotated',
                            'rotation_angle': rotation_angle
                        })
            
            # ถ้ายังไม่เจอ ลองหมุนทุก ๆ 90 องศา
            if not barcode_results:
                print("🔄 ลองหมุนทุก 90 องศา...")
                for angle in [90, 180, 270]:
                    rotated = rotate_image(frame, angle)
                    barcodes_rotated = scan_barcodes_pyzbar(rotated)
                    
                    if barcodes_rotated:
                        for barcode in barcodes_rotated:
                            detection_results.append({
                                'format': barcode['format'],
                                'data': barcode['data'],
                                'position': barcode['position'],
                                'confidence': 0.8
                            })
                            
                            barcode_results.append({
                                'barcode': barcode['data'],
                                'format': barcode['format'],
                                'confidence': 0.8,
                                'decode_method': f'pyzbar_rotated_{angle}',
                                'rotation_angle': angle
                            })
                        break
        
        return {
            'success': True,
            'detections': detection_results,
            'barcodes': barcode_results,
            'barcodes_found': len(barcode_results),
            'rotation_angle': barcode_results[0]['rotation_angle'] if barcode_results else 0,
            'decode_method': barcode_results[0]['decode_method'] if barcode_results else '',
            'confidence': barcode_results[0]['confidence'] if barcode_results else 0
        }
        
    except Exception as e:
        print(f"Error in process_detections: {e}")
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/api/detect-barcode', methods=['POST'])
def detect_barcode():
    try:
        # ตรวจสอบว่ามีไฟล์รูปภาพหรือไม่
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'ไม่พบไฟล์รูปภาพ'
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'ไม่ได้เลือกไฟล์'
            }), 400
        
        # อ่านรูปภาพ
        image_bytes = file.read()
        
        # แปลงเป็น numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({
                'success': False,
                'error': 'ไม่สามารถอ่านไฟล์รูปภาพได้'
            }), 400
        
        # ประมวลผล
        result = process_detections(frame)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in detect_barcode endpoint: {e}")
        return jsonify({
            'success': False,
            'error': f'เกิดข้อผิดพลาดในการประมวลผล: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': str(device)
    })

if __name__ == '__main__':
    print(f"🚀 Starting server on device: {device}")
    print(f"📱 Model loaded: {model is not None}")
    app.run(host='0.0.0.0', port=8000, debug=True)