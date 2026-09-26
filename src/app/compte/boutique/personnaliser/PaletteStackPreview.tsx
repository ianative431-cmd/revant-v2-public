/**
 * Reproduit la présentation "pastilles empilées avec code hex" demandée
 * pour l'affichage des palettes prédéfinies pendant la personnalisation
 * de la boutique (section 9 du prompt maître).
 */

const PILL_HEIGHT = 88;
const PILL_STEP = 46; // décalage vertical entre deux pastilles (overlap)

function readableTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#FFFFFF";
}

export default function PaletteStackPreview({ colors }: { colors: string[] }) {
  const height = PILL_HEIGHT + (colors.length - 1) * PILL_STEP;

  return (
    <div className="relative w-full" style={{ height }}>
      {colors.map((hex, i) => (
        <div
          key={`${hex}-${i}`}
          className="absolute left-0 right-0 rounded-full flex items-center px-5"
          style={{
            top: i * PILL_STEP,
            height: PILL_HEIGHT,
            backgroundColor: hex,
            zIndex: i + 1,
          }}
        >
          <span
            className="text-xs font-mono tracking-wide"
            style={{ color: readableTextColor(hex) }}
          >
            {hex}
          </span>
        </div>
      ))}
    </div>
  );
}
