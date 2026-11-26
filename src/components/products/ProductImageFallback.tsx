export default function ProductImageFallback() {
  return (
    <div
      role="img"
      aria-label="Visuel de remplacement Revant"
      className="absolute inset-0 isolate overflow-hidden bg-[#F46A18]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.28),transparent_38%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-16 h-56 w-56 rounded-full border-[22px] border-white/15"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -left-12 h-56 w-56 rotate-[-18deg] rounded-[44px] bg-[#142B45]"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-10 -right-5 h-28 w-28 rotate-45 rounded-[26px] border border-white/35 bg-white/10"
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-3 text-center text-white">
        <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/55 bg-[#142B45] text-4xl font-black tracking-[-0.08em] shadow-[0_12px_28px_rgba(20,43,69,0.22)]">
          R
        </span>
        <span className="mt-3 text-[10px] font-extrabold tracking-[0.32em]">
          REVANT
        </span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/85">
          Trouvailles &amp; découvertes
        </span>
      </div>
    </div>
  );
}
