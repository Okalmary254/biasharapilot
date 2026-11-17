import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, Globe2, LogOut, Mail, Phone, Save, ShieldCheck, UserRound, Crown, ArrowUpRight, Sparkles, KeyRound, GitBranch, Users, BarChart3, ShoppingCart, Megaphone, LockKeyhole, BadgeCheck } from "lucide-react";
import { neon, authClient } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

type ProfileRecord = { full_name: string; phone: string; preferred_language: "en" | "sw" };
type Business = { name: string; business_type: string | null; county: string | null; phone: string | null };
type PlanInfo = { id: string; name: string; monthly_price_kes: number; product_limit: number | null; ai_messages_limit: number; marketing_generations_limit: number; staff_limit: number; branch_limit: number | null; analytics_level: "essential" | "basic" | "advanced" };
type SubscriptionInfo = { plan_id: string; status: string; current_period_end: string | null };
const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-midnight outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/10";
const money = (value: number) => `KSh ${value.toLocaleString("en-KE")}`;

type EmailVerificationClient = { emailOtp: { sendVerificationOtp: (input: { email: string; type: "email-verification" }) => Promise<{ error: { message?: string } | null }>; verifyEmail: (input: { email: string; otp: string }) => Promise<{ error: { message?: string } | null }> } };
const emailVerificationClient = authClient as unknown as EmailVerificationClient;

type ManagedPasswordResetClient = {
  forgetPassword: { emailOtp: (input: { email: string }) => Promise<{ error: { message?: string } | null }> };
  emailOtp: { resetPassword: (input: { email: string; otp: string; password: string }) => Promise<{ error: { message?: string } | null }> };
};
const passwordResetClient = authClient as unknown as ManagedPasswordResetClient;

