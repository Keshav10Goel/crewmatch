import Link from "next/link";
import { ArrowRight, BadgeCheck, Code2, Compass, GitFork, Handshake, Layers3, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Brand } from "@/components/brand";

const features = [
  { icon: Compass, title: "Discover beyond your circle", text: "Find builders by skill, role, availability, and the kind of work they want to do." },
  { icon: Sparkles, title: "Understand every match", text: "Transparent recommendations explain the overlap and the gaps. No mystery score." },
  { icon: Layers3, title: "Build teams with intent", text: "Publish opportunities, define open roles, review applications, and form a team." },
  { icon: ShieldCheck, title: "Your profile, your rules", text: "Control discoverability. Block and report users. Keep private contact details private." }
];

export function Landing() {
  return <main className="shell overflow-hidden">
    <header className="container flex h-[78px] items-center justify-between">
      <Link href="/"><Brand /></Link>
      <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
        <a href="#how-it-works" className="hover:text-white">How it works</a>
        <a href="#features" className="hover:text-white">Why CrewMatch</a>
        <a href="#safety" className="hover:text-white">Safety</a>
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn btn-ghost text-sm">Log in</Link>
        <Link href="/signup" className="btn btn-primary text-sm">Get started <ArrowRight size={16}/></Link>
      </div>
    </header>
    <section className="container grid min-h-[640px] items-center gap-14 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-xs text-violet-200"><Sparkles size={14}/> Built for people who build</div>
        <h1 className="max-w-3xl text-5xl leading-[1.05] font-semibold tracking-[-.055em] sm:text-6xl lg:text-7xl">Your next great teammate <span className="gradient-text">isn't in your group chat.</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">Find collaborators who complement your skills, share your ambition, and want to build what you have in mind.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className="btn btn-primary">Find my team <ArrowRight size={17}/></Link>
          <Link href="/opportunities" className="btn btn-ghost">Explore opportunities</Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><BadgeCheck size={15} className="text-emerald-300"/> Explainable matching</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-blue-300"/> Privacy controls</span>
          <span className="inline-flex items-center gap-2"><Code2 size={15} className="text-violet-300"/> Built for builders</span>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-10 rounded-full bg-violet-500/10 blur-3xl"/>
        <div className="panel relative p-5 shadow-2xl shadow-black/30">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-semibold">Your collaboration feed</p><p className="mt-1 text-xs text-slate-500">A preview of what discovery feels like</p></div><span className="pill"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-300"/>Open to build</span></div>
          <div className="rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-400/10 to-blue-400/5 p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-400/15 text-xl font-semibold text-violet-200">AR</div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">Aarav Rao</p><span className="pill">Frontend developer</span></div><p className="mt-1 text-sm text-slate-400">Building accessible products with React and a little ambition.</p><div className="mt-3 flex flex-wrap gap-2"><span className="pill">React</span><span className="pill">TypeScript</span><span className="pill">Next.js</span></div></div>
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-300">Example match explanation</span><span className="text-emerald-300">Strong role fit</span></div><p className="text-sm leading-6 text-slate-400">Their frontend skills could fill a role on your AI project. Both profiles list weekend availability.</p></div>
            <div className="mt-4 flex gap-2"><button className="btn btn-primary flex-1" type="button">View profile</button><button className="btn btn-ghost flex-1" type="button">Save for later</button></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/5 bg-white/[.025] p-4"><Users size={17} className="mb-3 text-blue-300"/><p className="text-sm font-medium">People first</p><p className="mt-1 text-xs text-slate-500">Skills, goals, working style</p></div><div className="rounded-xl border border-white/5 bg-white/[.025] p-4"><GitFork size={17} className="mb-3 text-violet-300"/><p className="text-sm font-medium">Projects that move</p><p className="mt-1 text-xs text-slate-500">From idea to team</p></div></div>
          <p className="mt-3 text-center text-[11px] text-slate-600">Illustrative preview · not a real user or live match</p>
        </div>
      </div>
    </section>
    <section id="how-it-works" className="container border-t border-white/5 py-16">
      <div className="max-w-2xl"><p className="text-xs font-semibold tracking-[.2em] text-violet-300 uppercase">Less guesswork, better teams</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Go from “who do I know?” to “who do we need?”</h2><p className="mt-4 leading-7 text-slate-400">A clearer way to find complementary skills, make a plan, and start working together.</p></div>
      <div className="mt-9 grid gap-4 md:grid-cols-3">{[{n:"01",t:"Show your strengths",d:"Build a profile with skills, goals, availability, and the work you want to do."},{n:"02",t:"Find the missing piece",d:"Explore people and opportunities with explainable, preference-based recommendations."},{n:"03",t:"Make it official",d:"Connect, apply to a role, and form a team around a real project."}].map(x=><div key={x.n} className="panel p-6"><p className="text-sm text-violet-300">{x.n}</p><h3 className="mt-5 text-lg font-semibold">{x.t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{x.d}</p></div>)}</div>
    </section>
    <section id="features" className="container py-10 pb-20"><div className="grid gap-4 sm:grid-cols-2">{features.map(({icon:Icon,title,text})=><div key={title} className="panel flex gap-4 p-6"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-200"><Icon size={20}/></div><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div></div>)}</div></section>
    <section id="safety" className="container pb-20"><div className="panel flex flex-col justify-between gap-6 p-8 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-sm text-emerald-300"><Handshake size={17}/> Collaboration with control</div><h2 className="mt-3 text-2xl font-semibold">Good teams start with trust.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Discoverability is opt-in by setting. Private contact details stay private by default. Report and block controls are part of the product, not an afterthought.</p></div><Link href="/signup" className="btn btn-primary shrink-0">Create your profile <ArrowRight size={16}/></Link></div></section>
    <footer className="border-t border-white/5"><div className="container flex flex-col gap-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><Brand/><p>Built for the next generation of Indian builders.</p><div className="flex gap-4"><a href="#safety">Safety</a><a href="mailto:hello@crewmatch.example">Contact</a><Link href="/login">Log in</Link></div></div></footer>
  </main>;
}
