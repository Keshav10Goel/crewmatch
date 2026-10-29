import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Brand } from "@/components/brand";
import { LayoutDashboard, Compass, BriefcaseBusiness, Users, MessageSquare, Bell, Settings, Plus, LogOut, Layers3 } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover people", icon: Compass },
  { href: "/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { href: "/matches", label: "My matches", icon: Layers3 },
  { href: "/connections", label: "Connections", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name,username,avatar_url,headline,discoverability").eq("id", user.id).maybeSingle();
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Builder";
  return <div className="shell min-h-screen md:flex">
    <aside className="hidden w-[248px] shrink-0 border-r border-white/5 bg-[#0d1019] px-4 py-5 md:flex md:flex-col">
      <Link href="/"><Brand/></Link>
      <Link href="/opportunities/new" className="btn btn-primary mt-8 w-full"><Plus size={16}/> Post an opportunity</Link>
      <nav className="mt-7 space-y-1">{nav.map(({href,label,icon:Icon})=><Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"><Icon size={17}/>{label}</Link>)}</nav>
      <div className="mt-auto border-t border-white/5 pt-4">
        <Link href="/profile" className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5"><div className="grid h-9 w-9 place-items-center rounded-full bg-violet-400/15 font-semibold text-violet-200">{displayName.slice(0,1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{displayName}</p><p className="truncate text-xs text-slate-500">@{profile?.username || "complete-profile"}</p></div></Link>
        <SignOutButton/>
      </div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between border-b border-white/5 bg-[#090b12]/90 px-5 backdrop-blur md:px-8">
        <div className="md:hidden"><Link href="/"><Brand/></Link></div>
        <p className="hidden text-sm text-slate-500 md:block">Find your people. Build what matters.</p>
        <div className="flex items-center gap-2"><span className="hidden text-xs text-slate-500 sm:inline">Signed in as</span><span className="max-w-[180px] truncate text-sm">{displayName}</span><Link href="/settings" aria-label="Settings" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><Settings size={17}/></Link></div>
      </header>
      <nav className="sticky top-[66px] z-20 flex gap-1 overflow-x-auto border-b border-white/5 bg-[#0b0e17] px-3 py-2 md:hidden">{nav.slice(0,6).map(({href,label,icon:Icon})=><Link key={href} href={href} className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white"><Icon size={14}/>{label}</Link>)}</nav>
      <main className="mx-auto w-full max-w-[1320px] p-5 md:p-8">{children}</main>
    </div>
  </div>;
}
