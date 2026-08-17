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

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const emailOk = /^\S+@\S+\.\S+$/.test(form.email);
  const passwordOk = form.password.length >= 8;
  const fullNameOk = form.fullName.trim().length > 1;
  const schoolNameOk = form.schoolName.trim().length > 1;
  const schoolAddressOk = form.schoolAddress.trim().length > 1;

  const valid = emailOk && passwordOk && fullNameOk && schoolNameOk && schoolAddressOk;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await signup(form);
      router.push("/assignments");
    } catch {
      return;
    }
  };

  const validators: Record<string, { ok: boolean; message: string }> = {
    fullName: { ok: fullNameOk, message: "Please enter your full name (at least 2 characters)." },
    email: { ok: emailOk, message: "Please enter a valid email address." },
    password: { ok: passwordOk, message: "Password must be at least 8 characters long." },
    schoolName: { ok: schoolNameOk, message: "Please enter your school name (at least 2 characters)." },
    schoolAddress: { ok: schoolAddressOk, message: "Please enter your school address (at least 2 characters)." }
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
          ].map(([key, label, type]) => {
            const k = key as string;
            const v = validators[k];
            const showError = touched[k] && !v.ok;

            return (
              <label key={k} className={`field-label ${k === "schoolAddress" ? "md:col-span-2" : ""}`}>
                {label}
                <input
                  className={`field-input ${showError ? "ring-1 ring-[#c53535]" : ""}`}
                  type={type}
                  value={(form as any)[k]}
                  onChange={(event) => setForm((current) => ({ ...current, [k]: event.target.value }))}
                  onBlur={() => setTouched((current) => ({ ...current, [k]: true }))}
                  aria-invalid={showError}
                  required
                />
                {showError ? (
                  <p className="mt-2 text-sm font-action text-[#c53535]">{v.message}</p>
                ) : null}
              </label>
            );
          })}
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
