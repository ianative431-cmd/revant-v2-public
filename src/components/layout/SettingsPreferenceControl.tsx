"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function SettingsPreferenceControl({preference}:{preference:"motion"|"glass"|"text"}) {
 const key="revant-display-preferences-v1";
 const defaults={motion:"ultra",glass:"subtle",text:"normal"};
 const [value,setValue]=useState<string>(defaults[preference]);
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem(key)||"{}");setValue(p[preference]||defaults[preference]);}catch{}},[preference]);
 const choices=preference==="motion"?[["ultra","Ultra-rapides","Conserver les transitions rapides."],["reduced","Réduites","Limiter les animations et mouvements."]]:preference==="glass"?[["subtle","Discret","Transparence légère."],["balanced","Équilibré","Flou et transparence modérés."],["strong","Prononcé","Effet de verre plus visible sur les panneaux compatibles."]]:[["normal","Standard","Taille actuelle."],["large","Plus grand","Agrandir légèrement le texte."]];
 function choose(next:string){setValue(next);try{const p=JSON.parse(localStorage.getItem(key)||"{}");p[preference]=next;localStorage.setItem(key,JSON.stringify(p));const root=document.documentElement;root.dataset.revantMotion=p.motion||"ultra";root.dataset.revantGlass=p.glass||"subtle";root.dataset.revantText=p.text||"normal";window.dispatchEvent(new Event("revant-display-preferences"));}catch{}}
 return <div className="space-y-2">{choices.map(([id,label,detail])=><button key={id} type="button" aria-pressed={value===id} onClick={()=>choose(id)} className="flex w-full items-center gap-3 rounded-xl border border-brand-border p-3 text-left aria-pressed:border-brand-accent aria-pressed:bg-brand-accent/5"><span className={`h-4 w-4 rounded-full border ${value===id?"border-brand-accent bg-brand-accent":"border-brand-muted"}`}/><span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-brand-muted">{detail}</span></span></button>)}<p className="pt-2 text-[11px] text-brand-muted">Enregistré sur cet appareil uniquement. La préférence de réduction des animations du système reste prioritaire.</p></div>;
}