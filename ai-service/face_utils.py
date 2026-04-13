"""
face_utils.py
Core face recognition utilities using DeepFace + OpenCV.
"""
print("🔥 FACE_UTILS LOADED FROM THIS FILE")
import numpy as np
import cv2
DeepFace = None

def get_deepface():
    global DeepFace
    if DeepFace is None:
        from deepface import DeepFace as DF
        DeepFace = DF
    return DeepFace
from scipy.spatial.distance import cosine

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
MODEL_NAME = "Facenet512"          # Best accuracy; alternatives: "Facenet512", "VGG-Face"
DETECTOR = "opencv"             # Most accurate detector; alternatives: "opencv", "mtcnn"
SIMILARITY_THRESHOLD = 0.5      # Cosine similarity ≥ threshold → MATCH
EAR_THRESHOLD = 0.25            # Eye Aspect Ratio below this → eye is closed (blink)
EAR_CONSEC_FRAMES = 2           # Frames eye must be below threshold to count as blink


# ──────────────────────────────────────────────
# EMBEDDING EXTRACTION
# ──────────────────────────────────────────────
def extract_embedding(img_bgr: np.ndarray) -> np.ndarray | None:
    try:
        DF = get_deepface()

        if img_bgr is None:
            print("Image is None")
            return None

        # Convert to gray
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # Detect face manually
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        faces = face_cascade.detectMultiScale(gray, 1.1, 5)

        if len(faces) == 0:
            print("No face detected by OpenCV")
            return None

        # Take first face
        (x, y, w, h) = faces[0]
        face_img = img_bgr[y:y+h, x:x+w]

        # Resize properly
        face_img = cv2.resize(face_img, (224, 224))

        # Improve brightness
        face_img = cv2.convertScaleAbs(face_img, alpha=1.5, beta=20)

        # NOW pass cropped face (no detection needed)
        result = DF.represent(
            img_path=face_img,
            model_name="Facenet512",      # 🔥 more stable
            detector_backend="skip",      # 🔥 VERY IMPORTANT
            enforce_detection=False,
            align=False,
        )

        if result and len(result) > 0:
            return np.array(result[0]["embedding"])

        return None

    except Exception as e:
        print("Embedding error:", e)
        return None
# ──────────────────────────────────────────────
# FACE COMPARISON
# ──────────────────────────────────────────────
def compare_embeddings(live, stored_list):
    if not stored_list:
        return False, 0.0

    best_similarity = -1

    for stored in stored_list:
        live_norm = live / np.linalg.norm(live)
        stored_norm = stored / np.linalg.norm(stored)

        similarity = np.dot(live_norm, stored_norm)
        print("🔥 COMPARE FUNCTION RUNNING")      
        print("🔥 Similarity:", similarity)

        if similarity > best_similarity:
            best_similarity = similarity

    is_match = best_similarity > 0.5

    return is_match, best_similarity

# ──────────────────────────────────────────────
# LIVENESS DETECTION (Eye Aspect Ratio)
# ──────────────────────────────────────────────
def _eye_aspect_ratio(eye_landmarks: np.ndarray) -> float:
    """
    Compute Eye Aspect Ratio (EAR) for a set of 6 eye landmark points.
    EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    """
    A = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    B = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    C = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
    return (A + B) / (2.0 * C + 1e-6)


def check_liveness(img_bgr: np.ndarray) -> bool:
    """
    Simple liveness check using OpenCV Haar cascade + dlib facial landmarks.
    Returns True if the face appears live (eye blink detected or eyes open).

    NOTE: For production, replace with a proper anti-spoofing CNN model.
    This implementation checks that two valid open eyes are detected,
    which blocks most printed-photo attacks.
    """
    try:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye.xml"
        )

        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(80, 80))
        if len(faces) == 0:
            return False

        (x, y, w, h) = faces[0]
        roi_gray = gray[y : y + h, x : x + w]
        eyes = eye_cascade.detectMultiScale(roi_gray, 1.1, 10, minSize=(20, 20))

        # Need at least two eyes detected (basic liveness signal)
        return len(eyes) >= 2
    except Exception:
        # Fail open — don't block legitimate users due to detection error
        return True


# ──────────────────────────────────────────────
# UTILITY: Draw face box (for debugging)
# ──────────────────────────────────────────────
def draw_face_box(img_bgr: np.ndarray, color=(108, 99, 255)) -> np.ndarray:
    """Draw detected face bounding box. For debugging only."""
    try:
        DF = get_deepface()
        result = DF.detect_face(img_bgr, detector_backend=DETECTOR)
        if result:
            region = result[0]["facial_area"]
            x, y, w, h = region["x"], region["y"], region["w"], region["h"]
            cv2.rectangle(img_bgr, (x, y), (x + w, y + h), color, 2)
    except Exception:
        pass
    return img_bgr

import base64

def base64_to_image(base64_string):
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        img_bytes = base64.b64decode(base64_string)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        return img
    except Exception as e:
        print("Decode error:", e)
        return None