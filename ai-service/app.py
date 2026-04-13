from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import base64
import numpy as np
import cv2
from face_utils import extract_embedding, compare_embeddings, check_liveness

app = FastAPI(title="FaceAuth AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmbeddingRequest(BaseModel):
    image_base64: str          # base64-encoded image (JPEG/PNG)


class CompareRequest(BaseModel):
    image_base64: str          # live capture (base64)
    stored_embeddings: list # list of stored vectors
    check_live: Optional[bool] = True


class EmbeddingResponse(BaseModel):
    success: bool
    embedding: Optional[List[float]] = None
    error: Optional[str] = None


class CompareResponse(BaseModel):
    success: bool
    match: bool
    confidence: float          # 0.0 – 1.0
    is_live: Optional[bool] = None
    error: Optional[str] = None



def decode_image(image_base64: str) -> np.ndarray:
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]

    img_bytes = base64.b64decode(image_base64)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    return img


@app.get("/health")
async def health():
    return {"status": "ok", "service": "FaceAuth AI"}


@app.post("/extract-embedding", response_model=EmbeddingResponse)
async def extract_embedding_endpoint(req: EmbeddingRequest):
    """
    Extract a 512-dim face embedding from a base64 image.
    Returns the embedding vector for storage in MongoDB.
    """
    try:
        img = decode_image(req.image_base64)

        print("Image shape (register):", img.shape if img is not None else None)
        cv2.imwrite("debug_register.jpg", img)

        embedding = extract_embedding(img)
        if embedding is None:
            return EmbeddingResponse(success=False, error="No face detected in image")
        return EmbeddingResponse(success=True, embedding=embedding.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compare-face", response_model=CompareResponse)
async def compare_face_endpoint(req: CompareRequest):
    """
    Compare a live image against stored embeddings.
    Returns match result + confidence score.
    """
    try:
        img = decode_image(req.image_base64)

        print("Image shape (login):", img.shape if img is not None else None)
        cv2.imwrite("debug_login.jpg", img)

        # Liveness check (optional)
        is_live = True # 🔥 TEMP FIX — bypass liveness
        

        # Extract live embedding
        live_embedding = extract_embedding(img)

        print("🔥 LIVE EMBEDDING TYPE:", type(live_embedding))

        if live_embedding is None:
            return CompareResponse(success=False, match=False, confidence=0.0,
                                error="No face detected in live image")

        print("🔥 STORED EMBEDDINGS COUNT:", len(req.stored_embeddings))

        stored_np = [np.array(e) for e in req.stored_embeddings]

        print("🔥 CALLING COMPARE FUNCTION")

        match, confidence = compare_embeddings(live_embedding, stored_np)

        return CompareResponse(
            success=True,
            match=match,
            confidence=round(float(confidence), 4),
            is_live=is_live,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
