"use client";

import { AppShell } from "@/src/components/AppShell";
import { Icon } from "@/src/components/Icon";

export default function ToolkitPage() {
  return (
    <AppShell title="AI Teacher's Toolkit">
      <main className="grid min-h-[calc(100vh-140px)] place-items-center px-4">
        <section className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-sm border border-black/5">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-neutral-100">
            <Icon name="AI_Teacher_toolkit_symbol.svg" alt="" size={34} />
          </div>
          <h1 className="mt-6 font-display text-2xl font-extrabold text-[#303030]">Teacher&apos;s Toolkit</h1>
          <p className="mt-2 font-action text-base text-[#777] leading-relaxed max-w-sm mx-auto">
            Advanced system prompt tuning profiles and curriculum parameter matching interfaces are coming soon.
          </p>
          <div className="mt-6 inline-block rounded-full bg-[#f1f1f1] px-5 py-2 text-xs font-action font-bold text-[#666] tracking-wider uppercase">
            In Development
          </div>
        </section>
      </main>
    </AppShell>
  );
}
