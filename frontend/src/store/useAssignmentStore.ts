"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, ApiError } from "@/src/lib/api";
import { clampPositive } from "@/src/lib/format";
import type {
  Assignment,
  AssignmentFormState,
  AssignmentStatus,
  AppNotification,
  GeneratedPaper,
  Group,
  QuestionTypeRow,
  ToolkitRule,
  UserProfile
} from "@/src/types/assignment";

const defaultRows: QuestionTypeRow[] = [
  { type: "Multiple Choice Questions", count: 4, marks: 1 },
  { type: "Short Questions", count: 3, marks: 2 },
  { type: "Diagram/Graph-Based Questions", count: 2, marks: 5 },
  { type: "Numerical Problems", count: 2, marks: 5 }
];

const defaultFormState: AssignmentFormState = {
  title: "",
  dueDate: "",
  subject: "",
  className: "",
  timeAllowedMinutes: 60,
  instructions: "",
  file: null,
  questionTypes: defaultRows
};

interface AssignmentStore {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  formState: AssignmentFormState;
  activeAssignments: Assignment[];
  realTimeStatus: Record<string, AssignmentStatus>;
  currentPaper: GeneratedPaper | null;
  notifications: AppNotification[];
  groups: Group[];
  toolkitRules: ToolkitRule[];
  hasHydrated: boolean;
  search: string;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (payload: Record<string, string>) => Promise<void>;
  logout: () => void;
  setFormField: <K extends keyof AssignmentFormState>(key: K, value: AssignmentFormState[K]) => void;
  setQuestionTypeRow: (index: number, patch: Partial<QuestionTypeRow>) => void;
  addQuestionTypeRow: () => void;
  removeQuestionTypeRow: (index: number) => void;
  resetForm: () => void;
  submitAssignmentForm: () => Promise<string>;
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<Assignment | null>;
  deleteAssignment: (id: string) => Promise<void>;
  regenerateAssignment: (id: string) => Promise<void>;
  updateProfile: (payload: Partial<UserProfile>) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearError: () => void;
  addGroup: (payload: Omit<Group, "id" | "createdAt" | "assignmentIds">) => void;
  addToolkitRule: (payload: Omit<ToolkitRule, "id" | "createdAt">) => void;
  cloneAssignmentParameters: (assignment: Assignment) => void;
  setSearch: (value: string) => void;
  setRealTimeStatus: (id: string, status: AssignmentStatus, paper?: GeneratedPaper) => void;
  clearSessionState: () => void;
}

