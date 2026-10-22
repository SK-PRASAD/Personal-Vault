import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { supabase, isConfigured } from '../lib/supabase';
import { PublicLayout } from '../components/Layout';
import { GlassCard, GlassButton, Badge, EmptyState, SkeletonCard } from '../components/ui';
import { Link2, Video, FileText, FolderOpen, Globe, ExternalLink, Lock, EyeOff, Download, Share2 } from 'lucide-react';
import type { VaultItem, ItemType } from '../lib/types';

const icons: Record<ItemType, React.ReactNode> = { link: <Link2 size={16}/>, video: <Video size={16}/>, note: <FileText size={16}/>, file: <FolderOpen size={16}/> };
const titles: Record<ItemType, string> = { link:'Links', video:'Videos', note:'Notes', file:'Files' };

async function loadItems(type?: ItemType) {
  let q = supabase.from('vault_items').select('*').eq('visibility','public').order('created_at',{ascending:false});
  if (type) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as VaultItem[];
}

function ItemCard({ item }: { item: VaultItem }) {
  return <Link to={`/item/${item.id}`}><GlassCard hover className="p-5 h-full">
    <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-accent">{icons[item.type]}<span className="text-xs uppercase tracking-wide">{item.type}</span></div>{item.is_favorite && <span>★</span>}</div>
    <h3 className="font-semibold text-primary line-clamp-2">{item.title}</h3>
    {item.description && <p className="text-sm text-secondary line-clamp-2 mt-2">{item.description}</p>}
    <div className="flex flex-wrap gap-1.5 mt-4">{(item.tags||[]).slice(0,3).map(t=><span key={t} className="text-xs px-2 py-1 rounded-full bg-white/5 text-muted">#{t}</span>)}</div>
    <p className="text-xs text-muted mt-4">{new Date(item.created_at).toLocaleDateString()}</p>
  </GlassCard></Link>;
}

function Grid({ items }: { items: VaultItem[] }) {
  if (!items.length) return <EmptyState icon={<Globe size={24}/>} title="No content yet" description="Published content will appear here."/>;
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(i=><ItemCard key={i.id} item={i}/>)}</div>;
}

export function HomePage() {
  const [items,setItems]=useState<VaultItem[]>([]); const [loading,setLoading]=useState(true); const [filter,setFilter]=useState<'all'|ItemType>('all'); const [q,setQ]=useState('');
  useEffect(()=>{ if(!isConfigured){setLoading(false);return;} loadItems().then(setItems).catch(()=>setItems([])).finally(()=>setLoading(false)); },[]);
  const filtered=useMemo(()=>items.filter(i=>(filter==='all'||i.type===filter)&&(!q||`${i.title} ${i.description||''} ${(i.tags||[]).join(' ')}`.toLowerCase().includes(q.toLowerCase()))),[items,filter,q]);
  return <PublicLayout><div className="max-w-7xl mx-auto px-4 py-10">
    <div className="text-center max-w-3xl mx-auto mb-10"><img src="/Logo.png" alt="Personal Vault" className="w-20 h-20 object-contain mx-auto mb-5"/><h1 className="text-4xl md:text-5xl font-bold text-primary">Personal Vault</h1><p className="text-secondary mt-3">A secure, curated space for links, videos, notes and files.</p></div>
    <div className="max-w-xl mx-auto mb-6"><input className="input-field" placeholder="Search public content..." value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="flex gap-2 overflow-x-auto pb-2 mb-7">{(['all','link','video','note','file'] as const).map(f=><button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-xl text-sm ${filter===f?'bg-accent/10 text-accent':'glass text-secondary'}`}>{f==='all'?'All':titles[f] }</button>)}</div>
    {loading?<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i=><SkeletonCard key={i}/>)}</div>:<Grid items={filtered}/>}</div></PublicLayout>;
}

export function CategoryPage({ type }: { type: string }) {
  const t=type as ItemType; const [items,setItems]=useState<VaultItem[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{if(!isConfigured){setLoading(false);return;} loadItems(t).then(setItems).catch(()=>setItems([])).finally(()=>setLoading(false));},[t]);
  return <PublicLayout><div className="max-w-7xl mx-auto px-4 py-10"><div className="mb-8"><h1 className="text-3xl font-bold text-primary">{titles[t]||'Content'}</h1><p className="text-secondary mt-2">Public {titles[t]?.toLowerCase()||'content'}.</p></div>{loading?<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i=><SkeletonCard key={i}/>)}</div>:<Grid items={items}/>}</div></PublicLayout>;
}

export function ItemDetailPage() {
  const {id}=useParams(); const [item,setItem]=useState<VaultItem|null>(null); const [loading,setLoading]=useState(true); const [fileUrl,setFileUrl]=useState<string|null>(null);
  useEffect(()=>{(async()=>{if(!id||!isConfigured){setLoading(false);return;} const {data}=await supabase.from('vault_items').select('*').eq('id',id).maybeSingle(); if(data){setItem(data as VaultItem); if(data.file_path){const {data:s}=await supabase.storage.from('vault-files').createSignedUrl(data.file_path,3600); if(s?.signedUrl)setFileUrl(s.signedUrl);}} setLoading(false);})();},[id]);
  if(loading)return <PublicLayout><div className="max-w-3xl mx-auto px-4 py-10"><SkeletonCard/></div></PublicLayout>;
  if(!item)return <PublicLayout><div className="max-w-3xl mx-auto px-4 py-10"><EmptyState icon={<Lock/>} title="Item unavailable" description="This item may be private, unlisted, or no longer available."/></div></PublicLayout>;
  return <PublicLayout><div className="max-w-3xl mx-auto px-4 py-10"><GlassCard className="p-6 md:p-8"><div className="flex items-center gap-2 text-accent mb-4">{icons[item.type]}<span className="text-sm uppercase">{item.type}</span><Badge variant={item.visibility}>{item.visibility}</Badge></div><h1 className="text-3xl font-bold text-primary">{item.title}</h1>{item.description&&<p className="text-secondary mt-3">{item.description}</p>}<div className="flex flex-wrap gap-2 mt-5">{(item.tags||[]).map(t=><span key={t} className="text-xs px-2 py-1 rounded-full bg-white/5 text-muted">#{t}</span>)}</div>{item.type==='note'&&<article className="mt-8 whitespace-pre-wrap text-secondary leading-7">{item.content}</article>}{item.type!=='note'&&<div className="mt-8 flex flex-wrap gap-3">{item.url&&<GlassButton onClick={()=>window.open(item.url!,'_blank','noopener,noreferrer')}><ExternalLink size={16}/> Open</GlassButton>}{fileUrl&&<GlassButton variant="outline" onClick={()=>window.open(fileUrl,'_blank','noopener,noreferrer')}><Download size={16}/> Download</GlassButton>}<GlassButton variant="ghost" onClick={()=>navigator.clipboard?.writeText(window.location.href)}><Share2 size={16}/> Copy link</GlassButton></div>}</GlassCard></div></PublicLayout>;
}

export function SharePage() {
  const {token}=useParams(); const [item,setItem]=useState<VaultItem|null>(null); const [error,setError]=useState('');
  useEffect(()=>{(async()=>{if(!token||!isConfigured)return; const {data,error}=await supabase.from('share_links').select('*, vault_items(*)').eq('token',token).is('revoked_at',null).maybeSingle(); if(error||!data){setError('This share link is invalid or revoked.');return;} if(data.expires_at&&new Date(data.expires_at)<new Date()){setError('This share link has expired.');return;} setItem(data.vault_items as VaultItem);})();},[token]);
  if(error)return <PublicLayout><div className="max-w-xl mx-auto px-4 py-12"><EmptyState icon={<EyeOff/>} title="Share link unavailable" description={error}/></div></PublicLayout>;
  if(!item)return <PublicLayout><div className="max-w-xl mx-auto px-4 py-12"><SkeletonCard/></div></PublicLayout>;
  return <PublicLayout><div className="max-w-3xl mx-auto px-4 py-12"><GlassCard className="p-8"><p className="text-xs text-accent uppercase tracking-wider mb-3">Secure share</p><h1 className="text-3xl font-bold text-primary">{item.title}</h1>{item.description&&<p className="text-secondary mt-3">{item.description}</p>}{item.content&&<div className="mt-7 whitespace-pre-wrap text-secondary">{item.content}</div>}{item.url&&<GlassButton className="mt-7" onClick={()=>window.open(item.url!,'_blank','noopener,noreferrer')}><ExternalLink size={16}/> Open resource</GlassButton>}</GlassCard></div></PublicLayout>;
}
