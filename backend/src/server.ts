import http from "node:http";
import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { cacheClient } from "./config/redis.js";
import { User } from "./models/User.js";
import { assignmentRouter } from "./routes/assignmentRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { profileRouter } from "./routes/profileRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { verifyToken } from "./services/tokenService.js";
import { registerSocketServer } from "./services/socketService.js";
import { createAssignmentWorker } from "./workers/assignmentWorker.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    credentials: true
  }
});

registerSocketServer(io);

io.use(async (socket, next) => {
  const token =
    typeof socket.handshake.auth.token === "string"
      ? socket.handshake.auth.token
      : typeof socket.handshake.query.token === "string"
        ? socket.handshake.query.token
        : undefined;

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (user) {
      socket.data.userId = user._id.toString();
    }
    return next();
  } catch {
    return next(new Error("Invalid socket authentication token"));
  }
});

io.on("connection", (socket) => {
  socket.on("join-assignment-room", (assignmentId: string) => {
    if (typeof assignmentId === "string" && assignmentId.length > 0) {
      socket.join(assignmentId);
    }
  });

  socket.on("leave-assignment-room", (assignmentId: string) => {
    if (typeof assignmentId === "string" && assignmentId.length > 0) {
      socket.leave(assignmentId);
    }
  });
});

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.get("/health", async (_req: Request, res: Response) => {
  let redis = "unknown";
  try {
    redis = await cacheClient.ping();
  } catch {
    redis = "unavailable";
  }

  res.json({
    success: true,
    service: "vedaai-backend",
    redis
  });
});

app.use("/api/auth", authRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/profile", profileRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectDatabase();
  if (env.RUN_WORKER_IN_API) {
    createAssignmentWorker();
  }

  server.listen(env.PORT, () => {
    console.log(`VedaAI backend listening on port ${env.PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
