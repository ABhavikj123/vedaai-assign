"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/src/components/AppShell";
import { formatDate } from "@/src/lib/format";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";


export default function LibraryPage() {
  const assignments = useAssignmentStore((state) => state.activeAssignments);
  const cloneAssignmentParameters = useAssignmentStore((state) => state.cloneAssignmentParameters);
  const [search, setSearch] = useState("");
  const completed = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.status === "completed")
        .filter((assignment) => assignment.title.toLowerCase().includes(search.toLowerCase())),
    [assignments, search]
  );

  return (
    <AppShell title="My Library">
      <main className="rounded-[24px] bg-white p-6">
        <h1 className="font-display text-3xl font-extrabold">Approved Question Papers</h1>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search library"
          className="mt-5 h-12 w-full rounded-full border border-black/10 bg-[#f6f6f6] px-5 font-action outline-none"
        />
        <div className="mt-6 grid gap-3">
          {completed.map((assignment) => (
            <article key={assignment._id} className="rounded-2xl bg-[#f3f3f3] p-4">
              <h2 className="font-display text-xl font-bold">{assignment.title}</h2>
              <p className="mt-2 font-action text-[#666]">
                {assignment.totalQuestions} questions | {assignment.totalMarks} marks | Due {formatDate(assignment.dueDate)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/assignments/${assignment._id}`} className="rounded-full bg-white px-4 py-2 font-action font-semibold">
                  Open
                </Link>
                <Link
                  href="/assignments/create"
                  onClick={() => cloneAssignmentParameters(assignment)}
                  className="rounded-full bg-[#181818] px-4 py-2 font-action font-semibold text-white"
                >
                  Clone Parameters
                </Link>
              </div>
            </article>
          ))}
          {completed.length === 0 ? (
            <p className="font-action text-[#777]">Completed generated papers will appear here for quick reuse.</p>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
