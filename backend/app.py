# backend/app.py
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
    
    rotation_matrix = cv2.getRotationMatrix2D(center, -angle, 1.0)
    rotated = cv2.warpAffine(image, rotation_matrix, (width, height), 
                            flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    
    return rotated

def filter_lines_by_angle(lines, target_angle, angle_tolerance=10, min_length=10):
    """
    Filter line segments based on target angle and minimum length
    """
    if lines is None or len(lines) == 0:
        return []
    
    filtered_lines = []
    
    for line in lines:
        x1, y1, x2, y2 = line
        
        length = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        
        if length < min_length:
            continue
        
        angle = math.atan2(y2 - y1, x2 - x1) * 180 / math.pi
        if angle < 0:
            angle += 180
        
        angle_diff = min(abs(angle - target_angle), 
                        abs(angle - target_angle + 180),
                        abs(angle - target_angle - 180))
        
        if angle_diff <= angle_tolerance:
            filtered_lines.append(line)
    
    return filtered_lines

def create_convex_hull_mask(image_shape, lines):
    """
    Create mask from convex hull of line segment endpoints
    """
    if not lines:
        return np.zeros(image_shape[:2], dtype=np.uint8)
    
    points = []
    for line in lines:
        x1, y1, x2, y2 = line
        points.extend([(int(x1), int(y1)), (int(x2), int(y2))])
    
    if len(points) < 3:
        return np.zeros(image_shape[:2], dtype=np.uint8)
    
    points = np.array(points, dtype=np.int32)
    hull = cv2.convexHull(points)
    
    mask = np.zeros(image_shape[:2], dtype=np.uint8)
    cv2.fillPoly(mask, [hull], 255)
    
    return mask

def preprocess_for_decoding(image):
    """
    Advanced preprocessing to improve barcode readability
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    processed_images = []
    
    # Method 1: Original grayscale
    processed_images.append(("original", gray))
    
    # Method 2: Gaussian blur + threshold
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    _, thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(("otsu", thresh1))
    
    # Method 3: Adaptive threshold
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY, 11, 2)
    processed_images.append(("adaptive", adaptive))
    
    # Method 4: Morphological operations
    kernel = np.ones((2,2), np.uint8)
    morph = cv2.morphologyEx(thresh1, cv2.MORPH_CLOSE, kernel)
    processed_images.append(("morph", morph))
    
    # Method 5: Histogram equalization
    equalized = cv2.equalizeHist(gray)
    _, thresh_eq = cv2.threshold(equalized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(("equalized", thresh_eq))
    
    # Method 6: Contrast enhancement
    enhanced = cv2.convertScaleAbs(gray, alpha=1.5, beta=30)
    _, thresh_enh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(("enhanced", thresh_enh))
    
    return processed_images

def try_multiple_decoding_methods(image):
    """
    Try multiple preprocessing methods for better decoding
    """
    processed_images = preprocess_for_decoding(image)
    
    for method_name, processed_img in processed_images:
        scales = [1.0, 1.5, 2.0, 0.8]
        
        for scale in scales:
            if scale != 1.0:
                height, width = processed_img.shape
                new_width = int(width * scale)
                new_height = int(height * scale)
                scaled_img = cv2.resize(processed_img, (new_width, new_height), 
                                      interpolation=cv2.INTER_CUBIC)
            else:
                scaled_img = processed_img
            
            barcodes = pyzbar.decode(scaled_img)
            if barcodes:
                print(f"✅ Decoded with method: {method_name}, scale: {scale}")
                return barcodes, scaled_img, method_name
    
    return [], None, "failed"

def enhanced_barcode_detection(cropped_img):
    """
    Enhanced barcode detection following the paper's methodology
    """
    original_height, original_width = cropped_img.shape[:2]
    
    # Resize if too small
    if original_width < 100:
        scale_factor = 100 / original_width
        new_width = int(original_width * scale_factor)
        new_height = int(original_height * scale_factor)
        cropped_img = cv2.resize(cropped_img, (new_width, new_height), 
                               interpolation=cv2.INTER_CUBIC)
        print(f"🔍 Upscaled image: {original_width}x{original_height} -> {new_width}x{new_height}")
    
    # Try multiple decoding methods first
    barcodes, best_img, method = try_multiple_decoding_methods(cropped_img)
    if barcodes:
        return barcodes, best_img, 0, [], method
    
    # Stage 1.2: Line Segment Detection
    lines = detect_line_segments(cropped_img)
    
    if lines is None or len(lines) == 0:
        print("⚠️ No lines detected, using original processing")
        return barcodes, best_img if best_img is not None else cv2.cvtColor(cropped_img, cv2.COLOR_BGR2GRAY), 0, [], "fallback"
    
    angles, lengths = calculate_line_angles_and_lengths(lines)
    rotation_angle = predict_rotation_angle(angles, lengths)
    print(f"🔄 Detected rotation angle: {rotation_angle}°")
    
    # Stage 2.1: Rotate image
    rotated_img = rotate_image(cropped_img, rotation_angle)
    
    barcodes, best_img, method = try_multiple_decoding_methods(rotated_img)
    if barcodes:
        return barcodes, best_img, rotation_angle, [], f"rotated_{method}"
    
    # Stage 2.2: Filter lines and create region
    rotated_lines = detect_line_segments(rotated_img)
    
    if rotated_lines is not None:
        filtered_lines = filter_lines_by_angle(rotated_lines, 0, angle_tolerance=15)
        if len(filtered_lines) < 3:
            filtered_lines = filter_lines_by_angle(rotated_lines, 90, angle_tolerance=15)
        
        print(f"📏 Found {len(filtered_lines)} filtered lines")
        
        if filtered_lines:
            mask = create_convex_hull_mask(rotated_img.shape, filtered_lines)
            masked_img = cv2.bitwise_and(rotated_img, rotated_img, mask=mask)
            
            barcodes, best_img, method = try_multiple_decoding_methods(masked_img)
            if barcodes:
                return barcodes, best_img, rotation_angle, filtered_lines, f"masked_{method}"
    
    gray = cv2.cvtColor(rotated_img, cv2.COLOR_BGR2GRAY)
    return [], gray, rotation_angle, [], "no_decode"

def process_detections(frame):
    """
    Process frame through YOLO model and detect barcodes
    """
    if model is None:
        return {
            'success': False,
            'error': 'โมเดลยังไม่ถูกโหลด'
        }
    
    try:
        # รันโมเดล YOLO
        results = model(frame)
        detections = results.pandas().xyxy[0]
        
        detection_results = []
        barcode_results = []
        
        for i, detection in detections.iterrows():
            x1, y1, x2, y2 = detection[['xmin', 'ymin', 'xmax', 'ymax']]
            x1, y1, x2, y2 = [round(num) for num in [x1, y1, x2, y2]]
            
            class_id = detection['class']
            confidence = detection['confidence']
            
            # เก็บข้อมูล detection
            detection_result = {
                'xmin': x1,
                'ymin': y1,
                'xmax': x2,
                'ymax': y2,
                'class': int(class_id),
                'confidence': float(confidence)
            }
            detection_results.append(detection_result)
            
            # Crop และวิเคราะห์ barcode
            cropped_img = frame[y1:y2, x1:x2]
            
            if cropped_img.size > 0:
                barcodes, processed_img, rotation_angle, filtered_lines, decode_method = enhanced_barcode_detection(cropped_img)
                
                for barcode in barcodes:
                    data = barcode.data.decode("utf-8")
                    barcode_result = {
                        'data': data,
                        'type': barcode.type,
                        'rotation_angle': rotation_angle,
                        'decode_method': decode_method,
                        'confidence': confidence,
                        'bbox': detection_result
                    }
                    barcode_results.append(barcode_result)
                    print(f"🎯 Successfully decoded: {data} using {decode_method}")
        
        return {
            'success': True,
            'detections': detection_results,
            'barcodes': barcode_results,
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