"use client";

import Link from "next/link";
import { AppShell } from "@/src/components/AppShell";
import { formatDate } from "@/src/lib/format";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";


export default function HomePage() {
  const assignments = useAssignmentStore((state) => state.activeAssignments);
  const groups = useAssignmentStore((state) => state.groups);

  return (
    <AppShell title="Home">
      <main className="space-y-5">
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Active Assessments", assignments.filter((assignment) => assignment.status !== "completed").length],
            ["Generated Papers", assignments.filter((assignment) => assignment.status === "completed").length],
            ["Class Cohorts", groups.length]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] bg-white p-6">
              <p className="font-action text-[#777]">{label}</p>
              <p className="mt-3 font-display text-4xl font-extrabold">{value}</p>
            </div>
          ))}
        </section>
        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="rounded-[24px] bg-white p-6">
            <h1 className="font-display text-2xl font-extrabold">Question Papers</h1>
            <div className="mt-5 grid gap-3">
              {assignments.map((assignment) => (
                <Link key={assignment._id} href={`/assignments/${assignment._id}`} className="grid gap-3 rounded-2xl bg-[#f3f3f3] p-4 md:grid-cols-[1fr_auto_auto_auto]">
                  <span className="font-display font-bold">{assignment.title}</span>
                  <span className="font-action text-[#666]">{assignment.totalQuestions} questions</span>
                  <span className="font-action text-[#666]">{assignment.totalMarks} marks</span>
                  <span className="font-action text-[#666]">{formatDate(assignment.dueDate)}</span>
                </Link>
              ))}
              {assignments.length === 0 ? <p className="font-action text-[#777]">Create an assignment to populate your dashboard.</p> : null}
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
