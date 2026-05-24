# VedaAI 📄

An automated question paper generator built for educational environments. Teachers can generate structured exam papers from text or PDF inputs, preview rendered diagrams inline, and export print-ready PDFs — all with real-time job progress tracking.

---

## Structure

```
/
├── frontend/   # Next.js client application
└── backend/    # Node.js + Express + TypeScript API
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, Socket.io client |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas |
| Queue / Cache | Redis (native) + BullMQ |
| Real-time | Socket.io |
| Hosting (client) | Vercel |
| Hosting (API + Redis) | Render |

---

## Local Setup

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
RUN_WORKER=true        # runs the BullMQ worker inside the API process
```

Start the server:

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

---

## Features

**📝 Question Paper Generation**
Teachers define the paper blueprint — number of questions, total marks, difficulty distribution — and the AI generates a structured paper. Accepts raw text input or PDF document uploads.

**🔷 Native SVG Rendering Engine**
A built-in vector engine lets the AI programmatically render geometry grids, circuit diagrams, and intersection lines directly in the browser view. No third-party diagram libraries.

**📥 PDF Export**
The SVG-rendered elements are exported to cross-platform PDF files that faithfully preserve the visual properties of the web view.

**⚡ Real-time Progress Tracking**
Socket.io maintains a persistent WebSocket connection between the client and server. As a generation job progresses through stages (PDF extraction → text parsing → AI processing), status milestones are pushed to the teacher's dashboard live — no polling, no manual refresh.

**🔁 Fault-Tolerant Job Queue**
Generation tasks are serialized into a BullMQ queue backed by Redis. If the HTTP layer restarts mid-job, execution state is retained in Redis and the worker recovers on reboot. The worker runs inside the same API process, controlled by the `RUN_WORKER` environment variable.

---

## Architecture

```
Client (Next.js)
    │
    ├── REST requests ──────────────► Express API
    │                                     │
    └── WebSocket (Socket.io) ◄──────────►│
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                         MongoDB Atlas           BullMQ Queue
                      (entity persistence)     (Redis-backed)
                                                       │
                                               BullMQ Worker
                                           (same API process,
                                           RUN_WORKER=true)
```

The backend is a single Express server. Long-running generation tasks are offloaded to the BullMQ worker immediately — keeping the HTTP thread free and ensuring jobs survive transient failures.

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel — set `NEXT_PUBLIC_API_URL` to the Render backend URL |
| Backend API | Render — set all backend env vars in the Render dashboard |
| Redis | Render managed Redis instance |
| MongoDB | MongoDB Atlas |

---
