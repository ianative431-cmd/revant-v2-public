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
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.768.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.437-9.884 9.893-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.438 9.884-9.891 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.89c0 2.096.547 4.142 1.588 5.946L.057 24l6.304-1.654a11.89 11.89 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.89a11.821 11.821 0 0 0-3.478-8.416Z" />
      </svg>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm font-semibold">Continuer avec WhatsApp</span>
        <span className="mt-0.5 text-[11px] font-medium text-white/90">Bientôt disponible</span>
      </span>
    </button>
  );
}
