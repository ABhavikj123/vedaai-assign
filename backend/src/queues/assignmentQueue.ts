import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export interface AssignmentJobPayload {
  assignmentId: string;
  teacherId: string;
}

export const ASSIGNMENT_QUEUE_NAME = "assignment-generation";

export const assignmentQueue = new Queue<AssignmentJobPayload>(ASSIGNMENT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: 100
  }
});

export const enqueueAssignmentGeneration = async (payload: AssignmentJobPayload) => {
  return assignmentQueue.add("generate-assignment", payload, {
    jobId: `assignment:${payload.assignmentId}:${Date.now()}`
  });
};
