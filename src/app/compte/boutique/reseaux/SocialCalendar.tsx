"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSocialPost, createSocialPost } from "./actions";

type SocialPost = {
  id: string;
  caption: string;
  media_url: string | null;
  product_url: string | null;
  platforms: string[];
  scheduled_at: string;
  timezone: string;
  status: "scheduled" | "cancelled";
};

const destinations = [
  ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"],
  ["snapchat", "Snapchat"], ["whatsapp", "WhatsApp Status"], ["manual", "Autre / partage manuel"],
] as const;

function localDateTimeMinimum() {
  const value = new Date(Date.now() + 60_000);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

export default function SocialCalendar({ posts, shopUrl }: { posts: SocialPost[]; shopUrl: string }) {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [productUrl, setProductUrl] = useState(shopUrl);
  const [localDate, setLocalDate] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["whatsapp", "instagram", "facebook"]);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Niamey";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const date = new Date(localDate);
    if (!localDate || !Number.isFinite(date.getTime())) { setNotice("Choisis une date et une heure."); return; }
    startTransition(async () => {
      const result = await createSocialPost({ caption, mediaUrl, productUrl, platforms, scheduledAt: date.toISOString(), timezone });
      if (result.error) { setNotice(result.error); return; }
      setCaption(""); setMediaUrl(""); setLocalDate("");
      setNotice("Date ajoutée à ton calendrier Revant.");
      router.refresh();
    });
  }

  function share(post: SocialPost) {
    const text = post.caption;
    const url = post.product_url || shopUrl;
    if (navigator.share) {
      void navigator.share({ title: "Publication Revant", text, url }).catch(() => undefined);
    } else if (navigator.clipboard) {
      void navigator.clipboard.writeText([text, url].filter(Boolean).join("\n\n"))
        .then(() => setNotice("Texte et lien copiés. Ouvre ton réseau social et colle-les dans ta publication."))
        .catch(() => setNotice("Copie impossible sur cet appareil."));
    } else setNotice("Le partage direct n’est pas disponible dans ce navigateur.");
  }

  function cancel(id: string) {
    startTransition(async () => {
      const result = await cancelSocialPost(id);
      setNotice(result.error || "Élément retiré du calendrier.");
      if (!result.error) router.refresh();
    });
  }

  return <div className="space-y-6">
    <section className="rounded-2xl border border-brand-text/10 bg-white p-5 shadow-sm">
      <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">Réseaux sociaux</p><h2 className="mt-1 text-xl font-bold">Préparer une publication</h2><p className="mt-1 text-sm text-brand-text/65">Prépare ton contenu et choisis la date à laquelle tu souhaites le partager.</p></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">Texte de la publication<textarea required maxLength={2200} rows={5} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Présente ton produit, son prix et comment commander…" className="mt-1 w-full rounded-xl border border-brand-text/20 p-3 text-sm outline-none focus:border-brand-accent" /><span className="text-xs text-brand-text/50">{caption.length}/2200 caractères</span></label>
        <label className="block text-sm font-medium">Lien HTTPS de l’image ou vidéo (facultatif)<input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" className="mt-1 w-full rounded-xl border border-brand-text/20 p-3 text-sm" /></label>
        <label className="block text-sm font-medium">Lien du produit ou de la boutique<input type="url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder={shopUrl} className="mt-1 w-full rounded-xl border border-brand-text/20 p-3 text-sm" /></label>
        <fieldset><legend className="mb-2 text-sm font-medium">Destinations souhaitées</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{destinations.map(([value, label]) => <label key={value} className="flex items-center gap-2 rounded-xl border border-brand-text/10 p-3 text-sm"><input type="checkbox" checked={platforms.includes(value)} onChange={(e) => setPlatforms((current) => e.target.checked ? [...current, value] : current.filter((item) => item !== value))} />{label}</label>)}</div></fieldset>
        <label className="block text-sm font-medium">Date et heure prévues<input required type="datetime-local" value={localDate} onChange={(e) => setLocalDate(e.target.value)} min={localDateTimeMinimum()} className="mt-1 w-full rounded-xl border border-brand-text/20 p-3 text-sm" /><span className="mt-1 block text-xs text-brand-text/50">Fuseau de ton appareil : {timezone}</span></label>
        {notice && <p role="status" className="rounded-lg bg-brand-bg p-3 text-sm">{notice}</p>}
        <button disabled={pending} className="w-full rounded-full bg-brand-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Enregistrement…" : "Ajouter au calendrier"}</button>
      </form>
    </section>
    <section className="rounded-2xl border border-brand-text/10 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Mon calendrier</h2><p className="mb-4 mt-1 text-sm text-brand-text/60">Les dates et contenus sont conservés dans Revant. Aucune notification automatique n’est envoyée pour l’instant.</p>
      {posts.length === 0 ? <div className="rounded-xl border border-dashed border-brand-text/20 p-8 text-center text-sm text-brand-text/60">Aucune publication planifiée pour l’instant.</div> : <div className="space-y-3">{posts.map((post) => <article key={post.id} className="rounded-xl border border-brand-text/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase tracking-wide text-brand-accent">{post.status === "scheduled" ? "À partager manuellement" : "Annulée"}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{post.caption}</p><p className="mt-2 text-xs text-brand-text/55">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: post.timezone }).format(new Date(post.scheduled_at))} · {post.timezone}</p><p className="mt-1 text-xs text-brand-text/55">{post.platforms.map((p) => destinations.find(([v]) => v === p)?.[1] || p).join(" · ")}</p>{post.media_url && <a href={post.media_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-brand-accent underline">Voir le média préparé</a>}</div></div><div className="mt-3 flex flex-wrap gap-2">{post.status === "scheduled" && <><button type="button" onClick={() => share(post)} className="rounded-full border border-brand-accent px-4 py-2 text-xs font-semibold">Partager depuis mon téléphone</button><button type="button" disabled={pending} onClick={() => cancel(post.id)} className="rounded-full border border-red-200 px-4 py-2 text-xs text-red-700 disabled:opacity-60">Annuler</button></>}</div></article>)}</div>}
    </section>
    <p className="text-xs leading-relaxed text-brand-text/55">Ce calendrier prépare des textes et conserve les dates choisies. Il ne programme pas de notification et ne publie pas automatiquement sur Instagram, Facebook, TikTok, Snapchat ou WhatsApp : les accès officiels et un service de programmation ne sont pas configurés.</p>
  </div>;
}
