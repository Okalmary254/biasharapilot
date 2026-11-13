import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Bot, Send, Sparkles, TrendingUp, Package, Wallet, Users, RefreshCw } from "lucide-react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

type Message = { role: "user" | "assistant"; content: string };
type Context = { salesTotal: number; salesCount: number; expensesTotal: number; customerCount: number; lowStock: { name: string; quantity: number; threshold: number }[] };
const endpoint = (import.meta.env.VITE_AI_API_URL as string | undefined)?.trim() || "/api/ai";
const suggestions = [
  { icon: TrendingUp, label: "Review my performance", prompt: "Review my recent business performance. What is going well and what should I improve?" },
  { icon: Package, label: "Check my stock", prompt: "Analyse my stock levels and tell me what needs attention first." },
  { icon: Wallet, label: "Reduce expenses", prompt: "Analyse my recent expenses and suggest practical ways to control costs." },
  { icon: Users, label: "Grow my sales", prompt: "Suggest practical ways to increase sales and bring customers back." },
];

export default function AIAssistant() {
  const { businessId, session } = useAuth();
  const [messages,setMessages]=useState<Message[]>([{role:"assistant",content:"Hello! I'm your BiasharaPilot business assistant. I can help you understand your numbers, manage stock and find practical ways to grow. What would you like to work on?"}]);
  const [context,setContext]=useState<Context|null>(null);
  const [loading,setLoading]=useState(true); const [sending,setSending]=useState(false);
  const [input,setInput]=useState(""); const [error,setError]=useState("");
  const bottom=useRef<HTMLDivElement>(null);

  const loadContext=useCallback(async()=>{
    if(!businessId)return;
    setLoading(true);setError("");
    const since=new Date();since.setDate(since.getDate()-30);
    const [s,e,c,p]=await Promise.all([
      neon.from("sales").select("total,status").eq("business_id",businessId).gte("sold_at",since.toISOString()).neq("status","cancelled"),
      neon.from("expenses").select("amount").eq("business_id",businessId).gte("expense_date",since.toISOString().slice(0,10)),
      neon.from("customers").select("id",{count:"exact",head:true}).eq("business_id",businessId),
      neon.from("products").select("name,stock_quantity,low_stock_threshold").eq("business_id",businessId).eq("is_active",true)
    ]);
    const err=s.error||e.error||c.error||p.error;
    if(err)setError(err.message);
    else {
      const products=p.data??[];
      setContext({
        salesTotal:(s.data??[]).filter(x=>x.status==="completed").reduce((n,x)=>n+Number(x.total),0),
        salesCount:(s.data??[]).length,
        expensesTotal:(e.data??[]).reduce((n,x)=>n+Number(x.amount),0),
        customerCount:c.count??0,
        lowStock:products.filter(x=>Number(x.stock_quantity)<=Number(x.low_stock_threshold)).map(x=>({name:x.name,quantity:Number(x.stock_quantity),threshold:Number(x.low_stock_threshold)})).slice(0,15)
      });
    }
    setLoading(false);
  },[businessId]);

  useEffect(()=>{void loadContext();},[loadContext]);
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth",block:"end"});},[messages,sending]);

  const send=async(event?:FormEvent,preset?:string)=>{
    event?.preventDefault();
    const prompt=(preset??input).trim();
    if(!prompt||sending)return;
    const next:Message[]=[...messages,{role:"user",content:prompt}];
    setMessages(next);setInput("");setSending(true);setError("");
    try{
      const token=session?.access_token;
      if(!token)throw new Error("Your sign-in session has expired. Please sign in again.");
      if(!businessId)throw new Error("No business is linked to your account yet.");
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},body:JSON.stringify({messages:next.slice(-12),businessId})});
      const responseText = await response.text();
      let result: { reply?: string; error?: string } = {};
      try { result = JSON.parse(responseText) as { reply?: string; error?: string }; }
      catch {
        if (response.status === 404) {
          throw new Error(`The AI endpoint was not found at ${endpoint}. In Vercel, confirm that api/ai.ts is deployed and clear VITE_AI_API_URL (or set it to the deployed /api/ai URL), then redeploy.`);
        }
        throw new Error(`The AI server returned an unexpected response (HTTP ${response.status}). Check the Vercel function logs for this deployment.`);
      }
      if(!response.ok)throw new Error(result.error||`The AI service could not respond (HTTP ${response.status}).`);
      if(!result.reply)throw new Error("The AI service returned an empty response.");
      setMessages([...next,{role:"assistant",content:result.reply}]);
    }catch(err){
      setError(err instanceof Error?err.message:"Unable to reach the AI service.");setMessages(next);
    }finally{setSending(false);}
  };
  const keyDown=(e:KeyboardEvent<HTMLTextAreaElement>)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}};

  return <main className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-3xl flex-col gap-4 p-4 sm:p-6">
    <header className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald">Your business copilot</p><h1 className="text-2xl font-bold text-midnight">AI Assistant</h1><p className="mt-1 text-sm text-slate-500">Practical guidance grounded in your business records.</p></div><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-midnight text-gold"><Sparkles size={23}/></div></header>
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[11px] text-slate-500">Sales · 30 days</p><p className="mt-1 truncate font-bold text-midnight">{loading?"…":`KSh ${(context?.salesTotal??0).toLocaleString("en-KE")}`}</p></div>
      <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[11px] text-slate-500">Expenses · 30 days</p><p className="mt-1 truncate font-bold text-midnight">{loading?"…":`KSh ${(context?.expensesTotal??0).toLocaleString("en-KE")}`}</p></div>
      <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[11px] text-slate-500">Customers</p><p className="mt-1 font-bold text-midnight">{loading?"…":context?.customerCount??0}</p></div>
      <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[11px] text-slate-500">Low stock alerts</p><p className="mt-1 font-bold text-midnight">{loading?"…":context?.lowStock.length??0}</p></div>
    </section>
    {!!context?.lowStock.length&&<section className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800"><Package size={16}/> Stock needing attention</p><div className="flex flex-wrap gap-2">{context.lowStock.slice(0,4).map(p=><span key={p.name} className="rounded-full bg-white px-2.5 py-1 text-xs text-amber-800">{p.name}: {p.quantity} left</span>)}</div></section>}
    <section className="flex min-h-64 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3"><div className="grid size-8 place-items-center rounded-lg bg-emerald/10 text-emerald"><Bot size={18}/></div><div><p className="text-sm font-semibold text-midnight">BiasharaPilot AI</p><p className="text-[11px] text-slate-500">{loading?"Preparing business context…":"Business context · last 30 days"}</p></div><button type="button" onClick={()=>void loadContext()} aria-label="Refresh business data" className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100"><RefreshCw size={16}/></button></div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((m,i)=><div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}><div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${m.role==="user"?"rounded-br-md bg-midnight text-white":"rounded-bl-md bg-cloud text-slate-700"}`}>{m.content}</div></div>)}{sending&&<div className="w-fit rounded-2xl bg-cloud px-4 py-3 text-sm text-slate-500">Thinking…</div>}<div ref={bottom}/></div>
      {messages.length===1&&<div className="grid grid-cols-1 gap-2 border-t border-slate-100 p-3 sm:grid-cols-2">{suggestions.map(({icon:Icon,label,prompt})=><button key={label} type="button" onClick={()=>void send(undefined,prompt)} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-left text-xs font-medium text-slate-600 hover:border-emerald hover:bg-emerald/5"><Icon size={16} className="shrink-0 text-emerald"/>{label}</button>)}</div>}
      {error&&<p role="alert" className="px-4 pb-2 text-xs text-red-600">{error}</p>}
      <form onSubmit={e=>void send(e)} className="flex items-end gap-2 border-t border-slate-100 p-3"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={keyDown} rows={1} placeholder="Ask about your business…" className="max-h-28 min-h-11 flex-1 resize-y rounded-xl bg-cloud px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald/20"/><button disabled={!input.trim()||sending} aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald text-white disabled:opacity-40"><Send size={17}/></button></form>
    </section>
    <p className="text-center text-[11px] text-slate-400">AI suggestions are decision support, not a substitute for your own business judgement.</p>
  </main>;
}
