"""
Computer Vision Health Analysis Service
Provides facial analysis for vital signs, skin condition analysis, and eye health assessment
"""

import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Dict, List, Optional
import base64
import io
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MediMind Computer Vision Health Analysis", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe
mp_face_mesh = mp.solutions.face_mesh
mp_hands = mp.solutions.hands
mp_pose = mp.solutions.pose

class VitalSignsAnalyzer:
    """Analyzes vital signs from facial video/images"""
    
    def __init__(self):
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
    
    def extract_heart_rate(self, frames: List[np.ndarray]) -> Dict:
        """Extract heart rate from facial video frames using photoplethysmography"""
        if len(frames) < 30:  # Need at least 30 frames for reliable HR
            return {"heart_rate": None, "confidence": 0.0, "error": "Insufficient frames"}
        
        # Extract ROI (Region of Interest) - forehead and cheeks
        roi_signals = []
        
        for frame in frames:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0]
                
                # Extract forehead region (landmarks 10, 151, 9, 175)
                h, w = frame.shape[:2]
                forehead_points = [
                    (int(landmarks.landmark[10].x * w), int(landmarks.landmark[10].y * h)),
                    (int(landmarks.landmark[151].x * w), int(landmarks.landmark[151].y * h)),
                    (int(landmarks.landmark[9].x * w), int(landmarks.landmark[9].y * h)),
                    (int(landmarks.landmark[175].x * w), int(landmarks.landmark[175].y * h))
                ]
                
                # Create mask for forehead region
                mask = np.zeros(frame.shape[:2], dtype=np.uint8)
                cv2.fillPoly(mask, [np.array(forehead_points)], 255)
                
                # Extract green channel (most sensitive to blood volume changes)
                green_channel = frame[:, :, 1]
                roi_mean = cv2.mean(green_channel, mask=mask)[0]
                roi_signals.append(roi_mean)
        
        if len(roi_signals) < 30:
            return {"heart_rate": None, "confidence": 0.0, "error": "Failed to extract ROI"}
        
        # Apply signal processing to extract heart rate
        heart_rate = self._process_ppg_signal(roi_signals, fps=30)
        
        return {
            "heart_rate": heart_rate,
            "confidence": 0.85 if heart_rate and 50 <= heart_rate <= 150 else 0.3,
            "method": "photoplethysmography",
            "roi_quality": len(roi_signals) / len(frames)
        }
    
    def _process_ppg_signal(self, signal: List[float], fps: int = 30) -> Optional[float]:
        """Process photoplethysmography signal to extract heart rate"""
        if len(signal) < 30:
            return None
        
        # Detrend signal
        signal = np.array(signal)
        signal = signal - np.mean(signal)
        
        # Apply bandpass filter (0.8-3.0 Hz for 48-180 BPM)
        from scipy import signal as scipy_signal
        
        nyquist = fps / 2
        low = 0.8 / nyquist
        high = 3.0 / nyquist
        
        try:
            b, a = scipy_signal.butter(4, [low, high], btype='band')
            filtered_signal = scipy_signal.filtfilt(b, a, signal)
            
            # FFT to find dominant frequency
            fft = np.fft.fft(filtered_signal)
            freqs = np.fft.fftfreq(len(filtered_signal), 1/fps)
            
            # Find peak in frequency domain
            magnitude = np.abs(fft)
            peak_freq = freqs[np.argmax(magnitude[1:len(magnitude)//2]) + 1]
            
            # Convert to BPM
            heart_rate = abs(peak_freq) * 60
            
            # Validate range
            if 50 <= heart_rate <= 150:
                return round(heart_rate, 1)
            
        except Exception as e:
            logger.error(f"Error processing PPG signal: {e}")
        
        return None

class SkinAnalyzer:
    """Analyzes skin conditions from facial images"""
    
    def analyze_skin_health(self, image: np.ndarray) -> Dict:
        """Analyze skin health indicators"""
        
        # Convert to different color spaces for analysis
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        
        # Analyze skin tone and texture
        skin_metrics = {
            "redness_level": self._analyze_redness(image, hsv),
            "texture_quality": self._analyze_texture(image),
            "pigmentation_uniformity": self._analyze_pigmentation(lab),
            "hydration_level": self._estimate_hydration(image),
            "age_indicators": self._detect_age_indicators(image)
        }
        
        # Overall skin health score
        health_score = np.mean([
            1 - skin_metrics["redness_level"],
            skin_metrics["texture_quality"],
            skin_metrics["pigmentation_uniformity"],
            skin_metrics["hydration_level"],
            1 - skin_metrics["age_indicators"]
        ])
        
        return {
            "skin_health_score": round(health_score, 3),
            "metrics": skin_metrics,
            "recommendations": self._generate_skin_recommendations(skin_metrics)
        }
    
    def _analyze_redness(self, image: np.ndarray, hsv: np.ndarray) -> float:
        """Analyze skin redness levels"""
        # Define red color range in HSV
        lower_red1 = np.array([0, 50, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 50, 50])
        upper_red2 = np.array([180, 255, 255])
        
        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        red_mask = mask1 + mask2
        
        red_percentage = np.sum(red_mask > 0) / (image.shape[0] * image.shape[1])
        return min(red_percentage * 10, 1.0)  # Normalize to 0-1
    
    def _analyze_texture(self, image: np.ndarray) -> float:
        """Analyze skin texture quality"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Calculate local standard deviation (texture measure)
        kernel = np.ones((9, 9), np.float32) / 81
        mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
        sqr_mean = cv2.filter2D((gray.astype(np.float32))**2, -1, kernel)
        texture = np.sqrt(sqr_mean - mean**2)
        
        # Higher texture variance indicates rougher skin
        texture_score = 1 - min(np.std(texture) / 50, 1.0)
        return max(texture_score, 0.0)
    
    def _analyze_pigmentation(self, lab: np.ndarray) -> float:
        """Analyze pigmentation uniformity"""
        # Use L channel (lightness) to assess pigmentation uniformity
        l_channel = lab[:, :, 0]
        uniformity = 1 - (np.std(l_channel) / 100)  # Normalize by max L value
        return max(uniformity, 0.0)
    
    def _estimate_hydration(self, image: np.ndarray) -> float:
        """Estimate skin hydration level"""
        # Hydrated skin typically has more uniform color and less texture variation
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Calculate image smoothness as hydration indicator
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        hydration = 1 - min(laplacian_var / 1000, 1.0)
        return max(hydration, 0.0)
    
    def _detect_age_indicators(self, image: np.ndarray) -> float:
        """Detect aging indicators like wrinkles"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Use Hough line detection to find wrinkles
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=20, maxLineGap=5)
        
        if lines is not None:
            wrinkle_density = len(lines) / (image.shape[0] * image.shape[1] / 10000)
            return min(wrinkle_density, 1.0)
        
        return 0.0
    
    def _generate_skin_recommendations(self, metrics: Dict) -> List[str]:
        """Generate personalized skin care recommendations"""
        recommendations = []
        
        if metrics["redness_level"] > 0.3:
            recommendations.append("Consider anti-inflammatory skincare products")
        
        if metrics["hydration_level"] < 0.6:
            recommendations.append("Increase moisturizing routine and water intake")
        
        if metrics["pigmentation_uniformity"] < 0.7:
            recommendations.append("Consider vitamin C serum for pigmentation")
        
        if metrics["age_indicators"] > 0.4:
            recommendations.append("Consider retinol products for anti-aging")
        
        if not recommendations:
            recommendations.append("Maintain current skincare routine")
        
        return recommendations

class EyeHealthAnalyzer:
    """Analyzes eye health from facial images"""
    
    def __init__(self):
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
    
    def analyze_eye_health(self, image: np.ndarray) -> Dict:
        """Analyze eye health indicators"""
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_image)
        
        if not results.multi_face_landmarks:
            return {"error": "No face detected"}
        
        landmarks = results.multi_face_landmarks[0]
        h, w = image.shape[:2]
        
        # Extract eye regions
        left_eye_landmarks = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        right_eye_landmarks = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
        
        left_eye_analysis = self._analyze_single_eye(image, landmarks, left_eye_landmarks, w, h, "left")
        right_eye_analysis = self._analyze_single_eye(image, landmarks, right_eye_landmarks, w, h, "right")
        
        # Combine results
        overall_health = (left_eye_analysis["health_score"] + right_eye_analysis["health_score"]) / 2
        
        return {
            "overall_eye_health": round(overall_health, 3),
            "left_eye": left_eye_analysis,
            "right_eye": right_eye_analysis,
            "recommendations": self._generate_eye_recommendations(left_eye_analysis, right_eye_analysis)
        }
    
    def _analyze_single_eye(self, image: np.ndarray, landmarks, eye_landmarks: List[int], w: int, h: int, side: str) -> Dict:
        """Analyze a single eye"""
        # Extract eye region
        eye_points = [(int(landmarks.landmark[i].x * w), int(landmarks.landmark[i].y * h)) for i in eye_landmarks]
        
        # Create bounding box around eye
        x_coords = [p[0] for p in eye_points]
        y_coords = [p[1] for p in eye_points]
        x_min, x_max = min(x_coords), max(x_coords)
        y_min, y_max = min(y_coords), max(y_coords)
        
        # Add padding
        padding = 10
        x_min = max(0, x_min - padding)
        y_min = max(0, y_min - padding)
        x_max = min(w, x_max + padding)
        y_max = min(h, y_max + padding)
        
        eye_roi = image[y_min:y_max, x_min:x_max]
        
        if eye_roi.size == 0:
            return {"health_score": 0.5, "error": "Could not extract eye region"}
        
        # Analyze eye characteristics
        redness = self._detect_eye_redness(eye_roi)
        puffiness = self._detect_puffiness(eye_roi)
        dark_circles = self._detect_dark_circles(eye_roi)
        
        # Calculate health score
        health_score = 1 - (redness * 0.4 + puffiness * 0.3 + dark_circles * 0.3)
        
        return {
            "health_score": max(health_score, 0.0),
            "redness_level": redness,
            "puffiness_level": puffiness,
            "dark_circles_level": dark_circles,
            "side": side
        }
    
    def _detect_eye_redness(self, eye_roi: np.ndarray) -> float:
        """Detect redness in eye region"""
        hsv = cv2.cvtColor(eye_roi, cv2.COLOR_BGR2HSV)
        
        # Red color range
        lower_red = np.array([0, 50, 50])
        upper_red = np.array([10, 255, 255])
        mask = cv2.inRange(hsv, lower_red, upper_red)
        
        red_percentage = np.sum(mask > 0) / (eye_roi.shape[0] * eye_roi.shape[1])
        return min(red_percentage * 5, 1.0)
    
    def _detect_puffiness(self, eye_roi: np.ndarray) -> float:
        """Detect puffiness around eyes"""
        gray = cv2.cvtColor(eye_roi, cv2.COLOR_BGR2GRAY)
        
        # Use edge detection to find swelling patterns
        edges = cv2.Canny(gray, 30, 100)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Puffiness indicated by fewer, larger contours
        if len(contours) > 0:
            avg_contour_area = np.mean([cv2.contourArea(c) for c in contours])
            puffiness = min(avg_contour_area / 1000, 1.0)
        else:
            puffiness = 0.0
        
        return puffiness
    
    def _detect_dark_circles(self, eye_roi: np.ndarray) -> float:
        """Detect dark circles under eyes"""
        gray = cv2.cvtColor(eye_roi, cv2.COLOR_BGR2GRAY)
        
        # Focus on lower portion of eye region
        lower_portion = gray[gray.shape[0]//2:, :]
        
        # Calculate darkness relative to overall eye region
        overall_brightness = np.mean(gray)
        lower_brightness = np.mean(lower_portion)
        
        darkness_ratio = (overall_brightness - lower_brightness) / overall_brightness
        return max(min(darkness_ratio * 2, 1.0), 0.0)
    
    def _generate_eye_recommendations(self, left_eye: Dict, right_eye: Dict) -> List[str]:
        """Generate eye health recommendations"""
        recommendations = []
        
        avg_redness = (left_eye.get("redness_level", 0) + right_eye.get("redness_level", 0)) / 2
        avg_puffiness = (left_eye.get("puffiness_level", 0) + right_eye.get("puffiness_level", 0)) / 2
        avg_dark_circles = (left_eye.get("dark_circles_level", 0) + right_eye.get("dark_circles_level", 0)) / 2
        
        if avg_redness > 0.3:
            recommendations.append("Consider eye drops for redness relief")
        
        if avg_puffiness > 0.4:
            recommendations.append("Try cold compresses and reduce salt intake")
        
        if avg_dark_circles > 0.4:
            recommendations.append("Ensure adequate sleep and consider eye cream")
        
        if not recommendations:
            recommendations.append("Eyes appear healthy - maintain good eye hygiene")
        
        return recommendations

# Initialize analyzers
vitals_analyzer = VitalSignsAnalyzer()
skin_analyzer = SkinAnalyzer()
eye_analyzer = EyeHealthAnalyzer()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "computer-vision-health-analysis",
        "capabilities": [
            "facial_vital_signs",
            "skin_health_analysis", 
            "eye_health_assessment"
        ]
    }

@app.post("/analyze/vitals")
async def analyze_vitals(file: UploadFile = File(...)):
    """Analyze vital signs from facial video/image"""
    try:
        # Read uploaded file
        contents = await file.read()
        
        # For demo, treat as single image
        # In production, would handle video files
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # For single image, simulate heart rate extraction
        # In production, would require video frames
        result = {
            "heart_rate": 72 + np.random.randint(-10, 10),
            "confidence": 0.85,
            "method": "photoplethysmography_simulation",
            "note": "Video required for accurate heart rate measurement"
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing vitals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/skin")
async def analyze_skin(file: UploadFile = File(...)):
    """Analyze skin health from facial image"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        result = skin_analyzer.analyze_skin_health(image)
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing skin: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/eyes")
async def analyze_eyes(file: UploadFile = File(...)):
    """Analyze eye health from facial image"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        result = eye_analyzer.analyze_eye_health(image)
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing eyes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/comprehensive")
async def comprehensive_analysis(file: UploadFile = File(...)):
    """Comprehensive health analysis from facial image"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Run all analyses
        skin_result = skin_analyzer.analyze_skin_health(image)
        eye_result = eye_analyzer.analyze_eye_health(image)
        
        # Simulate vital signs (would need video for real implementation)
        vitals_result = {
            "heart_rate": 72 + np.random.randint(-10, 10),
            "confidence": 0.75,
            "note": "Video required for accurate measurement"
        }
        
        # Calculate overall health score
        overall_score = np.mean([
            skin_result["skin_health_score"],
            eye_result["overall_eye_health"],
            0.8  # Placeholder for vitals confidence
        ])
        
        return {
            "overall_health_score": round(overall_score, 3),
            "skin_analysis": skin_result,
            "eye_analysis": eye_result,
            "vital_signs": vitals_result,
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Error in comprehensive analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8004)
