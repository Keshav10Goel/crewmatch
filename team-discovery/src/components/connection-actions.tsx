"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export function ConnectionActions({connectionId,status,incoming}:{connectionId:string;status:string;incoming:boolean}){
 const [current,setCurrent]=useState(status);const [error,setError]=useState("");
 async function update(next:"accepted"|"declined"|"withdrawn"|"disconnected"){setError("");const s=createClient();const {error}=await s.from("connections").update({status:next,updated_at:new Date().toISOString()}).eq("id",connectionId);if(error){setError(error.message);return;}setCurrent(next);}
 if(current==="pending"&&incoming)return <div className="flex gap-2"><button className="btn btn-primary" onClick={()=>update("accepted")}>Accept</button><button className="btn btn-ghost" onClick={()=>update("declined")}>Decline</button>{error&&<span role="alert" className="text-xs text-red-300">{error}</span>}</div>;
 if(current==="pending"&&!incoming)return <button className="btn btn-ghost" onClick={()=>update("withdrawn")}>Withdraw request</button>;
 if(current==="accepted")return <div><button className="btn btn-ghost" onClick={()=>update("disconnected")}>Disconnect</button>{error&&<p role="alert" className="mt-1 text-xs text-red-300">{error}</p>}</div>;
 return <span className="pill">{current}</span>;
}
