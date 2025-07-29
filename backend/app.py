# Path: /backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import onnxruntime as ort
import cv2
import numpy as np
from pyzbar import pyzbar 
from collections import defaultdict
import math
import io
from PIL import Image
import base64
import time
import hashlib
import logging
from functools import wraps
import mimetypes
from werkzeug.utils import secure_filename

# Optional magic import - fallback to mimetypes if not available
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False
    print("⚠️ python-magic not available, using mimetypes fallback")

app = Flask(__name__)
CORS(app)

# Security Configuration
SECURITY_CONFIG = {
    'MAX_FILE_SIZE': 10 * 1024 * 1024,  # 10MB
    'MAX_IMAGE_DIMENSION': 4096,        # 4096x4096 pixels
    'MIN_IMAGE_DIMENSION': 50,          # 50x50 pixels minimum
    'ALLOWED_MIME_TYPES': {
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp'
    },
    'ALLOWED_EXTENSIONS': {'.jpg', '.jpeg', '.png', '.webp'},
    'RATE_LIMIT': '30 per minute',      # 30 requests per minute per IP
    'GLOBAL_RATE_LIMIT': '1000 per hour' # 1000 total requests per hour
}

# Rate Limiter Setup
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[SECURITY_CONFIG['GLOBAL_RATE_LIMIT']],
    storage_uri="memory://"
)
limiter.init_app(app)

# Security Logger
logging.basicConfig(level=logging.INFO)
security_logger = logging.getLogger('security')

# Load ONNX Model
try:
    providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
    session = ort.InferenceSession('model.onnx', providers=providers)
    
    input_name = session.get_inputs()[0].name
    input_shape = session.get_inputs()[0].shape
    
    print(f"✅ โหลดโมเดล ONNX สำเร็จ")
    print(f"📊 Input: {input_name}, Shape: {input_shape}")
    print(f"🔧 Providers: {session.get_providers()}")
    
except Exception as e:
    print(f"⚠️ ไม่สามารถโหลดโมเดล ONNX ได้: {e}")
    session = None

