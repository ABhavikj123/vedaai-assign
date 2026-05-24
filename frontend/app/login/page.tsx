"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useAssignmentStore((state) => state.login);
  const clearError = useAssignmentStore((state) => state.clearError);
  const error = useAssignmentStore((state) => state.error);
  const loading = useAssignmentStore((state) => state.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login({ email, password });
      router.push("/assignments");
    } catch {
      return;
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-app-gradient p-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-[0_18px_55px_rgba(0,0,0,0.18)]">
        <img src="/symbols/logo_web.svg" alt="VedaAI" width={174} height={56} className="h-14 w-auto" />
        <h1 className="mt-10 font-display text-3xl font-extrabold">Welcome back</h1>
        <p className="mt-2 font-action text-[#777]">Sign in to manage assignments and generated papers.</p>
        <label className="field-label mt-8">
          Email
          <input className="field-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="field-label mt-5">
          Password
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="mt-4 font-action text-sm font-semibold text-[#c53535]">{error}</p> : null}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="mt-8 h-[52px] w-full rounded-full bg-[#181818] font-action font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p className="mt-5 text-center font-action text-sm text-[#666]">
          Need an account?{" "}
          <Link href="/signup" className="font-bold text-[#303030] underline">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
