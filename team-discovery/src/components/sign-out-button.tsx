"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
export function SignOutButton() {
  const [busy,setBusy] = useState(false); const router = useRouter();
  async function signOut() { setBusy(true); const supabase = createClient(); await supabase.auth.signOut(); router.push("/"); router.refresh(); }
  return <button onClick={signOut} disabled={busy} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-500 hover:bg-white/5 hover:text-white"><LogOut size={16}/>{busy ? "Signing out…" : "Sign out"}</button>;
}
