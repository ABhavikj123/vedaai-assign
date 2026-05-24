import { Worker } from "bullmq";
import { connectDatabase } from "../config/database.js";
import { redisConnection } from "../config/redis.js";
import { Assignment } from "../models/Assignment.js";
import { ASSIGNMENT_QUEUE_NAME, type AssignmentJobPayload } from "../queues/assignmentQueue.js";
import { invalidateAssignmentCaches, setCachedAssignmentStatus } from "../services/assignmentCacheService.js";
import { generateQuestionPaper } from "../services/geminiService.js";
import { emitAssignmentStatus } from "../services/socketService.js";

export const createAssignmentWorker = () => {
  const worker = new Worker<AssignmentJobPayload>(
    ASSIGNMENT_QUEUE_NAME,
    async (job) => {
      const { assignmentId, teacherId } = job.data;
      const assignment = await Assignment.findOne({ _id: assignmentId, teacherId }).populate("teacherId");

      if (!assignment) {
        throw new Error("Assignment not found for generation");
      }

      assignment.status = "processing";
      assignment.failureReason = undefined;
      await assignment.save();
      await invalidateAssignmentCaches(teacherId, assignmentId);
      await setCachedAssignmentStatus(assignmentId, "processing");
      emitAssignmentStatus(assignmentId, "processing", {
        message: "Querying Gemini AI..."
      });

      try {
        const generatedPaper = await generateQuestionPaper(assignment);

        assignment.generatedPaper = generatedPaper;
        assignment.status = "completed";
        assignment.failureReason = undefined;
        await assignment.save();
        await invalidateAssignmentCaches(teacherId, assignmentId);
        await setCachedAssignmentStatus(assignmentId, "completed");

        emitAssignmentStatus(assignmentId, "completed", {
          message: "Question paper generated",
          data: generatedPaper
        });

        return { assignmentId, status: "completed" };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Generation failed";
        assignment.status = "failed";
        assignment.failureReason = message;
        await assignment.save();
        await invalidateAssignmentCaches(teacherId, assignmentId);
        await setCachedAssignmentStatus(assignmentId, "failed");
        emitAssignmentStatus(assignmentId, "failed", {
          message,
          data: { failureReason: message }
        });
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2
    }
  );

  worker.on("failed", (job, error) => {
    if (job?.data.assignmentId) {
      emitAssignmentStatus(job.data.assignmentId, "failed", {
        message: error.message
      });
    }
  });

  return worker;
};

if (process.argv[1]?.endsWith("assignmentWorker.ts") || process.argv[1]?.endsWith("assignmentWorker.js")) {
  await connectDatabase();
  createAssignmentWorker();
}