export const useAssignmentStore = create<AssignmentStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      formState: defaultFormState,
      activeAssignments: [],
      realTimeStatus: {},
      currentPaper: null,
      notifications: [],
      groups: [],
      toolkitRules: [],
      hasHydrated: false,
      search: "",
      loading: false,
      error: null,

      async login(credentials) {
        set({ loading: true, error: null });
        try {
          const response = await api.login(credentials);
          set({ user: response.user, token: response.token, isAuthenticated: true, loading: false, error: null });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Login failed", loading: false });
          throw error;
        }
      },

      async signup(payload) {
        set({ loading: true, error: null });
        try {
          const response = await api.signup(payload);
          set({ user: response.user, token: response.token, isAuthenticated: true, loading: false, error: null });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Signup failed", loading: false });
          throw error;
        }
      },

      logout() {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          activeAssignments: [],
          realTimeStatus: {},
          currentPaper: null,
          notifications: [],
          groups: [],
          toolkitRules: [],
          error: null
        });
      },

      clearSessionState() {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          activeAssignments: [],
          realTimeStatus: {},
          currentPaper: null,
          error: null
        });
      },

      setFormField(key, value) {
        set((state) => ({
          formState: {
            ...state.formState,
            [key]: value
          }
        }));
      },

      setQuestionTypeRow(index, patch) {
        set((state) => ({
          formState: {
            ...state.formState,
            questionTypes: state.formState.questionTypes.map((row, rowIndex) =>
              rowIndex === index
                ? {
                    ...row,
                    ...patch,
                    count: patch.count === undefined ? row.count : clampPositive(patch.count),
                    marks: patch.marks === undefined ? row.marks : clampPositive(patch.marks)
                  }
                : row
            )
          }
        }));
      },

      addQuestionTypeRow() {
        set((state) => ({
          formState: {
            ...state.formState,
            questionTypes: [
              ...state.formState.questionTypes,
              { type: "Long Answer Questions", count: 1, marks: 5}
            ]
          }
        }));
      },

      removeQuestionTypeRow(index) {
        set((state) => ({
          formState: {
            ...state.formState,
            questionTypes:
              state.formState.questionTypes.length === 1
                ? state.formState.questionTypes
                : state.formState.questionTypes.filter((_, rowIndex) => rowIndex !== index)
          }
        }));
      },

      resetForm() {
        set({ formState: { ...defaultFormState, questionTypes: [...defaultRows] } });
      },

      async submitAssignmentForm() {
        const { token, formState } = get();
        if (!token) {
          throw new Error("Please log in first");
        }
        if (!formState.title.trim() || !formState.dueDate || formState.questionTypes.length === 0) {
          throw new Error("Please complete the required assignment fields");
        }
        if (!formState.instructions.trim() && !formState.file) {
          throw new Error("Add instructions or upload a PDF/text file");
        }

        const formData = new FormData();
        formData.set("title", formState.title);
        formData.set("due_date", formState.dueDate);
        formData.set("subject", formState.subject);
        formData.set("className", formState.className);
        formData.set("timeAllowedMinutes", String(formState.timeAllowedMinutes));
        const matchingRules = get().toolkitRules.filter((rule) => {
          const classMatches = !rule.className || rule.className.toLowerCase() === formState.className.toLowerCase();
          const subjectMatches = !rule.subject || rule.subject.toLowerCase() === formState.subject.toLowerCase();
          return classMatches && subjectMatches;
        });
        const ruleInstructions = matchingRules
          .map(
            (rule) =>
              `Toolkit rule (${rule.board}, ${rule.language}): ${rule.instructions}.`
          )
          .join("\n");
        formData.set("instructions", [formState.instructions, ruleInstructions].filter(Boolean).join("\n\n"));
        formData.set("question_types", JSON.stringify(formState.questionTypes));
        if (formState.file) {
          formData.set("file", formState.file);
        }

        set({ loading: true, error: null });
        try {
          const response = await api.createAssignment(token, formData);
          set((state) => ({
            loading: false,
            realTimeStatus: {
              ...state.realTimeStatus,
              [response.assignmentId]: "pending"
            },
            notifications: [
              {
                id: crypto.randomUUID(),
                type: "info",
                message: `${formState.title} generation started`,
                timestamp: new Date().toISOString(),
                link: `/assignments/${response.assignmentId}/loading`,
                read: false
              },
              ...state.notifications
            ]
          }));
          void get().fetchAssignments();
          return response.assignmentId;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not create assignment", loading: false });
          throw error;
        }
      },

      async fetchAssignments() {
        const token = get().token;
        if (!token) {
          return;
        }
        set({ loading: true, error: null });
        try {
          const response = await api.listAssignments(token);
          set({ activeAssignments: response.assignments || [], loading: false });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            set({ user: null, token: null, isAuthenticated: false, activeAssignments: [], error: "Session expired. Please log in again.", loading: false });
          } else {
            set({ error: error instanceof Error ? error.message : "Could not load assignments", loading: false });
          }
        }
      },

      async fetchAssignment(id) {
        const token = get().token;
        if (!token) {
          return null;
        }
        try {
          const response = await api.getAssignment(token, id);
          set((state) => ({
            activeAssignments: [
              response.assignment,
              ...state.activeAssignments.filter((assignment) => assignment._id !== response.assignment._id)
            ],
            currentPaper: response.assignment.generatedPaper || state.currentPaper,
            realTimeStatus: {
              ...state.realTimeStatus,
              [id]: response.assignment.status
            }
          }));
          return response.assignment;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not load assignment" });
          return null;
        }
      },

      async deleteAssignment(id) {
        const token = get().token;
        if (!token) {
          return;
        }
        const previous = get().activeAssignments;
        set({ activeAssignments: previous.filter((assignment) => assignment._id !== id) });
        try {
          await api.deleteAssignment(token, id);
        } catch (error) {
          set({ activeAssignments: previous, error: error instanceof Error ? error.message : "Delete failed" });
        }
      },

      async regenerateAssignment(id) {
        const token = get().token;
        if (!token) {
          return;
        }
        await api.regenerateAssignment(token, id);
        set((state) => ({
          realTimeStatus: {
            ...state.realTimeStatus,
            [id]: "pending"
          },
          activeAssignments: state.activeAssignments.map((assignment) =>
            assignment._id === id ? { ...assignment, status: "pending", generatedPaper: null } : assignment
          ),
          notifications: [
            {
              id: crypto.randomUUID(),
              type: "info",
              message: "Regeneration started",
              timestamp: new Date().toISOString(),
              link: `/assignments/${id}/loading`,
              read: false
            },
            ...state.notifications
          ]
        }));
      },

      async updateProfile(payload) {
        const token = get().token;
        if (!token) {
          throw new Error("Please log in first");
        }
        const response = await api.updateProfile(token, payload);
        set({ user: response.user });
      },

      addNotification(notification) {
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              read: false
            },
            ...state.notifications
          ].slice(0, 30)
        }));
      },

      markNotificationRead(id) {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        }));
      },

      clearError() {
        set({ error: null });
      },

      addGroup(payload) {
        set((state) => ({
          groups: [
            {
              ...payload,
              id: crypto.randomUUID(),
              assignmentIds: [],
              createdAt: new Date().toISOString()
            },
            ...state.groups
          ]
        }));
      },

      addToolkitRule(payload) {
        set((state) => ({
          toolkitRules: [
            {
              ...payload,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString()
            },
            ...state.toolkitRules
          ]
        }));
      },

      cloneAssignmentParameters(assignment) {
        set({
          formState: {
            title: `${assignment.title} Copy`,
            dueDate: "",
            subject: assignment.inputMetadata?.subject || "Science",
            className: assignment.inputMetadata?.className || "Grade 8",
            timeAllowedMinutes: assignment.inputMetadata?.timeAllowedMinutes || 60,
            instructions: assignment.inputMetadata?.additionalInstructions || "",
            file: null,
            questionTypes: assignment.inputMetadata?.questionTypes || []
          }
        });
      },

      setSearch(value) {
        set({ search: value });
      },

      setRealTimeStatus(id, status, paper) {
        set((state) => ({
          realTimeStatus: {
            ...state.realTimeStatus,
            [id]: status
          },
          currentPaper: paper || state.currentPaper,
          activeAssignments: state.activeAssignments.map((assignment) =>
            assignment._id === id
              ? {
                  ...assignment,
                  status,
                  generatedPaper: paper || assignment.generatedPaper
                }
              : assignment
          ),
          notifications:
            status === "completed" || status === "failed"
              ? [
                  {
                    id: crypto.randomUUID(),
                    type: status === "completed" ? ("success" as const) : ("error" as const),
                    message: status === "completed" ? "Question paper is ready" : "Question paper generation failed",
                    timestamp: new Date().toISOString(),
                    link: status === "completed" ? `/assignments/${id}` : `/assignments/${id}/loading`,
                    read: false
                  },
                  ...state.notifications
                ].slice(0, 30)
              : state.notifications
        }));
      }
    }),
    {
      name: "vedaai-assignment-store",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => () => {
        useAssignmentStore.setState({ hasHydrated: true });
      }
    }
  )
);
