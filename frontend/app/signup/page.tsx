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
  const fullNameOk = form.fullName.trim().length > 1;
  const schoolNameOk = form.schoolName.trim().length > 1;
  const schoolAddressOk = form.schoolAddress.trim().length > 1;

  const passwordLength = form.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasLowercase = /[a-z]/.test(form.password);
  const hasNumber = /\d/.test(form.password);
  const passwordOk = passwordLength && hasUppercase && hasLowercase && hasNumber;

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
    password: { ok: passwordOk, message: "Password requirements not met" },
    schoolName: { ok: schoolNameOk, message: "Please enter your school name (at least 2 characters)." },
    schoolAddress: { ok: schoolAddressOk, message: "Please enter your school address (at least 2 characters)." }
  };

  const getPasswordRequirementStatus = (isValid: boolean) => {
    return isValid ? "text-green-600" : "text-gray-400";
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
            const isPasswordField = k === "password";

            return (
              <div key={k} className={isPasswordField ? "md:col-span-2" : ""}>
                <label className="field-label">
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
                </label>

                {isPasswordField && (form.password.length > 0 || touched[k]) && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Password requirements:</p>
                    <ul className="space-y-1.5 text-xs">
                      <li className={`flex items-center gap-2 ${getPasswordRequirementStatus(passwordLength)}`}>
                        <span className={`text-lg ${passwordLength ? "✓" : "○"}`}></span>
                        At least 8 characters
                      </li>
                      <li className={`flex items-center gap-2 ${getPasswordRequirementStatus(hasUppercase)}`}>
                        <span className={`text-lg ${hasUppercase ? "✓" : "○"}`}></span>
                        One uppercase letter (A-Z)
                      </li>
                      <li className={`flex items-center gap-2 ${getPasswordRequirementStatus(hasLowercase)}`}>
                        <span className={`text-lg ${hasLowercase ? "✓" : "○"}`}></span>
                        One lowercase letter (a-z)
                      </li>
                      <li className={`flex items-center gap-2 ${getPasswordRequirementStatus(hasNumber)}`}>
                        <span className={`text-lg ${hasNumber ? "✓" : "○"}`}></span>
                        One number (0-9)
                      </li>
                    </ul>
                  </div>
                )}

                {showError && !isPasswordField && (
                  <p className="mt-2 text-sm font-action text-[#c53535]">{v.message}</p>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="font-action text-sm font-semibold text-[#c53535]">{error}</p>
            <p className="font-action text-xs text-gray-600 mt-1">Please check your information and try again.</p>
          </div>
        )}

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
