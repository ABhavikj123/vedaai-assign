"use client";

import Link from "next/link";
import { Icon } from "@/src/components/Icon";

export function EmptyAssignments() {
  return (
    <section className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center px-4 text-center">
      <img
        src="/symbols/Illustration found.svg"
        alt="No assignments"
        width={360}
        height={320}
        className="h-auto w-[230px] md:w-[330px]"
      />
      <h1 className="mt-6 font-display text-[24px] font-extrabold md:text-[30px]">No assignments yet</h1>
      <p className="mt-3 max-w-[620px] font-action text-[16px] leading-7 text-[#777] md:text-[20px]">
        Create your first assignment to start collecting and grading student submissions. You can set up rubrics,
        define marking criteria, and let AI assist with grading.
      </p>
      <Link
        href="/assignments/create"
        className="mt-8 flex h-14 items-center gap-3 rounded-full bg-[#181818] px-7 font-action text-[18px] font-semibold text-white shadow-sm"
      >
        <Icon name="add_symbol.svg" alt="" size={20} className="brightness-0 invert" />
        Create Your First Assignment
      </Link>
    </section>
  );
}
