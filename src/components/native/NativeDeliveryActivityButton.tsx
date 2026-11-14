"use client";

import { useEffect, useState } from "react";

type Props =
  | {
      action: "start";
      orderReference: string;
      itemTitle: string;
      status: string;
      detail: string;
      progress: number;
    }
  | {
      action: "end";
      orderReference: string;
    };

export default function NativeDeliveryActivityButton(props: Props) {
  const [nativeAvailable, setNativeAvailable] = useState(false);

  useEffect(() => {
    setNativeAvailable(Boolean(window.RevantNative));
  }, []);

  if (!nativeAvailable) return null;

  function handleClick() {
    if (props.action === "end") {
      window.RevantNative?.endDeliveryActivity?.({ orderReference: props.orderReference });
      return;
    }
    window.RevantNative?.startDeliveryActivity?.({
      orderReference: props.orderReference,
      itemTitle: props.itemTitle,
      status: props.status,
      detail: props.detail,
      etaLabel: "Suivi de commande",
      progress: props.progress,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/5 px-4 py-2 text-xs font-semibold text-brand-accent"
    >
      {props.action === "start" ? "Suivre dans la Dynamic Island" : "Terminer le suivi"}
    </button>
  );
}
