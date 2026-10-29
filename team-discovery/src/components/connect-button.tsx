"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Check, LoaderCircle } from "lucide-react";

export function ConnectButton({ recipientId }: { recipientId: string }) {
  const [busy,setBusy] = useState(false);
  const [status,setStatus] = useState<"idle"|"sent"|"error">("idle");
  const [error,setError] = useState("");
  async function connect() {
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { data:{user}, error:userError } = await supabase.auth.getUser();
      if(userError || !user) throw new Error("Please log in again.");
      if(user.id===recipientId) throw new Error("You cannot connect with yourself.");
      const { error } = await supabase.from("connections").insert({ requester_id:user.id, recipient_id:recipientId, status:"pending" });
      if(error) {
        if(error.code==="23505") throw new Error("A request already exists between these profiles.");
        throw error;
      }
      setStatus("sent");
    } catch(e) { setStatus("error"); setError(e instanceof Error ? e.message : "Could not send request."); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-col items-end"><button onClick={connect} disabled={busy||status==="sent"} className="btn btn-primary shrink-0 px-3">{busy?<LoaderCircle size={15} className="animate-spin"/>:status==="sent"?<Check size={15}/>:<UserPlus size={15}/>}{status==="sent"?"Request sent":"Connect"}</button>{status==="error"&&<span role="alert" className="mt-1 max-w-36 text-right text-[10px] text-red-300">{error}</span>}</div>;
}
