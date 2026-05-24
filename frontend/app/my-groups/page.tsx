"use client";

import { AppShell } from "@/src/components/AppShell";
import { Icon } from "@/src/components/Icon";

export default function MyGroupsPage() {
  return (
    <AppShell title="My Groups">
      <main className="grid min-h-[calc(100vh-140px)] place-items-center px-4">
        <section className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-sm border border-black/5">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#fff3ee]">
            <Icon name="my_groups_symbol.svg" alt="" size={36} />
          </div>
          <h1 className="mt-6 font-display text-2xl font-extrabold text-[#303030]">Academic Cohorts</h1>
          <p className="mt-2 font-action text-base text-[#777] leading-relaxed max-w-sm mx-auto">
            Classroom syncing and automated student roster grouping configurations are coming soon.
          </p>
          <div className="mt-6 inline-block rounded-full bg-[#f1f1f1] px-5 py-2 text-xs font-action font-bold text-[#666] tracking-wider uppercase">
            Feature Deferred
          </div>
        </section>
      </main>
    </AppShell>
  );
}