import type { Server } from "socket.io";
import type { AssignmentStatus } from "../models/Assignment.js";

let ioInstance: Server | null = null;

export const registerSocketServer = (io: Server): void => {
  ioInstance = io;
};

export const emitAssignmentStatus = (
  assignmentId: string,
  status: AssignmentStatus,
  data: Record<string, unknown> = {}
): void => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(assignmentId).emit("assignment-status-update", {
    assignmentId,
    status,
    ...data
  });
};
