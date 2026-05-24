import type { Assignment, UserProfile } from "@/src/types/assignment";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiOptions extends RequestInit {
  token?: string | null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    const body = contentType?.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      const safeMessage =
        response.status >= 500
          ? body?.message || "The server could not complete this action. Please try again after a moment."
          : body?.message || "Request failed";
      throw new ApiError(safeMessage, response.status);
    }

    return body as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Server is not responding. Please check your connection.", 0);
    }
    throw error;
  }
}

export const api = {
  signup(payload: Record<string, string>) {
    return request<{ success: boolean; token: string; user: UserProfile }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  login(payload: { email: string; password: string }) {
    return request<{ success: boolean; token: string; user: UserProfile }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateProfile(token: string, payload: Partial<UserProfile>) {
    return request<{ success: boolean; user: UserProfile }>("/api/profile/settings", {
      method: "PUT",
      token,
      body: JSON.stringify(payload)
    });
  },
  createAssignment(token: string, formData: FormData) {
    return request<{ success: boolean; assignmentId: string; status: string }>("/api/assignments/create", {
      method: "POST",
      token,
      body: formData
    });
  },
  listAssignments(token: string) {
    return request<{ success: boolean; assignments: Assignment[] }>("/api/assignments", { token });
  },
  getAssignment(token: string, id: string) {
    return request<{ success: boolean; assignment: Assignment }>(`/api/assignments/${id}`, { token });
  },
  regenerateAssignment(token: string, id: string) {
    return request<{ success: boolean; assignmentId: string; status: string }>(`/api/assignments/${id}/regenerate`, {
      method: "POST",
      token
    });
  },
  deleteAssignment(token: string, id: string) {
    return request<{ success: boolean }>(`/api/assignments/${id}`, {
      method: "DELETE",
      token
    });
  }
};

export const buildPdfUrl = (assignmentId: string) => `${API_BASE_URL}/api/assignments/${assignmentId}/download-pdf`;
