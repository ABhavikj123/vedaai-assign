"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/src/components/AppShell";
import { Icon } from "@/src/components/Icon";
import { PaperPreview } from "@/src/components/PaperPreview";
import { API_BASE_URL } from "@/src/lib/api";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";


export default function AssignmentOutputPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const assignmentId = params.id;
  const token = useAssignmentStore((state) => state.token);
  const assignment = useAssignmentStore((state) => state.activeAssignments.find((item) => item._id === assignmentId));
  const currentPaper = useAssignmentStore((state) => state.currentPaper);
  const fetchAssignment = useAssignmentStore((state) => state.fetchAssignment);
  const regenerateAssignment = useAssignmentStore((state) => state.regenerateAssignment);
  const realTimeStatus = useAssignmentStore((state) => state.realTimeStatus[assignmentId]);
  const loading = useAssignmentStore((state) => state.loading);

  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment(assignmentId).finally(() => setHasFetched(true));
    }
  }, [assignmentId, fetchAssignment]);

  const currentStatus = realTimeStatus || assignment?.status;
  const paper = assignment?.generatedPaper || currentPaper;

  const downloadPdf = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/download-pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${assignment?.title || "assignment"}-paper.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateAssignment(assignmentId);
      router.push(`/assignments/${assignmentId}/loading`);
    } catch (err) {
      console.error(err);
    }
  };

  if (currentStatus === "failed" || (hasFetched && currentStatus === "completed" && !paper)) {
    return (
      <AppShell title="View Assignment">
        <main className="rounded-[28px] bg-[#5b5b5b] p-3 md:p-6">
          <section className="rounded-[28px] bg-white p-10 text-center shadow-sm max-w-xl mx-auto">
            <h2 className="font-display text-2xl font-extrabold text-[#303030]">Generation Failed</h2>
            <p className="mt-3 font-action text-sm text-[#5E5E5E]">
              The AI model encountered a schema parsing anomaly while compiling this paper structure.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleRegenerate}
                className="rounded-full bg-[#181818] px-6 py-3 font-action font-semibold text-white transition-all disabled:opacity-50"
              >
                {loading ? "Re-queuing..." : "Retry Generation"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/assignments")}
                className="rounded-full border border-black/20 px-6 py-3 font-action font-semibold text-[#303030]"
              >
                Back to Dashboard
              </button>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell title="Create New">
      <main className="rounded-[28px] bg-[#5b5b5b] p-3 md:p-6">
        <section className="mb-4 rounded-[26px] bg-[#272727] p-6 text-white md:p-9">
          <h1 className="max-w-5xl font-display text-[18px] font-extrabold leading-8 md:text-[24px]">
            Certainly, {assignment?.title || "Teacher"}! Here is a customized Question Paper based on your criteria:
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!paper}
              onClick={downloadPdf}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-action font-semibold text-[#303030] disabled:opacity-50"
            >
              <Icon name="download_pdf_symbol.svg" alt="" size={22} />
              Download as PDF
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleRegenerate}
              className="rounded-full border border-white/30 px-6 py-3 font-action font-semibold disabled:opacity-50"
            >
              Regenerate
            </button>
          </div>
        </section>

        {paper ? (
          <PaperPreview paper={paper} />
        ) : (
          <section className="rounded-[28px] bg-white p-10 text-center">
            <h2 className="font-display text-2xl font-extrabold">Paper is not ready yet</h2>
            <button
              type="button"
              onClick={() => router.push(`/assignments/${assignmentId}/loading`)}
              className="mt-5 rounded-full bg-[#181818] px-6 py-3 font-action font-semibold text-white"
            >
              Track Status
            </button>
          </section>
        )}
      </main>
    </AppShell>
  );
}