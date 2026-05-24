"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";

export default function SignupPage() {
  const router = useRouter();
  const signup = useAssignmentStore((state) => state.signup);
  const clearError = useAssignmentStore((state) => state.clearError);
  const loading = useAssignmentStore((state) => state.loading);
  const error = useAssignmentStore((state) => state.error);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    schoolName: "",
    schoolAddress: ""
  });

  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const valid =
    /^\S+@\S+\.\S+$/.test(form.email) &&
    form.password.length >= 8 &&
    form.fullName.trim().length > 1 &&
    form.schoolName.trim().length > 1 &&
    form.schoolAddress.trim().length > 1;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await signup(form);
      router.push("/assignments");
    } catch {
      return;
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-app-gradient p-5">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-[28px] bg-white p-8 shadow-[0_18px_55px_rgba(0,0,0,0.18)]">
        <img src="/symbols/logo_web.svg" alt="VedaAI" width={174} height={56} className="h-14 w-auto" />
        <h1 className="mt-8 font-display text-3xl font-extrabold">Create teacher profile</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[
            ["fullName", "Full Name", "text"],
            ["email", "Email", "email"],
            ["password", "Password", "password"],
            ["schoolName", "School Name", "text"],
            ["schoolAddress", "School Address", "text"]
          ].map(([key, label, type]) => (
            <label key={key} className={`field-label ${key === "schoolAddress" ? "md:col-span-2" : ""}`}>
              {label}
              <input
                className="field-input"
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                required
              />
            </label>
          ))}
        </div>
        {error ? <p className="mt-4 font-action text-sm font-semibold text-[#c53535]">{error}</p> : null}
        <button
          type="submit"
          disabled={loading || !valid}
          className="mt-8 h-[52px] w-full rounded-full bg-[#181818] font-action font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
        <p className="mt-5 text-center font-action text-sm text-[#666]">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#303030] underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
