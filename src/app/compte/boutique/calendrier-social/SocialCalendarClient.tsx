"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Platform = "instagram" | "facebook" | "tiktok" | "snapchat" | "whatsapp" | "manual";
type SocialPost = {
  id: string;
  caption: string;
  media_url: string | null;
  product_url: string | null;
  platforms: string[];
  scheduled_at: string;
  status: string;
};

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "snapchat", label: "Snapchat" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "manual", label: "Partage manuel" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Niamey",
  }).format(new Date(value));
}

export default function SocialCalendarClient({
  shopId,
  ownerId,
  initialPosts,
}: {
  shopId: string;
  ownerId: string;
  initialPosts: SocialPost[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["manual"]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function togglePlatform(value: Platform, checked: boolean) {
    setPlatforms((current) =>
      checked
        ? [...current, value]
        : current.filter((item) => item !== value)
    );
  }

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const date = new Date(scheduledAt);
    const cleanCaption = caption.trim();
    const cleanUrl = productUrl.trim();

    if (!cleanCaption || cleanCaption.length > 2200 || !scheduledAt ||
        Number.isNaN(date.getTime()) || date.getTime() <= Date.now() ||
        platforms.length === 0 ||
        (cleanUrl && !/^https:\/\//i.test(cleanUrl))) {
      setMessage("Vérifie le texte, la date future, la plateforme et le lien HTTPS.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          shop_id: shopId,
          owner_id: ownerId,
          caption: cleanCaption,
          product_url: cleanUrl || null,
          platforms,
          scheduled_at: date.toISOString(),
          timezone: "Africa/Niamey",
          status: "scheduled",
        })
        .select("id,caption,media_url,product_url,platforms,scheduled_at,status")
        .single();

      if (error || !data) {
        setMessage("Impossible d'enregistrer la publication. Réessaie.");
        return;
      }

      setPosts((current) =>
        [...current, data as SocialPost].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )
      );
      setCaption("");
      setScheduledAt("");
      setProductUrl("");
      setPlatforms(["manual"]);
      setMessage("Ajoutée au calendrier. La publication automatique n'est pas encore connectée : partage-la manuellement à la date prévue.");
    } catch {
      setMessage("Une erreur est survenue pendant l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelPost(postId: string) {
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("social_posts")
      .update({ status: "cancelled" })
      .eq("id", postId)
      .eq("shop_id", shopId)
      .eq("owner_id", ownerId)
      .eq("status", "scheduled");

    if (error) {
      setMessage("Impossible d'annuler cette programmation.");
      return;
    }
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, status: "cancelled" } : post
      )
    );
    setMessage("Programmation annulée.");
  }

  async function sharePost(post: SocialPost) {
    const shareData: ShareData = {
      text: post.caption,
      ...(post.product_url ? { url: post.product_url } : {}),
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          post.caption + (post.product_url ? "\n" + post.product_url : "")
        );
        setMessage("Texte copié. Colle-le dans le réseau social choisi.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Le partage direct n'est pas disponible sur cet appareil. Copie le texte manuellement.");
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-1">Préparer une publication</h2>
        <p className="text-xs text-neutral-500 mb-4">
          Choisis une date et les réseaux visés. Revant conserve le calendrier et permet le partage manuel.
        </p>
        <form onSubmit={createPost} className="grid gap-3">
          <label className="grid gap-1 text-sm font-medium">
            Texte de la publication
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={2200}
              rows={5}
              required
              placeholder="Présente ton produit, ton offre ou les nouveautés de ta boutique..."
              className="w-full rounded-xl border px-3 py-3 text-sm font-normal"
            />
            <span className="text-right text-xs font-normal text-neutral-400">{caption.length}/2200</span>
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Date et heure (heure de Niamey)
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
              className="rounded-xl border px-3 py-3 text-sm font-normal"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Lien du produit (facultatif)
            <input
              type="url"
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder="https://..."
              className="rounded-xl border px-3 py-3 text-sm font-normal"
            />
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium mb-1">Réseaux concernés</legend>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => (
                <label key={platform.value} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform.value)}
                    onChange={(event) => togglePlatform(platform.value, event.target.checked)}
                  />
                  {platform.label}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-brand-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Enregistrement..." : "Ajouter au calendrier"}
          </button>
        </form>
        {message && <p role="status" className="mt-3 text-sm text-neutral-600">{message}</p>}
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-base font-semibold">Mon calendrier</h2>
          <p className="text-xs text-neutral-500">Les dates sont affichées à l'heure de Niamey.</p>
        </div>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-neutral-500">
            Aucune publication programmée pour le moment.
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-xs font-semibold text-neutral-500">{formatDate(post.scheduled_at)}</p>
                <span className={post.status === "scheduled" ? "rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-800" : "rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-500"}>
                  {post.status === "scheduled" ? "À partager manuellement" : "Annulée"}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{post.caption}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {post.platforms.map((platform) => (
                  <span key={platform} className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
                    {PLATFORMS.find((item) => item.value === platform)?.label ?? platform}
                  </span>
                ))}
              </div>
              {post.product_url && (
                <a href={post.product_url} target="_blank" rel="noreferrer" className="mt-3 block break-all text-xs text-brand-accent underline">
                  Ouvrir le lien associé
                </a>
              )}
              {post.status === "scheduled" && (
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => void sharePost(post)} className="rounded-full bg-brand-accent px-4 py-2 text-xs font-semibold text-white">
                    Partager maintenant
                  </button>
                  <button type="button" onClick={() => void cancelPost(post.id)} className="rounded-full border px-4 py-2 text-xs">
                    Annuler
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </section>
      <p className="text-xs leading-relaxed text-neutral-500">
        Important : l'enregistrement d'une date ne déclenche pas encore l'envoi automatique sur Instagram, Facebook, TikTok, Snapchat ou WhatsApp. Cette étape nécessite les autorisations officielles de chaque plateforme et un service de publication sécurisé.
      </p>
    </div>
  );
}
