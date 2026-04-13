# FaceAuth — Passwordless Face Recognition System
> MERN Stack + Python AI · JWT · DeepFace · WebRTC

---

## Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS + WebRTC
- **Backend**: Node.js + Express + JWT + Multer
- **AI Service**: Python + FastAPI + DeepFace
- **Database**: MongoDB (Mongoose)

---

## Project Structure
```
face-auth/
├── client/          → React frontend
├── server/          → Node.js + Express backend
├── ai-service/      → Python FastAPI face recognition
└── README.md
```

---

## Quick Start

### 1. Prerequisites
- Node.js >= 18
- Python >= 3.9
- MongoDB running locally or MongoDB Atlas URI
- pip

### 2. AI Service (Python)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### 3. Backend (Node.js)
```bash
cd server
npm install
# Create .env from .env.example
cp .env.example .env
npm run dev
```

### 4. Frontend (React)
```bash
cd client
npm install
npm run dev
```

---

## Environment Variables

### server/.env
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/faceauth
JWT_SECRET=your_super_secret_jwt_key_here
AI_SERVICE_URL=http://localhost:8000
```

### client/.env
```
VITE_API_URL=http://localhost:5000/api
```

---

## API Reference

### Auth Endpoints (Node.js — port 5000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user + store face embeddings |
| POST | /api/auth/login | Face login → returns JWT |
| GET | /api/auth/me | Get logged-in user (protected) |
| DELETE | /api/auth/reset-face | Delete stored face data |

### AI Endpoints (Python — port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /extract-embedding | Extract face vector from image |
| POST | /compare-face | Compare face vs stored embedding |
| GET | /health | Health check |

---

## Face Recognition Logic
- **Library**: DeepFace (ArcFace model)
- **Storage**: Face embeddings (512-dim vectors) stored in MongoDB — NOT raw images
- **Matching**: Cosine similarity. Threshold: 0.68
- **Liveness**: Blink detection via Eye Aspect Ratio (EAR) using dlib landmarks
