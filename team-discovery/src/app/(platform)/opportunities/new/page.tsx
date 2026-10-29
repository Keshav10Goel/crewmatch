"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, LoaderCircle, Plus, X } from "lucide-react";

const categories=["Hackathon","College Project","AI/ML","Web Development","Startup","Open Source","Research","Social Impact","Other"];
function TagInput({label,values,setValues,placeholder}:{label:string;values:string[];setValues:(v:string[])=>void;placeholder:string}) {
 const [value,setValue]=useState("");
 function add(){const next=value.trim();if(next&&!values.some(x=>x.toLowerCase()===next.toLowerCase()))setValues([...values,next]);setValue("");}
 return <div><label className="mb-2 block text-sm">{label}</label><div className="flex gap-2"><input className="field" value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add();}}} placeholder={placeholder}/><button type="button" onClick={add} className="btn btn-ghost"><Plus size={16}/></button></div><div className="mt-2 flex flex-wrap gap-2">{values.map(v=><button type="button" key={v} onClick={()=>setValues(values.filter(x=>x!==v))} className="pill">{v}<X size={12} className="ml-1"/></button>)}</div></div>;
}
export default function NewOpportunityPage(){
 const router=useRouter(); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 const [required,setRequired]=useState<string[]>([]);const [preferred,setPreferred]=useState<string[]>([]);const [roles,setRoles]=useState<string[]>([]);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");
  const fd=new FormData(e.currentTarget);const title=String(fd.get("title")??"").trim();const summary=String(fd.get("summary")??"").trim();const description=String(fd.get("description")??"").trim();
  if(required.length===0||roles.length===0){setError("Add at least one required skill and one open role.");setBusy(false);return;}
  try{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Please log in again.");
   const payload={owner_id:user.id,title,summary,description,category:String(fd.get("category")),required_skills:required,preferred_skills:preferred,open_roles:roles,weekly_hours:Number(fd.get("weekly_hours")),collaboration_mode:String(fd.get("collaboration_mode")),duration:String(fd.get("duration")),deadline:fd.get("deadline")?String(fd.get("deadline")):null,status:"open"};
   const {data,error}=await supabase.from("opportunities").insert(payload).select("id").single();if(error)throw error;router.push(`/opportunities/${data.id}`);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not create opportunity.");}finally{setBusy(false);}
 }
 return <div className="mx-auto max-w-3xl space-y-6"><Link href="/opportunities" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft size={15}/> Back to opportunities</Link><div><p className="text-sm text-violet-300">Bring the right people together</p><h1 className="mt-2 text-3xl font-semibold">Post an opportunity</h1><p className="mt-2 text-sm text-slate-400">Be clear about the problem, the role, and the commitment you need.</p></div>
 <form onSubmit={submit} className="panel space-y-5 p-5 sm:p-7">
 <label className="block text-sm">Opportunity title<input name="title" className="field mt-2" required minLength={5} maxLength={120} placeholder="e.g. Building an AI study companion"/></label>
 <label className="block text-sm">Short summary<textarea name="summary" className="field mt-2 min-h-20" required minLength={15} maxLength={300} placeholder="What are you building and why does it matter?"/></label>
 <label className="block text-sm">Detailed description<textarea name="description" className="field mt-2 min-h-36" required minLength={30} maxLength={8000} placeholder="Problem, approach, expectations, current progress, and how decisions are made."/></label>
 <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Category<select name="category" className="field mt-2">{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="block text-sm">Collaboration mode<select name="collaboration_mode" className="field mt-2"><option>Remote</option><option>Hybrid</option><option>In person</option></select></label></div>
 <TagInput label="Required skills *" values={required} setValues={setRequired} placeholder="Type a skill, e.g. React, then + or Enter"/><TagInput label="Preferred skills" values={preferred} setValues={setPreferred} placeholder="Optional skills"/><TagInput label="Open roles *" values={roles} setValues={setRoles} placeholder="e.g. Frontend developer, ML engineer"/>
 <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Weekly commitment (hours)<input name="weekly_hours" className="field mt-2" type="number" min={1} max={80} defaultValue={6} required/></label><label className="block text-sm">Expected duration<input name="duration" className="field mt-2" required maxLength={80} placeholder="e.g. 6 weeks"/></label></div>
 <label className="block text-sm">Application deadline (optional)<input name="deadline" className="field mt-2" type="date" min={new Date().toISOString().slice(0,10)}/></label>
 {error&&<p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
 <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/5 pt-5 sm:flex-row"><Link href="/opportunities" className="btn btn-ghost">Cancel</Link><button disabled={busy} className="btn btn-primary">{busy?<LoaderCircle size={16} className="animate-spin"/>:<Plus size={16}/>}{busy?"Publishing…":"Publish opportunity"}</button></div>
 </form></div>;
}
