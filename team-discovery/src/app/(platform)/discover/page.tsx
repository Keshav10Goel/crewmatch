import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateCompatibility, MatchProfile } from "@/lib/matching";
import { ConnectButton } from "@/components/connect-button";
import { Search, SlidersHorizontal, Users } from "lucide-react";

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string; skill?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("*").eq("id",user!.id).maybeSingle();
  const { data: candidates, error } = await supabase.from("profiles").select("id,username,full_name,headline,bio,avatar_url,skills,interests,goals,looking_for,availability_hours,experience_level,preferred_duration,collaboration_preferences,city,state,organization,discoverability,created_at").neq("id",user!.id).in("discoverability",["everyone","relevant"]).order("updated_at",{ascending:false}).limit(100);
  const { data: blocks } = await supabase.from("blocks").select("blocked_id,blocker_id").or(`blocker_id.eq.${user!.id},blocked_id.eq.${user!.id}`);
  const blocked = new Set((blocks ?? []).flatMap((b:any)=>[b.blocked_id,b.blocker_id]));
  const q = (params.q ?? "").trim().toLowerCase();
  const skill = (params.skill ?? "").trim().toLowerCase();
  const visible = (candidates ?? []).filter((c:any)=>!blocked.has(c.id))
    .filter((c:any)=>!q || [c.full_name,c.username,c.headline,c.bio,...(c.skills??[]),...(c.interests??[])].some(v=>String(v??"").toLowerCase().includes(q)))
    .filter((c:any)=>!skill || (c.skills??[]).some((s:string)=>s.toLowerCase().includes(skill)))
    .map((c:any)=>({ ...c, match:calculateCompatibility(me as MatchProfile,c as MatchProfile) }))
    .sort((a:any,b:any)=>b.match.score-a.match.score);
  return <div className="space-y-6">
    <div><p className="text-sm text-violet-300">People, not just profiles</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Discover teammates</h1><p className="mt-2 text-sm text-slate-400">Recommendations use profile data and explainable heuristics, not personality guesses.</p></div>
    <form className="panel grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]"><label className="relative"><Search size={16} className="absolute top-3.5 left-3 text-slate-500"/><input className="field pl-9" name="q" defaultValue={params.q} placeholder="Search people, skills, interests…"/></label><label className="relative"><SlidersHorizontal size={15} className="absolute top-3.5 left-3 text-slate-500"/><input className="field pl-9" name="skill" defaultValue={params.skill} placeholder="Filter by skill"/></label><button className="btn btn-primary" type="submit">Apply filters</button></form>
    {error ? <div role="alert" className="panel p-6 text-sm text-red-200">Could not load people. Check your Supabase schema and permissions, then retry.</div> : visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((p:any)=> <article key={p.id} className="panel flex flex-col p-5"><div className="flex items-start gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-400/20 to-blue-400/20 text-lg font-semibold text-violet-100">{p.full_name?.slice(0,1)?.toUpperCase()||"B"}</div><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{p.full_name}</h2><p className="mt-1 truncate text-xs text-slate-500">@{p.username}</p><p className="mt-2 text-sm text-slate-300">{p.headline || "Builder open to collaboration"}</p></div><span className="pill shrink-0">{p.match.score}% fit</span></div><p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-5 text-slate-400">{p.bio || "This builder has not added a bio yet."}</p><div className="mt-4 flex flex-wrap gap-2">{(p.skills??[]).slice(0,5).map((s:string)=><span className="pill" key={s}>{s}</span>)}</div><div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">{p.availability_hours != null && <span>{p.availability_hours} hrs/week</span>}{p.city && <span>· {p.city}{p.state ? `, ${p.state}` : ""}</span>}{p.experience_level && <span>· {p.experience_level}</span>}</div><div className="mt-4 rounded-xl border border-white/5 bg-white/[.025] p-3"><p className="text-xs font-medium text-slate-300">Why this profile?</p>{p.match.reasons.length ? <ul className="mt-2 space-y-1">{p.match.reasons.slice(0,2).map((r:string)=><li key={r} className="text-xs leading-5 text-slate-500">• {r}</li>)}</ul> : <p className="mt-2 text-xs leading-5 text-slate-500">Not enough overlapping profile data yet. A score is a heuristic, not a success probability.</p>}</div><div className="mt-5 flex gap-2"><Link href={`/people/${p.username}`} className="btn btn-ghost flex-1">View profile</Link><ConnectButton recipientId={p.id}/></div></article>)}</div> : <div className="panel p-10 text-center"><Users size={26} className="mx-auto text-slate-500"/><h2 className="mt-3 font-semibold">No people match those filters</h2><p className="mt-2 text-sm text-slate-500">Try a broader skill or clear your search.</p><Link href="/discover" className="btn btn-ghost mt-4">Clear filters</Link></div>}
  </div>;
}
