"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/brand";
import { ArrowLeft, LoaderCircle } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const signup = mode === "signup";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      if (signup) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` }
        });
        if (error) throw error;
        setMessage("Account request received. Check your email to verify your address, then continue to onboarding.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard"); router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="shell grid min-h-screen place-items-center px-5 py-12">
    <div className="w-full max-w-md">
      <Link href="/" className="mb-9 inline-flex"><Brand/></Link>
      <div className="panel p-7 sm:p-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white"><ArrowLeft size={14}/> Back home</Link>
        <h1 className="text-2xl font-semibold tracking-tight">{signup ? "Build your next chapter." : "Welcome back."}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{signup ? "Create a profile and find people to build with." : "Sign in to continue building with your people."}</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          {signup && <label className="block text-sm">Full name<input className="field mt-2" autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}
          <label className="block text-sm">Email address<input className="field mt-2" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
          <label className="block text-sm">Password<input className="field mt-2" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
          {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {message && <p role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-200">{message}</p>}
          <button className="btn btn-primary w-full" disabled={busy} type="submit">{busy && <LoaderCircle className="animate-spin" size={16}/>}{busy ? "Please wait…" : signup ? "Create account" : "Log in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">{signup ? "Already have an account?" : "New to CrewMatch?"} <Link className="text-violet-300 hover:text-violet-200" href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create an account"}</Link></p>
        <p className="mt-5 text-center text-[11px] leading-5 text-slate-600">By continuing, you agree to use the platform respectfully. Add your privacy policy and terms before public launch.</p>
      </div>
    </div>
  </main>;
}