export default function Profile() {
  const { session, businessId, clearLocalSession, syncSession } = useAuth();
  const navigate = useNavigate();
  const [profile,setProfile]=useState<ProfileRecord>({full_name:"",phone:"",preferred_language:"en"});
  const [business,setBusiness]=useState<Business|null>(null);
  const [plan,setPlan]=useState<PlanInfo|null>(null);
  const [subscription,setSubscription]=useState<SubscriptionInfo|null>(null);
  const [planLoading,setPlanLoading]=useState(true);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [signingOut,setSigningOut]=useState(false);
  const [error,setError]=useState(""); const [success,setSuccess]=useState("");
  const [resetEmail,setResetEmail]=useState(session?.user.email??"");
  const [verifyCode,setVerifyCode]=useState(""); const [verifyBusy,setVerifyBusy]=useState(false); const [verifyNotice,setVerifyNotice]=useState(""); const [verifyError,setVerifyError]=useState(""); const [verifySent,setVerifySent]=useState(false);
  const [resetOtp,setResetOtp]=useState(""); const [newPassword,setNewPassword]=useState(""); const [confirmPassword,setConfirmPassword]=useState("");
  const [otpSent,setOtpSent]=useState(false); const [resetBusy,setResetBusy]=useState(false); const [resetNotice,setResetNotice]=useState(""); const [resetError,setResetError]=useState("");

  useEffect(()=>{
    if(!session?.user.id||!businessId)return;
    let active=true;
    (async()=>{
      setLoading(true);setPlanLoading(true);
      const [p,b,s]=await Promise.all([
        neon.from("profiles").select("full_name,phone,preferred_language").eq("id",session.user.id).maybeSingle(),
        neon.from("businesses").select("name,business_type,county,phone").eq("id",businessId).maybeSingle(),
        neon.from("business_subscriptions").select("plan_id,status,current_period_end").eq("business_id",businessId).maybeSingle()
      ]);
      if(!active)return;
      if(p.error)setError(p.error.message);else if(p.data)setProfile({full_name:p.data.full_name??"",phone:p.data.phone??"",preferred_language:p.data.preferred_language??"en"});
      if(b.error)setError(b.error.message);else setBusiness(b.data as Business|null);
      if(s.error)setError(s.error.message);
      else if(s.data){
        const sub=s.data as SubscriptionInfo;setSubscription(sub);
        const pr=await neon.from("subscription_plans").select("id,name,monthly_price_kes,product_limit,ai_messages_limit,marketing_generations_limit,staff_limit,branch_limit,analytics_level").eq("id",sub.plan_id).maybeSingle();
        if(!active)return;
        if(pr.error)setError(pr.error.message);else setPlan(pr.data as PlanInfo|null);
      } else {
        const {data:inserted,error:insertError}=await neon.from("business_subscriptions").insert({business_id:businessId,plan_id:"free",status:"active"}).select("plan_id,status,current_period_end").maybeSingle();
        if(!active)return;
        if(insertError){
          const retry=await neon.from("business_subscriptions").select("plan_id,status,current_period_end").eq("business_id",businessId).maybeSingle();
          if(retry.data){const sub=retry.data as SubscriptionInfo;setSubscription(sub);const pr=await neon.from("subscription_plans").select("id,name,monthly_price_kes,product_limit,ai_messages_limit,marketing_generations_limit,staff_limit,branch_limit,analytics_level").eq("id",sub.plan_id).maybeSingle();if(pr.data)setPlan(pr.data as PlanInfo);}
          else setError(insertError.message);
        } else if(inserted){
          setSubscription(inserted as SubscriptionInfo);
          const pr=await neon.from("subscription_plans").select("id,name,monthly_price_kes,product_limit,ai_messages_limit,marketing_generations_limit,staff_limit,branch_limit,analytics_level").eq("id","free").maybeSingle();
          if(pr.data)setPlan(pr.data as PlanInfo);
        }
      }
      setPlanLoading(false);setLoading(false);
    })().catch((e:unknown)=>{if(!active)return;setError(e instanceof Error?e.message:"Unable to load your account.");setPlanLoading(false);setLoading(false);});
    return ()=>{active=false;};
  },[session?.user.id,businessId]);

  const save=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();if(!session?.user.id)return;
    setSaving(true);setError("");setSuccess("");
    const {error:e2}=await neon.from("profiles").update({full_name:profile.full_name.trim(),phone:profile.phone.trim()||null,preferred_language:profile.preferred_language,updated_at:new Date().toISOString()}).eq("id",session.user.id);
    if(e2)setError(e2.message);else setSuccess("Your profile has been updated.");
    setSaving(false);
  };

  const sendVerification=async()=>{
    const email=session?.user.email; if(!email)return; setVerifyBusy(true);setVerifyError("");setVerifyNotice("");
    try{const {error:e}=await emailVerificationClient.emailOtp.sendVerificationOtp({email,type:"email-verification"});if(e)throw e;setVerifySent(true);setVerifyNotice("A verification code has been sent. Check your inbox and spam folder.");}
    catch(e){setVerifyError(e instanceof Error?e.message:"Unable to send a verification code.");}finally{setVerifyBusy(false);}
  };
  const confirmEmailVerification=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();const email=session?.user.email;if(!email)return;setVerifyBusy(true);setVerifyError("");setVerifyNotice("");
    try{const {error:e}=await emailVerificationClient.emailOtp.verifyEmail({email,otp:verifyCode.trim()});if(e)throw e;await syncSession();setVerifyNotice("Your email has been verified.");setVerifySent(false);setVerifyCode("");}
    catch(e){setVerifyError(e instanceof Error?e.message:"Email verification failed. Request a new code and try again.");}finally{setVerifyBusy(false);}
  };

  const requestReset=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();setResetBusy(true);setResetError("");setResetNotice("");
    try{
      const {error:e2}=await passwordResetClient.forgetPassword.emailOtp({email:resetEmail.trim()});
      if(e2)throw e2;
      setOtpSent(true);setResetNotice("A password reset code has been sent to your email. Check your inbox and spam folder.");
    }catch(e){setResetError(e instanceof Error?e.message:"Unable to send a password reset code. Please try again.");}
    finally{setResetBusy(false);}
  };
  const confirmReset=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();setResetBusy(true);setResetError("");setResetNotice("");
    if(newPassword.length<8){setResetError("Your new password must be at least 8 characters.");setResetBusy(false);return;}
    if(newPassword!==confirmPassword){setResetError("The passwords do not match.");setResetBusy(false);return;}
    try{
      const {error:e2}=await passwordResetClient.emailOtp.resetPassword({email:resetEmail.trim(),otp:resetOtp.trim(),password:newPassword});
      if(e2)throw e2;
      setOtpSent(false);setResetOtp("");setNewPassword("");setConfirmPassword("");
      setResetNotice("Your password has been changed successfully. Use your new password the next time you sign in.");
    }catch(e){setResetError(e instanceof Error?e.message:"Password reset failed. Request a new code and try again.");}
    finally{setResetBusy(false);}
  };
  const logout=async()=>{
    setSigningOut(true);setError("");
    try{const {error:signOutError}=await neon.auth.signOut();if(signOutError)console.warn("Remote sign-out failed; clearing local session.",signOutError.message);}
    catch(e){console.warn("Remote sign-out failed; clearing local session.",e);}
    finally{clearLocalSession();navigate("/auth",{replace:true});setSigningOut(false);}
  };
  const initials=(profile.full_name||session?.user.email||"BP").split(/[ @]/).filter(Boolean).slice(0,2).map((x:string)=>x[0].toUpperCase()).join("");
  const paid=Boolean(plan&&plan.id!=="free"&&subscription?.status==="active");

  return <main className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
    <header><p className="text-xs font-bold uppercase tracking-wider text-emerald">Account</p><h1 className="text-2xl font-bold text-midnight">My profile</h1><p className="mt-1 text-sm text-slate-500">Manage your personal details, business and account security.</p></header>
    <section className="flex items-center gap-4 rounded-2xl bg-midnight p-5 text-white"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gold text-xl font-bold text-midnight">{initials}</div><div className="min-w-0"><h2 className="truncate text-lg font-semibold">{profile.full_name||"Your account"}</h2><p className="truncate text-sm text-white/60">{session?.user.email}</p><span className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-200"><ShieldCheck size={13}/> Signed in securely</span></div></section>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success&&<p role="status" className="flex items-center gap-2 rounded-xl bg-emerald/10 p-3 text-sm text-emerald"><Check size={16}/>{success}</p>}

    <section className="overflow-hidden rounded-2xl border border-emerald/15 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><Crown size={19} className="text-emerald"/><h2 className="font-semibold text-midnight">Your subscription</h2></div><span className="rounded-full bg-emerald/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-emerald">{subscription?.status?.replace("_"," ")??"Plan status"}</span></div>
      <div className="p-5">{planLoading?<p className="py-3 text-sm text-slate-500">Checking your current plan…</p>:plan?<><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Currently subscribed to</p><h3 className="mt-1 text-2xl font-bold text-midnight">{plan.name}</h3><p className="mt-1 text-sm text-slate-500">{money(plan.monthly_price_kes)} <span className="text-xs">/ month</span></p></div><div className="rounded-xl bg-emerald/5 p-3 text-emerald"><Sparkles size={24}/></div></div>{subscription?.current_period_end&&<p className="mt-3 text-xs text-slate-500">Current period ends {new Date(subscription.current_period_end).toLocaleDateString("en-KE")}</p>}<button type="button" onClick={()=>navigate("/subscription")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald/90"><ArrowUpRight size={17}/> Upgrade plan</button></>:<div className="space-y-3"><p className="text-sm text-slate-500">We couldn't load your subscription details.</p><button type="button" onClick={()=>navigate("/subscription")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white"><ArrowUpRight size={17}/> View plans & upgrade</button></div>}</div>
    </section>

    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2"><Building2 size={18} className="text-emerald"/><h2 className="font-semibold text-midnight">Business details</h2></div>
      {business?<div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-cloud p-3"><p className="text-[11px] font-semibold uppercase text-slate-400">Business name</p><p className="mt-1 font-semibold text-midnight">{business.name}</p></div><div className="rounded-xl bg-cloud p-3"><p className="text-[11px] font-semibold uppercase text-slate-400">Business type</p><p className="mt-1 font-semibold text-midnight">{business.business_type||"Not specified"}</p></div><div className="rounded-xl bg-cloud p-3"><p className="text-[11px] font-semibold uppercase text-slate-400">County</p><p className="mt-1 font-semibold text-midnight">{business.county||"Not specified"}</p></div><div className="rounded-xl bg-cloud p-3"><p className="text-[11px] font-semibold uppercase text-slate-400">Business phone</p><p className="mt-1 font-semibold text-midnight">{business.phone||"Not specified"}</p></div></div>:<p className="text-sm text-slate-500">Business details are not available.</p>}
    </section>

    {!Boolean((session?.user as {emailVerified?:boolean}|undefined)?.emailVerified)&&<section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><div className="flex items-center gap-2"><BadgeCheck size={19} className="text-amber-700"/><h2 className="font-semibold text-midnight">Verify your email</h2></div><p className="text-sm text-slate-600">Your email address has not been verified. Verify it to secure your account and receive important account updates.</p>{!verifySent?<button type="button" onClick={()=>void sendVerification()} disabled={verifyBusy} className="rounded-xl bg-midnight px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{verifyBusy?"Sending code…":"Send verification code"}</button>:<form onSubmit={confirmEmailVerification} className="space-y-3"><input className={field} inputMode="numeric" autoComplete="one-time-code" required value={verifyCode} onChange={e=>setVerifyCode(e.target.value)} placeholder="Enter email verification code"/><button disabled={verifyBusy||!verifyCode.trim()} className="w-full rounded-xl bg-emerald py-3 text-sm font-semibold text-white disabled:opacity-50">{verifyBusy?"Verifying…":"Verify email"}</button><button type="button" onClick={()=>void sendVerification()} className="w-full py-1 text-xs font-semibold text-emerald">Resend code</button></form>}{verifyError&&<p role="alert" className="text-xs text-red-700">{verifyError}</p>}{verifyNotice&&<p role="status" className="text-xs text-emerald">{verifyNotice}</p>}</section>}

    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Sparkles size={18} className="text-emerald"/><h2 className="font-semibold text-midnight">Business growth features</h2></div><p className="mt-1 text-xs text-slate-500">Tools and capacity included with your plan.</p></div>{paid&&<span className="rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald">{plan?.name}</span>}</div>
      {planLoading?<p className="text-sm text-slate-500">Loading plan features…</p>:paid&&plan?<div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-cloud p-3"><div className="flex items-center gap-2 text-emerald"><Users size={17}/><span className="text-xs font-semibold text-slate-500">Team members</span></div><p className="mt-2 text-lg font-bold text-midnight">{plan.staff_limit} {plan.staff_limit===1?"account":"accounts"}</p></div>
          <div className="rounded-xl bg-cloud p-3"><div className="flex items-center gap-2 text-emerald"><Megaphone size={17}/><span className="text-xs font-semibold text-slate-500">Marketing studio</span></div><p className="mt-2 text-lg font-bold text-midnight">{plan.marketing_generations_limit} generations / month</p></div>
          <div className="rounded-xl bg-cloud p-3"><div className="flex items-center gap-2 text-emerald"><BarChart3 size={17}/><span className="text-xs font-semibold text-slate-500">Analytics</span></div><p className="mt-2 text-lg font-bold capitalize text-midnight">{plan.analytics_level}</p></div>
          <div className="rounded-xl bg-cloud p-3"><div className="flex items-center gap-2 text-emerald"><GitBranch size={17}/><span className="text-xs font-semibold text-slate-500">Branches</span></div><p className="mt-2 text-lg font-bold text-midnight">{plan.branch_limit===null?"Unlimited locations":plan.branch_limit===1?"1 location":"Up to "+plan.branch_limit+" locations"}</p></div>
        </div>
        <div className="rounded-xl border border-emerald/15 p-4"><div className="flex items-center gap-2"><GitBranch size={18} className="text-emerald"/><p className="text-sm font-semibold text-midnight">Multi-branch management</p><span className="ml-auto rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">Coming soon</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{plan.branch_limit===null?"Your Business plan is eligible for multi-location stock, sales and performance reporting as branch management rolls out.":"Upgrade to Business to unlock unlimited branches when multi-location management launches."}</p>{plan.branch_limit!==null&&<button type="button" onClick={()=>navigate("/subscription")} className="mt-3 text-xs font-semibold text-emerald hover:underline">Explore Business plan <ArrowUpRight size={13} className="inline"/></button>}</div>
        <div className="rounded-xl border border-slate-100 p-4"><div className="flex items-center gap-2"><ShoppingCart size={18} className="text-emerald"/><p className="text-sm font-semibold text-midnight">POS & payment integrations</p><span className="ml-auto rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">Roadmap</span></div><p className="mt-2 text-xs leading-5 text-slate-500">Planned integrations include barcode scanners, receipt printers, cash drawers, M-Pesa payment confirmation and in-store POS terminals, with sales and stock synchronised to your BiasharaPilot workspace.</p></div>
      </div>:<div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2"><LockKeyhole size={18} className="text-slate-500"/><p className="text-sm font-semibold text-midnight">Premium business tools</p></div><p className="mt-2 text-xs leading-5 text-slate-500">Upgrade from Free to unlock expanded team capacity, marketing tools, advanced analytics and eligible multi-location features. These sections become visible when a paid plan is active.</p><button type="button" onClick={()=>navigate("/subscription")} className="mt-3 rounded-xl bg-emerald px-4 py-2.5 text-xs font-semibold text-white">View premium plans</button></div>}
    </section>

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

    <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2"><KeyRound size={19} className="text-emerald"/><h2 className="font-semibold text-midnight">Password & security</h2></div>
      <p className="text-xs leading-5 text-slate-500">Request a one-time reset code by email, then choose a new password. Your password is never displayed or stored in your profile.</p>
      {!otpSent?<form onSubmit={requestReset} className="space-y-3"><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Account email</span><input className={field} type="email" required value={resetEmail} onChange={e=>setResetEmail(e.target.value)} /></label><button disabled={resetBusy||!resetEmail.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald/20 bg-emerald/5 py-3 text-sm font-semibold text-emerald disabled:opacity-50"><Mail size={16}/>{resetBusy?"Sending code…":"Send password reset code"}</button></form>:<form onSubmit={confirmReset} className="space-y-3"><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email verification code</span><input className={field} inputMode="numeric" autoComplete="one-time-code" required value={resetOtp} onChange={e=>setResetOtp(e.target.value)} placeholder="Enter the code from your email"/></label><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">New password</span><input className={field} type="password" minLength={8} autoComplete="new-password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="At least 8 characters"/></label><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</span><input className={field} type="password" minLength={8} autoComplete="new-password" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Enter it again"/></label><button disabled={resetBusy} className="w-full rounded-xl bg-emerald py-3 text-sm font-semibold text-white disabled:opacity-50">{resetBusy?"Updating password…":"Confirm new password"}</button><button type="button" onClick={()=>{setOtpSent(false);setResetOtp("");setResetError("");setResetNotice("");}} className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-midnight">Use a different email / request another code</button></form>}
      {resetError&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{resetError}</p>}{resetNotice&&<p role="status" className="rounded-xl bg-emerald/10 p-3 text-xs text-emerald">{resetNotice}</p>}
    </section>

    <button onClick={()=>void logout()} disabled={signingOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><LogOut size={17}/>{signingOut?"Signing out…":"Sign out"}</button>
  </main>;
}
