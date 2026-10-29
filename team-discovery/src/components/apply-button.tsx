"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, LoaderCircle, Send } from "lucide-react";

export function ApplyButton({opportunityId,existingStatus}:{opportunityId:string;existingStatus:string|null}){
 const [status,setStatus]=useState(existingStatus);const [open,setOpen]=useState(false);const [intro,setIntro]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");try{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Please log in again.");const {error}=await supabase.from("applications").insert({opportunity_id:opportunityId,applicant_id:user.id,introduction:intro.trim(),status:"pending"});if(error){if(error.code==="23505")throw new Error("You already have an active application.");throw error;}setStatus("pending");setOpen(false);}catch(e){setError(e instanceof Error?e.message:"Could not submit application.");}finally{setBusy(false);}}
 if(status)return <span className="pill"><Check size={13} className="mr-1"/>{status==="pending"?"Application pending":`Application: ${status}`}</span>;
 return <div className="flex flex-col items-end gap-2"><button className="btn btn-primary" onClick={()=>setOpen(!open)}><Send size={15}/>{open?"Close application":"Apply to join"}</button>{open&&<form onSubmit={submit} className="mt-2 w-full min-w-[280px] space-y-3 rounded-xl border border-white/10 bg-[#0c101a] p-4 sm:w-[360px]"><label className="block text-sm">Short introduction<textarea className="field mt-2 min-h-24" required minLength={20} maxLength={1200} value={intro} onChange={e=>setIntro(e.target.value)} placeholder="Share your relevant skills, interest, and availability."/></label>{error&&<p role="alert" className="text-xs text-red-300">{error}</p>}<button disabled={busy} className="btn btn-primary w-full">{busy?<LoaderCircle size={15} className="animate-spin"/>:<Send size={15}/>}Submit application</button></form>}</div>;
}
