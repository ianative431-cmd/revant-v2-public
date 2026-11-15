"use client";

export default function WhatsAppComingSoon() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label="Continuer avec WhatsApp — bientôt disponible"
      className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white opacity-100 shadow-sm disabled:cursor-not-allowed"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="h-6 w-6 shrink-0 fill-none stroke-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 3.2a12.1 12.1 0 0 0-10.4 18.3L4 28l6.7-1.7A12.1 12.1 0 1 0 16 3.2Z" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12.1 10.2c-.3-.7-.7-.7-1-.7h-.8c-.3 0-.8.1-1.2.6-.4.5-1.5 1.5-1.5 3.6s1.5 4.1 1.7 4.4c.2.3 2.9 4.6 7.1 6.2 3.5 1.4 4.2 1.1 5 .9.8-.1 2.5-1 2.8-2 .4-1 .4-1.8.3-2-.1-.2-.4-.3-.9-.6l-2.7-1.3c-.4-.2-.7-.2-1 .2-.3.4-1.1 1.3-1.4 1.6-.3.3-.5.3-1 .1-.5-.2-2-.7-3.8-2.3-1.4-1.2-2.3-2.7-2.6-3.2-.3-.5 0-.7.2-1 .2-.2.5-.6.7-.8.2-.3.3-.5.5-.8.1-.3.1-.6 0-.8l-1.2-2.9Z" fill="currentColor" stroke="none" transform="translate(1 -1) scale(.88)" />
      </svg>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm font-semibold">Continuer avec WhatsApp</span>
        <span className="mt-0.5 text-[11px] font-medium text-white/90">Bientôt disponible</span>
      </span>
    </button>
  );
}
