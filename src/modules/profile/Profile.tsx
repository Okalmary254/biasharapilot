import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, Globe2, LogOut, Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

type ProfileRecord = { full_name: string; phone: string; preferred_language: "en" | "sw" };
type Business = { name: string; business_type: string | null; county: string | null; phone: string | null };
const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-midnight outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/10";

export default function Profile() {
  const { session, businessId, clearLocalSession } = useAuth();
  const navigate = useNavigate();
  const [profile,setProfile]=useState<ProfileRecord>({full_name:"",phone:"",preferred_language:"en"});
  const [business,setBusiness]=useState<Business|null>(null);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [signingOut,setSigningOut]=useState(false);
  const [error,setError]=useState(""); const [success,setSuccess]=useState("");

  useEffect(()=>{
    if(!session?.user.id||!businessId)return;
    let active=true;
    (async()=>{
      setLoading(true);
      const [p,b]=await Promise.all([
        neon.from("profiles").select("full_name,phone,preferred_language").eq("id",session.user.id).maybeSingle(),
        neon.from("businesses").select("name,business_type,county,phone").eq("id",businessId).maybeSingle()
      ]);
      if(!active)return;
      if(p.error)setError(p.error.message); else if(p.data)setProfile({full_name:p.data.full_name??"",phone:p.data.phone??"",preferred_language:p.data.preferred_language??"en"});
      if(b.error)setError(b.error.message); else setBusiness(b.data as Business|null);
      setLoading(false);
    })();
    return ()=>{active=false;};
  },[session?.user.id,businessId]);

  const save=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault(); if(!session?.user.id)return;
    setSaving(true);setError("");setSuccess("");
    const {error:e2}=await neon.from("profiles").update({full_name:profile.full_name.trim(),phone:profile.phone.trim()||null,preferred_language:profile.preferred_language,updated_at:new Date().toISOString()}).eq("id",session.user.id);
    if(e2)setError(e2.message);else setSuccess("Your profile has been updated.");
    setSaving(false);
  };
  const logout=async()=>{
    setSigningOut(true);
    setError("");
    try {
      const { error: signOutError } = await neon.auth.signOut();
      // If the server rejects an expired/invalid session, still clear the
      // application's local authenticated state so the user is not trapped.
      if (signOutError) console.warn("Remote sign-out failed; clearing local session.", signOutError.message);
    } catch (signOutError) {
      console.warn("Remote sign-out failed; clearing local session.", signOutError);
    } finally {
      clearLocalSession();
      navigate("/auth", { replace: true });
      setSigningOut(false);
    }
  };
  const initials=(profile.full_name||session?.user.email||"BP").split(/[ @]/).filter((x: string) => Boolean(x)).slice(0,2).map((x: string) => x[0].toUpperCase()).join("");

  return <main className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
    <header><p className="text-xs font-bold uppercase tracking-wider text-emerald">Account</p><h1 className="text-2xl font-bold text-midnight">My profile</h1><p className="mt-1 text-sm text-slate-500">Manage your personal details and preferences.</p></header>
    <section className="flex items-center gap-4 rounded-2xl bg-midnight p-5 text-white"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gold text-xl font-bold text-midnight">{initials}</div><div className="min-w-0"><h2 className="truncate text-lg font-semibold">{profile.full_name||"Your account"}</h2><p className="truncate text-sm text-white/60">{session?.user.email}</p><span className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-200"><ShieldCheck size={13}/> Signed in securely</span></div></section>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success&&<p role="status" className="flex items-center gap-2 rounded-xl bg-emerald/10 p-3 text-sm text-emerald"><Check size={16}/>{success}</p>}
    <form onSubmit={save} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div><h2 className="font-semibold text-midnight">Personal information</h2><p className="text-xs text-slate-500">Your details are private to your account.</p></div>
      {loading?<p className="py-5 text-sm text-slate-500">Loading your profile…</p>:<>
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span><span className="relative block"><UserRound className="absolute left-3 top-3.5 text-slate-400" size={17}/><input className={field+" pl-10"} required minLength={2} value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})} placeholder="Your full name"/></span></label>
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email address</span><span className="relative block"><Mail className="absolute left-3 top-3.5 text-slate-400" size={17}/><input className={field+" pl-10 bg-slate-50 text-slate-500"} value={session?.user.email??""} readOnly/></span></label>
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</span><span className="relative block"><Phone className="absolute left-3 top-3.5 text-slate-400" size={17}/><input className={field+" pl-10"} type="tel" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="+254 7…"/></span></label>
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Preferred language</span><span className="relative block"><Globe2 className="absolute left-3 top-3.5 text-slate-400" size={17}/><select className={field+" pl-10"} value={profile.preferred_language} onChange={e=>setProfile({...profile,preferred_language:e.target.value as "en"|"sw"})}><option value="en">English</option><option value="sw">Kiswahili</option></select></span></label>
        <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald py-3 font-semibold text-white disabled:opacity-50"><Save size={17}/>{saving?"Saving…":"Save changes"}</button>
      </>}
    </form>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2"><Building2 size={18} className="text-emerald"/><h2 className="font-semibold text-midnight">Business details</h2></div>{business?<><p className="font-medium text-midnight">{business.name}</p><p className="mt-1 text-sm text-slate-500">{[business.business_type,business.county,business.phone].filter(Boolean).join(" · ")}</p></>:<p className="text-sm text-slate-500">Business details are not available.</p>}</section>
    <button onClick={()=>void logout()} disabled={signingOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><LogOut size={17}/>{signingOut?"Signing out…":"Sign out"}</button>
  </main>;
}
