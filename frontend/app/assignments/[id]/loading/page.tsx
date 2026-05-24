"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/src/components/AppShell";
import { Icon } from "@/src/components/Icon";
import { useAssignmentSocket } from "@/src/hooks/useAssignmentSocket";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";

export default function AssignmentLoadingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const assignmentId = params.id;

  const status = useAssignmentStore(
    (state) => state.realTimeStatus[assignmentId]
  );

  const fetchAssignment = useAssignmentStore(
    (state) => state.fetchAssignment
  );

  const assignment = useAssignmentStore((state) =>
    state.activeAssignments.find((item) => item._id === assignmentId)
  );

  const globalStoreError = useAssignmentStore(
    (state) => state.error
  );

  useAssignmentSocket(assignmentId);

  useEffect(() => {
    void fetchAssignment(assignmentId);
  }, [assignmentId, fetchAssignment]);

  useEffect(() => {
    if (status === "completed") {
      router.replace(`/assignments/${assignmentId}`);
    }
  }, [assignmentId, router, status]);

  const rawError =
    assignment?.failureReason ||
    (assignment as any)?.error ||
    globalStoreError;

  useEffect(() => {
    if (status === "failed" && rawError) {
      console.error(
        "Developer Debug - Assignment Generation Exception Payload:",
        rawError
      );
    }
  }, [status, rawError]);

  let message = "Analyzing uploaded material and generating questions...";

  if (status === "processing") {
    message = "Structuring sections, marks distribution and question flow...";
  } else if (status === "failed") {
    const userFriendlyFallback =
      "An internal configuration error occurred while compiling your quiz questions. Please retry.";

    const isRawJsonError =
      rawError?.trim().startsWith("{") ||
      rawError?.toLowerCase().includes("not_found") ||
      rawError?.toLowerCase().includes("status");

    message = isRawJsonError
      ? userFriendlyFallback
      : rawError || userFriendlyFallback;
  }

  return (
    <AppShell title="Create New">
      <main className="grid min-h-[calc(100vh-120px)] place-items-center px-4 py-10 bg-gradient-to-br from-slate-50 to-slate-100">
        <section className="relative w-full max-w-[620px] overflow-hidden rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(0,0,0,0.08)] md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.03),transparent_60%)]" />

          <div className="relative z-10">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-slate-100">
              {status === "failed" ? (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-red-50">
                  <Icon
                    name="cross_symbol.svg"
                    alt=""
                    size={28}
                    className="text-red-600"
                  />
                </div>
              ) : (
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-24 w-24 rounded-full border-[6px] border-slate-200" />

                  <span className="h-24 w-24 animate-spin rounded-full border-[6px] border-transparent border-t-blue-500 border-r-blue-500" />

                  <div className="absolute grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <Icon
                      name="magic_sparkles_symbol.svg"
                      alt=""
                      size={24}
                    />
                  </div>
                </div>
              )}
            </div>

            <h1 className="mt-10 text-center font-display text-[34px] font-extrabold leading-tight text-slate-900">
              {status === "failed"
                ? "Generation Failed"
                : assignment?.title || "Generating Assignment"}
            </h1>

            <p
              className={`mx-auto mt-4 max-w-[480px] text-center font-action text-[16px] leading-[28px] ${status === "failed"
                  ? "rounded-2xl bg-red-50 px-5 py-4 text-red-600"
                  : "text-slate-600"
                }`}
            >
              {message}
            </p>

            {status !== "failed" ? (
              <div className="mt-10">
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[72%] animate-pulse rounded-full bg-blue-500" />
                </div>

                <div className="mt-4 flex items-center justify-between font-action text-[14px] text-slate-500">
                  <span>Generating PDF</span>
                  <span>Please wait...</span>
                </div>
              </div>
            ) : null}

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/assignments"
                className="flex h-[56px] items-center justify-center rounded-full bg-slate-100 px-8 font-action text-[16px] font-semibold text-slate-700 transition-all hover:bg-slate-200"
              >
                Dashboard
              </Link>

              {status === "failed" ? (
                <Link
                  href={`/assignments/${assignmentId}`}
                  className="flex h-[56px] items-center justify-center rounded-full bg-blue-600 px-8 font-action text-[16px] font-semibold text-white transition-all hover:bg-blue-700"
                >
                  Open Assignment
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}