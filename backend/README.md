# VedaAI Backend

Node.js, Express, TypeScript, MongoDB, Redis, BullMQ, Socket.io, Gemini, and PDFKit backend for the VedaAI AI Assessment Creator.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Fill `.env` from `.env.example`.

   `REDIS_URL` must be a Redis protocol URL, for example `redis://localhost:6379` or a TLS URL from your Redis provider. BullMQ cannot use Upstash REST URL/token values directly.

3. Start the API and worker in one development process:

   ```bash
   npm run dev
   ```

   A separate worker entry is also available. Set `RUN_WORKER_IN_API=false` when running API and worker as separate processes:

   ```bash
   npm run dev:worker
   ```

## Main API

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `PUT /api/profile/settings`
- `POST /api/assignments/create`
- `GET /api/assignments`
- `GET /api/assignments/:id`
- `POST /api/assignments/:id/regenerate`
- `DELETE /api/assignments/:id`
- `GET /api/assignments/:id/download-pdf`

All assignment and profile routes require `Authorization: Bearer <token>`.

## Assignment Creation Payload

`POST /api/assignments/create` accepts JSON or multipart form data. Multipart files use the `file` field and support PDF or text files.

```json
{
  "title": "Quiz on Electricity",
  "due_date": "2026-06-20T10:00:00.000Z",
  "subject": "Science",
  "className": "Class 8",
  "timeAllowedMinutes": 60,
  "instructions": "Create a balanced exam from current electricity concepts.",
  "question_types": [
    { "type": "Multiple Choice Questions", "count": 5, "marks": 1, "difficulty": "Easy" },
    { "type": "Short Answer Questions", "count": 5, "marks": 2, "difficulty": "Moderate" }
  ]
}
```

The backend calculates `totalQuestions` and `totalMarks`, queues generation, stores the structured paper in MongoDB, caches job status in Redis, and broadcasts Socket.io updates to the assignment room.

## WebSocket

Connect with Socket.io and join the room:

```ts
socket.emit("join-assignment-room", assignmentId);
socket.on("assignment-status-update", (payload) => {
  console.log(payload.status, payload.data);
});
```
