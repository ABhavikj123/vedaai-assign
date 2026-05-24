"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "@/src/lib/api";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";
import type { AssignmentStatus, GeneratedPaper } from "@/src/types/assignment";

export function useAssignmentSocket(assignmentId?: string) {
  const token = useAssignmentStore((state) => state.token);
  const setRealTimeStatus = useAssignmentStore((state) => state.setRealTimeStatus);

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    socket.emit("join-assignment-room", assignmentId);
    socket.on(
      "assignment-status-update",
      (payload: { assignmentId: string; status: AssignmentStatus; data?: GeneratedPaper }) => {
        if (payload.assignmentId === assignmentId) {
          setRealTimeStatus(payload.assignmentId, payload.status, payload.data);
        }
      }
    );

    return () => {
      socket.emit("leave-assignment-room", assignmentId);
      socket.disconnect();
    };
  }, [assignmentId, setRealTimeStatus, token]);
}
