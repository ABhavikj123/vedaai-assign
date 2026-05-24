"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/src/components/Icon";
import { formatDate } from "@/src/lib/format";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";
import type { Assignment } from "@/src/types/assignment";

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const router = useRouter();

  const deleteAssignment = useAssignmentStore(
    (state) => state.deleteAssignment
  );

  const viewAssignment = () => {
    router.push(
      assignment.status === "completed"
        ? `/assignments/${assignment._id}`
        : `/assignments/${assignment._id}/loading`
    );
  };

  return (
    <>
      <article className="relative flex min-h-[116px] flex-col justify-between rounded-[28px] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(0,0,0,0.04)] md:min-h-[180px] md:px-8 md:py-7">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={viewAssignment}
            className="max-w-[82%] text-left"
          >
            <h3 className="font-display text-[20px] font-extrabold leading-[1.35] text-[#303030] md:text-[28px]">
              {assignment.title}
            </h3>
          </button>

          <button
            type="button"
            aria-label="Assignment options"
            onClick={() => setOpen((value) => !value)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-[#f3f3f3]"
          >
            <Icon
              name="vertical_three_dots_symbol.svg"
              alt=""
              size={18}
              className=""
            />
          </button>
        </div>

        <div className="mt-7 flex flex-col gap-2 text-[15px] text-[#737373] sm:flex-row sm:items-center sm:justify-between md:mt-10 md:text-[16px]">
          <p className="font-medium">
            <span className="font-extrabold text-[#303030]">
              Assigned on :
            </span>{" "}
            {formatDate(assignment.createdAt)}
          </p>

          <p className="font-medium">
            <span className="font-extrabold text-[#303030]">
              Due :
            </span>{" "}
            {formatDate(assignment.dueDate)}
          </p>
        </div>

        {open ? (
          <div className="absolute right-5 top-14 z-20 w-[170px] rounded-2xl bg-white p-2 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                viewAssignment();
              }}
              className="block w-full rounded-xl px-4 py-3 text-left font-action text-[15px] font-medium text-[#303030] transition-colors hover:bg-[#f5f5f5]"
            >
              View Assignment
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirming(true);
              }}
              className="mt-1 block w-full rounded-xl px-4 py-3 text-left font-action text-[15px] font-medium text-[#ff5b37] transition-colors hover:bg-[#fff1ec]"
            >
              Delete
            </button>
          </div>
        ) : null}
      </article>

      {confirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-xl">
            <h4 className="font-display text-[24px] font-extrabold text-[#303030]">
              Delete assignment
            </h4>

            <p className="mt-2 font-action text-sm leading-6 text-[#666666]">
              This removes the assignment and generated paper from your
              dashboard.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full bg-[#f1f1f1] px-5 py-2.5 font-action text-sm font-semibold text-[#303030]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  void deleteAssignment(assignment._id);
                }}
                className="rounded-full bg-[#181818] px-5 py-2.5 font-action text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}