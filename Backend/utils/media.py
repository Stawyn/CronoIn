import base64
import hashlib
import os
from typing import Optional
from uuid import uuid4

from PIL import Image, ImageChops
from io import BytesIO
import numpy as np
import cv2

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MEDIA_ROOT = os.path.join(BASE_DIR, "media")
USERS_SUBDIR = "users"
CAPTURES_SUBDIR = os.path.join(USERS_SUBDIR, "captures")

os.makedirs(MEDIA_ROOT, exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, USERS_SUBDIR), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, CAPTURES_SUBDIR), exist_ok=True)


def _ensure_subdir(subdir: str) -> str:
    path = os.path.join(MEDIA_ROOT, subdir)
    os.makedirs(path, exist_ok=True)
    return path


def _sanitize_prefix(prefix: str) -> str:
    safe = ''.join(c for c in prefix.lower().replace(' ', '_') if c.isalnum() or c in {'_', '-'})
    return safe or 'img'


def _decode_base64(data_uri: Optional[str]):
    if not data_uri:
        raise ValueError("EMPTY_DATA")
    if ',' in data_uri:
        header, payload = data_uri.split(',', 1)
        if 'data:' in header:
            mime = header.split(';')[0].split(':')[-1]
        else:
            mime = 'image/jpeg'
    else:
        payload = data_uri
        mime = 'image/jpeg'
    sanitized = ''.join(payload.split())
    remainder = len(sanitized) % 4
    if remainder:
        sanitized = sanitized + ('=' * (4 - remainder))
    try:
        binary = base64.b64decode(sanitized)
    except Exception as exc:
        raise ValueError("INVALID_IMAGE") from exc
    return binary, mime


def save_base64_image(data_uri: Optional[str], prefix: str = "img", subdir: str = USERS_SUBDIR) -> Optional[str]:
    if not data_uri:
        return None

    try:
        binary, mime = _decode_base64(data_uri)
        extension = (mime.split('/')[-1] or 'jpg').lower()
    except Exception as exc:
        raise ValueError("INVALID_IMAGE") from exc

    directory = _ensure_subdir(subdir)
    filename = f"{_sanitize_prefix(prefix)}_{uuid4().hex}.{extension}"
    full_path = os.path.join(directory, filename)
    with open(full_path, 'wb') as handler:
        handler.write(binary)

    return f"/media/{subdir}/{filename}"


def _load_image_from_base64(data_uri: str) -> Image.Image:
    binary, _ = _decode_base64(data_uri)
    return Image.open(BytesIO(binary)).convert("RGB")


def _load_image_from_path(relative_url: str) -> Image.Image:
    if not relative_url:
        raise FileNotFoundError("Empty path")
    if relative_url.startswith('/media/'):
        relative_url = relative_url[len('/media/'):]
    absolute = os.path.join(MEDIA_ROOT, relative_url.lstrip('/'))
    if not os.path.exists(absolute):
        raise FileNotFoundError(absolute)
    return Image.open(absolute).convert("RGB")


def compare_with_saved_image(base64_data: str, relative_path: str) -> float:
    reference = _load_image_from_path(relative_path)
    candidate = _load_image_from_base64(base64_data)
    size = (256, 256)
    reference = reference.resize(size)
    candidate = candidate.resize(size)
    diff = ImageChops.difference(reference, candidate)
    histogram = diff.histogram()
    squares = (value * ((idx % 256) ** 2) for idx, value in enumerate(histogram))
    sum_of_squares = sum(squares)
    rms = (sum_of_squares / float(reference.size[0] * reference.size[1])) ** 0.5
    # Convert to similarity score (0-100)
    max_distance = 255
    similarity = max(0.0, 100.0 - (rms / max_distance * 100.0))
    return round(similarity, 2)


def generate_face_signature(data_uri: str) -> dict:
    if not data_uri:
        raise ValueError("EMPTY_DATA")

    binary, _ = _decode_base64(data_uri)
    image_array = np.frombuffer(binary, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if frame is None:
        try:
            pil_image = Image.open(BytesIO(binary)).convert("RGB")
            frame = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        except Exception as exc:
            raise ValueError("INVALID_IMAGE") from exc

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_detector = cv2.CascadeClassifier(cascade_path)
    faces = face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    if faces is None or len(faces) == 0:
        raise ValueError("FACE_NOT_FOUND")

    # Use the largest detected face region
    x, y, w, h = sorted(faces, key=lambda rect: rect[2] * rect[3], reverse=True)[0]
    roi = gray[y:y + h, x:x + w]
    roi = cv2.resize(roi, (128, 128))
    hist = cv2.calcHist([roi], [0], None, [256], [0, 256])
    hist = cv2.normalize(hist, hist).flatten()
    face_hash = hashlib.sha256(hist.tobytes()).hexdigest()

    return {
        "face_encoding": hist.tolist(),
        "face_hash": face_hash,
        "faces_detected": len(faces)
    }


def compare_face_signatures(reference_encoding: Optional[list], candidate_encoding: Optional[list]) -> float:
    if not reference_encoding or not candidate_encoding:
        return 0.0

    try:
        reference = np.array(reference_encoding, dtype=np.float32)
        candidate = np.array(candidate_encoding, dtype=np.float32)
    except Exception:
        return 0.0

    length = min(reference.shape[0], candidate.shape[0])
    if length == 0:
        return 0.0

    reference = reference[:length]
    candidate = candidate[:length]

    ref_norm = np.linalg.norm(reference)
    cand_norm = np.linalg.norm(candidate)
    if ref_norm == 0 or cand_norm == 0:
        return 0.0

    similarity = float(np.dot(reference, candidate) / (ref_norm * cand_norm))
    similarity = max(0.0, min(similarity, 1.0))
    return round(similarity * 100, 2)


__all__ = [
    "MEDIA_ROOT",
    "USERS_SUBDIR",
    "CAPTURES_SUBDIR",
    "save_base64_image",
    "compare_with_saved_image",
    "generate_face_signature",
    "compare_face_signatures",
]
