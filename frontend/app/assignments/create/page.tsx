"use client";

import { AppShell } from "@/src/components/AppShell";
import { AssignmentForm } from "@/src/components/AssignmentForm";


export default function CreateAssignmentPage() {
  return (
    <AppShell title="Assignment">
      <main className="px-1 py-2 md:px-4">
        <AssignmentForm />
      </main>
    </AppShell>
  );
}