# Security Validation Functions
class SecurityValidator:
    @staticmethod
    def validate_file_size(file_data):
        """Validate file size"""
        size = len(file_data)
        if size > SECURITY_CONFIG['MAX_FILE_SIZE']:
            return False, f"ไฟล์ใหญ่เกินไป (ได้รับ {size/1024/1024:.1f}MB, อนุญาตสูงสุด {SECURITY_CONFIG['MAX_FILE_SIZE']/1024/1024}MB)"
        if size < 1024:  # Less than 1KB
            return False, "ไฟล์เล็กเกินไป"
        return True, None

    @staticmethod
    def validate_file_type(file_data, filename):
        """Validate file type using multiple methods"""
        try:
            # Method 1: PIL verification (primary method)
            try:
                image = Image.open(io.BytesIO(file_data))
                pil_format = image.format.lower() if image.format else ''
                image.verify()  # Verify image integrity
                
                # Map PIL format to MIME type
                pil_to_mime = {
                    'jpeg': 'image/jpeg',
                    'jpg': 'image/jpeg', 
                    'png': 'image/png',
                    'webp': 'image/webp'
                }
                pil_mime = pil_to_mime.get(pil_format, 'unknown')
                
            except Exception:
                return False, "ไฟล์รูปภาพไม่ถูกต้องหรือเสียหาย"
            
            # Method 2: Magic bytes detection (if available)
            mime_type = None
            if HAS_MAGIC:
                try:
                    mime_type = magic.from_buffer(file_data, mime=True)
                except Exception:
                    mime_type = None
            
            # Method 3: Filename-based MIME detection (fallback)
            if not mime_type and filename:
                mime_type, _ = mimetypes.guess_type(filename)
            
            # Method 4: Use PIL format as fallback
            if not mime_type:
                mime_type = pil_mime
            
            # Method 5: Extension check
            if filename:
                ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                if ext not in SECURITY_CONFIG['ALLOWED_EXTENSIONS']:
                    return False, f"นามสกุลไฟล์ไม่อนุญาต (ได้รับ: {ext})"
            
            # Validate MIME type
            if mime_type not in SECURITY_CONFIG['ALLOWED_MIME_TYPES']:
                return False, f"ประเภทไฟล์ไม่อนุญาต (ได้รับ: {mime_type})"
            
            return True, None
            
        except Exception as e:
            return False, f"ไม่สามารถตรวจสอบประเภทไฟล์ได้: {str(e)}"

    @staticmethod
    def validate_image_content(file_data):
        """Validate image content and dimensions"""
        try:
            # Load and validate image
            nparr = np.frombuffer(file_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return False, "ไม่สามารถอ่านข้อมูลรูปภาพได้"
            
            height, width = image.shape[:2]
            
            # Dimension validation
            if width > SECURITY_CONFIG['MAX_IMAGE_DIMENSION'] or height > SECURITY_CONFIG['MAX_IMAGE_DIMENSION']:
                return False, f"ความละเอียดสูงเกินไป (ได้รับ: {width}x{height}, อนุญาตสูงสุด: {SECURITY_CONFIG['MAX_IMAGE_DIMENSION']}x{SECURITY_CONFIG['MAX_IMAGE_DIMENSION']})"
            
            if width < SECURITY_CONFIG['MIN_IMAGE_DIMENSION'] or height < SECURITY_CONFIG['MIN_IMAGE_DIMENSION']:
                return False, f"ความละเอียดต่ำเกินไป (ได้รับ: {width}x{height}, อนุญาตต่ำสุด: {SECURITY_CONFIG['MIN_IMAGE_DIMENSION']}x{SECURITY_CONFIG['MIN_IMAGE_DIMENSION']})"
            
            # Check for suspicious patterns
            if width == height and width in [1, 2, 3, 4, 5]:  # Tiny square images
                return False, "รูปภาพมีความละเอียดผิดปกติ"
            
            return True, image
            
        except Exception as e:
            return False, f"ไม่สามารถตรวจสอบเนื้อหารูปภาพได้: {str(e)}"

    @staticmethod
    def sanitize_filename(filename):
        """Sanitize filename for security"""
        if not filename:
            return "unknown_file"
        
        # Use werkzeug's secure_filename
        safe_name = secure_filename(filename)
        
        # Additional sanitization
        safe_name = safe_name.replace(' ', '_')
        safe_name = ''.join(c for c in safe_name if c.isalnum() or c in '._-')
        
        return safe_name[:100]  # Limit length

# Security Decorator
def validate_image_upload(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Check if file exists in request
            if 'image' not in request.files:
                security_logger.warning(f"Missing image file in request from {request.remote_addr}")
                return jsonify({
                    'success': False,
                    'error': 'ไม่พบไฟล์รูปภาพ',
                    'error_code': 'MISSING_FILE'
                }), 400
            
            file = request.files['image']
            
            if file.filename == '':
                security_logger.warning(f"Empty filename from {request.remote_addr}")
                return jsonify({
                    'success': False,
                    'error': 'ไม่ได้เลือกไฟล์',
                    'error_code': 'EMPTY_FILENAME'
                }), 400
            
            # Read file data
            file_data = file.read()
            file.seek(0)  # Reset file pointer
            
            # Validate file size
            valid_size, size_error = SecurityValidator.validate_file_size(file_data)
            if not valid_size:
                security_logger.warning(f"File size violation from {request.remote_addr}: {size_error}")
                return jsonify({
                    'success': False,
                    'error': size_error,
                    'error_code': 'INVALID_FILE_SIZE'
                }), 400
            
            # Validate file type
            filename = SecurityValidator.sanitize_filename(file.filename)
            valid_type, type_error = SecurityValidator.validate_file_type(file_data, filename)
            if not valid_type:
                security_logger.warning(f"File type violation from {request.remote_addr}: {type_error}")
                return jsonify({
                    'success': False,
                    'error': type_error,
                    'error_code': 'INVALID_FILE_TYPE'
                }), 400
            
            # Validate image content
            valid_content, content_result = SecurityValidator.validate_image_content(file_data)
            if not valid_content:
                security_logger.warning(f"Image content violation from {request.remote_addr}: {content_result}")
                return jsonify({
                    'success': False,
                    'error': content_result,
                    'error_code': 'INVALID_IMAGE_CONTENT'
                }), 400
            
            # Add validated data to request context
            request.validated_image = content_result
            request.validated_filename = filename
            request.file_size = len(file_data)
            
            security_logger.info(f"Image validation successful from {request.remote_addr}: {filename} ({len(file_data)/1024:.1f}KB)")
            
            return f(*args, **kwargs)
            
        except Exception as e:
            security_logger.error(f"Validation error from {request.remote_addr}: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'เกิดข้อผิดพลาดในการตรวจสอบไฟล์',
                'error_code': 'VALIDATION_ERROR'
            }), 500
    
    return decorated_function

# ONNX Model Functions (existing code - keeping same structure)
def preprocess_frame(frame):
    """เตรียม input สำหรับ ONNX model"""
    img = cv2.resize(frame, (640, 640))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.astype(np.float32) / 255.0
    img = img.transpose(2, 0, 1)
    img = np.expand_dims(img, axis=0)
    return img

def postprocess_outputs(outputs, original_shape, conf_threshold=0.5, nms_threshold=0.4):
    """แปลง ONNX outputs กลับเป็น detection format"""
    detections = outputs[0]
    orig_h, orig_w = original_shape[:2]
    scale_x = orig_w / 640
    scale_y = orig_h / 640
    detection_results = []
    
    for detection in detections[0]:
        confidence = detection[4]
        
        if confidence > conf_threshold:
            x_center, y_center, width, height = detection[:4]
            
            x1 = int((x_center - width/2) * scale_x)
            y1 = int((y_center - height/2) * scale_y)
            x2 = int((x_center + width/2) * scale_x)
            y2 = int((y_center + height/2) * scale_y)
            
            x1 = max(0, min(x1, orig_w))
            y1 = max(0, min(y1, orig_h))
            x2 = max(0, min(x2, orig_w))
            y2 = max(0, min(y2, orig_h))
            
            class_scores = detection[5:]
            class_id = np.argmax(class_scores)
            
            detection_result = {
                'xmin': x1, 'ymin': y1, 'xmax': x2, 'ymax': y2,
                'class': int(class_id), 'confidence': float(confidence)
            }
            detection_results.append(detection_result)
    
    return detection_results

# Advanced Barcode Detection Functions (keeping existing implementation)
def detect_line_segments(image):
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
    if angle == 0:
        return image
    
    height, width = image.shape[:2]
    center = (width // 2, height // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, -angle, 1.0)
    rotated = cv2.warpAffine(image, rotation_matrix, (width, height), 
                            flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    return rotated

def filter_lines_by_angle(lines, target_angle, angle_tolerance=10, min_length=10):
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
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    processed_images = []
    processed_images.append(("original", gray))
    
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    _, thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(("otsu", thresh1))
    
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY, 11, 2)
    processed_images.append(("adaptive", adaptive))
    
    kernel = np.ones((2,2), np.uint8)
    morph = cv2.morphologyEx(thresh1, cv2.MORPH_CLOSE, kernel)
    processed_images.append(("morph", morph))
    
    equalized = cv2.equalizeHist(gray)
    _, thresh_eq = cv2.threshold(equalized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(("equalized", thresh_eq))
    
    enhanced = cv2.convertScaleAbs(gray, alpha=1.5, beta=30)
    _, thresh_enh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(("enhanced", thresh_enh))
    
    return processed_images

def try_multiple_decoding_methods(image):
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
    original_height, original_width = cropped_img.shape[:2]
    
    if original_width < 100:
        scale_factor = 100 / original_width
        new_width = int(original_width * scale_factor)
        new_height = int(original_height * scale_factor)
        cropped_img = cv2.resize(cropped_img, (new_width, new_height), 
                               interpolation=cv2.INTER_CUBIC)
        print(f"🔍 Upscaled image: {original_width}x{original_height} -> {new_width}x{new_height}")
    
    barcodes, best_img, method = try_multiple_decoding_methods(cropped_img)
    if barcodes:
        return barcodes, best_img, 0, [], method
    
    lines = detect_line_segments(cropped_img)
    
    if lines is None or len(lines) == 0:
        print("⚠️ No lines detected, using original processing")
        return barcodes, best_img if best_img is not None else cv2.cvtColor(cropped_img, cv2.COLOR_BGR2GRAY), 0, [], "fallback"
    
    angles, lengths = calculate_line_angles_and_lengths(lines)
    rotation_angle = predict_rotation_angle(angles, lengths)
    print(f"🔄 Detected rotation angle: {rotation_angle}°")
    
    rotated_img = rotate_image(cropped_img, rotation_angle)
    
    barcodes, best_img, method = try_multiple_decoding_methods(rotated_img)
    if barcodes:
        return barcodes, best_img, rotation_angle, [], f"rotated_{method}"
    
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
    """ประมวลผล frame ผ่าน ONNX model และตรวจหา barcodes"""
    if session is None:
        return {
            'success': False,
            'error': 'โมเดล ONNX ยังไม่ถูกโหลด',
            'error_code': 'MODEL_NOT_LOADED'
        }
    
    try:
        input_tensor = preprocess_frame(frame)
        outputs = session.run(None, {input_name: input_tensor})
        detections = postprocess_outputs(outputs, frame.shape)
        
        detection_results = []
        barcode_results = []
        
        for detection in detections:
            x1, y1, x2, y2 = detection['xmin'], detection['ymin'], detection['xmax'], detection['ymax']
            confidence = detection['confidence']
            
            detection_results.append(detection)
            
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
                        'bbox': detection
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
        security_logger.error(f"Error in process_detections: {e}")
        return {
            'success': False,
            'error': 'เกิดข้อผิดพลาดในการประมวลผล',
            'error_code': 'PROCESSING_ERROR'
        }

# API Endpoints
@app.route('/api/detect-barcode', methods=['POST'])
@limiter.limit(SECURITY_CONFIG['RATE_LIMIT'])
@validate_image_upload
def detect_barcode():
    """🔒 Secured barcode detection endpoint"""
    try:
        # Get validated image from decorator
        frame = request.validated_image
        filename = request.validated_filename
        file_size = request.file_size
        
        start_time = time.time()
        
        # Process the validated image
        result = process_detections(frame)
        
        processing_time = time.time() - start_time
        
        # Add metadata to response
        result['metadata'] = {
            'filename': filename,
            'file_size': file_size,
            'processing_time': round(processing_time, 3),
            'image_dimensions': f"{frame.shape[1]}x{frame.shape[0]}",
            'timestamp': int(time.time())
        }
        
        security_logger.info(f"Successful barcode detection from {request.remote_addr}: {filename} in {processing_time:.2f}s")
        
        return jsonify(result)
        
    except Exception as e:
        security_logger.error(f"Error in detect_barcode endpoint from {request.remote_addr}: {e}")
        return jsonify({
            'success': False,
            'error': 'เกิดข้อผิดพลาดในการประมวลผล',
            'error_code': 'ENDPOINT_ERROR'
        }), 500

@app.route('/api/health', methods=['GET'])
@limiter.limit("60 per minute")
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': session is not None,
        'model_type': 'ONNX Runtime',
        'providers': session.get_providers() if session else [],
        'input_shape': input_shape if session else None,
        'security_config': {
            'max_file_size_mb': SECURITY_CONFIG['MAX_FILE_SIZE'] / 1024 / 1024,
            'max_image_dimension': SECURITY_CONFIG['MAX_IMAGE_DIMENSION'],
            'allowed_formats': list(SECURITY_CONFIG['ALLOWED_MIME_TYPES']),
            'rate_limit': SECURITY_CONFIG['RATE_LIMIT']
        },
        'timestamp': int(time.time())
    })

@app.errorhandler(429)
def rate_limit_exceeded(e):
    """Rate limit exceeded handler"""
    security_logger.warning(f"Rate limit exceeded from {request.remote_addr}")
    return jsonify({
        'success': False,
        'error': 'ส่งคำขอเร็วเกินไป กรุณารอสักครู่',
        'error_code': 'RATE_LIMIT_EXCEEDED',
        'retry_after': e.retry_after
    }), 429

@app.errorhandler(413)
def payload_too_large(e):
    """Payload too large handler"""
    security_logger.warning(f"Payload too large from {request.remote_addr}")
    return jsonify({
        'success': False,
        'error': 'ไฟล์ใหญ่เกินไป',
        'error_code': 'PAYLOAD_TOO_LARGE'
    }), 413

if __name__ == '__main__':
    print(f"🚀 Starting secure server with ONNX Runtime")
    print(f"🔒 Security features enabled:")
    print(f"   - File size limit: {SECURITY_CONFIG['MAX_FILE_SIZE']/1024/1024}MB")
    print(f"   - Image dimension limit: {SECURITY_CONFIG['MAX_IMAGE_DIMENSION']}px")
    print(f"   - Rate limit: {SECURITY_CONFIG['RATE_LIMIT']}")
    print(f"   - Allowed formats: {', '.join(SECURITY_CONFIG['ALLOWED_MIME_TYPES'])}")
    print(f"   - Magic library: {'✅ Available' if HAS_MAGIC else '⚠️ Fallback mode'}")
    print(f"📱 Model loaded: {session is not None}")
    if session:
        print(f"🔧 Available providers: {session.get_providers()}")
        print(f"📊 Input shape: {input_shape}")
    
    app.run(host='0.0.0.0', port=8000, debug=False)  # Disable debug in production