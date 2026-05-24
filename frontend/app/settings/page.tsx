"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/src/components/AppShell";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";


export default function SettingsPage() {
  const user = useAssignmentStore((state) => state.user);
  const updateProfile = useAssignmentStore((state) => state.updateProfile);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    schoolName: user?.schoolName || "",
    schoolAddress: user?.schoolAddress || "",
    profileLogoUrl: user?.profileLogoUrl || "default_profile_logo",
    schoolLogoUrl: user?.schoolLogoUrl || "default_school_logo"
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await updateProfile(form);
    setSaved(true);
  };

  return (
    <AppShell title="Settings">
      <main className="mx-auto w-full max-w-4xl rounded-[28px] bg-white p-6 md:p-10">
        <h1 className="font-display text-3xl font-extrabold">Profile Settings</h1>
        <form onSubmit={submit} className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="field-label">
            Full Name
            <input className="field-input" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
          </label>
          <label className="field-label">
            School Name
            <input className="field-input" value={form.schoolName} onChange={(event) => setForm({ ...form, schoolName: event.target.value })} />
          </label>
          <label className="field-label md:col-span-2">
            School Address
            <input
              className="field-input"
              value={form.schoolAddress}
              onChange={(event) => setForm({ ...form, schoolAddress: event.target.value })}
            />
          </label>
          <button type="submit" className="h-[52px] rounded-full bg-[#181818] font-action font-semibold text-white md:col-span-2">
            Save Settings
          </button>
          {saved ? <p className="font-action font-semibold text-[#2e8c4b] md:col-span-2">Settings saved.</p> : null}
        </form>
      </main>
    </AppShell>
  );
}
