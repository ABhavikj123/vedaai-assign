"use client";

import Link from "next/link";
import { AppShell } from "@/src/components/AppShell";
import { AssignmentCard } from "@/src/components/AssignmentCard";
import { EmptyAssignments } from "@/src/components/EmptyAssignments";
import { Icon } from "@/src/components/Icon";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";

export default function AssignmentsPage() {
  const assignments = useAssignmentStore((state) => state.activeAssignments);
  const search = useAssignmentStore((state) => state.search);
  const setSearch = useAssignmentStore((state) => state.setSearch);
  const loading = useAssignmentStore((state) => state.loading);
  const error = useAssignmentStore((state) => state.error);
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);

  const filtered = assignments
    .filter((assignment) => assignment.title.toLowerCase().includes(search.toLowerCase()))
  return (
    <AppShell title="Assignment">
      <main className="flex-1 w-full pb-24">
        {loading && assignments.length === 0 ? (
          <div className="grid h-64 place-items-center w-full">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#303030] border-t-transparent mx-auto" />
              <p className="font-action text-sm font-medium text-[#5E5E5E]">Loading assignments list...</p>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <EmptyAssignments />
        ) : (
          <div className="space-y-5 w-full">
            {error ? (
              <div className="mx-2 flex items-center justify-between gap-4 rounded-2xl border border-[#ffd7ca] bg-[#fff7f4] px-4 py-3 font-action text-sm text-[#8a3a20] md:mx-4">
                <span>We could not refresh the latest assignment changes.</span>
                <button
                  type="button"
                  onClick={() => void fetchAssignments()}
                  className="shrink-0 rounded-full bg-white px-4 py-2 font-semibold text-[#303030] shadow-sm"
                >
                  Retry
                </button>
              </div>
            ) : null}
            <section className="flex items-center gap-4 px-2 md:px-4">
              <span className="h-5 w-5 rounded-full border-4 border-[#9de3b3] bg-[#43c46d] shadow-sm" />
              <div>
                <h1 className="font-display text-[28px] font-extrabold text-[#303030]">Assignments</h1>
                <p className="font-action text-sm text-[rgba(94,94,94,0.55)]">Manage and create assignments for your classes.</p>
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-[24px] bg-white p-4 md:flex-row md:items-center md:justify-between md:p-5 shadow-sm">
              <label className="flex items-center gap-3 font-display text-[18px] font-bold text-[#aaa] cursor-pointer">
                <Icon name="Filter_by_symbol.svg" alt="" size={24} />
                <span className="hidden md:inline">Filter by</span>
              </label>
              
              <div className="relative w-full md:max-w-[520px]">
                <Icon name="Search.svg" alt="" size={24} className="absolute left-5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search Assignment"
                  className="h-14 w-full rounded-full border border-black/10 bg-white pl-14 pr-5 font-action text-base outline-none focus:border-black/30 transition-all placeholder-[#A9A9A9]"
                />
              </div>
            </section>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-[#5E5E5E] font-action">
                No assignments match your active filtering variables.
              </div>
            ) : (
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filtered.map((assignment) => (
                  <AssignmentCard key={assignment._id} assignment={assignment} />
                ))}
              </section>
            )}

            <Link
              href="/assignments/create"
              className="fixed bottom-7 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-3 rounded-full bg-[#181818] px-7 py-4 font-action text-lg font-semibold text-white shadow-xl hover:bg-[#272727] transition-all md:flex"
            >
              <Icon name="add_symbol.svg" alt="" size={18} className="brightness-0 invert" />
              Create Assignment
            </Link>
          </div>
        )}
      </main>

      <Link
        href="/assignments/create"
        aria-label="Create assignment"
        className="fixed bottom-28 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-white shadow-xl border border-black/5 lg:hidden"
      >
        <Icon name="add_symbol.svg" alt="" size={22}  />
      </Link>
    </AppShell>
  );
}
